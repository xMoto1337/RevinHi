import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { getProduct, PRODUCTS } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

// Public storefront pages only (not /admin, /api or the private /binscout relay page).
// Guide pages come from lib/guides.ts, so a new guide is listed here automatically.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    ...PRODUCTS.map((p) => ({
      url: `${SITE_URL}${p.route}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: p.status === "available" ? 0.9 : 0.6,
    })),
    { url: `${SITE_URL}/guides`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g) => ({
      url: `${SITE_URL}${getProduct(g.product).route}/${g.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
