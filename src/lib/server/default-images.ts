import "server-only";
import type {
  AdminDefaultImage,
  DefaultImageInput,
} from "@/lib/admin/default-image-schema";
import { mediaItems, type MediaItem } from "@/lib/media";
import { getMongoDb } from "./mongodb";

type DefaultImageDocument = DefaultImageInput & {
  mediaId: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: "admin";
};

const editableDefaults = mediaItems.filter(
  (item) => item.mediaType === "photo" && item.src && item.width && item.height,
) as Array<MediaItem & { src: string; width: number; height: number }>;

function positionToFocus(position?: string) {
  if (!position) return { focusX: 50, focusY: 50 };
  const [horizontal = "50%", vertical = "50%"] = position.split(" ");
  const named = { left: 0, center: 50, right: 100, top: 0, bottom: 100 };
  const parse = (value: string) => {
    if (value in named) return named[value as keyof typeof named];
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? Math.min(Math.max(number, 0), 100) : 50;
  };
  return { focusX: parse(horizontal), focusY: parse(vertical) };
}

function getDefaultItem(id: string) {
  return editableDefaults.find((item) => item.id === id);
}

function toAdminImage(
  fallback: (typeof editableDefaults)[number],
  override?: DefaultImageDocument,
): AdminDefaultImage {
  const fallbackFocus = positionToFocus(fallback.objectPosition);
  return {
    id: fallback.id,
    fallbackSrc: fallback.src,
    fallbackWidth: fallback.width,
    fallbackHeight: fallback.height,
    fallbackTitleEn: fallback.title.en,
    fallbackTitleFr: fallback.title.fr,
    fallbackDescriptionEn: fallback.description.en,
    fallbackDescriptionFr: fallback.description.fr,
    fallbackAltEn: fallback.alt.en,
    fallbackAltFr: fallback.alt.fr,
    fallbackFocusX: fallbackFocus.focusX,
    fallbackFocusY: fallbackFocus.focusY,
    src: override?.src || fallback.src,
    width: override?.width || fallback.width,
    height: override?.height || fallback.height,
    titleEn: override?.titleEn || fallback.title.en,
    titleFr: override?.titleFr || fallback.title.fr,
    descriptionEn: override?.descriptionEn || fallback.description.en,
    descriptionFr: override?.descriptionFr || fallback.description.fr,
    altEn: override?.altEn || fallback.alt.en,
    altFr: override?.altFr || fallback.alt.fr,
    focusX: override?.focusX ?? fallbackFocus.focusX,
    focusY: override?.focusY ?? fallbackFocus.focusY,
    overridden: Boolean(override),
    updatedAt: override?.updatedAt.toISOString(),
  };
}

export async function listAdminDefaultImages() {
  const db = await getMongoDb();
  const overrides = await db
    .collection<DefaultImageDocument>("mediaOverrides")
    .find({ mediaId: { $in: editableDefaults.map((item) => item.id) } })
    .toArray();
  const byId = new Map(overrides.map((item) => [item.mediaId, item]));
  return editableDefaults.map((item) => toAdminImage(item, byId.get(item.id)));
}

export async function updateDefaultImage(id: string, input: DefaultImageInput) {
  const fallback = getDefaultItem(id);
  if (!fallback) return null;
  const db = await getMongoDb();
  const now = new Date();
  const result = await db
    .collection<DefaultImageDocument>("mediaOverrides")
    .findOneAndUpdate(
      { mediaId: id },
      {
        $set: { ...input, updatedAt: now, updatedBy: "admin" },
        $setOnInsert: { mediaId: id, createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
  if (!result) throw new Error("UPDATE_FAILED");
  return toAdminImage(fallback, result);
}

export async function clearDefaultImage(id: string) {
  const fallback = getDefaultItem(id);
  if (!fallback) return null;
  const db = await getMongoDb();
  await db
    .collection<DefaultImageDocument>("mediaOverrides")
    .deleteOne({ mediaId: id });
  return toAdminImage(fallback);
}

export async function applyDefaultImageOverrides(items: MediaItem[]) {
  const ids = items
    .filter((item) => item.mediaType === "photo" && item.src)
    .map((item) => item.id);
  if (!ids.length) return items;
  const db = await getMongoDb();
  const overrides = await db
    .collection<DefaultImageDocument>("mediaOverrides")
    .find({ mediaId: { $in: ids } })
    .toArray();
  if (!overrides.length) return items;
  const byId = new Map(overrides.map((item) => [item.mediaId, item]));
  return items.map((item) => {
    const override = byId.get(item.id);
    if (!override) return item;
    return {
      ...item,
      src: override.src,
      width: override.width,
      height: override.height,
      title: {
        en: override.titleEn || item.title.en,
        fr: override.titleFr || item.title.fr,
      },
      description: {
        en: override.descriptionEn || item.description.en,
        fr: override.descriptionFr || item.description.fr,
      },
      alt: { en: override.altEn, fr: override.altFr },
      objectPosition: `${override.focusX}% ${override.focusY}%`,
    };
  });
}
