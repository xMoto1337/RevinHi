import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/seo";
import { JsonLd, PDF_AVAILABLE, PDF_PRODUCT, PdfBuyButton, PdfDownloadButton, PdfFooter, PdfGuideLinks } from "./PdfUi";

/**
 * Layout for the /pdf/<guide> keyword pages: same hero/glass styling as /pdf, one H1, the article
 * body (h2/p/ol/ul styled here), a download CTA, and links back to /pdf and the sibling guides.
 */
export function GuidePage({
  slug,
  eyebrow,
  title,
  intro,
  children,
}: {
  slug: string;
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "RevinHi", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "RevinHi PDF", item: `${SITE_URL}/pdf` },
      { "@type": "ListItem", position: 3, name: title, item: `${SITE_URL}/pdf/${slug}` },
    ],
  };

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={breadcrumbs} />

      <section className="relative overflow-hidden px-6 pb-12 pt-14 sm:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <nav aria-label="Breadcrumb" className="text-xs text-white/50">
            <Link href="/pdf" className="transition hover:text-white/80">
              RevinHi PDF
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="text-white/70">{eyebrow}</span>
          </nav>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base text-white/60 sm:text-lg">{intro}</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <PdfDownloadButton className="px-8 py-3.5 text-base" />
            <PdfBuyButton className="px-8 py-3.5 text-base" chase />
          </div>
          <p className="mt-4 text-xs text-white/40">
            {PDF_AVAILABLE ? "Windows 10/11 · works offline" : "Coming soon · Windows 10/11 · works offline"} · Pro is{" "}
            {PDF_PRODUCT.price} once, no subscription
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <article
          className="glass-panel mx-auto max-w-3xl rounded-3xl p-6 text-[15px] leading-relaxed text-white/70 sm:p-10
            [&_a]:text-neon-cyan [&_a]:underline-offset-2 [&_a:hover]:underline
            [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&>h2:first-child]:mt-0
            [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:mt-3 [&_strong]:text-white/90
            [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-3 [&_ul]:mt-3"
        >
          {children}
        </article>
      </section>

      <section className="px-6 pb-20">
        <div className="glass-panel mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {PDF_AVAILABLE ? "Try RevinHi PDF free" : "RevinHi PDF is almost here"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
            The free version views, signs, fills forms, annotates and handles page tools. Pro is a one-time{" "}
            {PDF_PRODUCT.price} that removes the watermark and unlocks text editing, compress, conversion and protection.
          </p>
          <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <PdfDownloadButton className="px-7 py-3 text-sm" />
            <PdfBuyButton className="px-7 py-3 text-sm" />
          </div>
          <p className="mt-5 text-sm">
            <Link href="/pdf" className="text-neon-cyan underline-offset-2 hover:underline">
              See everything RevinHi PDF does &rarr;
            </Link>
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <PdfGuideLinks current={slug} title="More guides" />
      </section>

      <PdfFooter />
    </div>
  );
}
