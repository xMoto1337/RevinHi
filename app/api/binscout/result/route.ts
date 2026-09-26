import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST: the BinScout desktop app posts a finished job's result back here.
 * GET: the phone polls here (every ~1s) waiting for that result to show up.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const id = typeof body?.id === "string" ? body.id : "";
  if (!token || !id) {
    return NextResponse.json({ ok: false, error: "missing_token_or_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("binscout_jobs")
    .update({
      status: "done",
      result: body.result ?? null,
      error: typeof body.error === "string" ? body.error : null,
      completed_at: new Date().toISOString(),
    })
    // device_token match is what stops a stranger who guessed a job id from overwriting someone
    // else's result - they'd need that install's own token too.
    .eq("id", id)
    .eq("device_token", token);

  if (error) {
    console.error("BinScout result update failed:", error);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const id = request.nextUrl.searchParams.get("id");
  if (!token || !id) {
    return NextResponse.json({ ok: false, error: "missing_token_or_id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("binscout_jobs")
    .select("status, result, error")
    .eq("id", id)
    .eq("device_token", token)
    .maybeSingle();

  if (error) {
    console.error("BinScout result query failed:", error);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: data.status, result: data.result, error: data.error });
}
