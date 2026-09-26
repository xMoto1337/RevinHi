import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BinScout Mobile",
  description: "Search real eBay sold prices, or identify an item by photo.",
};

export default function BinScoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
