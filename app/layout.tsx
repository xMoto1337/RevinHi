import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const SITE_TITLE = "RevinHi - Windows apps for your PC, no subscription";
const SITE_DESCRIPTION =
  "Small Windows 10/11 apps that upgrade your PC: a game optimizer, live wallpapers and radar, and an offline PDF editor. Pay once, free updates.";
const OG_IMAGE = { url: "/brand/revinhi-brand.png", width: 512, height: 512, alt: "RevinHi logo" };

// Defaults for every page. Pages override title/description/canonical via pageMetadata() in lib/seo.ts;
// a page that only sets a plain title gets the "| RevinHi" suffix from the template.
export const metadata: Metadata = {
  metadataBase: new URL("https://revinhi.com"),
  title: { default: SITE_TITLE, template: "%s | RevinHi" },
  description: SITE_DESCRIPTION,
  openGraph: { title: SITE_TITLE, description: SITE_DESCRIPTION, url: "https://revinhi.com", siteName: "RevinHi", type: "website", images: [OG_IMAGE] },
  twitter: { card: "summary", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [OG_IMAGE.url] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="bg-orbs" aria-hidden="true" />
        {children}
        <Analytics />
        {/* Gumroad's overlay checkout script - lets any <a href="https://*.gumroad.com/l/..."> open a payment
            overlay on top of this page instead of redirecting away to gumroad.com. */}
        <Script src="https://gumroad.com/js/gumroad.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
