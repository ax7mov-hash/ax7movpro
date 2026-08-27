import { z } from "zod";

const localizedText = (maximum: number) =>
  z.object({
    en: z.string().trim().min(1).max(maximum),
    fr: z.string().trim().min(1).max(maximum),
  });

const safeImageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
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
  }, "Use a local path or an approved HTTPS image URL.");

export const aboutImageSchema = z
  .object({
    src: safeImageUrl,
    width: z.number().int().min(640).max(8000).optional(),
    height: z.number().int().min(400).max(8000).optional(),
    alt: z.object({
      en: z.string().trim().max(240),
      fr: z.string().trim().max(240),
    }),
    focusX: z.number().int().min(0).max(100),
    focusY: z.number().int().min(0).max(100),
  })
  .superRefine((image, context) => {
    if (!image.src) return;
    if (!image.width || !image.height) {
      context.addIssue({
        code: "custom",
        path: ["width"],
        message: "Uploaded images must include their dimensions.",
      });
    } else if (image.width * image.height > 40_000_000) {
      context.addIssue({
        code: "custom",
        path: ["width"],
        message: "About images cannot exceed 40 megapixels.",
      });
    }
    if (image.alt.en.length < 2 || image.alt.fr.length < 2) {
      context.addIssue({
        code: "custom",
        path: ["alt"],
        message: "Add English and French descriptions for uploaded images.",
      });
    }
  });

export const aboutInputSchema = z.object({
  home: z.object({
    eyebrow: localizedText(100),
    title: localizedText(180),
    body: localizedText(1200),
    linkLabel: localizedText(100),
  }),
  hero: z.object({
    eyebrow: localizedText(100),
    title: localizedText(220),
    bio: localizedText(1500),
  }),
  stats: z
    .array(
      z.object({
        value: localizedText(80),
        label: localizedText(120),
      }),
    )
    .length(3),
  approach: z.object({
    eyebrow: localizedText(100),
    title: localizedText(220),
    body: localizedText(1200),
    note: localizedText(1200),
  }),
  process: z.object({
    eyebrow: localizedText(100),
    title: localizedText(240),
    estimate: localizedText(500),
    steps: z
      .array(
        z.object({
          title: localizedText(100),
          body: localizedText(600),
        }),
      )
      .length(4),
    contactLabel: localizedText(100),
  }),
  images: z.object({
    portrait: aboutImageSchema,
    approach: aboutImageSchema,
  }),
});

export type LocalizedAboutText = z.infer<ReturnType<typeof localizedText>>;
export type AboutImageInput = z.infer<typeof aboutImageSchema>;
export type AboutInput = z.infer<typeof aboutInputSchema>;

export type AdminAboutSettings = AboutInput & {
  updatedAt: string;
};

export type PublicAboutContent = AboutInput & {
  managed: boolean;
};
