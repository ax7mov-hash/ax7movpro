import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AX7MOV — Photographer & Filmmaker",
    short_name: "AX7MOV",
    description:
      "Cinematic photography and filmmaking by Athulkrishna in Paris.",
    start_url: "/en",
    display: "standalone",
    background_color: "#0F3040",
    theme_color: "#0F3040",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
