import { z } from "zod";
import {
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/server/admin-auth";
import { isAdminConfigured } from "@/lib/server/env";
import {
  clearLoginFailures,
  getClientIp,
  hashIdentifier,
  isLoginAllowed,
  jsonNoStore,
  parseJsonBody,
  recordLoginFailure,
  validateMutationRequest,
  writeAuditEvent,
} from "@/lib/server/admin-security";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
});

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return jsonNoStore({ error: "Admin access is not configured." }, 503);
  }
  if (!(await validateMutationRequest(request))) {
    return jsonNoStore({ error: "Invalid request." }, 403);
  }
  try {
    const input = loginSchema.safeParse(await parseJsonBody(request, 10_000));
    if (!input.success) {
      return jsonNoStore({ error: "Invalid email or password." }, 400);
    }
    const ip = getClientIp(request);
    if (!(await isLoginAllowed(input.data.email, ip))) {
      return jsonNoStore(
        { error: "Too many attempts. Try again in 15 minutes." },
        429,
      );
    }
    const valid = await verifyAdminCredentials(
      input.data.email,
      input.data.password,
    );
    if (!valid) {
      await recordLoginFailure(input.data.email, ip);
      return jsonNoStore({ error: "Invalid email or password." }, 401);
    }
    await clearLoginFailures(input.data.email, ip);
    const session = await createAdminSession(
      hashIdentifier(ip),
      request.headers.get("user-agent") || "unknown",
    );
    await writeAuditEvent(request, "admin.login", session.sessionId);
    return jsonNoStore({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to sign in." }, 500);
  }
}
