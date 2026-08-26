import { z } from "zod";
import { getVideoProvider, type VideoProvider } from "@/lib/video-links";

const safeThumbnailUrl = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => {
    if (value.startsWith("/")) return !value.startsWith("//");
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        (url.hostname === "cdn.sanity.io" ||
          url.hostname.endsWith(".public.blob.vercel-storage.com"))
      );
    } catch {
      return false;
    }
  }, "Upload a thumbnail image first.");

export const videoInputSchema = z
  .object({
    titleEn: z.string().trim().min(2).max(120),
    titleFr: z.string().trim().min(2).max(120),
    descriptionEn: z.string().trim().min(2).max(600),
    descriptionFr: z.string().trim().min(2).max(600),
    altEn: z.string().trim().min(2).max(240),
    altFr: z.string().trim().min(2).max(240),
    linkUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) => Boolean(getVideoProvider(value)),
        "Use a full YouTube video, YouTube Shorts, or Instagram post/reel URL.",
      ),
    thumbnailSrc: safeThumbnailUrl,
    thumbnailWidth: z.number().int().min(640).max(8000),
    thumbnailHeight: z.number().int().min(400).max(8000),
    format: z.enum(["reel", "widescreen"]),
    showOnHome: z.boolean().default(true),
    showInGallery: z.boolean().default(true),
    autoplay: z.boolean().default(false),
    loop: z.boolean().default(false),
    published: z.boolean().default(false),
    displayOrder: z.number().int().min(0).max(9999).default(0),
  })
  .superRefine((value, context) => {
    const provider = getVideoProvider(value.linkUrl);
    if (!value.showOnHome && !value.showInGallery) {
      context.addIssue({
        code: "custom",
        path: ["showOnHome"],
        message: "Choose the homepage, gallery, or both.",
      });
    }
    if (value.thumbnailWidth * value.thumbnailHeight > 40_000_000) {
      context.addIssue({
        code: "custom",
        path: ["thumbnailWidth"],
        message: "Thumbnail images cannot exceed 40 megapixels.",
      });
    }
    if ((value.autoplay || value.loop) && provider !== "youtube") {
      context.addIssue({
        code: "custom",
        path: ["autoplay"],
        message:
          "Managed autoplay and loop previews are available for YouTube links.",
      });
    }
    if (value.loop && !value.autoplay) {
      context.addIssue({
        code: "custom",
        path: ["loop"],
        message: "Enable autoplay before enabling loop.",
      });
    }
  });

export type VideoInput = z.infer<typeof videoInputSchema>;

export type AdminVideo = VideoInput & {
  id: string;
  provider: VideoProvider;
  createdAt: string;
  updatedAt: string;
};

export type PublicVideo = Omit<
  AdminVideo,
  "published" | "createdAt" | "updatedAt"
>;
