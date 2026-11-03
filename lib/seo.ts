import type { Metadata } from "next";

export const SITE_URL = "https://revinhi.com";

/**
 * Per-page metadata: absolute title (pages already carry the brand), canonical, and full
 * openGraph/twitter blocks. Next merges these objects shallowly, so each page needs its own copy of
 * siteName/images or they'd be dropped from the parent layout.
 * The brand images are 512x512 squares, hence the "summary" Twitter card rather than summary_large_image.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = "/brand/revinhi-brand.png",
  imageAlt = "RevinHi",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const images = [{ url: image, width: 512, height: 512, alt: imageAlt }];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url, siteName: "RevinHi", type: "website", images },
    twitter: { card: "summary", title, description, images: [image] },
  };
}

type LdProduct = {
  name: string;
  slug: string;
  route: string;
  price: string;
  status: string;
  gumroadUrl: string;
  downloadUrl?: string;
  msStoreUrl?: string;
};

/**
 * SoftwareApplication JSON-LD for a product page: OS, category, offers (a free offer when there's a
 * free download, plus the paid one), downloadUrl and the Microsoft Store listing as sameAs.
 */
export function softwareAppLd(
  p: LdProduct,
  extra: { description: string; applicationCategory: string; image: string; featureList?: string[]; freeOfferNote?: string; paidOfferName?: string },
) {
  const available = p.status === "available";
  const price = p.price.replace(/[^0-9.]/g, "");
  const hasFree = Boolean(p.downloadUrl);
  const offers = available
    ? [
        ...(hasFree
          ? [{ "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", url: `${SITE_URL}${p.route}`, ...(extra.freeOfferNote ? { description: extra.freeOfferNote } : {}) }]
          : []),
        ...(price ? [{ "@type": "Offer", name: extra.paidOfferName ?? (hasFree ? "Pro (one-time)" : "One-time purchase"), price, priceCurrency: "USD", url: p.gumroadUrl }] : []),
      ]
    : [];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.name,
    description: extra.description,
    url: `${SITE_URL}${p.route}`,
    image: `${SITE_URL}${extra.image}`,
    operatingSystem: "Windows 10, Windows 11",
    applicationCategory: extra.applicationCategory,
    ...(hasFree ? { isAccessibleForFree: true } : {}),
    ...(available && hasFree ? { downloadUrl: `${SITE_URL}/api/download/${p.slug}` } : {}),
    ...(offers.length ? { offers } : {}),
    ...(extra.featureList ? { featureList: extra.featureList } : {}),
    ...(p.msStoreUrl ? { sameAs: [p.msStoreUrl] } : {}),
    publisher: { "@type": "Organization", name: "RevinHi", url: SITE_URL },
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Home page: who publishes the site, and the site itself. */
export const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "RevinHi",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  email: "revinhi@yahoo.com",
};

export const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "RevinHi",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
};
