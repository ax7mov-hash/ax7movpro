import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/gallery", "/contact"];
  return ["en", "fr"].flatMap((locale) =>
    pages.map((page) => ({
      url: `https://ax7mov.com/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? ("monthly" as const) : ("yearly" as const),
      priority: page === "" ? 1 : 0.8,
      alternates: {
        languages: {
          en: `https://ax7mov.com/en${page}`,
          fr: `https://ax7mov.com/fr${page}`,
        },
      },
    })),
  );
}
