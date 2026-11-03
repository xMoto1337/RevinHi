import Image from "next/image";

// Microsoft's official Store badge ("Download from the Microsoft Store", black version), saved
// unchanged from https://get.microsoft.com/images/en-us%20dark.svg, the image Microsoft's own badge
// component (github.com/microsoft/app-store-badge) uses for plain HTML links. Shown at its own
// proportions (161 x 44) and never recolored, cropped or restyled.
const BADGE_SRC = "/badges/microsoft-store-badge.svg";

/** `sizeClassName` sets the height (width follows), e.g. "h-11 sm:h-[52px]". */
export function MsStoreBadge({ href, sizeClassName = "h-12", className = "" }: { href: string; sizeClassName?: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={`inline-flex shrink-0 transition hover:scale-[1.02] ${className}`}>
      <Image src={BADGE_SRC} alt="Download from the Microsoft Store" width={161} height={44} unoptimized className={`w-auto ${sizeClassName}`} />
    </a>
  );
}
