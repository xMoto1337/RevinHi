import type { Metadata } from "next";
import Link from "next/link";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { RECOVERY_FREE_FAQ, RECOVERY_NOTE, RECOVERY_PITCH, STOP_USING_FAQ } from "@/components/guides/recoveryCopy";
import { RECOVERY_SHOTS } from "@/components/guides/shots";
import { pageMetadata } from "@/lib/seo";

const SLUG = "recover-emptied-recycle-bin";

export const metadata: Metadata = pageMetadata({
  title: "Recover Files After Emptying the Recycle Bin | RevinHi",
  description:
    "Emptied the Recycle Bin or used Shift+Delete? The files are often still on the drive. Scan it free with RevinHi Recovery, preview them and get them back.",
  path: `/recovery/${SLUG}`,
  image: "/brand/revinhi-recovery.png",
  imageAlt: "RevinHi Recovery app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="recovery"
      guide={SLUG}
      eyebrow="Emptied the Recycle Bin"
      title="Recover files after emptying the Recycle Bin"
      intro={
        <p>
          Emptying the Recycle Bin, or deleting with Shift+Delete, doesn&apos;t wipe a file on the spot. Windows marks
          its space as free, and the file stays on the drive until something new is saved over it. RevinHi Recovery
          finds those files so you can get them back.
        </p>
      }
      note={RECOVERY_NOTE}
      stepsTitle="How to get back files you emptied from the Recycle Bin"
      steps={[
        {
          title: "Stop saving to that drive",
          text: "The Recycle Bin is on the same drive the files came from, usually C:. Close other apps, skip downloads and installs, and plan to save what you recover to a different drive, like a USB stick.",
        },
        {
          title: "Scan the drive",
          text: "Open RevinHi Recovery, press Scan on the drive the files were on, and choose Quick scan. It reads the drive's own list of files, including deleted ones, so it's fast.",
          image: RECOVERY_SHOTS.drives,
        },
        {
          title: "Find your files",
          text: "Turn on Deleted only, then search by name or type, or filter by size and date. The Folders view shows files in the folders they came from, wherever that's still known.",
          image: RECOVERY_SHOTS.search,
        },
        {
          title: "Preview and check the chance",
          text: "Click a file to preview it. The dot next to each file shows its chance of coming back whole: green is good, and red usually means part of it has been written over.",
        },
        {
          title: "Recover to another drive",
          text: "Tick what you want and click Recover, then pick a folder on a different drive. If Quick scan didn't find a file, run a Full scan, which also searches the whole drive for files by their contents.",
        },
      ]}
      faq={[
        STOP_USING_FAQ,
        {
          q: "Are files really gone after emptying the Recycle Bin?",
          a: "Usually not right away. The space they used is marked as free, and the files stay until new data is saved over them. The sooner you scan, the better the chances.",
        },
        {
          q: "Does Shift+Delete work the same way?",
          a: "Yes. Shift+Delete skips the Recycle Bin, but the file is still left on the drive until its space is reused, so it can be found the same way.",
        },
        {
          q: "What if the files were on an SSD?",
          a: "SSDs often erase deleted files on their own soon after (Windows tells them which space is free, called TRIM), so chances are lower than on a hard drive. A free scan shows what's still there.",
        },
        RECOVERY_FREE_FAQ,
      ]}
      pitch={RECOVERY_PITCH}
    >
      <h2>Keep it from happening again</h2>
      <ul>
        <li>Keep a copy of important files on a second drive or a USB stick.</li>
        <li>Check the Recycle Bin before you empty it, and sort it by date deleted to spot recent files.</li>
      </ul>
      <p>
        Related: <Link href="/recovery/recover-deleted-files">how to recover deleted files on Windows</Link> and{" "}
        <Link href="/recovery/recover-usb-flash-drive">recover files from a USB stick</Link>.
      </p>
    </ProductGuide>
  );
}
