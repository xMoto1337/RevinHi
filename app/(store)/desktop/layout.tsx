import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "RevinHi Desktop - Live wallpapers, widgets and radar",
  description:
    "Live wallpapers, custom widgets, rain and snow effects and a live US weather radar on Windows 10/11. Free download, Pro is $9.99 once.",
  path: "/desktop",
  image: "/brand/revinhi-desktop.png",
  imageAlt: "RevinHi Desktop app icon",
});

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
