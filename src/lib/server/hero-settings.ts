import "server-only";
import type {
  AdminHeroSettings,
  HeroInput,
  PublicHeroImage,
} from "@/lib/admin/hero-schema";
import { mediaItems } from "@/lib/media";
import { getMongoDb } from "./mongodb";

type HeroSettingsDocument = HeroInput & {
  key: "hero";
  createdAt: Date;
  updatedAt: Date;
  updatedBy: "admin";
};

const fallbackHero = mediaItems[0];

export function getFallbackHero(): PublicHeroImage {
  return {
    src: fallbackHero.src!,
    width: fallbackHero.width!,
    height: fallbackHero.height!,
    alt: fallbackHero.alt,
    managed: false,
  };
}

function toAdminSettings(row: HeroSettingsDocument): AdminHeroSettings {
  return {
    src: row.src,
    width: row.width,
    height: row.height,
    altEn: row.altEn,
    altFr: row.altFr,
    focusX: row.focusX,
    focusY: row.focusY,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAdminHeroSettings() {
  const db = await getMongoDb();
  const row = await db
    .collection<HeroSettingsDocument>("siteSettings")
    .findOne({ key: "hero" });
  return row ? toAdminSettings(row) : null;
}

export async function getPublishedHero(): Promise<PublicHeroImage> {
  const settings = await getAdminHeroSettings();
  if (!settings) return getFallbackHero();
  return {
    src: settings.src,
    width: settings.width,
    height: settings.height,
    alt: { en: settings.altEn, fr: settings.altFr },
    objectPosition: `${settings.focusX}% ${settings.focusY}%`,
    managed: true,
  };
}

export async function updateHeroSettings(input: HeroInput) {
  const db = await getMongoDb();
  const now = new Date();
  const result = await db
    .collection<HeroSettingsDocument>("siteSettings")
    .findOneAndUpdate(
      { key: "hero" },
      {
        $set: { ...input, updatedAt: now, updatedBy: "admin" },
        $setOnInsert: { key: "hero", createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
  if (!result) throw new Error("UPDATE_FAILED");
  return toAdminSettings(result);
}

export async function clearHeroSettings() {
  const db = await getMongoDb();
  const result = await db
    .collection<HeroSettingsDocument>("siteSettings")
    .findOneAndDelete({ key: "hero" });
  return result ? toAdminSettings(result) : null;
}
