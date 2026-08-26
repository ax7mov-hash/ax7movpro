import { revalidatePath } from "next/cache";
import { reviewInputSchema } from "@/lib/admin/review-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import { createReview, listAdminReviews } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if ("response" in guard) return guard.response;
  try {
    return jsonNoStore({ reviews: await listAdminReviews() });
  } catch {
    return jsonNoStore({ error: "Unable to load reviews." }, 500);
  }
}

export async function POST(request: Request) {
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
    const review = await createReview(input.data);
    await writeAuditEvent(request, "review.create", review.id, {
      author: review.author,
    });
    revalidatePath("/en");
    revalidatePath("/fr");
    return jsonNoStore({ review }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to create review." }, 500);
  }
}
