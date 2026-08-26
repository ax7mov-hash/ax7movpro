"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "./icons";

const nav = [
  ["home", "/"],
  ["about", "/about"],
  ["gallery", "/gallery"],
  ["contact", "/contact"],
] as const;

export function Header() {
  const t = useTranslations("Nav");
  const locale = useLocale() as "en" | "fr";
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const current = document.documentElement.dataset.theme;
    const themeTimer = window.setTimeout(
      () => setTheme(current === "light" ? "light" : "dark"),
      0,
    );
    return () => {
      window.clearTimeout(themeTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-is-open", menuOpen);
    if (!menuOpen) return () => document.body.classList.remove("menu-is-open");
    const focusable = Array.from(
      mobileMenuRef.current?.querySelectorAll<HTMLElement>("a, button") ?? [],
    );
    const focusTimer = window.setTimeout(() => focusable[0]?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key === "Tab" && focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("menu-is-open");
    };
  }, [menuOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("ax7-theme", next);
    setTheme(next);
  }

  function switchLocale() {
    router.replace(pathname, { locale: locale === "en" ? "fr" : "en" });
  }

  return (
    <>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
        <Link href="/" className="brand-link" aria-label="AX7MOV home">
          <Logo />
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map(([key, href]) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="locale-toggle"
            onClick={switchLocale}
            aria-label={t("language")}
          >
            <span className={locale === "en" ? "is-active" : ""}>EN</span>
            <span>/</span>
            <span className={locale === "fr" ? "is-active" : ""}>FR</span>
          </button>
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            aria-label={t("theme")}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            ref={menuButtonRef}
            type="button"
            className="icon-button menu-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t("closeMenu") : t("menu")}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu-orbit" aria-hidden="true" />
        <nav aria-label="Mobile navigation">
          {nav.map(([key, href], index) => (
            <Link
              key={key}
              href={href}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
            >
              <span>0{index + 1}</span>
              {t(key)}
            </Link>
          ))}
        </nav>
        <p>
          Paris, France
          <br />
          +91 73564 48023
        </p>
      </div>
    </>
  );
}
