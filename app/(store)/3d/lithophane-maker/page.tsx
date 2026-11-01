import type { Metadata } from "next";
import Link from "next/link";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE } from "@/components/threed/ThreeDUi";
import { FREE_VS_PRO_EXPORTS } from "@/lib/3d-copy";
import { pageMetadata } from "@/lib/seo";

const SLUG = "lithophane-maker";

export const metadata: Metadata = pageMetadata({
  title: "Free Lithophane Maker for Windows | RevinHi 3D",
  description:
    "Turn a photo into a flat or curved lithophane STL or 3MF. Set the width and thickness in mm, then send it to your slicer. Offline Windows app, free to use.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Lithophane maker"
      title="Make a lithophane from a photo"
      intro={
        <p>
          A lithophane is a thin 3D print that shows a photo when you hold it up to a light. RevinHi 3D makes flat or
          curved lithophanes from your own pictures, on your PC, at the exact size you type. Nothing is uploaded.
        </p>
      }
      stepsTitle="How to make a lithophane"
      steps={[
        {
          title: "Start a lithophane",
          text: "Click Add, then Lithophane from a photo… You can also pick the Lithophane template from File, then New from template.",
        },
        {
          title: "Choose a photo",
          text: "Click Choose a photo… and pick a PNG, JPG, BMP, WebP or GIF. The preview shows it in gray, the way light will come through: dark parts are printed thicker, so they let less light through.",
        },
        {
          title: "Set the size and thickness",
          text: "Type the width, then the thinnest and thickest parts (it starts at 100 mm wide, 0.8 mm thinnest and 3 mm thickest). Choose Flat, or Curved and set how far it bends, from 10° up to a full 360° circle. Then click Make lithophane.",
        },
        {
          title: "Adjust it any time",
          text: "The lithophane stays editable: select it and change the width, thickness or curve in the properties panel. Add a frame or a stand with the other tools and Join them if you like.",
        },
        {
          title: "Print it",
          text: "Click Send to slicer to open it in Bambu Studio, OrcaSlicer, PrusaSlicer or Cura, or Export it as STL or 3MF.",
          image: {
            ...SHOTS.editableCuts,
            caption: "Send to slicer and Split to fit the bed sit under Print in the properties panel, for lithophanes and every other model.",
          },
        },
      ]}
      faq={[
        {
          q: "What makes a good lithophane photo?",
          a: "A sharp photo with clear faces or shapes and good contrast. Very dark or very bright photos lose detail, because the darkest parts all print at the thickest setting and the brightest parts at the thinnest.",
        },
        {
          q: "Flat or curved?",
          a: "Flat lithophanes suit frames and window hangers. Curved ones stand up on their own and suit lamp shades and night lights. Set any curve from 10° to 360°.",
        },
        {
          q: "What filament should I use?",
          a: "White or natural (uncolored) filament shows the photo best, because the picture comes from how much light passes through.",
        },
        {
          q: "Can I make a height map instead?",
          a: "Yes. Turn on Light parts thick instead (height map) in the lithophane window, and light parts of the picture are raised instead of dark ones.",
        },
        {
          q: "Will a free export keep the detail?",
          a: `${FREE_VS_PRO_EXPORTS} Lithophanes have a lot of fine detail, so the difference shows more on them than on most models. Try it free to see.`,
        },
      ]}
    >
      <h2>How a lithophane works</h2>
      <p>
        Light passes more easily through thin plastic than thick plastic. A lithophane turns each pixel of your photo into
        a thickness: dark pixels become thick, light pixels become thin. Lit from behind, the thick and thin areas make
        the photo appear.
      </p>
      <p>
        Related: <Link href="/3d/picture-to-3d-model">picture to 3D model with offline AI</Link>,{" "}
        <Link href="/3d/add-text-to-stl">add text to an STL</Link> and{" "}
        <Link href="/3d/free-stl-editor">free STL editor for Windows</Link>.
      </p>
    </ThreeDGuide>
  );
}
