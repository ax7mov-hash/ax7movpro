import { z } from "zod";

export const creativeAreas = [
  "automotive",
  "personalised-ads",
  "portraits",
  "small-events",
  "editorial",
] as const;

const safeMediaUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (value.startsWith("/")) return !value.startsWith("//");
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a local path or an HTTPS image URL.");

export const projectInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug."),
    titleEn: z.string().trim().min(2).max(120),
    titleFr: z.string().trim().min(2).max(120),
    descriptionEn: z.string().trim().min(2).max(600),
    descriptionFr: z.string().trim().min(2).max(600),
    altEn: z.string().trim().min(2).max(240),
    altFr: z.string().trim().min(2).max(240),
    mediaType: z.enum(["photo", "video"]),
    area: z.enum(creativeAreas),
    src: safeMediaUrl.optional().or(z.literal("")),
    width: z.number().int().min(1).max(20000).optional(),
    height: z.number().int().min(1).max(20000).optional(),
    objectPosition: z.string().trim().max(80).default("center center"),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    displayOrder: z.number().int().min(0).max(9999).default(0),
  })
  .superRefine((value, context) => {
    if (value.mediaType === "photo" && !value.src) {
      context.addIssue({
        code: "custom",
        path: ["src"],
        message: "A photo needs an uploaded image.",
      });
    }
    if (value.mediaType === "photo" && (!value.width || !value.height)) {
      context.addIssue({
        code: "custom",
        path: ["width"],
        message: "Image dimensions are required.",
      });
    }
  });

export type ProjectInput = z.infer<typeof projectInputSchema>;

export type AdminProject = ProjectInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
