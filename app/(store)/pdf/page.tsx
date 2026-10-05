import { BuyButton as SharedBuyButton } from "@/components/BuyButton";
import { LegalLinks } from "@/components/Legal";
import { getProduct, SUPPORT_EMAIL } from "@/lib/products";

const PRODUCT = getProduct("pdf");
const AVAILABLE = PRODUCT.status === "available";
// Counted: /api/download logs the click, then redirects to the installer.
const DOWNLOAD_URL = `/api/download/${PRODUCT.slug}`;

function BuyButton(props: { className?: string; chase?: boolean; wrapperClassName?: string }) {
  return <SharedBuyButton product={PRODUCT} label={<>Get Pro &mdash; {PRODUCT.price}</>} {...props} />;
}

function DownloadButton({ className = "" }: { className?: string }) {
  if (!AVAILABLE) {
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
      href={DOWNLOAD_URL}
      download
      className={`inline-flex items-center justify-center rounded-full bg-neon-cyan px-7 py-3 font-semibold text-black shadow-[0_0_30px_rgba(0,229,255,0.35)] transition hover:scale-[1.02] ${className}`}
    >
      Download free
    </a>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-white/60">{subtitle}</p>}
    </div>
  );
}

const FEATURES: { title: string; description: string; accent: string }[] = [
  {
    title: "Edit existing text",
    description: "Click any line in a PDF and retype it. RevinHi matches the original font, size and colour, so the change blends in.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Sign & fill forms",
    description: "Draw, type or upload your signature once and drop it on any page. Fill in PDF forms and flatten them when you're done.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Annotate",
    description: "Text boxes, highlights, freehand ink, shapes, arrows, images and whiteout, all movable and fully undoable.",
    accent: "var(--neon-amber)",
  },
  {
    title: "Page tools",
    description: "Drag pages to reorder, rotate, delete, extract, insert blank pages, merge files and split by ranges.",
    accent: "var(--neon-success)",
  },
  {
    title: "Convert",
    description: "Turn photos and scans into a PDF, or export pages as PNG / JPG at up to 300 dpi.",
    accent: "var(--neon-danger)",
  },
  {
    title: "Compress & protect",
    description: "Shrink image-heavy PDFs, often by 80% or more, and lock files with AES-256 passwords.",
    accent: "var(--neon-purple)",
  },
];

const TIERS: { feature: string; free: string; pro: string }[] = [
  { feature: "View, reorder, rotate, split", free: "Included", pro: "Included" },
  { feature: "Annotate, sign, fill forms", free: "Included", pro: "Included" },
  { feature: "Merge", free: "2 files at a time", pro: "Unlimited" },
  { feature: "Saved signatures", free: "1", pro: "Unlimited" },
  { feature: "Images → PDF", free: "Up to 3 images", pro: "Unlimited" },
  { feature: "Edit existing text", free: "-", pro: "Included" },
  { feature: "PDF → Images", free: "-", pro: "Included" },
  { feature: "Compress", free: "-", pro: "Included" },
  { feature: "Password protect / unlock", free: "-", pro: "Included" },
  { feature: "Exports", free: "Small footer credit", pro: "Clean" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is it really free?",
    a: "Yes. Viewing, page tools, annotating, signing and form filling are free forever. Pro is a one-time purchase that unlocks text editing, compress, protect, conversion and removes the small footer credit.",
  },
  {
    q: "Do my files get uploaded anywhere?",
    a: "No. RevinHi PDF works entirely on your PC, offline. Your documents never leave your computer.",
  },
  {
    q: "Is edited text secure redaction?",
    a: "No. Edited text is drawn over the original, which stays in the file underneath. Don't use it to hide sensitive information.",
  },
  {
    q: "What are the system requirements?",
    a: "Windows 10 or 11, 64-bit.",
  },
  {
    q: "How do updates work?",
    a: "The app updates itself, and your Pro key works on every future version, with no subscription.",
  },
  {
    q: "What if I'm not happy with it?",
    a: `Reach out at ${SUPPORT_EMAIL} - refunds are handled case by case through Gumroad's checkout.`,
  },
];

export default function PdfPage() {
  return (
    <div className="flex flex-1 flex-col">
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
            RevinHi PDF edits the text that&apos;s already there, signs and fills forms, merges and splits, compresses and
            password-protects. Fast, offline, and yours to keep.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <DownloadButton className="px-8 py-3.5 text-base" />
            <BuyButton className="px-8 py-3.5 text-base" chase />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-28 px-6 py-24">
        <SectionHeading eyebrow="What you get" title="A whole PDF toolkit in one app" subtitle="Everything runs on your PC. Nothing is uploaded." />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-panel-flat rounded-2xl p-6 transition hover:bg-white/[0.07]">
              <div className="mb-4 h-9 w-9 rounded-lg" style={{ background: feature.accent, boxShadow: `0 0 24px ${feature.accent}` }} />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
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
            <p className="mt-4 text-center text-xs text-white/40">One-time purchase &middot; free updates forever &middot; key by email instantly</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24">
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        <div className="mx-auto mt-12 max-w-2xl space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="glass-panel-flat rounded-2xl p-6">
              <p className="font-semibold text-white/90">{item.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} RevinHi. All rights reserved.</p>
          <LegalLinks />
          <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white/70">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}
