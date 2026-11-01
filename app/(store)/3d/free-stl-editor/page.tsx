import type { Metadata } from "next";
import Link from "next/link";
import { GuideFigure } from "@/components/guides/HowToGuide";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE } from "@/components/threed/ThreeDUi";
import { pageMetadata } from "@/lib/seo";

const SLUG = "free-stl-editor";

export const metadata: Metadata = pageMetadata({
  title: "Free STL Editor for Windows 10 and 11 | RevinHi 3D",
  description:
    "Edit STL files free on Windows: resize in mm or inches, cut holes, join parts, add text, split for your bed and send to your slicer. Opens broken files.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Free STL editor"
      title="A free STL editor for Windows"
      intro={
        <p>
          Need to resize a downloaded model, cut a hole in it, add a name or split it for your printer? RevinHi 3D is a
          Windows app for editing STL files for 3D printing. It opens broken files too, sizes everything in real
          millimeters or inches, and every tool is free to use.
        </p>
      }
      stepsTitle="How to edit an STL file"
      steps={[
        {
          title: "Open your STL",
          text: "Click Add, then Import a model. RevinHi 3D opens STL, OBJ, 3MF, STEP, IGES, PLY and GLB files, including broken ones with holes or overlapping parts.",
        },
        {
          title: "Type the size you want",
          text: "Select the model and type its width, depth or height in the properties panel, in mm or inches (25 mm, 2 in and 1 1/2\" all work). Turn on Keep proportions and the other sizes follow.",
          image: SHOTS.editableCuts,
        },
        {
          title: "Change it",
          text: "Cut holes, Join parts, add Text in any font on your PC, turn a picture into a Logo, or Draw your own shapes. Add, then Parts has ready-made bolts, nuts, threaded holes, hinges, gears, clips and boxes with lids.",
          image: SHOTS.parts,
        },
        {
          title: "Check it before you print",
          text: "Check shows overhangs that need support, walls too thin to print and gaps in the surface. Hollow saves filament, and Split to fit the bed cuts big models into parts that fit your printer.",
        },
        {
          title: "Export or send to your slicer",
          text: "Export as STL, 3MF, OBJ or GLB, or click Send to slicer to open it in Bambu Studio, OrcaSlicer, PrusaSlicer or Cura. Painted colors go into a multi-color 3MF for AMS and multi-material printers.",
          image: SHOTS.paint,
        },
      ]}
      faq={[
        {
          q: "Which files can it open and save?",
          a: "It opens STL, OBJ, 3MF, STEP, IGES, PLY and GLB, and exports STL, OBJ, 3MF and GLB. Projects save as .rv3d files that keep every layer editable.",
        },
        {
          q: "Do I need an account or the internet?",
          a: "No account. Editing works on your PC without the internet. The only download inside the app is the optional AI model maker, which downloads its AI models the first time you use it.",
        },
        {
          q: "Can I edit the triangles of an STL directly?",
          a: "Yes, in Advanced mode. You can select points, edges and faces and edit them, and sculpt with push, pull, smooth, inflate, flatten, pinch, crease and grab brushes.",
        },
        {
          q: "Is there a Mac version?",
          a: "No. RevinHi 3D is made for Windows 10 and 11 (64-bit). It's on the Microsoft Store as well as this website.",
        },
        {
          q: "Is it good for beginners?",
          a: "Yes. Simple mode keeps the main tools up front, there are templates like a keychain, sign, phone stand and plant pot to start from, and a short tutorial shows the basics the first time you open it.",
        },
      ]}
    >
      <h2>What you can do with it</h2>
      <ul>
        <li>Resize to an exact size in mm or inches that opens at the same size in your slicer.</li>
        <li>Cut, join and subtract shapes, and keep each cut editable so you can move it later.</li>
        <li>Add text, logos and lithophanes, or raise and engrave them onto curved surfaces.</li>
        <li>Start from templates: keychain, sign, stamp, box with lid, phone stand, cable clip, plant pot and more.</li>
        <li>Make a model from a picture or a description with AI that runs on your own graphics card.</li>
      </ul>
      <GuideFigure image={SHOTS.templates} />
      <p>
        Related: <Link href="/3d/fix-broken-stl-files">fix broken STL files</Link>,{" "}
        <Link href="/3d/add-text-to-stl">add text to an STL</Link> and{" "}
        <Link href="/3d/tinkercad-alternative">an offline Tinkercad alternative</Link>.
      </p>
    </ThreeDGuide>
  );
}
