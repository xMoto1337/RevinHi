import Link from "next/link";
import { MsStoreBadge } from "@/components/MsStoreBadge";
import { STORE_UPDATE_NOTE } from "@/lib/3d-copy";
import { getProduct } from "@/lib/products";

// Shared building blocks for /3d and its guide pages (/3d/<guide>).

export const THREED_PRODUCT = getProduct("3d");
export const THREED_AVAILABLE = THREED_PRODUCT.status === "available";
export const THREED_ACCENT = THREED_PRODUCT.accent;
export const THREED_OG_IMAGE = "/brand/revinhi-3d.png";
// Counted: /api/download logs the click, then redirects to the installer.
export const THREED_DOWNLOAD_URL = `/api/download/${THREED_PRODUCT.slug}`;

/** Every /3d/<slug> guide. The sitemap, /guides, /3d and each guide's "More guides" read this list. */
export const THREED_GUIDES: { slug: string; label: string; blurb: string }[] = [
  { slug: "fix-broken-stl-files", label: "Fix broken STL files", blurb: "Open, cut and print STLs with holes or gaps." },
  { slug: "free-stl-editor", label: "Free STL editor for Windows", blurb: "Resize, cut, add text and print, free." },
  { slug: "picture-to-3d-model", label: "Picture to 3D model", blurb: "Offline AI on your own graphics card." },
  { slug: "add-text-to-stl", label: "Add text to an STL", blurb: "Raised or engraved, in any font on your PC." },
  { slug: "split-stl-to-fit-print-bed", label: "Split an STL to fit your bed", blurb: "Cut big models into parts with pegs." },
  { slug: "lithophane-maker", label: "Lithophane maker", blurb: "Flat or curved lithophanes from a photo." },
  { slug: "cut-hole-in-stl", label: "Cut a hole in an STL", blurb: "And combine STL files into one." },
  { slug: "tinkercad-alternative", label: "Offline Tinkercad alternative", blurb: "A desktop app with Solid and Hole shapes." },
];

export function ThreeDDownloadButton({ className = "" }: { className?: string }) {
  if (!THREED_AVAILABLE) return null;
  return (
    <a
      href={THREED_DOWNLOAD_URL}
      download
      className={`inline-flex items-center justify-center rounded-full font-semibold text-black transition hover:scale-[1.02] ${className}`}
      style={{ background: THREED_ACCENT, boxShadow: `0 0 30px ${THREED_ACCENT}59` }}
    >
      Download free
    </a>
  );
}

/**
 * "Download free" next to the Microsoft Store badge, so people can pick. Wraps on narrow phones.
 * `size` matches the button height to the badge: "lg" for heroes, "sm" for cards.
 */
export function ThreeDGetButtons({ size = "lg", className = "" }: { size?: "lg" | "sm"; className?: string }) {
  if (!THREED_AVAILABLE) return null;
  const lg = size === "lg";
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <ThreeDDownloadButton className={lg ? "h-11 px-6 text-sm sm:h-[52px] sm:px-8 sm:text-base" : "h-11 px-6 text-sm"} />
      {THREED_PRODUCT.msStoreUrl && (
        <MsStoreBadge href={THREED_PRODUCT.msStoreUrl} sizeClassName={lg ? "h-11 sm:h-[52px]" : "h-11"} />
      )}
    </div>
  );
}

export function ThreeDStoreNote({ className = "" }: { className?: string }) {
  if (!THREED_AVAILABLE || !THREED_PRODUCT.msStoreUrl) return null;
  return <p className={`text-xs text-white/45 ${className}`}>{STORE_UPDATE_NOTE}</p>;
}

/** Grid of links to the /3d guides. `current` hides the page you're on. */
export function ThreeDGuideLinks({ current, title = "Guides" }: { current?: string; title?: string }) {
  const guides = THREED_GUIDES.filter((g) => g.slug !== current);
  return (
    <nav aria-label="RevinHi 3D guides" className="mx-auto max-w-5xl">
      <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">{title}</h2>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/3d/${g.slug}`} className="glass-panel-flat block h-full rounded-2xl p-5 transition hover:bg-white/[0.07]">
              <span className="font-semibold text-white/90">{g.label}</span>
              <span className="mt-1 block text-sm text-white/55">{g.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
