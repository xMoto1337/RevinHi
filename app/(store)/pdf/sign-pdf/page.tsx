import type { Metadata } from "next";
import Link from "next/link";
import { GuidePage } from "@/components/pdf/GuidePage";
import { PDF_OG_IMAGE } from "@/components/pdf/PdfUi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign a PDF Offline on Windows - Free | RevinHi PDF",
  description:
    "Sign PDFs and fill in forms on Windows 10/11 without uploading them. Draw, type or upload your signature once and place it on any page. Free to use.",
  path: "/pdf/sign-pdf",
  image: PDF_OG_IMAGE,
  imageAlt: "RevinHi PDF app icon",
});

export default function SignPdfPage() {
  return (
    <GuidePage
      slug="sign-pdf"
      eyebrow="Sign a PDF"
      title="Sign a PDF offline on Windows"
      intro="No printing, scanning or uploading. Make your signature once in RevinHi PDF, then drop it onto any document and fill in the form fields around it, all on your own PC."
    >
      <h2>Create your signature once</h2>
      <ol>
        <li>
          Open RevinHi PDF and go to the <strong>Signatures</strong> tab.
        </li>
        <li>
          Pick how you want to make it: <strong>Draw</strong> it with your mouse, trackpad or pen,{" "}
          <strong>Type</strong> your name, or <strong>Upload</strong> a photo or scan of your real
          signature.
        </li>
        <li>Save it. It&apos;s stored on your PC and ready for the next document.</li>
      </ol>

      <h2>Sign the document, step by step</h2>
      <ol>
        <li>
          Open the PDF in the <strong>Editor</strong>.
        </li>
        <li>
          Choose the <strong>Sign</strong> tool and pick your saved signature.
        </li>
        <li>Click where it should go, then drag the corners to resize it so it sits neatly on the line.</li>
        <li>
          Need a date or your printed name next to it? Use the <strong>Text</strong> tool to add a text box.
        </li>
        <li>
          Save with <strong>Ctrl+S</strong>, or <strong>Save as</strong> to keep an unsigned copy too.
        </li>
      </ol>

      <h2>Filling in forms</h2>
      <p>
        Many PDFs, such as applications, intake forms and tax documents, have real fillable fields. RevinHi PDF lets you
        click into them and type, tick checkboxes and pick options. When you save, you can choose to{" "}
        <strong>flatten</strong> the form, which turns your answers into ordinary page content so they can&apos;t be
        changed by accident when you send the file on. If a form has no fillable fields (a scanned paper form, for
        example), place text boxes over the blanks instead.
      </p>

      <h2>Why sign offline?</h2>
      <p>
        The documents you sign tend to be the private ones: leases, job offers, medical forms, invoices and contracts. Web
        signing tools need you to upload the whole document to someone else&apos;s server first. RevinHi PDF does
        everything locally on Windows, so the file and your signature image never leave your computer, and it keeps
        working without an internet connection.
      </p>

      <h2>A quick note on what kind of signature this is</h2>
      <p>
        RevinHi PDF places an image of your signature on the page, the digital version of signing a printout. That&apos;s
        what most everyday paperwork asks for. It isn&apos;t a certificate-based digital signature, so if a bank, court or
        government office specifically asks for a certified or cryptographic e-signature, check with them about which
        service they accept.
      </p>

      <h2>Free or Pro?</h2>
      <p>
        Signing and form filling are <strong>free</strong>, along with one saved signature, annotations and page tools.
        Free exports carry a small watermark. <strong>Pro</strong> is a one-time $9.99, with no subscription: it removes
        the watermark, lets you save unlimited signatures (handy for initials, or for everyone in a household), and unlocks
        text editing, compress, conversion and password protection.
      </p>
      <p>
        Related: <Link href="/pdf/edit-pdf-text">edit PDF text</Link>, <Link href="/pdf/merge-pdf">merge PDFs</Link>, and{" "}
        <Link href="/pdf/adobe-acrobat-alternative">a one-time Acrobat alternative</Link>. Or see everything in{" "}
        <Link href="/pdf">RevinHi PDF</Link>.
      </p>
    </GuidePage>
  );
}
