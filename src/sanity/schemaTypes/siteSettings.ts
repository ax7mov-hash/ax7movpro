import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "biographyEn",
      title: "Biography (English)",
      type: "text",
    }),
    defineField({
      name: "biographyFr",
      title: "Biography (French)",
      type: "text",
    }),
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({
      name: "location",
      title: "Primary location",
      type: "string",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "object",
      fields: [
        { name: "instagram", type: "url" },
        { name: "facebook", type: "url" },
        { name: "tiktok", type: "url" },
        { name: "youtube", type: "url" },
      ],
    }),
    defineField({
      name: "whatsappMessageEn",
      title: "WhatsApp message (English)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "whatsappMessageFr",
      title: "WhatsApp message (French)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "defaultSeoImage",
      title: "Default SEO image",
      type: "image",
    }),
    defineField({
      name: "availabilityStatusEn",
      title: "Availability (English)",
      type: "string",
    }),
    defineField({
      name: "availabilityStatusFr",
      title: "Availability (French)",
      type: "string",
    }),
  ],
  preview: { prepare: () => ({ title: "AX7MOV site settings" }) },
});
