import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StarSprout - Build Habits Through Quests",
    short_name: "StarSprout",
    description: "A trust-first, playful quest system for children to build habits with parent insights",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.jpg",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.jpg",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    categories: ["education", "lifestyle", "productivity"],
    screenshots: [
      {
        src: "/screenshot-1.png",
        sizes: "1170x2532",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/screenshot-2.png",
        sizes: "2048x1536",
        type: "image/png",
        form_factor: "wide",
      },
    ],
  }
}
