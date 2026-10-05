"use client";

import { useCallback, useEffect, useState } from "react";

type Row = [string, number];
type Traffic = {
  days: number;
  totals: {
    views: number;
    visitors: number;
    viewsToday: number;
    visitorsToday: number;
    viewsWeek: number;
    visitorsWeek: number;
    pagesPerVisit: number;
    liveNow: number;
    livePages: Row[];
  };
  daily: { date: string; views: number; visitors: number }[];
  hourlyUtc: number[];
  pages: Row[];
  sources: Row[];
  referrers: Row[];
  campaigns: Row[];
  countries: Row[];
  devices: Row[];
  browsers: Row[];
  oses: Row[];
  funnel: { step: string; n: number }[];
  clicks: Row[];
  revenue: { cents: number; sales: number; refunds: number; weekCents: number };
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function WebsiteStats({ secret, onUnauthorized }: { secret: string; onUnauthorized: () => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Traffic | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/traffic?days=${days}`, { headers: { "x-admin-secret": secret } });
    setLoading(false);
    if (res.status === 401) return onUnauthorized();
    const json = await res.json();
    if (!res.ok) {
      setError(`Couldn't load website stats: ${json.detail ?? json.error}. Did you run supabase/analytics.sql?`);
      return;
    }
    setData(json);
  }, [days, secret, onUnauthorized]);

  useEffect(() => {
    void load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.views) ?? [1]));
  // Hourly chart in the viewer's local time (rows are bucketed by UTC hour).
  const offsetH = -new Date().getTimezoneOffset() / 60;
  const hourly = data ? Array.from({ length: 24 }, (_, h) => data.hourlyUtc[(((h - offsetH) % 24) + 24) % 24] ?? 0) : [];
  const maxHourly = Math.max(1, ...hourly);
  const top = data?.funnel[0]?.n || 0;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${days === d ? "border-neon-cyan bg-neon-cyan/15 text-neon-cyan" : "border-white/15 text-white/60"}`}
          >
            {d} days
          </button>
        ))}
        <span className="ml-auto text-xs text-white/40">{loading ? "Refreshing..." : "Auto-refreshes every 30s"}</span>
      </div>
      {error && <p className="mt-4 text-sm text-neon-danger">{error}</p>}

      {data && (
        <>
          <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="On the site now" value={data.totals.liveNow} sub={data.totals.livePages.map(([p, n]) => `${p} (${n})`).join(" · ") || "last 5 minutes"} live />
            <Tile label="Visitors today" value={data.totals.visitorsToday} sub={`${data.totals.viewsToday} page views`} />
            <Tile label="Visitors this week" value={data.totals.visitorsWeek} sub={`${data.totals.viewsWeek} page views`} />
            <Tile label={`Visitors · ${data.days} days`} value={data.totals.visitors} sub={`${data.totals.views} views · ${data.totals.pagesPerVisit} pages/visit`} />
            <Tile label="Revenue" value={money(data.revenue.cents)} sub={`${data.revenue.sales} sales · ${data.revenue.refunds} refunded`} />
            <Tile label="Revenue this week" value={money(data.revenue.weekCents)} sub="" />
            <Tile label="Visitor → sale" value={top ? `${((data.funnel[4].n / top) * 100).toFixed(1)}%` : "0%"} sub="of visitors bought Pro" />
            <Tile label="Download clicks" value={data.funnel[2].n} sub={top ? `${((data.funnel[2].n / top) * 100).toFixed(1)}% of visitors` : ""} />
          </section>

          <section className="glass-panel-flat mt-6 rounded-2xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Visitors per day</h2>
            <div className="mt-4 flex h-44 items-end gap-[3px]">
              {data.daily.map((d) => (
                <div key={d.date} className="group relative flex flex-1 flex-col justify-end">
                  <div className="rounded-t bg-neon-purple/40" style={{ height: `${(d.views / maxDaily) * 160}px` }}>
                    <div className="h-full rounded-t bg-neon-cyan/80" style={{ height: `${d.views ? (d.visitors / d.views) * 100 : 0}%`, marginTop: "auto" }} />
                  </div>
                  <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-2 py-0.5 text-xs group-hover:block">
                    {d.date.slice(5)}: {d.visitors} visitors · {d.views} views
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/40">Cyan = visitors, purple = extra page views. Hover a bar for numbers.</p>
          </section>

          <section className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="glass-panel-flat rounded-2xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Sales funnel</h2>
              <div className="mt-4 space-y-2.5">
                {data.funnel.map((f, i) => {
                  const pct = top ? (f.n / top) * 100 : 0;
                  const prev = i > 0 ? data.funnel[i - 1].n : 0;
                  return (
                    <div key={f.step}>
                      <div className="flex justify-between text-sm">
                        <span>{f.step}</span>
                        <span className="font-semibold">
                          {f.n}
                          {i > 0 && prev > 0 && <span className="ml-2 text-xs text-white/45">{((f.n / prev) * 100).toFixed(0)}% of previous</span>}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-white/10">
                        <div className="h-2 rounded bg-gradient-to-r from-neon-cyan to-neon-purple" style={{ width: `${Math.max(pct, f.n ? 2 : 0)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-white/40">Each step counts people (per day), so you can see exactly where they drop off.</p>
            </div>
            <div className="glass-panel-flat rounded-2xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Today by hour (your time)</h2>
              <div className="mt-4 flex h-40 items-end gap-[3px]">
                {hourly.map((n, h) => (
                  <div key={h} className="group relative flex-1">
                    <div className="rounded-t bg-neon-success/70" style={{ height: `${(n / maxHourly) * 140 + (n ? 3 : 1)}px` }} />
                    <span className="pointer-events-none absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-2 py-0.5 text-xs group-hover:block">
                      {h}:00 · {n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-white/40">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>11pm</span>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-3 md:grid-cols-3">
            <List title="Where visitors come from" rows={data.sources} />
            <List title="Top pages" rows={data.pages} />
            <List title="Countries" rows={data.countries} />
            <List title="Devices" rows={data.devices} />
            <List title="Browsers & apps" rows={data.browsers} />
            <List title="Operating systems" rows={data.oses} />
            <List title="Referring sites" rows={data.referrers} />
            <List title="Campaigns (UTM links)" rows={data.campaigns} empty="Add ?utm_source=tiktok to your bio link to see it here." />
            <List title="Clicks" rows={data.clicks.map(([k, n]) => [k === "buy_click" ? "Get Pro (checkout)" : k === "download_click" ? "Download" : "Outbound links", n] as Row)} />
          </section>
          <p className="mt-6 text-xs text-white/40">
            Privacy-friendly: no cookies, no IPs stored. A visitor is counted once per day. Bots and your own /admin visits are
            ignored. Windows visitors can actually install the app; mobile visitors are mostly coming from TikTok/Instagram.
          </p>
        </>
      )}
    </>
  );
}

function Tile({ label, value, sub, live }: { label: string; value: number | string; sub: string; live?: boolean }) {
  return (
    <div className="glass-panel-flat rounded-2xl p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
        {live && <span className="pulse-dot h-2 w-2 rounded-full bg-neon-success" />}
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-white/50">{sub}</p>}
    </div>
  );
}

function List({ title, rows, empty }: { title: string; rows: Row[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="glass-panel-flat rounded-2xl p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/40">{empty ?? "No data yet."}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {rows.map(([k, n]) => (
            <li key={k} className="relative overflow-hidden rounded px-2 py-0.5">
              <span className="absolute inset-y-0 left-0 bg-white/[0.06]" style={{ width: `${(n / max) * 100}%` }} />
              <span className="relative flex justify-between gap-3">
                <span className="truncate">{k}</span>
                <span className="font-semibold">{n}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
