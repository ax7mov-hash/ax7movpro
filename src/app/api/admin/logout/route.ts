import { getAdminSession, revokeAdminSession } from "@/lib/server/admin-auth";
import {
  jsonNoStore,
  validateMutationRequest,
  writeAuditEvent,
} from "@/lib/server/admin-security";

export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonNoStore({ error: "Invalid request." }, 403);
  }
  const session = await getAdminSession();
  if (session) {
    await writeAuditEvent(request, "admin.logout", session.sessionId);
  }
  await revokeAdminSession(session?.sessionId);
  return jsonNoStore({ ok: true });
}
