import type { Metadata } from "next";
import Link from "next/link";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { RECOVERY_FREE_FAQ, RECOVERY_NOTE, RECOVERY_PITCH, STOP_USING_FAQ } from "@/components/guides/recoveryCopy";
import { RECOVERY_SHOTS } from "@/components/guides/shots";
import { pageMetadata } from "@/lib/seo";

const SLUG = "recover-usb-flash-drive";

export const metadata: Metadata = pageMetadata({
  title: "Recover Files From a USB Flash Drive | RevinHi Recovery",
  description:
    "Get deleted or formatted files back from a USB stick or external drive on Windows. Scan free, preview every file, then recover to another drive.",
  path: `/recovery/${SLUG}`,
  image: "/brand/revinhi-recovery.png",
  imageAlt: "RevinHi Recovery app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="recovery"
      guide={SLUG}
      eyebrow="Recover files from a USB stick"
      title="Recover files from a USB flash drive"
      intro={
        <p>
          Files deleted from a USB stick don&apos;t go to the Recycle Bin, so they seem gone for good. Usually they
          aren&apos;t: they stay on the stick until something new is saved over them. RevinHi Recovery scans USB sticks
          and external drives and gets those files back.
        </p>
      }
      note={RECOVERY_NOTE}
      stepsTitle="How to recover files from a USB stick"
      steps={[
        {
          title: "Leave the stick as it is",
          text: "Don't copy new files to it or format it, even if Windows asks to.",
        },
        {
          title: "Scan the stick",
          text: "In RevinHi Recovery, the stick shows under USB drives and memory cards. Press Scan. Choose Quick scan for files you just deleted, or Full scan if the stick was formatted, shows as RAW, or Quick scan didn't find them.",
          image: RECOVERY_SHOTS.drives,
        },
        {
          title: "Find and preview your files",
          text: "Search by name or type, turn on Deleted only, and preview photos, videos, music, PDFs and documents. Each file shows its chance of coming back whole.",
          image: RECOVERY_SHOTS.search,
        },
        {
          title: "Recover to your PC",
          text: "Tick the files and click Recover, then pick a folder on your PC. RevinHi won't save them back onto the stick you scanned.",
        },
      ]}
      faq={[
        STOP_USING_FAQ,
        {
          q: "Windows says the USB drive needs to be formatted. What should I do?",
          a: "Click Cancel. Formatting makes recovery harder. Scan the drive with a Full scan first, recover your files, then format it if you still want to use it.",
        },
        {
          q: "Does it work with external hard drives too?",
          a: "Yes. External hard drives and SSDs, USB sticks, and SD and memory cards formatted as NTFS, FAT32 or exFAT all work.",
        },
        {
          q: "The stick isn't showing up at all. Can it help?",
          a: "If Windows can't see the stick at all, no program can read it; that usually means a hardware fault. If it shows up but won't open, or shows as RAW, a Full scan can still search it.",
        },
        RECOVERY_FREE_FAQ,
      ]}
      pitch={RECOVERY_PITCH}
    >
      <h2>A partition went missing?</h2>
      <p>
        If the stick suddenly shows as empty or unallocated, its partition may have been deleted or dropped from the
        list. Tools, then Find lost partitions searches the whole stick for it without changing anything, and you can
        scan what it finds.
      </p>
      <p>
        Related: <Link href="/recovery/recover-sd-card-photos">recover photos from an SD card</Link>,{" "}
        <Link href="/recovery/recover-formatted-drive">recover a formatted drive</Link> and{" "}
        <Link href="/recovery/recover-deleted-files">recover deleted files</Link>.
      </p>
    </ProductGuide>
  );
}
