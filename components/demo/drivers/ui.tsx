"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import s from "./rd.module.css";
import { STEP_LABEL, isFinished, type Batch, type InstallProgress, type ItemProgress } from "./data";

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

/** A CSS custom property for inline styles ("--i": 3). */
export const vars = (v: Record<string, string | number>) => v as CSSProperties;

// ------------------------------------------------------------------ words and numbers (same rules as the app)

/** "1.5 GB" in decimal units, like Windows Update shows. */
export function humanSize(bytes: number): string {
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  if (bytes < 1000) return `${Math.round(bytes)} bytes`;
  let v = bytes;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-05-17" -> "May 17, 2024". */
export function driverDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "May 17, 2024, 3:05 PM". */
export function dateTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "just now", "5 min ago", "3 hr ago", "2 days ago". */
export function ago(ms: number, now: number): string {
  const sec = Math.max(0, (now - ms) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  const d = Math.floor(sec / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** Windows' device class names in plain words. */
const KIND: Record<string, string> = {
  net: "Network",
  media: "Sound",
  display: "Graphics",
  monitor: "Screen",
  hidclass: "Input device",
  keyboard: "Keyboard",
  mouse: "Mouse",
  usb: "USB",
  bluetooth: "Bluetooth",
  diskdrive: "Drive",
  scsiadapter: "Storage controller",
  camera: "Camera",
  printqueue: "Printer",
  battery: "Battery",
  biometric: "Fingerprint reader",
  system: "System",
  firmware: "Firmware",
  softwarecomponent: "Software part",
  volume: "Drive",
};
export const kindName = (cls: string | null | undefined): string => (cls ? (KIND[cls.toLowerCase()] ?? cls) : "");

// ------------------------------------------------------------------ motion (ui/motion.tsx)

/** A number that counts up (or down) to `value` over `ms`. */
export function useCountUp(value: number, ms = 450, start?: number): number {
  const [shown, setShown] = useState(start ?? value);
  const shownRef = useRef(start ?? value);
  useEffect(() => {
    const from = shownRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(from + (value - from) * e);
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

/** A value that glides toward `target` (every frame, ~`rate` of the way). */
export function useGlide(target: number, rate = 0.12): number {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const d = target - cur.current;
      cur.current = Math.abs(d) < 0.01 ? target : cur.current + d * rate;
      setV(cur.current);
      if (cur.current !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, rate]);
  return v;
}

export const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ------------------------------------------------------------------ icons (the app's own set, ui/icons.tsx)

type P = { size?: number; className?: string };

function Svg({ size = 20, className, children, fill = false }: P & { children: ReactNode; fill?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconChip = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
  </Svg>
);
export const IconDisplay = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M9 20h6M12 16.5V20" />
  </Svg>
);
export const IconNetwork = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconSpeaker = (p: P) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
);
export const IconBluetooth = (p: P) => (
  <Svg {...p}>
    <path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9" />
  </Svg>
);
export const IconUsb = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v15M12 3l-2 3h4zM12 13l-4-2.5V8M12 15.5l4-2.5V10.5" />
    <rect x="6.8" y="6.5" width="2.4" height="2" rx="0.4" />
    <circle cx="16" cy="9.5" r="1.1" />
    <circle cx="12" cy="19.5" r="1.6" />
  </Svg>
);
const IconMouse = (p: P) => (
  <Svg {...p}>
    <rect x="6.5" y="3" width="11" height="18" rx="5.5" />
    <path d="M12 7v3" />
  </Svg>
);
const IconKeyboard = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7.5 14h9" />
  </Svg>
);
const IconDrive = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M7 10h6M7 13.5h4" />
    <circle cx="17" cy="14" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
const IconCamera = (p: P) => (
  <Svg {...p}>
    <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);
const IconPrinter = (p: P) => (
  <Svg {...p}>
    <path d="M7 9V3.5h10V9M7 17H4.5v-8h15v8H17" />
    <rect x="7" y="14" width="10" height="6.5" rx="1" />
  </Svg>
);
const IconBattery = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="7.5" width="16" height="9" rx="2" />
    <path d="M21 10.5v3M6 10.5v3M9 10.5v3" />
  </Svg>
);
const IconPuzzle = (p: P) => (
  <Svg {...p}>
    <path d="M5 7h3.5a2 2 0 1 1 4 0H16v3.5a2 2 0 1 1 0 4V18h-3.5a2 2 0 1 0-4 0H5v-3.5a2 2 0 1 0 0-4z" />
  </Svg>
);
const IconFinger = (p: P) => (
  <Svg {...p}>
    <path d="M7 18.5a10 10 0 0 1-1.5-5.5A6.5 6.5 0 0 1 18 10.5M9.5 20a12 12 0 0 1-1-5 3.5 3.5 0 0 1 7 0c0 1.5.2 3 .7 4.5M12 15c0 2 .3 3.7 1 5.5M18.5 14.5c0 1.3.1 2.6.4 3.8" />
  </Svg>
);

/** An icon for a Windows device class ("Display", "Net", "MEDIA" ...). */
export function DeviceIcon({ cls, size }: { cls: string; size?: number }) {
  const k = cls.toLowerCase();
  const p = { size };
  if (k === "display" || k === "monitor") return <IconDisplay {...p} />;
  if (k === "net") return <IconNetwork {...p} />;
  if (k === "media") return <IconSpeaker {...p} />;
  if (k === "bluetooth") return <IconBluetooth {...p} />;
  if (k === "usb") return <IconUsb {...p} />;
  if (k === "mouse") return <IconMouse {...p} />;
  if (k === "keyboard" || k === "hidclass") return <IconKeyboard {...p} />;
  if (k === "diskdrive" || k === "scsiadapter" || k === "volume") return <IconDrive {...p} />;
  if (k === "camera") return <IconCamera {...p} />;
  if (k === "printqueue") return <IconPrinter {...p} />;
  if (k === "battery") return <IconBattery {...p} />;
  if (k === "softwarecomponent") return <IconPuzzle {...p} />;
  if (k === "biometric") return <IconFinger {...p} />;
  return <IconChip {...p} />;
}

export const IconBox = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </Svg>
);
export const IconHistory = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" />
    <path d="M3.5 4v4.5H8M12 7.5V12l3 2" />
  </Svg>
);
export const IconWrench = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2z" />
  </Svg>
);
export const IconUpdate = (p: P) => (
  <Svg {...p}>
    <path d="M12 16V5m-4 4l4-4 4 4" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
);
export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </Svg>
);
export const IconGear = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
);
export const IconBack = (p: P) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const IconChevron = (p: P) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const IconRefresh = (p: P) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.7L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.7L20 16m0 4v-4h-4" />
  </Svg>
);
export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IconInfo = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8h0.01" />
  </Svg>
);
export const IconHelp = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17h0.01" />
  </Svg>
);
export const IconWarn = (p: P) => (
  <Svg {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17h0.01" />
  </Svg>
);
export const IconX = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 13h9l1-13" />
  </Svg>
);
export const IconGamepad = (p: P) => (
  <Svg {...p}>
    <path d="M7 7h10a4.5 4.5 0 0 1 4.4 5.4l-.9 4.2a2.3 2.3 0 0 1-4 1L14.6 16H9.4l-1.9 1.6a2.3 2.3 0 0 1-4-1l-.9-4.2A4.5 4.5 0 0 1 7 7z" />
    <path d="M7.5 10.5v3M6 12h3M15.5 11h.01M17.5 13h.01" />
  </Svg>
);
export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v11m-4-4l4 4 4-4" />
    <path d="M5 19h14" />
  </Svg>
);

export function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1zm-2 5V4.5a2 2 0 1 1 4 0V6H6z" />
    </svg>
  );
}

// ------------------------------------------------------------------ controls (ui/controls.tsx, ui/Modal.tsx)

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button type="button" className={c("switch", checked && "on")} aria-pressed={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}>
      <span className={c("switch-knob")} />
    </button>
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

export function SkeletonRows({ n = 4 }: { n?: number }) {
  return (
    <div className={c("sk-rows")} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={c("sk-row")}>
          <span className={c("sk sk-row-icon")} />
          <div className={c("sk-row-main")}>
            <span className={c("sk sk-line")} style={{ width: `${44 + ((i * 17) % 30)}%` }} />
            <span className={c("sk sk-line sm")} style={{ width: `${26 + ((i * 11) % 20)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, children, actions, onCancel }: { title: string; children?: ReactNode; actions: ReactNode; onCancel(): void }) {
  return (
    <div className={c("modal-backdrop")} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={c("card modal-card")} role="dialog" aria-modal="true" aria-label={title}>
        <div className={c("modal-title")}>{title}</div>
        {children}
        <div className={c("modal-actions toolbar")}>{actions}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ install progress (ui/install.tsx)

const SHORT: Partial<Record<ItemProgress["step"], string>> = {
  checking: "Checking",
  restorePoint: "Restore point",
  backingUp: "Backing up",
  needsRestart: "Restart needed",
  failed: "Not installed",
};

export function StepBadge({ item, short = false }: { item: ItemProgress; short?: boolean }) {
  const st = item.step;
  const label = st === "downloading" && item.fraction != null ? `${short ? "" : "Downloading "}${Math.floor(item.fraction * 100)}%` : (short && SHORT[st]) || STEP_LABEL[st];
  const icon =
    st === "done" ? (
      <IconCheck size={12} />
    ) : st === "needsRestart" ? (
      <IconRefresh size={12} />
    ) : st === "failed" || st === "skipped" ? (
      <IconInfo size={12} />
    ) : st === "waiting" ? null : (
      <span className={c("step-spin")} />
    );
  return (
    <span className={c("step-badge", `step-${st}`)}>
      {icon}
      {label}
    </span>
  );
}

/** How far along a row's fill is: half for the download, then a step at a time. */
export function rowFill(item: ItemProgress): number {
  switch (item.step) {
    case "downloading":
      return 0.05 + 0.45 * (item.fraction ?? 0);
    case "checking":
      return 0.55;
    case "restorePoint":
      return 0.6;
    case "backingUp":
      return 0.7;
    case "installing":
      return 0.82;
    case "done":
    case "needsRestart":
      return 1;
    default:
      return 0;
  }
}

const BATCH_NOUN: Record<Batch, [string, string]> = {
  drivers: ["driver", "drivers"],
  components: ["game component", "game components"],
  rollback: ["driver", "drivers"],
  restore: ["driver", "drivers"],
  offline: ["driver", "drivers"],
};

/** What's happening in a batch, then what it did. */
export function InstallBanner({ progress, batches, onClose }: { progress: InstallProgress | null; batches: Batch[]; onClose: () => void }) {
  if (!progress || !batches.includes(progress.batch)) return null;
  const items = progress.items;
  const done = items.filter((i) => isFinished(i.step)).length;
  const [one, many] = BATCH_NOUN[progress.batch];

  if (progress.running) {
    const current = items.find((i) => !isFinished(i.step) && i.step !== "waiting") ?? items.find((i) => !isFinished(i.step));
    const partial = current?.step === "downloading" && current.fraction != null ? current.fraction * 0.5 : current && current.step !== "waiting" ? 0.5 : 0;
    const pct = Math.round(((done + partial) / Math.max(1, items.length)) * 100);
    const title =
      progress.batch === "rollback"
        ? `Rolling back ${items[0]?.name ?? ""}`
        : progress.batch === "restore"
          ? `Restoring ${Math.min(done + 1, items.length)} of ${items.length} ${items.length === 1 ? one : many}`
          : items.length === 1
            ? `Installing ${items[0].name}`
            : `Installing ${Math.min(done + 1, items.length)} of ${items.length} ${many}`;
    return (
      <div className={c("card install-banner running")} role="status">
        <div className={c("ib-head")}>
          <span className={c("step-spin big")} />
          <div className={c("ib-title")}>{title}</div>
          <span className={c("ib-pct num")}>{pct}%</span>
        </div>
        <div className={c("progress-bar")}>
          <div className={c("progress-fill")} style={{ width: `${pct}%` }} />
        </div>
        <div className={c("ib-sub text-muted")}>
          {current ? `${current.name}: ${current.step === "downloading" && current.fraction != null ? `downloading ${Math.floor(current.fraction * 100)}%` : STEP_LABEL[current.step].toLowerCase()}` : "Finishing"}
          {" · "}
          {progress.batch === "components" || progress.batch === "restore"
            ? "A restore point comes first."
            : progress.batch === "rollback"
              ? "A restore point and a backup of the current driver come first."
              : "A restore point and a backup of each old driver come first."}
        </div>
      </div>
    );
  }

  const count = (st: ItemProgress["step"][]) => items.filter((i) => st.includes(i.step)).length;
  const ok = count(["done"]);
  const restart = count(["needsRestart"]);
  const not = count(["failed", "skipped"]);
  const parts = [
    ok > 0 && (progress.batch === "rollback" ? "Rolled back" : `${plural(ok, one, many)} ${progress.batch === "restore" ? "restored" : "installed"}`),
    restart > 0 && `${plural(restart, one, many)} finish${restart === 1 ? "es" : ""} after a restart`,
    not > 0 && `${plural(not, one, many)} not installed`,
  ].filter(Boolean) as string[];
  return (
    <div className={c("card install-banner finished")} role="status">
      <div className={c("ib-head")}>
        <span className={c("ib-mark")}>
          <IconCheck size={15} />
        </span>
        <div className={c("ib-title")}>{parts.join(" · ") || "Nothing was installed"}</div>
        <button className={c("icon-btn icon-btn-sm")} onClick={onClose} aria-label="Close">
          <IconX size={12} />
        </button>
      </div>
      <div className={c("ib-sub text-muted")}>
        {progress.restorePoint && (
          <span className={c("ib-rp")}>
            <IconShield size={12} /> Restore point made first
          </span>
        )}
        {ok + restart > 0 && progress.batch !== "rollback" && <span>Every change can be rolled back from the History tab.</span>}
      </div>
    </div>
  );
}

/** "Restart to finish": stays until the PC restarts or the user says Later. */
export function RestartCard({ needed, busy, onLater, onRestart }: { needed: boolean; busy: boolean; onLater: () => void; onRestart: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (!needed) return null;
  return (
    <>
      <div className={c("card restart-card")} role="status">
        <span className={c("restart-icon")}>
          <IconRefresh size={18} />
        </span>
        <div className={c("restart-body")}>
          <div className={c("restart-title")}>Restart to finish installing</div>
          <div className={c("text-muted")}>Some updates are only used after the PC restarts. Until then the old driver keeps working.</div>
        </div>
        <div className={c("toolbar")}>
          <button className={c("btn btn-secondary btn-small")} onClick={onLater}>
            Later
          </button>
          <button className={c("btn btn-primary btn-small")} onClick={() => setConfirm(true)} disabled={busy}>
            Restart now
          </button>
        </div>
      </div>
      {confirm && (
        <Modal
          title="Restart the PC now?"
          onCancel={() => setConfirm(false)}
          actions={
            <>
              <button className={c("btn btn-secondary")} onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button
                className={c("btn btn-primary")}
                onClick={() => {
                  setConfirm(false);
                  onRestart();
                }}
              >
                Restart now
              </button>
            </>
          }
        >
          <p className={c("modal-copy")}>Save your work in other apps first. The PC restarts in a few seconds.</p>
        </Modal>
      )}
    </>
  );
}
