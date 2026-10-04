import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSecret = process.env.ADMIN_SECRET?.trim();
  const provided = request.headers.get("x-admin-secret")?.trim();
  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("wallpapers")
    .update({ status: action === "approve" ? "approved" : "rejected" })
    .eq("id", id);

  if (error) {
    console.error("Wallpaper moderation update failed:", error);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
