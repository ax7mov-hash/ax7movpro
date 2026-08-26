import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { MongoServerError } from "mongodb";
import { projectInputSchema } from "@/lib/admin/project-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import { deleteProject, updateProject } from "@/lib/server/projects";

function isManagedBlob(url?: string) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function revalidatePublicPages() {
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
    const input = projectInputSchema.safeParse(await parseJsonBody(request));
    if (!input.success) {
      return jsonNoStore(
        {
          error: "Please correct the project fields.",
          issues: input.error.flatten(),
        },
        400,
      );
    }
    const { id } = await context.params;
    const project = await updateProject(id, input.data);
    if (!project) return jsonNoStore({ error: "Project not found." }, 404);
    await writeAuditEvent(request, "project.update", project.id, {
      slug: project.slug,
    });
    revalidatePublicPages();
    return jsonNoStore({ project });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return jsonNoStore(
        { error: "That project slug is already in use." },
        409,
      );
    }
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonNoStore({ error: "Request is too large." }, 413);
    }
    return jsonNoStore({ error: "Unable to update project." }, 500);
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
    const project = await deleteProject(id);
    if (!project) return jsonNoStore({ error: "Project not found." }, 404);
    if (isManagedBlob(project.src)) {
      await del(project.src!);
    }
    await writeAuditEvent(request, "project.delete", project.id, {
      slug: project.slug,
    });
    revalidatePublicPages();
    return jsonNoStore({ ok: true });
  } catch {
    return jsonNoStore({ error: "Unable to delete project." }, 500);
  }
}
