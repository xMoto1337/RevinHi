import { redirect } from "next/navigation";

// Old address - the dashboard now lives at /admin.
export default function AdminStatsRedirect() {
  redirect("/admin");
}
