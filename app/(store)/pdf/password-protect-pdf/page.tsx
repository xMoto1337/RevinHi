import type { Metadata } from "next";
import Link from "next/link";
import { GuideFigure } from "@/components/guides/HowToGuide";
import { GuidePage } from "@/components/pdf/GuidePage";
import { PDF_OG_IMAGE } from "@/components/pdf/PdfUi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Password-Protect a PDF Offline on Windows | RevinHi PDF",
  description:
    "Lock a PDF with a password on Windows 10/11 without uploading it. AES-256 encryption, optional print, copy and edit limits, and remove a password you know.",
  path: "/pdf/password-protect-pdf",
  image: PDF_OG_IMAGE,
  imageAlt: "RevinHi PDF app icon",
});

export default function PasswordProtectPdfPage() {
  return (
    <GuidePage
      slug="password-protect-pdf"
      eyebrow="Password-protect a PDF"
      title="Password-protect a PDF offline"
      intro="The PDFs that need a password are exactly the ones you shouldn't upload to a website: tax returns, statements, contracts and medical records. RevinHi PDF locks them with AES-256 encryption right on your Windows PC."
      faq={[
        {
          q: "How strong is the protection?",
          a: "RevinHi PDF uses AES-256 encryption. Anyone opening the file needs the password. Pick a long password that isn't used anywhere else.",
        },
        {
          q: "Can I stop people printing or copying from the PDF?",
          a: "You can turn off Allow printing, Allow copying text and Allow editing. PDF apps honor these limits, but the encryption itself doesn't enforce them, so treat them as a polite request rather than a lock.",
        },
        {
          q: "I forgot the password. Can RevinHi remove it?",
          a: "No. Unlock removes a password only from a PDF you have the password for. It doesn't crack or bypass passwords.",
        },
        {
          q: "Is it free?",
          a: "Protect and Unlock are Pro features. Pro is a one-time $9.99 with no subscription, and it also removes the export watermark and unlocks text editing, compress and conversion.",
        },
      ]}
    >
      <h2>How to password-protect a PDF, step by step</h2>
      <ol>
        <li>
          Open RevinHi PDF and go to <strong>Tools</strong>, then <strong>Protect</strong> (it&apos;s also on the Home
          screen as &quot;Add a password&quot;).
        </li>
        <li>
          Click <strong>Choose PDF</strong> and pick the file.
        </li>
        <li>
          Type the password, then type it again in <strong>Repeat password</strong>.
        </li>
        <li>
          Optional: switch off <strong>Allow printing</strong>, <strong>Allow copying text</strong> or{" "}
          <strong>Allow editing</strong>, and set an <strong>Owner password</strong> that lets you change those limits
          later (it defaults to the password above).
        </li>
        <li>
          Click <strong>Protect</strong> and choose where to save. The new file is named with <strong>_protected</strong>{" "}
          on the end by default, so your original stays as it was.
        </li>
      </ol>
      <p>
        You can also tick <strong>Protect with password</strong> when saving a document from the Editor, so a file you
        just edited or signed is locked in the same step.
      </p>
      <GuideFigure
        image={{
          src: "/pdf/screens/tools.webp",
          alt: "RevinHi PDF's Tools page with Merge, Split, Images to PDF, PDF to images, Compress, Protect and Unlock",
          caption: "Protect and Unlock sit in Tools, next to Compress.",
          width: 1280,
          height: 720,
        }}
      />

      <h2>How to remove a password from a PDF</h2>
      <ol>
        <li>
          Go to <strong>Tools</strong>, then <strong>Unlock</strong>.
        </li>
        <li>
          Click <strong>Choose PDF</strong>, type the password (leave it blank if the file only has editing limits), and
          click <strong>Unlock</strong>.
        </li>
        <li>
          The unlocked copy is saved with <strong>_unlocked</strong> on the end of its name.
        </li>
      </ol>

      <h2>Why protect PDFs offline?</h2>
      <p>
        Online tools need the whole document, unencrypted, on their servers before they can add a password. RevinHi PDF
        does the work on your PC with no account and no internet connection, so the readable version never leaves your
        computer.
      </p>
      <p>
        Related: <Link href="/pdf/compress-pdf">compress a PDF</Link>, <Link href="/pdf/sign-pdf">sign a PDF</Link> and{" "}
        <Link href="/pdf/merge-pdf">merge PDFs</Link>. See all features on the <Link href="/pdf">RevinHi PDF</Link> page.
      </p>
    </GuidePage>
  );
}
