import "server-only";
import { ObjectId, type WithId } from "mongodb";
import type {
  AdminVideo,
  PublicVideo,
  VideoInput,
} from "@/lib/admin/video-schema";
import { getVideoProvider } from "@/lib/video-links";
import { getMongoDb } from "./mongodb";

type VideoDocument = VideoInput & {
  createdAt: Date;
  updatedAt: Date;
  updatedBy: "admin";
};

function toAdminVideo(row: WithId<VideoDocument>): AdminVideo {
  const provider = getVideoProvider(row.linkUrl);
  if (!provider) throw new Error("INVALID_VIDEO_LINK");
  return {
    id: row._id.toHexString(),
    titleEn: row.titleEn,
    titleFr: row.titleFr,
    descriptionEn: row.descriptionEn,
    descriptionFr: row.descriptionFr,
    altEn: row.altEn,
    altFr: row.altFr,
    linkUrl: row.linkUrl,
    thumbnailSrc: row.thumbnailSrc,
    thumbnailWidth: row.thumbnailWidth,
    thumbnailHeight: row.thumbnailHeight,
    format: row.format,
    showOnHome: row.showOnHome,
    showInGallery: row.showInGallery,
    autoplay: row.autoplay,
    loop: row.loop,
    published: row.published,
    displayOrder: row.displayOrder,
    provider,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublicVideo(row: WithId<VideoDocument>): PublicVideo {
  const video = toAdminVideo(row);
  return {
    id: video.id,
    titleEn: video.titleEn,
    titleFr: video.titleFr,
    descriptionEn: video.descriptionEn,
    descriptionFr: video.descriptionFr,
    altEn: video.altEn,
    altFr: video.altFr,
    linkUrl: video.linkUrl,
    thumbnailSrc: video.thumbnailSrc,
    thumbnailWidth: video.thumbnailWidth,
    thumbnailHeight: video.thumbnailHeight,
    format: video.format,
    showOnHome: video.showOnHome,
    showInGallery: video.showInGallery,
    autoplay: video.autoplay,
    loop: video.loop,
    displayOrder: video.displayOrder,
    provider: video.provider,
  };
}

export async function listAdminVideos() {
  const db = await getMongoDb();
  const rows = await db
    .collection<VideoDocument>("videos")
    .find({})
    .sort({ displayOrder: 1, updatedAt: -1 })
    .limit(200)
    .toArray();
  return rows.map(toAdminVideo);
}

export async function listPublishedVideos(surface: "home" | "gallery") {
  const db = await getMongoDb();
  const surfaceField = surface === "home" ? "showOnHome" : "showInGallery";
  const rows = await db
    .collection<VideoDocument>("videos")
    .find({ published: true, [surfaceField]: true })
    .sort({ displayOrder: 1, updatedAt: -1 })
    .limit(100)
    .toArray();
  return rows.map(toPublicVideo);
}

export async function createVideo(input: VideoInput) {
  const db = await getMongoDb();
  const now = new Date();
  const result = await db.collection<VideoDocument>("videos").insertOne({
    ...input,
    createdAt: now,
    updatedAt: now,
    updatedBy: "admin",
  });
  const row = await db
    .collection<VideoDocument>("videos")
    .findOne({ _id: result.insertedId });
  if (!row) throw new Error("CREATE_FAILED");
  return toAdminVideo(row);
}

export async function updateVideo(id: string, input: VideoInput) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const row = await db
    .collection<VideoDocument>("videos")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...input, updatedAt: new Date(), updatedBy: "admin" } },
      { returnDocument: "after" },
    );
  return row ? toAdminVideo(row) : null;
}

export async function deleteVideo(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const row = await db
    .collection<VideoDocument>("videos")
    .findOneAndDelete({ _id: new ObjectId(id) });
  return row ? toAdminVideo(row) : null;
}
