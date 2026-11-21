"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getProduct } from "@/lib/products";
import { AppWindow } from "./AppWindow";
import { RECENT, RecentScan, Session, buildResults, fullMinutes } from "./recovery/data";
import { HomeView, ScanTarget, ScanTypeDialog } from "./recovery/home";
import { HelpView, ProFeature, RecentView, SettingsView, UpgradeModal } from "./recovery/pages";
import { ResultsView } from "./recovery/results";
import { ScanningView } from "./recovery/scan";
import { ToolsView, type ToolId } from "./recovery/tools";
import { IconGear, IconHelp, IconLock, c } from "./recovery/ui";

/**
 * "Try the app" preview of RevinHi Recovery: the real app's screens rebuilt from its own components
 * and styles (revinhi-recovery/src), with sample drives and found files. Scans are simulated;
 * anything that would read or write a real drive only shows a note.
 */

type Tab = "recover" | "tools" | "recent" | "settings" | "help";
type View = "home" | "scan" | "results";

const TABS: { id: Tab; label: string }[] = [
  { id: "recover", label: "Recover" },
  { id: "tools", label: "Tools" },
  { id: "recent", label: "Recent scans" },
];

const PRODUCT = getProduct("recovery");

function RecoveryApp() {
  const [tab, setTab] = useState<Tab>("recover");
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<Session | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [target, setTarget] = useState<ScanTarget | null>(null);
  const [paywall, setPaywall] = useState<{ feature: ProFeature } | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [tool, setTool] = useState<ToolId | null>(null);
  const [toolFocus, setToolFocus] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentScan[]>(RECENT);

  // Where the user is, for the moment a scan ends.
  const where = useRef({ tab, view });
  useEffect(() => {
    where.current = { tab, view };
  });

  const progressRef = useRef(0);
  useEffect(() => {
    if (!running || paused || !session) return;
    const duration = session.deep ? 16000 : 6000;
    const id = window.setInterval(() => {
      const next = Math.min(1, progressRef.current + 100 / duration);
      progressRef.current = next;
      setProgress(next);
      if (next >= 1) {
        window.clearInterval(id);
        setRunning(false);
        setSession((s) => (s ? { ...s, finished: true } : s));
        setRecent((list) => [
          { id: `scan-${Date.now()}`, drive: session.drive, title: session.title, when: "Just now", finished: true, file: session.deep ? "64.0 MB" : "9.0 MB" },
          ...list.filter((r) => r.title !== session.title),
        ].slice(0, 5));
        const w = where.current;
        if (w.tab === "recover" && w.view === "scan") setView("results");
        else setUnseen(true);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [running, paused, session]);

  const pctBucket = Math.floor(progress * 100);
  const results = useMemo(() => (session ? buildResults(session, session.finished ? 1 : pctBucket / 100) : null), [session, pctBucket]);

  const took = useMemo(() => {
    if (!session) return "";
    if (!session.deep) return `${20 + session.drive * 9} sec`;
    return `${fullMinutes(session.drive, session.volume)} min ${(12 + session.drive * 17) % 60} sec`;
  }, [session]);

  const begin = (t: ScanTarget, deep: boolean) => {
    setTarget(null);
    setSession({ drive: t.drive, volume: t.volume, title: t.title, deep, finished: false });
    setSessionKey((k) => k + 1);
    progressRef.current = 0;
    setProgress(0);
    setPaused(false);
    setUnseen(false);
    setRunning(true);
    setTab("recover");
    setView("scan");
  };

  const openRecent = (r: RecentScan) => {
    const p = r.finished ? 1 : 0.63;
    setSession({ drive: r.drive, title: r.title, deep: true, finished: r.finished });
    setSessionKey((k) => k + 1);
    progressRef.current = p;
    setProgress(p);
    setRunning(false);
    setPaused(false);
    setUnseen(false);
    setTab("recover");
    setView("results");
  };

  const resume = () => {
    setPaused(false);
    setRunning(true);
    setTab("recover");
    setView("scan");
  };

  const stop = () => {
    setRunning(false);
    setPaused(false);
    setView("results");
  };

  const openTool = (t: ToolId | null, drive?: number) => {
    setTool(t);
    setToolFocus(drive ?? null);
    setTab("tools");
  };

  const onScanScreen = tab === "recover" && view === "scan";
  const showPill = (running && !onScanScreen) || (unseen && !!session && !(tab === "recover" && view === "results"));
  const pct = Math.floor(progress * 100);

  const recoverView: View = view === "scan" && !running && !paused ? (session ? "results" : "home") : view === "results" && !session ? "home" : view;

  return (
    <div className={c("root")}>
      <header className={c("titlebar")}>
        <nav className={c("tabs")} role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={c("tab", tab === t.id && "active")} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        {showPill && (
          <button
            className={c("scan-pill", paused && "paused")}
            onClick={() => {
              setTab("recover");
              if (running || paused) setView("scan");
              else {
                setView("results");
                setUnseen(false);
              }
            }}
            title={running ? "Back to the scan" : "See what the scan found"}
          >
            <span className={c("scan-pill-ring")} style={{ ["--p" as string]: `${running ? pct : 100}%` }} />
            {running ? (paused ? `Paused at ${pct}%` : `Scanning… ${pct}%`) : "Scan finished"}
          </button>
        )}
        <div className={c("titlebar-drag")} />
        <div className={c("titlebar-tools")}>
          <button className={c("tier-pill")} onClick={() => setPaywall({ feature: null })} title="What Pro adds, and where to enter a key">
            <IconLock size={9} />
            Free <span className={c("tier-sep")} /> <b>Upgrade</b>
          </button>
          <button className={c("icon-btn", tab === "help" && "active")} onClick={() => setTab("help")} aria-label="How to recover files" title="How to recover files">
            <IconHelp size={17} />
          </button>
          <button className={c("icon-btn", tab === "settings" && "active")} onClick={() => setTab("settings")} aria-label="Settings" title="Settings">
            <IconGear size={17} />
          </button>
        </div>
      </header>

      <main className={c("content")}>
        {tab === "recover" &&
          (recoverView === "scan" && session && results ? (
            <ScanningView
              session={session}
              progress={progress}
              paused={paused}
              results={results}
              onPause={() => setPaused(true)}
              onResume={resume}
              onStop={stop}
              onShowFound={() => setView("results")}
            />
          ) : recoverView === "results" && session && results ? (
            <ResultsView
              key={sessionKey}
              session={session}
              results={results}
              running={running && !paused}
              progress={progress}
              took={took}
              onBack={() => setView("home")}
              onClose={() => {
                setSession(null);
                setView("home");
              }}
              onContinue={resume}
              onScanView={() => setView("scan")}
              onStop={stop}
              onPro={() => setPaywall({ feature: "recover" })}
            />
          ) : (
            <HomeView
              onScan={setTarget}
              onTool={openTool}
              recent={recent}
              onOpenRecent={openRecent}
              onRemoveRecent={(r) => setRecent((list) => list.filter((x) => x.id !== r.id))}
              onRecentTab={() => setTab("recent")}
              session={session}
              running={running}
              pct={pct}
              onScanView={() => setView("scan")}
              onResults={() => {
                setView("results");
                setUnseen(false);
              }}
            />
          ))}
        {tab === "tools" && (
          <ToolsView
            open={tool}
            focus={toolFocus}
            advanced={advanced}
            onOpen={(t) => openTool(t)}
            onSettings={() => setTab("settings")}
            onScan={setTarget}
            onPro={() => setPaywall({ feature: "writeImage" })}
          />
        )}
        {tab === "recent" && (
          <RecentView recent={recent} onOpen={openRecent} onRemove={(r) => setRecent((list) => list.filter((x) => x.id !== r.id))} onDrives={() => setTab("recover")} />
        )}
        {tab === "settings" && <SettingsView advanced={advanced} setAdvanced={setAdvanced} onLicense={() => setPaywall({ feature: null })} />}
        {tab === "help" && <HelpView />}
      </main>

      {target && <ScanTypeDialog target={target} onCancel={() => setTarget(null)} onStart={(deep) => begin(target, deep)} />}
      {paywall && <UpgradeModal feature={paywall.feature} onClose={() => setPaywall(null)} />}
    </div>
  );
}

export default function RecoveryDemo() {
  return (
    <AppWindow title={PRODUCT.name} icon={PRODUCT.icon} accent={PRODUCT.accent} width={1280} height={832}>
      <RecoveryApp />
    </AppWindow>
  );
}
