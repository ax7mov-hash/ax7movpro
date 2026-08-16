import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copy } from "@/lib/content";
import { isLocale, WHATSAPP_URL } from "@/lib/config";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return isLocale(locale) ? pageMetadata(locale, "about", "/about") : {}; }

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound(); const t = copy[locale];
  return <main className="inner-page about-page">
    <section className="page-hero about-hero"><p className="eyebrow">{t.aboutPageEyebrow}</p><h1 data-text-reveal>{t.aboutPageTitle}</h1><div className="about-hero-image" data-image-reveal><Image src="/media/quiet-character.png" alt={locale === "en" ? "Portrait in a Paris atelier" : "Portrait dans un atelier parisien"} fill priority sizes="100vw" /></div></section>
    <section className="bio-section"><p className="eyebrow">02 / {locale === "en" ? "Portrait" : "Portrait"}</p><div><p className="lead-copy" data-reveal>{t.bio}</p><p data-reveal>{t.approach}</p></div></section>
    <section className="facts-section">{t.facts.map(([label, value]) => <div key={label} data-reveal><span>{label}</span><strong>{value}</strong></div>)}</section>
    <section className="pricing-note"><p data-text-reveal>{t.pricing}</p><a className="text-link" data-magnetic href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{t.contactWhatsApp} ↗</a></section>
    <section className="next-page"><p className="eyebrow">{locale === "en" ? "Next" : "Suivant"}</p><Link href={`/${locale}/gallery`}>{t.nav.gallery} <span>↗</span></Link></section>
  </main>;
}
