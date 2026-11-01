import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/pdf/PdfUi";
import { SiteFooter } from "@/components/SiteFooter";
import { GUIDES, guidesFor } from "@/lib/guides";
import { getProduct } from "@/lib/products";
import { pageMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How-to Guides for Windows: 3D, PDF, Recovery | RevinHi",
  description:
    "Step-by-step guides: fix and edit STL files, edit, sign and protect PDFs, recover deleted files, cut input lag and set up live wallpapers on Windows.",
  path: "/guides",
  imageAlt: "RevinHi logo",
});

export default function GuidesIndex() {
  // Same order as lib/guides.ts (3D, PDF, Recovery, Performance, Desktop).
  const order = [...new Set(GUIDES.map((g) => g.product))];
  const groups = order.map((slug) => ({ product: getProduct(slug), guides: guidesFor(slug) }));
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "RevinHi guides",
    itemListElement: groups
      .flatMap(({ product, guides }) => guides.map((g) => ({ name: g.label, url: `${SITE_URL}${product.route}/${g.slug}` })))
      .map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.name, url: g.url })),
  };

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={itemList} />
      <section className="px-6 pb-12 pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">How-to guides</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/60 sm:text-lg">
            Step-by-step help for the jobs people use RevinHi apps for, with screenshots of the real apps.
          </p>
          <nav aria-label="Jump to a product" className="mt-7 flex flex-wrap justify-center gap-2 text-sm">
            {groups.map(({ product }) => (
              <a
                key={product.slug}
                href={`#${product.slug}`}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-white/75 transition hover:text-white"
              >
                {product.tabLabel}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="space-y-14 px-6 pb-24">
        {groups.map(({ product, guides }) => (
          <section key={product.slug} id={product.slug} className="mx-auto max-w-5xl scroll-mt-28" aria-labelledby={`h-${product.slug}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id={`h-${product.slug}`} className="text-2xl font-bold tracking-tight">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: product.accent }} />
                {product.name}
              </h2>
              <Link href={product.route} className="text-sm text-neon-cyan underline-offset-2 hover:underline">
                About {product.name} &rarr;
              </Link>
            </div>
            <p className="mt-1 text-sm text-white/55">{product.tagline}</p>
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`${product.route}/${g.slug}`}
                    className="glass-panel-flat block h-full rounded-2xl p-5 transition hover:bg-white/[0.07]"
                  >
                    <span className="font-semibold text-white/90">{g.label}</span>
                    <span className="mt-1 block text-sm text-white/55">{g.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <SiteFooter />
    </div>
  );
}
