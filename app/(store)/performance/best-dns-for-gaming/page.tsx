import type { Metadata } from "next";
import Link from "next/link";
import { PERFORMANCE_NOTE, PERFORMANCE_PITCH } from "@/components/guides/performanceCopy";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { pageMetadata } from "@/lib/seo";

const SLUG = "best-dns-for-gaming";

export const metadata: Metadata = pageMetadata({
  title: "Best DNS for Gaming: Test It on Your Connection | RevinHi",
  description:
    "The fastest DNS depends on where you live. Test Cloudflare, Google, Quad9 and more on your own connection, see game-region ping, and switch in one click.",
  path: `/performance/${SLUG}`,
  image: "/brand/revinhi-perf.png",
  imageAlt: "RevinHi Performance app icon",
});

const PROVIDERS = [
  "Cloudflare",
  "Google",
  "Quad9",
  "OpenDNS",
  "AdGuard (ad-blocking)",
  "AdGuard Family (ad and adult blocking)",
  "Alternate DNS (ad-blocking)",
  "CleanBrowsing",
  "Comodo Secure DNS",
  "Level3",
  "Verisign",
  "DNS.WATCH",
];

const REGIONS = [
  "US East (Virginia)",
  "US West (Oregon)",
  "Europe West (Ireland)",
  "Asia Pacific (Singapore)",
  "Oceania (Sydney)",
  "Brazil (São Paulo)",
];

export default function Page() {
  return (
    <ProductGuide
      product="performance"
      guide={SLUG}
      eyebrow="Best DNS for gaming"
      title="The best DNS for gaming, tested on your connection"
      intro={
        <p>
          There&apos;s no single fastest DNS for everyone: it depends on where you live and on your internet provider.
          The honest answer is to test them from your own PC. RevinHi Performance&apos;s DNS Finder does that live, and
          also shows your ping to the regions popular games host their servers in.
        </p>
      }
      note={PERFORMANCE_NOTE}
      stepsTitle="How to find the fastest DNS for you"
      steps={[
        {
          title: "Open the DNS Finder",
          text: "It shows the DNS your PC uses right now, then tests about a dozen providers side by side.",
        },
        {
          title: "Read the live results",
          text: "Each provider's response time is measured with real DNS lookups, refreshed every few seconds. That's more accurate than a ping test, because some DNS servers ignore ping but answer lookups fine.",
        },
        {
          title: "Pick one and click Use This",
          text: "Choose the fastest reliable result, or an ad-blocking option if you want one, and click Use This. Restore Defaults puts your original DNS back.",
        },
        {
          title: "Check your game-region ping",
          text: "Game server ping shows your latency to the cloud regions Fortnite, Valorant and Apex Legends commonly host in. It's measured separately from DNS, because DNS doesn't change the route your game traffic takes.",
        },
      ]}
      faq={[
        {
          q: "Does changing DNS lower my ping in games?",
          a: "No. DNS only turns names like a game's server address into numbers. A faster DNS can speed up matchmaking lookups, launchers and store pages, but once you're connected, your in-game ping depends on your connection and the distance to the server.",
        },
        {
          q: "Is Cloudflare or Google DNS faster?",
          a: "It depends on your location and provider. Both are often fast, and sometimes your provider's own DNS is just as quick. Testing from your own PC is the only reliable way to know.",
        },
        {
          q: "Which DNS providers does it test?",
          a: `${PROVIDERS.join(", ")}.`,
        },
        {
          q: "Can I switch back?",
          a: "Yes. Restore Defaults in the DNS Finder puts your original DNS back, and Restore All Defaults undoes every change RevinHi has made.",
        },
      ]}
      pitch={PERFORMANCE_PITCH}
    >
      <h2>DNS providers in the test</h2>
      <ul>
        {PROVIDERS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <h2>Game server regions</h2>
      <p>Ping is measured to these cloud regions, where games like Fortnite, Valorant and Apex Legends commonly host servers:</p>
      <ul>
        {REGIONS.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="text-xs text-white/45">
        Game names are used only to describe where servers are commonly hosted. RevinHi isn&apos;t affiliated with these
        games or their publishers.
      </p>
      <p>
        Related: <Link href="/performance/reduce-input-lag">reduce input lag</Link> and{" "}
        <Link href="/performance/increase-fps-windows">increase FPS on Windows</Link>.
      </p>
    </ProductGuide>
  );
}
