"use client";

import { createContext, useContext, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import s from "./rd.module.css";
import { FEATURES, PRO_NAME, entitlements, type Entitlements, type Feature } from "./license";
import { hsvToRgb, parseHex, rgbToHsv, rgbaCss, toHex } from "./color";

/** Class names as the real app writes them ("btn btn-primary"), mapped to this module's scoped names. */
export function c(...names: (string | false | null | undefined)[]): string {
  return names
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => s[n] ?? n)
    .join(" ");
}

// ------------------------------------------------------------------ app state (the real app keeps this in settings.tsx + Rust)

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface SavedLocation {
  id: string;
  label: string;
  lat: number;
  lon: number;
  is_address: boolean;
  range_miles?: number | null;
  lightning_alerts?: boolean | null;
  alerts_notify?: boolean | null;
}

export interface DockItem {
  id: string;
  name: string;
  target: string;
  kind: "app" | "folder" | "url";
}

export interface UserPreset {
  id: string;
  name: string;
  created: string;
  layout: { wallpaper: unknown; widgets: unknown[]; effects: unknown[] };
}

/** The settings the preview uses, with the real app's defaults (settings.tsx). */
export const DEFAULT_SETTINGS = {
  notifications: true,
  notify_min_severity: "minor" as "minor" | "moderate" | "severe" | "extreme",
  alert_poll_secs: 300,
  basemap: "dark" as "dark" | "liberty" | "positron" | "bright",
  radar_opacity: 0.75,
  radar_saturation: 0,
  radar_contrast: 0,
  smoothing: "smooth" as "smooth" | "sharp",
  tile_zoom_cap: 10,
  live_site: true,
  live_site_hd: true,
  show_alert_polygons: true,
  show_radar_sites: false,
  site_ripples: true,
  alert_poly_level: "watches" as "warnings" | "watches" | "all",
  show_lightning: true,
  lightning_minutes: 30,
  lightning_effects: true,
  lightning_radius_miles: 10,
  lightning_ring: true,
  lightning_notify: true,
  lightning_notify_cooldown_min: 15,
  replay_speed: 2,
  loop_minutes: 60,
  loop_end_pause_ms: 3000,
  autoplay: false,
  frame_refresh_secs: 20,
  default_zoom: 6,
  show_pins: true,
  nowcast: true,
  pin_labels_always: false,
  pin_size: "medium" as "small" | "medium" | "large",
  time_format: "local12" as "local12" | "local24" | "utc",
  temp_unit: "f" as "f" | "c",
  wind_unit: "mph" as "mph" | "kph",
  widget_opacity: 0.92,
  widget_keep_on_top: true,
  usage_stats: true,
  widget_seamless: true,
  size_current: "medium" as SizePreset,
  size_forecast: "medium" as SizePreset,
  size_radar: "medium" as SizePreset,
  size_storm: "medium" as SizePreset,
  widget_location_current: "",
  widget_location_forecast: "",
  widget_location_radar: "",
  widget_location_storm: "",
  cur_show_feels_like: true,
  cur_show_humidity: true,
  cur_show_wind: true,
  fc_periods: 4,
  fc_mode: "daily" as "daily" | "hourly",
  fc_style: "days" as "list" | "days" | "graph",
  radar_palette: "classic" as "classic" | "vivid" | "aurora" | "ice",
  radar_legend: true,
  taskbar_mode: "normal" as "normal" | "clear" | "blur" | "acrylic" | "tint",
  taskbar_color: "#0A0A1499",
  taskbar_follow_presets: true,
  taskbar_align: "default" as "default" | "left" | "center",
  taskbar_search: "default" as "default" | "hidden" | "icon" | "box",
  taskbar_task_view: "default" as "default" | "show" | "hide",
  taskbar_widgets: "default" as "default" | "show" | "hide",
  taskbar_autohide: "default" as "default" | "on" | "off",
  dock_enabled: false,
  dock_items: [] as DockItem[],
  dock_edge: "bottom" as "bottom" | "top" | "left" | "right",
  dock_offset: 12,
  dock_icon_size: 52,
  dock_magnify: 1.5,
  dock_style: "glass" as "glass" | "tint" | "clear",
  dock_tint: "#0A0C14B3",
  dock_on_top: true,
  dock_hide_taskbar: false,
  dock_labels: true,
  user_presets: [] as UserPreset[],
  todos: [
    { id: "t1", text: "Pick up the dry cleaning", done: true },
    { id: "t2", text: "Call Mom back", done: false },
    { id: "t3", text: "Finish the slides for Monday", done: false },
    { id: "t4", text: "Water the plants", done: false },
  ] as TodoItem[],
  fc_show_precip: true,
  fc_show_icons: true,
  radar_widget_zoom: 5.5,
  radar_widget_animate: false,
  radar_widget_controls: true,
  launch_at_login: true,
};
export type SizePreset = "small" | "medium" | "large" | "xl";
export type Settings = typeof DEFAULT_SETTINGS;

export const START_LOCATIONS: SavedLocation[] = [{ id: "loc-okc", label: "Oklahoma City, OK", lat: 35.4676, lon: -97.5164, is_address: false }];

export interface AppApi extends Entitlements {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  setPro: (pro: boolean) => void;
  openPaywall: (feature?: Feature | null) => void;
  locations: SavedLocation[];
  setLocations: (next: SavedLocation[]) => void;
}

export const AppContext = createContext<AppApi | null>(null);
export function useApp(): AppApi {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp outside the preview");
  return v;
}

export function useAppState(): AppApi & { paywall: Feature | null | undefined; closePaywall: () => void } {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [pro, setPro] = useState(false);
  const [paywall, setPaywall] = useState<Feature | null | undefined>(undefined);
  const [locations, setLocations] = useState<SavedLocation[]>(START_LOCATIONS);
  return {
    ...entitlements(pro),
    settings,
    update: (patch) => setSettings((cur) => ({ ...cur, ...patch })),
    reset: () => setSettings((cur) => ({ ...DEFAULT_SETTINGS, todos: cur.todos, user_presets: cur.user_presets })),
    setPro: (p) => {
      setPro(p);
      if (p) setPaywall(undefined);
    },
    openPaywall: (f = null) => setPaywall(f),
    paywall,
    closePaywall: () => setPaywall(undefined),
    locations,
    setLocations,
  };
}

// ------------------------------------------------------------------ time

/** Ticks once a second (the widgets' clock). */
export function useClock(ms = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const p2 = (n: number) => String(n).padStart(2, "0");

export function formatTime(now: Date, use24: boolean, seconds: boolean): string {
  const h = now.getHours();
  const mm = p2(now.getMinutes());
  const ss = seconds ? `:${p2(now.getSeconds())}` : "";
  if (use24) return `${p2(h)}:${mm}${ss}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${mm}${ss} ${h < 12 ? "AM" : "PM"}`;
}

export function formatDate(now: Date, withYear: boolean): string {
  const base = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  return withYear ? `${base}, ${now.getFullYear()}` : base;
}

export function fmtTemp(f: number | null, unit: "f" | "c"): string {
  if (f === null) return "--";
  return unit === "c" ? `${Math.round(((f - 32) * 5) / 9)}°` : `${Math.round(f)}°`;
}

export function fmtWind(mph: number, unit: "mph" | "kph"): string {
  return unit === "kph" ? `${Math.round(mph * 1.609)} km/h` : `${Math.round(mph)} mph`;
}

export function fmtClockTime(d: Date, format: Settings["time_format"]): string {
  if (format === "utc") return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} UTC`;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: format !== "local24" });
}

/** "45s ago" / "3m 12s ago" (radar/Age.tsx). */
export function formatAge(ms: number): string {
  const secs = Math.max(0, Math.round(ms / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ${p2(secs % 60)}s ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

// ------------------------------------------------------------------ controls (ui/controls.tsx)

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button type="button" className={c("switch", checked && "on")} aria-pressed={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}>
      <span className={c("switch-knob")} />
    </button>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (next: T) => void }) {
  return (
    <div className={c("segmented")}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" className={c(o.value === value && "active")} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({ value, min, max, step, onChange, format }: { value: number; min: number; max: number; step: number; onChange: (next: number) => void; format?: (v: number) => string }) {
  return (
    <>
      <input type="range" className={c("range")} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className={c("setting-value")}>{format ? format(value) : value}</span>
    </>
  );
}

export function SettingRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className={c("setting-row")}>
      <div className={c("setting-text")}>
        <div className={c("setting-label")}>{label}</div>
        {hint && <div className={c("setting-hint")}>{hint}</div>}
      </div>
      <div className={c("setting-control")}>{children}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={c("card")}>
      <div className={c("section-title text-muted")}>{title}</div>
      {children}
    </div>
  );
}

export function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button type="button" className={c("chip", on && "on")} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ Free / Pro (license/ui.tsx)

export function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1zm-2 5V4.5a2 2 0 1 1 4 0V6H6z" />
    </svg>
  );
}

export function ProChip({ feature }: { feature: Feature }) {
  const { openPaywall } = useApp();
  return (
    <button
      type="button"
      className={c("pro-chip")}
      title={`${FEATURES[feature].title} is a ${PRO_NAME} feature`}
      onClick={(e) => {
        e.stopPropagation();
        openPaywall(feature);
      }}
    >
      <LockIcon size={9} />
      {PRO_NAME.toUpperCase()}
    </button>
  );
}

/** Pro-only content, still visible to free users: blurred or dimmed behind a lock. */
export function Locked({ feature, children, message, mode = "blur", inline = false }: { feature: Feature; children: ReactNode; message?: string; mode?: "blur" | "dim"; inline?: boolean }) {
  const { pro, openPaywall } = useApp();
  if (pro) return <>{children}</>;
  return (
    <div className={c("locked", `locked-${mode}`, inline && "locked-inline")}>
      <div className={c("locked-content")} aria-hidden="true" inert>
        {children}
      </div>
      <div className={c("locked-overlay")}>
        <span className={c("pro-chip pro-chip-static")}>
          <LockIcon size={9} />
          {PRO_NAME.toUpperCase()}
        </span>
        <span className={c("locked-message")}>{message ?? `${FEATURES[feature].title} is a ${PRO_NAME} feature`}</span>
        <button type="button" className={c("btn btn-buy btn-small")} onClick={() => openPaywall(feature)}>
          Unlock
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ color picker (ui/ColorPicker.tsx)

interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}
const toHsva = (hex: string): Hsva => {
  const col = parseHex(hex);
  return { ...rgbToHsv(col.r, col.g, col.b), a: col.a };
};
const fromHsva = ({ h, s: sat, v, a }: Hsva) => toHex({ ...hsvToRgb(h, sat, v), a });
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function dragger(onMove: (fx: number, fy: number) => void) {
  return (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const apply = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      onMove(clamp01((cx - r.left) / r.width), clamp01((cy - r.top) / r.height));
    };
    apply(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => apply(ev.clientX, ev.clientY);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
}

function ColorPickerPanel({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hsva, setHsva] = useState<Hsva>(() => toHsva(value));
  const [hexText, setHexText] = useState(value);
  const commit = (next: Hsva) => {
    setHsva(next);
    const hex = fromHsva(next);
    setHexText(hex);
    onChange(hex);
  };
  const hueColor = rgbaCss({ ...hsvToRgb(hsva.h, 1, 1), a: 1 });
  const opaque = rgbaCss({ ...hsvToRgb(hsva.h, hsva.s, hsva.v), a: 1 });
  return (
    <div className={c("cp-panel")}>
      <div className={c("cp-sv")} style={{ background: hueColor }} onPointerDown={dragger((fx, fy) => commit({ ...hsva, s: fx, v: 1 - fy }))}>
        <div className={c("cp-sv-white")} />
        <div className={c("cp-sv-black")} />
        <div className={c("cp-cursor")} style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }} />
      </div>
      <div className={c("cp-strip cp-hue")} onPointerDown={dragger((fx) => commit({ ...hsva, h: fx * 360 }))}>
        <div className={c("cp-thumb")} style={{ left: `${(hsva.h / 360) * 100}%` }} />
      </div>
      <div className={c("cp-strip cp-checker")} onPointerDown={dragger((fx) => commit({ ...hsva, a: fx }))}>
        <div className={c("cp-alpha-fill")} style={{ background: `linear-gradient(90deg, transparent, ${opaque})` }} />
        <div className={c("cp-thumb")} style={{ left: `${hsva.a * 100}%` }} />
      </div>
      <div className={c("cp-row")}>
        <span className={c("cp-preview cp-checker")}>
          <span style={{ background: rgbaCss({ ...hsvToRgb(hsva.h, hsva.s, hsva.v), a: hsva.a }) }} />
        </span>
        <input
          className={c("text-input cp-hex")}
          value={hexText}
          spellCheck={false}
          onChange={(e) => {
            const t = e.target.value.trim();
            setHexText(e.target.value);
            if (/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(t)) {
              const next = toHsva(t.startsWith("#") ? t : `#${t}`);
              setHsva(next);
              onChange(fromHsva(next));
            }
          }}
          onBlur={() => setHexText(fromHsva(hsva))}
        />
        <span className={c("setting-value")}>{Math.round(hsva.a * 100)}%</span>
      </div>
    </div>
  );
}

/** Swatch button that opens the HSV + alpha picker. */
export function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  return (
    <span className={c("cp-wrap")} ref={wrap} style={{ position: "relative" }}>
      <button type="button" className={c("cp-swatch cp-checker")} title={value} aria-label="Pick color" onClick={() => setOpen((o) => !o)}>
        <span style={{ background: rgbaCss(parseHex(value)) }} />
      </button>
      {open && (
        <div className={c("cp-popover")} style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", left: "auto" }}>
          <ColorPickerPanel value={value} onChange={onChange} />
        </div>
      )}
    </span>
  );
}
