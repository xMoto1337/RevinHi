import type { MetadataRoute } from "next";

// Gives browsers full-size icons for bookmarks, shortcuts and "install site".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RevinHi",
    short_name: "RevinHi",
    start_url: "/",
    display: "browser",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
