import type { Metadata } from "next";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/products";
import {
  JsonLd,
  PDF_AVAILABLE as AVAILABLE,
  PDF_OG_IMAGE,
  PDF_PRODUCT as PRODUCT,
  PdfBuyButton as BuyButton,
  PdfDownloadButton as DownloadButton,
  PdfFooter,
  PdfGuideLinks,
  PdfPortableLink as PortableLink,
  SectionHeading,
} from "@/components/pdf/PdfUi";

export const metadata: Metadata = pageMetadata({
  title: "RevinHi PDF - Offline PDF editor, no subscription",
  description:
    "Offline PDF editor for Windows 10/11: edit text, Fill & Sign, OCR scans, true redaction, merge, compress and protect PDFs. Portable USB version. Free download, Pro is $9.99 once - no subscription.",
  path: "/pdf",
  image: PDF_OG_IMAGE,
  imageAlt: "RevinHi PDF app icon",
});

const DEMOS = [
  { src: "/pdf/clip-sign.mp4", poster: "/pdf/clip-sign-poster.jpg", caption: "Sign in seconds with a saved signature" },
  { src: "/pdf/clip-pages.mp4", poster: "/pdf/clip-pages-poster.jpg", caption: "Drag to reorder, rotate, merge and split" },
  { src: "/pdf/clip-compress.mp4", poster: "/pdf/clip-compress-poster.jpg", caption: "Compress big PDFs for email" },
];

const FEATURES: { title: string; description: string; accent: string; pro?: boolean }[] = [
  {
    title: "Edit existing text",
    description: "Click any line in a PDF and retype it. RevinHi matches the original font, size and color, so the change blends in.",
    accent: "var(--neon-purple)",
    pro: true,
  },
  {
    title: "Add text anywhere",
    description: "Type straight onto the page in wrapping text boxes. 6 fonts, bold, italic, underline, alignment, background, border and rotation, or match the text nearby.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Fill & Sign",
    description: "Drop ✓ ✗ • ◯ ☑ marks that size themselves to checkboxes and lines, tick real form checkboxes, and sign with a saved signature. Flatten when you're done.",
    accent: "var(--neon-amber)",
  },
  {
    title: "Annotate & comment",
    description: "Highlight, underline or strike through selected text, leave sticky-note comments that show up in other PDF readers, and add stamps like Approved, Paid or Signed with the date.",
    accent: "var(--neon-success)",
  },
  {
    title: "Read & find",
    description: "Find with Ctrl+F, select and copy text, fit to width or page, two-page view, night reading and presentation mode. Bookmarks, clickable links, back/forward, and it remembers your place.",
    accent: "var(--neon-danger)",
  },
  {
    title: "Page tools",
    description: "Drag pages to reorder, rotate, crop, duplicate, reverse, delete, extract or insert blanks. Copy pages between tabs, merge files and split by ranges.",
    accent: "var(--neon-purple)",
  },
  {
    title: "OCR, fully offline",
    description: "Make scanned PDFs searchable and selectable without uploading them anywhere. It all runs on your PC.",
    accent: "var(--neon-cyan)",
    pro: true,
  },
  {
    title: "True redaction",
    description: "Black out sensitive text and it's actually removed from the file, not just covered up.",
    accent: "var(--neon-amber)",
    pro: true,
  },
  {
    title: "Convert",
    description: "Turn photos and scans into a PDF, or export pages as PNG / JPG at up to 300 dpi. Pro adds PDF to Word, PDF to text and extract images.",
    accent: "var(--neon-success)",
  },
  {
    title: "Batch & finishing",
    description: "Process many files at once. Add page numbers, headers & footers, Bates numbering, custom watermarks and custom stamps, convert to grayscale, remove blank pages and flatten annotations.",
    accent: "var(--neon-danger)",
    pro: true,
  },
  {
    title: "Compress & protect",
    description: "Shrink image-heavy PDFs, often by 80% or more, and lock files with AES-256 passwords.",
    accent: "var(--neon-purple)",
    pro: true,
  },
  {
    title: "Fast to work in",
    description: "Command palette (Ctrl+K), a shortcut sheet, copy/paste/align/snap/lock objects, print, and autosave with crash recovery. Or run the portable version straight from a USB stick.",
    accent: "var(--neon-cyan)",
  },
];

const TIERS: { feature: string; free: string; pro: string }[] = [
  { feature: "View, find, print, reorder, rotate, crop, split", free: "Included", pro: "Included" },
  { feature: "Add text, Fill & Sign, fill forms", free: "Included", pro: "Included" },
  { feature: "Highlights, comments, stamps", free: "Included", pro: "Included" },
  { feature: "Autosave, portable USB version", free: "Included", pro: "Included" },
  { feature: "Merge", free: "2 files at a time", pro: "Unlimited" },
  { feature: "Saved signatures", free: "1", pro: "Unlimited" },
  { feature: "Images → PDF", free: "Up to 3 images", pro: "Unlimited" },
  { feature: "Edit existing text", free: "-", pro: "Included" },
  { feature: "OCR (searchable scans)", free: "-", pro: "Included" },
  { feature: "True redaction", free: "-", pro: "Included" },
  { feature: "Batch processing", free: "-", pro: "Included" },
  { feature: "PDF → Word, text, images", free: "-", pro: "Included" },
  { feature: "Page numbers, headers/footers, Bates, watermarks", free: "-", pro: "Included" },
  { feature: "Grayscale, remove blank pages, flatten", free: "-", pro: "Included" },
  { feature: "Custom stamps", free: "-", pro: "Included" },
  { feature: "Compress", free: "-", pro: "Included" },
  { feature: "Password protect / unlock", free: "-", pro: "Included" },
  { feature: "Exports", free: "Small watermark", pro: "Clean" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is it really a one-time price?",
    a: `Yes. Pro is ${PRODUCT.price} once, paid through Gumroad. There's no subscription and no account to make, and your Pro key keeps working on every future version.`,
  },
  {
    q: "Does it work offline?",
    a: "Yes. RevinHi PDF runs entirely on your PC and doesn't need an internet connection to open, edit or save files. Your documents are never uploaded anywhere.",
  },
  {
    q: "Is it Windows only?",
    a: "Yes. It's built for Windows 10 and 11 (64-bit). There's no Mac, mobile or web version.",
  },
  {
    q: "What's included in the free version?",
    a: "Viewing with Find, bookmarks and print, page tools (reorder, rotate, crop, duplicate, delete, extract and insert pages), merging 2 files at a time, Add Text, Fill & Sign marks, highlights, sticky-note comments, stamps, drawing, shapes, images and whiteout, filling forms and 1 saved signature. Free exports carry a small RevinHi watermark. Pro removes it and adds editing existing text, OCR, true redaction, batch processing, PDF to Word/text/images, page numbers and watermarks, compress, password protect/unlock and unlimited merging.",
  },
  {
    q: "Is edited text secure redaction?",
    a: "No. Edited text and whiteout are drawn over the original, which stays in the file underneath. To hide sensitive information, use Redact (Pro), which removes the content from the file for good.",
  },
  {
    q: "Is there a portable version?",
    a: "Yes. Download the Portable (USB) zip, unzip it onto a USB stick and run it from there. There's nothing to install, and your settings travel with the stick.",
  },
  {
    q: "How do updates work?",
    a: "The app updates itself, and your Pro key works on every future version, with no subscription.",
  },
  {
    q: "Can I get a refund?",
    a: `Yes, within 24 hours of purchase. Email ${SUPPORT_EMAIL} from the address you bought with. Please try the free version first.`,
  },
  {
    q: "How do I get support?",
    a: `Email ${SUPPORT_EMAIL} and we'll get back to you.`,
  },
];

const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PRODUCT.name,
  description:
    "Offline PDF editor for Windows: edit and add text, Fill & Sign, OCR scanned PDFs, true redaction, annotate, merge, split, compress and password-protect PDFs. Also available as a portable USB version.",
  softwareVersion: "0.2.0",
  url: `${SITE_URL}/pdf`,
  image: `${SITE_URL}${PDF_OG_IMAGE}`,
  operatingSystem: "Windows 10, Windows 11",
  applicationCategory: "BusinessApplication",
  isAccessibleForFree: true,
  ...(AVAILABLE ? { downloadUrl: `${SITE_URL}/api/download/${PRODUCT.slug}` } : {}),
  featureList: [
    "Edit existing text (Pro)",
    "Add text: wrapping boxes, 6 fonts, styles, alignment, rotation",
    "Fill & Sign: check marks, signatures, form filling",
    "Annotate: highlight, underline, strikethrough, comments, stamps, draw, shapes, images, whiteout",
    "Find, text selection, bookmarks, links and print",
    "Reorder, rotate, crop, duplicate, delete, extract and insert pages",
    "Merge and split PDFs",
    "Autosave with crash recovery",
    "Portable USB version",
    "OCR for scanned PDFs, fully offline (Pro)",
    "True redaction (Pro)",
    "Batch processing (Pro)",
    "PDF to Word, PDF to text, extract images (Pro)",
    "Page numbers, headers and footers, Bates numbering, watermarks (Pro)",
    "Compress PDFs (Pro)",
    "PDF to images (Pro)",
    "Password protect and unlock (Pro)",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Free download",
      price: "0",
      priceCurrency: "USD",
      description: "Free to download and use. Exports carry a small watermark.",
    },
    {
      "@type": "Offer",
      name: "RevinHi PDF Pro",
      price: "9.99",
      priceCurrency: "USD",
      description: "One-time purchase, no subscription. Removes the watermark and unlocks all Pro features, with free updates.",
      url: `${SITE_URL}/pdf`,
      ...(AVAILABLE ? { availability: "https://schema.org/InStock" } : {}),
    },
  ],
  publisher: { "@type": "Organization", name: "RevinHi", url: SITE_URL },
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function PdfPage() {
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={SOFTWARE_LD} />
      <JsonLd data={FAQ_LD} />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-14 sm:pt-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="glass-panel flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-center text-[11px] text-white/70 sm:px-4 sm:text-xs">
            <span className={`pulse-dot h-1.5 w-1.5 shrink-0 rounded-full ${AVAILABLE ? "bg-neon-success" : "bg-neon-amber"}`} />
            <span>{AVAILABLE ? "Windows 10/11 • Free download • Pro is a one-time purchase" : "Coming soon • Windows 10/11"}</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-6xl">
            Every PDF job,
            <br />
            <span className="rgb-chase-text">no subscription.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
            RevinHi PDF edits the text that&apos;s already there, fills and signs forms, makes scans searchable, redacts,
            merges and splits, compresses and password-protects. Fast, offline, and yours to keep.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <DownloadButton className="px-8 py-3.5 text-base" />
            <BuyButton className="px-8 py-3.5 text-base" chase />
          </div>
          <PortableLink className="mt-5" />
        </div>
        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
          <video
            className="block h-auto w-full"
            src="/pdf/hero.mp4"
            poster="/pdf/hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            aria-label="RevinHi PDF editing the text of an existing PDF"
          />
        </div>
      </section>

      {/* Demos */}
      <section className="px-6 pb-8">
        <SectionHeading eyebrow="See it in action" title="Real app, real workflow" />
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">
          {DEMOS.map((demo) => (
            <figure key={demo.src} className="glass-panel-flat overflow-hidden rounded-2xl">
              <video
                className="block h-auto w-full"
                src={demo.src}
                poster={demo.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={demo.caption}
              />
              <figcaption className="px-5 py-4 text-sm text-white/70">{demo.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-28 px-6 py-24">
        <SectionHeading eyebrow="What you get" title="A whole PDF toolkit in one app" subtitle="Everything runs on your PC. Nothing is uploaded." />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-panel-flat rounded-2xl p-6 transition hover:bg-white/[0.07]">
              <div className="mb-4 h-9 w-9 rounded-lg" style={{ background: feature.accent, boxShadow: `0 0 24px ${feature.accent}` }} />
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                {feature.title}
                {feature.pro && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">
                    Pro
                  </span>
                )}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free vs Pro */}
      <section id="pricing" className="px-6 py-24">
        <SectionHeading eyebrow="Pricing" title="Free to use. Pro once, for good." />
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="glass-panel rounded-3xl p-6 sm:p-10">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              <span />
              <span>Free</span>
              <span>Pro &middot; {PRODUCT.price}</span>
            </div>
            {TIERS.map((t) => (
              <div key={t.feature} className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-white/5 py-3 text-sm">
                <span className="text-white/85">{t.feature}</span>
                <span className="text-white/50">{t.free}</span>
                <span className="text-neon-success">{t.pro}</span>
              </div>
            ))}
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <DownloadButton className="px-7 py-3 text-sm" />
              <BuyButton className="px-7 py-3 text-sm" />
            </div>
            <PortableLink className="mt-4 text-center" />
            <p className="mt-4 text-center text-xs text-white/40">One-time purchase &middot; free updates forever &middot; key by email instantly</p>
          </div>
        </div>
      </section>

      {/* Guides */}
      <section id="guides" className="scroll-mt-28 px-6 py-16">
        <PdfGuideLinks />
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24">
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        <div className="mx-auto mt-12 max-w-2xl space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="glass-panel-flat rounded-2xl p-6">
              <h3 className="font-semibold text-white/90">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <PdfFooter />
    </div>
  );
}
