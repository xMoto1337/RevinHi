import type { Metadata } from "next";

const TITLE = "RevinHi Performance - Safe, reversible Windows game optimizer";
const DESCRIPTION =
  "RevinHi Performance is a Windows optimizer built for gamers - safe, reversible tweaks to cut input lag and squeeze more FPS out of your PC.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://revinhi.com/performance", siteName: "RevinHi", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
