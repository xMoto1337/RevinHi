import Image from "next/image";
import type { Metadata } from "next";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getProduct, SUPPORT_EMAIL } from "@/lib/products";
import { JsonLd, PdfFooter as Footer, SectionHeading } from "@/components/pdf/PdfUi";
import { BuyButton } from "@/components/BuyButton";
import { GuideLinks } from "@/components/guides/GuideLinks";

// Product page. Status, price and Gumroad link live in lib/products.ts; the installer is at the
// product's downloadUrl (replaced on every release by revinhi-recovery/scripts/release.mjs).
// Screenshots in /public/recovery come from revinhi-recovery/docs/screenshots.
const PRODUCT = getProduct("recovery");
const AVAILABLE = PRODUCT.status === "available";
const OG_IMAGE = "/brand/revinhi-recovery.png";
const ACCENT = PRODUCT.accent;
// Counted: /api/download logs the click, then redirects to the installer.
const DOWNLOAD_URL = `/api/download/${PRODUCT.slug}`;

function DownloadButton({ className = "" }: { className?: string }) {
  if (!AVAILABLE) return null;
  return (
    <a
      href={DOWNLOAD_URL}
      download
      className={`inline-flex items-center justify-center rounded-full font-semibold text-black transition hover:scale-[1.02] ${className}`}
      style={{ background: ACCENT, boxShadow: `0 0 30px ${ACCENT}59` }}
    >
      Download free
    </a>
  );
}

export const metadata: Metadata = pageMetadata({
  title: "File Recovery Software for Windows | RevinHi Recovery",
  description:
    "File recovery software for Windows: get back deleted photos, videos and documents from drives, USB sticks and SD cards, even after a format. Free scan.",
  path: "/recovery",
  image: OG_IMAGE,
  imageAlt: "RevinHi Recovery app icon",
});

const STEPS: { title: string; body: string }[] = [
  {
    title: "Scan",
    body: "Pick the drive, memory card or USB stick the files were on. Quick scan finds recently deleted files in moments; Full scan searches every part of the drive.",
  },
  {
    title: "Preview",
    body: "Files are sorted into photos, videos, music and documents. Search by name or type and see each photo, video, song or PDF before you save anything.",
  },
  {
    title: "Recover",
    body: "Tick what you want and save it to a different drive, with the original names and folders wherever they're still known.",
  },
];

const RECOVERS: { title: string; description: string; accent: string }[] = [
  {
    title: "Deleted files",
    description: "Emptied the Recycle Bin or pressed Shift+Delete? Files stay on the drive until something new is saved over them, and RevinHi finds them.",
    accent: ACCENT,
  },
  {
    title: "Formatted drives",
    description: "A full scan looks for files by what's inside them, so photos and videos come back even after a quick format or when the drive shows as RAW.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Lost partitions",
    description: "A whole partition vanished? RevinHi searches the drive for it and scans what was on it.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Windows drives, USB sticks and cards",
    description: "Works with NTFS, FAT32 and exFAT: hard drives, SSDs, USB sticks, SD and microSD cards, and disk image files.",
    accent: "var(--neon-amber)",
  },
  {
    title: "30+ file types",
    description: "JPEG, PNG, HEIC and camera RAW photos, MP4, MOV and AVI videos, MP3 and WAV music, PDF and Office documents, ZIP, RAR and 7z.",
    accent: "var(--neon-success)",
  },
  {
    title: "A clear chance for every file",
    description: "Each file shows whether it should come back whole or has been partly written over, so you know before you save.",
    accent: "var(--neon-danger)",
  },
];

const TOOLS: { title: string; description: string }[] = [
  {
    title: "Write image to drive",
    description: "Put a VHD, VHDX or disk image onto a USB drive byte for byte, then read it back to check the copy.",
  },
  {
    title: "Disk backup image",
    description: "Copy a whole failing drive to one image file, skipping bad spots and going back for them later, then scan the copy instead.",
  },
  {
    title: "Drive health",
    description: "Temperature, wear and errors each drive reports about itself, with a plain Good, Caution or Bad.",
  },
  {
    title: "Find lost partitions",
    description: "Searches a drive for partitions that were deleted or disappeared, and scans them in one click.",
  },
  {
    title: "Sector viewer",
    description: "For the curious: see a drive's raw contents with its structures labeled. Turn it on in Settings.",
  },
];

const SCREENS: { src: string; alt: string; caption: string }[] = [
  { src: "/recovery/results.png", alt: "RevinHi Recovery showing found photos with a preview", caption: "Preview every file before you save it" },
  { src: "/recovery/scan-finished.png", alt: "A finished scan sorted into photos, videos, music, documents and archives", caption: "Results sorted by type" },
  { src: "/recovery/drive-health.png", alt: "Drive health for an SSD and a hard drive", caption: "Drive health in plain words" },
];

const TIERS: { feature: string; free: string; pro: string }[] = [
  { feature: "Quick scan and Full scan", free: "Included", pro: "Included" },
  { feature: "Preview photos, videos, music and documents", free: "Included", pro: "Included" },
  { feature: "Search, filters and saved scans", free: "Included", pro: "Included" },
  { feature: "Drive health, backup images, lost partitions", free: "Included", pro: "Included" },
  { feature: "Save recovered files", free: "-", pro: "Every file" },
  { feature: "Write image to drive", free: "-", pro: "Included" },
];

const SAFETY: string[] = [
  "Scans only read the drive. Nothing on it is ever changed.",
  "Recovered files can't be saved back onto the drive you scanned, so they never overwrite what you're trying to save.",
  "Scan files and previews are kept off the scanned drive too.",
  "Writing an image to a drive asks you to type the drive's name or a code first, and the Windows drive is never offered.",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "When can I get RevinHi Recovery?",
    a: AVAILABLE
      ? `Now. Download it free for Windows 10/11, scan and preview as much as you like, and upgrade to Pro for ${PRODUCT.price} once when you want to save your files.`
      : `It's coming soon. Email ${SUPPORT_EMAIL} if you'd like to hear when it's out.`,
  },
  {
    q: "What's free and what's Pro?",
    a: "Scanning, previews, search, saved scans and the drive tools (health, backup image, lost partitions, sector viewer) are free. Pro saves the files a scan finds and writes images to drives. Pro is a one-time purchase with free updates: no subscription and no account.",
  },
  {
    q: "Will I get my files back?",
    a: "Often, yes, and you'll know before you pay. Every file shows its chance of coming back, and you can preview it in the free version. The sooner you scan and the less the drive has been used since, the better the chances.",
  },
  {
    q: "What should I do right now?",
    a: "Stop using the drive. Don't save, install or download anything to it, because new files can overwrite the ones you lost. Install RevinHi Recovery on a different drive if you can, and save what you recover to a different drive.",
  },
  {
    q: "Why does it ask for admin rights?",
    a: "Reading a whole drive, including the parts where deleted files sit, needs administrator access in Windows. RevinHi Recovery only reads the drives you scan.",
  },
  {
    q: "Can it fix a drive that's clicking or failing?",
    a: "No program can fix failing hardware, but RevinHi can help you get your files off it. Make a Disk backup image first so the drive is read only once, then scan the image. Drive health tells you how worn a drive is.",
  },
];

const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PRODUCT.name,
  description:
    "File recovery app for Windows: finds deleted and lost files on hard drives, SSDs, USB sticks and memory cards (NTFS, FAT32, exFAT), even after a format. Free scan and preview; Pro saves recovered files. Also writes VHD, VHDX and disk images to USB drives, makes backup images of failing drives, finds lost partitions and shows drive health.",
  url: `${SITE_URL}/recovery`,
  image: `${SITE_URL}${OG_IMAGE}`,
  operatingSystem: "Windows 10, Windows 11",
  applicationCategory: "UtilitiesApplication",
  isAccessibleForFree: true,
  ...(AVAILABLE ? { downloadUrl: `${SITE_URL}${DOWNLOAD_URL}` } : {}),
  ...(AVAILABLE
    ? {
        offers: [
          { "@type": "Offer", name: "Free (scan and preview)", price: "0", priceCurrency: "USD", url: `${SITE_URL}/recovery` },
          { "@type": "Offer", name: "Pro (one-time)", price: PRODUCT.price.replace("$", ""), priceCurrency: "USD", url: PRODUCT.gumroadUrl },
        ],
      }
    : {}),
  featureList: [
    "Recover deleted files",
    "Recover files from formatted drives and memory cards",
    "Find lost partitions",
    "NTFS, FAT32 and exFAT",
    "30+ file types found by their contents",
    "Preview before recovering",
    "Write VHD, VHDX and disk images to USB drives with a check",
    "Disk backup image of failing drives",
    "Drive health",
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

function Screenshot({ src, alt, caption, className = "", preload = false }: { src: string; alt: string; caption?: string; className?: string; preload?: boolean }) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-white/10 bg-[#05060a] shadow-[0_30px_80px_rgba(0,0,0,0.6)] ${className}`}>
      <Image src={src} alt={alt} width={1360} height={880} sizes="(max-width: 1024px) 100vw, 1024px" className="block h-auto w-full" preload={preload} />
      {caption && <figcaption className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/50">{caption}</figcaption>}
    </figure>
  );
}

export default function RecoveryPage() {
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={SOFTWARE_LD} />
      <JsonLd data={FAQ_LD} />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-14 sm:pt-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="glass-panel flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-center text-[11px] text-white/70 sm:px-4 sm:text-xs">
            <span className={`pulse-dot h-1.5 w-1.5 shrink-0 rounded-full ${AVAILABLE ? "bg-neon-success" : "bg-neon-amber"}`} />
            <span>
              {AVAILABLE
                ? "Windows 10/11 • Scan and preview free • Pro is a one-time purchase"
                : "Coming soon • Windows 10/11 • Scan and preview free"}
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-6xl">
            Recover deleted files,
            <br />
            <span className="rgb-chase-text">even after a format.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
            RevinHi Recovery is file recovery software for Windows. It finds deleted photos, videos and documents on
            hard drives, SSDs, USB sticks and memory cards, even after a format. See every file before you save it, and know its chances up front.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <DownloadButton className="px-8 py-3.5 text-base" />
            <BuyButton product={PRODUCT} className="px-8 py-3.5 text-base" label={<>Get Pro &mdash; {PRODUCT.price}</>} chase />
            {!AVAILABLE && (
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=RevinHi%20Recovery`}
                className="glass-panel inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold text-white/85 transition hover:text-white"
              >
                Tell me when it&apos;s out
              </a>
            )}
          </div>
        </div>
        <Screenshot
          src="/recovery/drives.png"
          alt="RevinHi Recovery's drive list with Scan buttons, recent scans and quick tools"
          className="mx-auto mt-14 max-w-5xl"
          preload
        />
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-28 px-6 py-24">
        <SectionHeading
          eyebrow="How it works"
          title="Scan, preview, recover"
          subtitle="Three steps, and you see exactly what you're getting before you save a thing."
        />
        <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="glass-panel-flat rounded-2xl p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                Step {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
          {SCREENS.map((s) => (
            <Screenshot key={s.src} {...s} />
          ))}
        </div>
      </section>

      {/* What it recovers */}
      <section id="recovers" className="scroll-mt-28 px-6 py-24">
        <SectionHeading
          eyebrow="What it gets back"
          title="Deleted, formatted or simply gone"
          subtitle="From one deleted photo to a whole memory card that was formatted by mistake."
        />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RECOVERS.map((feature) => (
            <div key={feature.title} className="glass-panel-flat rounded-2xl p-6 transition hover:bg-white/[0.07]">
              <div className="mb-4 h-9 w-9 rounded-lg" style={{ background: feature.accent, boxShadow: `0 0 24px ${feature.accent}` }} />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="scroll-mt-28 px-6 py-24">
        <SectionHeading eyebrow="Tools" title="For drives that need more than a scan" />
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <div key={t.title} className="glass-panel-flat rounded-2xl p-6">
              <h3 className="font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{t.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="scroll-mt-28 px-6 py-16">
        <div className="glass-panel mx-auto max-w-4xl rounded-3xl p-8 sm:p-12">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
            Safe by design
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">Your lost files come first</h2>
          <ul className="mx-auto mt-8 max-w-2xl space-y-3 text-sm leading-relaxed text-white/70">
            {SAFETY.map((s) => (
              <li key={s} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACCENT }} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Free vs Pro */}
      <section id="pricing" className="px-6 py-24">
        <SectionHeading eyebrow="Pricing" title="Scan and preview free. Pro to save." />
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
              <BuyButton product={PRODUCT} className="px-7 py-3 text-sm" label={<>Get Pro &mdash; {PRODUCT.price}</>} />
            </div>
            <p className="mt-4 text-center text-xs text-white/40">One-time purchase &middot; free updates &middot; no subscription</p>
          </div>
        </div>
      </section>

      {/* System requirements */}
      <section id="requirements" className="px-6 py-8">
        <div className="glass-panel-flat mx-auto max-w-3xl rounded-2xl p-6 text-sm text-white/60">
          <h3 className="font-semibold text-white/85">What you need</h3>
          <ul className="mt-3 space-y-1.5">
            <li>Windows 10 or 11, 64-bit</li>
            <li>Administrator rights (Windows asks when the app opens)</li>
            <li>A second drive or USB stick to save recovered files to</li>
          </ul>
        </div>
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

      {/* Guides */}
      <section id="guides" className="scroll-mt-28 px-6 pb-24">
        <GuideLinks product="recovery" title="How to: file recovery guides" />
      </section>

      <Footer />
    </div>
  );
}
