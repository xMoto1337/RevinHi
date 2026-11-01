import Link from "next/link";
import type { ReactNode } from "react";
import { BuyButton } from "@/components/BuyButton";
import { HowToGuide, type GuideFaq, type GuideImage, type GuideStep } from "@/components/guides/HowToGuide";
import { FREE_VS_PRO_EXPORTS } from "@/lib/3d-copy";
import { THREED_ACCENT, THREED_AVAILABLE, THREED_PRODUCT, ThreeDGetButtons, ThreeDGuideLinks, ThreeDStoreNote } from "./ThreeDUi";

/** Real app screenshots (RevinHi 3D 1.0.0, from revinhi-3d/store/listing/screenshots), as 1600 px webp. */
export const SHOTS = {
  editableCuts: {
    src: "/3d/screens/01-editable-cuts.webp",
    alt: "RevinHi 3D with a desk organizer: a marker hole shape set to Hole, its 18 mm size typed in the properties panel, and the hole layers listed on the left",
    caption: "Holes stay layers you can move or resize later. Sizes are typed in mm or inches.",
  },
  brokenFiles: {
    src: "/3d/screens/02-broken-files.webp",
    alt: "A broken STL cube with a missing face, cut by two cylinders, with Check for print problems showing 4 open edges in red",
    caption: "This STL is missing a face. It still cuts, and Check shows the gaps without changing anything.",
  },
  templates: {
    src: "/3d/screens/03-templates.webp",
    alt: "Templates in RevinHi 3D: a phone stand, a plant pot, a keychain with the name MAYA and a coaster on a printer bed",
    caption: "Start from a template, like a phone stand, plant pot, keychain or coaster, and change anything.",
  },
  text: {
    src: "/3d/screens/04-text-and-fonts.webp",
    alt: "A sign with the word Welcome in Segoe Script, with letter height, letter spacing, curve radius, depth and bevel in the properties panel",
    caption: "Text uses any font on your PC. Set the letter height, depth and curve.",
  },
  raise: {
    src: "/3d/screens/05-raise-onto-surfaces.webp",
    alt: "The word BASIL raised onto the curved side of a plant pot, with the Raise onto and Cut into buttons in the properties panel",
    caption: "Raise onto… wraps text onto a curved surface. Cut into… engraves it.",
  },
  parts: {
    src: "/3d/screens/06-parts.webp",
    alt: "Parts from the RevinHi 3D parts library: an M8 x 40 bolt with an M8 nut, a 24-tooth and a 12-tooth gear, and a hinge",
    caption: "Real bolts, nuts, threads, gears and hinges, ready to print.",
  },
  split: {
    src: "/3d/screens/07-split-to-fit-bed.webp",
    alt: "A 288 mm tall plant pot with an up-down cut plane at 144 mm, the Split to fit Bambu Lab X1 bar, and pegs turned on",
    caption: "Split to fit the bed: 2 parts, each fits the bed, with pegs so the parts line up.",
  },
  paint: {
    src: "/3d/screens/08-multi-color-paint.webp",
    alt: "A Welcome sign painted in two colors with the Fill tool, ready for a multi-color 3MF",
    caption: "Paint faces in colors for a multi-color 3MF.",
  },
  ai: {
    src: "/3d/screens/09-ai-generate.webp",
    alt: "The Generate panel: an owl picture with the background taken away, four quick looks, size 80 mm tall, and the finished colored owl model",
    caption: "Made on an RTX 3060 Ti: a picture, four quick looks, then a colored 3D model at 80 mm tall.",
  },
  sculpt: {
    src: "/3d/screens/10-sculpting.webp",
    alt: "A face sculpted into a sphere with the Push / pull brush in Advanced mode, with the brush settings and undo history on the right",
    caption: "Advanced mode adds sculpting brushes.",
  },
} satisfies Record<string, GuideImage>;

const PRO_LINE = `Pro is a one-time ${THREED_PRODUCT.price} on Gumroad with free updates: no subscription and no account.`;

/** Standard last FAQ item on every 3D guide, built from the shared free-tier sentence. */
export const FREE_FAQ: GuideFaq = { q: "Is RevinHi 3D free?", a: `${FREE_VS_PRO_EXPORTS} ${PRO_LINE}` };

export function ThreeDGuide({
  slug,
  eyebrow,
  title,
  intro,
  stepsTitle,
  steps,
  howTo,
  faq,
  children,
}: {
  slug: string;
  eyebrow: string;
  title: string;
  intro: ReactNode;
  stepsTitle: string;
  steps: GuideStep[];
  howTo?: boolean;
  faq: GuideFaq[];
  children?: ReactNode;
}) {
  return (
    <HowToGuide
      productName={THREED_PRODUCT.name}
      productRoute={THREED_PRODUCT.route}
      slug={slug}
      eyebrow={eyebrow}
      title={title}
      intro={intro}
      accent={THREED_ACCENT}
      cta={<ThreeDGetButtons />}
      ctaNote={
        <>
          <p>Windows 10/11 (64-bit) &middot; every tool free &middot; Pro is {THREED_PRODUCT.price} once</p>
          <ThreeDStoreNote className="mt-1.5" />
        </>
      }
      stepsTitle={stepsTitle}
      steps={steps}
      howTo={howTo}
      faq={[...faq, FREE_FAQ]}
      bottomCta={
        <div className="glass-panel mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {THREED_AVAILABLE ? "Try RevinHi 3D free" : "RevinHi 3D is almost here"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">{FREE_VS_PRO_EXPORTS}</p>
          <ThreeDGetButtons size="sm" className="mt-7" />
          <div className="mt-4 flex justify-center">
            <BuyButton product={THREED_PRODUCT} className="px-6 py-2.5 text-sm" label={<>Get Pro &mdash; {THREED_PRODUCT.price}</>} />
          </div>
          <ThreeDStoreNote className="mt-4" />
          <p className="mt-5 text-sm">
            <Link href="/3d" className="text-neon-cyan underline-offset-2 hover:underline">
              See everything RevinHi 3D does &rarr;
            </Link>
          </p>
        </div>
      }
      moreGuides={<ThreeDGuideLinks current={slug} title="More RevinHi 3D guides" />}
    >
      {children}
    </HowToGuide>
  );
}
