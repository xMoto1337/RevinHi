"use client";

import { useCallback, useEffect, useState } from "react";
import { WebsiteStats } from "./WebsiteStats";

type Stats = {
  product: string;
  downloads: { total: number; day: number; week: number; month: number };
  installs: { total: number; active1: number; active7: number; active30: number; proActive30: number; proTotal: number };
  sales: { total: number; week: number };
  daily: { date: string; n: number }[];
  countries: [string, number][];
  versions: [string, number][];
  /** RevinHi Drivers only: chips scans found no driver for (/api/coverage). */
  coverage?: Coverage[];
};

type Coverage = { device: string; reports: number; firstSeen: string; lastSeen: string };

const PRODUCTS = [
  { slug: "website", label: "Website" },
  { slug: "desktop", label: "RevinHi Desktop" },
  { slug: "performance", label: "RevinHi Performance" },
  { slug: "pdf", label: "RevinHi PDF" },
  { slug: "3d", label: "RevinHi 3D" },
  { slug: "recovery", label: "RevinHi Recovery" },
  { slug: "drivers", label: "RevinHi Drivers" },
];

const toLogin = () => {
  window.location.href = "/admin/login";
};

// Login is checked by the (panel) layout and the API routes (admin cookie).
export default function StatsDashboard() {
  const [product, setProduct] = useState("website");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (product === "website") return; // WebsiteStats loads its own data
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/stats?product=${product}`);
    setLoading(false);
    if (res.status === 401) return toLogin();
    const json = await res.json();
    if (!res.ok) {
      setError(`Couldn't load stats: ${json.detail ?? json.error}. Did you run supabase/stats.sql?`);
      return;
    }
    setStats(json);
  }, [product]);

  useEffect(() => {
    void load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const max = Math.max(1, ...(stats?.daily.map((d) => d.n) ?? [1]));
  const conversion = stats && stats.downloads.total > 0 ? ((stats.sales.total / stats.downloads.total) * 100).toFixed(1) : "0.0";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
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
        {product !== "website" && (
        <button onClick={() => void load()} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70">
          {loading ? "Loading..." : "Refresh"}
        </button>
        )}
      </div>
      {product === "website" && (
        <WebsiteStats
          onUnauthorized={toLogin}
        />
      )}
      {error && <p className="mt-4 text-sm text-neon-danger">{error}</p>}

      {stats && product !== "website" && (
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
          {stats.coverage && <MissingCoverage rows={stats.coverage} />}
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

// Chip makers by PCI / USB vendor number, so the table reads at a glance.
const VENDORS: Record<string, string> = {
  "8086": "Intel",
  "8087": "Intel",
  "10ec": "Realtek",
  "0bda": "Realtek",
  "1022": "AMD",
  "1002": "AMD",
  "10de": "NVIDIA",
  "14c3": "MediaTek",
  "0e8d": "MediaTek",
  "14e4": "Broadcom",
  "0a5c": "Broadcom",
  "168c": "Qualcomm",
  "17cb": "Qualcomm",
  "0cf3": "Qualcomm",
  "1969": "Qualcomm (Killer)",
  "1b21": "ASMedia",
  "1106": "VIA",
  "2109": "VIA Labs",
  "10b5": "Broadcom (PLX)",
  "1217": "O2 Micro",
  "1180": "Ricoh",
  "1912": "Renesas",
  "13fe": "Advantech",
  "1d6a": "Aquantia / Marvell",
  "11ab": "Marvell",
  "15b7": "Western Digital",
  "144d": "Samsung",
  "1987": "Phison",
  "8564": "Transcend",
  "046d": "Logitech",
  "045e": "Microsoft",
  "05ac": "Apple",
  "03f0": "HP",
  "17ef": "Lenovo",
  "413c": "Dell",
  "1532": "Razer",
  "1038": "SteelSeries",
  "0951": "Kingston (HyperX)",
};

/** "pci:8086:02f0" -> what it is and where to look it up. */
function describe(device: string) {
  const [bus, vendor, id] = device.split(":");
  // ACPI IDs: the maker's 3-4 letter code, then the part number ("AMDI0010").
  if (bus === "acpi") {
    const code = vendor.slice(0, vendor.length - 4);
    const maker = ({ AMDI: "AMD", AMD: "AMD", INT: "Intel", INTC: "Intel", ELAN: "Elan", SYNA: "Synaptics", MSFT: "Microsoft", QCOM: "Qualcomm" } as Record<string, string>)[code] ?? code;
    return { maker, label: `ACPI ${vendor}`, link: null };
  }
  const maker = VENDORS[vendor] ?? `vendor ${vendor.toUpperCase()}`;
  const label = `${bus.toUpperCase()} ${vendor.toUpperCase()}:${id.toUpperCase()}`;
  const link = bus === "pci" || bus === "usb" ? `https://devicehunt.com/view/type/${bus}/vendor/${vendor.toUpperCase()}/device/${id.toUpperCase()}` : null;
  return { maker, label, link };
}

function MissingCoverage({ rows }: { rows: Coverage[] }) {
  return (
    <section className="glass-panel-flat mt-6 rounded-2xl p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Missing coverage · devices with no driver found</h2>
      <p className="mt-1 text-xs text-white/40">
        Chips that scans found no driver for in any source, most reported first. Each copy of the app reports a chip at most once a
        month, so the count is roughly how many PCs needed it. Add the top ones with <code>node catalog/add.mjs &lt;vendor download link&gt;</code>{" "}
        in revinhi-drivers.
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/40">No data yet.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-white/40">
              <th className="py-1 font-semibold">Device</th>
              <th className="py-1 font-semibold">Maker</th>
              <th className="py-1 text-right font-semibold">PCs</th>
              <th className="py-1 text-right font-semibold">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = describe(r.device);
              return (
                <tr key={r.device} className="border-t border-white/5">
                  <td className="py-1.5 font-mono">
                    {d.link ? (
                      <a className="underline decoration-white/20 hover:decoration-neon-cyan" href={d.link} target="_blank" rel="noreferrer">
                        {d.label}
                      </a>
                    ) : (
                      d.label
                    )}
                  </td>
                  <td className="py-1.5">{d.maker}</td>
                  <td className="py-1.5 text-right font-semibold">{r.reports}</td>
                  <td className="py-1.5 text-right text-white/60">{r.lastSeen.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
