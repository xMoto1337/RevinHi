import Image from "next/image";
import type { Metadata } from "next";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getProduct, SUPPORT_EMAIL } from "@/lib/products";
import { JsonLd, PdfFooter as Footer, SectionHeading } from "@/components/pdf/PdfUi";
import { BuyButton } from "@/components/BuyButton";

const PRODUCT = getProduct("ai");
const AVAILABLE = PRODUCT.status === "available";
const OG_IMAGE = "/brand/revinhi-ai.png";

export const metadata: Metadata = pageMetadata({
  title: "RevinHi AI - Private offline AI on a drive for Windows",
  description:
    "A private, offline AI that runs from a drive on your Windows PC: chat, pictures, video, video ads and offline topo maps. No cloud and no account.",
  path: "/ai",
  image: OG_IMAGE,
  imageAlt: "RevinHi AI app icon",
});

const FEATURES: { title: string; description: string; accent: string }[] = [
  {
    title: "Chat with any model",
    description:
      "Pick from a store of open AI models for everyday questions, writing, coding and seeing pictures, including uncensored ones. Switch models mid-chat, or add more from the built-in store.",
    accent: "var(--neon-success)",
  },
  {
    title: "It does the work",
    description:
      "Ask to change a photo, make a picture, a video, a song or read something aloud, and your chat hands the job to the right specialist model on your PC. No copy-pasting between apps.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Pictures, edits and video",
    description:
      "Make photos from a description, edit or combine photos, bring a picture to life as a short video, or copy the moves from a video you own. All rendered on your own graphics card.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Video ads from a link",
    description:
      "Paste a product link and RevinHi AI reads the page, writes a script and plans talking and product scenes with a presenter you choose. Change anything before you export.",
    accent: "var(--neon-amber)",
  },
  {
    title: "Offline topo maps",
    description:
      "A tactical map with elevation lines, shaded hills, water sources, pins, distance rings and measuring, all working with no signal. Download more areas or satellite views when you're online.",
    accent: "var(--neon-success)",
  },
  {
    title: "Exact answers",
    description:
      "Small AI models are bad at arithmetic, so RevinHi AI works out numbers, dates and money by running real calculations, and tests the code it writes before handing it over.",
    accent: "var(--neon-danger)",
  },
  {
    title: "Internet only when you want it",
    description:
      "One switch. Off, nothing leaves your PC. On, the AI can search the web and read pages for current answers and name its sources, and the app can download maps and models.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Private by design",
    description:
      "No account, no cloud, no tracking of what you ask. Your chats, pictures and files stay on your drive, and it runs from the drive without installing anything on the PC.",
    accent: "var(--neon-cyan)",
  },
];

const STEPS: { title: string; body: string }[] = [
  { title: "Plug in the drive", body: "RevinHi AI comes ready to run on its own drive. Nothing to install on the PC." },
  { title: "Open RevinHi AI", body: "Enter your license key once, then chat, create and map. The AI models run on your own hardware." },
  { title: "Keep it current", body: "Switch Internet on to get app updates and add more models, maps and areas whenever you like." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Does RevinHi AI really work offline?",
    a: "Yes. The AI models, the maps and the app all run from the drive on your PC, so chatting, making pictures and using the map work with no internet at all. Internet is only used when you switch it on: web search, updates, and downloading more models or map areas.",
  },
  {
    q: "Is my data private?",
    a: "Yes. There's no account and nothing is sent to a cloud service. Your chats, pictures, videos and map pins are saved on your drive. With Internet off, nothing leaves your PC.",
  },
  {
    q: "What do I need to run it?",
    a: "A Windows 10 or 11 (64-bit) PC with a free USB port. Chat works on most modern PCs; the faster your computer, the faster the answers. Making pictures and video needs an NVIDIA graphics card, with 8 GB or more of video memory recommended.",
  },
  {
    q: "Which AI models does it use?",
    a: "Open AI models that run locally: general chat, coding, vision (models that can see pictures), image, photo-editing, video, music and voice models. The built-in model store shows which ones fit your PC, and you can add models when Internet is on.",
  },
  {
    q: "Can the chat make and edit pictures?",
    a: "Yes. Ask in plain words, like \"make the jacket red\" or \"make a picture of a cabin on a lake at sunrise\", and the chat sends the job to the picture or editing model and shows the result right in the conversation.",
  },
  {
    q: "How do updates work?",
    a: "When Internet is on, RevinHi AI checks for a new version and shows an update popup. Updates are signed, so only genuine RevinHi updates are installed.",
  },
  {
    q: "When can I buy it?",
    a: `RevinHi AI is coming soon. Email ${SUPPORT_EMAIL} if you'd like to hear when it's available.`,
  },
];

const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PRODUCT.name,
  description:
    "Private, offline AI for Windows that runs from its own drive: chat with open AI models, make and edit pictures and videos, make video ads from a product link, and use offline topographic maps. No cloud and no account.",
  url: `${SITE_URL}/ai`,
  image: `${SITE_URL}${OG_IMAGE}`,
  screenshot: [`${SITE_URL}/ai/create.jpg`, `${SITE_URL}/ai/map.jpg`],
  operatingSystem: "Windows 10, Windows 11",
  applicationCategory: "MultimediaApplication",
  featureList: [
    "Offline AI chat with open models, switchable mid-chat",
    "Chat hands picture, edit, video, music and voice jobs to specialist models",
    "Text to image, photo editing, image to video, video remix",
    "Video ads from a product link",
    "Offline topographic maps with pins, water sources, distance rings and measuring",
    "Exact math by running calculations; code tested before it's shown",
    "Optional web search with sources when Internet is switched on",
    "Runs from its own drive, no installation, no account",
  ],
  publisher: { "@type": "Organization", name: "RevinHi", url: SITE_URL },
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function AiPage() {
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={SOFTWARE_LD} />
      <JsonLd data={FAQ_LD} />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-14 sm:pt-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="glass-panel flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-center text-[11px] text-white/70 sm:px-4 sm:text-xs">
            <span className={`pulse-dot h-1.5 w-1.5 shrink-0 rounded-full ${AVAILABLE ? "bg-neon-success" : "bg-neon-amber"}`} />
            <span>{AVAILABLE ? "Windows 10/11 • Runs from its own drive" : "Coming soon • Windows 10/11 • Runs from its own drive"}</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-6xl">
            Your own AI,
            <br />
            <span className="rgb-chase-text">offline and private.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
            RevinHi AI puts chat, pictures, video, ads and offline maps on one drive that runs on your Windows PC. No cloud,
            no account, no subscription. Nothing you ask leaves your computer unless you switch the internet on.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <BuyButton product={PRODUCT} className="px-8 py-3.5 text-base" chase />
            {!AVAILABLE && (
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=RevinHi%20AI`}
                className="glass-panel inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold text-white/85 transition hover:text-white"
              >
                Tell me when it&apos;s out
              </a>
            )}
          </div>
        </div>
        <figure className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
          <Image
            className="block h-auto w-full"
            src="/ai/create.jpg"
            width={1400}
            height={860}
            sizes="(max-width: 1024px) 100vw, 1024px"
            preload
            alt="RevinHi AI's Create screen: making a photo from a description, with a gallery of pictures and videos made on the PC"
          />
        </figure>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-28 px-6 py-24">
        <SectionHeading eyebrow="What it does" title="A whole AI studio that never phones home" subtitle="Everything runs on your PC, from the drive." />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-panel-flat rounded-2xl p-6 transition hover:bg-white/[0.07]">
              <div className="mb-4 h-9 w-9 rounded-lg" style={{ background: feature.accent, boxShadow: `0 0 24px ${feature.accent}` }} />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Maps */}
      <section id="maps" className="scroll-mt-28 px-6 py-16">
        <SectionHeading
          eyebrow="Offline maps"
          title="Topo maps that work with no signal"
          subtitle="Elevation lines, shaded hills, water sources and your own pins, saved on the drive. Measure routes and draw distance rings anywhere."
        />
        <figure className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
          <Image
            className="block h-auto w-full"
            src="/ai/map.jpg"
            width={1400}
            height={860}
            sizes="(max-width: 1024px) 100vw, 1024px"
            alt="RevinHi AI's offline topographic map with elevation lines and pins for a camp, a meeting point, a creek and a hazard"
          />
        </figure>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-28 px-6 py-24">
        <SectionHeading eyebrow="How it works" title="Plug in. Open. Ask." />
        <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="glass-panel-flat rounded-2xl p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">Step {i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24">
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        <div className="mx-auto mt-12 max-w-2xl space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="glass-panel-flat rounded-2xl p-6">
              <h3 className="font-semibold text-white/90">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
