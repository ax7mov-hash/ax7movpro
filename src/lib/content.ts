import { cache } from "react";
import type { MediaItem } from "./media";
import { instagramItems, mediaItems } from "./media";
import { isMongoConfigured } from "@/lib/server/env";
import { listPublishedProjects } from "@/lib/server/projects";
import { listPublishedReviews } from "@/lib/server/reviews";
import type { PublicReview } from "@/lib/admin/review-schema";
import type { PublicHeroImage } from "@/lib/admin/hero-schema";
import { getFallbackHero, getPublishedHero } from "@/lib/server/hero-settings";
import { applyDefaultImageOverrides } from "@/lib/server/default-images";
import type { PublicVideo } from "@/lib/admin/video-schema";
import { listPublishedVideos } from "@/lib/server/videos";
import type { PublicAboutContent } from "@/lib/admin/about-schema";
import {
  getFallbackAbout,
  getPublishedAbout,
} from "@/lib/server/about-settings";

function mergeWithDefaultPortfolio(
  items: MediaItem[],
  defaultItems: MediaItem[],
) {
  const managedIds = new Set(items.map((item) => item.id));
  return [...items, ...defaultItems.filter((item) => !managedIds.has(item.id))];
}

const getDefaultPortfolio = cache(async () => {
  if (!isMongoConfigured()) return mediaItems;
  try {
    return await applyDefaultImageOverrides(mediaItems);
  } catch {
    return mediaItems;
  }
});

export async function getPortfolioItems(): Promise<MediaItem[]> {
  const defaultItems = await getDefaultPortfolio();
  if (isMongoConfigured()) {
    try {
      const mongoItems = await listPublishedProjects();
      if (mongoItems.length)
        return mergeWithDefaultPortfolio(mongoItems, defaultItems);
    } catch {
      // Preserve the current portfolio if Atlas is temporarily unavailable.
    }
  }
  return defaultItems;
}

export async function getVideos(
  surface: "home" | "gallery",
): Promise<PublicVideo[]> {
  if (!isMongoConfigured()) return [];
  try {
    return await listPublishedVideos(surface);
  } catch {
    return [];
  }
}

export async function getInstagramItems(): Promise<MediaItem[]> {
  const defaultItems = await getDefaultPortfolio();
  const instagramIds = new Set(instagramItems.map((item) => item.id));
  const defaultInstagramItems = defaultItems.filter((item) =>
    instagramIds.has(item.id),
  );
  return defaultInstagramItems;
}

export async function getReviews(): Promise<PublicReview[]> {
  if (!isMongoConfigured()) return [];
  try {
    return await listPublishedReviews();
  } catch {
    // Reviews are supplemental, so the page remains available if Atlas is offline.
    return [];
  }
}

export async function getHeroImage(): Promise<PublicHeroImage> {
  if (!isMongoConfigured()) return getFallbackHero();
  try {
    return await getPublishedHero();
  } catch {
    // The bundled hero remains available if Atlas is temporarily unavailable.
    return getFallbackHero();
  }
}

export async function getAboutContent(): Promise<PublicAboutContent> {
  if (!isMongoConfigured()) return { ...getFallbackAbout(), managed: false };
  try {
    return await getPublishedAbout();
  } catch {
    // The bilingual defaults keep both public About surfaces available.
    return { ...getFallbackAbout(), managed: false };
  }
}
