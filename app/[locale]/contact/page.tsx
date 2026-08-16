import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@/lib/content";
import { EMAIL, INSTAGRAM, isLocale, PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from "@/lib/config";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return isLocale(locale) ? pageMetadata(locale, "contact", "/contact") : {}; }

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound(); const t = copy[locale];
  return <main className="inner-page contact-page"><section className="contact-hero"><p className="eyebrow">{t.contactEyebrow}</p><h1 data-text-reveal>{t.contactTitle}</h1><p data-reveal>{t.contactIntro}</p><a className="big-contact-link" data-magnetic href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><span>{t.whatsapp}</span><i aria-hidden="true">↗</i></a></section>
    <section className="contact-details"><div className="contact-channels"><a href={`mailto:${EMAIL}`}><span>{t.email}</span><strong>{EMAIL}</strong></a><a href={`tel:${PHONE_TEL}`}><span>{t.call}</span><strong>{PHONE_DISPLAY}</strong></a><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"><span>Instagram</span><strong>@ax7.mov ↗</strong></a></div><div className="contact-brief"><h2>{t.details}</h2><ul>{t.detailItems.map((item) => <li key={item}>{item}</li>)}</ul><p>{t.serviceArea}</p></div></section>
  </main>;
}
