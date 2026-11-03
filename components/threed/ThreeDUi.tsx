import { GuideLinks } from "@/components/guides/GuideLinks";
import { MsStoreBadge } from "@/components/MsStoreBadge";
import { STORE_UPDATE_NOTE } from "@/lib/3d-copy";
import { guidesFor } from "@/lib/guides";
import { getProduct } from "@/lib/products";

// Shared building blocks for /3d and its guide pages (/3d/<guide>).

export const THREED_PRODUCT = getProduct("3d");
export const THREED_AVAILABLE = THREED_PRODUCT.status === "available";
export const THREED_ACCENT = THREED_PRODUCT.accent;
export const THREED_OG_IMAGE = "/brand/revinhi-3d.png";
// Counted: /api/download logs the click, then redirects to the installer.
export const THREED_DOWNLOAD_URL = `/api/download/${THREED_PRODUCT.slug}`;

/** Every /3d/<slug> guide (the list lives in lib/guides.ts). */
export const THREED_GUIDES = guidesFor("3d");

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
  return <GuideLinks product="3d" current={current} title={title} />;
}
