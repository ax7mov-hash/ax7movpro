import "server-only";
import {
  createHash,
  pbkdf2Sync,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  passwordProofConfig,
  passwordProofPattern,
} from "@/lib/admin-password";
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
  userKey: "primary";
  subject: "admin";
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  ipHash: string;
  userAgentHash: string;
};

type AdminUserDocument = {
  key: "primary";
  email: string;
  role: "admin";
  passwordHash: string;
  mustChangePassword: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
};

export type AdminSession = {
  sessionId: string;
  userKey: "primary";
  subject: "admin";
  email: string;
  mustChangePassword: boolean;
  ipHash: string;
  userAgentHash: string;
};

type AdminIdentity = Pick<
  AdminUserDocument,
  "key" | "email" | "mustChangePassword"
>;

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function secretKey() {
  return new TextEncoder().encode(getAdminConfig().jwtSecret);
}

function derivePasswordProof(email: string, password: string) {
  return pbkdf2Sync(
    password,
    passwordProofConfig.saltForEmail(email),
    passwordProofConfig.iterations,
    passwordProofConfig.bytes,
    "sha256",
  ).toString("base64url");
}

async function createAdminUserFromBootstrap(
  email: string,
  passwordProof: string,
) {
  const config = getAdminConfig();
  const emailMatches = timingSafeEqual(
    digest(email.trim().toLowerCase()),
    digest(config.email),
  );
  const temporaryProof = derivePasswordProof(
    config.email,
    config.temporaryPassword,
  );
  const proofMatches =
    passwordProofPattern.test(passwordProof) &&
    timingSafeEqual(Buffer.from(passwordProof), Buffer.from(temporaryProof));
  if (!emailMatches || !proofMatches) return null;

  const db = await getMongoDb();
  const users = db.collection<AdminUserDocument>("adminUsers");
  const now = new Date();
  const passwordHash = await hash(passwordProof, 12);
  await users.updateOne(
    { key: "primary" },
    {
      $setOnInsert: {
        key: "primary",
        email: config.email,
        role: "admin",
        passwordHash,
        mustChangePassword: true,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  const created = await users.findOne({ key: "primary" });
  if (!created) throw new Error("Unable to initialize the admin account.");
  return created;
}

export async function verifyAdminCredentials(
  email: string,
  passwordProof: string,
): Promise<AdminIdentity | null> {
  const db = await getMongoDb();
  const users = db.collection<AdminUserDocument>("adminUsers");
  const user =
    (await users.findOne({ key: "primary", role: "admin" })) ||
    (await createAdminUserFromBootstrap(email, passwordProof));
  if (!user) return null;
  const emailMatches = timingSafeEqual(
    digest(email.trim().toLowerCase()),
    digest(user.email),
  );
  const passwordMatches = await compare(
    passwordProofPattern.test(passwordProof) ? passwordProof : "invalid-proof",
    user.passwordHash,
  );
  if (!user.active || !emailMatches || !passwordMatches) return null;

  await users.updateOne(
    { key: user.key },
    { $set: { lastLoginAt: new Date() } },
  );
  return {
    key: user.key,
    email: user.email,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function verifyCurrentAdminPassword(passwordProof: string) {
  const db = await getMongoDb();
  const user = await db
    .collection<AdminUserDocument>("adminUsers")
    .findOne({ key: "primary", role: "admin", active: true });
  return Boolean(
    user &&
    passwordProofPattern.test(passwordProof) &&
    (await compare(passwordProof, user.passwordHash)),
  );
}

export async function changeAdminPassword(
  newPasswordProof: string,
  currentSessionId: string,
) {
  const db = await getMongoDb();
  const passwordHash = await hash(newPasswordProof, 12);
  const now = new Date();
  const updatedUser = await db
    .collection<AdminUserDocument>("adminUsers")
    .updateOne(
      { key: "primary", role: "admin", active: true },
      {
        $set: {
          passwordHash,
          mustChangePassword: false,
          passwordChangedAt: now,
          updatedAt: now,
        },
      },
    );
  if (updatedUser.matchedCount !== 1) {
    throw new Error("Admin account not found.");
  }
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

export async function createAdminSession(
  user: AdminIdentity,
  ipHash: string,
  userAgent: string,
) {
  const config = getAdminConfig();
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60 * 1000);
  const db = await getMongoDb();
  await db.collection<SessionDocument>("adminSessions").insertOne({
    sessionId,
    userKey: user.key,
    subject: "admin",
    createdAt: new Date(),
    expiresAt,
    ipHash,
    userAgentHash: digest(userAgent.slice(0, 300)).toString("hex"),
  });

  const token = await new SignJWT({ role: "admin", uid: user.key })
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
  return {
    sessionId,
    expiresAt,
    email: user.email,
    mustChangePassword: user.mustChangePassword,
  };
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
      requiredClaims: ["exp", "iat", "iss", "aud", "sub", "jti", "uid"],
    });
    if (
      protectedHeader.typ !== "JWT" ||
      payload.sub !== "admin" ||
      payload.role !== "admin" ||
      payload.uid !== "primary" ||
      !payload.jti
    )
      return null;

    const db = await getMongoDb();
    const activeSession = await db
      .collection<SessionDocument>("adminSessions")
      .findOne({
        sessionId: payload.jti,
        userKey: payload.uid,
        subject: "admin",
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      });
    if (!activeSession) return null;
    const user = await db
      .collection<AdminUserDocument>("adminUsers")
      .findOne({
        key: activeSession.userKey,
        role: "admin",
        active: true,
      });
    return user
      ? {
          sessionId: activeSession.sessionId,
          userKey: activeSession.userKey,
          subject: "admin",
          email: user.email,
          mustChangePassword: user.mustChangePassword,
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
