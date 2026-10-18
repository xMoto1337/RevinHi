import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed pages: old links (and search results) land on the product page instead of a 404.
  async redirects() {
    return [{ source: "/pdf/adobe-acrobat-alternative", destination: "/pdf", permanent: true }];
  },
};

export default nextConfig;
