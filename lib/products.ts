// Product registry - the single source of truth for every app sold on the storefront.
// Adding a new app = add one entry here (plus its page under app/(store)/<route>). The home grid,
// the tab navigation, and each product page's Buy buttons all read from this list.

export type ProductStatus = "available" | "coming-soon";

export type Product = {
  slug: string;
  name: string;
  /** Short name shown in the tab bar. */
  tabLabel: string;
  tagline: string;
  /** Display string - must match the price set on the Gumroad product. */
  price: string;
  platform: string;
  status: ProductStatus;
  /** CSS color used for the card swatch / accents. */
  accent: string;
  /** Gumroad product link used for the overlay checkout. */
  gumroadUrl: string;
  route: string;
  features: string[];
  /** Path under /public. Optional file - the storefront falls back to a gradient panel if it doesn't exist yet. */
  heroMedia: string;
  /** Free-tier installer (freemium apps only). When set, the product page leads with "Download free"
   *  and the Gumroad link becomes the Pro upgrade. */
  downloadUrl?: string;
};

export const SUPPORT_EMAIL = "revinhi@yahoo.com";

export const PRODUCTS: Product[] = [
  {
    slug: "performance",
    name: "RevinHi Performance",
    tabLabel: "Performance",
    tagline: "Safe, reversible Windows tweaks that cut input lag and squeeze out more FPS.",
    price: "$9.99",
    platform: "Windows 10/11",
    status: "available",
    accent: "#00e5ff",
    gumroadUrl: "https://revinhi.gumroad.com/l/fsxmgh",
    route: "/performance",
    features: ["One-click game tweaks", "DNS finder + game-region ping", "Live system dashboard", "One-button undo"],
    heroMedia: "/performance/hero.mp4",
  },
  {
    slug: "desktop",
    name: "RevinHi Desktop",
    tabLabel: "Desktop",
    tagline: "Live wallpapers, custom widgets, rain on your screen, and a live storm radar.",
    price: "$9.99",
    platform: "Windows 10/11",
    status: "available",
    accent: "#8a5cff",
    gumroadUrl: "https://revinhi.gumroad.com/l/wflne",
    route: "/desktop",
    features: ["100+ animated scenes", "Customizable widgets", "Rain, snow & light rays", "Live US radar + lightning"],
    heroMedia: "/desktop/hero.mp4",
    // Served from /public. Replace the file on every release (keep the name so old links keep working).
    downloadUrl: "/downloads/RevinHi-Desktop-Setup.exe",
  },
];

export function getProduct(slug: string): Product {
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) throw new Error(`Unknown product slug: ${slug}`);
  return product;
}
