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
        url.hostname.endsWith(".public.blob.vercel-storage.com")
      );
    } catch {
      return false;
    }
  }, "Use a local path or an HTTPS image URL.");

export const heroInputSchema = z
  .object({
    src: safeImageUrl,
    width: z.number().int().min(1200).max(8000),
    height: z.number().int().min(600).max(8000),
    altEn: z.string().trim().min(2).max(240),
    altFr: z.string().trim().min(2).max(240),
    focusX: z.number().int().min(0).max(100).default(50),
    focusY: z.number().int().min(0).max(100).default(50),
  })
  .refine((value) => value.width * value.height <= 40_000_000, {
    path: ["width"],
    message: "Hero images cannot exceed 40 megapixels.",
  });

export type HeroInput = z.infer<typeof heroInputSchema>;

export type AdminHeroSettings = HeroInput & {
  updatedAt: string;
};

export type PublicHeroImage = {
  src: string;
  width: number;
  height: number;
  alt: { en: string; fr: string };
  objectPosition?: string;
  managed: boolean;
};
