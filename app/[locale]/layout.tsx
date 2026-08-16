import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/SiteChrome";
import { isLocale, SITE_URL } from "@/lib/config";

export function generateStaticParams() { return [{ locale: "en" }, { locale: "fr" }]; }

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const structuredData = { "@context": "https://schema.org", "@type": ["ProfessionalService", "Person"], name: "AX7MOV — Athulkrishna", url: `${SITE_URL}/${locale}`, image: `${SITE_URL}/og.png`, email: "athulkrishnans@gmail.com", telephone: "+917356448023", address: { "@type": "PostalAddress", addressLocality: "Paris", addressCountry: "FR" }, areaServed: "Paris, France", sameAs: ["https://www.instagram.com/ax7.mov"] };
  return <div lang={locale}><SiteChrome locale={locale}>{children}</SiteChrome><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></div>;
}
