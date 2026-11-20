"use client";

import dynamic from "next/dynamic";

// revinhi.com/admin = the stats dashboard. Browser-only: it reads the admin secret from sessionStorage.
const StatsDashboard = dynamic(() => import("./stats/StatsDashboard"), { ssr: false });

export default function AdminPage() {
  return <StatsDashboard />;
}
