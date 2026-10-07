import type { Metadata } from "next";
import Link from "next/link";
import { GuidePage } from "@/components/pdf/GuidePage";
import { PDF_OG_IMAGE } from "@/components/pdf/PdfUi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Merge PDF Files on Windows, Offline | RevinHi PDF",
  description:
    "Combine PDF files on Windows 10/11 without uploading them. Put files in order, merge, then reorder, rotate or delete pages. Merging 2 files is free.",
  path: "/pdf/merge-pdf",
  image: PDF_OG_IMAGE,
  imageAlt: "RevinHi PDF app icon",
});

export default function MergePdfPage() {
  return (
    <GuidePage
      slug="merge-pdf"
      eyebrow="Merge PDFs"
      title="Merge PDF files on Windows"
      intro="Turn a cover letter, a résumé and a reference letter into one file, or join scanned pages into a single document. RevinHi PDF merges PDFs right on your PC, then lets you tidy up the pages."
    >
      <h2>Merge files with the Merge tool</h2>
      <ol>
        <li>
          Open RevinHi PDF and go to <strong>Tools</strong>, then <strong>Merge</strong> (also on the Home screen).
        </li>
        <li>Add the PDFs you want to combine.</li>
        <li>
          Put them in order with <strong>Move up</strong> and <strong>Move down</strong>. Use <strong>Remove</strong> to
          drop a file you added by mistake.
        </li>
        <li>
          Click <strong>Merge</strong> and choose where to save. The new file is named after the first one, with{" "}
          <strong>_merged</strong> on the end, and your originals are left untouched.
        </li>
      </ol>

      <h2>Or insert pages into a document you&apos;re editing</h2>
      <p>
        If you already have a PDF open in the <strong>Editor</strong>, right-click a page thumbnail and choose{" "}
        <strong>Insert pages from file after…</strong>, or use the insert button in the toolbar. The other file&apos;s
        pages go in exactly where you want them, rather than only at the end.
      </p>

      <h2>Tidy up the result</h2>
      <p>Once the files are combined, the free page tools help you get it right before you send it:</p>
      <ul>
        <li>Drag page thumbnails to reorder them.</li>
        <li>Rotate sideways scans left or right.</li>
        <li>Delete blank or duplicate pages.</li>
        <li>Insert a blank page as a divider.</li>
        <li>Extract a range of pages into their own file.</li>
      </ul>
      <p>
        Need the opposite? <strong>Split</strong> in Tools breaks a PDF apart into one file per page, every N pages, or
        custom ranges.
      </p>

      <h2>Why merge offline?</h2>
      <p>
        Merging is often the step right before you send something important, like a job application, a loan file, a
        claim with receipts or a set of signed contracts. Online merge sites need every one of those files uploaded first.
        RevinHi PDF runs entirely on your Windows PC, so nothing leaves your computer, there&apos;s no account to make,
        and it works without an internet connection. Big scans merge quickly because there&apos;s no upload or download
        wait.
      </p>

      <h2>Free or Pro?</h2>
      <p>
        Merging is <strong>free</strong> two files at a time. You can still build a larger document for free by merging
        in steps (merge two, then merge the result with the next), or by inserting pages in the Editor. Free exports carry
        a small watermark.
      </p>
      <p>
        <strong>Pro</strong> is a one-time $9.99, with no subscription. It merges any number of files in one go, removes
        the watermark, and adds text editing, compress, PDF to images and password protection. A merged file full of
        scans is often large, so <Link href="/pdf/compress-pdf">compressing it</Link> afterwards is a natural next step.
      </p>
      <p>
        Related: <Link href="/pdf/sign-pdf">sign a PDF</Link>, <Link href="/pdf/edit-pdf-text">edit PDF text</Link>{" "}
        and the <Link href="/pdf/adobe-acrobat-alternative">one-time Acrobat alternative</Link>. Full details are on the{" "}
        <Link href="/pdf">RevinHi PDF</Link> page.
      </p>
    </GuidePage>
  );
}
