import { revalidatePath } from "next/cache";
import { aboutInputSchema } from "@/lib/admin/about-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import {
  clearAboutSettings,
  getAdminAboutSettings,
  getFallbackAbout,
  updateAboutSettings,
} from "@/lib/server/about-settings";

export const dynamic = "force-dynamic";

function revalidateAboutPages() {
  revalidatePath("/en");
  revalidatePath("/fr");
  revalidatePath("/en/about");
  revalidatePath("/fr/about");
}

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if ("response" in guard) return guard.response;
  try {
    return jsonNoStore({
      about: await getAdminAboutSettings(),
      fallback: getFallbackAbout(),
    });
  } catch {
    return jsonNoStore({ error: "Unable to load the About content." }, 500);
  }
}

export async function PUT(request: Request) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const input = aboutInputSchema.safeParse(await parseJsonBody(request));
    if (!input.success) {
      return jsonNoStore(
        {
          error: "Please correct the About fields.",
          issues: input.error.flatten(),
        },
        400,
      );
    }
    const about = await updateAboutSettings(input.data);
    await writeAuditEvent(request, "about.update", "about", {
      portraitImage: Boolean(about.images.portrait.src),
      approachImage: Boolean(about.images.approach.src),
    });
    revalidateAboutPages();
    return jsonNoStore({ about });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to update the About content." }, 500);
  }
}

export async function DELETE(request: Request) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  try {
    const previous = await clearAboutSettings();
    await writeAuditEvent(request, "about.restore_fallback", "about", {
      hadManagedContent: Boolean(previous),
    });
    revalidateAboutPages();
    return jsonNoStore({ ok: true, fallback: getFallbackAbout() });
  } catch {
    return jsonNoStore({ error: "Unable to restore the About defaults." }, 500);
  }
}
