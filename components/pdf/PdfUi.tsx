import Link from "next/link";
import { BuyButton as SharedBuyButton } from "@/components/BuyButton";
import { LegalLinks } from "@/components/Legal";
import { getProduct, SUPPORT_EMAIL } from "@/lib/products";

// Shared building blocks for /pdf and its guide pages (/pdf/<guide>), so they all handle the
// coming-soon state the same way and look like one product page.

export const PDF_PRODUCT = getProduct("pdf");
export const PDF_AVAILABLE = PDF_PRODUCT.status === "available";
// Counted: /api/download logs the click, then redirects to the installer.
export const PDF_DOWNLOAD_URL = `/api/download/${PDF_PRODUCT.slug}`;
export const PDF_OG_IMAGE = "/brand/revinhi-pdf.png";

export const PDF_GUIDES: { slug: string; label: string; blurb: string }[] = [
  { slug: "edit-pdf-text", label: "Edit PDF text", blurb: "Retype the words already in a PDF." },
  { slug: "sign-pdf", label: "Sign a PDF", blurb: "Draw, type or upload a signature, offline." },
  { slug: "compress-pdf", label: "Compress a PDF", blurb: "Shrink big files without uploading them." },
  { slug: "merge-pdf", label: "Merge PDFs", blurb: "Combine files and put pages in order." },
  { slug: "adobe-acrobat-alternative", label: "Acrobat alternative", blurb: "A one-time PDF editor for Windows." },
];

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
  const guides = PDF_GUIDES.filter((g) => g.slug !== current);
  return (
    <nav aria-label="RevinHi PDF guides" className="mx-auto max-w-5xl">
      <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">{title}</h2>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/pdf/${g.slug}`}
              className="glass-panel-flat block h-full rounded-2xl p-5 transition hover:bg-white/[0.07]"
            >
              <span className="font-semibold text-white/90">{g.label}</span>
              <span className="mt-1 block text-sm text-white/55">{g.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PdfFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} RevinHi. All rights reserved.</p>
        <LegalLinks />
        <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white/70">
          {SUPPORT_EMAIL}
        </a>
      </div>
    </footer>
  );
}

/** Inline JSON-LD. `<` is escaped so text in the data can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}
