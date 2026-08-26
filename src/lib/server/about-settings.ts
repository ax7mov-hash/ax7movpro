import "server-only";
import type {
  AboutInput,
  AdminAboutSettings,
  PublicAboutContent,
} from "@/lib/admin/about-schema";
import { getMongoDb } from "./mongodb";

type AboutSettingsDocument = AboutInput & {
  key: "about";
  createdAt: Date;
  updatedAt: Date;
  updatedBy: "admin";
};

const emptyImage = {
  src: "",
  alt: { en: "", fr: "" },
  focusX: 50,
  focusY: 50,
};

const fallbackAbout: AboutInput = {
  home: {
    eyebrow: { en: "Behind AX7MOV", fr: "Derrière AX7MOV" },
    title: {
      en: "A patient eye for light, detail, and natural movement.",
      fr: "Un regard attentif à la lumière, au détail et au mouvement naturel.",
    },
    body: {
      en: "Athulkrishna is a Paris-based photographer and filmmaker working under the name AX7MOV. With more than two years of experience, he creates cinematic imagery for people, independent brands, automobiles, and small events. His work combines thoughtful composition, natural movement, and atmospheric light to turn everyday moments into memorable visual stories.",
      fr: "Athulkrishna est un photographe et cinéaste basé à Paris, sous le nom d’AX7MOV. Fort de plus de deux ans d’expérience, il crée des images cinématographiques pour les personnes, les marques indépendantes, les automobiles et les petits événements. Son travail mêle composition réfléchie, mouvement naturel et lumière atmosphérique pour transformer le quotidien en récits visuels mémorables.",
    },
    linkLabel: {
      en: "More about Athulkrishna",
      fr: "Découvrir Athulkrishna",
    },
  },
  hero: {
    eyebrow: {
      en: "The person behind the lens",
      fr: "La personne derrière l’objectif",
    },
    title: {
      en: "Instinct, atmosphere, and a quiet kind of precision.",
      fr: "Instinct, atmosphère et précision silencieuse.",
    },
    bio: {
      en: "Athulkrishna is a Paris-based freelance photographer and filmmaker working under the name AX7MOV. With more than two years of experience, he creates cinematic imagery for people, independent brands, automobiles, and small events. His work combines thoughtful composition, natural movement, and atmospheric light to turn everyday moments into memorable visual stories.",
      fr: "Athulkrishna est un photographe et cinéaste freelance basé à Paris, sous le nom d’AX7MOV. Fort de plus de deux ans d’expérience, il crée des images cinématographiques pour les personnes, les marques indépendantes, les automobiles et les petits événements. Son travail mêle composition réfléchie, mouvement naturel et lumière atmosphérique pour transformer le quotidien en récits visuels mémorables.",
    },
  },
  stats: [
    {
      value: { en: "2+ years", fr: "2+ ans" },
      label: {
        en: "creating visual stories",
        fr: "à créer des récits visuels",
      },
    },
    {
      value: { en: "Paris, France", fr: "Paris, France" },
      label: {
        en: "primary service area",
        fr: "zone de service principale",
      },
    },
    {
      value: { en: "Freelance", fr: "Freelance" },
      label: {
        en: "available by project",
        fr: "disponible sur projet",
      },
    },
  ],
  approach: {
    eyebrow: { en: "Creative approach", fr: "Approche créative" },
    title: {
      en: "Compose with intention. Leave room for life.",
      fr: "Composer avec intention. Laisser vivre l’instant.",
    },
    body: {
      en: "Every project starts with the emotion it needs to carry. From there, the frame is built around real movement, tactile detail, and light that feels lived-in rather than imposed.",
      fr: "Chaque projet commence par l’émotion qu’il doit transmettre. Le cadre se construit ensuite autour du mouvement réel, des détails tactiles et d’une lumière vécue plutôt qu’imposée.",
    },
    note: {
      en: "The current portfolio imagery centres on automotive work. Portrait, event, and behind-the-scenes selections will be added as those assets become available.",
      fr: "Le portfolio actuel est principalement consacré à l’automobile. Les sélections de portraits, d’événements et de coulisses seront ajoutées dès que ces images seront disponibles.",
    },
  },
  process: {
    eyebrow: { en: "The process", fr: "Le processus" },
    title: {
      en: "Clear enough to trust. Flexible enough to feel natural.",
      fr: "Assez clair pour inspirer confiance. Assez souple pour rester naturel.",
    },
    estimate: {
      en: "Project estimates depend on scope, production needs, and travel distance.",
      fr: "Les estimations dépendent de l’ampleur du projet, des besoins de production et de la distance à parcourir.",
    },
    steps: [
      {
        title: { en: "Discover", fr: "Découvrir" },
        body: {
          en: "Understand the story, audience, location, and desired mood.",
          fr: "Comprendre l’histoire, le public, le lieu et l’atmosphère souhaitée.",
        },
      },
      {
        title: { en: "Plan", fr: "Préparer" },
        body: {
          en: "Develop the visual direction, schedule, and practical production details.",
          fr: "Définir la direction visuelle, le calendrier et les détails pratiques de production.",
        },
      },
      {
        title: { en: "Create", fr: "Créer" },
        body: {
          en: "Photograph or film with an emphasis on natural movement and cinematic light.",
          fr: "Photographier ou filmer en privilégiant le mouvement naturel et la lumière cinématographique.",
        },
      },
      {
        title: { en: "Deliver", fr: "Livrer" },
        body: {
          en: "Edit, refine, and provide optimized final assets.",
          fr: "Monter, retoucher et fournir des fichiers finaux optimisés.",
        },
      },
    ],
    contactLabel: { en: "Contact AX7MOV", fr: "Contacter AX7MOV" },
  },
  images: {
    portrait: { ...emptyImage },
    approach: { ...emptyImage },
  },
};

export function getFallbackAbout(): AboutInput {
  return structuredClone(fallbackAbout);
}

function toAdminSettings(row: AboutSettingsDocument): AdminAboutSettings {
  return {
    home: row.home,
    hero: row.hero,
    stats: row.stats,
    approach: row.approach,
    process: row.process,
    images: row.images,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAdminAboutSettings() {
  const db = await getMongoDb();
  const row = await db
    .collection<AboutSettingsDocument>("siteSettings")
    .findOne({ key: "about" });
  return row ? toAdminSettings(row) : null;
}

export async function getPublishedAbout(): Promise<PublicAboutContent> {
  const settings = await getAdminAboutSettings();
  if (!settings) return { ...getFallbackAbout(), managed: false };
  return {
    home: settings.home,
    hero: settings.hero,
    stats: settings.stats,
    approach: settings.approach,
    process: settings.process,
    images: settings.images,
    managed: true,
  };
}

export async function updateAboutSettings(input: AboutInput) {
  const db = await getMongoDb();
  const now = new Date();
  const result = await db
    .collection<AboutSettingsDocument>("siteSettings")
    .findOneAndUpdate(
      { key: "about" },
      {
        $set: { ...input, updatedAt: now, updatedBy: "admin" },
        $setOnInsert: { key: "about", createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
  if (!result) throw new Error("UPDATE_FAILED");
  return toAdminSettings(result);
}

export async function clearAboutSettings() {
  const db = await getMongoDb();
  const result = await db
    .collection<AboutSettingsDocument>("siteSettings")
    .findOneAndDelete({ key: "about" });
  return result ? toAdminSettings(result) : null;
}
