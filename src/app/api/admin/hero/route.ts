import { revalidatePath } from "next/cache";
import { heroInputSchema } from "@/lib/admin/hero-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import {
  clearHeroSettings,
  getAdminHeroSettings,
  updateHeroSettings,
} from "@/lib/server/hero-settings";

export const dynamic = "force-dynamic";

function revalidateHomePages() {
  revalidatePath("/en");
  revalidatePath("/fr");
}

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if ("response" in guard) return guard.response;
  try {
    return jsonNoStore({ hero: await getAdminHeroSettings() });
  } catch {
    return jsonNoStore({ error: "Unable to load the hero image." }, 500);
  }
}

export async function PUT(request: Request) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const input = heroInputSchema.safeParse(await parseJsonBody(request));
    if (!input.success) {
      return jsonNoStore(
        {
          error: "Please correct the hero image fields.",
          issues: input.error.flatten(),
        },
        400,
      );
    }
    const hero = await updateHeroSettings(input.data);
    await writeAuditEvent(request, "hero.update", "hero", {
      width: hero.width,
      height: hero.height,
    });
    revalidateHomePages();
    return jsonNoStore({ hero });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to update the hero image." }, 500);
  }
}

export async function DELETE(request: Request) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const previous = await clearHeroSettings();
    await writeAuditEvent(request, "hero.restore_fallback", "hero", {
      hadManagedImage: Boolean(previous),
    });
    revalidateHomePages();
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Unable to restore the fallback image." }, 500);
  }
}
