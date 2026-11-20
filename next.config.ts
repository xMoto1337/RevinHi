import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed pages: old links (and search results) land on the product page instead of a 404.
  async redirects() {
    return [{ source: "/pdf/adobe-acrobat-alternative", destination: "/pdf", permanent: true }];
  },
  // Admin pages and data: never framed by other sites, never cached, never indexed.
  async headers() {
    const locked = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];
    return [
      { source: "/admin", headers: locked },
      { source: "/admin/:path*", headers: locked },
      { source: "/api/admin/:path*", headers: locked },
    ];
  },
};

export default nextConfig;
