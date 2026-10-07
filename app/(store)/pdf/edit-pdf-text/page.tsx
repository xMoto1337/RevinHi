import type { Metadata } from "next";
import Link from "next/link";
import { GuidePage } from "@/components/pdf/GuidePage";
import { PDF_OG_IMAGE } from "@/components/pdf/PdfUi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Edit PDF Text on Windows, Offline | RevinHi PDF",
  description:
    "Change the words already in a PDF on Windows 10/11, offline. Click a line, retype it, and RevinHi PDF matches the font, size and color. $9.99 once.",
  path: "/pdf/edit-pdf-text",
  image: PDF_OG_IMAGE,
  imageAlt: "RevinHi PDF app icon",
});

export default function EditPdfTextPage() {
  return (
    <GuidePage
      slug="edit-pdf-text"
      eyebrow="Edit PDF text"
      title="Edit the text in a PDF on Windows, offline"
      intro="Fix a typo, update a date or change a price in a PDF without hunting down the original Word file. RevinHi PDF lets you click a line and retype it, right on your PC."
    >
      <h2>Why editing PDF text is usually a pain</h2>
      <p>
        A PDF isn&apos;t a word-processor document. It stores text as positioned pieces on a page, not as flowing
        paragraphs, which is why most free viewers only let you add notes on top. Online editors can change the text, but
        they need you to upload the file first, and the full-featured desktop editors usually come with a monthly
        subscription. RevinHi PDF does it locally, for a one-time price.
      </p>

      <h2>How to edit existing text, step by step</h2>
      <ol>
        <li>
          Open RevinHi PDF and drag your file onto the window, or use <strong>Open PDF</strong> in the Editor.
        </li>
        <li>
          Choose the <strong>Edit text</strong> tool in the toolbar (shortcut <strong>E</strong>).
        </li>
        <li>
          Click the line you want to change and type. RevinHi matches the original font, size and color so the change
          blends in with the rest of the page.
        </li>
        <li>
          Made a mistake? <strong>Ctrl+Z</strong> undoes it and <strong>Ctrl+Y</strong> redoes it. Every edit stays
          movable until you save.
        </li>
        <li>
          Press <strong>Ctrl+S</strong> to save, or <strong>Ctrl+Shift+S</strong> to save a copy and keep the original
          untouched.
        </li>
      </ol>
      <p>
        If you only need to blank something out or add new words, you don&apos;t need text editing at all: the free{" "}
        <strong>Whiteout</strong> tool covers an area with a white box, and the <strong>Text</strong> tool adds a new
        text box anywhere on the page.
      </p>

      <h2>What edited text is, and what it isn&apos;t</h2>
      <p>
        To be upfront about how it works: edited text is drawn over the original. The old words stay in the file
        underneath, hidden from view. That&apos;s perfect for correcting a typo or updating a form letter, but it is{" "}
        <strong>not redaction</strong>. Someone with the right tools could still pull the original text out of the file,
        and the same is true of whiteout. Don&apos;t use either to hide account numbers, personal details or anything
        else sensitive.
      </p>
      <p>
        Results are best on PDFs that were made digitally, such as exports from Word, invoices and statements. A scanned
        page is a picture of text rather than real text, so there&apos;s nothing to retype; for those, cover the area
        with whiteout and add a new text box instead.
      </p>

      <h2>Why offline matters for this</h2>
      <p>
        The documents people most often need to correct are the ones they least want to upload: contracts, invoices, tax
        forms and letters with names and addresses on them. RevinHi PDF runs entirely on your Windows PC. Nothing is sent
        to a server, there&apos;s no account to sign in to, and it works the same with your Wi-Fi turned off.
      </p>

      <h2>Free or Pro?</h2>
      <p>
        Editing existing text is a <strong>Pro</strong> feature. The free version still lets you open the file, add text
        boxes, highlight, draw, use whiteout, sign and fill forms, with a small watermark on exported files. Pro is a
        one-time $9.99 with no subscription, removes the watermark, and includes every future update.
      </p>
      <p>
        Related: <Link href="/pdf/sign-pdf">sign a PDF offline</Link>, <Link href="/pdf/merge-pdf">merge PDF files</Link>{" "}
        and <Link href="/pdf/compress-pdf">compress a PDF</Link>, or see the full <Link href="/pdf">RevinHi PDF</Link>{" "}
        feature list.
      </p>
    </GuidePage>
  );
}
