import type { Metadata } from "next";
import Link from "next/link";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE } from "@/components/threed/ThreeDUi";
import { pageMetadata } from "@/lib/seo";

const SLUG = "picture-to-3d-model";

export const metadata: Metadata = pageMetadata({
  title: "Picture to 3D Model with Free Offline AI | RevinHi 3D",
  description:
    "Turn a photo or a description into a 3D model you can print, with AI that runs on your own NVIDIA graphics card. Nothing uploaded, no credits, no account.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Picture to 3D model"
      title="Turn a picture into a 3D model, offline"
      intro={
        <p>
          RevinHi 3D&apos;s Generate tool makes a 3D model from a photo or a few words, using AI that runs on your own
          graphics card. Your pictures never leave your PC, there are no credits to buy, and you don&apos;t need an
          account. You type the size, and the model lands on the bed ready to edit and print.
        </p>
      }
      stepsTitle="How to make a 3D model from a picture"
      steps={[
        {
          title: "Open Generate",
          text: "Click Generate in the toolbar and pick Picture (or Description to start from words). The first time, the app downloads its AI models, which takes about 10 GB of disk space. After that it works without the internet.",
        },
        {
          title: "Choose your picture",
          text: "Pick a photo or drawing. Leave Take the background away on so only your object is turned into 3D. A clear picture of a single object works best.",
          image: SHOTS.ai,
        },
        {
          title: "Pick a quick look",
          text: "The app makes four quick looks of the shape. Pick the one you like, or ask for four new looks.",
        },
        {
          title: "Set the size and make it",
          text: "Type how big it should be, like 80 mm tall, wide or deep. Pick Quick or Fine detail, and turn on Keep the colors to group its colors into 2 to 8 filament colors for a multi-color print. Then click Make look.",
        },
        {
          title: "Make it printable and print",
          text: "AI models often have small gaps. Make it printable rebuilds the model as one closed, solid surface (Undo takes it back). Then edit it like any other model, Export it, or Send to slicer.",
        },
      ]}
      faq={[
        {
          q: "Are my pictures uploaded anywhere?",
          a: "No. The AI runs on your own PC, so your pictures and descriptions never leave your computer. The internet is only used to download the AI models the first time.",
        },
        {
          q: "What graphics card do I need?",
          a: "An NVIDIA graphics card with 6 GB or more of video memory, and about 10 GB of free disk space for the AI models. The app picks settings for your card, and tells you plainly if your PC doesn't have a card it can use. The rest of RevinHi 3D works on any Windows 10/11 PC.",
        },
        {
          q: "Can I start from words instead of a photo?",
          a: "Yes. On the Description tab, type what you want. The app draws four pictures, you pick one, and it turns that picture into a 3D model the same way.",
        },
        {
          q: "Does it keep the colors?",
          a: "If you turn on Keep the colors, the model's colors are grouped into 2 to 8 filament colors, so you can save a multi-color 3MF for AMS and multi-material printers.",
        },
        {
          q: "Does the free version make AI models?",
          a: "Yes. Free and Pro generate exactly the same way. The only difference is how much detail is kept when you export, as explained below.",
        },
      ]}
    >
      <h2>What to expect</h2>
      <p>
        Picture-to-3D AI guesses the parts of an object it can&apos;t see, so results vary with the picture. Simple,
        chunky objects like figurines, toys and ornaments usually come out best. Thin parts and fine text are harder, and
        it&apos;s often quicker to add text yourself with the <Link href="/3d/add-text-to-stl">Text tool</Link>.
      </p>
      <p>
        Because the model is placed at the size you type, it&apos;s ready to cut, join, hollow or{" "}
        <Link href="/3d/split-stl-to-fit-print-bed">split to fit your bed</Link> straight away.
      </p>
    </ThreeDGuide>
  );
}
