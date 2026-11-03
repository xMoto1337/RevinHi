import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const SITE_TITLE = "RevinHi: 3D Modeling, PDF Editor & File Recovery for Windows";
const SITE_DESCRIPTION =
  "Windows 10/11 apps you buy once: a 3D modeling app, an offline PDF editor, file recovery, live wallpapers and a game optimizer. Free versions to try.";

// Search engine ownership checks (docs/SEO.md). Paste just the code (the content="..." value) into the
// Vercel env var and redeploy; nothing is output while a var is empty. Google is also verified by
// public/google17a71e2cebed7c44.html and Bing by public/BingSiteAuth.xml, so these are optional.
const GOOGLE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const BING_VERIFICATION = process.env.BING_SITE_VERIFICATION?.trim();
const OG_IMAGE = { url: "/brand/revinhi-brand.png", width: 512, height: 512, alt: "RevinHi logo" };

// Defaults for every page. Pages override title/description/canonical via pageMetadata() in lib/seo.ts;
// a page that only sets a plain title gets the "| RevinHi" suffix from the template.
export const metadata: Metadata = {
  metadataBase: new URL("https://revinhi.com"),
  title: { default: SITE_TITLE, template: "%s | RevinHi" },
  description: SITE_DESCRIPTION,
  openGraph: { title: SITE_TITLE, description: SITE_DESCRIPTION, url: "https://revinhi.com", siteName: "RevinHi", type: "website", images: [OG_IMAGE] },
  twitter: { card: "summary", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [OG_IMAGE.url] },
  ...(GOOGLE_VERIFICATION || BING_VERIFICATION
    ? {
        verification: {
          ...(GOOGLE_VERIFICATION ? { google: GOOGLE_VERIFICATION } : {}),
          ...(BING_VERIFICATION ? { other: { "msvalidate.01": BING_VERIFICATION } } : {}),
        },
      }
    : {}),
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
