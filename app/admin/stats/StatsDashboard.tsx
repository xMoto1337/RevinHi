"use client";

import { useCallback, useEffect, useState } from "react";

type Stats = {
  product: string;
  downloads: { total: number; day: number; week: number; month: number };
  installs: { total: number; active1: number; active7: number; active30: number; proActive30: number; proTotal: number };
  sales: { total: number; week: number };
  daily: { date: string; n: number }[];
  countries: [string, number][];
  versions: [string, number][];
};

const PRODUCTS = [
  { slug: "desktop", label: "RevinHi Desktop" },
  { slug: "performance", label: "RevinHi Performance" },
];

// Same shared-secret gate as /admin/wallpapers (sessionStorage only, sent as a header).
export default function StatsDashboard() {
  const [secret, setSecret] = useState(() => (typeof window === "undefined" ? "" : sessionStorage.getItem("revinhi-admin-secret") ?? ""));
  const [authed, setAuthed] = useState(() => typeof window !== "undefined" && !!sessionStorage.getItem("revinhi-admin-secret"));
  const [product, setProduct] = useState("desktop");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/stats?product=${product}`, { headers: { "x-admin-secret": secret } });
    setLoading(false);
    if (res.status === 401) {
      sessionStorage.removeItem("revinhi-admin-secret");
      setAuthed(false);
      setError("Wrong secret.");
      return;
    }
    const json = await res.json();
    if (!res.ok) {
      setError(`Couldn't load stats: ${json.detail ?? json.error}. Did you run supabase/stats.sql?`);
      return;
    }
    setStats(json);
  }, [product, secret]);

  useEffect(() => {
    if (!authed) return;
    void load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [authed, load]);

  if (!authed) {
    return (
      <main className="mx-auto mt-24 w-full max-w-sm px-4">
        <form
          className="glass-panel flex flex-col gap-3 rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem("revinhi-admin-secret", secret);
            setAuthed(true);
          }}
        >
          <h1 className="text-lg font-bold">RevinHi stats</h1>
          <input
            type="password"
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 outline-none"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <button className="rounded-full bg-neon-cyan px-4 py-2 font-semibold text-black">Unlock</button>
          {error && <p className="text-sm text-neon-danger">{error}</p>}
        </form>
      </main>
    );
  }

  const max = Math.max(1, ...(stats?.daily.map((d) => d.n) ?? [1]));
  const conversion = stats && stats.downloads.total > 0 ? ((stats.sales.total / stats.downloads.total) * 100).toFixed(1) : "0.0";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Stats</h1>
        {PRODUCTS.map((p) => (
          <button
            key={p.slug}
            onClick={() => setProduct(p.slug)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${product === p.slug ? "border-neon-cyan bg-neon-cyan/15 text-neon-cyan" : "border-white/15 text-white/70"}`}
          >
            {p.label}
          </button>
        ))}
        <button onClick={() => void load()} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-neon-danger">{error}</p>}

      {stats && (
        <>
          <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Downloads" value={stats.downloads.total} sub={`${stats.downloads.day} today · ${stats.downloads.week} this week`} />
            <Tile label="Installs" value={stats.installs.total} sub="copies that have opened the app" />
            <Tile label="Active users" value={stats.installs.active7} sub={`${stats.installs.active1} today · ${stats.installs.active30} this month`} />
            <Tile label="Pro users" value={stats.installs.proActive30} sub={`active this month · ${stats.installs.proTotal} ever`} />
            <Tile label="Sales" value={stats.sales.total} sub={`${stats.sales.week} this week`} />
            <Tile label="Download → sale" value={`${conversion}%`} sub="sales / downloads" />
            <Tile label="Downloads (30 days)" value={stats.downloads.month} sub="" />
            <Tile label="Free → Pro" value={stats.installs.total ? `${((stats.installs.proTotal / stats.installs.total) * 100).toFixed(1)}%` : "0%"} sub="installs that went Pro" />
          </section>

          <section className="glass-panel-flat mt-6 rounded-2xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Downloads per day · last 30 days</h2>
            <div className="mt-4 flex h-40 items-end gap-1">
              {stats.daily.map((d) => (
                <div key={d.date} className="group relative flex-1">
                  <div className="rounded-t bg-neon-cyan/70 transition group-hover:bg-neon-cyan" style={{ height: `${(d.n / max) * 150 + (d.n ? 4 : 1)}px` }} />
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-xs group-hover:block">
                    {d.date.slice(5)}: {d.n}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-3 md:grid-cols-2">
            <List title="Top countries · downloads, 30 days" rows={stats.countries} />
            <List title="Versions in use · active, 30 days" rows={stats.versions} />
          </section>
          <p className="mt-6 text-xs text-white/40">
            Active = the app pinged in that window (it pings at launch and every 12 hours). Users who turn off usage stats in the
            app aren&apos;t counted, so active/Pro numbers are a floor. Refreshes every minute.
          </p>
        </>
      )}
    </main>
  );
}

function Tile({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="glass-panel-flat rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
    </div>
  );
}

function List({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="glass-panel-flat rounded-2xl p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/40">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {rows.map(([k, n]) => (
            <li key={k} className="flex justify-between">
              <span>{k}</span>
              <span className="font-semibold">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
