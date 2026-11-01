import type { Metadata } from "next";
import Link from "next/link";
import { GuideFigure } from "@/components/guides/HowToGuide";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE } from "@/components/threed/ThreeDUi";
import { pageMetadata } from "@/lib/seo";

const SLUG = "cut-hole-in-stl";

export const metadata: Metadata = pageMetadata({
  title: "Cut a Hole in an STL or Combine STL Files | RevinHi 3D",
  description:
    "Cut holes in STL files, subtract one shape from another, or combine several STLs into one, even broken files. Real mm or inch sizes. Free Windows app.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Cut a hole in an STL"
      title="Cut a hole in an STL, or combine STL files"
      intro={
        <p>
          Cutting a hole for a screw, a cable or a magnet, or merging two downloaded models into one print, are some of the
          most common 3D printing edits. RevinHi 3D does both on any STL, including broken ones, with no error messages and
          no automatic fixing. Holes can stay editable, so you can move them later.
        </p>
      }
      stepsTitle="How to cut a hole in an STL"
      steps={[
        {
          title: "Open your model",
          text: "Click Add, then Import a model, and pick your STL. You can import several files at once.",
        },
        {
          title: "Add the shape of the hole",
          text: "Click Add and pick a shape: cube, cylinder, sphere, cone, torus, wedge, tube, star or heart. Type its size in mm or inches, like an 18 mm cylinder for a marker or 3.2 mm for an M3 screw.",
        },
        {
          title: "Make it a Hole and place it",
          text: "In the properties panel, set the shape's Type to Hole. Move it where the hole should go by dragging, or type its exact position.",
          image: SHOTS.editableCuts,
        },
        {
          title: "Cut",
          text: "Click the model, Shift-click the hole shape, then click Cut. Choose Cut, keep editable to move or resize the hole later, or Cut and apply now to make it one plain shape straight away.",
        },
        {
          title: "Print it",
          text: "Export as STL, 3MF, OBJ or GLB, or click Send to slicer. The model opens in your slicer at the same size you see in the app.",
        },
      ]}
      faq={[
        {
          q: "How do I combine two STL files into one?",
          a: "Import both files, move them so they touch or overlap, select them both and click Join. Choose Join, keep editable to move the parts later, or Join and apply now to merge them into one shape. Then export a single STL or 3MF.",
        },
        {
          q: "Can I move a hole after cutting it?",
          a: "Yes, if you used Cut, keep editable. The hole stays a layer you can select, move or resize, and the cut updates on its own. When you're happy, Apply turns it into one plain shape.",
        },
        {
          q: "What if my STL is broken?",
          a: "It still cuts. RevinHi 3D cuts and joins files with holes, overlapping parts and flipped faces without errors, and it never repairs them unless you click a fix button yourself.",
        },
        {
          q: "Can I cut many holes in a row or a circle?",
          a: "Yes. Select a hole shape and use Pattern in a line or Pattern in a circle to make evenly spaced copies before you cut.",
        },
        {
          q: "Can I keep only the overlap, or split a model in two?",
          a: "Yes. Put the shapes in a group and set its Solids option to Keep overlap to keep just the part where they meet. In Advanced mode, the Cut menu also has Split into two parts and Cut along the slice plane, which keep both pieces.",
        },
      ]}
    >
      <h2>Holes that stay editable</h2>
      <p>
        In RevinHi 3D, every shape is a layer set to Solid or Hole. While a cut is editable you can move, resize or hide
        the hole and the result updates, which makes it easy to get a screw hole or a slot in exactly the right place.
        Apply it when you&apos;re done, or choose apply now in Settings if you prefer cuts to happen right away.
      </p>
      <GuideFigure image={SHOTS.brokenFiles} />
      <p>
        Related: <Link href="/3d/fix-broken-stl-files">fix broken STL files</Link>,{" "}
        <Link href="/3d/split-stl-to-fit-print-bed">split an STL to fit your bed</Link> and{" "}
        <Link href="/3d/add-text-to-stl">add text to an STL</Link>.
      </p>
    </ThreeDGuide>
  );
}
