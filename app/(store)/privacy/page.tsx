import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/Legal";
import { SUPPORT_EMAIL } from "@/lib/products";

export const metadata: Metadata = { title: "Privacy Policy - RevinHi", description: "What RevinHi collects, why, and your choices." };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        RevinHi makes Windows apps (RevinHi Desktop and RevinHi Performance) and runs this website. We collect as little as
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

      <Section heading="Downloads from this website">
        <p>
          When you click a download button we record that a download happened, with the time, the product, your approximate
          country (provided by our host, Vercel) and the page you came from. We don&apos;t store your IP address with it.
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

      <Section heading="Data the apps keep on your PC">
        <p>
          Your settings, desktop layouts, saved weather locations and license key are stored locally on your PC, not on our
          servers. Uninstalling the app removes the app. Its settings folder in %LOCALAPPDATA% can be deleted by you.
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
