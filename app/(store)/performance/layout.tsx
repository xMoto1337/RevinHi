import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Windows Game Optimizer for More FPS | RevinHi Performance",
  description:
    "A safe Windows 10/11 game optimizer: reversible tweaks that cut input lag and boost FPS, a DNS speed finder and one-button undo. $9.99 once.",
  path: "/performance",
  image: "/brand/revinhi-perf.png",
  imageAlt: "RevinHi Performance app icon",
});

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
