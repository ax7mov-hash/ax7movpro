import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectGrid } from "@/components/ProjectGrid";
import { copy } from "@/lib/content";
import { isLocale } from "@/lib/config";
import { pageMetadata } from "@/lib/metadata";
import { getProjects } from "@/lib/sanity";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return isLocale(locale) ? pageMetadata(locale, "gallery", "/gallery") : {}; }

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound(); const t = copy[locale]; const projects = await getProjects();
  return <main className="inner-page gallery-page"><section className="page-hero gallery-hero"><p className="eyebrow">{t.galleryEyebrow}</p><h1>{t.galleryTitle}</h1><p>{t.galleryIntro}</p></section><section className="gallery-work"><ProjectGrid projects={projects} locale={locale} interactive /></section></main>;
}
