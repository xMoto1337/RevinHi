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
