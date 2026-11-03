import Image from "next/image";
import type { Metadata } from "next";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getProduct, SUPPORT_EMAIL } from "@/lib/products";
import { JsonLd, PdfFooter as Footer, SectionHeading } from "@/components/pdf/PdfUi";
import { BuyButton } from "@/components/BuyButton";
import { GuideLinks } from "@/components/guides/GuideLinks";

// Product page. Status, price and Gumroad link live in lib/products.ts; the installer is at the
// product's downloadUrl (replaced on every release by revinhi-drivers/scripts/release.mjs).
// Screenshots in /public/drivers/screens come from revinhi-drivers/store/listing/screenshots
// (the browser preview with example hardware), resized to 1600x900 WebP.
//
// Wording: calm and exact, like the app and its Microsoft Store listing. No "your PC is at risk",
// no speed or crash promises, no urgency. Say what it does and that every change can be undone.
const PRODUCT = getProduct("drivers");
const AVAILABLE = PRODUCT.status === "available";
const OG_IMAGE = "/brand/revinhi-drivers.png";
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
  title: "Driver Updater for Windows | RevinHi Drivers",
  description:
    "Driver updater for Windows 10/11: see which drivers and game components have newer, signed versions. Free scan; every update comes after a restore point and can be rolled back.",
  path: "/drivers",
  image: OG_IMAGE,
  imageAlt: "RevinHi Drivers app icon",
});

const STEPS: { title: string; body: string }[] = [
  {
    title: "Scan",
    body: "RevinHi reads each device's current driver and asks Windows Update, the Microsoft Update Catalog, NVIDIA, Intel and RevinHi's own list for newer ones. Nothing on your PC changes.",
  },
  {
    title: "Look",
    body: "Results are grouped: updates available, missing drivers, devices with a problem, and up to date. Open any device to see both drivers side by side and where the newer one comes from.",
  },
  {
    title: "Update, or roll back",
    body: "Update one device, a few or all of them. A restore point and a backup of the old driver come first, and the History tab puts the previous driver back in one click.",
  },
];

const RULES: { title: string; description: string; accent: string }[] = [
  {
    title: "Signed drivers only",
    description: "Every driver offered carries a valid signature, checked on your PC before it's installed.",
    accent: ACCENT,
  },
  {
    title: "Made for your exact device",
    description: "A driver is only offered when it lists your device's own hardware ID, at least as closely as the driver you have now.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Never an older driver",
    description: "The new driver must be newer than yours, by version and date. Downgrades are never offered.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Your PC maker's drivers kept",
    description: "Drivers Dell, HP, Lenovo and others tuned for your PC stay unless you allow general ones in Settings.",
    accent: "var(--neon-amber)",
  },
  {
    title: "Firmware left alone",
    description: "BIOS and firmware updates are set aside. Those belong to your PC maker's own tools.",
    accent: "var(--neon-success)",
  },
  {
    title: "Exactly what was found",
    description: "The scan shows real counts in plain words. No warnings to scare you and no popups asking you to buy.",
    accent: "var(--neon-danger)",
  },
];

const TOOLS: { title: string; description: string }[] = [
  { title: "Offline updater", description: "Save a PC's hardware list to a USB stick, build an update pack for it on a PC that's online, then install it on the PC without internet." },
  { title: "Network rescue", description: "Put network and Wi-Fi drivers on a USB stick for a PC that can't get online at all." },
  { title: "Back up and restore drivers", description: "Save this PC's drivers to a folder or .zip, and put them back later, for example after reinstalling Windows." },
  { title: "Old driver cleanup", description: "Older copies of drivers Windows keeps after updates that nothing uses any more, with their size. The drivers in use are never touched." },
  { title: "Unplugged devices", description: "Tidy up devices Windows still remembers that aren't connected: old mice, phones, USB sticks." },
  { title: "Problem devices", description: "Devices with a yellow mark in Device Manager, with what the problem means in plain words and a fix to try." },
  { title: "Crash driver finder", description: "Reads Windows' crash reports after a blue screen and names the driver most likely involved, with how sure it is." },
  { title: "One-click fixes", description: "No sound, no internet, wrong screen resolution, USB not recognized and Bluetooth. Each fix lists its steps first." },
  { title: "Keep drivers as they are", description: "Ignore a device's updates, or stop Windows Update from replacing your drivers. Both can be turned back." },
  { title: "Scheduled scan and hardware info", description: "An optional scan at sign-in or once a week (off until you turn it on), and a plain list of what's inside your PC." },
];

const SCREENS: { src: string; alt: string; caption: string }[] = [
  { src: "/drivers/screens/02-driver-details.webp", alt: "RevinHi Drivers showing a graphics driver's current and newer version side by side", caption: "Both drivers side by side" },
  { src: "/drivers/screens/04-updating.webp", alt: "Updates installing one after another, after a restore point", caption: "A restore point and a backup come first" },
  { src: "/drivers/screens/05-history-roll-back.webp", alt: "The History tab with Roll back buttons", caption: "Every change can be rolled back" },
];

const MORE_SCREENS: { src: string; alt: string; caption: string }[] = [
  { src: "/drivers/screens/06-game-components.webp", alt: "Game components: DirectX, Visual C++ runtimes and .NET with their state", caption: "Game components" },
  { src: "/drivers/screens/07-tools.webp", alt: "The Tools tab with twelve tools", caption: "The Tools tab" },
];

const TIERS: { feature: string; free: string; pro: string }[] = [
  { feature: "Scan drivers and game components, every detail", free: "Included", pro: "Included" },
  { feature: "Back up drivers, roll back any update", free: "Included", pro: "Included" },
  { feature: "Crash driver finder, problem devices, one-click fixes", free: "Included", pro: "Included" },
  { feature: "Network rescue, hardware info, cleanup lists", free: "Included", pro: "Included" },
  { feature: "Install driver updates and game components", free: "-", pro: "Included" },
  { feature: "Update all at once", free: "-", pro: "Included" },
  { feature: "Offline update packs, restore from a backup", free: "-", pro: "Included" },
  { feature: "Remove old drivers and unplugged devices", free: "-", pro: "Included" },
];

const SAFETY: string[] = [
  "Scanning only reads. Nothing changes until you choose to update.",
  "Before every update, a System Restore point is made and the current driver is backed up. If System Restore is off, the app asks first.",
  "The History tab lists every change with a Roll back button that puts the previous driver back.",
  "Each driver's signature is checked again just before it's installed.",
  "No start with Windows, no background service. The scheduled scan only runs if you turn it on.",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "When can I get RevinHi Drivers?",
    a: AVAILABLE
      ? `Now. Download it free for Windows 10/11, scan as much as you like, and upgrade to Pro for ${PRODUCT.price} once when you want it to install updates for you.`
      : `It's coming soon. Email ${SUPPORT_EMAIL} if you'd like to hear when it's out.`,
  },
  {
    q: "What's free and what's Pro?",
    a: "Scanning, every detail, backups, roll back, the crash driver finder, problem devices, the one-click fixes, network rescue and hardware info are free. Pro installs driver updates and game components, updates everything at once, builds and installs offline packs, restores backups and removes old drivers and unplugged devices. Pro is a one-time purchase with free updates: no subscription and no account.",
  },
  {
    q: "Does Windows Update not do this already?",
    a: "Windows Update offers some drivers, often not the newest. RevinHi asks Windows Update too, and also the Microsoft Update Catalog, NVIDIA, Intel and its own list of official vendor downloads, then shows the newest one that passes every check.",
  },
  {
    q: "Where do the drivers come from?",
    a: "From Microsoft (Windows Update and the Microsoft Update Catalog), straight from NVIDIA and Intel, and from RevinHi's own list, which only points at official download links from the device makers and is signed so the app can tell it hasn't been changed.",
  },
  {
    q: "What if an update causes a problem?",
    a: "Open the History tab and press Roll back: the previous driver goes back. Every update also comes after a System Restore point, so you can return the whole PC to how it was from Windows' recovery options.",
  },
  {
    q: "Why does it ask for admin rights?",
    a: "Installing and rolling back drivers and making restore points need administrator access in Windows, so Windows asks when the app opens.",
  },
];

const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PRODUCT.name,
  description:
    "Driver updater for Windows: scans devices and game components and offers newer, signed drivers from Windows Update, the Microsoft Update Catalog, NVIDIA, Intel and RevinHi's signed list. A restore point and a backup come before every update, and every update can be rolled back. Free scan; Pro installs updates.",
  url: `${SITE_URL}/drivers`,
  image: `${SITE_URL}${OG_IMAGE}`,
  operatingSystem: "Windows 10, Windows 11",
  applicationCategory: "UtilitiesApplication",
  isAccessibleForFree: true,
  ...(AVAILABLE ? { downloadUrl: `${SITE_URL}${DOWNLOAD_URL}` } : {}),
  ...(AVAILABLE
    ? {
        offers: [
          { "@type": "Offer", name: "Free (scan, backups, roll back)", price: "0", priceCurrency: "USD", url: `${SITE_URL}/drivers` },
          { "@type": "Offer", name: "Pro (one-time)", price: PRODUCT.price.replace("$", ""), priceCurrency: "USD", url: PRODUCT.gumroadUrl },
        ],
      }
    : {}),
  featureList: [
    "Driver updates from Windows Update, the Microsoft Update Catalog, NVIDIA and Intel",
    "Signed, newer drivers made for the exact device only",
    "Restore point and driver backup before every update",
    "Roll back any update",
    "Game components: DirectX, Visual C++, .NET",
    "Offline driver updater",
    "Driver backup and restore",
    "Crash driver finder",
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
      <Image src={src} alt={alt} width={1600} height={900} sizes="(max-width: 1024px) 100vw, 1024px" className="block h-auto w-full" preload={preload} />
      {caption && <figcaption className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/50">{caption}</figcaption>}
    </figure>
  );
}

export default function DriversPage() {
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
                ? "Windows 10/11 • Scan free • Pro is a one-time purchase"
                : "Coming soon • Windows 10/11 • Scan free"}
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-6xl">
            Newer drivers,
            <br />
            <span className="rgb-chase-text">and a way back.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
            RevinHi Drivers is a driver updater for Windows. It checks your devices and game components, shows which ones have
            newer, signed versions, and installs them only when you say so, after a restore point and a backup. Any update can be
            rolled back.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <DownloadButton className="px-8 py-3.5 text-base" />
            <BuyButton product={PRODUCT} className="px-8 py-3.5 text-base" label={<>Get Pro &mdash; {PRODUCT.price}</>} chase />
            {!AVAILABLE && (
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=RevinHi%20Drivers`}
                className="glass-panel inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold text-white/85 transition hover:text-white"
              >
                Tell me when it&apos;s out
              </a>
            )}
          </div>
        </div>
        <Screenshot
          src="/drivers/screens/01-updates-found.webp"
          alt="RevinHi Drivers after a scan: updates available with their source, signature and size"
          className="mx-auto mt-14 max-w-5xl"
          preload
        />
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-28 px-6 py-24">
        <SectionHeading eyebrow="How it works" title="Scan, look, update" subtitle="Nothing changes until you choose, and every change can be undone." />
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

      {/* How an update is picked */}
      <section id="rules" className="scroll-mt-28 px-6 py-24">
        <SectionHeading
          eyebrow="How an update is picked"
          title="Careful by default"
          subtitle="A driver is only offered when it passes every one of these checks."
        />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map((feature) => (
            <div key={feature.title} className="glass-panel-flat rounded-2xl p-6 transition hover:bg-white/[0.07]">
              <div className="mb-4 h-9 w-9 rounded-lg" style={{ background: feature.accent, boxShadow: `0 0 24px ${feature.accent}` }} />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Game components + tools */}
      <section id="tools" className="scroll-mt-28 px-6 py-24">
        <SectionHeading
          eyebrow="Game components and tools"
          title="More than driver updates"
          subtitle="The same scan checks DirectX, Visual C++, .NET and the other runtimes games need. The Tools tab has the rest."
        />
        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
          {MORE_SCREENS.map((s) => (
            <Screenshot key={s.src} {...s} />
          ))}
        </div>
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
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">Every change can be undone</h2>
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
        <SectionHeading eyebrow="Pricing" title="Scan free. Pro to install." />
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
            <li>Windows 10 (version 2004 or later) or Windows 11, 64-bit</li>
            <li>Administrator rights (Windows asks when the app opens)</li>
            <li>An internet connection to scan online sources (the offline updater covers PCs without one)</li>
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

      {/* Guides (none yet; shows up once lib/guides.ts has "drivers" entries) */}
      <section id="guides" className="scroll-mt-28 px-6 pb-24">
        <GuideLinks product="drivers" title="How to: driver guides" />
      </section>

      <Footer />
    </div>
  );
}
