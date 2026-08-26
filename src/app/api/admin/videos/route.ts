import { revalidatePath } from "next/cache";
import { videoInputSchema } from "@/lib/admin/video-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import { createVideo, listAdminVideos } from "@/lib/server/videos";

export const dynamic = "force-dynamic";

function revalidateVideoPages() {
  revalidatePath("/en");
  revalidatePath("/fr");
  revalidatePath("/en/gallery");
  revalidatePath("/fr/gallery");
}

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if ("response" in guard) return guard.response;
  try {
    return jsonNoStore({ videos: await listAdminVideos() });
  } catch {
    return jsonNoStore({ error: "Unable to load videos." }, 500);
  }
}

export async function POST(request: Request) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const input = videoInputSchema.safeParse(await parseJsonBody(request));
    if (!input.success) {
      return jsonNoStore(
        {
          error: "Please correct the video fields.",
          issues: input.error.flatten(),
        },
        400,
      );
    }
    const video = await createVideo(input.data);
    await writeAuditEvent(request, "video.create", video.id, {
      provider: video.provider,
      linkUrl: video.linkUrl,
    });
    revalidateVideoPages();
    return jsonNoStore({ video }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to create video." }, 500);
  }
}
