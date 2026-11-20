import type { Metadata } from "next";
import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { JsonLd } from "@/components/pdf/PdfUi";
import { SiteFooter } from "@/components/SiteFooter";
import { APP_GROUPS, PRODUCTS, priceLabel, type Product } from "@/lib/products";
import { ORGANIZATION_LD, pageMetadata, WEBSITE_LD } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "RevinHi: 3D Modeling, PDF Editor & File Recovery for Windows",
  description:
    "Windows 10/11 apps you buy once: a 3D modeling app, an offline PDF editor, file recovery, live wallpapers and a game optimizer. Free versions to try.",
  path: "/",
  imageAlt: "RevinHi logo",
});

const WHY = ["Pay once, no subscription", "Free updates forever", "Free version to try", "Made for Windows 10 and 11"];

/** One row in an app section: icon, name, one line, price, and the main action. */
function AppRow({ product: p }: { product: Product }) {
  const available = p.status === "available";
  return (
    <div className="flex items-center gap-4 p-4 transition hover:bg-white/[0.03]">
      <a href={p.route} aria-hidden="true" tabIndex={-1} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.icon} alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
      </a>
      <a href={p.route} className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 font-bold">
          {p.name}
          {!available && (
            <span className="rounded-full border border-neon-amber/40 bg-neon-amber/10 px-2 py-px text-[10px] font-semibold text-neon-amber">
              Soon
            </span>
          )}
        </h3>
        <p className="text-sm text-white/55">{p.oneLine}</p>
        {p.downloadUrl && available && <p className="mt-0.5 text-xs text-white/40 sm:hidden">{priceLabel(p)}</p>}
      </a>
      {available && p.downloadUrl && <p className="hidden shrink-0 text-right text-xs text-white/50 sm:block">{priceLabel(p)}</p>}
      {available && p.downloadUrl ? (
        <a
          href={`/api/download/${p.slug}`}
          download
          className="shrink-0 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-4 py-1.5 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/25 hover:shadow-[0_0_18px_rgba(0,229,255,0.3)] active:scale-[0.97]"
        >
          Get free
        </a>
      ) : available ? (
        <BuyButton product={p} className="shrink-0 px-4 py-1.5 text-sm" label={<>Buy {p.price}</>} />
      ) : (
        <a
          href={p.route}
          className="shrink-0 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/65 transition hover:border-white/30 hover:text-white"
        >
          View
        </a>
      )}
    </div>
  );
}

export default function StorefrontHome() {
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={ORGANIZATION_LD} />
      <JsonLd data={WEBSITE_LD} />

      <section className="px-4 pb-8 pt-12 text-center sm:px-6 sm:pt-16">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="rgb-chase-text">RevinHi</span> apps for Windows
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-white/60">
          Small apps that each do one job well. Try them free, buy once, keep them forever.
        </p>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {WHY.map((w) => (
            <span key={w} className="glass-panel-flat flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-success" />
              {w}
            </span>
          ))}
        </div>
      </section>

      <section id="apps" className="scroll-mt-24 px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-10">
          {APP_GROUPS.map((g) => {
            const apps = PRODUCTS.filter((p) => p.group === g.id);
            if (apps.length === 0) return null;
            return (
              <div key={g.id}>
                <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{g.title}</h2>
                <div className="glass-panel-flat divide-y divide-white/10 overflow-hidden rounded-2xl">
                  {apps.map((p) => (
                    <AppRow key={p.slug} product={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="glass-panel-flat mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl p-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-bold">How-to guides</h2>
            <p className="mt-1 text-sm text-white/55">
              Fix STL files, edit and sign PDFs, get back deleted files, cut input lag and more.
            </p>
          </div>
          <Link
            href="/guides"
            className="shrink-0 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Browse guides
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
