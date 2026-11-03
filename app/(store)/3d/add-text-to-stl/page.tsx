import type { Metadata } from "next";
import Link from "next/link";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE } from "@/components/threed/ThreeDUi";
import { pageMetadata } from "@/lib/seo";

const SLUG = "add-text-to-stl";

export const metadata: Metadata = pageMetadata({
  title: "Add Text to an STL File for 3D Printing | RevinHi 3D",
  description:
    "Add raised or engraved text to any STL in any font on your PC, even on curved surfaces. Set the letter height and depth in mm. Free Windows app.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Add text to an STL"
      title="Add text to an STL or 3D print"
      intro={
        <p>
          Put a name on a keychain, a label on a box or a word on a plant pot. RevinHi 3D adds 3D text in any font
          installed on your PC, raised up or cut in, and can wrap it onto curved surfaces. Letter sizes are in real
          millimeters or inches, so you know exactly how it will print.
        </p>
      }
      stepsTitle="How to add text to an STL"
      steps={[
        {
          title: "Open your model",
          text: "Click Add, then Import a model, and pick your STL (OBJ, 3MF and STEP work too). Or start from a template like a sign, keychain or name plate.",
        },
        {
          title: "Add text and pick a font",
          text: "Click Text, then type your words in the properties panel. Choose any font installed on your PC and turn on Bold if you like.",
          image: SHOTS.text,
        },
        {
          title: "Set the size",
          text: "Type the letter height, letter spacing and depth in mm or inches. Add a bevel for rounded edges, or set a curve radius to bend the words around a circle.",
        },
        {
          title: "Put it on the model",
          text: "Move the text onto the model and Join them. For a curved surface, use Raise onto… to wrap the text onto it, or Cut into… to engrave it. You can also set the text's Type to Hole and Cut, to sink the letters into a flat face.",
          image: SHOTS.raise,
        },
        {
          title: "Print it, in one color or two",
          text: "Export or click Send to slicer. For two-color text, give the text its own color (or paint the faces) and save a multi-color 3MF for AMS and multi-material printers.",
        },
      ]}
      faq={[
        {
          q: "Raised or engraved: which prints better?",
          a: "Both work. Raised text stands out and is easy to paint or print in a second color. Engraved text is cut into the surface and won't snag. In RevinHi 3D you can switch between them any time before you apply the cut.",
        },
        {
          q: "Which fonts can I use?",
          a: "Any font installed on your Windows PC. Install a new font in Windows and it shows up in the font list.",
        },
        {
          q: "Can text follow a curved surface?",
          a: "Yes. Raise onto… and Cut into… project the text onto the surface you pick, so it bends to follow curves like the side of a pot or a mug.",
        },
        {
          q: "How small can the letters be?",
          a: "That depends on your printer and nozzle. After adding text, click Check and turn on Too thin to print to see any parts of the letters that are too thin for your printer.",
        },
        {
          q: "Can I mirror text for a stamp?",
          a: "Yes. Select the text and use Mirror in the Arrange section, or start from the Stamp template.",
        },
      ]}
    >
      <h2>Logos and pictures, too</h2>
      <p>
        The Logo tool turns a picture, SVG or DXF into a raised shape with a live preview, and it can be raised onto or
        cut into surfaces the same way as text. For a photo that shows when light shines through it, see the{" "}
        <Link href="/3d/lithophane-maker">lithophane maker</Link>.
      </p>
      <p>
        Related: <Link href="/3d/cut-hole-in-stl">cut a hole in an STL</Link> and{" "}
        <Link href="/3d/free-stl-editor">free STL editor for Windows</Link>.
      </p>
    </ThreeDGuide>
  );
}
