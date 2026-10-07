import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage, Section } from "@/components/Legal";
import { SUPPORT_EMAIL } from "@/lib/products";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use & Sale | RevinHi",
  description: "Terms of use and sale for RevinHi apps: licenses, refunds and updates.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use & Sale">
      <p>
        These terms cover the RevinHi apps (RevinHi Desktop, RevinHi PDF and RevinHi Performance) and this website. By downloading, buying or
        using them, you agree to these terms.
      </p>

      <Section heading="License">
        <p>
          The free versions may be used at no cost. A paid license (for example RevinHi Desktop Pro) is a one-time purchase that
          unlocks the paid features for your personal use, with free updates to that app. License keys are for the buyer and
          may not be resold, shared publicly or redistributed. You may not reverse-engineer, crack or redistribute the apps.
        </p>
      </Section>

      <Section heading="Refunds">
        <p>
          RevinHi Desktop and RevinHi PDF: refunds are available within 24 hours of purchase. Email {SUPPORT_EMAIL} from the address you bought
          with. After 24 hours, sales are final, so please try the free version first. RevinHi Performance: contact us and
          refunds are handled case by case. Payments and refunds are processed by Gumroad.
        </p>
      </Section>

      <Section heading="Weather information">
        <p>
          Weather, radar, lightning and alert data in RevinHi Desktop come from public sources such as NOAA / the National
          Weather Service and may be delayed, incomplete or unavailable. It is for general information only.{" "}
          <strong>Do not rely on RevinHi for safety decisions.</strong> Always follow official warnings from the National
          Weather Service and local authorities. Radar coverage is for the United States.
        </p>
      </Section>

      <Section heading="System changes">
        <p>
          RevinHi Performance changes Windows settings to improve performance. Every change can be undone in the app, but you
          use it at your own risk. We recommend a restore point before applying tweaks.
        </p>
      </Section>

      <Section heading="No warranty">
        <p>
          The apps are provided &quot;as is&quot;, without warranties of any kind. To the extent permitted by law, RevinHi is not
          liable for indirect or consequential damages, and our total liability is limited to the amount you paid for the app.
        </p>
      </Section>

      <Section heading="Changes and contact">
        <p>
          We may update these terms and will change the date at the top when we do. Questions:{" "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
