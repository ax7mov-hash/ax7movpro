import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { contact } from "@/lib/media";
import { ArrowIcon, InstagramIcon } from "./icons";

export async function Footer() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Logo />
          <p>{t("tagline")}</p>
        </div>
        <div className="footer-links">
          <Link href="/">{nav("home")}</Link>
          <Link href="/about">{nav("about")}</Link>
          <Link href="/gallery">{nav("gallery")}</Link>
          <Link href="/contact">{nav("contact")}</Link>
        </div>
        <div className="footer-social">
          <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
            <InstagramIcon /> Instagram
          </a>
          <a href="#top">
            {t("backTop")} <ArrowIcon />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>{t("location")}</span>
        <span>{t("rights", { year: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}
