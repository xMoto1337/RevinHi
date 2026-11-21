// Copied from the real app (revinhi-radar/src/license/features.ts) for the website preview.
// Free vs Pro in ONE table. Every lock in the UI reads from here (through
// useLicense().can / the helpers below) - no scattered `if (licensed)`.
// The backend enforces the valuable parts itself with the same numbers:
// src-tauri/src/entitlements.rs. Keep the two in step.
//
// Severe-weather alerts (polygons, cards, toasts) are deliberately FREE and
// appear nowhere in this file.


export const PRICE = "$9.99";
export const BUY_URL = "https://revinhi.com/desktop";
export const PRO_NAME = "Pro";

export type Feature =
  | "radar_replay"
  | "lightning"
  | "tower_radar"
  | "nowcast"
  | "extra_regions"
  | "locations"
  | "full_forecast"
  | "wallpapers"
  | "widgets"
  | "effects"
  | "presets"
  | "popouts"
  | "no_watermark"
  | "taskbar";

export type FeatureArt = "replay" | "lightning" | "tower" | "nowcast" | "map" | "pins" | "forecast" | "wallpaper" | "widgets" | "rain" | "presets" | "popout" | "watermark";

export interface FeatureInfo {
  title: string;
  /** One line: what Pro gives you. */
  pro: string;
  /** What the free version has instead. */
  free: string;
  art: FeatureArt;
  /** Shown in the upgrade modal's list (in this order). */
  highlight: boolean;
}

export const FEATURES: Record<Feature, FeatureInfo> = {
  lightning: { title: "Live lightning", pro: "Strikes seconds after they happen, strike counter and nearby-strike alerts", free: "Not included", art: "lightning", highlight: true },
  radar_replay: { title: "2-hour radar replay", pro: "Loop and scrub the last 2 hours of scans", free: "Latest scan only", art: "replay", highlight: true },
  effects: { title: "Rain, snow, lightning & more", pro: "Real rain-on-glass, snow, lightning storms, fog, embers, light rays and glow over your desktop", free: "Not included", art: "rain", highlight: true },
  presets: { title: "One-click desktop presets", pro: "100+ scenes: Northern Lights, Outrun, Firefly Meadow, Hypno Tunnel, Lava Lamp and more", free: "One starter preset", art: "presets", highlight: true },
  wallpapers: { title: "Every wallpaper", pro: "All 20 animated styles × 24 palettes, plus your own videos and images", free: "Gradient Flow in 3 palettes", art: "wallpaper", highlight: true },
  widgets: { title: "All desktop widgets", pro: "Radar, weather, to-do list, system stats, text, battery - as many as you like", free: "Clock and Date, 2 max", art: "widgets", highlight: true },
  tower_radar: { title: "Live tower radar", pro: "Seconds-old, 4x sharper radar straight from the nearest tower", free: "National mosaic", art: "tower", highlight: false },
  nowcast: { title: "Rain arrival estimate", pro: "When rain reaches your pin, from how storms are moving", free: "Not included", art: "nowcast", highlight: false },
  extra_regions: { title: "Alaska, Hawaii, Caribbean & Guam", pro: "Radar beyond the lower 48", free: "Lower 48 only", art: "map", highlight: false },
  locations: { title: "Unlimited locations", pro: "Save every place you care about", free: "1 location", art: "pins", highlight: false },
  full_forecast: { title: "Full forecast", pro: "7-day forecast and 48 hours of hourly", free: "3 periods, next 6 hours", art: "forecast", highlight: false },
  popouts: { title: "Pop-out widgets", pro: "Every pop-out widget at once, including live radar", free: "1 at a time, no radar", art: "popout", highlight: false },
  no_watermark: { title: "No watermark", pro: "A clean desktop", free: "Small “Free” badge in a corner", art: "watermark", highlight: true },
  taskbar: { title: "Taskbar styles & RevinHi Dock", pro: "Clear, blurred or tinted taskbar and a glass dock for your favourite apps", free: "Not included", art: "widgets", highlight: true },
};

/** Free-tier limits (mirrors entitlements.rs). */
export const FREE = {
  locations: 1,
  forecastPeriods: 3,
  hourlyPeriods: 6,
  desktopWidgets: 2,
  widgetKinds: ["clock", "date"] as string[],
  style: "gradient_flow",
  palettes: ["Cyan Drift", "Sunset Blaze", "Forest Pulse"],
  popouts: 1,
  lockedPopouts: ["radar"] as string[],
  presets: ["starter"] as string[],
  /** How long a locked effect plays in the Editor before the paywall. */
  effectPreviewMs: 3000,
  /** Upgrade reminder cadence while the control panel is open. */
  nagEveryMs: 15 * 60 * 1000,
  /** The reminder's close button unlocks after this. */
  nagCloseDelayMs: 3000,
};



export interface Entitlements {
  pro: boolean;
  can: (f: Feature) => boolean;
  styleAllowed: (style: string) => boolean;
  paletteAllowed: (name: string) => boolean;
  widgetAllowed: (kind: string) => boolean;
  presetAllowed: (id: string) => boolean;
  popoutAllowed: (kind: string) => boolean;
  /** Numeric limit, Infinity on Pro. */
  limit: (k: "locations" | "desktopWidgets" | "popouts" | "forecastPeriods" | "hourlyPeriods") => number;
}

export function entitlements(pro: boolean): Entitlements {
  return {
    pro,
    can: () => pro,
    styleAllowed: (s) => pro || s === FREE.style,
    paletteAllowed: (n) => pro || FREE.palettes.includes(n),
    widgetAllowed: (k) => pro || FREE.widgetKinds.includes(k),
    presetAllowed: (id) => pro || FREE.presets.includes(id),
    popoutAllowed: (k) => pro || !FREE.lockedPopouts.includes(k),
    limit: (k) => (pro ? Infinity : FREE[k]),
  };
}
