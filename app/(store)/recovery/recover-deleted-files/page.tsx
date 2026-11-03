import type { Metadata } from "next";
import Link from "next/link";
import { GuideFigure } from "@/components/guides/HowToGuide";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { RECOVERY_FREE_FAQ, RECOVERY_NOTE, RECOVERY_PITCH, STOP_USING_FAQ } from "@/components/guides/recoveryCopy";
import { RECOVERY_SHOTS } from "@/components/guides/shots";
import { pageMetadata } from "@/lib/seo";

const SLUG = "recover-deleted-files";

export const metadata: Metadata = pageMetadata({
  title: "How to Recover Deleted Files on Windows 10 and 11 | RevinHi",
  description:
    "Get back deleted photos, videos and documents on Windows: stop using the drive, scan it, preview what was found, then recover to another drive. Free scan.",
  path: `/recovery/${SLUG}`,
  image: "/brand/revinhi-recovery.png",
  imageAlt: "RevinHi Recovery app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="recovery"
      guide={SLUG}
      eyebrow="Recover deleted files"
      title="How to recover deleted files on Windows"
      intro={
        <p>
          When you delete a file, Windows usually doesn&apos;t erase it straight away. It marks the space as free, and the
          file stays on the drive until something new is saved over it. That&apos;s why recovery often works, and why
          acting quickly matters. Here&apos;s how to get deleted files back with RevinHi Recovery.
        </p>
      }
      note={RECOVERY_NOTE}
      stepsTitle="How to get deleted files back"
      steps={[
        {
          title: "Stop using the drive",
          text: "Don't save, install or download anything to the drive the files were on. If they were on your Windows drive (C:), close other apps and plan to save what you recover to a different drive.",
        },
        {
          title: "Pick the drive and press Scan",
          text: "RevinHi Recovery lists every drive, USB stick and memory card. Press Scan on the one the files were on. (Windows asks for administrator permission when the app starts, because reading a whole drive needs it.)",
          image: RECOVERY_SHOTS.drives,
        },
        {
          title: "Choose Quick scan or Full scan",
          text: "Quick scan reads the drive's own list of files, including deleted ones, with their names and folders. It's fast and best for files deleted recently. Full scan also searches the whole drive for files by their contents, for formatted or damaged drives or when Quick scan doesn't find them.",
        },
        {
          title: "Look through what was found",
          text: "Files appear while the scan runs, sorted into photos, videos, music, documents and archives. Turn on Deleted only, search by name, or filter by size and date. Each file shows its chance of coming back whole, and you can preview photos, videos, music, PDFs and documents.",
          image: RECOVERY_SHOTS.preview,
        },
        {
          title: "Recover to a different drive",
          text: "Tick the files you want and click Recover. RevinHi won't save them onto the drive you scanned, so nothing you're trying to save gets written over. Original names and folders are kept wherever they still exist.",
        },
      ]}
      faq={[
        STOP_USING_FAQ,
        {
          q: "Can I recover files deleted a long time ago?",
          a: "Sometimes. It depends on whether new files have been saved over them since. The preview and the chance shown next to each file tell you before you recover anything.",
        },
        {
          q: "Can deleted files be recovered from an SSD?",
          a: "It's harder. Windows usually tells an SSD which space is free (called TRIM), and the drive may then erase deleted files on its own, often quickly. Hard drives, USB sticks and memory cards usually keep deleted files longer. A free scan shows what's still there.",
        },
        {
          q: "Why do some files have names like 'ZIP 1.zip'?",
          a: "When a file's original name is gone, RevinHi uses a name guessed from the file's own details (like a photo's or song's info) or a number. The contents are still the real file.",
        },
        RECOVERY_FREE_FAQ,
      ]}
      pitch={RECOVERY_PITCH}
    >
      <h2>Which files can come back?</h2>
      <p>
        RevinHi Recovery works with hard drives, SSDs, USB sticks, SD and memory cards, external drives and disk images
        (VHD, VHDX, IMG and ISO), formatted as NTFS, FAT32 or exFAT. It finds more than 30 file types, including JPG,
        PNG, HEIC and camera RAW photos, MP4, MOV, AVI and MKV videos, MP3 and WAV music, PDFs, Office documents, and
        ZIP, RAR and 7z archives.
      </p>
      <GuideFigure image={RECOVERY_SHOTS.finished} />
      <h2>Is it safe?</h2>
      <p>
        Scanning only reads the drive and never changes it. Scan files and previews are kept off the scanned drive, and
        recovered files can&apos;t be saved back onto it. Everything runs on your PC, and no files are uploaded.
      </p>
      <p>
        Related: <Link href="/recovery/recover-emptied-recycle-bin">recover files after emptying the Recycle Bin</Link>,{" "}
        <Link href="/recovery/recover-formatted-drive">recover a formatted drive</Link> and{" "}
        <Link href="/recovery/recover-sd-card-photos">recover photos from an SD card</Link>.
      </p>
    </ProductGuide>
  );
}
