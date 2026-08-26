import { z } from "zod";
import {
  changeAdminPassword,
  verifyAdminCredentials,
} from "@/lib/server/admin-auth";
import { getAdminConfig } from "@/lib/server/env";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(12).max(200),
    newPassword: z
      .string()
      .min(12)
      .max(128)
      .regex(/[a-z]/, "Add a lowercase letter.")
      .regex(/[A-Z]/, "Add an uppercase letter.")
      .regex(/[0-9]/, "Add a number.")
      .regex(/[^A-Za-z0-9]/, "Add a symbol."),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "The new passwords do not match.",
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "Choose a password you have not just used.",
  });

export async function POST(request: Request) {
  const guard = await guardAdminRequest(request, true);
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
    const currentPasswordValid = await verifyAdminCredentials(
      getAdminConfig().email,
      input.data.currentPassword,
    );
    if (!currentPasswordValid) {
      return jsonNoStore({ error: "The current password is incorrect." }, 401);
    }
    const result = await changeAdminPassword(
      input.data.newPassword,
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
