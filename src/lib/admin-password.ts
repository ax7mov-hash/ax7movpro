const passwordKdfIterations = 600_000;
const passwordProofBytes = 32;

export const passwordProofPattern = /^[A-Za-z0-9_-]{43}$/;

function passwordSalt(email: string) {
  return `ax7mov-admin-password-v1\0${email.trim().toLowerCase()}`;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

/**
 * Derives the password proof sent to the server. The plaintext password never
 * leaves the browser, but HTTPS remains mandatory because this proof is a
 * password-equivalent credential.
 */
export async function createPasswordProof(email: string, password: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: passwordKdfIterations,
      salt: encoder.encode(passwordSalt(email)),
    },
    key,
    passwordProofBytes * 8,
  );
  return toBase64Url(new Uint8Array(bits));
}

export const passwordProofConfig = {
  bytes: passwordProofBytes,
  iterations: passwordKdfIterations,
  saltForEmail: passwordSalt,
} as const;
