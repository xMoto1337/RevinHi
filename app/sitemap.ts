import type { MetadataRoute } from "next";
import { PDF_GUIDES } from "@/components/pdf/PdfUi";
import { PRODUCTS } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

// Public storefront pages only (not /admin, /api or the private /binscout relay page).
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    ...PRODUCTS.map((p) => ({
      url: `${SITE_URL}${p.route}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...PDF_GUIDES.map((g) => ({
      url: `${SITE_URL}/pdf/${g.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
