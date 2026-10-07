import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { UTM_NAMES } from "@/lib/trackingLinks";

/** Website analytics for /admin: traffic, sources, devices, live visitors and the sales funnel. */
export async function GET(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret || request.headers.get("x-admin-secret")?.trim() !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get("days")) || 30));
  const db = getSupabaseAdmin();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  try {
    const [views, events, sales, live] = await Promise.all([
      db.from("pageviews").select("created_at,path,referrer_host,utm_source,utm_medium,utm_campaign,country,device,browser,os,visitor").gte("created_at", since).order("created_at", { ascending: true }).limit(100000),
      db.from("site_events").select("created_at,name,path,label,visitor").gte("created_at", since).limit(100000),
      db.from("sales").select("created_at,product,price_cents,refunded").gte("created_at", since).limit(100000),
      db.from("pageviews").select("visitor,path").gte("created_at", new Date(Date.now() - 5 * 60000).toISOString()).limit(5000),
    ]);
    for (const r of [views, events, sales, live]) if (r.error) throw r.error;
    const pv = views.data ?? [];
    const ev = events.data ?? [];
    const sl = sales.data ?? [];

    const tally = <T,>(rows: T[], key: (r: T) => string | null | undefined, top = 10) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const k = key(r) || "(none)";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
    };
    // Visitor ids rotate daily, so "unique" = distinct visitor per day, summed.
    const uniq = (rows: { created_at: string; visitor: string }[]) => new Set(rows.map((r) => `${r.created_at.slice(0, 10)}|${r.visitor}`)).size;

    const daily: { date: string; views: number; visitors: number }[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
      const rows = pv.filter((r) => r.created_at.startsWith(date));
      daily.push({ date, views: rows.length, visitors: new Set(rows.map((r) => r.visitor)).size });
    }
    const today = pv.filter((r) => r.created_at >= dayStart.toISOString());
    const hourly = Array.from({ length: 24 }, (_, h) => today.filter((r) => new Date(r.created_at).getUTCHours() === h).length);
    const week = pv.filter((r) => r.created_at >= new Date(Date.now() - 7 * 86400000).toISOString());

    // Referrer -> friendly source name.
    const source = (r: { referrer_host: string | null; utm_source: string | null }) => {
      // Tracking links (admin "Tracking links" card) merge with the same platform's referrer traffic.
      if (r.utm_source) return UTM_NAMES[r.utm_source.toLowerCase()] ?? r.utm_source.toLowerCase();
      const h = r.referrer_host ?? "";
      if (!h) return "Direct / bio link";
      if (/tiktok/.test(h)) return "TikTok";
      if (/instagram/.test(h)) return "Instagram";
      if (/youtube|youtu\.be/.test(h)) return "YouTube";
      if (/google\./.test(h)) return "Google";
      if (/bing\./.test(h)) return "Bing";
      if (/reddit/.test(h)) return "Reddit";
      if (/facebook|fb\./.test(h)) return "Facebook";
      if (/t\.co|twitter|x\.com/.test(h)) return "X / Twitter";
      if (/gumroad/.test(h)) return "Gumroad";
      return h;
    };

    // Funnel (distinct visitor-days at each step).
    const vd = (rows: { created_at: string; visitor: string }[]) => new Set(rows.map((r) => `${r.created_at.slice(0, 10)}|${r.visitor}`));
    const allVisitors = vd(pv);
    const desktopVisitors = vd(pv.filter((r) => r.path.startsWith("/desktop")));
    const downloaders = vd(ev.filter((e) => e.name === "download_click"));
    const buyers = vd(ev.filter((e) => e.name === "buy_click"));
    const paid = sl.filter((s) => !s.refunded);

    return NextResponse.json({
      days,
      totals: {
        views: pv.length,
        visitors: uniq(pv),
        viewsToday: today.length,
        visitorsToday: new Set(today.map((r) => r.visitor)).size,
        viewsWeek: week.length,
        visitorsWeek: uniq(week),
        pagesPerVisit: pv.length ? +(pv.length / Math.max(1, uniq(pv))).toFixed(2) : 0,
        liveNow: new Set((live.data ?? []).map((r) => r.visitor)).size,
        livePages: tally(live.data ?? [], (r) => r.path, 5),
      },
      daily,
      hourlyUtc: hourly,
      pages: tally(pv, (r) => r.path),
      sources: tally(pv, source),
      referrers: tally(pv.filter((r) => r.referrer_host), (r) => r.referrer_host),
      campaigns: tally(pv.filter((r) => r.utm_campaign || r.utm_source), (r) => [r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(" / ")),
      countries: tally(pv, (r) => r.country),
      devices: tally(pv, (r) => r.device),
      browsers: tally(pv, (r) => r.browser),
      oses: tally(pv, (r) => r.os),
      funnel: [
        { step: "Visited the site", n: allVisitors.size },
        { step: "Viewed the Desktop page", n: desktopVisitors.size },
        { step: "Clicked Download", n: downloaders.size },
        { step: "Opened Pro checkout", n: buyers.size },
        { step: "Bought Pro", n: paid.filter((s) => s.product === "desktop").length },
      ],
      clicks: tally(ev, (e) => e.name),
      revenue: {
        cents: paid.reduce((s, r) => s + (r.price_cents ?? 0), 0),
        sales: paid.length,
        refunds: sl.filter((s) => s.refunded).length,
        weekCents: paid.filter((s) => s.created_at >= new Date(Date.now() - 7 * 86400000).toISOString()).reduce((s, r) => s + (r.price_cents ?? 0), 0),
      },
    });
  } catch (e) {
    console.error("traffic failed", e);
    return NextResponse.json({ error: "traffic_failed", detail: String((e as { message?: string })?.message ?? e) }, { status: 500 });
  }
}
