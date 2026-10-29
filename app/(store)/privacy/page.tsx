import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage, Section } from "@/components/Legal";
import { SUPPORT_EMAIL } from "@/lib/products";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | RevinHi",
  description: "What RevinHi collects on this website and in its Windows apps, why, and your choices.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        RevinHi makes Windows apps (RevinHi Desktop, RevinHi Performance, RevinHi 3D and RevinHi Recovery) and runs this website. We collect as little as
        possible. We don&apos;t sell personal information, and we don&apos;t run third-party advertising trackers on this site
        or in our apps.
      </p>

      <Section heading="Purchases">
        <p>
          Payments are handled by Gumroad. We never see your card details. When you buy, Gumroad sends us your email address and
          order details so we can email you your license key (sent through our email provider, Resend). We keep a record of the
          sale (order ID, product, price, refund status) for support and accounting.
        </p>
      </Section>

      <Section heading="Visits and downloads on this website">
        <p>
          We count visits ourselves, without cookies and without third-party analytics. For each page view we record the page,
          the site that linked you here, any campaign tag in the link, your approximate country (from our host, Vercel) and
          your device type, browser and operating system. To count unique visitors we use a code made from your IP address and
          browser that changes every day and can&apos;t be turned back into either. We never store your IP address.
        </p>
        <p>
          When you click a download or checkout button we record that click the same way. When you download, we also record
          the time, the product, your approximate country and the page you came from.
        </p>
      </Section>

      <Section heading="Anonymous usage stats in RevinHi Desktop">
        <p>
          When it starts, and every 12 hours while it runs, RevinHi Desktop tells our server that a copy is running. It sends a
          random ID created on your PC, the app version, and whether it&apos;s the Free or Pro version. Our host also tells us
          the approximate country. That&apos;s all: no name, email, license key, files, or hardware IDs. It lets us count active
          users.
        </p>
        <p>
          You can turn this off at any time: <strong>Settings → Privacy → Send anonymous usage stats</strong>.
        </p>
      </Section>

      <Section heading="RevinHi 3D">
        <p>
          <strong>Usage stats.</strong> About 20 seconds after it starts, and every 12 hours while it runs, RevinHi 3D tells our
          server that a copy is running, the same way RevinHi Desktop does: a random ID created on your PC, the product, the app
          version, and whether it&apos;s the Free or Pro version. Our host also tells us the approximate country. Nothing about
          you, your license key, your hardware or your models is sent. Turn it off at any time in{" "}
          <strong>Settings → Privacy → Send anonymous usage stats</strong>.
        </p>
        <p>
          <strong>License.</strong> Your Pro key is checked on your PC. Activating it doesn&apos;t contact our servers, and the
          key is stored only in the app&apos;s folder on your PC.
        </p>
        <p>
          <strong>Your models and pictures stay on your PC.</strong> Opening, editing, saving and exporting all happen locally.
          Send to slicer saves a temporary file on your PC and opens it in the slicer you pick. Nothing is uploaded.
        </p>
        <p>
          <strong>AI runs fully on your PC.</strong> The picture-to-3D, description-to-3D and command bar features run on your own
          graphics card. Your pictures, descriptions and models are never uploaded. The only network traffic is downloading the AI
          models and their engines when you click Download, straight from where they are published (Hugging Face and GitHub);
          those downloads are governed by those sites&apos; own policies.
        </p>
        <p>
          <strong>Updates.</strong> The version from this website checks revinhi.com for updates. The Microsoft Store version is
          updated by the Microsoft Store and doesn&apos;t check our site.
        </p>
      </Section>

      <Section heading="RevinHi Recovery">
        <p>
          <strong>Usage stats.</strong> About 20 seconds after it starts, and every 12 hours while it runs, RevinHi Recovery tells
          our server that a copy is running, the same way RevinHi 3D does: a random ID created on your PC, the product, the app
          version, and whether it&apos;s the Free or Pro version. Our host also tells us the approximate country. Nothing about
          you, your license key, your hardware, your drives or your files is sent. Turn it off at any time in{" "}
          <strong>Settings → Privacy → Send anonymous usage stats</strong>.
        </p>
        <p>
          <strong>License.</strong> Your Pro key is checked on your PC. Activating it doesn&apos;t contact our servers, and the
          key is stored only in the app&apos;s folder on your PC.
        </p>
        <p>
          <strong>Your drives and files stay on your PC.</strong> Scanning, previews, recovering files, backup images and writing
          images to drives all happen locally. Scan results are saved on your PC (never on the drive being scanned) and are never
          uploaded. Drive health is read from the drives themselves.
        </p>
        <p>
          <strong>Updates.</strong> The app checks revinhi.com for updates shortly after it starts and every few hours. Updates
          are only installed when you click to install them.
        </p>
      </Section>

      <Section heading="Data the apps keep on your PC">
        <p>
          Your settings, desktop layouts, saved weather locations, projects, recent files list and license key are stored locally
          on your PC, not on our servers. Uninstalling the app removes the app. Its settings folders in %APPDATA% and
          %LOCALAPPDATA% can be deleted by you.

        </p>
      </Section>

      <Section heading="Services the apps contact">
        <p>
          To show weather, radar, lightning and alerts, RevinHi Desktop requests public data from the U.S. National Weather
          Service / NOAA and related public sources. When you search for a place, the text you type is sent to a geocoding
          service (the U.S. Census geocoder, with OpenStreetMap as a backup) to find its coordinates. Map tiles come from
          OpenFreeMap. The apps also check revinhi.com for updates. These requests include the location you chose to view, as
          any weather app&apos;s do, and are governed by those services&apos; own policies.
        </p>
      </Section>

      <Section heading="Children">
        <p>Our apps and site are not directed at children under 13, and we don&apos;t knowingly collect their information.</p>
      </Section>

      <Section heading="Your choices and contact">
        <p>
          You can ask us what we hold about you (for purchases, that&apos;s your order record), or ask us to delete it, by
          emailing <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We&apos;ll update this page if
          anything changes and change the date at the top.
        </p>
      </Section>
    </LegalPage>
  );
}
