"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { copy, type Locale } from "@/lib/content";
import { EMAIL, INSTAGRAM, PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from "@/lib/config";
import { Logo } from "./Logo";
import { MotionProvider } from "./MotionProvider";

export function SiteChrome({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = copy[locale];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const alternate = pathname.replace(/^\/(en|fr)/, locale === "en" ? "/fr" : "/en");
  const nav = [[t.nav.home, `/${locale}`], [t.nav.about, `/${locale}/about`], [t.nav.gallery, `/${locale}/gallery`], [t.nav.contact, `/${locale}/contact`]];

  useEffect(() => { const update = () => setScrolled(window.scrollY > 32); update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden"; firstLink.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return <>
    <MotionProvider />
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <Link href={`/${locale}`} aria-label="AX7MOV home"><Logo light /></Link>
      <nav className="desktop-nav" aria-label="Primary navigation">{nav.map(([label, href]) => <Link key={href} className={pathname === href ? "active" : ""} href={href}>{label}</Link>)}</nav>
      <div className="header-actions">
        <Link className="language-switch" href={alternate} hrefLang={locale === "en" ? "fr" : "en"} aria-label={locale === "en" ? "Passer en français" : "Switch to English"}>{locale === "en" ? "FR" : "EN"}</Link>
        <a className="header-talk" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{t.nav.talk} <span aria-hidden="true">↗</span></a>
        <button ref={menuButton} className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t.nav.close : t.nav.menu} onClick={() => setOpen((value) => !value)}><span /><span /></button>
      </div>
    </header>
    <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <nav aria-label="Mobile navigation">{nav.map(([label, href], index) => <Link ref={index === 0 ? firstLink : undefined} key={href} href={href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}</Link>)}</nav>
      <div className="mobile-menu-foot"><a href={`mailto:${EMAIL}`}>{EMAIL}</a><p>Paris, France</p></div>
    </div>
    {children}
    <a className="floating-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label={t.contactWhatsApp}><span className="wa-icon" aria-hidden="true">↗</span><span>WhatsApp</span></a>
    <footer className="site-footer">
      <div className="footer-lead"><Logo light /><p>{t.footerLine}</p></div>
      <nav aria-label="Footer navigation">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="footer-contact"><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href={`mailto:${EMAIL}`}>{EMAIL}</a><a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} AX7MOV</span><span>Paris, France</span><Link href={alternate}>{locale === "en" ? "Français" : "English"}</Link></div>
    </footer>
  </>;
}
