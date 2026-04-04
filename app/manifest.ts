import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VerseQuest",
    short_name: "VerseQuest",
    description: "Rangkaian baca Alkitab harian",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#534AB7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
