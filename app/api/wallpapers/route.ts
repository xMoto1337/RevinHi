import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, WALLPAPERS_BUCKET } from "@/lib/supabase";

const PAGE_SIZE = 24;
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour - plenty for a browse session or a download

/**
 * Browse endpoint. Defaults to approved-only (what the marketplace UI/app shows everyone);
 * ?status=pending requires the admin secret, used by the admin moderation page.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? "approved";
  const page = Math.max(1, Number(params.get("page") ?? "1"));

  if (status !== "approved") {
    const adminSecret = process.env.ADMIN_SECRET?.trim();
    const provided = request.headers.get("x-admin-secret")?.trim();
    if (!adminSecret || provided !== adminSecret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabaseAdmin();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("wallpapers")
    .select("id, title, type, storage_path, tags, source, source_attribution, status, created_at", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Wallpaper list query failed:", error);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  }

  const items = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(WALLPAPERS_BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);

      return {
        id: row.id,
        title: row.title,
        type: row.type,
        tags: row.tags,
        source: row.source,
        sourceAttribution: row.source_attribution,
        status: row.status,
        createdAt: row.created_at,
        url: signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ ok: true, items, page, pageSize: PAGE_SIZE, total: count ?? 0 });
}
