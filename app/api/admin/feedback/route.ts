import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/** Feedback list for /admin/feedback. Gated by the same ADMIN_SECRET header as the other admin pages. */
function authed(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET?.trim();
  return !!secret && request.headers.get("x-admin-secret")?.trim() === secret;
}

export async function GET(request: NextRequest) {
  if (!authed(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  if (!authed(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string" || !["new", "done"].includes(body.status)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from("feedback").update({ status: body.status }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
