import { z } from "zod";

export const reviewInputSchema = z.object({
  author: z.string().trim().min(2).max(100),
  roleEn: z.string().trim().max(120).default(""),
  roleFr: z.string().trim().max(120).default(""),
  quoteEn: z.string().trim().min(10).max(1000),
  quoteFr: z.string().trim().min(10).max(1000),
  rating: z.number().int().min(1).max(5).default(5),
  published: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(9999).default(0),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export type AdminReview = ReviewInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicReview = {
  id: string;
  author: string;
  role: { en: string; fr: string };
  quote: { en: string; fr: string };
  rating: number;
};
