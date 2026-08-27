import { getAdminSession } from "@/lib/server/admin-auth";
import { isAdminConfigured } from "@/lib/server/env";
import { jsonNoStore } from "@/lib/server/admin-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  return jsonNoStore({
    authenticated: Boolean(session),
    configured: isAdminConfigured(),
    email: session?.email,
    passwordChangeRequired: session?.mustChangePassword ?? false,
  });
}
