import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "RevinHi Performance",
  description:
    "RevinHi Performance is a Windows optimizer built for gamers - safe, reversible tweaks to cut input lag and squeeze more FPS out of your PC.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="bg-orbs" aria-hidden="true" />
        {children}
        {/* Gumroad's overlay checkout script - lets any <a class="gumroad-button"> open a payment
            overlay on top of this page instead of redirecting away to gumroad.com. */}
        <Script src="https://gumroad.com/js/gumroad.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
