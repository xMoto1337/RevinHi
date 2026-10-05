import { LegalLinks } from "@/components/Legal";
import fs from "node:fs";
import path from "node:path";
import { BuyButton } from "@/components/BuyButton";
import { PRODUCTS, SUPPORT_EMAIL, type Product } from "@/lib/products";

// Checked at build time (this page is statically prerendered): only render a product's hero media if
// the file actually exists in /public, otherwise show the gradient art panel instead of a broken video.
function mediaExists(publicPath: string) {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", publicPath));
  } catch {
    return false;
  }
}

const WHY = [
  { title: "Pay once", body: "One price, no subscription, no account to make." },
  { title: "Free updates", body: "Every future version of every app you buy, free forever." },
  { title: "Windows-native", body: "Real desktop apps built for Windows 10 and 11 - not web wrappers." },
  { title: "Instant checkout", body: "Secure checkout through Gumroad, right on this page." },
];

function ProductMedia({ product }: { product: Product }) {
  const hasMedia = mediaExists(product.heroMedia);
  const isVideo = /\.(mp4|webm)$/i.test(product.heroMedia);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-[#05060a]">
      {/* Fallback art panel - always rendered underneath */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 15% 10%, ${product.accent}55, transparent 55%), radial-gradient(90% 80% at 90% 100%, ${product.accent}33, transparent 60%), #06070c`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(circle at 50% 50%, #000, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000, transparent 75%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50">RevinHi</p>
        <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{product.tabLabel}</p>
      </div>

      {hasMedia &&
        (isVideo ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={product.heroMedia}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${product.name} preview`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="absolute inset-0 h-full w-full object-cover" src={product.heroMedia} alt={`${product.name} preview`} />
        ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const available = product.status === "available";
  return (
    <article className="glass-panel-flat flex flex-col rounded-3xl p-3 sm:p-4">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href={product.route} aria-label={`View ${product.name}`} className="block">
        <ProductMedia product={product} />
      </a>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-semibold ${
              available
                ? "border-neon-success/40 bg-neon-success/10 text-neon-success"
                : "border-neon-amber/40 bg-neon-amber/10 text-neon-amber"
            }`}
          >
            {available ? "Available now" : "Coming soon"}
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-white/55">{product.platform}</span>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight">{product.name}</h3>
          <p className="shrink-0 text-lg font-bold">{product.downloadUrl ? <>Free <span className="text-sm font-semibold text-white/50">&middot; Pro {product.price}</span></> : product.price}</p>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">{product.tagline}</p>

        <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-white/70 min-[420px]:grid-cols-2">
          {product.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: product.accent }} />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex gap-3 pt-6">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href={product.route}
            className="glass-panel flex flex-1 items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold text-white/85 transition hover:text-white"
          >
            View
          </a>
          {product.downloadUrl && available ? (
            <a
              href={`/api/download/${product.slug}`}
              download
              className="inline-flex flex-1 items-center justify-center rounded-full bg-neon-cyan px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(0,229,255,0.35)] transition hover:scale-[1.02]"
            >
              Download free
            </a>
          ) : (
            <BuyButton product={product} className="flex-1 px-5 py-3 text-sm" label={<>Buy {product.price}</>} />
          )}
        </div>
      </div>
    </article>
  );
}

export default function StorefrontHome() {
  const available = PRODUCTS.filter((p) => p.status === "available").length;

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero - compact on phones so the app cards are reachable in one thumb-scroll */}
      <section className="px-4 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="glass-panel flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-white/70 sm:px-4 sm:text-xs">
            <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-neon-success" />
            <span>
              {available} {available === 1 ? "app" : "apps"} available &bull; Windows 10/11 &bull; One-time price
            </span>
          </div>
          <h1 className="mt-5 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:mt-6 sm:text-7xl">
            Apps that upgrade
            <br />
            <span className="rgb-chase-text">your PC.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-white/60 sm:max-w-xl sm:text-lg">
            Faster games, a desktop that actually looks alive. Small Windows apps that do one thing really well
            &mdash; buy once, keep forever.
          </p>
          <a
            href="#apps"
            className="mt-7 w-full rounded-full bg-white px-8 py-3.5 text-base font-semibold text-black transition hover:bg-white/90 sm:w-auto"
          >
            Browse the apps
          </a>
        </div>
      </section>

      {/* Product grid */}
      <section id="apps" className="scroll-mt-28 px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Why RevinHi */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">Why RevinHi</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="glass-panel-flat rounded-2xl p-4 sm:p-5">
                <p className="font-semibold">{w.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/55 sm:text-sm">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} RevinHi. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {PRODUCTS.map((p) => (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a key={p.slug} href={p.route} className="transition hover:text-white/70">
                {p.tabLabel}
              </a>
            ))}
            <LegalLinks />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white/70">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
