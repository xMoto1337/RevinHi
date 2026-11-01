import type { Metadata } from "next";
import Link from "next/link";
import { GuideFigure } from "@/components/guides/HowToGuide";
import { SHOTS, ThreeDGuide } from "@/components/threed/ThreeDGuide";
import { THREED_OG_IMAGE, THREED_PRODUCT } from "@/components/threed/ThreeDUi";
import { pageMetadata } from "@/lib/seo";

const SLUG = "tinkercad-alternative";

export const metadata: Metadata = pageMetadata({
  title: "Offline Tinkercad Alternative for Windows | RevinHi 3D",
  description:
    "Looking for a desktop alternative to Tinkercad? RevinHi 3D is a free Windows app with Solid and Hole shapes that works offline, with no account.",
  path: `/3d/${SLUG}`,
  image: THREED_OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

const ROWS: { label: string; tinkercad: string; revinhi: string }[] = [
  { label: "Where it runs", tinkercad: "In a web browser (Windows, Mac, Chromebook)", revinhi: "Windows 10/11 desktop app" },
  { label: "Internet", tinkercad: "Needed while you work", revinhi: "Not needed to edit" },
  { label: "Account", tinkercad: "Free Autodesk account", revinhi: "None" },
  { label: "Price", tinkercad: "Free", revinhi: `Free; Pro is ${THREED_PRODUCT.price} once for full-detail exports` },
  { label: "Solid and Hole shapes", tinkercad: "Yes", revinhi: "Yes" },
  { label: "Millimeters and inches", tinkercad: "Yes", revinhi: "Yes" },
];

export default function Page() {
  return (
    <ThreeDGuide
      slug={SLUG}
      eyebrow="Offline Tinkercad alternative"
      title="An offline alternative to Tinkercad for Windows"
      intro={
        <p>
          Tinkercad is a popular free 3D design tool from Autodesk that runs in your web browser, and it&apos;s a great
          place to start. If you&apos;d rather use a desktop app that works offline, needs no account and is built
          around editing downloaded STL files for 3D printing, RevinHi 3D is another option. If you know Tinkercad, its
          Solid and Hole shapes will feel familiar.
        </p>
      }
      stepsTitle="How to move a design into RevinHi 3D"
      steps={[
        {
          title: "Export your design",
          text: "In Tinkercad, use Export and save your design as an STL or OBJ file.",
        },
        {
          title: "Open it in RevinHi 3D",
          text: "Click Add, then Import a model, and pick the file. It opens at its real size in millimeters or inches.",
        },
        {
          title: "Keep building with Solid and Hole",
          text: "Add shapes, set each one to Solid or Hole, and Cut or Join. Holes can stay editable layers, so you can move them later, or be applied right away.",
          image: SHOTS.editableCuts,
        },
        {
          title: "Send it to your slicer",
          text: "Click Send to slicer to open the model in Bambu Studio, OrcaSlicer, PrusaSlicer or Cura, or Export it as STL, 3MF, OBJ or GLB.",
        },
      ]}
      faq={[
        {
          q: "Is RevinHi 3D made by Autodesk or connected to Tinkercad?",
          a: "No. RevinHi 3D is a separate app made by RevinHi. Tinkercad and Autodesk are trademarks of Autodesk, Inc., and RevinHi isn't affiliated with or endorsed by Autodesk.",
        },
        {
          q: "Does RevinHi 3D work offline?",
          a: "Yes. Once it's installed, you can design, edit and export without the internet, and you never need an account. The optional AI model maker needs the internet once, to download its AI models.",
        },
        {
          q: "Can I open my Tinkercad designs?",
          a: "Yes, by exporting them from Tinkercad as STL or OBJ and importing that file. Each export comes in as one model you can cut, join and add to.",
        },
        {
          q: "Is it as easy to learn?",
          a: "It's made for beginners too. Simple mode keeps the main tools up front (Add, Cut, Join, Draw, Text and Logo), there are templates to start from, and a short tutorial runs the first time you open it.",
        },
      ]}
    >
      <h2>Side by side</h2>
      <p>The basics, as of November 2026. Check Tinkercad&apos;s own site for its latest details.</p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">Tinkercad</th>
              <th scope="col">RevinHi 3D</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <td className="font-semibold text-white/85">{r.label}</td>
                <td>{r.tinkercad}</td>
                <td>{r.revinhi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What RevinHi 3D is built for</h2>
      <ul>
        <li>Editing downloaded STL files, including broken ones with holes or overlapping parts, without errors or automatic fixing.</li>
        <li>Opening STEP, IGES, 3MF, OBJ, PLY and GLB files as well as STL.</li>
        <li>Print helpers: Send to slicer, Split to fit the bed with pegs, Hollow, and checks for overhangs, thin walls and gaps.</li>
        <li>Text in any font on your PC, logos, lithophanes, and raising or engraving them onto curved surfaces.</li>
        <li>Multi-color 3MF for AMS and multi-material printers.</li>
        <li>Making models from a picture or a description with AI on your own NVIDIA graphics card.</li>
        <li>Sculpting brushes and point, edge and face editing in Advanced mode.</li>
      </ul>
      <GuideFigure image={SHOTS.templates} />

      <h2>When Tinkercad may suit you better</h2>
      <p>
        Tinkercad runs on any computer with a modern browser, including Macs and Chromebooks, and your designs are saved
        to your online account so you can open them anywhere. It also has tools for classrooms and for electronics and
        code-block projects. RevinHi 3D is Windows only and keeps your files on your PC.
      </p>
      <p>
        Related: <Link href="/3d/free-stl-editor">free STL editor for Windows</Link>,{" "}
        <Link href="/3d/cut-hole-in-stl">cut a hole in an STL</Link> and{" "}
        <Link href="/3d/fix-broken-stl-files">fix broken STL files</Link>.
      </p>
      <p className="text-xs text-white/45">
        Tinkercad and Autodesk are registered trademarks of Autodesk, Inc. They are named here only to describe and
        compare. RevinHi is not affiliated with or endorsed by Autodesk.
      </p>
    </ThreeDGuide>
  );
}
