import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getAdminConfig, isAdminConfigured, usesSecureCookies } from "./env";
import { getMongoDb } from "./mongodb";

const issuer = "ax7mov-admin";
const audience = "ax7mov-admin-panel";

const secureCookies = usesSecureCookies();

export const sessionCookieName = secureCookies
  ? "__Host-ax7-admin"
  : "ax7-admin";
export const csrfCookieName = secureCookies ? "__Host-ax7-csrf" : "ax7-csrf";

type SessionDocument = {
  sessionId: string;
  subject: "admin";
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  ipHash: string;
  userAgentHash: string;
};

type AdminCredentialDocument = {
  key: "primary";
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: "admin";
};

export type AdminSession = {
  sessionId: string;
  subject: "admin";
  ipHash: string;
  userAgentHash: string;
};

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function secretKey() {
  return new TextEncoder().encode(getAdminConfig().jwtSecret);
}

export async function verifyAdminCredentials(email: string, password: string) {
  const config = getAdminConfig();
  const emailMatches = timingSafeEqual(
    digest(email.trim().toLowerCase()),
    digest(config.email),
  );
  const db = await getMongoDb();
  const storedCredentials = await db
    .collection<AdminCredentialDocument>("adminCredentials")
    .findOne({ key: "primary" });
  const passwordMatches = await compare(
    password,
    storedCredentials?.passwordHash || config.passwordHash,
  );
  return emailMatches && passwordMatches;
}

export async function changeAdminPassword(
  newPassword: string,
  currentSessionId: string,
) {
  const db = await getMongoDb();
  const passwordHash = await hash(newPassword, 12);
  const now = new Date();
  await db.collection<AdminCredentialDocument>("adminCredentials").updateOne(
    { key: "primary" },
    {
      $set: { passwordHash, updatedAt: now, updatedBy: "admin" },
      $setOnInsert: { key: "primary", createdAt: now },
    },
    { upsert: true },
  );
  const revoked = await db
    .collection<SessionDocument>("adminSessions")
    .updateMany(
      {
        sessionId: { $ne: currentSessionId },
        revokedAt: { $exists: false },
        expiresAt: { $gt: now },
      },
      { $set: { revokedAt: now } },
    );
  return { revokedSessions: revoked.modifiedCount };
}

export async function createAdminSession(ipHash: string, userAgent: string) {
  const config = getAdminConfig();
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60 * 1000);
  const db = await getMongoDb();
  await db.collection<SessionDocument>("adminSessions").insertOne({
    sessionId,
    subject: "admin",
    createdAt: new Date(),
    expiresAt,
    ipHash,
    userAgentHash: digest(userAgent.slice(0, 300)).toString("hex"),
  });

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject("admin")
    .setJti(sessionId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
  return { sessionId, expiresAt };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isAdminConfigured()) return null;
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  try {
    const { payload, protectedHeader } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer,
      audience,
      requiredClaims: ["exp", "iat", "iss", "aud", "sub", "jti"],
    });
    if (
      protectedHeader.typ !== "JWT" ||
      payload.sub !== "admin" ||
      payload.role !== "admin" ||
      !payload.jti
    )
      return null;

    const db = await getMongoDb();
    const activeSession = await db
      .collection<SessionDocument>("adminSessions")
      .findOne({
        sessionId: payload.jti,
        subject: "admin",
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      });
    return activeSession
      ? {
          sessionId: activeSession.sessionId,
          subject: "admin",
          ipHash: activeSession.ipHash,
          userAgentHash: activeSession.userAgentHash,
        }
      : null;
  } catch {
    return null;
  }
}

export async function revokeAdminSession(sessionId?: string) {
  if (sessionId) {
    const db = await getMongoDb();
    await db
      .collection<SessionDocument>("adminSessions")
      .updateOne({ sessionId }, { $set: { revokedAt: new Date() } });
  }
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}
