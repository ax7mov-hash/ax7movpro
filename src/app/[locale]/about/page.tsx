import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowIcon } from "@/components/site/icons";
import { getAboutContent } from "@/lib/content";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: {
      canonical: `/${locale}/about`,
      languages: { en: "/en/about", fr: "/fr/about" },
    },
    openGraph: {
      title: t("aboutTitle"),
      description: t("aboutDescription"),
      url: `/${locale}/about`,
    },
    twitter: { title: t("aboutTitle"), description: t("aboutDescription") },
  };
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = locale as "en" | "fr";
  const about = await getAboutContent();
  const portrait = about.images.portrait;
  const approachImage = about.images.approach;
  return (
    <main id="main-content" className="inner-page about-page paper-surface">
      <section className="about-hero dark-surface section-pad">
        <div className="about-hero-copy" data-reveal>
          <p className="eyebrow">{about.hero.eyebrow[activeLocale]}</p>
          <h1>{about.hero.title[activeLocale]}</h1>
          <p>{about.hero.bio[activeLocale]}</p>
        </div>
        <div className="about-portrait-placeholder">
          {portrait.src && portrait.width && portrait.height ? (
            <div className="portrait-frame about-managed-card-image">
              <Image
                src={portrait.src}
                alt={portrait.alt[activeLocale]}
                fill
                sizes="(max-width: 760px) 88vw, 42vw"
                style={{
                  objectPosition: `${portrait.focusX}% ${portrait.focusY}%`,
                }}
              />
            </div>
          ) : (
            <div
              className="portrait-frame"
              role="img"
              aria-label="Abstract AX7MOV viewfinder artwork"
            >
              <span>AX7</span>
              <i />
              <b>PORTRAIT / FALLBACK</b>
            </div>
          )}
        </div>
      </section>
      <section className="stats-row paper-surface">
        {about.stats.map((stat, index) => (
          <div key={index}>
            <strong>{stat.value[activeLocale]}</strong>
            <span>{stat.label[activeLocale]}</span>
          </div>
        ))}
      </section>
      <section className="approach-section section-pad">
        {approachImage.src && approachImage.width && approachImage.height ? (
          <div className="approach-art about-approach-managed" data-parallax>
            <Image
              src={approachImage.src}
              alt={approachImage.alt[activeLocale]}
              fill
              sizes="(max-width: 760px) 100vw, 44vw"
              style={{
                objectPosition: `${approachImage.focusX}% ${approachImage.focusY}%`,
              }}
            />
          </div>
        ) : (
          <div className="approach-art" data-parallax aria-hidden="true">
            <div className="film-strip">
              {Array.from({ length: 7 }).map((_, index) => (
                <i key={index} />
              ))}
            </div>
            <div className="aperture-large">
              <span>f / 2.8</span>
            </div>
          </div>
        )}
        <div data-reveal>
          <p className="eyebrow">{about.approach.eyebrow[activeLocale]}</p>
          <h2>{about.approach.title[activeLocale]}</h2>
          <p>{about.approach.body[activeLocale]}</p>
          <aside>{about.approach.note[activeLocale]}</aside>
        </div>
      </section>
      <section className="process-section teal-surface section-pad">
        <div className="section-heading split-heading" data-reveal>
          <div>
            <p className="eyebrow">{about.process.eyebrow[activeLocale]}</p>
            <h2>{about.process.title[activeLocale]}</h2>
          </div>
          <p>{about.process.estimate[activeLocale]}</p>
        </div>
        <ol className="process-grid">
          {about.process.steps.map((step, index) => (
            <li key={index} data-reveal>
              <span>0{index + 1}</span>
              <h3>{step.title[activeLocale]}</h3>
              <p>{step.body[activeLocale]}</p>
            </li>
          ))}
        </ol>
        <Link className="button button-peach" href="/contact">
          {about.process.contactLabel[activeLocale]} <ArrowIcon />
        </Link>
      </section>
    </main>
  );
}
