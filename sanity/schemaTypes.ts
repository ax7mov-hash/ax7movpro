/**
 * Portable Sanity schema definitions for AX7MOV. Import these into a Sanity
 * Studio's schema.types array. They deliberately contain no project secrets.
 */
export const projectSchema = {
  name: "project", title: "Project", type: "document",
  fields: [
    { name: "title", title: "Internal title", type: "string", validation: (rule: { required: () => unknown }) => rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } },
    { name: "titleEn", title: "Title (English)", type: "string" }, { name: "titleFr", title: "Title (French)", type: "string" },
    { name: "descriptionEn", title: "Description (English)", type: "text", rows: 3 }, { name: "descriptionFr", title: "Description (French)", type: "text", rows: 3 },
    { name: "category", title: "Category", type: "string" },
    { name: "mediaType", title: "Media type", type: "string", options: { list: [{ title: "Photo", value: "photo" }, { title: "Video", value: "video" }], layout: "radio" } },
    { name: "coverImage", title: "Cover image", type: "image", options: { hotspot: true } },
    { name: "galleryImages", title: "Gallery images", type: "array", of: [{ type: "image", options: { hotspot: true } }] },
    { name: "previewVideoUrl", title: "Preview video URL", type: "url" },
    { name: "previewVideo", title: "Uploaded preview video", type: "file", options: { accept: "video/mp4,video/webm" } },
    { name: "videoPoster", title: "Video poster", type: "image", options: { hotspot: true } },
    { name: "year", title: "Year", type: "string" }, { name: "alt", title: "Alternative text", type: "string" },
    { name: "featured", title: "Featured", type: "boolean", initialValue: false }, { name: "published", title: "Published", type: "boolean", initialValue: true },
    { name: "displayOrder", title: "Display order", type: "number" },
  ],
};

export const instagramSelectionSchema = {
  name: "instagramSelection", title: "Instagram selection", type: "document",
  fields: [
    { name: "postUrl", title: "Instagram post URL", type: "url" }, { name: "fallbackImage", title: "Fallback image", type: "image", options: { hotspot: true } },
    { name: "caption", title: "Caption", type: "string" }, { name: "alt", title: "Alternative text", type: "string" },
    { name: "published", title: "Published", type: "boolean", initialValue: true }, { name: "displayOrder", title: "Display order", type: "number" },
  ],
};

export const siteSettingsSchema = {
  name: "siteSettings", title: "Site settings", type: "document",
  fields: [
    { name: "photographerName", title: "Photographer name", type: "string" }, { name: "brandName", title: "Brand name", type: "string" },
    { name: "biographyEn", title: "Biography (English)", type: "text" }, { name: "biographyFr", title: "Biography (French)", type: "text" },
    { name: "email", title: "Email", type: "string" }, { name: "whatsapp", title: "WhatsApp number", type: "string" }, { name: "location", title: "Location", type: "string" },
    { name: "instagram", title: "Instagram", type: "url" }, { name: "youtube", title: "YouTube", type: "url" }, { name: "facebook", title: "Facebook", type: "url" }, { name: "tiktok", title: "TikTok", type: "url" },
    { name: "defaultWhatsappMessage", title: "Default WhatsApp message", type: "text" },
    { name: "seoTitle", title: "SEO title", type: "string" }, { name: "seoDescription", title: "SEO description", type: "text" }, { name: "socialImage", title: "Social-sharing image", type: "image" },
  ],
};

export const schemaTypes = [projectSchema, instagramSelectionSchema, siteSettingsSchema];

