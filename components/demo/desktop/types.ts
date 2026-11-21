// Copied from the real app (revinhi-radar/src/desktop/types.ts) for the website preview.
// Wire types for the desktop layout. Mirror src-tauri/src/desktop_layout.rs
// exactly (snake_case, same defaults) - that file is the source of truth.

import type { ExtraStyle } from "./scenes";

export type ProceduralStyle = "particles" | "starfield" | "gradient_flow" | "waves" | ExtraStyle;

/** What a monitor's base layer shows (replaces Wallpapers' procedural:// pseudo-path). */
export type WallpaperSource =
  | { kind: "image"; path: string }
  | { kind: "video"; path: string }
  | {
      kind: "procedural";
      style: ProceduralStyle;
      palette: string;
      /** CSS hex, "#RRGGBB" or "#RRGGBBAA". */
      primary: string;
      secondary: string;
      seed: number;
    };

/** Registry keys. Rust keeps this a plain string so new kinds need no backend change. */
export type DesktopWidgetKind =
  | "clock"
  | "date"
  | "text"
  | "system_stats"
  | "battery"
  | "current"
  | "forecast"
  | "radar"
  | "storm"
  | "analog_clock"
  | "calendar"
  | "sun_moon"
  | "temp_graph"
  | "countdown"
  | "todo";

/** One placed widget. x/y/width/height are fractions (0-1) of the monitor's
 * bounds. Colors are CSS "#RRGGBBAA" (Wallpapers stored "#AARRGGBB"). */
export interface DesktopWidget {
  id: string;
  kind: DesktopWidgetKind;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;

  font_family: string;
  font_size: number;
  font_bold: boolean;
  font_italic: boolean;
  text_color: string;
  /** Soft glow in the text's own color (neon look). */
  text_glow: boolean;

  show_panel: boolean;
  panel_color: string;
  border_color: string;
  corner_radius: number;

  use_24_hour: boolean;
  show_seconds: boolean;
  show_date: boolean;

  custom_text: string;

  show_cpu: boolean;
  show_ram: boolean;

  /** Radar-family widgets: saved location id ("" = primary). */
  location_id: string;

  /** Radar widget on the desktop: map zoom (it can't take clicks behind the icons). */
  radar_zoom: number;
  /** Radar widget on the desktop: loop recent scans. */
  radar_animate: boolean;

  // --- appearance extras (every kind) ---
  text_align: "left" | "center" | "right";
  /** Extra letter spacing in em (0 = normal). */
  letter_spacing: number;
  /** Frosted-glass blur behind the panel. */
  glass_blur: boolean;
  /** Soft drop shadow under text, for readability on busy wallpapers. */
  text_shadow: boolean;
  /** Highlight color: analog clock seconds/centre, calendar today, graph line, countdown digits. */
  accent_color: string;

  // --- kind-specific ---
  clock_style: "minimal" | "classic" | "neon";
  /** Countdown target date, "YYYY-MM-DD". */
  countdown_target: string;
  /** Forecast widget look on the desktop. */
  fc_style: "list" | "days" | "graph";
  /** To-Do widget: leave finished items off the desktop. */
  todo_hide_done: boolean;
  // Unknown/forward-compatible keys are preserved by the backend (serde
  // flatten) and by the object spreads used for every edit here.
}

export type EffectKind = "rain" | "snow" | "light_rays" | "audio_glow" | "lightning" | "fog" | "embers" | "shooting_stars" | "dust" | "cinematic";

export interface EffectInstance {
  kind: EffectKind;
  enabled: boolean;
  intensity: number;
  speed: number;
  opacity: number;
  color: string;
}

export interface MonitorLayout {
  /** OS monitor name as reported by Tauri, e.g. "\\\\.\\DISPLAY1". */
  monitor_id: string;
  wallpaper: WallpaperSource | null;
  widgets: DesktopWidget[];
  effects: EffectInstance[];
  /** Set by the backend on a free-tier send: the surface shows the Free badge. */
  watermark?: boolean;
}

export interface DesktopLayout {
  monitors: MonitorLayout[];
}

/** Defaults identical to desktop_layout.rs (and Wallpapers' WidgetInstance.cs). */
export const WIDGET_DEFAULTS: Omit<DesktopWidget, "id" | "kind"> = {
  x: 0.4,
  y: 0.4,
  width: 0.22,
  height: 0.12,
  opacity: 1,
  font_family: "Segoe UI",
  font_size: 22,
  font_bold: false,
  font_italic: false,
  text_color: "#FFFFFFFF",
  text_glow: false,
  show_panel: true,
  panel_color: "#08080C8C",
  border_color: "#FFFFFF3C",
  corner_radius: 8,
  use_24_hour: false,
  show_seconds: false,
  show_date: true,
  custom_text: "Your text here",
  show_cpu: true,
  show_ram: true,
  location_id: "",
  radar_zoom: 6,
  radar_animate: true,
  text_align: "center",
  letter_spacing: 0,
  glass_blur: false,
  text_shadow: false,
  accent_color: "#00E5FFFF",
  clock_style: "minimal",
  countdown_target: "",
  fc_style: "days",
  todo_hide_done: false,
};

export function emptyMonitor(monitorId: string): MonitorLayout {
  return { monitor_id: monitorId, wallpaper: null, widgets: [], effects: [] };
}

export function monitorOf(layout: DesktopLayout | null, monitorId: string): MonitorLayout | null {
  return layout?.monitors.find((m) => m.monitor_id === monitorId) ?? null;
}
