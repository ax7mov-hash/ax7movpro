import { defineField, defineType } from "sanity";

export const projectType = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "titleEn",
      title: "Title (English)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "titleFr",
      title: "Title (French)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "titleEn" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "descriptionEn",
      title: "Short description (English)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "descriptionFr",
      title: "Short description (French)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "mediaType",
      title: "Media type",
      type: "string",
      options: { list: ["photo", "video"], layout: "radio" },
      initialValue: "photo",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "galleryImages",
      title: "Gallery images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "previewVideo",
      title: "Preview video",
      type: "file",
      options: { accept: "video/mp4,video/webm" },
    }),
    defineField({
      name: "videoPoster",
      title: "Video poster",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "altEn", title: "Alt text (English)", type: "string" }),
    defineField({ name: "altFr", title: "Alt text (French)", type: "string" }),
    defineField({
      name: "creativeArea",
      title: "Creative area",
      type: "string",
      options: {
        list: [
          { title: "Automotive", value: "automotive" },
          { title: "Personalised ads", value: "personalised-ads" },
          { title: "Portraits", value: "portraits" },
          { title: "Small events", value: "small-events" },
          { title: "Editorial", value: "editorial" },
        ],
      },
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      initialValue: 100,
    }),
    defineField({
      name: "publishedAt",
      title: "Published date",
      type: "datetime",
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrder",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "titleEn", subtitle: "mediaType", media: "coverImage" },
  },
});
