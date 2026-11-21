// The widget table from the real app (revinhi-radar/src/desktop/widgets/registry.ts),
// minus the React components (widgets.tsx maps kinds to those), so presets.ts can
// build layouts without pulling in any UI.

import { DesktopWidget, DesktopWidgetKind, WIDGET_DEFAULTS } from "./types";

/** The pop-out weather cards are designed around a 14px base. */
export const WEATHER_BASE_FONT = 14;

export type WidgetOption =
  | { type: "toggle"; key: keyof DesktopWidget; label: string }
  | { type: "text"; key: keyof DesktopWidget; label: string; multiline?: boolean }
  | { type: "location"; key: keyof DesktopWidget; label: string }
  | { type: "slider"; key: keyof DesktopWidget; label: string; hint?: string; min: number; max: number; step: number; format?: (v: number) => string }
  | { type: "choice"; key: keyof DesktopWidget; label: string; choices: { value: string; label: string }[] }
  | { type: "date"; key: keyof DesktopWidget; label: string }
  | { type: "todo_list"; key: keyof DesktopWidget; label: string };

export interface WidgetDef {
  kind: DesktopWidgetKind;
  label: string;
  group: "Desktop" | "Weather";
  usesFont: boolean;
  usesAccent?: boolean;
  defaults: Partial<DesktopWidget>;
  options: WidgetOption[];
}

const WEATHER_PANEL: Partial<DesktopWidget> = {
  font_size: WEATHER_BASE_FONT,
  panel_color: "#080808EB",
  border_color: "#FFFFFF1A",
  corner_radius: 16,
};
const LOCATION_OPTION: WidgetOption = { type: "location", key: "location_id", label: "Location" };

export const WIDGETS: WidgetDef[] = [
  {
    kind: "clock",
    label: "Clock",
    group: "Desktop",
    usesFont: true,
    defaults: {},
    options: [
      { type: "toggle", key: "use_24_hour", label: "24-hour clock" },
      { type: "toggle", key: "show_seconds", label: "Show seconds" },
      { type: "toggle", key: "show_date", label: "Show date" },
    ],
  },
  { kind: "date", label: "Date", group: "Desktop", usesFont: true, defaults: {}, options: [] },
  { kind: "text", label: "Text", group: "Desktop", usesFont: true, defaults: {}, options: [{ type: "text", key: "custom_text", label: "Text", multiline: true }] },
  {
    kind: "system_stats",
    label: "System Stats",
    group: "Desktop",
    usesFont: true,
    defaults: {},
    options: [
      { type: "toggle", key: "show_cpu", label: "Show CPU" },
      { type: "toggle", key: "show_ram", label: "Show RAM" },
    ],
  },
  { kind: "battery", label: "Battery", group: "Desktop", usesFont: true, defaults: {}, options: [] },
  { kind: "current", label: "Current Conditions", group: "Weather", usesFont: true, defaults: { ...WEATHER_PANEL, width: 0.16, height: 0.15 }, options: [LOCATION_OPTION] },
  {
    kind: "forecast",
    label: "Forecast",
    group: "Weather",
    usesFont: true,
    defaults: { ...WEATHER_PANEL, width: 0.2, height: 0.3 },
    options: [
      LOCATION_OPTION,
      {
        type: "choice",
        key: "fc_style",
        label: "Style",
        choices: [
          { value: "days", label: "Daily bars" },
          { value: "graph", label: "Graph" },
          { value: "list", label: "List" },
        ],
      },
    ],
  },
  {
    kind: "radar",
    label: "Radar",
    group: "Weather",
    usesFont: false,
    defaults: { ...WEATHER_PANEL, width: 0.22, height: 0.36, x: 0.7, y: 0.1 },
    options: [
      LOCATION_OPTION,
      {
        type: "slider",
        key: "radar_zoom",
        label: "Zoom",
        hint: "Wide = the whole region, close = your neighbourhood.",
        min: 3,
        max: 11,
        step: 0.25,
        format: (v) => (v < 5 ? "Wide" : v < 8 ? "Regional" : "Close") + ` · ${v.toFixed(1)}`,
      },
      { type: "toggle", key: "radar_animate", label: "Animate recent scans" },
    ],
  },
  { kind: "storm", label: "Storm Alert", group: "Weather", usesFont: true, defaults: { ...WEATHER_PANEL, width: 0.18, height: 0.17 }, options: [LOCATION_OPTION] },
  {
    kind: "temp_graph",
    label: "Temperature Graph",
    group: "Weather",
    usesFont: true,
    usesAccent: true,
    defaults: { ...WEATHER_PANEL, width: 0.3, height: 0.2, accent_color: "" },
    options: [LOCATION_OPTION],
  },
  {
    kind: "sun_moon",
    label: "Sun & Moon",
    group: "Weather",
    usesFont: true,
    usesAccent: true,
    defaults: { ...WEATHER_PANEL, font_size: 24, width: 0.17, height: 0.22, accent_color: "#FFD25AFF" },
    options: [LOCATION_OPTION],
  },
  {
    kind: "analog_clock",
    label: "Analog Clock",
    group: "Desktop",
    usesFont: false,
    usesAccent: true,
    defaults: { show_panel: false, width: 0.14, height: 0.25, show_seconds: true },
    options: [
      {
        type: "choice",
        key: "clock_style",
        label: "Style",
        choices: [
          { value: "minimal", label: "Minimal" },
          { value: "classic", label: "Classic" },
          { value: "neon", label: "Neon" },
        ],
      },
      { type: "toggle", key: "show_seconds", label: "Seconds hand" },
    ],
  },
  { kind: "calendar", label: "Calendar", group: "Desktop", usesFont: true, usesAccent: true, defaults: { font_size: 22, width: 0.16, height: 0.26 }, options: [] },
  {
    kind: "countdown",
    label: "Countdown",
    group: "Desktop",
    usesFont: true,
    usesAccent: true,
    defaults: { font_size: 20, width: 0.22, height: 0.14, custom_text: "Vacation", show_seconds: false },
    options: [
      { type: "date", key: "countdown_target", label: "Count down to" },
      { type: "text", key: "custom_text", label: "Label" },
      { type: "toggle", key: "show_seconds", label: "Show seconds" },
    ],
  },
  {
    kind: "todo",
    label: "To-Do",
    group: "Desktop",
    usesFont: true,
    usesAccent: true,
    defaults: { font_size: 18, width: 0.2, height: 0.3, custom_text: "To-Do", text_align: "left" },
    options: [
      { type: "todo_list", key: "id", label: "Items" },
      { type: "text", key: "custom_text", label: "Title" },
      { type: "toggle", key: "todo_hide_done", label: "Hide finished items" },
    ],
  },
];

export function widgetDef(kind: string): WidgetDef | undefined {
  return WIDGETS.find((w) => w.kind === kind);
}

let counter = 0;
export function newWidget(kind: DesktopWidgetKind): DesktopWidget {
  const def = widgetDef(kind);
  counter += 1;
  return { ...WIDGET_DEFAULTS, ...(def?.defaults ?? {}), id: `w-${counter}`, kind };
}
