import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd, PdfFooter as Footer } from "@/components/pdf/PdfUi";
import { SITE_URL } from "@/lib/seo";

export type GuideImage = { src: string; alt: string; caption?: string; width?: number; height?: number };
export type GuideStep = { title: string; text: string; image?: GuideImage };
export type GuideFaq = { q: string; a: string };

/**
 * Layout for the "how to" search pages (/3d/<guide>, /recovery/<guide>, ...): one H1, a short intro,
 * numbered steps with real app screenshots, optional extra article sections, an FAQ, and links back
 * to the product and the sibling guides. Emits BreadcrumbList + FAQPage JSON-LD, plus HowTo when
 * `howTo` is set (only where the steps really are a how-to).
 */
export function HowToGuide({
  productName,
  productRoute,
  slug,
  eyebrow,
  title,
  intro,
  accent = "var(--neon-cyan)",
  cta,
  ctaNote,
  stepsTitle,
  steps,
  howTo = true,
  children,
  faq,
  bottomCta,
  moreGuides,
}: {
  productName: string;
  productRoute: string;
  slug: string;
  /** Short label for the breadcrumb, e.g. "Fix broken STL files". */
  eyebrow: string;
  /** The H1, matching the search. */
  title: string;
  intro: ReactNode;
  accent?: string;
  cta: ReactNode;
  ctaNote?: ReactNode;
  stepsTitle: string;
  steps: GuideStep[];
  howTo?: boolean;
  children?: ReactNode;
  faq: GuideFaq[];
  bottomCta: ReactNode;
  moreGuides: ReactNode;
}) {
  const url = `${SITE_URL}${productRoute}/${slug}`;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "RevinHi", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: productName, item: `${SITE_URL}${productRoute}` },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const firstImage = steps.find((s) => s.image)?.image;
  const howToLd = howTo
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: stepsTitle,
        ...(firstImage ? { image: `${SITE_URL}${firstImage.src}` } : {}),
        tool: { "@type": "HowToTool", name: productName },
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.text,
          url: `${url}#step-${i + 1}`,
          ...(s.image ? { image: `${SITE_URL}${s.image.src}` } : {}),
        })),
      }
    : null;

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqLd} />
      {howToLd && <JsonLd data={howToLd} />}

      <section className="relative overflow-hidden px-6 pb-12 pt-14 sm:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <nav aria-label="Breadcrumb" className="text-xs text-white/50">
            <Link href={productRoute} className="transition hover:text-white/80">
              {productName}
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="text-white/70">{eyebrow}</span>
          </nav>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          <div className="mt-6 max-w-2xl text-base text-white/60 sm:text-lg">{intro}</div>
          <div className="mt-8">{cta}</div>
          {ctaNote && <div className="mt-4 text-xs text-white/45">{ctaNote}</div>}
        </div>
      </section>

      <section className="px-6 pb-16" aria-labelledby="steps">
        <h2 id="steps" className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {stepsTitle}
        </h2>
        <ol className="mx-auto mt-10 max-w-4xl space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} id={`step-${i + 1}`} className="glass-panel-flat scroll-mt-28 rounded-3xl p-5 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
                Step {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold sm:text-xl">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/65">{s.text}</p>
              {s.image && (
                <figure className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <Image
                    src={s.image.src}
                    alt={s.image.alt}
                    width={s.image.width ?? 1600}
                    height={s.image.height ?? 900}
                    sizes="(max-width: 896px) 100vw, 832px"
                    className="h-auto w-full"
                    {...(i === 0 ? { fetchPriority: "high" as const } : {})}
                  />
                  {s.image.caption && (
                    <figcaption className="border-t border-white/10 px-4 py-2.5 text-xs text-white/50">{s.image.caption}</figcaption>
                  )}
                </figure>
              )}
            </li>
          ))}
        </ol>
      </section>

      {children && (
        <section className="px-6 pb-16">
          <article
            className="glass-panel mx-auto max-w-3xl rounded-3xl p-6 text-[15px] leading-relaxed text-white/70 sm:p-10
              [&_a]:text-neon-cyan [&_a]:underline-offset-2 [&_a:hover]:underline
              [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&>h2:first-child]:mt-0
              [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:mt-3 [&_strong]:text-white/90
              [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-3 [&_ul]:mt-3
              [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-white/10 [&_td]:py-2.5 [&_td]:pr-3 [&_td]:align-top
              [&_th]:pb-2 [&_th]:pr-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.12em] [&_th]:text-white/50"
          >
            {children}
          </article>
        </section>
      )}

      <section className="px-6 pb-16" aria-labelledby="faq">
        <h2 id="faq" className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Questions
        </h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-4">
          {faq.map((f) => (
            <div key={f.q} className="glass-panel-flat rounded-2xl p-6">
              <h3 className="font-semibold text-white/90">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16">{bottomCta}</section>

      <section className="px-6 pb-24">{moreGuides}</section>

      <Footer />
    </div>
  );
}

/** A screenshot inside a guide's article body (lazy-loaded, captioned). */
export function GuideFigure({ image }: { image: GuideImage }) {
  return (
    <figure className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width ?? 1600}
        height={image.height ?? 900}
        sizes="(max-width: 768px) 100vw, 688px"
        className="h-auto w-full"
      />
      {image.caption && <figcaption className="border-t border-white/10 px-4 py-2.5 text-xs text-white/50">{image.caption}</figcaption>}
    </figure>
  );
}
