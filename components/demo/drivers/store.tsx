"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useDemo } from "../AppWindow";
import {
  COMPONENTS,
  SOURCE_LABEL,
  buildRows,
  componentName,
  progressAt,
  seedHistory,
  type Batch,
  type Component,
  type DeviceRow,
  type HistoryEntry,
  type InstallProgress,
  type Installed,
  type ItemProgress,
  type ScanProgress,
  type Step,
} from "./data";

/**
 * The preview's "backend": the scan, installs, History and the license, played out in the page
 * with the same steps and timings as the real app's browser preview (revinhi-drivers/src/preview).
 * Nothing here touches the visitor's PC; whatever would really change it ends with a short note.
 */

export type Feature = "install" | "updateAll" | "components" | "offline" | "restore" | "cleanup";

const SCAN_MS = 7000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface BatchItem {
  key: string;
  name: string;
  kind: "driver" | "component" | "rollback" | "restore";
  old: string | null;
  next: string | null;
  source: string;
  restart?: boolean;
  download?: boolean;
  /** What to change in the preview once it's in. */
  apply?: () => void;
  undo?: number;
  /** The device or component the History entry is about (a rollback's key is its own). */
  target?: string;
}

function useDrvState() {
  const { notify } = useDemo();
  const [pro, setPro] = useState(false);
  const [paywall, setPaywall] = useState<{ feature: Feature | null } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(id);
  }, []);

  // ---------------------------------------------------------------- devices and the scan
  const [installed, setInstalled] = useState<Installed>({});
  const [ignored, setIgnored] = useState<string[]>([]);
  const [allowGeneric, setAllowGeneric] = useState(false);
  const rows = useMemo(() => buildRows(installed, ignored), [installed, ignored]);
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const [scannedAt, setScannedAt] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const timer = useRef(0);
  const startScan = useCallback(() => {
    if (timer.current) return;
    const t0 = performance.now();
    const at = rowsRef.current;
    setRunning(true);
    setProgress(progressAt(0, at));
    timer.current = window.setInterval(() => {
      const t = (performance.now() - t0) / SCAN_MS;
      if (t >= 1) {
        window.clearInterval(timer.current);
        timer.current = 0;
        setProgress(null);
        setScannedAt(Date.now());
        setNow(Date.now());
        setRunning(false);
        return;
      }
      setProgress(progressAt(t, at));
    }, 120);
  }, []);
  useEffect(() => () => window.clearInterval(timer.current), []);

  // ---------------------------------------------------------------- game components
  const [components, setComponents] = useState<Component[]>(COMPONENTS);

  // ---------------------------------------------------------------- installs and History
  const [install, setInstall] = useState<InstallProgress | null>(null);
  const [bannerClosed, setBannerClosed] = useState<InstallProgress | null>(null);
  const [restartNeeded, setRestartNeeded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => seedHistory(Date.now()));
  const nextId = useRef(6);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const busy = !!install?.running;

  const runBatch = useCallback(
    async (batch: Batch, items: BatchItem[], done: string) => {
      const p: InstallProgress = { batch, running: true, items: items.map((i) => ({ key: i.key, name: i.name, step: "waiting", fraction: null, detail: null })), restorePoint: false };
      const push = () => alive.current && setInstall({ ...p, items: p.items.map((i) => ({ ...i })) });
      const set = (i: number, step: Step, fraction: number | null = null) => {
        Object.assign(p.items[i], { step, fraction });
        push();
      };
      push();
      const dl = items.map((it, i) => (it.download ? i : -1)).filter((i) => i >= 0);
      for (let f = 0; dl.length && f <= 1.001; f += 0.125) {
        dl.forEach((i) => set(i, "downloading", Math.min(1, f)));
        await sleep(140);
      }
      items.forEach((_, i) => set(i, "checking"));
      await sleep(400);
      items.forEach((_, i) => set(i, "restorePoint"));
      await sleep(1100);
      p.restorePoint = true;
      let restart = false;
      // Like the app, the scan's list is read again once the whole batch is in.
      const after: (() => void)[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "driver" || it.kind === "rollback") {
          set(i, "backingUp");
          await sleep(500);
        }
        set(i, "installing");
        await sleep(1100);
        if (!alive.current) return;
        const outcome = it.restart ? "needsRestart" : "installed";
        if (it.restart) restart = true;
        const id = nextId.current++;
        const entry: HistoryEntry = {
          id,
          at: Date.now(),
          kind: it.kind,
          target: it.target ?? it.key,
          name: it.name,
          oldVersion: it.old,
          newVersion: it.next,
          source: it.source,
          restorePoint: true,
          backup: (it.kind === "driver" || it.kind === "rollback") && !!it.old,
          outcome,
          detail: it.restart ? "Restart the PC to finish." : null,
          rolledBackBy: null,
        };
        setHistory((h) => [entry, ...h.map((x) => (x.id === it.undo ? { ...x, rolledBackBy: id } : x))]);
        if (it.apply) after.push(it.apply);
        set(i, it.restart ? "needsRestart" : "done");
      }
      p.running = false;
      push();
      after.forEach((f) => f());
      setNow(Date.now());
      if (restart) setRestartNeeded(true);
      notify(done);
    },
    [notify],
  );

  const openPaywall = useCallback((feature: Feature | null) => setPaywall({ feature }), []);

  const updateDrivers = useCallback(
    (list: DeviceRow[], feature: Feature = "install") => {
      if (!pro) return openPaywall(feature);
      if (busy) return;
      const items: BatchItem[] = list
        .filter((r) => r.offer && !r.ignored)
        .map((r) => {
          const o = r.offer!;
          return {
            key: r.instanceId,
            name: r.name,
            kind: "driver",
            old: r.driver?.version ?? null,
            next: o.displayVersion ?? o.version,
            source: SOURCE_LABEL[o.source],
            restart: r.name.includes("GeForce"),
            apply: () => setInstalled((m) => ({ ...m, [r.instanceId]: { version: o.version, date: o.date } })),
          };
        });
      if (items.length) void runBatch("drivers", items, "In the app, this installs the update. You can roll it back any time.");
    },
    [pro, busy, openPaywall, runBatch],
  );

  const installParts = useCallback(
    (comp: Component) => {
      if (!pro) return openPaywall("components");
      if (busy) return;
      void runBatch(
        "components",
        [
          {
            key: comp.id,
            name: componentName(comp),
            kind: "component",
            old: comp.version,
            next: comp.recommended,
            source: "Microsoft",
            download: comp.id !== "netfx35",
            apply: () =>
              setComponents((l) =>
                l.map((x) => (x.id === comp.id ? { ...x, state: "installed", version: x.recommended ?? x.version ?? "Latest", recommended: null, missingFiles: [], note: "Installed by RevinHi Drivers." } : x)),
              ),
          },
        ],
        "In the app, this installs it from Microsoft's own download, after a restore point.",
      );
    },
    [pro, busy, openPaywall, runBatch],
  );

  const rollBack = useCallback(
    (e: HistoryEntry) => {
      if (busy) return;
      const date = rowsRef.current.find((r) => r.instanceId === e.target)?.driver?.date ?? "2024-01-01";
      void runBatch(
        "rollback",
        [
          {
            key: `rollback-${e.id}`,
            name: e.name,
            kind: "rollback",
            old: e.newVersion,
            next: e.oldVersion,
            source: "Your backup",
            undo: e.id,
            target: e.target,
            apply: () => {
              const ver = e.oldVersion;
              if (!ver) return;
              setInstalled((m) => ({ ...m, [e.target]: { version: ver, date } }));
            },
          },
        ],
        "In the app, this puts the earlier driver back from its backup.",
      );
    },
    [busy, runBatch],
  );

  const itemFor = useCallback((key: string): ItemProgress | null => install?.items.find((i) => i.key === key) ?? null, [install]);

  return {
    pro,
    setPro,
    paywall,
    openPaywall,
    closePaywall: () => setPaywall(null),
    now,
    rows,
    ignored,
    setIgnored,
    allowGeneric,
    setAllowGeneric,
    scan: { running, progress, scannedAt, start: startScan },
    components,
    install,
    banner: install && install !== bannerClosed ? install : null,
    closeBanner: () => setBannerClosed(install),
    busy,
    itemFor,
    restartNeeded,
    dismissRestart: () => setRestartNeeded(false),
    history,
    updateDrivers,
    installParts,
    rollBack,
    notify,
  };
}

export type DrvState = ReturnType<typeof useDrvState>;

const Ctx = createContext<DrvState | null>(null);

export function DrvProvider({ children }: { children: React.ReactNode }) {
  const state = useDrvState();
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useDrv(): DrvState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDrv outside DrvProvider");
  return v;
}
