"use client";

import dynamic from "next/dynamic";

// Browser-only: the dashboard reads the admin secret from sessionStorage on first render.
const StatsDashboard = dynamic(() => import("./StatsDashboard"), { ssr: false });

export default function AdminStatsPage() {
  return <StatsDashboard />;
}
