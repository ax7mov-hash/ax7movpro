import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MotionProvider } from "@/components/site/motion-provider";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { LocaleDocument } from "@/components/i18n/locale-document";

export const metadata: Metadata = {
  metadataBase: new URL("https://ax7mov.com"),
  applicationName: "AX7MOV",
  authors: [{ name: "Athulkrishna" }],
  creator: "Athulkrishna",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon-light.png",
        type: "image/png",
        sizes: "64x64",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.png",
        type: "image/png",
        sizes: "64x64",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    siteName: "AX7MOV",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AX7MOV — Stories framed in motion",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleDocument />
      <a className="skip-link" href="#main-content">
        {messages.Nav.skip as string}
      </a>
      <Header />
      {children}
      <Footer />
      <WhatsAppButton />
      <MotionProvider />
    </NextIntlClientProvider>
  );
}
