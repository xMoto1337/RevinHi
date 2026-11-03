import type { Metadata } from "next";
import Link from "next/link";
import { GuideFigure } from "@/components/guides/HowToGuide";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { RECOVERY_FREE_FAQ, RECOVERY_NOTE, RECOVERY_PITCH, STOP_USING_FAQ } from "@/components/guides/recoveryCopy";
import { RECOVERY_SHOTS } from "@/components/guides/shots";
import { pageMetadata } from "@/lib/seo";

const SLUG = "recover-formatted-drive";

export const metadata: Metadata = pageMetadata({
  title: "Recover Files From a Formatted Drive | RevinHi Recovery",
  description:
    "Formatted a drive by mistake, or it shows as RAW? A full scan finds photos, videos and documents by their contents. Free scan and preview on Windows.",
  path: `/recovery/${SLUG}`,
  image: "/brand/revinhi-recovery.png",
  imageAlt: "RevinHi Recovery app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="recovery"
      guide={SLUG}
      eyebrow="Recover a formatted drive"
      title="Recover files from a formatted drive"
      intro={
        <p>
          A quick format clears a drive&apos;s list of files, but usually not the files themselves. Until new files are
          saved over them, photos, videos and documents can often be found by what&apos;s inside them. RevinHi
          Recovery&apos;s Full scan does exactly that, on hard drives, SSDs, USB sticks and memory cards.
        </p>
      }
      note={RECOVERY_NOTE}
      stepsTitle="How to recover a formatted drive"
      steps={[
        {
          title: "Don't put anything new on it",
          text: "Don't copy files to the formatted drive, and don't format it again. Every new file can take the space a lost one is still sitting in.",
        },
        {
          title: "Start a Full scan",
          text: "Press Scan on the drive and choose Full scan. It runs a quick scan first, then searches the whole drive for lost files, file records and folders. It reads every part of the drive, so it takes longer, and the app shows how long.",
          image: RECOVERY_SHOTS.fullScan,
        },
        {
          title: "Was it formatted to a different type?",
          text: "If the drive was, say, exFAT before and NTFS now, open Advanced options and set Read the drive as to what it used to be. Leave it on Find by itself if you're not sure.",
        },
        {
          title: "Look through the results",
          text: "You can pause a full scan any time and look at what's been found; everything so far is kept. Files with surviving records keep their names and folders, and files found by their contents get their real names back wherever leftover records allow.",
          image: RECOVERY_SHOTS.folders,
        },
        {
          title: "Recover to a different drive",
          text: "Preview the files, tick what you want and click Recover. Save them to a different drive, never to the one you're recovering from.",
        },
      ]}
      faq={[
        STOP_USING_FAQ,
        {
          q: "Quick format or full format: can both be recovered?",
          a: "A quick format usually leaves the files in place, so recovery often works well. A full format in Windows writes over the whole drive, and files written over can't be recovered by any program.",
        },
        {
          q: "My drive shows as RAW or asks to be formatted. What now?",
          a: "Don't format it. Run a Full scan in RevinHi Recovery, which searches the drive for files by their contents even when Windows can't read it. If the drive is failing, make a Disk backup image first and scan that.",
        },
        {
          q: "A whole partition disappeared. Can it come back?",
          a: "Often, yes. Tools, then Find lost partitions searches the drive for partitions that were deleted or dropped from the list, without changing the drive, and you can scan what it finds.",
        },
        RECOVERY_FREE_FAQ,
      ]}
      pitch={RECOVERY_PITCH}
    >
      <h2>Drives that are failing</h2>
      <p>
        If a drive clicks, disconnects or shows read errors, reading it again and again can make things worse. Use
        Tools, then Disk backup image to copy the whole drive to one image file (it skips bad spots and goes back for
        them later), then scan the image instead of the drive. Drive health shows wear, temperature and errors in plain
        words.
      </p>
      <GuideFigure image={RECOVERY_SHOTS.partitions} />
      <p>
        Related: <Link href="/recovery/recover-sd-card-photos">recover photos from an SD card</Link>,{" "}
        <Link href="/recovery/recover-usb-flash-drive">recover files from a USB stick</Link> and{" "}
        <Link href="/recovery/recover-deleted-files">recover deleted files</Link>.
      </p>
    </ProductGuide>
  );
}
