import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const SITE_TITLE = "RevinHi - Apps that upgrade your PC";
const SITE_DESCRIPTION =
  "RevinHi makes small Windows apps that upgrade your PC - a safe game optimizer and live desktop wallpapers, widgets and weather radar. One-time price, free updates forever.";

export const metadata: Metadata = {
  metadataBase: new URL("https://revinhi.com"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: { title: SITE_TITLE, description: SITE_DESCRIPTION, url: "https://revinhi.com", siteName: "RevinHi", type: "website" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="bg-orbs" aria-hidden="true" />
        {children}
        {/* Gumroad's overlay checkout script - lets any <a href="https://*.gumroad.com/l/..."> open a payment
            overlay on top of this page instead of redirecting away to gumroad.com. */}
        <Script src="https://gumroad.com/js/gumroad.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
