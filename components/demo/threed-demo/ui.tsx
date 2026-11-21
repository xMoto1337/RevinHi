"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import s from "./t3.module.css";

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

// ------------------------------------------------------------------ units (same rules as the app's core/units.ts)

export type Unit = "mm" | "in";
export const MM_PER_IN = 25.4;
const UNIT_MM: Record<string, number> = { mm: 1, cm: 10, m: 1000, in: MM_PER_IN, inch: MM_PER_IN, inches: MM_PER_IN, '"': MM_PER_IN, "''": MM_PER_IN, ft: 304.8, "'": 304.8 };
const unitToMm = (u: Unit) => (u === "in" ? MM_PER_IN : 1);
const TERM = /^([+-]?)\s*((?:\d+(?:\.\d*)?|\.\d+)(?:\/\d+)?)\s*([a-z"']*)\s*/i;

/** "50", "50mm", "2in", '1.5"', "2in + 3mm" -> millimeters (bare numbers are in `unit`). */
export function parseLength(input: string, unit: Unit): number | null {
  let str = input.trim().toLowerCase();
  if (!str) return null;
  let total = 0;
  let first = true;
  while (str.length) {
    const m = str.match(TERM);
    if (!m) return null;
    const [whole, sign, num, raw] = m;
    if (!first && !sign) return null;
    const [a, b] = num.split("/");
    const value = b ? Number(a) / Number(b) : Number(a);
    if (!Number.isFinite(value)) return null;
    const f = raw ? UNIT_MM[raw] : unitToMm(unit);
    if (f === undefined) return null;
    total += (sign === "-" ? -1 : 1) * value * f;
    str = str.slice(whole.length);
    first = false;
  }
  return Number.isFinite(total) ? total : null;
}

/** Plain number in `unit`: mm up to 2 decimals, inches up to 3. */
export function formatLength(mm: number, unit: Unit): string {
  const v = mm / unitToMm(unit);
  const r = Number(v.toFixed(unit === "in" ? 3 : 2));
  return String(Object.is(r, -0) ? 0 : r);
}

export const formatSize = (size: number[], unit: Unit) => `${size.map((v) => formatLength(v, unit)).join(" × ")} ${unit}`;

// ------------------------------------------------------------------ icons (the app's ui/icons.tsx set)

const P = {
  cube: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9",
  cylinder: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6",
  sphere: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12c0 1.9 4 3.4 9 3.4s9-1.5 9-3.4",
  cone: "M12 3l7 15M12 3L5 18M5 18c0 1.7 3.1 3 7 3s7-1.3 7-3-3.1-3-7-3-7 1.3-7 3z",
  torus: "M12 6c5 0 9 2.7 9 6s-4 6-9 6-9-2.7-9-6 4-6 9-6zM8.5 12c0-.9 1.6-1.7 3.5-1.7s3.5.8 3.5 1.7",
  wedge: "M3 18h18L3 7v11zM3 7l4-3 14 14M21 18l-4 2H3",
  tube: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM9 6c0-.6 1.3-1 3-1s3 .4 3 1M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z",
  heart: "M12 20s-7.5-4.6-9-9.4C2 7.3 4.3 4.5 7.3 4.5c2 0 3.6 1.2 4.7 2.9 1.1-1.7 2.7-2.9 4.7-2.9 3 0 5.3 2.8 4.3 6.1-1.5 4.8-9 9.4-9 9.4z",
  plus: "M12 5v14M5 12h14",
  cut: "M4 4h10v10H4zM10 10h10v10H10z",
  join: "M4 4h10v6h6v10H10v-6H4z",
  draw: "M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3",
  text: "M5 6V4h14v2M12 4v16M9 20h6",
  logo: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5a1.5 1.5 0 1 0 0-.01",
  generate: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z",
  measure: "M3 16L16 3l5 5L8 21zM7 12l2 2M10 9l2 2M13 6l2 2",
  export: "M12 15V3M8 7l4-4 4 4M5 13v6h14v-6",
  undo: "M9 7H4V2M4 7c2-2.6 4.8-4 8-4a8 8 0 1 1-7.7 10",
  redo: "M15 7h5V2M20 7c-2-2.6-4.8-4-8-4a8 8 0 1 0 7.7 10",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff: "M3 3l18 18M10.6 5.1C11 5 11.5 5 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  unlock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 7.7-1.5",
  ghost: "M5 21V10a7 7 0 0 1 14 0v11l-2.3-1.7L14.3 21 12 19.3 9.7 21l-2.4-1.7L5 21zM9.5 10h.01M14.5 10h.01",
  folder: "M3 6h6l2 2h10v11H3z",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronLeft: "M15 6l-6 6 6 6",
  foldAll: "M7 13l5-5 5 5M7 19l5-5 5 5",
  unfoldAll: "M7 5l5 5 5-5M7 11l5 5 5-5",
  settings:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  trash: "M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3",
  copy: "M8 8h12v12H8zM16 8V4H4v12h4",
  file: "M6 3h8l5 5v13H6zM14 3v5h5",
  magnet: "M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4zM6 8h4M14 8h4",
  move: "M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3",
  rotate: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
  scale: "M4 14v6h6M4 20l7-7M20 10V4h-6M20 4l-7 7",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  wireframe: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l16 9M20 7.5l-16 9M12 3v18",
  xray: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z M4 7.5l8 4.5 8-4.5M12 12v9",
  section: "M4 4h16v16H4zM4 12h16M8 8l8 8",
  light: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  circle: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 9a4 4 0 0 1 4-2",
  check: "M5 12l5 5 9-10",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
  close: "M6 6l12 12M18 6L6 18",
  hole: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM7 7l10 10M12 3.5l8.5 8.5M3.5 12l8.5 8.5",
  bake: "M4 20h16M6 16h12l-1-9H7zM9 7V5a3 3 0 0 1 6 0v2",
  bed: "M3 15l9-5 9 5-9 5-9-5zM3 15v2l9 5 9-5v-2",
  frame: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
  group: "M3 3h8v8H3zM13 13h8v8h-8zM13 3h8v8h-8zM3 13h8v8H3z",
  ungroup: "M3 3h7v7H3zM14 14h7v7h-7z",
  split: "M4 4h7v16H4zM13 4h7v16h-7M12 2v20",
  pointer: "M5 3l6 16 2.5-6.5L20 10 5 3z",
  polyline: "M3 18l6-8 5 5 7-10M3 18h.01M9 10h.01M14 15h.01M21 5h.01",
  rect: "M4 6h16v12H4z",
  circle2: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z",
  arc: "M4 18a10 10 0 0 1 16 0M4 18h.01M20 18h.01",
  hexagon: "M12 3l8 4.5v9L12 21l-8-4.5v-9z",
  pen: "M12 19l7-7 2 2-7 7zM18 13l-1.5-7.5L3 3l2.5 13.5L13 18zM3 3l7.6 7.6M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  offset: "M7 7h10v10H7zM3 3h18v18H3z",
  mirror: "M12 3v18M9 6L3 18h6zM15 6l6 12h-6z",
  pattern: "M3 9h5v6H3zM10 9h5v6h-5zM17 9h4v6h-4",
  radial: "M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M5.3 18.7l2.8-2.8M15.9 8.1l2.8-2.8",
  layflat: "M3 20h18M7 16l5-9 5 9z",
  ruler: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  angle: "M4 20h16M4 20L15 6M9 20a5 5 0 0 0-2-4",
  thickness: "M4 4v16M20 4v16M8 12h8M8 12l2-2M8 12l2 2M16 12l-2-2M16 12l-2 2",
  raise: "M3 19h18M7 19v-6h10v6M12 3v7M9 6l3-3 3 3",
  engrave: "M3 7h18M7 7v6h10V7M12 21v-7M9 18l3 3 3-3",
  tag: "M3 12V4h8l10 10-8 8L3 12zM8 8.5a.5.5 0 1 0 0-.01",
  sign: "M3 6h18v10H3zM12 16v5M8 21h8",
  stamp: "M8 3h8v6l3 3H5l3-3zM4 15h16v3H4zM6 21h12",
  photo: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5a1.5 1.5 0 1 0 0-.01",
  fix: "M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.4-.6-.6-2.4 2.4-2.4z",
  sculpt: "M18 3l3 3-9.5 9.5-3.5.5.5-3.5L18 3zM15 6l3 3M3 21c1.5 0 3-1 3-3a2 2 0 0 0-4 0c0 1-.5 2-1 3h2z",
  printer: "M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",
  send: "M4 12l16-8-6 16-2.5-6.5L4 12zM11.5 13.5L20 4",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  inspect: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5L21 21M8 10.5l2 2 3.5-4",
  wrap: "M4 6c2.5-2 5.5-2 8 0s5.5 2 8 0M4 12c2.5-2 5.5-2 8 0s5.5 2 8 0M4 18c2.5-2 5.5-2 8 0s5.5 2 8 0",
  hollow: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  splitBed: "M3 15l9-5 9 5-9 5-9-5zM12 4v16M8 6l4-2 4 2",
  bolt: "M8 3h8l2 3-2 3H8L6 6zM10 9v12h4V9M10 12l4 1.5M10 15l4 1.5M10 18l4 1.5",
  nut: "M7.5 4h9l4.5 8-4.5 8h-9L3 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  threadHole: "M4 6h16v14H4zM9 6v14M15 6v14M9 9l6 2M9 13l6 2M9 17l6 2",
  hinge: "M3 9h7v6H3zM14 9h7v6h-7zM10 8h4v8h-4zM12 6v12",
  flexi: "M2.5 13c1.6-3.2 3.4-3.2 5 0s3.4 3.2 5 0 3.4-3.2 5 0 2.6 2.4 4 1M7.5 9.5v7M12.5 9.5v7M17.5 9.5v7",
  gear: "M12 2l1.5 3 3.2-1 .4 3.3 3.2 1-1.4 3 2 2.7-3 1.5.4 3.3-3.3-.2L12 22l-1.9-2.6-3.3.2.4-3.3-3-1.5 2-2.7-1.4-3 3.2-1 .4-3.3 3.2 1zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  clip: "M3 18h18M5 18V8h3v10M8 11h11l2-3h-4",
  boxLid: "M4 10h16v10H4zM3 6h18v4H3zM9 13h6",
  textPlate: "M3 7h18v10H3zM8 10h8M12 10v5",
  paintBrush: "M14 4l6 6-8 8-6-6zM6 12l-3 3c-1 1-1 3 1 4s3 0 4-1l3-3",
  palette: "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5 1-2 2.5-2H18a3 3 0 0 0 3-3c0-6-4-11-9-11zM7.5 11h.01M10 7h.01M15 7.5h.01",
  addPlane: "M4 6l8-3 8 3v12l-8 3-8-3zM12 9v6M9 12h6",
} as const;

export type IconName = keyof typeof P;

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={P[name]} />
    </svg>
  );
}

export function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1zm-2 5V4.5a2 2 0 1 1 4 0V6H6z" />
    </svg>
  );
}

// ------------------------------------------------------------------ controls (ui/controls.tsx)

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" className={c("switch", checked && "on")} aria-pressed={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}>
      <span className={c("switch-knob")} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className={c("segmented")}>
      {options.map((o) => (
        <button key={o.value} type="button" className={c(o.value === value && "active")} title={o.title} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
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

export function Modal({ title, children, actions, onCancel, className }: { title: string; children?: ReactNode; actions: ReactNode; onCancel: () => void; className?: string }) {
  return (
    <div className={c("modal-backdrop")} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={c("card modal-card", className)} role="dialog" aria-modal="true" aria-label={title}>
        <div className={c("modal-title")}>{title}</div>
        {children}
        <div className={c("modal-actions toolbar")}>{actions}</div>
      </div>
    </div>
  );
}

/** A trigger and a drop-down panel that closes on an outside click (ui/Menu.tsx). */
export function Menu({
  trigger,
  children,
  className,
  align = "left",
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  align?: "left" | "right" | "up";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);
  return (
    <div className={c("menu-wrap")} ref={ref}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div className={c("menu-panel", align === "right" ? "menu-right" : "menu-left", align === "up" && "menu-up", className)} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ onClick, hint, children, disabled }: { onClick: () => void; hint?: string; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" role="menuitem" className={c("menu-item")} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      {hint && <span className={c("menu-hint")}>{hint}</span>}
    </button>
  );
}

export const MenuSep = () => <div className={c("menu-sep")} />;

// ------------------------------------------------------------------ properties sections (ui/Fold.tsx)

const folds = new Map<string, boolean>();

export function PropSection({ id, title, defaultOpen = true, children }: { id: string; title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(() => folds.get(id) ?? defaultOpen);
  return (
    <section className={c("psec", open && "open")}>
      <div className={c("psec-head")}>
        <button
          type="button"
          className={c("psec-toggle")}
          aria-expanded={open}
          onClick={() => {
            folds.set(id, !open);
            setOpen(!open);
          }}
        >
          <Icon name={open ? "chevronDown" : "chevronRight"} size={12} />
          <span>{title}</span>
        </button>
      </div>
      {open && <div className={c("psec-body")}>{children}</div>}
    </section>
  );
}

// ------------------------------------------------------------------ typed value fields (ui/fields.tsx)

function useField(display: string, parse: (v: string) => number | null, commit: (v: number) => void, current: number, step: number, clamp: (v: number) => number) {
  const [text, setText] = useState(display);
  // While the user is typing the box shows their text; otherwise it follows the value.
  const [typing, setTyping] = useState(false);
  const [bad, setBad] = useState(false);
  const shown = typing ? text : display;

  const apply = (v: string) => {
    const n = parse(v);
    if (n === null) {
      setBad(true);
      window.setTimeout(() => setBad(false), 900);
      setText(display);
      return;
    }
    const cl = clamp(n);
    if (Math.abs(cl - current) > 1e-9) commit(cl);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      if (typing) apply(text);
      setTyping(false);
      (e.target as HTMLInputElement).select();
    } else if (e.key === "Escape") {
      setTyping(false);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const d = (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
      setTyping(false);
      commit(clamp(Math.round((current + d) * 1e6) / 1e6));
    }
  };

  return {
    value: shown,
    className: c("field-input", bad && "bad"),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      setTyping(true);
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    onBlur: () => {
      if (typing) apply(text);
      setTyping(false);
    },
    onKeyDown,
    spellCheck: false,
  };
}

function Shell({ label, title, suffix, children }: { label?: string; title?: string; suffix?: string; children: ReactNode }) {
  return (
    <label className={c("field")} title={title}>
      {label && <span className={c("field-label")}>{label}</span>}
      {children}
      {suffix && <span className={c("field-suffix")}>{suffix}</span>}
    </label>
  );
}

const clampTo = (min?: number, max?: number) => (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

type Base = { label?: string; title?: string; disabled?: boolean; min?: number; max?: number };

export function LengthField({ valueMm, unit, onCommit, label, title, disabled, min, max }: Base & { valueMm: number; unit: Unit; onCommit: (mm: number) => void }) {
  const props = useField(formatLength(valueMm, unit), (v) => parseLength(v, unit), onCommit, valueMm, unit === "in" ? MM_PER_IN / 16 : 1, clampTo(min, max));
  return (
    <Shell label={label} title={title ?? 'Type a size in mm or inches, e.g. 50, 2in, 1.5"'} suffix={unit}>
      <input {...props} disabled={disabled} />
    </Shell>
  );
}

export function AngleField({ value, onCommit, label, title, disabled }: Base & { value: number; onCommit: (deg: number) => void }) {
  const props = useField(
    String(Number(value.toFixed(2))),
    (v) => {
      const n = Number(v.trim().replace(/\s*(°|deg|degrees?)$/i, ""));
      return v.trim() && Number.isFinite(n) ? n : null;
    },
    onCommit,
    value,
    1,
    (v) => v,
  );
  return (
    <Shell label={label} title={title} suffix="°">
      <input {...props} disabled={disabled} />
    </Shell>
  );
}

export function CountField({ value, onCommit, label, title, disabled, min, max, suffix }: Base & { value: number; onCommit: (n: number) => void; suffix?: string }) {
  const props = useField(
    String(Number(value.toFixed(3))),
    (v) => {
      const n = Number(v.trim().replace(/%$/, ""));
      return v.trim() && Number.isFinite(n) ? n : null;
    },
    onCommit,
    value,
    1,
    clampTo(min, max),
  );
  return (
    <Shell label={label} title={title} suffix={suffix}>
      <input {...props} disabled={disabled} />
    </Shell>
  );
}

// ------------------------------------------------------------------ crops of the real app's screenshot (AI pictures)

const SHOT = "/3d/screens/09-ai-generate.webp";

/** A piece of the real Generate screenshot (coordinates in its 1920 x 1080 frame) as a background. */
export function crop(x: number, y: number, w: number, h: number): React.CSSProperties {
  return {
    backgroundImage: `url(${SHOT})`,
    backgroundSize: `${(1920 / w) * 100}% ${(1080 / h) * 100}%`,
    backgroundPosition: `${(x / (1920 - w)) * 100}% ${(y / (1080 - h)) * 100}%`,
  };
}
