"use client";

import { useCallback, useState } from "react";
import { getProduct } from "@/lib/products";
import { AppWindow } from "./AppWindow";
import { DriversView } from "./drivers/drivers";
import { ComponentsView, HelpView, HistoryView, LicenseView, SettingsView, UpgradeHost } from "./drivers/pages";
import { DrvProvider, useDrv } from "./drivers/store";
import { ToolsView } from "./drivers/tools";
import { IconGear, IconHelp, LockIcon, c, vars } from "./drivers/ui";

/**
 * "Try the app" preview of RevinHi Drivers: the real app's screens rebuilt from its own components
 * and styles (revinhi-drivers/src), with the same sample laptop its browser preview uses. The scan,
 * installs and roll backs are simulated; anything that would change the PC only shows a note.
 */

type Tab = "drivers" | "components" | "tools" | "history";
type Page = Tab | "settings" | "license" | "help";

const TABS: { id: Tab; label: string }[] = [
  { id: "drivers", label: "Drivers" },
  { id: "components", label: "Game components" },
  { id: "tools", label: "Tools" },
  { id: "history", label: "History" },
];

const PRODUCT = getProduct("drivers");

/** The pill in the title bar while a scan runs on another tab: how far it is, and the way back. */
function ScanPill({ onOpen }: { onOpen: () => void }) {
  const { scan } = useDrv();
  const pct = Math.floor(Math.min(100, Math.max(0, (scan.progress?.fraction ?? 0) * 100)));
  return (
    <button className={c("scan-pill running")} onClick={onOpen} title="Back to the scan">
      <span className={c("scan-pill-ring")} style={vars({ "--p": `${pct}%` })} />
      Scanning… {pct}%
    </button>
  );
}

function TierPill({ onLicense }: { onLicense: () => void }) {
  const { pro, openPaywall } = useDrv();
  return pro ? (
    <button className={c("tier-pill tier-pro")} onClick={onLicense} title="Your license">
      <span className={c("pill-dot dot-success")} />
      Pro
    </button>
  ) : (
    <button className={c("tier-pill tier-free")} onClick={() => openPaywall(null)} title="What Pro adds, and where to enter a key">
      <LockIcon size={9} />
      Free <span className={c("tier-sep")} /> <b>Upgrade</b>
    </button>
  );
}

function DriversApp() {
  const { scan } = useDrv();
  const [page, setPage] = useState<Page>("drivers");

  // A tool asked to show a device in the Drivers tab (its details drawer opens).
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const showInDrivers = useCallback((id?: string) => {
    if (id) setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    setPage("drivers");
  }, []);

  const scanShowsHere = page === "drivers" || page === "components";

  return (
    <div className={c("root app")}>
      <header className={c("titlebar")}>
        <nav className={c("tabs")} role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={page === t.id} className={c("tab", page === t.id && "active")} onClick={() => setPage(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        {scan.running && !scanShowsHere && <ScanPill onOpen={() => setPage("drivers")} />}
        <div className={c("titlebar-drag")} />
        <div className={c("titlebar-tools")}>
          <TierPill onLicense={() => setPage("license")} />
          <button className={c("icon-btn gear-btn", page === "help" && "active")} onClick={() => setPage("help")} aria-label="How to update drivers" title="How to update drivers">
            <IconHelp size={17} />
          </button>
          <button className={c("icon-btn gear-btn", page === "settings" && "active")} onClick={() => setPage("settings")} aria-label="Settings" title="Settings">
            <IconGear size={17} />
          </button>
        </div>
      </header>

      <main className={c("content")}>
        {/* Drivers and Tools stay mounted, like the app: ticks, open details and a tool's progress survive a look at another tab. */}
        <div className={c("tab-host")} hidden={page !== "drivers"}>
          <DriversView visible={page === "drivers"} onSettings={() => setPage("settings")} focus={focus} />
        </div>
        {page === "components" && (
          <div className={c("tab-host")}>
            <ComponentsView onDrivers={() => setPage("drivers")} />
          </div>
        )}
        <div className={c("tab-host")} hidden={page !== "tools"}>
          <ToolsView onDrivers={showInDrivers} onHistory={() => setPage("history")} />
        </div>
        {page === "history" && (
          <div className={c("tab-host")}>
            <HistoryView />
          </div>
        )}
        {page === "settings" && (
          <div className={c("tab-host")}>
            <SettingsView onLicense={() => setPage("license")} />
          </div>
        )}
        {page === "help" && (
          <div className={c("tab-host")}>
            <HelpView />
          </div>
        )}
        {page === "license" && (
          <div className={c("tab-host")}>
            <LicenseView />
          </div>
        )}
      </main>

      <UpgradeHost />
    </div>
  );
}

export default function DriversDemo() {
  return (
    <AppWindow title={PRODUCT.name} icon={PRODUCT.icon} accent={PRODUCT.accent} width={1360} height={916}>
      <DrvProvider>
        <DriversApp />
      </DrvProvider>
    </AppWindow>
  );
}
