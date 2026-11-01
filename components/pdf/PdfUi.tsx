import { BuyButton as SharedBuyButton } from "@/components/BuyButton";
import { SiteFooter } from "@/components/SiteFooter";
import { GuideLinks } from "@/components/guides/GuideLinks";
import { guidesFor } from "@/lib/guides";
import { getProduct } from "@/lib/products";

// Shared building blocks for /pdf and its guide pages (/pdf/<guide>), so they all handle the
// coming-soon state the same way and look like one product page.

export const PDF_PRODUCT = getProduct("pdf");
export const PDF_AVAILABLE = PDF_PRODUCT.status === "available";
// Counted: /api/download logs the click, then redirects to the installer.
export const PDF_DOWNLOAD_URL = `/api/download/${PDF_PRODUCT.slug}`;
export const PDF_OG_IMAGE = "/brand/revinhi-pdf.png";
// Portable build (zip, runs from a USB stick). Served straight from /public, like the installer file.
export const PDF_PORTABLE_URL = "/downloads/RevinHi-PDF-Portable.zip";

/** Every /pdf/<slug> guide (the list lives in lib/guides.ts). */
export const PDF_GUIDES = guidesFor("pdf");

export function PdfBuyButton(props: { className?: string; chase?: boolean; wrapperClassName?: string }) {
  return <SharedBuyButton product={PDF_PRODUCT} label={<>Get Pro &mdash; {PDF_PRODUCT.price}</>} {...props} />;
}

export function PdfDownloadButton({ className = "" }: { className?: string }) {
  if (!PDF_AVAILABLE) {
    return (
      <span
        className={`inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 font-semibold text-white/50 ${className}`}
      >
        Free download coming soon
      </span>
    );
  }
  return (
    <a
      href={PDF_DOWNLOAD_URL}
      download
      className={`inline-flex items-center justify-center rounded-full bg-neon-cyan px-7 py-3 font-semibold text-black shadow-[0_0_30px_rgba(0,229,255,0.35)] transition hover:scale-[1.02] ${className}`}
    >
      Download free
    </a>
  );
}

/** Secondary link to the portable (USB) zip, shown under the main download button. */
export function PdfPortableLink({ className = "" }: { className?: string }) {
  if (!PDF_AVAILABLE) return null;
  return (
    <p className={`text-xs text-white/45 ${className}`}>
      <a
        href={PDF_PORTABLE_URL}
        download
        className="font-semibold text-neon-cyan underline-offset-4 transition hover:underline"
      >
        Portable (USB) version
      </a>
      {" "}&middot; Runs from a USB stick &mdash; no install, settings travel with it.
    </p>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-white/60">{subtitle}</p>}
    </div>
  );
}

/** Row of links to the PDF guide pages. `current` hides the page you're on. */
export function PdfGuideLinks({ current, title = "Guides" }: { current?: string; title?: string }) {
  return <GuideLinks product="pdf" current={current} title={title} />;
}

/** The site-wide footer (kept under this name for the pages that import it from here). */
export const PdfFooter = SiteFooter;

/** Inline JSON-LD. `<` is escaped so text in the data can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}
