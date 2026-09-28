import { HeroMedia, MiniRadar } from "./HeroMedia";
import styles from "./desktop.module.css";
import { BuyButton as SharedBuyButton } from "@/components/BuyButton";
import { getProduct, SUPPORT_EMAIL } from "@/lib/products";

// Price / Gumroad link / support email live in lib/products.ts (the storefront registry).
const PRODUCT = getProduct("desktop");
const PRICE_DISPLAY = PRODUCT.price;

function BuyButton({ label, ...props }: { className?: string; chase?: boolean; wrapperClassName?: string; label?: React.ReactNode }) {
  return <SharedBuyButton product={PRODUCT} label={label ?? <>Get it &mdash; {PRICE_DISPLAY}</>} {...props} />;
}

const DOWNLOAD_URL = PRODUCT.downloadUrl!;

/** Free installer - the primary CTA. Pro is unlocked in-app with a key from BuyButton / ProLink. */
function DownloadButton({ className = "", chase = false, wrapperClassName = "", label }: { className?: string; chase?: boolean; wrapperClassName?: string; label?: React.ReactNode }) {
  const button = (
    <a
      href={DOWNLOAD_URL}
      download
      className={`inline-flex items-center justify-center rounded-full bg-neon-cyan px-7 py-3 font-semibold text-black shadow-[0_0_30px_rgba(0,229,255,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(0,229,255,0.55)] ${className}`}
    >
      {label ?? "Download free"}
    </a>
  );
  if (!chase) return button;
  return <div className={`chase-ring ${wrapperClassName}`}>{button}</div>;
}

/** Secondary glass-style Pro button. Any <a> to a gumroad.com/l/ link gets the overlay checkout (see BuyButton). */
function ProLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={PRODUCT.gumroadUrl}
      className={`rh-buy glass-panel inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold text-white/85 transition hover:text-white ${className}`}
    >
      Get Pro &mdash; {PRICE_DISPLAY}
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

const FEATURES: { title: string; description: string; accent: string; tag: string }[] = [
  {
    tag: "Live wallpapers",
    title: "Your wallpaper, but moving",
    description:
      "Set any video or image as your wallpaper, or pick one of our original animated styles - particles, starfield, gradient flow, and waves. Built to stay light while you game or work.",
    accent: "var(--neon-cyan)",
  },
  {
    tag: "Widgets",
    title: "Widgets that actually look good",
    description:
      "Clock, date, CPU/RAM/GPU stats, battery, and your own custom text. Every font, color, and size is yours to change.",
    accent: "var(--neon-purple)",
  },
  {
    tag: "Weather effects",
    title: "Rain on the glass",
    description:
      "Layer rain streaking down your screen, drifting snow, or soft light rays right over your desktop. Instant cozy mode.",
    accent: "var(--neon-success)",
  },
  {
    tag: "Live radar",
    title: "Storms on your desktop",
    description:
      "A live US weather radar with lightning strikes, severe-weather alerts, and forecast widgets - straight from official NOAA / National Weather Service data.",
    accent: "var(--neon-amber)",
  },
  {
    tag: "Presets",
    title: "One click, whole new vibe",
    description:
      "Themed presets set wallpaper, widgets, and effects all at once. Tweak anything after, or save your own.",
    accent: "var(--neon-danger)",
  },
  {
    tag: "Free to try",
    title: "Try it free. Pay once for Pro.",
    description: `Download it free, no account needed. Unlock everything with Pro for ${PRICE_DISPLAY} one time - no subscription, and every future update is free.`,
    accent: "var(--neon-cyan)",
  },
];

const PRESETS: { name: string; vibe: string; bg: string }[] = [
  // Names match revinhi-radar/src/desktop/presets.ts.
  { name: "Lo-fi Rain", vibe: "Rain on glass + lo-fi clock", bg: "linear-gradient(160deg,#0b1a33,#1c2a4a 55%,#0a0f1c)" },
  { name: "Storm Watch", vibe: "Live radar + lightning alerts", bg: "linear-gradient(160deg,#0f2a1c,#1a1f0a 50%,#2a0f0f)" },
  { name: "Neon City", vibe: "Neon gradient + RGB text", bg: "linear-gradient(135deg,#ff3b30,#8a5cff 45%,#00e5ff)" },
  { name: "Cozy Snow", vibe: "Falling snow + warm light rays", bg: "linear-gradient(180deg,#cfd9ea,#6d7f9e 60%,#2b3448)" },
  { name: "Space", vibe: "Starfield + system stats", bg: "radial-gradient(circle at 30% 30%,#2a1466,#07051a 70%)" },
  { name: "Minimal Mono", vibe: "Clean mono clock + date", bg: "linear-gradient(180deg,#1a1a1a,#3a3a3a 60%,#0d0d0d)" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What do I need to run it?",
    a: "A Windows 10 or Windows 11 PC. That's it. It doesn't run on Mac, phones, or tablets.",
  },
  {
    q: "Will it slow down my PC or games?",
    a: "It's built to be lightweight, and you choose exactly which wallpapers, widgets, and effects are running. Turn anything off with one click whenever you want every last frame.",
  },
  {
    q: "Is it safe?",
    a: "Yes. It's a normal Windows app that draws on your desktop - no browser extensions and no ads. You can close it or uninstall it any time like any other program.",
  },
  {
    q: "Does the weather radar work where I live?",
    a: "The live radar, lightning, severe-weather alerts, and forecast widgets use official NOAA / National Weather Service data, which covers the United States only. Everything else (wallpapers, widgets, rain/snow effects, presets) works anywhere in the world.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The free version never expires: an animated Gradient Flow wallpaper, clock and date widgets, the live radar (latest scan) and severe-weather alerts for one location. It shows a small \"Free\" badge and the occasional upgrade reminder.",
  },
  {
    q: "What does Pro add?",
    a: "Every wallpaper plus your own videos and images, all widgets, rain/snow/light effects, one-click presets, live lightning, 2-hour radar replay, sharper tower radar, unlimited locations and the full forecast - with no badge and no reminders.",
  },
  {
    q: "Is Pro a subscription?",
    a: `No. ${PRICE_DISPLAY} once, and every future update is free forever. Your key arrives by email right after checkout - paste it into the app's License tab.`,
  },
  {
    q: "What's the refund policy?",
    a: `TODO: refund policy. Reach out at ${SUPPORT_EMAIL} if something isn't working and we'll sort it out.`,
  },
];

export default function DesktopPage() {
  return (
    <div className="flex flex-1 flex-col pb-24 sm:pb-0">
      {/* Hero - mobile first: headline, one line of copy, CTA, then the media right under it */}
      <section className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="glass-panel flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-white/70 sm:px-4 sm:text-xs">
            <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-neon-success" />
            <span>Free to try &bull; Pro {PRICE_DISPLAY} once &bull; Windows 10/11</span>
          </div>
          <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:mt-6 sm:text-7xl">
            Your desktop,
            <br />
            <span className="rgb-chase-text">but alive.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-white/65 sm:max-w-xl sm:text-lg">
            Live wallpapers, clean widgets, rain on your screen, and a real storm radar with lightning. One click
            and your PC looks like the setups you keep saving.
          </p>
          <div className="mt-7 flex w-full flex-col items-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:gap-4">
            <DownloadButton className="w-full px-8 py-4 text-base sm:w-auto sm:py-3.5" chase wrapperClassName="w-full sm:w-auto" />
            <ProLink className="w-full sm:w-auto" />
          </div>
          <p className="mt-3 text-xs text-white/40">Free forever &middot; no account &middot; Pro is a one-time upgrade</p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl sm:mt-16">
          <HeroMedia />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="What you get"
          title="Everything your setup is missing"
          subtitle="Wallpapers, widgets, weather, and a live radar - all in one lightweight app."
        />
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-panel-flat rounded-2xl p-5 transition hover:bg-white/[0.07] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.accent, boxShadow: `0 0 14px ${f.accent}` }} />
                <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: f.accent }}>
                  {f.tag}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Presets strip - horizontal swipe on mobile, grid on desktop */}
      <section id="presets" className="scroll-mt-28 py-16 sm:py-24">
        <div className="px-4 sm:px-6">
          <SectionHeading eyebrow="One-click presets" title="Pick a vibe. Done." subtitle="Each preset sets your wallpaper, widgets, and effects in one tap." />
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-6 lg:grid-cols-6">
          {PRESETS.map((p) => (
            <div key={p.name} className="w-[62%] shrink-0 snap-center sm:w-auto">
              <div
                className="relative aspect-[9/12] overflow-hidden rounded-2xl border border-white/10 sm:aspect-[3/4]"
                style={{ background: p.bg }}
              >
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-0.5 text-xs text-white/65">{p.vibe}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live radar */}
      <section id="radar" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="glass-panel grid grid-cols-1 items-center gap-10 rounded-3xl p-6 sm:p-12 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-success">Live radar</p>
                <span className="rounded-full border border-neon-amber/40 bg-neon-amber/10 px-2.5 py-0.5 text-[11px] font-semibold text-neon-amber">
                  US only
                </span>
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Watch the storm roll in.</h2>
              <p className="mt-4 text-white/60">
                A live weather radar right on your desktop, powered by official NOAA / National Weather Service data.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-white/75">
                {[
                  "Live precipitation radar loop",
                  "Lightning strikes as they happen",
                  "Severe-weather alerts for your area",
                  "Hourly and daily forecast widgets",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-white/40">
                Radar, lightning, alerts, and forecasts cover the United States only. Wallpapers, widgets, and
                effects work everywhere.
              </p>
            </div>
            <div className="mx-auto flex flex-col items-center gap-4">
              <MiniRadar size="min(70vw, 260px)" />
              <div className="w-full max-w-[260px] rounded-xl border border-neon-danger/40 bg-neon-danger/10 px-4 py-3 text-left">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neon-danger">Severe Thunderstorm Warning</p>
                <p className="mt-1 text-xs text-white/60">Example alert &middot; until 7:45 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="Pricing" title="Start free. Go Pro for less than a pizza." />
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-5 sm:mt-12 md:grid-cols-2">
          <div className="glass-panel-flat flex flex-col rounded-3xl p-7 text-center sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">Free</p>
            <p className="mt-2 text-6xl font-extrabold">$0</p>
            <p className="mt-1 text-sm text-white/50">Forever &middot; no account</p>
            <ul className="mt-8 space-y-3 text-left text-sm text-white/70">
              {[
                "Gradient Flow wallpaper in 3 palettes",
                "Clock and Date widgets (2 max)",
                "Live US radar (latest scan)",
                "Severe-weather alerts",
                "1 saved location",
                "Small \"Free\" badge + upgrade reminders",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <DownloadButton className="w-full py-4 text-base" />
            </div>
          </div>
          <div className="glass-panel rgb-chase-border flex flex-col rounded-3xl border-2 p-7 text-center sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">Pro</p>
            <p className="mt-2 text-6xl font-extrabold">{PRICE_DISPLAY}</p>
            <p className="mt-1 text-sm text-white/50">One-time purchase &middot; free updates forever</p>
            <ul className="mt-8 space-y-3 text-left text-sm text-white/70">
              {[
                "Every wallpaper + your own videos & images",
                "All widgets - radar, weather, stats, text",
                "Rain, snow & light-ray effects",
                "Six one-click themed presets",
                "Live lightning + 2-hour radar replay",
                "Unlimited locations + full forecast",
                "No badge, no reminders",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-success" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <BuyButton className="w-full py-4 text-base" chase wrapperClassName="block w-full" label={<>Get Pro &mdash; {PRICE_DISPLAY}</>} />
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-white/40">
          Windows 10/11 only &middot; already running the free version? Your Pro key unlocks it in place.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        <div className="mx-auto mt-10 max-w-2xl space-y-3 sm:mt-12 sm:space-y-4">
          {FAQ.map((item) => (
            <details key={item.q} className="glass-panel-flat group rounded-2xl p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white/90 [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="shrink-0 text-xl leading-none text-white/40 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} RevinHi. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="transition hover:text-white/70">All RevinHi apps</a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white/70">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile-only sticky buy bar - most visitors arrive from a bio link on a phone */}
      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 px-4 pt-3 sm:hidden ${styles.stickyBar}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">RevinHi Desktop</p>
            <p className="truncate text-xs text-white/50">Free &middot; Pro {PRICE_DISPLAY} once</p>
          </div>
          <DownloadButton className="px-6 py-3 text-sm" label="Get it free" />
        </div>
      </div>
    </div>
  );
}
