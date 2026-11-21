"use client";

import { useState, useSyncExternalStore } from "react";
import { getProduct } from "@/lib/products";
import { AppWindow, useDemo } from "./AppWindow";
import { EditorView } from "./desktop/editor";
import { ForecastPane, LicenseView, LocationsPane, SettingsPane, SidebarTier, TaskbarDockPane, UpgradeModal, WidgetsPane } from "./desktop/panes";
import { RadarView } from "./desktop/radar";
import { AppContext, c, useAppState } from "./desktop/ui";

/**
 * "Try the app" preview of RevinHi Desktop: the real control panel rebuilt from the app's own
 * components, styles and scene engine (revinhi-radar/src), with sample weather and a pretend
 * storm on the radar. Anything that would change the real desktop or taskbar only shows a note.
 */

type Tab = "editor" | "locations" | "forecast" | "radar" | "widgets" | "taskbar" | "settings" | "license";

const TABS: { id: Tab; label: string }[] = [
  { id: "editor", label: "Editor" },
  { id: "locations", label: "Locations" },
  { id: "forecast", label: "Forecast" },
  { id: "radar", label: "Radar" },
  { id: "widgets", label: "Widgets" },
  { id: "taskbar", label: "Taskbar & Dock" },
  { id: "settings", label: "Settings" },
  { id: "license", label: "License" },
];

const PRODUCT = getProduct("desktop");

function DesktopApp() {
  const state = useAppState();
  const { notify } = useDemo();
  const [tab, setTab] = useState<Tab>("editor");

  const addLocation = (label: string, lat: number, lon: number, isAddress: boolean): boolean => {
    if (!state.pro && state.locations.length >= state.limit("locations")) {
      state.openPaywall("locations");
      return false;
    }
    state.setLocations([...state.locations, { id: `loc-${Date.now().toString(36)}`, label, lat, lon, is_address: isAddress }]);
    return true;
  };

  return (
    <AppContext.Provider value={state}>
      <div className={c("root app")}>
        <div className={c("shell")}>
          <nav className={c("sidebar")}>
            <h1 className={c("sidebar-brand rgb-chase")}>RevinHi Desktop</h1>
            {TABS.map((t) => (
              <button key={t.id} className={c("nav-item", tab === t.id && "active")} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <SidebarTier />
          </nav>
          <main className={c("content")}>
            {tab === "editor" && <EditorView />}
            {tab === "locations" && <LocationsPane onAdd={addLocation} />}
            {tab === "forecast" && <ForecastPane />}
            {tab === "radar" && (
              <RadarView
                onSavePin={(label, lat, lon) => {
                  if (addLocation(label, lat, lon, true)) notify("Pin saved to your locations.");
                }}
              />
            )}
            {tab === "widgets" && <WidgetsPane />}
            {tab === "taskbar" && <TaskbarDockPane />}
            {tab === "settings" && <SettingsPane />}
            {tab === "license" && <LicenseView />}
          </main>
        </div>
        {state.paywall !== undefined && !state.pro && <UpgradeModal key={String(state.paywall)} feature={state.paywall} onClose={state.closePaywall} />}
      </div>
    </AppContext.Provider>
  );
}

const subscribe = () => () => {};

export default function DesktopDemo() {
  // Clocks, dates and the animated scenes only make sense in the browser.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <AppWindow title={PRODUCT.name} icon={PRODUCT.icon} accent={PRODUCT.accent} width={1100} height={796}>
      {mounted ? <DesktopApp /> : <div className={c("root app demo-loading")}>Loading the preview…</div>}
    </AppWindow>
  );
}
