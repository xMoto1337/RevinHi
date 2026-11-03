import Link from "next/link";
import type { ReactNode } from "react";
import { BuyButton } from "@/components/BuyButton";
import { GuideLinks } from "@/components/guides/GuideLinks";
import { HowToGuide, type GuideFaq, type GuideStep } from "@/components/guides/HowToGuide";
import { MsStoreBadge } from "@/components/MsStoreBadge";
import { getProduct } from "@/lib/products";

/**
 * A guide page for any product (/recovery/<guide>, /performance/<guide>, /desktop/<guide>): the shared
 * HowToGuide layout with that product's Download free / Buy buttons and its other guides.
 * RevinHi 3D uses components/threed/ThreeDGuide.tsx and PDF uses components/pdf/GuidePage.tsx.
 */
export function ProductGuide({
  product: slug,
  guide,
  eyebrow,
  title,
  intro,
  note,
  stepsTitle,
  steps,
  howTo,
  faq,
  pitch,
  children,
}: {
  product: string;
  guide: string;
  eyebrow: string;
  title: string;
  intro: ReactNode;
  /** Small line under the buttons, e.g. "Windows 10/11 · free scan and preview · Pro is $19.99 once". */
  note: ReactNode;
  stepsTitle: string;
  steps: GuideStep[];
  howTo?: boolean;
  faq: GuideFaq[];
  /** One or two sentences in the closing box: what's free and what you pay for. */
  pitch: ReactNode;
  children?: ReactNode;
}) {
  const product = getProduct(slug);
  const available = product.status === "available";
  const free = Boolean(product.downloadUrl) && available;

  const buttons = (size: "lg" | "sm") => {
    const pad = size === "lg" ? "h-11 px-6 text-sm sm:h-[52px] sm:px-8 sm:text-base" : "h-11 px-6 text-sm";
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {free && (
          <a
            href={`/api/download/${product.slug}`}
            download
            className={`inline-flex items-center justify-center rounded-full font-semibold text-black transition hover:scale-[1.02] ${pad}`}
            style={{ background: product.accent, boxShadow: `0 0 30px ${product.accent}59` }}
          >
            Download free
          </a>
        )}
        {free && product.msStoreUrl && <MsStoreBadge href={product.msStoreUrl} sizeClassName={size === "lg" ? "h-11 sm:h-[52px]" : "h-11"} />}
        <BuyButton
          product={product}
          className={free ? "px-6 py-2.5 text-sm" : pad}
          label={free ? <>Get Pro &mdash; {product.price}</> : <>Get it &mdash; {product.price}</>}
        />
      </div>
    );
  };

  return (
    <HowToGuide
      productName={product.name}
      productRoute={product.route}
      slug={guide}
      eyebrow={eyebrow}
      title={title}
      intro={intro}
      accent={product.accent}
      cta={buttons("lg")}
      ctaNote={note}
      stepsTitle={stepsTitle}
      steps={steps}
      howTo={howTo}
      faq={faq}
      bottomCta={
        <div className="glass-panel mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">{free ? `Try ${product.name} free` : `Get ${product.name}`}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">{pitch}</p>
          <div className="mt-7">{buttons("sm")}</div>
          <p className="mt-5 text-sm">
            <Link href={product.route} className="text-neon-cyan underline-offset-2 hover:underline">
              See everything {product.name} does &rarr;
            </Link>
          </p>
        </div>
      }
      moreGuides={<GuideLinks product={slug} current={guide} title={`More ${product.name} guides`} />}
    >
      {children}
    </HowToGuide>
  );
}
