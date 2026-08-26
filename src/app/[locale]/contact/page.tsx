import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { contact } from "@/lib/media";
import {
  ArrowIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/site/icons";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { en: "/en/contact", fr: "/fr/contact" },
    },
    openGraph: {
      title: t("contactTitle"),
      description: t("contactDescription"),
      url: `/${locale}/contact`,
    },
    twitter: { title: t("contactTitle"), description: t("contactDescription") },
  };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contact");
  const activeLocale = locale as "en" | "fr";
  const actions = [
    {
      title: t("whatsapp"),
      detail: t("whatsappDetail"),
      value: contact.phoneDisplay,
      href: contact.whatsapp[activeLocale],
      icon: <WhatsAppIcon />,
      external: true,
    },
    {
      title: t("email"),
      detail: t("emailDetail"),
      value: contact.email,
      href: contact.emailLink,
      icon: <MailIcon />,
      external: false,
    },
    {
      title: t("phone"),
      detail: t("phoneDetail"),
      value: contact.phoneDisplay,
      href: contact.phoneLink,
      icon: <PhoneIcon />,
      external: false,
    },
    {
      title: t("instagram"),
      detail: t("instagramDetail"),
      value: "@ax7.mov",
      href: contact.instagram,
      icon: <InstagramIcon />,
      external: true,
    },
  ];
  const details = [
    [t("location"), t("locationValue")],
    [t("service"), t("serviceValue")],
    [t("pricing"), t("pricingValue")],
    [t("availability"), t("availabilityValue")],
  ];
  return (
    <main id="main-content" className="inner-page contact-page paper-surface">
      <section className="contact-hero dark-surface section-pad">
        <div className="contact-orbit" aria-hidden="true">
          <i />
          <i />
        </div>
        <div data-reveal>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
      </section>
      <section className="contact-content section-pad">
        <div className="contact-actions">
          {actions.map((action, index) => (
            <a
              key={action.title}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noopener noreferrer" : undefined}
              data-reveal
            >
              <span className="contact-icon">{action.icon}</span>
              <span className="contact-action-copy">
                <small>0{index + 1}</small>
                <strong>{action.title}</strong>
                <em>{action.detail}</em>
                <b>{action.value}</b>
              </span>
              <ArrowIcon />
            </a>
          ))}
        </div>
        <aside className="project-details" data-reveal>
          <p className="eyebrow">{t("details")}</p>
          <dl>
            {details.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>
    </main>
  );
}
