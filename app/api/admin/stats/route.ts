import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/** Aggregates for /admin/stats. Gated by the same ADMIN_SECRET header as the wallpaper admin. */
export async function GET(request: NextRequest) {
  // Trimmed: a value pasted/piped into Vercel can carry a trailing newline.
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret || request.headers.get("x-admin-secret")?.trim() !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const product = request.nextUrl.searchParams.get("product") ?? "desktop";
  const db = getSupabaseAdmin();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

  const count = async (table: string, build: (q: ReturnType<ReturnType<typeof db.from>["select"]>) => unknown) => {
    const q = db.from(table).select("*", { count: "exact", head: true }).eq("product", product);
    const { count: n, error } = (await build(q)) as { count: number | null; error: unknown };
    if (error) throw error;
    return n ?? 0;
  };

  try {
    const [dlTotal, dl1, dl7, dl30, installs, active1, active7, active30, proActive30, proTotal, salesTotal, sales7] = await Promise.all([
      count("downloads", (q) => q),
      count("downloads", (q) => q.gte("created_at", ago(1))),
      count("downloads", (q) => q.gte("created_at", ago(7))),
      count("downloads", (q) => q.gte("created_at", ago(30))),
      count("installs", (q) => q),
      count("installs", (q) => q.gte("last_seen", ago(1))),
      count("installs", (q) => q.gte("last_seen", ago(7))),
      count("installs", (q) => q.gte("last_seen", ago(30))),
      count("installs", (q) => q.eq("tier", "pro").gte("last_seen", ago(30))),
      count("installs", (q) => q.eq("tier", "pro")),
      count("sales", (q) => q.eq("refunded", false)),
      count("sales", (q) => q.eq("refunded", false).gte("created_at", ago(7))),
    ]);

    // Daily downloads + top countries over 30 days, and versions in use.
    const [{ data: recent }, { data: active }] = await Promise.all([
      db.from("downloads").select("created_at, country").eq("product", product).gte("created_at", ago(30)).limit(50000),
      db.from("installs").select("version").eq("product", product).gte("last_seen", ago(30)).limit(50000),
    ]);
    const daily: Record<string, number> = {};
    for (let d = 29; d >= 0; d--) daily[ago(d).slice(0, 10)] = 0;
    const countries: Record<string, number> = {};
    for (const r of recent ?? []) {
      const day = String(r.created_at).slice(0, 10);
      if (day in daily) daily[day]++;
      const c = r.country || "??";
      countries[c] = (countries[c] ?? 0) + 1;
    }
    const versions: Record<string, number> = {};
    for (const r of active ?? []) versions[r.version || "?"] = (versions[r.version || "?"] ?? 0) + 1;

    return NextResponse.json({
      product,
      downloads: { total: dlTotal, day: dl1, week: dl7, month: dl30 },
      installs: { total: installs, active1, active7, active30, proActive30, proTotal },
      sales: { total: salesTotal, week: sales7 },
      daily: Object.entries(daily).map(([date, n]) => ({ date, n })),
      countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 8),
      versions: Object.entries(versions).sort((a, b) => b[1] - a[1]),
    });
  } catch (e) {
    console.error("stats failed", e);
    return NextResponse.json({ error: "stats_failed", detail: String((e as { message?: string })?.message ?? e) }, { status: 500 });
  }
}
