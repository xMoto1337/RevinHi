import type { Metadata } from "next";
import Link from "next/link";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE } from "@/components/threed/ThreeDUi";
import { pageMetadata } from "@/lib/seo";

const SLUG = "split-stl-to-fit-print-bed";

export const metadata: Metadata = pageMetadata({
  title: "Split a Large STL to Fit Your Print Bed | RevinHi 3D",
  description:
    "Cut a model that's too big for your 3D printer into parts that fit the bed, with pegs or dovetails so they line up. Free Windows app, works on broken STLs.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Split an STL to fit your bed"
      title="Split a big STL to fit your print bed"
      intro={
        <p>
          Some models are simply bigger than your printer. RevinHi 3D&apos;s Split to fit the bed cuts a model into
          parts that each fit your bed, and can add pegs or dovetails so the parts line up when you glue them together.
        </p>
      }
      stepsTitle="How to split an STL for your printer"
      steps={[
        {
          title: "Pick your printer",
          text: "In Settings, under Printer, choose your printer bed: Bambu Lab X1, P1, A1 or A1 mini, Prusa MK4 or Creality Ender 3. Your bed shows on the grid. If your printer isn't listed, pick one whose bed is no bigger than yours.",
        },
        {
          title: "Open the model at its real size",
          text: "Import your STL and type the finished size you want in mm or inches. A downloaded file that looks like it was made in inches gets an offer to scale it, never an automatic change.",
        },
        {
          title: "Start Split to fit the bed",
          text: "Select the model and click Split to fit the bed under Print in the properties panel (it's also in the Slicer menu). Click Suggest cuts for even cuts where every part fits, or add your own left-right, front-back and up-down cuts.",
          image: SHOTS.split,
        },
        {
          title: "Move the cuts and add pegs",
          text: "Drag a cut plane in the view or type where it goes. The bar tells you how many parts there are and whether each one fits the bed. Turn on Pegs so the parts line up. In Advanced mode you can pick pegs or dovetails and set their size and fit room.",
        },
        {
          title: "Split and print",
          text: "Click Split. Each part becomes its own object, ready to Export or Send to slicer.",
        },
      ]}
      faq={[
        {
          q: "How do the pegs work?",
          a: "Each cut gets matching pegs and holes, so the parts line up and stay put while the glue sets. Fit room adds a little extra space in the holes for your printer's tolerance; 0.2 mm suits most printers.",
        },
        {
          q: "Can I choose where the cuts go?",
          a: "Yes. Suggest cuts gives you even cuts to start with, and you can drag any plane, type its exact position, add more cuts or remove them before you click Split.",
        },
        {
          q: "Does it work on broken STL files?",
          a: "Yes. The same cutting engine that handles broken files is used for splitting, so models with gaps or overlapping parts split too.",
        },
        {
          q: "Can I save filament on a big print?",
          a: "Yes. Hollow, under Print, gives a model a wall thickness you choose and lets you click to place drain holes. It stays editable, so you can change the wall later.",
        },
      ]}
    >
      <h2>Tips for big prints</h2>
      <ul>
        <li>Put cuts across flat, plain areas where a seam is easy to hide and sand.</li>
        <li>Fewer, larger parts are usually stronger than many small ones.</li>
        <li>
          Click Check before you split to see overhangs that need support, and use Lay flat so a cut face sits flat
          on the bed.
        </li>
      </ul>
      <p>
        Related: <Link href="/3d/fix-broken-stl-files">fix broken STL files</Link>,{" "}
        <Link href="/3d/cut-hole-in-stl">cut a hole in an STL</Link> and{" "}
        <Link href="/3d/free-stl-editor">free STL editor for Windows</Link>.
      </p>
    </ThreeDGuide>
  );
}
