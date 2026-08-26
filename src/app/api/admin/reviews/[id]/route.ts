import { revalidatePath } from "next/cache";
import { reviewInputSchema } from "@/lib/admin/review-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import { deleteReview, updateReview } from "@/lib/server/reviews";

function revalidateHomePages() {
  revalidatePath("/en");
  revalidatePath("/fr");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const input = reviewInputSchema.safeParse(await parseJsonBody(request));
    if (!input.success) {
      return jsonNoStore(
        {
          error: "Please correct the review fields.",
          issues: input.error.flatten(),
        },
        400,
      );
    }
    const { id } = await context.params;
    const review = await updateReview(id, input.data);
    if (!review) return jsonNoStore({ error: "Review not found." }, 404);
    await writeAuditEvent(request, "review.update", review.id, {
      author: review.author,
    });
    revalidateHomePages();
    return jsonNoStore({ review });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to update review." }, 500);
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
    const review = await deleteReview(id);
    if (!review) return jsonNoStore({ error: "Review not found." }, 404);
    await writeAuditEvent(request, "review.delete", review.id, {
      author: review.author,
    });
    revalidateHomePages();
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Unable to delete review." }, 500);
  }
}
