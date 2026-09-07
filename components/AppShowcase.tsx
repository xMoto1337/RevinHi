"use client";

import { useState, type ReactNode } from "react";

type TabId = "boost" | "dns" | "dashboard" | "startup";

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "boost", label: "Boost & Tweaks", short: "Boost" },
  { id: "dns", label: "DNS Finder", short: "DNS" },
  { id: "dashboard", label: "Dashboard", short: "Stats" },
  { id: "startup", label: "Startup", short: "Startup" },
];

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition ${on ? "bg-neon-success/80" : "bg-white/15"}`}>
      <div className={`h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`} />
    </div>
  );
}

function BoostPanel() {
  // The complete real 16-tweak catalog (not counting "Launch on Startup", which lives in its own
  // Startup Manager tab in the real app, matching this showcase's separate Startup tab).
  const tweaks = [
    { name: "Windows Game Mode", tier: "Safe", on: true },
    { name: "High Performance Power Plan", tier: "Safe", on: true },
    { name: "Disable Game Bar / Game DVR", tier: "Safe", on: true },
    { name: "Disable Fullscreen Optimizations", tier: "Safe", on: true },
    { name: "Disable USB Selective Suspend", tier: "Safe", on: true },
    { name: "1ms Timer Resolution", tier: "Safe", on: true },
    { name: "NVIDIA Ultra Low Latency Mode", tier: "Safe", on: false },
    { name: "Hardware-Accelerated GPU Scheduling", tier: "Advanced", on: true },
    { name: "Disable Nagle's Algorithm", tier: "Advanced", on: false },
    { name: "Disable Delayed TCP ACKs", tier: "Advanced", on: false },
    { name: "Zero System Responsiveness Reservation", tier: "Advanced", on: false },
    { name: "Disable QoS Reserved Bandwidth", tier: "Advanced", on: true },
    { name: "Disable Network Throttling", tier: "Advanced", on: true },
    { name: "Fast DNS (Cloudflare)", tier: "Advanced", on: false },
    { name: "Enable MSI Mode for GPU/Network Interrupts", tier: "Advanced", on: false },
    { name: "Disable Core Isolation (Memory Integrity)", tier: "Advanced", on: false },
  ];

  return (
    <div className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
      {tweaks.map((tweak) => (
        <div key={tweak.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="min-w-0 pr-3">
            <p className="truncate text-sm font-medium text-white/90">{tweak.name}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                tweak.tier === "Safe" ? "bg-neon-success/15 text-neon-success" : "bg-neon-amber/15 text-neon-amber"
              }`}
            >
              {tweak.tier}
            </span>
          </div>
          <Toggle on={tweak.on} />
        </div>
      ))}
    </div>
  );
}

function DnsPanel() {
  const providers = [
    { name: "Your Current DNS", ms: 42, tone: "amber" as const },
    { name: "Cloudflare", ms: 11, tone: "green" as const },
    { name: "AdGuard", ms: 14, tone: "green" as const, badge: "Ad-Blocking" },
    { name: "Google", ms: 19, tone: "green" as const },
  ];
  const toneColor = { green: "bg-neon-success", amber: "bg-neon-amber", red: "bg-neon-danger" };

  return (
    <div className="space-y-2.5">
      {providers.map((p) => (
        <div key={p.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${toneColor[p.tone]}`} />
            <span className="truncate text-sm font-medium text-white/90">{p.name}</span>
            {p.badge && (
              <span className="hidden shrink-0 rounded-full bg-neon-cyan/15 px-2 py-0.5 text-[10px] font-semibold text-neon-cyan sm:inline-block">
                {p.badge}
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-sm text-white/60">{p.ms}ms</span>
        </div>
      ))}
    </div>
  );
}

function DashboardPanel() {
  const stats = [
    { label: "CPU", value: "23%", accent: "var(--neon-cyan)" },
    { label: "GPU", value: "61%", accent: "var(--neon-success)" },
    { label: "RAM", value: "48%", accent: "var(--neon-amber)" },
    { label: "Ping", value: "14ms", accent: "var(--neon-purple)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{s.label}</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: s.accent }}>{s.value}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: s.label === "Ping" ? "20%" : s.value, background: s.accent }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StartupPanel() {
  const items = [
    { name: "Discord", impact: "Medium", on: true },
    { name: "Spotify", impact: "Low", on: true },
    { name: "Steam", impact: "High", on: false },
    { name: "OneDrive", impact: "Low", on: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="min-w-0 pr-3">
            <p className="truncate text-sm font-medium text-white/90">{item.name}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{item.impact} startup impact</p>
          </div>
          <Toggle on={item.on} />
        </div>
      ))}
    </div>
  );
}

const PANELS: Record<TabId, ReactNode> = {
  boost: <BoostPanel />,
  dns: <DnsPanel />,
  dashboard: <DashboardPanel />,
  startup: <StartupPanel />,
};

export function AppShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("boost");

  return (
    <div className="glass-panel rounded-2xl p-3 shadow-[0_0_80px_rgba(0,229,255,0.08)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-2 pb-3 sm:px-3">
        <div className="hidden gap-1.5 sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
        <span className="text-[11px] font-bold tracking-wide text-white/40 sm:ml-2">REVINHI PERFORMANCE</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-neon-success/50 bg-white/5 px-2 py-0.5 text-[10px] text-white/60 sm:px-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-success" />
          <span className="hidden sm:inline">Administrator</span>
          <span className="sm:hidden">Admin</span>
        </span>
      </div>

      {/* Click a tab to see that part of the app - real tab labels/order match the actual UI. */}
      <div className="flex gap-1 overflow-x-auto px-2 pt-3 pb-1 sm:px-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-4">{PANELS[activeTab]}</div>
    </div>
  );
}
