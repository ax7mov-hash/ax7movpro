import { guardAdminRequest, jsonNoStore } from "@/lib/server/admin-security";
import { listAdminDefaultImages } from "@/lib/server/default-images";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if ("response" in guard) return guard.response;
  try {
    return jsonNoStore({ images: await listAdminDefaultImages() });
  } catch {
    return jsonNoStore({ error: "Unable to load the default images." }, 500);
  }
}
