import { isAdminRequest } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/** Feedback list for /admin/feedback. Needs the admin login cookie. */


export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseAdmin()
    .from("feedback")
    .select("id, app, kind, message, email, page, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

/** Body: { id, status: "new" | "done" } */
export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string" || !["new", "done"].includes(body.status)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from("feedback").update({ status: body.status }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
