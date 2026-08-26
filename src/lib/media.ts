export type MediaItem = {
  id: string;
  src?: string;
  width?: number;
  height?: number;
  mediaType: "photo" | "video";
  title: { en: string; fr: string };
  description: { en: string; fr: string };
  alt: { en: string; fr: string };
  area:
    | "automotive"
    | "personalised-ads"
    | "portraits"
    | "small-events"
    | "editorial";
  featured: boolean;
  objectPosition?: string;
};

export const mediaItems: MediaItem[] = [
  {
    id: "midnight-velocity",
    src: "/media/midnight-velocity.png",
    width: 1829,
    height: 860,
    mediaType: "photo",
    title: { en: "Midnight Velocity", fr: "Vélocité nocturne" },
    description: {
      en: "A cinematic automotive study tracing rain, reflections, and city light.",
      fr: "Une étude automobile cinématographique entre pluie, reflets et lumières urbaines.",
    },
    alt: {
      en: "Dark sports car on a rain-lit city boulevard at night",
      fr: "Voiture de sport sombre sur un boulevard nocturne éclairé par la pluie",
    },
    area: "automotive",
    featured: true,
    objectPosition: "center 54%",
  },
  {
    id: "obsidian-geometry",
    src: "/media/mercedes-front.jpg",
    width: 1800,
    height: 2400,
    mediaType: "photo",
    title: { en: "Obsidian Geometry", fr: "Géométrie d’obsidienne" },
    description: {
      en: "Front-on lines, deep reflections, and a quiet mechanical presence.",
      fr: "Lignes frontales, reflets profonds et présence mécanique silencieuse.",
    },
    alt: {
      en: "Front view of a black Mercedes with its headlights illuminated",
      fr: "Vue de face d’une Mercedes noire aux phares allumés",
    },
    area: "automotive",
    featured: true,
    objectPosition: "center 72%",
  },
  {
    id: "redline-detail",
    src: "/media/audi-detail.jpg",
    width: 1350,
    height: 2400,
    mediaType: "photo",
    title: { en: "Redline Detail", fr: "Détail rouge" },
    description: {
      en: "A close study of grille, headlight, and warm evening bokeh.",
      fr: "Une étude rapprochée de la calandre, du phare et du bokeh du soir.",
    },
    alt: {
      en: "Close front detail of a black Audi with a red headlight accent",
      fr: "Détail avant d’une Audi noire avec une signature lumineuse rouge",
    },
    area: "automotive",
    featured: true,
  },
  {
    id: "still-redline",
    src: "/media/audi-front.jpg",
    width: 1350,
    height: 2400,
    mediaType: "photo",
    title: { en: "Still Redline", fr: "Ligne rouge immobile" },
    description: {
      en: "An understated portrait built from symmetry, shadow, and fallen leaves.",
      fr: "Un portrait tout en retenue, construit par la symétrie, l’ombre et les feuilles au sol.",
    },
    alt: {
      en: "Black Audi photographed from the front on a leaf-strewn driveway",
      fr: "Audi noire photographiée de face sur une allée couverte de feuilles",
    },
    area: "automotive",
    featured: true,
  },
  {
    id: "acid-profile",
    src: "/media/skoda-profile.jpg",
    width: 1350,
    height: 2400,
    mediaType: "photo",
    title: { en: "Acid Profile", fr: "Profil acide" },
    description: {
      en: "A vivid performance silhouette held against muted architecture.",
      fr: "Une silhouette performante et vive détachée sur une architecture sourde.",
    },
    alt: {
      en: "Bright green modified sedan photographed in three-quarter profile",
      fr: "Berline modifiée vert vif photographiée de trois quarts",
    },
    area: "automotive",
    featured: true,
  },
  {
    id: "green-canopy",
    src: "/media/skoda-angle.jpg",
    width: 1350,
    height: 2400,
    mediaType: "photo",
    title: { en: "Green Canopy", fr: "Sous la canopée" },
    description: {
      en: "Machine and landscape meet in a frame of sharp color and soft foliage.",
      fr: "Machine et paysage se rencontrent entre couleur franche et feuillage adouci.",
    },
    alt: {
      en: "Bright green sedan beneath dense trees in a tilted composition",
      fr: "Berline vert vif sous des arbres denses dans une composition inclinée",
    },
    area: "automotive",
    featured: false,
    objectPosition: "center 75%",
  },
  {
    id: "rain-patina",
    src: "/media/honda-rain.jpg",
    width: 1350,
    height: 2400,
    mediaType: "photo",
    title: { en: "Rain Patina", fr: "Patine de pluie" },
    description: {
      en: "A weathered turquoise body caught beneath rain-darkened trees.",
      fr: "Une carrosserie turquoise patinée saisie sous des arbres assombris par la pluie.",
    },
    alt: {
      en: "Turquoise older sedan covered in rain beneath leafy trees",
      fr: "Ancienne berline turquoise sous la pluie et les arbres feuillus",
    },
    area: "automotive",
    featured: false,
  },
];

export const instagramItems = mediaItems.filter((item) =>
  ["redline-detail", "acid-profile", "rain-patina"].includes(item.id),
);

export const contact = {
  phoneDisplay: "+91 73564 48023",
  phoneLink: "tel:+917356448023",
  email: "athulkrishnans@gmail.com",
  emailLink: "mailto:athulkrishnans@gmail.com",
  instagram: "https://www.instagram.com/ax7mov?igsh=ZDRja3FhOGd4NTQ3",
  whatsapp: {
    en: "https://wa.me/917356448023?text=Hello%2C%20I%20found%20your%20portfolio%20and%20would%20like%20to%20discuss%20a%20photography%20or%20videography%20project.",
    fr: "https://wa.me/917356448023?text=Bonjour%2C%20j%27ai%20d%C3%A9couvert%20votre%20portfolio%20et%20j%27aimerais%20%C3%A9changer%20sur%20un%20projet%20de%20photographie%20ou%20de%20vid%C3%A9ographie.",
  },
} as const;
