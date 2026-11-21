"use client";

import { useEffect, useRef, useState } from "react";
import { getProduct } from "@/lib/products";
import { AppWindow, useDemo } from "./AppWindow";
import { BoostPreviewDialog, BoostTweaksView, type BoostState } from "./performance/boost";
import { ALREADY_SET_TEXT, REBOOT_TEXT, RESTORE_ITEM_COUNT, STARTUP_ITEMS, TWEAKS, type BoostApp, type Tweak } from "./performance/data";
import { InstructionsDialog, c } from "./performance/ui";
import { DashboardView, DnsFinderView, StartupView } from "./performance/views";

/**
 * "Try the app" preview of RevinHi Performance: the real WPF app's four tabs rebuilt from its own
 * XAML (revinhi-performance/src/RevinHi.App), with sample readings. Toggles, Boost, DNS tests and
 * the dashboard all run on fake data; anything that would change the PC only shows a note.
 */

type Tab = "boost" | "dns" | "dashboard" | "startup";

const TABS: { id: Tab; label: string }[] = [
  { id: "boost", label: "BOOST & TWEAKS" },
  { id: "dns", label: "DNS FINDER" },
  { id: "dashboard", label: "DASHBOARD" },
  { id: "startup", label: "STARTUP" },
];

const PRODUCT = getProduct("performance");

type Instructions = { title: string; subtitle?: string; text: string };

function PerformanceApp() {
  const { notify } = useDemo();
  const [tab, setTab] = useState<Tab>("boost");

  // ---------------------------------------------------------------- tweaks
  const [advanced, setAdvanced] = useState(false);
  const [applied, setApplied] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TWEAKS.map((t) => [t.id, !!t.preset])),
  );
  const [busy, setBusy] = useState<Record<string, boolean | undefined>>({});
  const [tweakStatus, setTweakStatus] = useState<Record<string, string | undefined>>({});
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);

  // DNS is shared between the DNS Finder tab and the "Fast DNS (Cloudflare)" tweak, as in the app.
  const [dns, setDns] = useState<string | null>(null);
  const [dnsStatus, setDnsStatus] = useState<string | null>(null);

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const isApplied = (t: Tweak) => (t.id === "dns" ? dns === "Cloudflare" : !!applied[t.id]);

  const onTweak = (t: Tweak, next: boolean) => {
    if (busy[t.id] !== undefined) return;
    setBusy((b) => ({ ...b, [t.id]: next }));
    // Advanced tweaks make a Windows restore point first, so they take a moment longer.
    const wait = next && t.tier === "Advanced" ? 1100 : 380;
    if (next) {
      notify(
        t.instructions
          ? "In the app, this marks the step done and shows you where to set it."
          : t.tier === "Advanced"
            ? "In the app, this makes a Windows restore point first, then applies the tweak."
            : "In the app, this applies the tweak. One click undoes it.",
      );
    } else if (!t.preset) {
      notify("In the app, this puts the original setting back.");
    }
    later(() => {
      setBusy((b) => ({ ...b, [t.id]: undefined }));
      if (!next && t.preset) {
        // It was already like this before RevinHi, so there's nothing to revert.
        setTweakStatus((s) => ({ ...s, [t.id]: ALREADY_SET_TEXT }));
        return;
      }
      setTweakStatus((s) => ({ ...s, [t.id]: undefined }));
      if (t.id === "dns") {
        setDns(next ? "Cloudflare" : null);
        setDnsStatus(null);
      } else {
        setApplied((a) => ({ ...a, [t.id]: next }));
      }
      if (next && t.instructions) {
        setInstructions({ title: t.name, subtitle: "This one's a manual step - here's exactly where to go:", text: t.instructions });
      } else if (next && t.reboot) {
        setInstructions({ title: t.name, text: REBOOT_TEXT });
      }
    }, wait);
  };

  const onRestoreAll = () => {
    notify("In the app, this undoes every change RevinHi has made, back to how your PC was.");
    setApplied(Object.fromEntries(TWEAKS.map((t) => [t.id, !!t.preset])));
    setTweakStatus({});
    setDns(null);
    setRestoreStatus(`Restored ${RESTORE_ITEM_COUNT}/${RESTORE_ITEM_COUNT} items successfully.`);
  };

  // ---------------------------------------------------------------- Performance Boost
  const [boost, setBoost] = useState<BoostState>({ active: false, toggling: false, pending: null, status: null, stats: null });
  const [preview, setPreview] = useState(false);
  const [ignored, setIgnored] = useState<BoostApp[]>([]);
  const [suspended, setSuspended] = useState<BoostApp[]>([]);

  const onBoost = (next: boolean) => {
    if (boost.toggling) return;
    setBoost((b) => ({ ...b, toggling: true, pending: next }));
    if (next) {
      // Looks for running background apps, then asks which ones to pause.
      later(() => setPreview(true), 700);
    } else {
      notify("In the app, this wakes the paused apps right where they left off.");
      later(() => {
        setBoost({ active: false, toggling: false, pending: null, status: `Resumed ${suspended.length} app(s).`, stats: null });
        setSuspended([]);
      }, 450);
    }
  };

  const cancelBoost = () => {
    setPreview(false);
    setBoost((b) => ({ ...b, toggling: false, pending: null, status: null }));
  };

  const confirmBoost = (apps: BoostApp[]) => {
    setPreview(false);
    if (apps.length === 0) {
      cancelBoost();
      return;
    }
    notify("In the app, this pauses the checked apps. Nothing is closed.");
    setSuspended(apps);
    setBoost((b) => ({ ...b, active: true, status: `Suspended ${apps.length} app(s): ${apps.map((a) => a.name).join(", ")}` }));
    const ram = apps.reduce((sum, a) => sum + a.mb, 0);
    const cpu = Math.min(9.5, 1.2 + apps.length * 0.85 + Math.random() * 0.6);
    later(() => setBoost((b) => ({ ...b, toggling: false, pending: null, stats: { ram, cpu, run: Date.now() } })), 900);
  };

  // ---------------------------------------------------------------- Startup
  const [autoStart, setAutoStart] = useState(true);
  const [items, setItems] = useState(STARTUP_ITEMS);

  return (
    <div className={c("root")}>
      <div className={c("titleRow")}>
        <span className={c("statusPill")} title="Activated with a valid license key.">
          <span className={c("statusDot")} />
          <span>Activated</span>
        </span>
        <span className={c("statusPill")} title="Running as Administrator.">
          <span className={c("statusDot")} />
          <span>Administrator</span>
        </span>
      </div>

      <nav className={c("tabs")} role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={c("tab", tab === t.id && "tabActive")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className={c("content")}>
        {tab === "boost" && (
          <BoostTweaksView
            advanced={advanced}
            onAdvanced={setAdvanced}
            boost={boost}
            onBoost={onBoost}
            ignored={ignored}
            onUnignore={(id) => setIgnored((l) => l.filter((a) => a.id !== id))}
            isApplied={isApplied}
            busy={busy}
            statusFor={tweakStatus}
            onTweak={onTweak}
            restoreStatus={restoreStatus}
            onRestoreAll={onRestoreAll}
          />
        )}
        {tab === "dns" && (
          <DnsFinderView
            active={dns}
            status={dnsStatus}
            onUse={(name) => {
              notify(`In the app, this switches your PC's DNS to ${name}.`);
              setDns(name);
              setDnsStatus(`Now using ${name}.`);
            }}
            onRestore={() => {
              notify("In the app, this puts your DNS back to what your router hands out.");
              setDns(null);
              setDnsStatus("Restored to your network's default DNS.");
            }}
          />
        )}
        {tab === "dashboard" && (
          <DashboardView
            freedMb={boost.active ? suspended.reduce((sum, a) => sum + a.mb, 0) : 0}
            freedCpu={boost.active && boost.stats ? boost.stats.cpu : 0}
          />
        )}
        {tab === "startup" && (
          <StartupView
            autoStart={autoStart}
            onAutoStart={(v) => {
              notify(v ? "In the app, this starts RevinHi when you sign in to Windows." : "In the app, this stops RevinHi starting with Windows.");
              setAutoStart(v);
            }}
            items={items}
            onItem={(id, on) => {
              notify(on ? "In the app, this lets it start with Windows again." : "In the app, this stops it starting with Windows. Nothing is deleted.");
              setItems((list) => list.map((x) => (x.id === id ? { ...x, on } : x)));
            }}
          />
        )}
      </main>

      {preview && (
        <BoostPreviewDialog
          ignoredIds={ignored.map((a) => a.id)}
          onIgnore={(app) => setIgnored((l) => (l.some((a) => a.id === app.id) ? l : [...l, app]))}
          onCancel={cancelBoost}
          onConfirm={confirmBoost}
        />
      )}
      {instructions && (
        <InstructionsDialog title={instructions.title} subtitle={instructions.subtitle} text={instructions.text} onClose={() => setInstructions(null)} />
      )}
    </div>
  );
}

export default function PerformanceDemo() {
  // The real window is 940 x 800, so it's shown at real size (centered) on wide pages.
  return (
    <div className="mx-auto w-full max-w-[940px]">
      <AppWindow title={PRODUCT.name} icon={PRODUCT.icon} accent={PRODUCT.accent} width={940} height={836}>
        <PerformanceApp />
      </AppWindow>
    </div>
  );
}

