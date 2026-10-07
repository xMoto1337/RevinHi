import type { Metadata } from "next";
import Link from "next/link";
import { GuidePage } from "@/components/pdf/GuidePage";
import { PDF_OG_IMAGE } from "@/components/pdf/PdfUi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Adobe Acrobat Alternative, One-Time Price | RevinHi",
  description:
    "Looking for a PDF editor without a subscription? RevinHi PDF edits, signs, merges and compresses PDFs offline on Windows for a one-time $9.99.",
  path: "/pdf/adobe-acrobat-alternative",
  image: PDF_OG_IMAGE,
  imageAlt: "RevinHi PDF app icon",
});

const COMPARISON: { row: string; revinhi: string; acrobat: string }[] = [
  { row: "Pricing", revinhi: "Free download; Pro $9.99 once", acrobat: "Monthly subscription for editing" },
  { row: "Platforms", revinhi: "Windows 10/11", acrobat: "Windows, Mac, mobile and web" },
  { row: "Works offline", revinhi: "Yes, always", acrobat: "Desktop app, with cloud features" },
  { row: "Account needed", revinhi: "No", acrobat: "Adobe account for subscriptions" },
  { row: "Edit existing text", revinhi: "Yes (Pro)", acrobat: "Yes" },
  { row: "Sign and fill forms", revinhi: "Yes (free)", acrobat: "Yes" },
  { row: "True redaction", revinhi: "No", acrobat: "Yes, in Acrobat Pro" },
];

export default function AcrobatAlternativePage() {
  return (
    <GuidePage
      slug="adobe-acrobat-alternative"
      eyebrow="Acrobat alternative"
      title="An Adobe Acrobat alternative you buy once"
      intro="If you edit PDFs now and then, a monthly subscription can feel like a lot. RevinHi PDF covers the everyday jobs, editing text, signing, merging, compressing and protecting, for a one-time price on Windows."
    >
      <h2>Who RevinHi PDF is for</h2>
      <p>
        Adobe Acrobat is the long-standing standard for PDFs, and it&apos;s a deep, capable product. It&apos;s also sold
        as a monthly subscription for its editing features, which makes sense if you work in PDFs all day. Many people
        don&apos;t. They need to fix a typo on an invoice, sign a lease, merge a few scans, or shrink a file to fit an
        email. RevinHi PDF is built for that: a fast Windows app you pay for once and keep.
      </p>

      <h2>What you get</h2>
      <ul>
        <li>
          <strong>Edit existing text</strong>: click a line and retype it, matched to the original font, size and color.
        </li>
        <li>
          <strong>Sign and fill forms</strong>: draw, type or upload a signature, fill fields, and flatten when done.
        </li>
        <li>
          <strong>Annotate</strong>: text boxes, highlights, freehand drawing, shapes, images and whiteout.
        </li>
        <li>
          <strong>Page tools</strong>: reorder, rotate, delete, extract and insert pages; merge and split files.
        </li>
        <li>
          <strong>Convert</strong>: images to PDF, and PDF pages to PNG or JPG at up to 300 dpi.
        </li>
        <li>
          <strong>Compress and protect</strong>: shrink image-heavy files and lock them with AES-256 passwords.
        </li>
      </ul>

      <h2>At a glance</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/50">
              <th scope="col" className="py-2 pr-3 font-semibold" />
              <th scope="col" className="py-2 pr-3 font-semibold">
                RevinHi PDF
              </th>
              <th scope="col" className="py-2 font-semibold">
                Adobe Acrobat
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((c) => (
              <tr key={c.row} className="border-b border-white/5">
                <th scope="row" className="py-2.5 pr-3 font-medium text-white/85">
                  {c.row}
                </th>
                <td className="py-2.5 pr-3">{c.revinhi}</td>
                <td className="py-2.5">{c.acrobat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/45">
        Acrobat plans and features change over time; check Adobe&apos;s site for current details.
      </p>

      <h2>Why offline and one-time go together</h2>
      <p>
        RevinHi PDF runs entirely on your PC. There&apos;s no account to sign in to, no cloud sync, and no internet
        connection needed to open, edit or save. Your documents are never uploaded. And because there&apos;s no server
        doing the work, there&apos;s no ongoing cost to pass on: you pay $9.99 once and get every future update free.
      </p>

      <h2>When Acrobat may suit you better</h2>
      <p>To be fair about it, RevinHi PDF is not a full replacement for everyone. Consider Acrobat or another tool if you:</p>
      <ul>
        <li>need a Mac, mobile or browser version, since RevinHi PDF is Windows only;</li>
        <li>
          need true redaction: in RevinHi, edited text and whiteout cover the original, which stays in the file
          underneath;
        </li>
        <li>need certificate-based digital signatures or shared review and cloud workflows for a team.</li>
      </ul>

      <h2>Try it free first</h2>
      <p>
        The free version views PDFs, signs, fills forms, annotates, handles page tools and merges two files at a time,
        with a small watermark on exports. Pro removes the watermark and adds text editing, compress, PDF to images,
        protect/unlock and unlimited merging. Refunds are available within 24 hours of purchase.
      </p>
      <p>
        Step-by-step guides: <Link href="/pdf/edit-pdf-text">edit PDF text</Link>,{" "}
        <Link href="/pdf/sign-pdf">sign a PDF</Link>, <Link href="/pdf/merge-pdf">merge PDFs</Link> and{" "}
        <Link href="/pdf/compress-pdf">compress a PDF</Link>. Full details on the <Link href="/pdf">RevinHi PDF</Link> page.
      </p>
      <p className="text-xs text-white/45">
        Adobe and Acrobat are trademarks of Adobe Inc. RevinHi is not affiliated with or endorsed by Adobe.
      </p>
    </GuidePage>
  );
}
