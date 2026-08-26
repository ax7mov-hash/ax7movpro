import { cache } from "react";
import type { MediaItem } from "./media";
import { instagramItems, mediaItems } from "./media";
import { sanityClient } from "@/sanity/lib/client";
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

type SanityProject = {
  _id: string;
  titleEn?: string;
  titleFr?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  mediaType?: "photo" | "video";
  creativeArea?: MediaItem["area"];
  featured?: boolean;
  altEn?: string;
  altFr?: string;
  coverImage?: {
    asset?: {
      url?: string;
      metadata?: { dimensions?: { width?: number; height?: number } };
    };
    hotspot?: { x?: number; y?: number };
  };
};

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
  if (!sanityClient) return defaultItems;
  try {
    const rows = await sanityClient.fetch<SanityProject[]>(
      `*[_type == "project"] | order(displayOrder asc, publishedAt desc){_id,titleEn,titleFr,descriptionEn,descriptionFr,mediaType,creativeArea,featured,altEn,altFr,coverImage{hotspot,asset->{url,metadata{dimensions}}}}`,
      {},
      { next: { revalidate: 60 } },
    );
    if (!rows.length) return defaultItems;
    return rows.map((row) => ({
      id: row._id,
      src: row.coverImage?.asset?.url,
      width: row.coverImage?.asset?.metadata?.dimensions?.width,
      height: row.coverImage?.asset?.metadata?.dimensions?.height,
      mediaType: row.mediaType || "photo",
      title: {
        en: row.titleEn || "Untitled",
        fr: row.titleFr || row.titleEn || "Sans titre",
      },
      description: {
        en: row.descriptionEn || "",
        fr: row.descriptionFr || row.descriptionEn || "",
      },
      alt: {
        en: row.altEn || row.titleEn || "AX7MOV project image",
        fr: row.altFr || row.titleFr || row.altEn || "Image de projet AX7MOV",
      },
      area: row.creativeArea || "editorial",
      featured: Boolean(row.featured),
      objectPosition: row.coverImage?.hotspot
        ? `${Math.round(row.coverImage.hotspot.x! * 100)}% ${Math.round(row.coverImage.hotspot.y! * 100)}%`
        : undefined,
    }));
  } catch {
    return defaultItems;
  }
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
  if (!sanityClient) return defaultInstagramItems;
  try {
    const rows = await sanityClient.fetch<
      Array<{
        _id: string;
        captionEn?: string;
        captionFr?: string;
        image?: SanityProject["coverImage"];
      }>
    >(
      `*[_type == "instagramEntry" && published == true] | order(displayOrder asc){_id,captionEn,captionFr,image{hotspot,asset->{url,metadata{dimensions}}}}`,
      {},
      { next: { revalidate: 60 } },
    );
    if (!rows.length) return defaultInstagramItems;
    return rows.map((row) => ({
      id: row._id,
      src: row.image?.asset?.url,
      width: row.image?.asset?.metadata?.dimensions?.width,
      height: row.image?.asset?.metadata?.dimensions?.height,
      mediaType: "photo",
      title: {
        en: row.captionEn || "Instagram frame",
        fr: row.captionFr || row.captionEn || "Image Instagram",
      },
      description: {
        en: row.captionEn || "",
        fr: row.captionFr || row.captionEn || "",
      },
      alt: {
        en: row.captionEn || "AX7MOV Instagram image",
        fr: row.captionFr || row.captionEn || "Image Instagram AX7MOV",
      },
      area: "editorial",
      featured: false,
    }));
  } catch {
    return defaultInstagramItems;
  }
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
