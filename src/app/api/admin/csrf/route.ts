import { issueCsrfToken, jsonNoStore } from "@/lib/server/admin-security";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonNoStore({ csrfToken: await issueCsrfToken() });
}
