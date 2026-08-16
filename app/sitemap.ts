import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/gallery", "/contact"];
  return (["en", "fr"] as const).flatMap((locale) => paths.map((path) => ({ url: `${SITE_URL}/${locale}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "monthly" as const : "yearly" as const, priority: path === "" ? 1 : .8, alternates: { languages: { en: `${SITE_URL}/en${path}`, fr: `${SITE_URL}/fr${path}` } } })));
}
