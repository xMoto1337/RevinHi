import type { Metadata } from "next";
import Link from "next/link";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE } from "@/components/threed/ThreeDUi";
import { pageMetadata } from "@/lib/seo";

const SLUG = "fix-broken-stl-files";

export const metadata: Metadata = pageMetadata({
  title: "Fix Broken STL Files Free on Windows | RevinHi 3D",
  description:
    "Open STL files with holes, gaps or flipped faces, then cut, join and print them anyway. Free Windows app that never changes your model on its own.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Fix broken STL files"
      title="Fix broken STL files for free"
      intro={
        <p>
          Lots of STL files you download have small problems: holes in the surface, parts that overlap, or faces pointing
          the wrong way. Many 3D apps refuse to cut them, or change them without asking. RevinHi 3D opens them as they are,
          lets you cut and join them anyway, and shows you the problems so you decide what, if anything, gets fixed.
        </p>
      }
      stepsTitle="How to fix and edit a broken STL"
      steps={[
        {
          title: "Open the file",
          text: "Click Add, then Import a model, and pick your STL. OBJ, 3MF, STEP, PLY and GLB files work too. Broken files open just like clean ones, with no error messages.",
        },
        {
          title: "See what's wrong",
          text: "Click Check and turn on Gaps in the surface. Open edges show up in red, and the panel tells you how many there are. Needs support and Too thin to print show other print problems. Check only shows problems; it never changes your model.",
          image: SHOTS.brokenFiles,
        },
        {
          title: "Edit it as it is",
          text: "Cut holes, join parts and add text straight away. The cutting engine works on open and overlapping models, so you don't have to repair a file before you can change it.",
          image: SHOTS.editableCuts,
        },
        {
          title: "Fix only what you choose (optional)",
          text: "Switch to Advanced mode, select the model, and open Fix: Close holes, Fix normals (for flipped faces), Remove duplicates, or Make solid. They only run when you click them, and Undo takes them back.",
        },
        {
          title: "Send it to your slicer",
          text: "Click Send to slicer to open the model in Bambu Studio, OrcaSlicer, PrusaSlicer or Cura, or Export it as STL, 3MF, OBJ or GLB. Sizes stay in real millimeters or inches.",
        },
      ]}
      faq={[
        {
          q: "Does RevinHi 3D fix my file automatically?",
          a: "No. It never repairs, closes or changes a model on its own. You can cut and join a broken file exactly as it is. If you want to patch it, the fix buttons in Advanced mode run only when you click them.",
        },
        {
          q: "What kinds of broken STL files does it open?",
          a: "Files with holes or missing faces, parts that overlap or cross through each other, faces pointing the wrong way, and duplicate faces. They open, and cutting and joining work on them like on any other model.",
        },
        {
          q: "How do I find the holes in an STL?",
          a: "Click Check and turn on Gaps in the surface. Open edges are drawn in red and counted. In Advanced mode, the properties panel also says whether the selected model is a closed solid.",
        },
        {
          q: "What about AI-made models with gaps?",
          a: "Models from the built-in AI often have small gaps and tangled faces. After one is made, the Make it printable button removes loose crumbs and rebuilds it as one closed, solid surface. Undo takes it back.",
        },
      ]}
    >
      <h2>Why so many STL files are broken</h2>
      <p>
        An STL file is just a list of triangles. Nothing in the format checks that those triangles form a closed,
        watertight shape, so files exported from scans, sculpting apps, games and AI tools often have gaps, overlaps or
        flipped faces. Many slicers can still print small problems like these, but a lot of 3D editors stop with an
        error the moment you try to cut or join them.
      </p>
      <h2>Fix or leave it?</h2>
      <p>
        Automatic repair can quietly move or delete parts of a model. RevinHi 3D leaves that choice to you: edit the file
        as it is, look at the problems with Check, and use a fix button only when you want one.
      </p>
      <p>
        Related: <Link href="/3d/cut-hole-in-stl">cut a hole in an STL</Link>,{" "}
        <Link href="/3d/free-stl-editor">free STL editor for Windows</Link> and{" "}
        <Link href="/3d/split-stl-to-fit-print-bed">split an STL to fit your bed</Link>.
      </p>
    </ThreeDGuide>
  );
}
