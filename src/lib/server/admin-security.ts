import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { csrfCookieName, getAdminSession } from "./admin-auth";
import { getSiteOrigin, usesSecureCookies } from "./env";
import { getMongoDb } from "./mongodb";

const loginWindowMs = 15 * 60 * 1000;
const maximumLoginAttempts = 5;

type LoginAttempt = {
  key: string;
  count: number;
  windowStartedAt: Date;
  blockedUntil?: Date;
  expiresAt: Date;
};

export function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim();
}

export function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getHeaderOrigin(request: Request, headerName: string) {
  const host = request.headers.get(headerName)?.split(",", 1)[0]?.trim();
  if (!host) return undefined;
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim();
  const protocol = forwardedProtocol
    ? `${forwardedProtocol}:`
    : new URL(request.url).protocol;
  if (protocol !== "http:" && protocol !== "https:") return undefined;
  try {
    return new URL(`${protocol}//${host}`).origin;
  } catch {
    return undefined;
  }
}

export async function issueCsrfToken() {
  const token = randomBytes(32).toString("base64url");
  (await cookies()).set(csrfCookieName, token, {
    httpOnly: false,
    secure: usesSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
    priority: "high",
  });
  return token;
}

export async function validateMutationRequest(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || (fetchSite && !["same-origin", "none"].includes(fetchSite))) {
    return false;
  }
  const allowedOrigins = new Set([new URL(request.url).origin]);
  const configuredOrigin = getSiteOrigin();
  if (configuredOrigin) allowedOrigins.add(configuredOrigin);
  const forwardedOrigin = getHeaderOrigin(request, "x-forwarded-host");
  if (forwardedOrigin) allowedOrigins.add(forwardedOrigin);
  const hostOrigin = getHeaderOrigin(request, "host");
  if (hostOrigin) allowedOrigins.add(hostOrigin);
  try {
    if (!allowedOrigins.has(new URL(origin).origin)) return false;
  } catch {
    return false;
  }

  const cookieToken = (await cookies()).get(csrfCookieName)?.value || "";
  const headerToken = request.headers.get("x-csrf-token") || "";
  return Boolean(
    cookieToken && headerToken && safeEqual(cookieToken, headerToken),
  );
}

export async function parseJsonBody(request: Request, maxBytes = 32_000) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes)
    throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(text) as unknown;
}

function attemptKey(email: string, ip: string) {
  return hashIdentifier(`${email.trim().toLowerCase()}|${ip}`);
}

export async function isLoginAllowed(email: string, ip: string) {
  const db = await getMongoDb();
  const attempt = await db
    .collection<LoginAttempt>("loginAttempts")
    .findOne({ key: attemptKey(email, ip) });
  if (!attempt) return true;
  if (attempt.blockedUntil && attempt.blockedUntil > new Date()) return false;
  if (Date.now() - attempt.windowStartedAt.getTime() > loginWindowMs)
    return true;
  return attempt.count < maximumLoginAttempts;
}

export async function recordLoginFailure(email: string, ip: string) {
  const db = await getMongoDb();
  const key = attemptKey(email, ip);
  const now = new Date();
  const existing = await db
    .collection<LoginAttempt>("loginAttempts")
    .findOne({ key });
  if (
    !existing ||
    now.getTime() - existing.windowStartedAt.getTime() > loginWindowMs
  ) {
    await db.collection<LoginAttempt>("loginAttempts").replaceOne(
      { key },
      {
        key,
        count: 1,
        windowStartedAt: now,
        expiresAt: new Date(now.getTime() + loginWindowMs * 2),
      },
      { upsert: true },
    );
    return;
  }
  const nextCount = existing.count + 1;
  await db.collection<LoginAttempt>("loginAttempts").updateOne(
    { key },
    {
      $set: {
        count: nextCount,
        expiresAt: new Date(now.getTime() + loginWindowMs * 2),
        ...(nextCount >= maximumLoginAttempts
          ? { blockedUntil: new Date(now.getTime() + loginWindowMs) }
          : {}),
      },
    },
  );
}

export async function clearLoginFailures(email: string, ip: string) {
  const db = await getMongoDb();
  await db
    .collection("loginAttempts")
    .deleteOne({ key: attemptKey(email, ip) });
}

export async function writeAuditEvent(
  request: Request,
  action: string,
  target?: string,
  metadata?: Record<string, string | number | boolean>,
) {
  const db = await getMongoDb();
  await db.collection("auditEvents").insertOne({
    actor: "admin",
    action,
    target,
    metadata,
    ipHash: hashIdentifier(getClientIp(request)),
    userAgent: (request.headers.get("user-agent") || "unknown").slice(0, 300),
    createdAt: new Date(),
  });
}

export async function guardAdminRequest(
  request: Request,
  mutation = false,
  allowPasswordChangeRequired = false,
) {
  if (mutation && !(await validateMutationRequest(request))) {
    return { response: jsonNoStore({ error: "Invalid request." }, 403) };
  }
  const session = await getAdminSession();
  if (!session) {
    return {
      response: jsonNoStore({ error: "Authentication required." }, 401),
    };
  }
  const currentIpHash = hashIdentifier(getClientIp(request));
  const currentUserAgentHash = hashIdentifier(
    (request.headers.get("user-agent") || "unknown").slice(0, 300),
  );
  if (
    !safeEqual(session.ipHash, currentIpHash) ||
    !safeEqual(session.userAgentHash, currentUserAgentHash)
  ) {
    return {
      response: jsonNoStore({ error: "Authentication required." }, 401),
    };
  }
  if (session.mustChangePassword && !allowPasswordChangeRequired) {
    return {
      response: jsonNoStore(
        {
          error: "Change the temporary password before continuing.",
          code: "PASSWORD_CHANGE_REQUIRED",
        },
        403,
      ),
    };
  }
  return { session };
}
