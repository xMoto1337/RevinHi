import type { Metadata } from "next";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getProduct, SUPPORT_EMAIL } from "@/lib/products";
import { JsonLd, PdfFooter as Footer, SectionHeading } from "@/components/pdf/PdfUi";
import { BuyButton } from "@/components/BuyButton";
import { ThreeDGetButtons, ThreeDGuideLinks, ThreeDStoreNote } from "@/components/threed/ThreeDUi";

// Product page. Status, price and Gumroad link live in lib/products.ts; the installer is at the
// product's downloadUrl (replaced on every release). Swap the illustration for real screenshots/video.
const PRODUCT = getProduct("3d");
const AVAILABLE = PRODUCT.status === "available";
const OG_IMAGE = "/brand/revinhi-3d.png";
const ACCENT = PRODUCT.accent;
// Counted: /api/download logs the click, then redirects to the installer.
const DOWNLOAD_URL = `/api/download/${PRODUCT.slug}`;

export const metadata: Metadata = pageMetadata({
  title: "RevinHi 3D - Easy 3D modeling for 3D printing on Windows",
  description:
    "RevinHi 3D is an easy 3D modeling app for Windows: cut, join and subtract any model, even broken STL files, at real mm or inch sizes that open right in your slicer. Drawing, text, logos, sculpting, print helpers and a local AI model maker. Every tool is free.",
  path: "/3d",
  image: OG_IMAGE,
  imageAlt: "RevinHi 3D app icon",
});

const STEPS: { title: string; body: string }[] = [
  {
    title: "Open any model",
    body: "STL, OBJ, 3MF or STEP. Files with holes, overlapping parts or flipped faces open just like clean ones.",
  },
  {
    title: "Cut, join or subtract",
    body: "Drop in a shape, mark it as a Hole, and cut. No error messages, and your model is never quietly \"fixed\" behind your back.",
  },
  {
    title: "Print it at the real size",
    body: "Save it, or send it straight to your slicer. A 50 mm part opens as 50 mm, every time.",
  },
];

const FEATURES: { title: string; description: string; accent: string }[] = [
  {
    title: "Real sizes, mm or inches",
    description:
      "Type 50 mm or 2 in and that's what you get. Files open at the right size in Bambu Studio, PrusaSlicer, Cura and OrcaSlicer.",
    accent: ACCENT,
  },
  {
    title: "Change your mind later",
    description:
      "Keep your work as Solid and Hole layers you can move or resize any time, or apply each cut right away. Your choice, cut by cut.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Draw, then make it 3D",
    description:
      "Draw with lines, shapes and a pen tool, on the grid or right on a model. Then pull it up, spin it around, or blend between two drawings.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Text from your fonts",
    description:
      "Use any font installed on your PC. Set the height and depth, curve the words around a circle, or flip them for a stamp.",
    accent: "var(--neon-success)",
  },
  {
    title: "Pictures and logos to 3D",
    description: "Turn a picture or logo into a 3D shape in a few clicks, with a live preview. SVG and DXF drawings work too.",
    accent: "var(--neon-amber)",
  },
  {
    title: "Raise or engrave",
    description: "Put text or a logo onto any surface, raised up or cut in. It bends to follow curved surfaces too.",
    accent: "var(--neon-danger)",
  },
  {
    title: "Lithophanes",
    description: "Turn a photo into a lithophane that lights up when you hold it to a lamp. Flat or curved, at the size you choose.",
    accent: ACCENT,
  },
  {
    title: "Sculpt like clay",
    description: "Push, pull, smooth, pinch and inflate with brushes. Works with a mouse or a pen tablet.",
    accent: "var(--neon-cyan)",
  },
  {
    title: "Print helpers",
    description:
      "Hollow a model to save filament, split big models to fit your printer bed with pegs to join the pieces, and send to your slicer in one click.",
    accent: "var(--neon-purple)",
  },
  {
    title: "Multi-color prints",
    description: "Color each part or paint right onto the model, then save a multi-color 3MF ready for your multi-color printer.",
    accent: "var(--neon-success)",
  },
  {
    title: "Parts library",
    description: "Ready-made threads, nuts and bolts, hinges, gears, clips and boxes with lids, sized however you want.",
    accent: "var(--neon-amber)",
  },
  {
    title: "Open STEP files",
    description: "Bring in STEP files from CAD programs and parts websites at the right size, alongside STL, OBJ and 3MF.",
    accent: "var(--neon-danger)",
  },
];

const TIERS: { feature: string; free: string; pro: string }[] = [
  { feature: "Cut, join and subtract (even broken files)", free: "Included", pro: "Included" },
  { feature: "Drawing, text, logos, lithophanes", free: "Included", pro: "Included" },
  { feature: "Sculpting and print helpers", free: "Included", pro: "Included" },
  { feature: "Parts library and multi-color", free: "Included", pro: "Included" },
  { feature: "AI model maker", free: "Included", pro: "Included" },
  { feature: "Open STL, OBJ, 3MF, STEP, PLY and GLB", free: "Included", pro: "Included" },
  { feature: "Real mm and inch sizes", free: "Included", pro: "Included" },
  { feature: "Project files (.rv3d)", free: "Full detail", pro: "Full detail" },
  { feature: "Detail in exported files and Send to slicer", free: "Up to 20,000 triangles, coarser curves", pro: "Every triangle" },
  { feature: "Detail in exported AI models", free: "Up to 5,000 triangles", pro: "Every triangle" },
  { feature: "Mark on exported files", free: "Small RevinHi mark engraved into the bottom", pro: "None" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "When can I get RevinHi 3D?",
    a: AVAILABLE
      ? `Now. Download it free from this page for Windows 10/11, and upgrade to Pro for ${PRODUCT.price} once whenever you want full-detail exports.`
      : `It's coming soon. Email ${SUPPORT_EMAIL} if you'd like to hear when it's out.`,
  },
  {
    q: "What's free and what's Pro?",
    a: "Every tool works in the free version, including cutting, drawing, sculpting, the parts library and the AI model maker, and your project files always keep full detail. Exports (STL, 3MF, OBJ, GLB and Send to slicer) are where Free and Pro differ: Free saves a lighter copy with up to 20,000 triangles (5,000 for AI-made models), coarser curves, and a small RevinHi mark engraved into the flat bottom. Pro saves every triangle with no mark. Pro is a one-time purchase with free updates: no subscription and no account.",

  },
  {
    q: "Will it open my broken STL files?",
    a: "Yes. Files with holes, overlapping parts or flipped faces open and cut like any other. RevinHi 3D never changes your model on its own. If you do want to patch holes or fix faces, there are buttons for that, and they only run when you click them.",
  },
  {
    q: "Will my prints come out the right size?",
    a: "Yes. Everything is measured in real millimeters or inches, and saved files open at the same size in Bambu Studio, PrusaSlicer, Cura and OrcaSlicer. If a downloaded file looks like it was made in inches, the app offers to scale it, but never does it without asking.",
  },
  {
    q: "Is it hard to learn?",
    a: "It's built for beginners as well as experienced makers. Simple mode keeps the main tools up front (Add, Cut, Join, Draw, Text, Logo), and Advanced mode adds sculpting and finer editing when you're ready.",
  },
  {
    q: "Does the AI model maker need the internet?",
    a: "Only once, to download the AI model the first time you use it. After that it runs on your own PC: no cloud, no credits and no account. It works best with a graphics card, and the app tells you plainly if yours isn't enough.",
  },
  {
    q: "Is it Windows only?",
    a: PRODUCT.msStoreUrl
      ? "Yes. It's built for Windows 10 and 11 (64-bit). Get it here or from the Microsoft Store, whichever you prefer. The Microsoft Store version updates through the Store."
      : "Yes. It's built for Windows 10 and 11 (64-bit).",
  },
];

const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PRODUCT.name,
  description:
    "Easy 3D modeling and editing app for Windows, made for 3D printing: cut, join and subtract any model, even broken STL files, at real mm or inch sizes. Drawing, text, logos, lithophanes, sculpting, print helpers, multi-color 3MF, a parts library, STEP import and a local AI model maker.",
  url: `${SITE_URL}/3d`,
  image: `${SITE_URL}${OG_IMAGE}`,
  operatingSystem: "Windows 10, Windows 11",
  applicationCategory: "DesignApplication",
  isAccessibleForFree: true,
  ...(AVAILABLE ? { downloadUrl: `${SITE_URL}${DOWNLOAD_URL}` } : {}),
  ...(AVAILABLE
    ? {
        offers: [
          { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", url: `${SITE_URL}/3d` },
          { "@type": "Offer", name: "Pro (one-time)", price: PRODUCT.price.replace("$", ""), priceCurrency: "USD", url: PRODUCT.gumroadUrl },
        ],
      }
    : {}),
  // The Microsoft Store listing is the same app, so it identifies it too.
  ...(PRODUCT.msStoreUrl ? { sameAs: [PRODUCT.msStoreUrl] } : {}),
  featureList: [
    "Cut, join and subtract any model, including broken STL files, with no automatic repair",
    "Real millimeter and inch sizes that open correctly in slicers",
    "Editable Solid and Hole layers, or instant cuts",
    "Drawing tool: extrude, revolve, loft and sweep",
    "Text from installed fonts, including curved text",
    "Picture and logo to 3D, SVG and DXF import",
    "Raise or engrave onto surfaces",
    "Lithophanes",
    "Sculpting brushes",
    "Hollow, split to fit the bed with connectors, send to slicer",
    "Multi-color 3MF export",
    "Parts library: threads, hinges, gears, clips, boxes",
    "Local AI: picture or description to 3D model, no cloud",
    "STEP import",
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

/**
 * Placeholder hero art until real screenshots exist: a line drawing of a cube with a cylinder cutting a
 * hole through it, sized in mm. Captioned as an illustration so it never passes for a screenshot.
 */
function HeroIllustration() {
  const dim = "rgba(255,255,255,0.45)";
  return (
    <figure className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      <div className="relative aspect-[16/10] bg-[#05060a] sm:aspect-[16/9]">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 15% 10%, ${ACCENT}40, transparent 55%), radial-gradient(90% 80% at 90% 100%, ${ACCENT}26, transparent 60%), #06070c`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(circle at 50% 50%, #000, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000, transparent 75%)",
          }}
        />
        <svg
          viewBox="140 4 340 320"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Illustration: a 50 mm cube with a cylinder cutting a hole through it"
        >
          <defs>
            <clipPath id="rh3d-hole">
              <ellipse cx="300" cy="135" rx="49" ry="28.3" />
            </clipPath>
          </defs>
          {/* Cube (Solid) */}
          <g stroke={ACCENT} strokeWidth="1.6" strokeLinejoin="round">
            <polygon points="204.7,245 300,300 300,190 204.7,135" fill={ACCENT} fillOpacity="0.2" />
            <polygon points="300,300 395.3,245 395.3,135 300,190" fill={ACCENT} fillOpacity="0.1" />
            <polygon points="300,190 395.3,135 300,80 204.7,135" fill={ACCENT} fillOpacity="0.32" />
          </g>
          {/* Hole through the top face */}
          <ellipse cx="300" cy="135" rx="49" ry="28.3" fill="#06070c" />
          <g clipPath="url(#rh3d-hole)">
            <ellipse cx="300" cy="135" rx="49" ry="28.3" fill={ACCENT} fillOpacity="0.16" />
            <ellipse cx="300" cy="160" rx="49" ry="28.3" fill="#06070c" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="1.2" />
          </g>
          <ellipse cx="300" cy="135" rx="49" ry="28.3" fill="none" stroke={ACCENT} strokeWidth="1.6" />
          {/* Cutter (Hole), shown as a dashed ghost */}
          <g stroke="var(--neon-cyan)" strokeWidth="1.6" strokeDasharray="5 5" fill="none">
            <ellipse cx="300" cy="42" rx="49" ry="28.3" />
            <line x1="251" y1="42" x2="251" y2="135" />
            <line x1="349" y1="42" x2="349" y2="135" />
          </g>
          {/* Labels */}
          <g fontSize="12" fontWeight="600" fill="currentColor">
            <text x="362" y="38" fill="var(--neon-cyan)">Hole</text>
            <text x="196" y="204" textAnchor="end" fill={ACCENT}>Solid</text>
          </g>
          {/* Dimensions */}
          <g stroke={dim} strokeWidth="1">
            <line x1="319" y1="311" x2="414.3" y2="256" />
            <line x1="281" y1="311" x2="185.7" y2="256" />
            <line x1="417" y1="245" x2="417" y2="135" />
          </g>
          <g fontSize="12" fill={dim} textAnchor="middle">
            <text x="374" y="298" transform="rotate(-30 374 298)">50 mm</text>
            <text x="226" y="298" transform="rotate(30 226 298)">50 mm</text>
            <text x="446" y="194">50 mm</text>
          </g>
        </svg>
      </div>
      <figcaption className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/45">
        Illustration. Screenshots of the real app are coming soon.
      </figcaption>
    </figure>
  );
}

export default function ThreeDPage() {
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={SOFTWARE_LD} />
      <JsonLd data={FAQ_LD} />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-14 sm:pt-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="glass-panel flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-center text-[11px] text-white/70 sm:px-4 sm:text-xs">
            <span className={`pulse-dot h-1.5 w-1.5 shrink-0 rounded-full ${AVAILABLE ? "bg-neon-success" : "bg-neon-amber"}`} />
            <span>
              {AVAILABLE
                ? "Windows 10/11 • Every tool free • Pro is a one-time purchase"
                : "Coming soon • Windows 10/11 • Every tool free"}
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-6xl">
            3D modeling made easy,
            <br />
            <span className="rgb-chase-text">even for broken files.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
            RevinHi 3D lets anyone cut, join and subtract 3D models, even the broken STL files other apps refuse. Real
            mm and inch sizes, drawing, text, logos and a built-in AI that makes models on your own PC. Made for 3D
            printing, from your first print to your hundredth.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <ThreeDGetButtons />
            <BuyButton product={PRODUCT} className="px-8 py-3.5 text-base" label={<>Get Pro &mdash; {PRODUCT.price}</>} chase />
            {!AVAILABLE && (
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=RevinHi%203D`}
                className="glass-panel inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold text-white/85 transition hover:text-white"
              >
                Tell me when it&apos;s out
              </a>
            )}
          </div>
          <ThreeDStoreNote className="mt-5" />
        </div>
        <HeroIllustration />
      </section>

      {/* Headline feature */}
      <section id="cut" className="scroll-mt-28 px-6 py-24">
        <SectionHeading
          eyebrow="Cut anything"
          title="It never says no"
          subtitle="Most models you download aren't perfect, and that's where other 3D apps give up. RevinHi 3D cuts, joins and subtracts them anyway, with no errors and no automatic fixing."
        />
        <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="glass-panel-flat rounded-2xl p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                Step {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-28 px-6 py-24">
        <SectionHeading
          eyebrow="What it does"
          title="Everything you need to make it, fix it and print it"
          subtitle="Easy enough for a first print, with room to grow."
        />
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-panel-flat rounded-2xl p-6 transition hover:bg-white/[0.07]">
              <div className="mb-4 h-9 w-9 rounded-lg" style={{ background: feature.accent, boxShadow: `0 0 24px ${feature.accent}` }} />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Local AI */}
      <section id="ai" className="scroll-mt-28 px-6 py-16">
        <div className="glass-panel mx-auto max-w-4xl rounded-3xl p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">Built-in AI</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Make a model from a picture or a few words</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60">
            Show it a photo or describe what you want, pick from a few versions, and type the size you need. The AI runs
            on your own PC: no cloud, no credits to buy and no account. Your pictures never leave your computer.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-white/70">
            {["Picture to 3D", "Description to 3D", "Runs on your PC", "No credits"].map((chip) => (
              <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Pro */}
      <section id="pricing" className="px-6 py-24">
        <SectionHeading eyebrow="Pricing" title="Every tool free. Pro for full detail." />
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="glass-panel rounded-3xl p-6 sm:p-10">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              <span />
              <span>Free</span>
              <span>Pro &middot; {PRODUCT.price}</span>
            </div>
            {TIERS.map((t) => (
              <div key={t.feature} className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-white/5 py-3 text-sm">
                <span className="text-white/85">{t.feature}</span>
                <span className="text-white/50">{t.free}</span>
                <span className="text-neon-success">{t.pro}</span>
              </div>
            ))}
            <div className="mt-8 flex flex-col items-center gap-4">
              <ThreeDGetButtons size="sm" />
              <BuyButton product={PRODUCT} className="px-7 py-3 text-sm" label={<>Get Pro &mdash; {PRODUCT.price}</>} />
            </div>
            <p className="mt-4 text-center text-xs text-white/40">One-time purchase &middot; free updates &middot; no subscription</p>
            <ThreeDStoreNote className="mt-1.5 text-center" />
          </div>
        </div>
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

      {/* Guides */}
      <section id="guides" className="scroll-mt-28 px-6 pb-24">
        <ThreeDGuideLinks title="How to: RevinHi 3D guides" />
      </section>

      <Footer />
    </div>
  );
}
