import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Base64 images run ~33% larger than the source file; this caps the raw JSON body so a huge phone
// photo fails fast with a clear message instead of a slow upload that eventually gets rejected by
// the platform's own request-size limit. The mobile page downsizes photos client-side before
// sending, so this should rarely actually trigger.
const MAX_PAYLOAD_CHARS = 3_500_000;

/**
 * A phone (visiting /binscout) drops a job here. The corresponding BinScout desktop app, wherever
 * it's running, polls for it (see ../poll/route.ts), processes it locally against eBay, and posts
 * the result back (see ../result/route.ts). This route never talks to eBay itself - it's just a
 * mailbox row.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const kind = body?.kind;
  const payload = body?.payload;

  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }
  if (kind !== "search" && kind !== "image_search") {
    return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "missing_payload" }, { status: 400 });
  }
  if (JSON.stringify(payload).length > MAX_PAYLOAD_CHARS) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("binscout_jobs")
    .insert({ device_token: token, kind, payload })
    .select("id")
    .single();

  if (error) {
    console.error("BinScout job insert failed:", error);
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
