import { revalidatePath } from "next/cache";
import { videoInputSchema } from "@/lib/admin/video-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import { deleteVideo, updateVideo } from "@/lib/server/videos";

function revalidateVideoPages() {
  revalidatePath("/en");
  revalidatePath("/fr");
  revalidatePath("/en/gallery");
  revalidatePath("/fr/gallery");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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
    const { id } = await context.params;
    const video = await updateVideo(id, input.data);
    if (!video) return jsonNoStore({ error: "Video not found." }, 404);
    await writeAuditEvent(request, "video.update", video.id, {
      provider: video.provider,
      linkUrl: video.linkUrl,
    });
    revalidateVideoPages();
    return jsonNoStore({ video });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to update video." }, 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const { id } = await context.params;
    const video = await deleteVideo(id);
    if (!video) return jsonNoStore({ error: "Video not found." }, 404);
    await writeAuditEvent(request, "video.delete", video.id, {
      provider: video.provider,
      linkUrl: video.linkUrl,
    });
    revalidateVideoPages();
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Unable to delete video." }, 500);
  }
}
