"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { SOURCE_LABEL, type DeviceRow, type PhaseId, type ScanProgress } from "./data";
import { IconCheck, IconShield, ago, c, plural, reducedMotion, useCountUp, useGlide, vars } from "./ui";

// The Drivers tab before and during a scan (views/ScanStage.tsx): the big Scan button, the scan it
// turns into (one ring segment per driver source, the devices going by, each update popping in as a
// chip), and the short finish. A click skips the finish.

export type StageMode = "idle" | "scanning" | "finishing";

export const FINISH_MS = { found: 2300, clean: 2000 };

const SOURCES: { id: PhaseId; label: string }[] = [
  { id: "windowsUpdate", label: "Windows Update" },
  { id: "microsoft", label: "Microsoft" },
  { id: "nvidia", label: "NVIDIA" },
  { id: "intel", label: "Intel" },
  { id: "revinhi", label: "RevinHi" },
  { id: "pcMaker", label: "PC maker" },
];

const C = 125;
const R_RING = 100;
const R_SEG = 115;
const GAP = 10;
const SPAN = 360 / SOURCES.length;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

function Segment({ i, state, known }: { i: number; state: string; known: number | null }) {
  const a0 = i * SPAN + GAP / 2;
  const a1 = (i + 1) * SPAN - GAP / 2;
  const d = arc(R_SEG, a0, a1);
  const [tx, ty] = polar(R_SEG, (a0 + a1) / 2);
  const f = state === "done" ? 1 : state === "running" && known != null ? known : 0;
  return (
    <g className={c("seg", `seg-${state}`)}>
      <path className={c("seg-track")} d={d} />
      <path className={c("seg-fill")} d={d} pathLength={1} style={{ strokeDashoffset: 1 - f, opacity: f > 0 ? 1 : 0 }} />
      {state === "running" && <path className={c("seg-light")} d={d} pathLength={1} />}
      {state === "done" && (
        <g transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)})`}>
          <g className={c("seg-tick")}>
            <circle r="7.5" />
            <path d="M -3.2 0.2 L -0.9 2.5 L 3.4 -2.3" />
          </g>
        </g>
      )}
    </g>
  );
}

function Rings({ mode, progress }: { mode: StageMode; progress: ScanProgress | null }) {
  const target = mode === "finishing" ? 1 : mode === "scanning" ? clamp01(progress?.fraction ?? 0.01) : 0;
  const shown = useGlide(target, 0.07);
  const circ = 2 * Math.PI * R_RING;
  const total = progress?.total ?? 0;
  const msKnown = total > 0 ? clamp01((progress?.checked ?? 0) / total) : null;
  const stateOf = (id: PhaseId) => (mode === "finishing" ? "done" : progress?.phases[id] ?? "waiting");
  return (
    <svg className={c("orb-svg")} viewBox="0 0 250 250" aria-hidden="true">
      <defs>
        <linearGradient id="rd-orb-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ff7a0" />
          <stop offset="1" stopColor="#ffd23f" />
        </linearGradient>
      </defs>
      <circle className={c("orb-track")} cx={C} cy={C} r={R_RING} />
      <circle
        className={c("orb-fill")}
        cx={C}
        cy={C}
        r={R_RING}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - shown)}
        transform={`rotate(-90 ${C} ${C})`}
      />
      {mode === "finishing" && <circle className={c("orb-close")} cx={C} cy={C} r={R_RING} transform={`rotate(-90 ${C} ${C})`} pathLength={1} />}
      <g className={c("segs")}>
        {SOURCES.map((s, i) => (
          <Segment key={s.id} i={i} state={stateOf(s.id)} known={s.id === "microsoft" ? msKnown : null} />
        ))}
      </g>
    </svg>
  );
}

const SPARKS = Array.from({ length: 30 }, (_, i) => ({
  a: (i * 360) / 30 + (i % 2 ? 5 : -3),
  d: 0.3 + ((i * 37) % 11) / 14,
  s: 0.9 + ((i * 53) % 7) / 9,
  k: i % 4,
}));

function Burst({ calm }: { calm: boolean }) {
  return (
    <div className={c("orb-burst", calm && "calm")} aria-hidden="true">
      <span className={c("burst-ring")} />
      <span className={c("burst-ring late")} />
      {!calm && SPARKS.map((p, i) => <span key={i} className={c("spark", `k${p.k}`)} style={vars({ "--a": `${p.a}deg`, "--d": p.d, "--s": p.s, "--i": i })} />)}
    </div>
  );
}

function Orb({
  mode,
  progress,
  updates,
  onStart,
  discRef,
  boxRef,
}: {
  mode: StageMode;
  progress: ScanProgress | null;
  updates: number;
  onStart: () => void;
  discRef: RefObject<HTMLButtonElement | null>;
  boxRef: RefObject<HTMLDivElement | null>;
}) {
  const [pressed, setPressed] = useState(0);
  const pct = mode === "finishing" ? 100 : Math.floor(clamp01(progress?.fraction ?? 0) * 100);
  const shownPct = useCountUp(pct, 650);
  const shownUpdates = useCountUp(mode === "finishing" ? updates : 0, 900, 0);
  const idle = mode === "idle";
  const start = () => {
    if (!idle) return;
    setPressed((n) => n + 1);
    onStart();
  };
  return (
    <div
      ref={boxRef}
      className={c("orb", mode, mode === "finishing" && updates === 0 && "clean")}
      role={idle ? undefined : "progressbar"}
      aria-label={idle ? undefined : "Scan progress"}
      aria-valuemin={idle ? undefined : 0}
      aria-valuemax={idle ? undefined : 100}
      aria-valuenow={idle ? undefined : pct}
    >
      <span className={c("orb-halo")} aria-hidden="true" />
      <span className={c("orb-orbit")} aria-hidden="true" />
      <Rings mode={mode} progress={progress} />
      <button ref={discRef} className={c("orb-disc")} onClick={start} aria-disabled={!idle || undefined} tabIndex={idle ? 0 : -1} aria-label={idle ? "Scan for driver updates" : undefined}>
        <span className={c("orb-glow")} aria-hidden="true" />
        <span className={c("orb-radar")} aria-hidden="true">
          <span className={c("radar-sweep")} />
        </span>
        {pressed > 0 && (
          <span key={pressed} className={c("orb-press")} aria-hidden="true">
            <span className={c("press-ripple")} />
            <span className={c("press-rays")}>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} style={vars({ "--a": `${i * 30}deg` })} />
              ))}
            </span>
          </span>
        )}
        <span className={c("orb-label")} aria-hidden={!idle}>
          <span className={c("orb-word")}>Scan</span>
          <span className={c("orb-cap")}>Find newer drivers</span>
        </span>
        <span className={c("orb-stats")} aria-hidden="true">
          {mode === "finishing" ? (
            updates > 0 ? (
              <span className={c("orb-done")} key="found">
                <span className={c("orb-num num")}>{shownUpdates}</span>
                <span className={c("orb-sub")}>{updates === 1 ? "update found" : "updates found"}</span>
              </span>
            ) : (
              <span className={c("orb-done clean")} key="clean">
                <svg className={c("orb-check")} viewBox="0 0 48 48">
                  <path d="M 13 25 L 21 33 L 36 16" pathLength={1} />
                </svg>
                <span className={c("orb-sub")}>Up to date</span>
              </span>
            )
          ) : (
            <span className={c("orb-run")} key="run">
              <span className={c("orb-pct num")}>
                {shownPct}
                <small>%</small>
              </span>
              <span className={c("orb-sub")}>Scanning</span>
            </span>
          )}
        </span>
      </button>
      {mode === "finishing" && <Burst calm={updates === 0} />}
    </div>
  );
}

const joinNames = (l: string[]) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`);

function doing(p: ScanProgress | null): string | null {
  if (!p) return "Starting";
  if (p.phases.devices !== "done") return "Reading your devices";
  const cmp = p.phases.compare;
  if (cmp === "running" || cmp === "done") return "Comparing versions";
  if (p.phases.microsoft === "running" && p.total > 0) return null;
  const asking = SOURCES.filter((s) => p.phases[s.id] === "running").map((s) => s.label);
  return asking.length ? `Asking ${joinNames(asking)}` : "Comparing versions";
}

function Doing({ p }: { p: ScanProgress | null }) {
  const checked = useCountUp(p?.checked ?? 0, 500);
  const text = doing(p);
  return (
    <span key={text ?? "count"} className={c("line-in")}>
      {text ?? (
        <>
          Checking <b className={c("num")}>{checked.toLocaleString("en-US")}</b> of {(p?.total ?? 0).toLocaleString("en-US")} devices
        </>
      )}
    </span>
  );
}

/** The devices being looked up, newest at the bottom, older ones drifting up and fading. */
function NameStream({ current }: { current: string | null | undefined }) {
  const [items, setItems] = useState<{ name: string; key: number }[]>([]);
  const [last, setLast] = useState<string | null | undefined>(null);
  if (current !== last) {
    setLast(current);
    if (current && items[items.length - 1]?.name !== current) {
      const key = (items[items.length - 1]?.key ?? 0) + 1;
      setItems([...items.slice(-3), { name: current, key }]);
    }
  }
  return (
    <div className={c("name-stream", !current && "quiet")} aria-hidden="true">
      {items.map((it, i) => (
        <div key={it.key} className={c("name-line")} style={vars({ "--k": items.length - 1 - i })}>
          {it.name}
        </div>
      ))}
    </div>
  );
}

const CHIPS = 6;

function FoundChips({ found }: { found: ScanProgress["found"] }) {
  const shown = found.slice(0, CHIPS);
  const more = found.length - shown.length;
  return (
    <div className={c("found-chips")}>
      {shown.map((f) => (
        <span key={f.instanceId} className={c("found-chip")} title={`Newer driver from ${SOURCE_LABEL[f.source]}`}>
          <span className={c("fc-dot")} />
          <span className={c("fc-name")}>{f.name}</span>
          <span className={c("fc-src")}>{SOURCE_LABEL[f.source]}</span>
        </span>
      ))}
      {more > 0 && (
        <span key={`more-${more}`} className={c("found-chip more")}>
          +{more} more
        </span>
      )}
    </div>
  );
}

function SourceRow({ progress, finished }: { progress: ScanProgress | null; finished: boolean }) {
  return (
    <div className={c("stage-srcs")}>
      {SOURCES.map((s) => {
        const st = finished ? "done" : progress?.phases[s.id] ?? "waiting";
        return (
          <span key={s.id} className={c("stage-src", `src-${st}`)}>
            <span className={c("ss-mark")} aria-hidden="true">
              {st === "done" ? <IconCheck size={11} /> : st === "running" ? <span className={c("ss-spin")} /> : <span className={c("ss-dot")} />}
            </span>
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

/** The scale the window is drawn at on the page (the preview frame scales the whole app). */
export const scaleOf = (el: HTMLElement) => el.getBoundingClientRect().width / Math.max(1, el.offsetWidth);

export function ScanStage({
  mode,
  progress,
  rows,
  scannedAt,
  now,
  onStart,
  onSkip,
  onDisc,
}: {
  mode: StageMode;
  progress: ScanProgress | null;
  rows: DeviceRow[];
  scannedAt: number | null;
  now: number;
  onStart: () => void;
  onSkip: () => void;
  onDisc: (r: DOMRect) => void;
}) {
  const disc = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  // The button moves up to make room for the scan's lines: it glides there instead of jumping.
  const lastTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const was = lastTop.current;
    lastTop.current = top;
    if (was == null || Math.abs(was - top) < 1 || reducedMotion()) return;
    el.animate([{ transform: `translateY(${(was - top) / scaleOf(el)}px)` }, { transform: "none" }], { duration: 750, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
  }, [mode]);

  // The finish still shows the sources and chips after the scan's progress stops.
  const [held, setHeld] = useState<ScanProgress | null>(null);
  if (progress && progress !== held) setHeld(progress);
  if (mode === "idle" && held) setHeld(null);
  const shown = progress ?? held;

  useEffect(() => {
    if (mode === "finishing" && disc.current) onDisc(disc.current.getBoundingClientRect());
  }, [mode, onDisc]);

  const updates = rows.filter((r) => r.offer && !r.ignored).length;
  const finishLine = useCountUp(mode === "finishing" ? rows.length : 0, 900, 0);

  return (
    <div className={c("drv-stage", mode)} onClick={mode === "finishing" ? onSkip : undefined}>
      <Orb mode={mode} progress={shown} updates={updates} onStart={onStart} discRef={disc} boxRef={box} />
      <div className={c("stage-body")}>
        {mode === "idle" ? (
          <>
            <div className={c("stage-line")}>
              {scannedAt ? `Last scanned ${ago(scannedAt, now)} · ${updates > 0 ? `${plural(updates, "update")} found` : "everything was up to date"}` : "Never scanned"}
            </div>
            <div className={c("hero-trust stage-trust")}>
              <span>
                <IconShield size={13} /> Signed drivers only
              </span>
              <span>
                <IconShield size={13} /> Never an older driver
              </span>
              <span>
                <IconShield size={13} /> Your PC maker&apos;s drivers kept
              </span>
            </div>
          </>
        ) : (
          <>
            <div className={c("stage-line")}>
              {mode === "finishing" ? (
                <span className={c("line-in")} key="finish">
                  {updates > 0 ? (
                    <>
                      <b>{plural(updates, "driver update")}</b> found · {finishLine.toLocaleString("en-US")} devices checked
                    </>
                  ) : (
                    <>
                      <b>Everything is up to date</b> · {finishLine.toLocaleString("en-US")} devices checked
                    </>
                  )}
                </span>
              ) : (
                <Doing p={shown} />
              )}
            </div>
            <NameStream current={mode === "scanning" ? shown?.current : null} />
            <FoundChips found={shown?.found ?? []} />
            <SourceRow progress={shown} finished={mode === "finishing"} />
            <div className={c("stage-note text-muted")}>{mode === "finishing" ? "Click anywhere to see the list." : "Nothing on your PC changes during a scan."}</div>
          </>
        )}
      </div>
    </div>
  );
}
