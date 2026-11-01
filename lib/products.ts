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
   *  and the Gumroad link becomes the Pro upgrade. Only offered while status is "available" (a
   *  coming-soon product can list its future file without a dead download link). */
  downloadUrl?: string;
  /** Microsoft Store listing (apps.microsoft.com/detail/<Store ID>). When set, the "Get it from
   *  Microsoft" badge sits next to every Download free button so people can pick either. */
  msStoreUrl?: string;
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
  {
    slug: "pdf",
    name: "RevinHi PDF",
    tabLabel: "PDF",
    tagline: "Edit, sign, merge, compress and protect PDFs - fast, offline, no subscription.",
    price: "$9.99",
    platform: "Windows 10/11",
    status: "available",
    accent: "#ff5c7a",
    gumroadUrl: "https://revinhi.gumroad.com/l/xwajbx",
    route: "/pdf",
    features: ["Edit existing text", "Sign & fill forms", "Merge, split & reorder", "Compress & password-protect"],
    heroMedia: "/pdf/hero.mp4",
    downloadUrl: "/downloads/RevinHi-PDF-Setup.exe",
  },
  {
    slug: "ai",
    name: "RevinHi AI",
    tabLabel: "AI",
    tagline: "A private, offline AI on its own drive: chat, pictures, video, ads and topo maps. No cloud, no account.",
    // Not on sale yet: set the price and Gumroad link, then status "available".
    price: "Soon",
    platform: "Windows 10/11",
    status: "coming-soon",
    accent: "#2ed573",
    gumroadUrl: "",
    route: "/ai",
    features: ["Offline AI chat, any model", "Make & edit pictures, video", "Video ads from a link", "Offline topo maps"],
    heroMedia: "/ai/create.jpg",
  },
  {
    slug: "3d",
    name: "RevinHi 3D",
    tabLabel: "3D",
    tagline: "Easy 3D modeling for printing: cut, join and subtract any model, even broken STLs, at real mm or inch sizes.",
    price: "$9.99",
    platform: "Windows 10/11",
    status: "available",
    accent: "#ff9a2e",
    gumroadUrl: "https://revinhi.gumroad.com/l/enziky",
    route: "/3d",
    features: ["Cut & join broken STLs", "Real mm & inch sizes", "Draw, text & logos to 3D", "Local AI model maker"],
    // No file yet: the home card shows the gradient panel until this exists.
    heroMedia: "/3d/hero.mp4",
    // Free installer (freemium). Replace the file on every release (keep the name so old links keep working).
    downloadUrl: "/downloads/RevinHi-3D-Setup.exe",
    // Store ID 9NFFN0J610J5. The Store edition updates through the Store.
    msStoreUrl: "https://apps.microsoft.com/detail/9NFFN0J610J5",
  },
  {
    slug: "recovery",
    name: "RevinHi Recovery",
    tabLabel: "Recovery",
    tagline: "Get back deleted photos, videos and documents, even from formatted drives, memory cards and USB sticks.",
    // Launch price (matches PRICE in revinhi-recovery/src/license/features.ts).
    price: "$19.99",
    platform: "Windows 10/11",
    status: "available",
    accent: "#2ee6c0",
    gumroadUrl: "https://revinhi.gumroad.com/l/iizgf",
    route: "/recovery",
    features: ["Deleted & formatted drives", "Free scan + preview", "Write images to USB", "Drive health & backups"],
    heroMedia: "/recovery/results.png",
    // Free installer (scan + preview). Replace the file on every release (keep the name so old links keep working).
    downloadUrl: "/downloads/RevinHi-Recovery-Setup.exe",
  },
];

export function getProduct(slug: string): Product {
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) throw new Error(`Unknown product slug: ${slug}`);
  return product;
}
