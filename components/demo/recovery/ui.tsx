"use client";

import type { ReactNode } from "react";
import s from "./rr.module.css";
import type { Drive } from "./data";

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

// ------------------------------------------------------------------ formatting (same rules as the app)

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
const pad = (n: number) => String(n).padStart(2, "0");

/** "Jul 21, 2026" (fixed format, so the server and the browser render the same text). */
export function formatDay(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "Jul 21, 2026 07:57 PM" */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${formatDay(ms)} ${pad(h % 12 || 12)}:${pad(d.getUTCMinutes())} ${h < 12 ? "AM" : "PM"}`;
}

export const n = (v: number) => v.toLocaleString("en-US");

// ------------------------------------------------------------------ icons (copied from the app's icon set)

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

export const IconSsd = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M7 10h6M7 13.5h4" />
    <circle cx="17" cy="14" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconHdd = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <circle cx="12" cy="10.5" r="4" />
    <circle cx="12" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    <path d="M14.5 13.5l2.5 3.5M7.5 18h2" />
  </Svg>
);
export const IconUsb = (p: P) => (
  <Svg {...p}>
    <path d="M9 3h6v5H9z" />
    <rect x="7" y="8" width="10" height="13" rx="2.5" />
    <path d="M11 5h0.01M13 5h0.01" />
    <path d="M10 14h4" />
  </Svg>
);
export const IconSd = (p: P) => (
  <Svg {...p}>
    <path d="M8 3h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
    <path d="M9 3v4M12 3v4M15 3v4" />
  </Svg>
);
export const IconImage = (p: P) => (
  <Svg {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
    <ellipse cx="12" cy="13.5" rx="3.5" ry="1.4" />
    <path d="M8.5 13.5v2.6c0 .8 1.6 1.4 3.5 1.4s3.5-.6 3.5-1.4v-2.6" />
  </Svg>
);
export const IconPhoto = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M21 16l-5-5-8 8" />
  </Svg>
);
export const IconVideo = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="M16 10.5l5-3v9l-5-3z" />
  </Svg>
);
export const IconMusic = (p: P) => (
  <Svg {...p}>
    <path d="M9 18V6l11-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
);
export const IconDoc = (p: P) => (
  <Svg {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 15.5h6M9 9h2" />
  </Svg>
);
export const IconArchive = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <path d="M12 3v2M12 7v2M12 11v2" />
    <rect x="10.5" y="14" width="3" height="3.5" rx="0.8" />
  </Svg>
);
export const IconFile = (p: P) => (
  <Svg {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
  </Svg>
);
export const IconFolder = (p: P) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Svg>
);
export const IconPartition = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M10 6v12" />
  </Svg>
);
export const IconWrite = (p: P) => (
  <Svg {...p}>
    <path d="M5 4h7l3 3v5" />
    <path d="M12 4v3h3" />
    <path d="M5 4v10" />
    <rect x="13" y="14" width="7" height="7" rx="1.5" />
    <path d="M5 17.5h5m-2-2l2 2-2 2" />
  </Svg>
);
export const IconBackup = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="11" height="8" rx="2" />
    <rect x="10" y="12" width="11" height="8" rx="2" />
    <path d="M6 15v2.5a1.5 1.5 0 0 0 1.5 1.5H8m-1.5-2L8 19l-1.5 1.5" />
  </Svg>
);
export const IconHealth = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 8.5c0 5-8.5 11-8.5 11s-8.5-6-8.5-11A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 2.5z" />
    <path d="M6 12h3l1.5-2.5 2 5 1.5-2.5H18" />
  </Svg>
);
export const IconLost = (p: P) => (
  <Svg {...p}>
    <path d="M11 4a7 7 0 1 0 7 7h-7z" />
    <path d="M14 3.5a6.5 6.5 0 0 1 6.5 6.5H14z" strokeDasharray="2 2" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);
export const IconSectors = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M9 4v16" />
    <path d="M12 13h2M16 13h2M12 16.5h2M16 16.5h2" />
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
export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Svg>
);
export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconRefresh = (p: P) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.7L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.7L20 16m0 4v-4h-4" />
  </Svg>
);
export const IconPause = (p: P) => (
  <Svg {...p}>
    <path d="M9 6v12M15 6v12" />
  </Svg>
);
export const IconPlay = (p: P) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </Svg>
);
export const IconStop = (p: P) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
  </Svg>
);
export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const IconGuess = (p: P) => (
  <Svg {...p}>
    <path d="M5 19L15 9" />
    <path d="M17 3v3M15.5 4.5h3M20 8v2M19 9h2M12 4v1.5M11.25 4.75h1.5" />
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
export const IconOpen = (p: P) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1" />
    <path d="M3 7v10a2 2 0 0 0 2 2h12.5l3.5-8H7l-4 8" />
  </Svg>
);
export const IconWindows = (p: P) => (
  <Svg {...p} fill>
    <path d="M3 5.5l7.5-1v7H3zM11.5 4.3L21 3v8.5h-9.5zM3 12.5h7.5v7L3 18.5zM11.5 12.5H21V21l-9.5-1.3z" />
  </Svg>
);
export const IconGrid = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Svg>
);
export const IconList = (p: P) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.2" />
    <circle cx="4.5" cy="12" r="1.2" />
    <circle cx="4.5" cy="18" r="1.2" />
  </Svg>
);
export const IconLayers = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 12.5l9 5 9-5" />
    <path d="M3 17l9 5 9-5" />
  </Svg>
);
export const IconRecover = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v11m-4-4l4 4 4-4" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
);
export const IconLock = ({ size = 10 }: P) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm2 0h6V7a3 3 0 0 0-6 0z" />
  </svg>
);
export const IconSave = (p: P) => (
  <Svg {...p}>
    <path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
    <path d="M8 4v5h7V4M8 20v-6h8v6" />
  </Svg>
);

export type Kind = "pictures" | "videos" | "music" | "documents" | "archives" | "other";
export const KIND_ORDER: Kind[] = ["pictures", "videos", "music", "documents", "archives", "other"];
export const KIND_LABEL: Record<Kind, string> = {
  pictures: "Photos",
  videos: "Videos",
  music: "Music",
  documents: "Documents",
  archives: "Archives",
  other: "Other",
};

export function KindIcon({ kind, size }: { kind: string; size?: number }) {
  switch (kind) {
    case "pictures":
      return <IconPhoto size={size} />;
    case "videos":
      return <IconVideo size={size} />;
    case "music":
      return <IconMusic size={size} />;
    case "documents":
      return <IconDoc size={size} />;
    case "archives":
      return <IconArchive size={size} />;
    case "folder":
      return <IconFolder size={size} />;
    case "volume":
      return <IconPartition size={size} />;
    default:
      return <IconFile size={size} />;
  }
}

// ------------------------------------------------------------------ controls

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" className={c("switch", checked && "on")} aria-pressed={checked} aria-label={label} onClick={() => onChange(!checked)}>
      <span className={c("switch-knob")} />
    </button>
  );
}

export function Modal({
  title,
  children,
  actions,
  onCancel,
  wide,
}: {
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onCancel: () => void;
  wide?: boolean;
}) {
  return (
    <div className={c("modal-backdrop")} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={c("card modal-card", wide && "modal-wide")} role="dialog" aria-modal="true" aria-label={title}>
        <div className={c("modal-title")}>{title}</div>
        {children}
        <div className={c("modal-actions toolbar")}>{actions}</div>
      </div>
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
      <div>{children}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={c("card")}>
      <div className={c("section-title")}>{title}</div>
      {children}
    </div>
  );
}

export function ProChip({ large }: { large?: boolean }) {
  return (
    <span className={c("pro-chip", large && "pro-chip-lg")}>
      <IconLock size={large ? 10 : 9} />
      PRO
    </span>
  );
}

export function DriveIcon({ d, size }: { d: Pick<Drive, "bus">; size?: number }) {
  if (d.bus === "virtual") return <IconImage size={size} />;
  if (d.bus === "sd") return <IconSd size={size} />;
  if (d.bus === "usb") return <IconUsb size={size} />;
  if (d.bus === "nvme") return <IconSsd size={size} />;
  return <IconHdd size={size} />;
}
