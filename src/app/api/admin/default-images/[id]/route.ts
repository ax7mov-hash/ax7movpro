import { revalidatePath } from "next/cache";
import { defaultImageInputSchema } from "@/lib/admin/default-image-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import {
  clearDefaultImage,
  updateDefaultImage,
} from "@/lib/server/default-images";

function revalidatePublicPages() {
  revalidatePath("/en");
  revalidatePath("/fr");
  revalidatePath("/en/gallery");
  revalidatePath("/fr/gallery");
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const input = defaultImageInputSchema.safeParse(
      await parseJsonBody(request),
    );
    if (!input.success) {
      return jsonNoStore(
        {
          error: "Please correct the image fields.",
          issues: input.error.flatten(),
        },
        400,
      );
    }
    const { id } = await context.params;
    const image = await updateDefaultImage(id, input.data);
    if (!image) return jsonNoStore({ error: "Default image not found." }, 404);
    await writeAuditEvent(request, "default_image.update", id, {
      width: image.width,
      height: image.height,
    });
    revalidatePublicPages();
    return jsonNoStore({ image });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to update the image." }, 500);
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
    const image = await clearDefaultImage(id);
    if (!image) return jsonNoStore({ error: "Default image not found." }, 404);
    await writeAuditEvent(request, "default_image.restore_fallback", id);
    revalidatePublicPages();
    return jsonNoStore({ image });
  } catch {
    return jsonNoStore({ error: "Unable to restore the default image." }, 500);
  }
}
