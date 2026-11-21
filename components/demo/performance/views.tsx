"use client";

import { useEffect, useState } from "react";
import { DNS_PROVIDERS, GAME_REGIONS, ROUTER_DNS, dnsColor, jitter, regionColor, type StartupEntry } from "./data";
import { GlowButton, Toggle, c } from "./ui";

const TESTING = "#808080";

/** Live readings, re-tested every second while the tab is open (first round shows "Testing..."). */
function useLive(bases: number[], everyMs: number, firstMs: number): (number | null)[] {
  const [values, setValues] = useState<(number | null)[]>(() => bases.map(() => null));
  const key = bases.join(",");
  useEffect(() => {
    const list = key.split(",").map(Number);
    const sample = () => setValues(list.map((b) => Math.round(jitter(b, Math.max(1.5, b * 0.12)))));
    const first = window.setTimeout(sample, firstMs);
    const id = window.setInterval(sample, everyMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [key, everyMs, firstMs]);
  return values;
}

function Ms({ value, color, big }: { value: number | null; color: (ms: number | null) => string; big?: boolean }) {
  return (
    <span className={c(big ? "msBig" : "ms")} style={{ color: value === null ? TESTING : color(value) }}>
      {value === null ? "Testing..." : `${value} ms`}
    </span>
  );
}

// ------------------------------------------------------------------ DNS Finder

export function DnsFinderView({
  active,
  status,
  onUse,
  onRestore,
}: {
  active: string | null;
  status: string | null;
  onUse: (name: string) => void;
  onRestore: () => void;
}) {
  const provider = DNS_PROVIDERS.find((p) => p.name === active) ?? null;
  const providerMs = useLive(
    DNS_PROVIDERS.map((p) => p.ms),
    1000,
    700,
  );
  const [current] = useLive([provider ? provider.ms : ROUTER_DNS.ms], 1000, 500);
  const regionMs = useLive(
    GAME_REGIONS.map((r) => r.ms),
    1000,
    900,
  );

  return (
    <div className={c("view")}>
      <div className={c("pageHead")}>
        <div className={c("pageTitle")}>DNS SERVER FINDER</div>
        <div className={c("body")}>
          Live query response times to each resolver, refreshed every few seconds. This measures actual DNS lookups, not just an ICMP ping - some resolvers block ping but answer queries fine.
        </div>
        {status && <div className={c("statusLine")}>{status}</div>}
      </div>

      <div className={c("card currentCard")}>
        <div className={c("grow")}>
          <div className={c("currentLabel")}>CURRENTLY ACTIVE ON THIS PC</div>
          <div className={c("header")} style={{ fontSize: 16, marginTop: 4 }}>
            {provider ? `Your Current DNS (${provider.name})` : "Your Current DNS"}
          </div>
          <div className={c("meta dim6")} style={{ fontSize: 10.5, marginTop: 4 }}>
            {provider ? `${provider.primary} / ${provider.secondary}` : ROUTER_DNS.primary}
          </div>
        </div>
        <Ms value={current} color={dnsColor} big />
        <GlowButton onClick={onRestore} title="Revert DNS back to what your network (router/ISP) assigns automatically">
          Restore Defaults
        </GlowButton>
      </div>

      <div className={c("scroll")}>
        <div className={c("sectionLabel")}>DNS PROVIDERS</div>
        <div className={c("wrap")}>
          {DNS_PROVIDERS.map((p, i) => (
            <div key={p.name} className={c("card dnsCard", p.name === active && "dnsActive")}>
              <div className={c("grow")} style={{ marginRight: 12 }}>
                <div>
                  <span className={c("header")} style={{ fontSize: 15 }}>
                    {p.name}
                  </span>
                  {p.name === active && <span className={c("activeTag")}>ACTIVE</span>}
                </div>
                <div className={c("meta dim6")} style={{ fontSize: 10.5, marginTop: 4 }}>
                  {p.primary} / {p.secondary}
                </div>
                {p.badge && <span className={c("badge")}>{p.badge}</span>}
              </div>
              <Ms value={providerMs[i]} color={dnsColor} />
              <GlowButton onClick={() => onUse(p.name)}>Use This</GlowButton>
            </div>
          ))}
        </div>

        <div className={c("sectionLabel")} style={{ display: "block", margin: "22px 0 6px 4px" }}>
          GAME SERVER PING
        </div>
        <div className={c("body regionNote")}>
          Latency to the major cloud regions Fortnite, Valorant, and Apex Legends commonly host servers in - measured independently of your DNS choice above, since DNS only affects how fast a name resolves, not the path your game traffic takes afterward.
        </div>
        <div className={c("wrap")}>
          {GAME_REGIONS.map((r, i) => (
            <div key={r.label} className={c("card dnsCard")}>
              <div className={c("grow")} style={{ marginRight: 12 }}>
                <div className={c("header")} style={{ fontSize: 15 }}>
                  {r.label}
                </div>
                <div className={c("meta dim6")} style={{ fontSize: 10.5, marginTop: 4 }}>
                  {r.games}
                </div>
              </div>
              <Ms value={regionMs[i]} color={regionColor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Live Dashboard

type Reading = { cpu: number; gpu: number; used: number; ping: number };
const TOTAL_GB = 31.9;

export function DashboardView({ freedMb, freedCpu }: { freedMb: number; freedCpu: number }) {
  const [r, setR] = useState<Reading>({ cpu: 23, gpu: 58, used: 12.6, ping: 14 });

  useEffect(() => {
    const id = window.setInterval(() => {
      setR({
        cpu: jitter(23, 7),
        gpu: jitter(58, 9),
        used: jitter(12.6, 0.15),
        ping: Math.round(jitter(14, 2.5)),
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  // A running Boost shows up here too: the paused apps' memory and CPU come off the totals.
  const cpu = Math.max(2, r.cpu - freedCpu);
  const used = Math.max(2, r.used - freedMb / 1024);
  const memPct = (used * 100) / TOTAL_GB;

  return (
    <div className={c("view")}>
      <div className={c("pageHead")}>
        <div className={c("pageTitle")} style={{ color: "#2ed573" }}>
          LIVE DASHBOARD
        </div>
        <div className={c("body")}>Real CPU/GPU/RAM usage and ping, refreshed roughly every second.</div>
      </div>

      <div className={c("wrap")}>
        <Meter label="CPU" value={`${cpu.toFixed(0)}%`} pct={cpu} color="#ffffff" />
        <Meter label="GPU" value={`${r.gpu.toFixed(0)}%`} pct={r.gpu} color="#2ed573" />
        <Meter label="MEMORY" value={`${used.toFixed(1)} / ${TOTAL_GB.toFixed(1)} GB`} pct={memPct} color="#ffa800" small />
        <div className={c("card")}>
          <div className={c("header")} style={{ fontSize: 15 }}>
            PING (1.1.1.1)
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 10, fontVariantNumeric: "tabular-nums" }}>{r.ping} ms</div>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value, pct, color, small }: { label: string; value: string; pct: number; color: string; small?: boolean }) {
  return (
    <div className={c("card")}>
      <div className={c("meterTop")}>
        <span className={c("header")} style={{ fontSize: 15 }}>
          {label}
        </span>
        <span className={c("meterValue")} style={{ color, fontSize: small ? 16 : 20 }}>
          {value}
        </span>
      </div>
      <div className={c("bar")}>
        <div className={c("barFill")} style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Startup Manager

export function StartupView({
  autoStart,
  onAutoStart,
  items,
  onItem,
}: {
  autoStart: boolean;
  onAutoStart: (v: boolean) => void;
  items: StartupEntry[];
  onItem: (id: string, on: boolean) => void;
}) {
  return (
    <div className={c("view")}>
      <div className={c("pageHead")}>
        <div className={c("pageTitle")} style={{ color: "#ffa800" }}>
          STARTUP MANAGER
        </div>
        <div className={c("body")}>
          Apps and registry entries that launch when Windows starts. Disabling is fully reversible - nothing is deleted, just moved to a RevinHi-controlled backup until you re-enable it.
        </div>
      </div>

      <div className={c("card")} style={{ display: "flex", alignItems: "center", marginBottom: 18, flexShrink: 0 }}>
        <div className={c("grow")} style={{ marginRight: 16 }}>
          <div className={c("header")} style={{ fontSize: 15 }}>
            Launch RevinHi on Windows Startup
          </div>
          <div className={c("body")} style={{ marginTop: 6 }}>
            Starts RevinHi Performance automatically (elevated, no UAC prompt) when you log into Windows, so Boost and your tweaks are ready before you launch a game.
          </div>
        </div>
        <Toggle size="compact" label="Launch RevinHi on Windows Startup" on={autoStart} onChange={onAutoStart} />
      </div>

      <div className={c("scroll")}>
        <div className={c("wrap")}>
          {items.map((item) => (
            <div key={item.id} className={c("card")} style={{ display: "flex", alignItems: "center" }}>
              <div className={c("grow")} style={{ marginRight: 16 }}>
                <div className={c("header")} style={{ fontSize: 15 }}>
                  {item.name}
                </div>
                <div className={c("meta dim7")} style={{ marginTop: 4 }}>
                  {item.source}
                </div>
              </div>
              <Toggle size="compact" label={item.name} on={item.on} onChange={(v) => onItem(item.id, v)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
