import type { Metadata } from "next";
import Link from "next/link";
import { GuidePage } from "@/components/pdf/GuidePage";
import { PDF_OG_IMAGE } from "@/components/pdf/PdfUi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Compress a PDF Offline on Windows | RevinHi PDF",
  description:
    "Shrink large PDFs on Windows 10/11 without uploading them. Pick a strength, compress, and see the before and after size. One-time $9.99, no subscription.",
  path: "/pdf/compress-pdf",
  image: PDF_OG_IMAGE,
  imageAlt: "RevinHi PDF app icon",
});

export default function CompressPdfPage() {
  return (
    <GuidePage
      slug="compress-pdf"
      eyebrow="Compress a PDF"
      title="Compress a PDF offline, without uploading it"
      intro="Email attachment limits and upload portals don't care how important your file is. RevinHi PDF shrinks oversized PDFs on your own PC, so you can send them without handing them to a website first."
    >
      <h2>Why some PDFs are so big</h2>
      <p>
        Almost always, it&apos;s the pictures. Scanned pages, phone photos and high-resolution product images are often
        stored at far more detail than anyone needs to read them on a screen. Text itself takes up very little room. That
        means image-heavy PDFs can often shrink by 80% or more, while a PDF that&apos;s mostly text may only get a little
        smaller, because there isn&apos;t much to remove.
      </p>

      <h2>How to compress a PDF, step by step</h2>
      <ol>
        <li>
          Open RevinHi PDF and go to <strong>Tools</strong>, then <strong>Compress</strong> (it&apos;s also on the Home
          screen).
        </li>
        <li>
          Click <strong>Choose PDF</strong> and select the file.
        </li>
        <li>
          Pick a <strong>Strength</strong>:
          <ul>
            <li>
              <strong>Low</strong> keeps images at 150 dpi, high quality and good for printing.
            </li>
            <li>
              <strong>Medium</strong> uses 110 dpi, which looks good on screens and is a sensible default.
            </li>
            <li>
              <strong>High</strong> uses 72 dpi for the smallest file, best for email and upload limits.
            </li>
          </ul>
        </li>
        <li>
          Click <strong>Compress</strong> and choose where to save. By default the new file is named with{" "}
          <strong>_compressed</strong> on the end, so your original is never overwritten.
        </li>
        <li>RevinHi shows the size before and after, and how much smaller the file got.</li>
      </ol>
      <p>
        Compression shrinks oversized images and repacks the file. Text stays sharp at every strength because it
        isn&apos;t turned into pictures. If the result looks too soft, run it again from the original on a lower
        strength.
      </p>

      <h2>Why compress offline?</h2>
      <p>
        The files people need to shrink are often the sensitive ones: scanned IDs, bank statements, medical records and
        signed contracts that are too big for an email or a portal. Online compressors need the whole document uploaded
        to their servers. RevinHi PDF does the work locally on Windows, with no account and no internet connection
        required, so the file never leaves your PC. It&apos;s also quicker for big files, since nothing has to be uploaded
        and downloaded again.
      </p>

      <h2>Tips for the smallest file</h2>
      <ul>
        <li>
          Remove pages you don&apos;t need first. Deleting and extracting pages is free in the Editor and Tools.
        </li>
        <li>
          Splitting a long scan into a few smaller files can get you under an upload limit without lowering quality.
        </li>
        <li>Compress last, after you&apos;ve finished editing, signing and merging.</li>
      </ul>

      <h2>Free or Pro?</h2>
      <p>
        Compress is a <strong>Pro</strong> feature. Pro is a one-time $9.99 with no subscription, and it also removes the
        export watermark and unlocks text editing, PDF to images, password protect/unlock and unlimited merging. The free
        version covers viewing, page tools, annotating, signing, form filling and merging two files at a time, so you can
        try the app before you buy.
      </p>
      <p>
        Related: <Link href="/pdf/merge-pdf">merge PDF files</Link>, <Link href="/pdf/edit-pdf-text">edit PDF text</Link>{" "}
        and <Link href="/pdf/sign-pdf">sign a PDF</Link>. See all features on the{" "}
        <Link href="/pdf">RevinHi PDF</Link> page.
      </p>
    </GuidePage>
  );
}
