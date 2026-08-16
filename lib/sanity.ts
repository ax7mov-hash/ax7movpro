import { projects as fallbackProjects, type Project } from "./content";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-01";

export async function getProjects(): Promise<Project[]> {
  if (!projectId) return fallbackProjects;
  const query = encodeURIComponent(`*[_type == "project" && published == true] | order(displayOrder asc)`);
  try {
    const response = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`, { next: { revalidate: 60 } });
    if (!response.ok) return fallbackProjects;
    const data = (await response.json()) as { result?: Project[] };
    return data.result?.length ? data.result : fallbackProjects;
  } catch {
    return fallbackProjects;
  }
}

export const sanityStudioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "https://www.sanity.io/manage";
