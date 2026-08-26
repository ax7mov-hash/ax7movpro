import { defineField, defineType } from "sanity";

export const instagramEntryType = defineType({
  name: "instagramEntry",
  title: "Instagram showcase entry",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "captionEn",
      title: "Caption (English)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "captionFr",
      title: "Caption (French)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram post URL",
      type: "url",
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      initialValue: 100,
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: { select: { title: "captionEn", media: "image" } },
});
