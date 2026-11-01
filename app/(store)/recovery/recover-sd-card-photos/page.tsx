import type { Metadata } from "next";
import Link from "next/link";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { RECOVERY_FREE_FAQ, RECOVERY_NOTE, RECOVERY_PITCH } from "@/components/guides/recoveryCopy";
import { RECOVERY_SHOTS } from "@/components/guides/shots";
import { pageMetadata } from "@/lib/seo";

const SLUG = "recover-sd-card-photos";

export const metadata: Metadata = pageMetadata({
  title: "Recover Deleted Photos From an SD Card | RevinHi",
  description:
    "Get deleted or formatted photos and videos back from a camera, phone or drone SD card on Windows, including JPG, HEIC, RAW and MP4. Free scan and preview.",
  path: `/recovery/${SLUG}`,
  image: "/brand/revinhi-recovery.png",
  imageAlt: "RevinHi Recovery app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="recovery"
      guide={SLUG}
      eyebrow="Recover photos from an SD card"
      title="Recover deleted photos from an SD card"
      intro={
        <p>
          Deleted the wrong photos, or formatted a card before copying it? Photos and videos on SD and microSD cards can
          often be found again, as long as nothing new has been recorded over them. Plug the card into your Windows PC
          and scan it with RevinHi Recovery.
        </p>
      }
      note={RECOVERY_NOTE}
      stepsTitle="How to recover photos from an SD card"
      steps={[
        {
          title: "Take the card out of the camera",
          text: "Stop taking photos or videos on that card, since each new shot can land on top of a lost one. Put it in a card reader on your PC.",
        },
        {
          title: "Pick the card and press Scan",
          text: "Memory cards show under USB drives and memory cards. Press Scan on the card. If photos were just deleted, Quick scan is fast; if the card was formatted or shows as RAW, choose Full scan.",
          image: RECOVERY_SHOTS.drives,
        },
        {
          title: "Open Photos and Videos",
          text: "Results are sorted by type, so jump straight to Photos or Videos. Preview each one to check it, and look at its chance of coming back whole.",
          image: RECOVERY_SHOTS.preview,
        },
        {
          title: "Recover to your PC",
          text: "Tick the photos you want and click Recover, then choose a folder on your PC (not the card). Copy them somewhere safe before you use the card again.",
        },
      ]}
      faq={[
        {
          q: "Which photo and video types does it find?",
          a: "JPG, PNG, HEIC and camera RAW photos, and MP4, MOV, AVI and MKV videos, among more than 30 file types. Formats it finds by their contents work even after the card is formatted.",
        },
        {
          q: "Will the photos keep their names?",
          a: "After a simple delete, usually yes, from the card's own file list. After a format, files are found by their contents and get their real names back wherever leftover records still have them; otherwise a name is guessed from the photo's details, or numbered.",
        },
        {
          q: "My camera says the card needs formatting. Should I?",
          a: "Not yet. Formatting can make recovery harder. Scan the card first with a Full scan, recover your photos to your PC, and format it afterwards.",
        },
        {
          q: "Does it work with phone and drone cards?",
          a: "Yes, any SD or microSD card your PC can see through a card reader. It reads FAT32 and exFAT, which cameras, phones and drones use, and NTFS.",
        },
        RECOVERY_FREE_FAQ,
      ]}
      pitch={RECOVERY_PITCH}
    >
      <h2>Why photos can still be there</h2>
      <p>
        Deleting a photo on a camera, or quick-formatting the card, usually only clears the card&apos;s list of files.
        The picture itself stays until the camera records something new in that space. That&apos;s why it helps to stop
        shooting on the card right away.
      </p>
      <p>
        Related: <Link href="/recovery/recover-formatted-drive">recover a formatted drive</Link> and{" "}
        <Link href="/recovery/recover-usb-flash-drive">recover files from a USB stick</Link>.
      </p>
    </ProductGuide>
  );
}
