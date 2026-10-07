import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "RevinHi Performance - Safe Windows game optimizer",
  description:
    "Safe, reversible Windows 10/11 tweaks that cut input lag and squeeze more FPS out of your PC. $9.99 once, free updates forever.",
  path: "/performance",
  image: "/brand/revinhi-perf.png",
  imageAlt: "RevinHi Performance app icon",
});

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
