import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { getPortfolioItems, getVideos } from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/gallery">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("galleryTitle"),
    description: t("galleryDescription"),
    alternates: {
      canonical: `/${locale}/gallery`,
      languages: { en: "/en/gallery", fr: "/fr/gallery" },
    },
    openGraph: {
      title: t("galleryTitle"),
      description: t("galleryDescription"),
      url: `/${locale}/gallery`,
    },
    twitter: { title: t("galleryTitle"), description: t("galleryDescription") },
  };
}

export default async function GalleryPage({
  params,
}: PageProps<"/[locale]/gallery">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Gallery");
  const [items, videos] = await Promise.all([
    getPortfolioItems(),
    getVideos("gallery"),
  ]);
  return (
    <main id="main-content" className="inner-page gallery-page paper-surface">
      <section className="page-hero page-hero-gallery dark-surface">
        <div className="page-hero-orbit" aria-hidden="true" />
        <div data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <span>AX7 / ALL FRAMES</span>
      </section>
      <section className="gallery-wrap section-pad">
        <GalleryGrid
          items={items}
          videos={videos}
          locale={locale as "en" | "fr"}
          labels={{
            open: t("open"),
            close: t("close"),
            previous: t("previous"),
            next: t("next"),
            counter: t.raw("counter"),
          }}
        />
      </section>
    </main>
  );
}
