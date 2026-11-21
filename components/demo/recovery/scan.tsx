"use client";

import { DRIVES, FILES, Results, Session, fullMinutes } from "./data";
import { IconPause, IconPlay, IconStop, KIND_LABEL, KIND_ORDER, KindIcon, c, humanSize, n } from "./ui";

const COLS = 64;
const ROWS = 12;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What each cell of the drive map turns out to hold once read: a file type (0-5), unreadable (6) or nothing (-1). */
const CELLS: number[] = (() => {
  const r = rng(42);
  return Array.from({ length: COLS * ROWS }, () => {
    const x = r();
    if (x < 0.012) return 6;
    if (x < 0.13) return 0;
    if (x < 0.2) return 1;
    if (x < 0.25) return 2;
    if (x < 0.31) return 3;
    if (x < 0.34) return 4;
    if (x < 0.36) return 5;
    return -1;
  });
})();

const NAMES = FILES.map((f) => f.name);

function left(seconds: number) {
  if (seconds >= 90) return `${Math.round(seconds / 60)} min`;
  return `${Math.max(1, Math.round(seconds))} sec`;
}

/** Split the overall progress into the scan's passes, like the real scan reports it. */
export function phaseOf(deep: boolean, p: number) {
  if (deep) {
    if (p < 0.02) return { pass: 0, inPass: p / 0.2, phase: "Opening the drive" };
    if (p < 0.2) return { pass: 0, inPass: p / 0.2, phase: "Reading the list of files" };
    if (p < 0.97) return { pass: 1, inPass: (p - 0.2) / 0.8, phase: "Searching the whole drive for lost files" };
    return { pass: 1, inPass: (p - 0.2) / 0.8, phase: "Putting names back on what it found" };
  }
  if (p < 0.05) return { pass: 0, inPass: p, phase: "Opening the drive" };
  if (p < 0.75) return { pass: 0, inPass: p, phase: "Reading the list of files" };
  return { pass: 0, inPass: p, phase: "Putting the folders back together" };
}

export function ScanningView({
  session,
  progress,
  paused,
  results,
  onPause,
  onResume,
  onStop,
  onShowFound,
}: {
  session: Session;
  progress: number;
  paused: boolean;
  results: Results;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onShowFound: () => void;
}) {
  const d = DRIVES[session.drive];
  const deep = session.deep;
  const pct = Math.min(100, progress * 100);
  const { pass, inPass, phase } = phaseOf(deep, progress);
  const total = session.volume !== undefined ? d.volumes[session.volume].size : d.size;
  const seconds = deep ? fullMinutes(session.drive, session.volume) * 60 : 40;
  const timeLeft = seconds * (1 - progress);
  const vol = d.volumes.find((v) => v.letter) ?? d.volumes[0];
  const where = deep
    ? pass === 1
      ? `All of ${session.title} · step 2 of 2`
      : `${vol.letter ? `${vol.letter} ` : ""}${vol.label || session.title} · step 1 of 2`
    : session.title;

  const kinds = results.types.map((t) => t.count);
  const files = kinds.reduce((s, x) => s + x, 0);
  const deleted = Math.round(files * 0.618);
  const carved = deep && pass === 1 ? Math.round(files * 0.112) : 0;

  // The map: cells before the read head are read, the head glows.
  const head = Math.floor(Math.min(1, inPass) * COLS * ROWS);
  const cell = (i: number) => {
    if (i > head) return "map-cell";
    if (i === head && !paused && progress < 1) return "map-cell head";
    const k = CELLS[i];
    if (pass === 0 && k >= 0 && k < 6 && i % 3 !== 0) return "map-cell read";
    return k === -1 ? "map-cell read" : k === 6 ? "map-cell bad" : `map-cell k${k}`;
  };

  // "Just found": the newest five names, newest on top.
  const step = Math.floor(progress * 70);
  const latest = Array.from({ length: Math.min(5, step) }, (_, i) => ({ key: step - i, name: NAMES[(step - i) % NAMES.length] }));

  return (
    <div className={c("pane scroll scanning")}>
      <div className={c("crumbs")}>
        <span className={c("crumb-dim")}>Recover</span>
        <span className={c("crumb-sep")}>/</span>
        <span className={c("crumb-here")}>
          {deep ? "Full scan of " : "Quick scan of "}
          {session.title}
        </span>
      </div>

      <div className={c("card scan-hero2")}>
        <div className={c("scan-top")}>
          <div className={c("scan-pct", paused && "paused")} aria-label={`${Math.floor(pct)} percent`}>
            {Math.floor(pct)}
            <span>%</span>
          </div>
          <div className={c("scan-info")}>
            <div className={c("scan-phase")}>{paused ? "Paused. Everything found so far is kept." : phase}</div>
            <div className={c("scan-where text-muted")}>{where}</div>
            <div className={c("scan-bar")} aria-hidden="true">
              <span className={c(paused && "paused")} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className={c("scan-stats2")}>
            <div className={c("stat")}>
              <span className={c("stat-label")}>Time left</span>
              <span className={c("stat-value")}>{paused ? "—" : progress < 0.02 ? "Working it out…" : left(timeLeft)}</span>
            </div>
            <div className={c("stat")}>
              <span className={c("stat-label")}>{pass === 1 ? "Searched" : "Files found"}</span>
              <span className={c("stat-value")}>{pass === 1 ? `${humanSize(total * Math.min(1, inPass))} of ${humanSize(total)}` : n(files)}</span>
            </div>
            <div className={c("stat")}>
              <span className={c("stat-label")}>Speed</span>
              <span className={c("stat-value")}>{!paused && pass === 1 ? `${humanSize(total / (seconds * 0.8))}/s` : "—"}</span>
            </div>
          </div>
        </div>

        <div className={c("map-wrap")}>
          <div className={c("drive-map")} style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }} aria-hidden="true">
            {CELLS.map((_, i) => (
              <span key={i} className={c(cell(i))} />
            ))}
          </div>
          <div className={c("map-legend")}>
            <span className={c("map-pass")}>{pass === 1 ? "The whole drive, start to end" : "The drive's list of files"}</span>
            <span style={{ flex: 1 }} />
            <span className={c("legend-item")}>
              <i className={c("legend-read")} /> Read
            </span>
            {KIND_ORDER.slice(0, 5).map((k) => (
              <span key={k} className={c("legend-item", `kind-${k}`)}>
                <i className={c("legend-kind")} /> {KIND_LABEL[k]}
              </span>
            ))}
            <span className={c("legend-item")}>
              <i className={c("legend-bad")} /> Couldn&apos;t be read
            </span>
          </div>
        </div>

        <div className={c("scan-buttons")}>
          {paused ? (
            <button className={c("btn btn-primary")} onClick={onResume}>
              <IconPlay size={12} /> Resume
            </button>
          ) : (
            <>
              <button className={c("btn btn-secondary")} onClick={onPause}>
                <IconPause size={12} /> Pause
              </button>
              <button className={c("btn btn-danger")} onClick={onStop}>
                <IconStop size={12} /> Stop
              </button>
            </>
          )}
          <span className={c("text-muted scan-note")}>
            Nothing on the drive is changed while it&apos;s scanned.{" "}
            {paused ? "Resume whenever you like, or look at what's been found." : "Use other tabs or look at the results: the scan keeps going."}
          </span>
          <button className={c("btn btn-secondary")} onClick={onShowFound} disabled={files === 0}>
            Show files found so far
          </button>
        </div>
      </div>

      <div className={c("scan-lower")}>
        <div className={c("scan-found")}>
          <div className={c("found-head")}>
            <span className={c("side-title")}>Found so far</span>
            <span className={c("text-muted")}>
              {n(files)} files
              {deleted > 0 && ` · ${n(deleted)} deleted`}
              {carved > 0 && ` · ${n(carved)} found by their contents`}
            </span>
          </div>
          <div className={c("found-chips")}>
            {KIND_ORDER.map((k, i) => (
              <div key={k} className={c("found-chip", `kind-${k}`, kinds[i] > 0 && "has")}>
                <span className={c("found-icon")}>
                  <KindIcon kind={k} size={17} />
                </span>
                <span className={c("found-count")}>{n(kinds[i])}</span>
                <span className={c("found-label")}>{KIND_LABEL[k]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={c("card latest")}>
          <div className={c("side-title")}>Just found</div>
          <ul className={c("latest-list")}>
            {latest.length === 0 && <li className={c("text-muted")} style={{ fontSize: 11.5 }}>Names show here as files turn up.</li>}
            {latest.map((it, i) => (
              <li key={it.key} className={c("latest-item")} style={{ opacity: 1 - i * 0.15 }} title={it.name}>
                {it.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
