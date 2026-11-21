"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import s from "./pdf.module.css";

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

/** The preview window is drawn scaled; turn a pointer position into the app's own pixels. */
export function toLocal(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  const k = r.width / (el.offsetWidth || r.width || 1);
  return { x: (clientX - r.left) / k, y: (clientY - r.top) / k };
}

export const PRICE = "$9.99";

// ------------------------------------------------------------------ icons
// Line drawings standing in for the Segoe icon font glyphs the app uses (not every visitor has that font).

type P = { size?: number };

function Svg({ size = 14, children, fill }: P & { children: ReactNode; fill?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconUndo = (p: P) => (
  <Svg {...p}>
    <path d="M5 4L2 7l3 3" />
    <path d="M2.5 7H10a4 4 0 0 1 0 8H7" />
  </Svg>
);
export const IconRedo = (p: P) => (
  <Svg {...p}>
    <path d="M11 4l3 3-3 3" />
    <path d="M13.5 7H6a4 4 0 0 0 0 8h3" />
  </Svg>
);
export const IconRotate = (p: P) => (
  <Svg {...p}>
    <path d="M13 8a5 5 0 1 1-1.6-3.7" />
    <path d="M12 1.5v3h-3" />
  </Svg>
);
export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4" />
  </Svg>
);
export const IconAdd = (p: P) => (
  <Svg {...p}>
    <path d="M8 2.5v11M2.5 8h11" />
  </Svg>
);
export const IconInsertFile = (p: P) => (
  <Svg {...p}>
    <path d="M4 1.5h5l3 3v10H4z" />
    <path d="M9 1.5v3h3M8 7.5v5M5.5 10h5" />
  </Svg>
);
export const IconExtract = (p: P) => (
  <Svg {...p}>
    <path d="M10 2.5h3.5V6M13.5 2.5L8 8" />
    <path d="M12 9.5v4H2.5V4H7" />
  </Svg>
);
export const IconBack = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 8h-11M6.5 4l-4 4 4 4" />
  </Svg>
);
export const IconForward = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </Svg>
);
export const IconFind = (p: P) => (
  <Svg {...p}>
    <circle cx="6.5" cy="6.5" r="4.5" />
    <path d="M10 10l4.5 4.5" />
  </Svg>
);
export const IconPrint = (p: P) => (
  <Svg {...p}>
    <path d="M4 5.5V1.5h8v4M4 11.5H1.5v-6h13v6H12" />
    <path d="M4 9h8v5.5H4z" />
  </Svg>
);
export const IconMinus = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 8h11" />
  </Svg>
);
export const IconClose = ({ size = 9 }: P) => (
  <Svg size={size}>
    <path d="M3 3l10 10M13 3L3 13" strokeWidth={1.6} />
  </Svg>
);
export const IconUp = ({ size = 10 }: P) => (
  <Svg size={size}>
    <path d="M3 10l5-5 5 5" strokeWidth={1.6} />
  </Svg>
);
export const IconDown = ({ size = 10 }: P) => (
  <Svg size={size}>
    <path d="M3 6l5 5 5-5" strokeWidth={1.6} />
  </Svg>
);
export const IconChevronRight = ({ size = 8 }: P) => (
  <Svg size={size}>
    <path d="M6 3l5 5-5 5" strokeWidth={1.8} />
  </Svg>
);

// Editor tools
export const IconSelect = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 2l9 6.2-4 .8 2.4 4.6-1.8.9-2.4-4.6L3.5 12.6z" />
  </Svg>
);
export const IconPencil = (p: P) => (
  <Svg {...p}>
    <path d="M10.5 2.5l3 3L5.5 13.5 2 14l.5-3.5z" />
    <path d="M9 4l3 3" />
  </Svg>
);
export const IconTextTool = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 12.5L4.5 4l3 8.5M2.6 9.5h3.8" />
    <path d="M9 6.5h5.5M11.75 6.5v6" />
  </Svg>
);
export const IconHighlight = (p: P) => (
  <Svg {...p}>
    <path d="M2 3.5h12l-4 5v5l-4-1.5v-3.5z" />
  </Svg>
);
export const IconDraw = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 2.5l2.5 2.5-6 6-3 .5.5-3z" />
    <path d="M2 14.5c3-1.5 5 .5 7-.5s3-1.5 5-1" />
  </Svg>
);
export const IconShapes = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
  </Svg>
);
export const IconImage = (p: P) => (
  <Svg {...p}>
    <rect x="1.5" y="3" width="13" height="10" rx="1.2" />
    <circle cx="5.5" cy="6.5" r="1.2" />
    <path d="M14.5 11l-4-4-6.5 6" />
  </Svg>
);
export const IconSign = (p: P) => (
  <Svg {...p}>
    <path d="M9 2.5l2.5 2.5-5.5 5.5-3 .5.5-3z" />
    <path d="M1.5 14c1.5-1 2.5-1 3 0s1.5 1 2.5 0 2-1 3 0 2 .5 4.5-.5" />
  </Svg>
);
export const IconEraser = (p: P) => (
  <Svg {...p}>
    <path d="M6 13.5L1.8 9.3a1 1 0 0 1 0-1.4L8 1.7a1 1 0 0 1 1.4 0l4.9 4.9a1 1 0 0 1 0 1.4L8.3 14" />
    <path d="M4.5 5.2l6.3 6.3M6 13.5h8" />
  </Svg>
);
export const IconNote = (p: P) => (
  <Svg {...p}>
    <path d="M2 2.5h12v8.5H8l-3.5 3v-3H2z" />
  </Svg>
);
export const IconStamp = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 2.5h3v4l3.5 1.5V10H3V8l3.5-1.5zM3 12.5h10" />
  </Svg>
);
export const IconCrop = (p: P) => (
  <Svg {...p}>
    <path d="M4 1v11h11M1 4h11v11" />
  </Svg>
);
export const IconLockLine = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="7" width="10" height="7.5" rx="1.2" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" />
  </Svg>
);
export const IconUnlockLine = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="7" width="10" height="7.5" rx="1.2" />
    <path d="M5 7V5a3 3 0 0 1 5.8-1" />
  </Svg>
);

// Home + Tools glyphs
export const IconOpenFile = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 3h4.5l1.5 1.5h7v9h-13z" />
    <path d="M1.5 6.5h13" />
  </Svg>
);
export const IconMerge = (p: P) => (
  <Svg {...p}>
    <path d="M3 2v3.5c0 2 5 2.5 5 5V14M13 2v3.5c0 2-5 2.5-5 5" />
    <path d="M5.5 11.5L8 14l2.5-2.5" />
  </Svg>
);
export const IconSplit = (p: P) => (
  <Svg {...p}>
    <path d="M8 14v-3.5c0-2.5-5-3-5-5V2M8 10.5c0-2.5 5-3 5-5V2" />
    <path d="M1 4.5L3 2l2 2.5M11 4.5L13 2l2 2.5" />
  </Svg>
);
export const IconPictures = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="1.5" width="11" height="9" rx="1" />
    <path d="M1.5 4v10h10" />
    <path d="M14.5 8.5l-3-3-5 5" />
  </Svg>
);
export const IconCompress = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 6h4.5V1.5M14.5 10H10v4.5M6 6L1.5 1.5M10 10l4.5 4.5" />
  </Svg>
);
export const IconScan = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 5V1.5H5M11 1.5h3.5V5M14.5 11v3.5H11M5 14.5H1.5V11M4 8h8" />
  </Svg>
);
export const IconWord = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 1.5h6l3 3v10h-9z" />
    <path d="M5.5 8l1 4 1.5-3 1.5 3 1-4" />
  </Svg>
);
export const IconTextDoc = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 1.5h6l3 3v10h-9z" />
    <path d="M5.5 7.5h5M5.5 10h5M5.5 12.5h3" />
  </Svg>
);
export const IconBatch = (p: P) => (
  <Svg {...p}>
    <path d="M2 4.5l6-3 6 3-6 3zM2 8l6 3 6-3M2 11.5l6 3 6-3" />
  </Svg>
);
export const IconGray = (p: P) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" />
  </Svg>
);

/** The app's lock icon (license/ui.tsx). */
export function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1zm-2 5V4.5a2 2 0 1 1 4 0V6H6z" />
    </svg>
  );
}

// ------------------------------------------------------------------ controls (ui/controls.tsx)

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" className={c("switch", checked && "on")} aria-pressed={checked} disabled={disabled} onClick={() => onChange(!checked)}>
      <span className={c("switch-knob")} />
    </button>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
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

export function Slider({ value, min, max, step, onChange, format }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
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

export function IconBtn({ icon, title, onClick, disabled, className }: { icon: ReactNode; title: string; onClick(): void; disabled?: boolean; className?: string }) {
  return (
    <button type="button" className={c("btn btn-secondary btn-small btn-icon", className)} title={title} aria-label={title} disabled={disabled} onClick={onClick}>
      {icon}
    </button>
  );
}

export function Modal({ title, children, actions, onCancel }: { title: string; children?: ReactNode; actions: ReactNode; onCancel(): void }) {
  return (
    <div
      className={c("modal-backdrop")}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className={c("card modal-card")} role="dialog" aria-modal="true" aria-label={title}>
        <div className={c("modal-title")}>{title}</div>
        {children}
        <div className={c("modal-actions toolbar")}>{actions}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className={c("progress-row")}>
      <div className={c("progress-bar")}>
        <div className={c("progress-fill")} style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
      </div>
      {label && <span className={c("progress-text")}>{label}</span>}
    </div>
  );
}

// ------------------------------------------------------------------ context menu (ui/ContextMenu.tsx)

export type MenuEntry = "sep" | { label: string; hint?: string; danger?: boolean; disabled?: boolean; checked?: boolean; onClick(): void };

/** A menu at a point inside the app root (x / y already in the app's own pixels). */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuEntry[]; onClose(): void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Keep the menu inside the window.
  useLayoutEffect(() => {
    const el = ref.current;
    const root = el?.offsetParent as HTMLElement | null;
    if (!el || !root) return;
    const nx = Math.max(4, Math.min(x, root.clientWidth - el.offsetWidth - 6));
    const ny = Math.max(4, Math.min(y, root.clientHeight - el.offsetHeight - 6));
    if (nx !== pos.x || ny !== pos.y) setPos({ x: nx, y: ny });
  }, [x, y, pos.x, pos.y]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const t = window.setTimeout(() => window.addEventListener("pointerdown", down), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", down);
    };
  }, [onClose]);

  const hasChecks = items.some((m) => m !== "sep" && m.checked !== undefined);
  return (
    <div ref={ref} className={c("ctx-menu")} style={{ left: pos.x, top: pos.y }} role="menu" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      {items.map((m, i) =>
        m === "sep" ? (
          <div key={i} className={c("ctx-sep")} />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            className={c("ctx-item", m.danger && "danger")}
            disabled={m.disabled}
            onClick={() => {
              onClose();
              m.onClick();
            }}
          >
            <span className={c("ctx-label")}>
              {hasChecks && <span className={c("ctx-check")}>{m.checked ? "✓" : ""}</span>}
              {m.label}
            </span>
            {m.hint && <span className={c("ctx-hint")}>{m.hint}</span>}
          </button>
        ),
      )}
    </div>
  );
}
