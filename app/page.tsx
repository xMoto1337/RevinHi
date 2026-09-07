import { AppShowcase } from "@/components/AppShowcase";

// --- Fill these in once you have real values -------------------------------------------------
const GUMROAD_PRODUCT_URL = "https://xanybot.gumroad.com/l/fsxmgh";
const PRICE_DISPLAY = "$9.99"; // must match whatever you set as the Gumroad product price
const SUPPORT_EMAIL = "support@revinhiperformance.com"; // TODO
// -----------------------------------------------------------------------------------------------

function BuyButton({ className = "", chase = false, wrapperClassName = "" }: { className?: string; chase?: boolean; wrapperClassName?: string }) {
  const button = (
    <a
      className={`gumroad-button inline-flex items-center justify-center gap-2 rounded-full bg-neon-cyan px-7 py-3 font-semibold text-black shadow-[0_0_30px_rgba(0,229,255,0.35)] transition hover:shadow-[0_0_45px_rgba(0,229,255,0.55)] hover:scale-[1.02] ${className}`}
      href={GUMROAD_PRODUCT_URL}
      data-gumroad-single-product="true"
    >
      Buy Now &mdash; {PRICE_DISPLAY}
    </a>
  );

  // Reserved for the standout usages (hero, pricing) - the little nav button stays plain so the
  // spinning comet effect doesn't feel cramped/noisy at that size.
  if (!chase) {
    return button;
  }

  return <div className={`chase-ring ${wrapperClassName}`}>{button}</div>;
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

type Feature = {
  title: string;
  description: string;
  accent: string;
};

const FEATURES: Feature[] = [
  {
    title: "Boost & Tweaks",
    description:
      "Safe and Advanced tiers of one-click Windows tweaks - Game Mode, HAGS, timer resolution, network stack tuning, and more. Every change is snapshotted before it's made.",
    accent: "var(--neon-success)",
  },
  {
    title: "DNS Finder",
    description:
      "Live-tests your current DNS against a dozen providers (including ad-blocking options), plus real ping to the regions popular games actually host servers in.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Live Dashboard",
    description: "CPU, GPU, RAM, and ping at a glance, refreshed in real time while you're keeping an eye on things.",
    accent: "var(--neon-amber)",
  },
  {
    title: "Performance Boost",
    description:
      "Suspends background apps eating your RAM and CPU with one click - fully reversible, nothing is closed or loses unsaved work.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Startup Manager",
    description: "See and control exactly what launches when Windows boots, without digging through Task Manager tabs.",
    accent: "var(--neon-danger)",
  },
  {
    title: "Restore All Defaults",
    description:
      "One button undoes everything RevinHi has ever changed - back to the exact state your PC was in before you installed it.",
    accent: "var(--neon-cyan)",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is this safe for my PC?",
    a: "Yes. Before RevinHi changes anything, it saves the original value - the first time it ever touches a setting, not just the first time you use it. Advanced-tier tweaks also require a Windows System Restore checkpoint first. “Restore All Defaults” always puts everything back exactly as it was.",
  },
  {
    q: "Do I need to make an account?",
    a: "No. You get a license key by email right after purchase - no sign-up, no login, nothing to remember.",
  },
  {
    q: "What are the system requirements?",
    a: "Windows 10 or 11, 64-bit. RevinHi needs to run as Administrator, since most of what it does (registry tweaks, network stack tuning, power plans) requires it.",
  },
  {
    q: "How do updates work?",
    a: "Your license key works on every version of RevinHi, past and future - just download the latest build whenever you want it, no re-purchase needed.",
  },
  {
    q: "What if I'm not happy with it?",
    a: `Reach out at ${SUPPORT_EMAIL} - refunds are handled case by case through Gumroad's checkout.`,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Nav */}
      {/* No backdrop-blur here - unlike the other glass panels, the sticky nav is on-screen and
          recompositing its live blur against whatever's scrolling underneath it on every single
          scroll frame for the entire page, not just briefly as it passes through view. Removing it
          traded a barely-visible "content blurring through" effect for real scroll smoothness. */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide sm:gap-2 sm:text-sm">
            <span className="text-white/90">REVINHI</span>
            <span className="text-white/50">PERFORMANCE</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-white/70 sm:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#safety" className="transition hover:text-white">Safety</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <BuyButton className="px-3.5 py-2 text-xs sm:px-4 sm:text-sm" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="glass-panel flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-center text-[11px] text-white/70 sm:px-4 sm:text-xs">
            <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-neon-success" />
            <span>Windows 10/11 &bull; One-time purchase &bull; Instant key delivery</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-6xl">
            Stop losing frames to
            <br />
            <span className="rgb-chase-text">Windows itself.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
            RevinHi Performance is a safe, reversible Windows optimizer built for gamers - one-click tweaks,
            live system monitoring, and a DNS finder that actually shows you what matters. Every change can be
            undone with a single button.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <BuyButton className="px-8 py-3.5 text-base" chase />
            <a
              href="#features"
              className="glass-panel rounded-full px-8 py-3.5 text-base font-semibold text-white/80 transition hover:text-white"
            >
              See what it does
            </a>
          </div>
        </div>

        {/* Interactive app showcase - click between tabs to see each real section of the app
            (Boost & Tweaks, DNS Finder, Dashboard, Startup Manager), rather than a static picture
            of just one screen. Illustrative, not a literal screenshot. */}
        <div className="mx-auto mt-12 max-w-3xl sm:mt-16">
          <AppShowcase />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <SectionHeading
          eyebrow="What you get"
          title="Every optimization, always reversible"
          subtitle="No black-box registry hacks. Every tweak is documented, tiered by risk, and undoable at any time."
        />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-panel-flat rounded-2xl p-6 transition hover:bg-white/[0.07]">
              <div
                className="mb-4 h-9 w-9 rounded-lg"
                style={{ background: feature.accent, boxShadow: `0 0 24px ${feature.accent}` }}
              />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel rounded-3xl p-10 sm:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-success">Built safety-first</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              We never touch what we didn&apos;t touch.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-neon-cyan">01. Snapshot first</p>
                <p className="mt-2 text-sm text-white/60">
                  The very first time RevinHi observes a setting, it saves the real, original value - before it
                  ever changes anything.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-neon-cyan">02. Restore point for risk</p>
                <p className="mt-2 text-sm text-white/60">
                  Advanced-tier tweaks require a Windows System Restore checkpoint first. No checkpoint, no
                  Advanced tweak.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-neon-cyan">03. One-button undo</p>
                <p className="mt-2 text-sm text-white/60">
                  &ldquo;Restore All Defaults&rdquo; reverts every change RevinHi has ever made, any time you
                  want.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <SectionHeading eyebrow="Pricing" title="One price. Yours for good." />
        <div className="mx-auto mt-12 max-w-md">
          <div className="glass-panel rgb-chase-border rounded-3xl border-2 p-10 text-center">
            <p className="text-5xl font-extrabold">{PRICE_DISPLAY}</p>
            <p className="mt-1 text-sm text-white/50">One-time purchase &middot; free updates forever</p>
            <ul className="mt-8 space-y-3 text-left text-sm text-white/70">
              {[
                "Every current and future tweak",
                "DNS Finder + live game-region ping",
                "Live system dashboard",
                "Instant key delivery by email",
                "No account, no subscription",
                "All future updates free - forever",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-success" />
                  {item}
                </li>
              ))}
            </ul>
            <BuyButton className="w-full py-3.5 text-base" chase wrapperClassName="mt-8 block w-full" />
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
          <p>&copy; {new Date().getFullYear()} RevinHi Performance. All rights reserved.</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white/70">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}
