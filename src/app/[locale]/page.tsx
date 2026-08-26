import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProjectCard } from "@/components/site/project-card";
import { ExternalVideoCard } from "@/components/site/external-video-card";
import { ServiceCard } from "@/components/site/service-card";
import {
  ArrowIcon,
  InstagramIcon,
  MailIcon,
  WhatsAppIcon,
} from "@/components/site/icons";
import { contact } from "@/lib/media";
import {
  getAboutContent,
  getHeroImage,
  getInstagramItems,
  getPortfolioItems,
  getReviews,
  getVideos,
} from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", fr: "/fr" },
    },
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: `/${locale}`,
    },
    twitter: { title: t("homeTitle"), description: t("homeDescription") },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const s = await getTranslations("Services");
  const activeLocale = (await getLocale()) as "en" | "fr";
  const [portfolioItems, showcaseItems, reviews, heroImage, videos, about] =
    await Promise.all([
      getPortfolioItems(),
      getInstagramItems(),
      getReviews(),
      getHeroImage(),
      getVideos("home"),
      getAboutContent(),
    ]);
  const featured = portfolioItems
    .filter((item) => item.featured && item.id !== "midnight-velocity")
    .slice(0, 6);
  const whatsAppUrl = contact.whatsapp[activeLocale];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Photographer", "ProfessionalService"],
    name: "AX7MOV",
    founder: { "@type": "Person", name: "Athulkrishna" },
    url: `https://ax7mov.com/${activeLocale}`,
    email: contact.email,
    telephone: "+917356448023",
    areaServed: { "@type": "City", name: "Paris" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Paris",
      addressCountry: "FR",
    },
    sameAs: [contact.instagram],
    serviceType: ["Photography", "Videography"],
  };

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="home-hero dark-surface">
        <div className="hero-media" data-parallax>
          <Image
            src={heroImage.src}
            alt={heroImage.alt[activeLocale]}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            style={
              heroImage.objectPosition
                ? { objectPosition: heroImage.objectPosition }
                : undefined
            }
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-viewfinder" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="hero-main">
          <p className="eyebrow hero-eyebrow">{t("eyebrow")}</p>
          <h1>
            <span>{t("title").split(" ").slice(0, 2).join(" ")}</span>{" "}
            <em>{t("title").split(" ").slice(2).join(" ")}</em>
          </h1>
          <p className="hero-intro">{t("intro")}</p>
          <div className="button-row">
            <Link className="button button-peach" href="/gallery">
              {t("explore")}
              <ArrowIcon />
            </Link>
            <a
              className="button button-ghost"
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("start")}
            </a>
          </div>
        </div>
        <div className="hero-meta">
          <span>AX7 / FRAME 001</span>
          <span>{t("scroll")}</span>
          <span>48.8566° N / 2.3522° E</span>
        </div>
      </section>

      <section className="featured-section paper-surface section-pad">
        <div className="section-heading split-heading" data-reveal>
          <div>
            <p className="eyebrow">{t("featuredEyebrow")}</p>
            <h2>{t("featuredTitle")}</h2>
          </div>
          <p>{t("featuredIntro")}</p>
        </div>
        <div className="featured-grid">
          {featured.map((item, index) => (
            <ProjectCard
              key={item.id}
              item={item}
              className={`project-${index + 1}`}
            />
          ))}
        </div>
        <div className="section-link-row">
          <Link className="text-link" href="/gallery">
            {t("viewGallery")}
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {videos.length > 0 && (
        <section className="video-content-section dark-surface section-pad">
          <div className="section-heading split-heading" data-reveal>
            <div>
              <p className="eyebrow">
                {activeLocale === "fr"
                  ? "FILMS SÉLECTIONNÉS"
                  : "SELECTED MOTION"}
              </p>
              <h2>
                {activeLocale === "fr"
                  ? "Histoires en mouvement."
                  : "Stories in motion."}
              </h2>
            </div>
            <p>
              {activeLocale === "fr"
                ? "Regardez les derniers reels et films sur leur plateforme d’origine."
                : "Watch the latest reels and films on their original platform."}
            </p>
          </div>
          <div className="external-video-grid">
            {videos.map((video) => (
              <ExternalVideoCard
                key={video.id}
                video={video}
                locale={activeLocale}
                surface="home"
              />
            ))}
          </div>
        </section>
      )}

      <section className="services-section violet-surface section-pad">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">{t("servicesEyebrow")}</p>
          <h2>{t("servicesTitle")}</h2>
        </div>
        <div className="services-grid">
          <ServiceCard
            index={1}
            title={s("automotive")}
            body={s("automotiveBody")}
            tone="service-teal"
          />
          <ServiceCard
            index={2}
            title={s("ads")}
            body={s("adsBody")}
            tone="service-peach"
          />
          <ServiceCard
            index={3}
            title={s("portraits")}
            body={s("portraitsBody")}
            tone="service-paper"
          />
          <ServiceCard
            index={4}
            title={s("events")}
            body={s("eventsBody")}
            tone="service-terra"
          />
        </div>
      </section>

      <section className="about-preview paper-surface section-pad">
        <div className="about-abstract" data-reveal>
          {about.images.portrait.src &&
          about.images.portrait.width &&
          about.images.portrait.height ? (
            <div className="about-preview-managed-image">
              <Image
                src={about.images.portrait.src}
                alt={about.images.portrait.alt[activeLocale]}
                fill
                sizes="(max-width: 760px) 90vw, 40vw"
                style={{
                  objectPosition: `${about.images.portrait.focusX}% ${about.images.portrait.focusY}%`,
                }}
              />
            </div>
          ) : (
            <>
              <div className="lens-disc">
                <span>AX7</span>
                <i />
              </div>
              <div className="contact-sheet">
                <b>LIGHT</b>
                <b>MOTION</b>
                <b>STORY</b>
              </div>
            </>
          )}
        </div>
        <div className="about-preview-copy" data-reveal>
          <p className="eyebrow">{about.home.eyebrow[activeLocale]}</p>
          <h2>{about.home.title[activeLocale]}</h2>
          <p>{about.home.body[activeLocale]}</p>
          <Link className="text-link" href="/about">
            {about.home.linkLabel[activeLocale]}
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="reviews-section violet-surface section-pad">
          <div className="section-heading split-heading" data-reveal>
            <div>
              <p className="eyebrow">{t("reviewsEyebrow")}</p>
              <h2>{t("reviewsTitle")}</h2>
            </div>
            <p>{t("reviewsIntro")}</p>
          </div>
          <div className="reviews-grid">
            {reviews.map((review) => (
              <article
                className="review-public-card"
                key={review.id}
                data-reveal
              >
                <div
                  className="review-stars"
                  aria-label={`${review.rating} ${t("reviewsStars")}`}
                >
                  <span aria-hidden="true">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <blockquote>“{review.quote[activeLocale]}”</blockquote>
                <footer>
                  <strong>{review.author}</strong>
                  {review.role[activeLocale] && (
                    <span>{review.role[activeLocale]}</span>
                  )}
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="instagram-section teal-surface section-pad">
        <div className="section-heading split-heading" data-reveal>
          <div>
            <p className="eyebrow">{t("instagramEyebrow")}</p>
            <h2>{t("instagramTitle")}</h2>
          </div>
          <a
            className="button button-outline"
            href={contact.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon />
            {t("follow")}
          </a>
        </div>
        <div className="instagram-grid">
          {showcaseItems.map((item) =>
            item.src && item.width && item.height ? (
              <a
                key={item.id}
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t("follow")}: ${item.title[activeLocale]}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt[activeLocale]}
                  fill
                  sizes="(max-width: 680px) 100vw, 33vw"
                />
                <span>
                  <InstagramIcon />
                  @ax7.mov
                </span>
              </a>
            ) : null,
          )}
        </div>
      </section>

      <section className="closing-cta paper-surface section-pad">
        <div className="cta-orbit" aria-hidden="true" />
        <div data-reveal>
          <p className="eyebrow">AX7MOV / PARIS</p>
          <h2>{t("ctaTitle")}</h2>
          <p>{t("ctaBody")}</p>
          <div className="button-row">
            <a
              className="button button-dark"
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {t("whatsapp")}
            </a>
            <a className="button button-outline-dark" href={contact.emailLink}>
              <MailIcon />
              {t("email")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
