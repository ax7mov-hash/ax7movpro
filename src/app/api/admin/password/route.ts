import { z } from "zod";
import { passwordProofPattern } from "@/lib/admin-password";
import {
  changeAdminPassword,
  verifyCurrentAdminPassword,
} from "@/lib/server/admin-auth";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";

const passwordSchema = z
  .object({
    currentPasswordProof: z.string().regex(passwordProofPattern),
    newPasswordProof: z.string().regex(passwordProofPattern),
  })
  .refine((value) => value.currentPasswordProof !== value.newPasswordProof, {
    path: ["newPasswordProof"],
    message: "Choose a password you have not just used.",
  });

export async function POST(request: Request) {
  const guard = await guardAdminRequest(request, true, true);
  if ("response" in guard) return guard.response;
  try {
    const input = passwordSchema.safeParse(
      await parseJsonBody(request, 10_000),
    );
    if (!input.success) {
      const firstIssue = input.error.issues[0]?.message;
      return jsonNoStore(
        { error: firstIssue || "Please check the password fields." },
        400,
      );
    }
    const currentPasswordValid = await verifyCurrentAdminPassword(
      input.data.currentPasswordProof,
    );
    if (!currentPasswordValid) {
      return jsonNoStore({ error: "The current password is incorrect." }, 401);
    }
    const result = await changeAdminPassword(
      input.data.newPasswordProof,
      guard.session.sessionId,
    );
    await writeAuditEvent(
      request,
      "admin.password_change",
      guard.session.sessionId,
      {
        revokedSessions: result.revokedSessions,
      },
    );
    return jsonNoStore({ ok: true, revokedSessions: result.revokedSessions });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to change the password." }, 500);
  }
}
