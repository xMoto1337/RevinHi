"use client";

import type { ReactNode } from "react";
import s from "./perf.module.css";

/** Joins class names, mapped to this module's scoped names. */
export function c(...names: (string | false | null | undefined)[]): string {
  return names
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => s[n] ?? n)
    .join(" ");
}

/** The app's glass toggle (red when off, green when on, knob overshoots a little). */
export function Toggle({
  size,
  on,
  disabled,
  onChange,
  label,
}: {
  size: "compact" | "mode" | "boost";
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={c("toggle", size, on && "on")}
      onClick={() => onChange(!on)}
    >
      <span className={c("track")} />
      <span className={c("knob")} />
    </button>
  );
}

export function GlowButton({
  children,
  onClick,
  title,
  small,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  title?: string;
  small?: boolean;
  className?: string;
}) {
  return (
    <button type="button" className={c("glowBtn", small && "glowBtnSmall", className)} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

/** Segoe MDL2 "ChromeClose" look-alike. */
export function CloseGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function CheckGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.2 6.3l2.4 2.4 5.2-5.4" fill="none" stroke="#000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** One of the app's small frameless pop-up windows (own title strip + close button). */
export function Dialog({ width, children, onClose }: { width: number; children: ReactNode; onClose: () => void }) {
  return (
    <div className={c("backdrop")} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={c("dialog")} style={{ width }} role="dialog" aria-modal="true">
        <div className={c("dialogBar")}>
          <span>REVINHI PERFORMANCE</span>
          <button type="button" className={c("closeBtn")} onClick={onClose} aria-label="Close">
            <CloseGlyph />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** InstructionsWindow: shown after a tweak that needs a restart or a manual step. */
export function InstructionsDialog({
  title,
  subtitle,
  text,
  onClose,
}: {
  title: string;
  subtitle?: string;
  text: string;
  onClose: () => void;
}) {
  return (
    <Dialog width={460} onClose={onClose}>
      <div style={{ padding: "20px 28px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          {/* Segoe MDL2 "Info" glyph */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ marginRight: 10, flexShrink: 0 }}>
            <circle cx="9" cy="9" r="7.6" fill="none" stroke="#2ed573" strokeWidth="1.2" />
            <path d="M9 8v5" stroke="#2ed573" strokeWidth="1.3" />
            <circle cx="9" cy="5.6" r="0.85" fill="#2ed573" />
          </svg>
          <span className={c("header")} style={{ fontSize: 17 }}>
            {title}
          </span>
        </div>
        {subtitle && (
          <div className={c("meta dim7")} style={{ marginBottom: 14 }}>
            {subtitle}
          </div>
        )}
        {!subtitle && <div style={{ height: 14 }} />}
        <div className={c("instructions body")}>{text}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <GlowButton onClick={onClose}>
            Got It
          </GlowButton>
        </div>
      </div>
    </Dialog>
  );
}
