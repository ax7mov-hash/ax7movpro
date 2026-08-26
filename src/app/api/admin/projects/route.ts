import { revalidatePath } from "next/cache";
import { MongoServerError } from "mongodb";
import { projectInputSchema } from "@/lib/admin/project-schema";
import {
  guardAdminRequest,
  jsonNoStore,
  parseJsonBody,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import { createProject, listAdminProjects } from "@/lib/server/projects";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if ("response" in guard) return guard.response;
  try {
    return jsonNoStore({ projects: await listAdminProjects() });
  } catch {
    return jsonNoStore({ error: "Unable to load projects." }, 500);
  }
}

export async function POST(request: Request) {
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
    const project = await createProject(input.data);
    await writeAuditEvent(request, "project.create", project.id, {
      slug: project.slug,
    });
    revalidatePath("/en");
    revalidatePath("/fr");
    revalidatePath("/en/gallery");
    revalidatePath("/fr/gallery");
    return jsonNoStore({ project }, 201);
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
    return jsonNoStore({ error: "Unable to create project." }, 500);
  }
}
