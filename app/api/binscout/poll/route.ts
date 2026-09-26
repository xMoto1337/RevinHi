import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Rows older than this get swept on every poll (both stale never-claimed jobs from a BinScout that
// wasn't running, and already-completed ones) - keeps the mailbox table small without a cron job,
// since the BinScout desktop app polls this route every couple seconds while it's open.
const STALE_AFTER_MINUTES = 10;

/**
 * The BinScout desktop app (wherever it's actually running) calls this every ~2-3 seconds asking
 * "anything for me?". Returns the oldest pending job for this device token, if any.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const staleCutoff = new Date(Date.now() - STALE_AFTER_MINUTES * 60_000).toISOString();
  await supabase.from("binscout_jobs").delete().lt("created_at", staleCutoff);

  const { data, error } = await supabase
    .from("binscout_jobs")
    .select("id, kind, payload")
    .eq("device_token", token)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("BinScout poll query failed:", error);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, job: data ?? null });
}
