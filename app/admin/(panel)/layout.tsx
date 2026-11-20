import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { AdminShell } from "./AdminShell";

// Every admin page except /admin/login sits in this group: no valid login cookie = sent to the login page.
// (The /api/admin/* routes check the same cookie themselves, so data stays locked even without this.)
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminSession())) redirect("/admin/login");

  let newFeedback = 0;
  try {
    const { count } = await getSupabaseAdmin().from("feedback").select("id", { count: "exact", head: true }).eq("status", "new");
    newFeedback = count ?? 0;
  } catch {
    // Badge is a nice-to-have; never block the panel on it.
  }

  return <AdminShell newFeedback={newFeedback}>{children}</AdminShell>;
}
