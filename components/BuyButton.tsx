import type { ReactNode } from "react";
import type { Product } from "@/lib/products";

/**
 * Gumroad overlay checkout button. Deliberately NOT using the "gumroad-button" class: verified against
 * Gumroad's actual loader bundle (assets.gumroad.com/js/gumroad-bundle.js) that the overlay hooks EVERY
 * <a> whose href is a gumroad.com/l/... link (plus a MutationObserver for later-added links), while its
 * restyling CSS (grey box + Gumroad logo) only targets a.gumroad-button. Without the class we keep our
 * own styling and still get the overlay. The bundle also appends an empty span.logo-full to each link,
 * hidden via .rh-buy in globals.css. `chase` wraps it in the spinning comet ring.
 */
export function BuyButton({
  product,
  className = "",
  chase = false,
  wrapperClassName = "",
  label,
}: {
  product: Product;
  className?: string;
  chase?: boolean;
  wrapperClassName?: string;
  label?: ReactNode;
}) {
  if (product.status !== "available") {
    return (
      <span
        className={`inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 font-semibold text-white/50 ${className}`}
      >
        Coming soon
      </span>
    );
  }

  const button = (
    <a
      className={`rh-buy inline-flex items-center justify-center rounded-full bg-neon-cyan px-7 py-3 font-semibold text-black shadow-[0_0_30px_rgba(0,229,255,0.35)] transition hover:shadow-[0_0_45px_rgba(0,229,255,0.55)] hover:scale-[1.02] ${className}`}
      href={product.gumroadUrl}
    >
      {label ?? <>Buy Now &mdash; {product.price}</>}
    </a>
  );

  if (!chase) return button;
  return <div className={`chase-ring ${wrapperClassName}`}>{button}</div>;
}
