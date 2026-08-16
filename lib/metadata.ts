import type { Metadata } from "next";
import type { Locale } from "./content";
import { SITE_URL } from "./config";

const values = {
  en: {
    home: ["AX7MOV — Photography & Videography in Paris", "Cinematic photography and videography by Athulkrishna in Paris, specialising in automotive, portraits, personalised ads and intimate events."],
    about: ["About Athulkrishna — AX7MOV", "Meet Athulkrishna, the Paris-based photographer and filmmaker behind independent visual studio AX7MOV."],
    gallery: ["Photography & Film Gallery — AX7MOV", "Selected automotive, portrait, advertising and intimate-event photography and films by AX7MOV."],
    contact: ["Contact AX7MOV — Photography & Film in Paris", "Discuss a photography or videography project with Athulkrishna in Paris or on location."],
    studio: ["Content Studio — AX7MOV", "Manage AX7MOV portfolio projects and selected Instagram content with Sanity."],
  },
  fr: {
    home: ["AX7MOV — Photographe & Vidéaste à Paris", "Photographies et films cinématographiques d’Athulkrishna à Paris : automobile, portraits, publicité sur mesure et événements intimes."],
    about: ["À propos d’Athulkrishna — AX7MOV", "Découvrez Athulkrishna, photographe et réalisateur à Paris, fondateur du studio visuel indépendant AX7MOV."],
    gallery: ["Galerie Photo & Film — AX7MOV", "Une sélection de photographies et films automobiles, portraits, publicités et événements intimes par AX7MOV."],
    contact: ["Contacter AX7MOV — Photo & Film à Paris", "Échangez avec Athulkrishna autour d’un projet photo ou vidéo à Paris ou en déplacement."],
    studio: ["Studio de contenu — AX7MOV", "Gérez les projets AX7MOV et la sélection Instagram avec Sanity."],
  },
} as const;

export type PageKey = keyof typeof values.en;
export function pageMetadata(locale: Locale, page: PageKey, path = ""): Metadata {
  const [title, description] = values[locale][page];
  const url = `${SITE_URL}/${locale}${path}`;
  const otherLocale = locale === "en" ? "fr" : "en";
  return {
    title, description,
    alternates: { canonical: url, languages: { en: `${SITE_URL}/en${path}`, fr: `${SITE_URL}/fr${path}`, "x-default": `${SITE_URL}/en${path}` } },
    openGraph: { title, description, url, siteName: "AX7MOV", locale: locale === "en" ? "en_US" : "fr_FR", alternateLocale: locale === "en" ? ["fr_FR"] : ["en_US"], type: "website", images: [{ url: `${SITE_URL}/og.png`, width: 1536, height: 1024, alt: "AX7MOV — Motion and light" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og.png`] },
    other: { "content-language": locale, "alternate-locale": otherLocale },
  };
}

