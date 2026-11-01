import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Live Wallpaper App for Windows | RevinHi Desktop",
  description:
    "Live wallpapers for Windows 10/11: animated scenes, your own videos, widgets, rain and snow, and a live US weather radar. Free download, Pro $9.99 once.",
  path: "/desktop",
  image: "/brand/revinhi-desktop.png",
  imageAlt: "RevinHi Desktop app icon",
});

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
