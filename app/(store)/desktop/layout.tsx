import type { Metadata } from "next";

const TITLE = "RevinHi Desktop - Make your Windows desktop come alive";
const DESCRIPTION =
  "Live wallpapers, custom widgets, rain & snow effects, and a live US weather radar with lightning strikes - right on your Windows 10/11 desktop. Free to download - Pro is $9.99 once, free updates forever.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://revinhi.com/desktop",
    siteName: "RevinHi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
