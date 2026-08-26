import "server-only";
import { ObjectId, type WithId } from "mongodb";
import type { AdminProject, ProjectInput } from "@/lib/admin/project-schema";
import type { MediaItem } from "@/lib/media";
import { getMongoDb } from "./mongodb";

type ProjectDocument = ProjectInput & {
  createdAt: Date;
  updatedAt: Date;
  updatedBy: "admin";
};

function toAdminProject(row: WithId<ProjectDocument>): AdminProject {
  return {
    id: row._id.toHexString(),
    slug: row.slug,
    titleEn: row.titleEn,
    titleFr: row.titleFr,
    descriptionEn: row.descriptionEn,
    descriptionFr: row.descriptionFr,
    altEn: row.altEn,
    altFr: row.altFr,
    mediaType: row.mediaType,
    area: row.area,
    src: row.src,
    width: row.width,
    height: row.height,
    objectPosition: row.objectPosition,
    featured: row.featured,
    published: row.published,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMediaItem(row: WithId<ProjectDocument>): MediaItem {
  return {
    id: row.slug,
    src: row.src || undefined,
    width: row.width,
    height: row.height,
    mediaType: row.mediaType,
    title: { en: row.titleEn, fr: row.titleFr },
    description: { en: row.descriptionEn, fr: row.descriptionFr },
    alt: { en: row.altEn, fr: row.altFr },
    area: row.area,
    featured: row.featured,
    objectPosition: row.objectPosition,
  };
}

export async function listAdminProjects() {
  const db = await getMongoDb();
  const rows = await db
    .collection<ProjectDocument>("projects")
    .find({})
    .sort({ displayOrder: 1, updatedAt: -1 })
    .limit(250)
    .toArray();
  return rows.map(toAdminProject);
}

export async function listPublishedProjects() {
  const db = await getMongoDb();
  const rows = await db
    .collection<ProjectDocument>("projects")
    .find({ published: true })
    .sort({ displayOrder: 1, updatedAt: -1 })
    .limit(250)
    .toArray();
  return rows.map(toMediaItem);
}

export async function createProject(input: ProjectInput) {
  const db = await getMongoDb();
  const now = new Date();
  const result = await db.collection<ProjectDocument>("projects").insertOne({
    ...input,
    src: input.src || undefined,
    createdAt: now,
    updatedAt: now,
    updatedBy: "admin",
  });
  const row = await db
    .collection<ProjectDocument>("projects")
    .findOne({ _id: result.insertedId });
  if (!row) throw new Error("CREATE_FAILED");
  return toAdminProject(row);
}

export async function updateProject(id: string, input: ProjectInput) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const result = await db
    .collection<ProjectDocument>("projects")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...input,
          src: input.src || undefined,
          updatedAt: new Date(),
          updatedBy: "admin",
        },
      },
      { returnDocument: "after" },
    );
  return result ? toAdminProject(result) : null;
}

export async function deleteProject(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const result = await db
    .collection<ProjectDocument>("projects")
    .findOneAndDelete({ _id: new ObjectId(id) });
  return result ? toAdminProject(result) : null;
}
