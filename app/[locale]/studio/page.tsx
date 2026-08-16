import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@/lib/content";
import { isLocale } from "@/lib/config";
import { pageMetadata } from "@/lib/metadata";
import { sanityStudioUrl } from "@/lib/sanity";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return isLocale(locale) ? pageMetadata(locale, "studio", "/studio") : {}; }
export default async function StudioPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); const t = copy[locale]; return <main className="inner-page studio-page"><section><p className="eyebrow">Sanity CMS</p><h1 data-text-reveal>{t.studioTitle}</h1><p data-reveal>{t.studioText}</p><div><a className="solid-button" data-magnetic href={sanityStudioUrl} target="_blank" rel="noopener noreferrer">{t.studioOpen} ↗</a><a className="text-link" href="/README.md">{t.studioSetup} ↗</a></div></section></main>; }
