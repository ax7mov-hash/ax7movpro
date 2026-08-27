import "server-only";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_DB_NAME);
}

export function isBlobConfigured() {
  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const hasLegacyToken = Boolean(readWriteToken?.startsWith("vercel_blob_rw_"));
  const hasOidcConnection = Boolean(
    process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID,
  );
  return hasLegacyToken || hasOidcConnection;
}

export function isAdminConfigured() {
  return Boolean(
    isMongoConfigured() &&
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_TEMP_PASSWORD &&
    process.env.JWT_SECRET &&
    process.env.SITE_ORIGIN,
  );
}

export function getMongoConfig() {
  const uri = required("MONGODB_URI");
  if (!uri.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGODB_URI must use a TLS-enabled MongoDB Atlas SRV URL.",
    );
  }
  return { uri, dbName: required("MONGODB_DB_NAME") };
}

export function getAdminConfig() {
  const jwtSecret = required("JWT_SECRET");
  if (Buffer.byteLength(jwtSecret, "utf8") < 64) {
    throw new Error("JWT_SECRET must contain at least 64 bytes.");
  }
  return {
    email: required("ADMIN_EMAIL").toLowerCase(),
    temporaryPassword: required("ADMIN_TEMP_PASSWORD"),
    jwtSecret,
    sessionHours: Math.min(
      Math.max(Number(process.env.ADMIN_SESSION_HOURS || 8), 1),
      24,
    ),
  };
}

export function getSiteOrigin() {
  const configured = process.env.SITE_ORIGIN?.trim();
  if (!configured) return undefined;
  const url = new URL(configured);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("SITE_ORIGIN must use HTTPS outside local development.");
  }
  return url.origin;
}

export function usesSecureCookies() {
  return getSiteOrigin()?.startsWith("https://") ?? false;
}
