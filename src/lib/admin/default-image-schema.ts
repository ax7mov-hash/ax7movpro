import { z } from "zod";

const safeImageUrl = z
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
  }, "Use a local path or an HTTPS image URL.");

export const defaultImageInputSchema = z
  .object({
    src: safeImageUrl,
    width: z.number().int().min(640).max(8000),
    height: z.number().int().min(400).max(8000),
    titleEn: z.string().trim().min(2).max(120),
    titleFr: z.string().trim().min(2).max(120),
    descriptionEn: z.string().trim().min(2).max(600),
    descriptionFr: z.string().trim().min(2).max(600),
    altEn: z.string().trim().min(2).max(240),
    altFr: z.string().trim().min(2).max(240),
    focusX: z.number().int().min(0).max(100).default(50),
    focusY: z.number().int().min(0).max(100).default(50),
  })
  .refine((value) => value.width * value.height <= 40_000_000, {
    path: ["width"],
    message: "Images cannot exceed 40 megapixels.",
  });

export type DefaultImageInput = z.infer<typeof defaultImageInputSchema>;

export type AdminDefaultImage = DefaultImageInput & {
  id: string;
  fallbackSrc: string;
  fallbackWidth: number;
  fallbackHeight: number;
  fallbackTitleEn: string;
  fallbackTitleFr: string;
  fallbackDescriptionEn: string;
  fallbackDescriptionFr: string;
  fallbackAltEn: string;
  fallbackAltFr: string;
  fallbackFocusX: number;
  fallbackFocusY: number;
  overridden: boolean;
  updatedAt?: string;
};
