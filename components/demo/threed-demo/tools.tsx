"use client";

import { useRef } from "react";
import { useDemo } from "../AppWindow";
import { type Layer, type V2, type Vec3, makeLayer, layersUnder, localOf, nextColor, nodeBox, isEmptyBox, worldOf } from "./scene";
import { bedOf, useActions, useApp, useStore, type GenState, type MeasureMode, type SketchTool, type Store } from "./store";
import { Icon, LengthField, Segmented, Toggle, c, crop, formatLength, parseLength, type IconName } from "./ui";

// ------------------------------------------------------------------ draw on the grid (panels/SketchBar.tsx)

const SKETCH_TOOLS: { id: SketchTool | "arc" | "pen"; icon: IconName; label: string; hint: string }[] = [
  { id: "line", icon: "polyline", label: "Line", hint: "Click to add points. Click the first point to close the outline." },
  { id: "rect", icon: "rect", label: "Rectangle", hint: "Click two corners (or drag)." },
  { id: "circle", icon: "circle2", label: "Circle", hint: "Click the center, then the edge." },
  { id: "arc", icon: "arc", label: "Arc", hint: "Click where the arc starts, where it ends, then a point it passes through." },
  { id: "polygon", icon: "hexagon", label: "Polygon", hint: "Click the center, then a corner." },
  { id: "pen", icon: "pen", label: "Curve pen", hint: "Click for corners, press and drag for smooth curves. Click the first point to close." },
];

export function SketchBar() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const t = s.tool;
  if (t?.kind !== "sketch") return null;
  const tool = SKETCH_TOOLS.find((x) => x.id === t.tool)!;
  const done = () => {
    const shapes = t.shapes;
    if (!shapes.length) {
      st.set({ tool: null });
      return;
    }
    const xs = shapes.flat().map((p) => p[0]);
    const ys = shapes.flat().map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const outlines: V2[][] = shapes.map((sh) => sh.map(([x, y]) => [x - cx, y - cy] as V2));
    const l = makeLayer("Drawing", { kind: "drawing", outlines, solid: "flat", height: 3, origin: "draw" }, nextColor(s.doc), [cx, cy, 0]);
    st.set({ tool: null });
    act.commit("Draw", { nodes: { ...s.doc.nodes, [l.id]: l }, roots: [...s.doc.roots, l.id] }, [l.id]);
    act.info("Pick Extrude or Revolve on the right to make it 3D.");
  };
  return (
    <div className={c("toolbar-float")}>
      <div className={c("tf-row")}>
        {SKETCH_TOOLS.map((x) => (
          <button
            key={x.id}
            type="button"
            className={c("vbtn", t.tool === x.id && "on")}
            title={x.label}
            onClick={() => (x.id === "arc" || x.id === "pen" ? act.info(`${x.label}: ${x.hint} It works in the app; here, try Line, Rectangle, Circle or Polygon.`) : st.set({ tool: { ...t, tool: x.id as SketchTool, draft: [] } }))}
          >
            <Icon name={x.icon} size={15} />
            <span>{x.label}</span>
          </button>
        ))}
        <span className={c("vsep")} />
        <button type="button" className={c("vbtn", s.snap && "on")} onClick={() => st.set({ snap: !s.snap })} title="Snap to the grid (points of other shapes always snap)">
          <Icon name="magnet" size={15} />
          <span>Snap</span>
        </button>
        <button type="button" className={c("btn btn-primary btn-small btn-icon-label")} onClick={done}>
          <Icon name="check" size={13} />
          Done
        </button>
      </div>
      <div className={c("tf-hint")}>
        {tool.hint} Right-drag turns the view. {t.shapes.length ? `${t.shapes.length} shape${t.shapes.length === 1 ? "" : "s"} drawn.` : ""}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ measure (panels/ToolBars.tsx)

const MEASURE: { id: MeasureMode; label: string; icon: IconName; hint: string }[] = [
  { id: "distance", label: "Distance", icon: "ruler", hint: "Click two points." },
  { id: "angle", label: "Angle", icon: "angle", hint: "Click three points: one side, the corner, the other side." },
  { id: "radius", label: "Circle", icon: "circle2", hint: "Click three points on a round edge or hole to get its radius." },
  { id: "thickness", label: "Wall thickness", icon: "thickness", hint: "Click a surface to see how thick the wall behind it is." },
];

const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);

export function MeasureBar() {
  const s = useApp();
  const st = useStore();
  const t = s.tool;
  if (t?.kind !== "measure") return null;
  const m = MEASURE.find((x) => x.id === t.mode)!;
  const L = (mm: number) => `${formatLength(mm, s.unit)} ${s.unit}`;
  const results: string[] = [];
  const p = t.pts;
  if (t.mode === "distance" && p.length === 2) {
    const d = sub3(p[1], p[0]);
    results.push(`Distance ${L(len3(d))}`, `X ${L(Math.abs(d[0]))} · Y ${L(Math.abs(d[1]))} · Z ${L(Math.abs(d[2]))}`);
  }
  if (t.mode === "angle" && p.length === 3) {
    const a = sub3(p[0], p[1]);
    const b = sub3(p[2], p[1]);
    const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (len3(a) * len3(b) || 1);
    results.push(`Angle ${((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI).toFixed(1)}°`);
  }
  if (t.mode === "radius" && p.length === 3) {
    const A = len3(sub3(p[1], p[2]));
    const B = len3(sub3(p[0], p[2]));
    const C = len3(sub3(p[0], p[1]));
    const sArea = (A + B + C) / 2;
    const area = Math.sqrt(Math.max(0, sArea * (sArea - A) * (sArea - B) * (sArea - C)));
    if (area > 1e-6) {
      const r = (A * B * C) / (4 * area);
      results.push(`Radius ${L(r)}`, `Diameter ${L(2 * r)}`);
    } else results.push("Those points are in a line. Click three points on the round edge.");
  }
  if (t.mode === "thickness" && p.length) results.push(p.length === 2 ? `Wall ${L(len3(sub3(p[1], p[0])))}` : "Nothing behind that point.");
  return (
    <div className={c("toolbar-float")}>
      <div className={c("tf-row")}>
        {MEASURE.map((x) => (
          <button key={x.id} type="button" className={c("vbtn", t.mode === x.id && "on")} onClick={() => st.set({ tool: { kind: "measure", mode: x.id, pts: [] } })}>
            <Icon name={x.icon} size={15} />
            <span>{x.label}</span>
          </button>
        ))}
        <span className={c("vsep")} />
        <button type="button" className={c("btn btn-secondary btn-small")} onClick={() => st.set({ tool: { ...t, pts: [] } })}>
          Clear
        </button>
        <button type="button" className={c("btn btn-primary btn-small")} onClick={() => st.set({ tool: null })}>
          Done
        </button>
      </div>
      <div className={c("tf-hint")}>{m.hint} Click on an object.</div>
      {results.length > 0 && (
        <div className={c("tf-results")}>
          {results.map((r) => (
            <span key={r} className={c("tf-result")}>
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ split to fit the bed (panels/PrintPanels.tsx SplitBar)

export function SplitBar() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const t = s.tool;
  if (t?.kind !== "split" || !s.doc.nodes[t.targetId]) return null;
  const bed = bedOf(s.bed);
  const b = nodeBox(s.doc, t.targetId);
  const tall = isEmptyBox(b) ? 0 : b.max[2] - b.min[2];
  return (
    <div className={c("toolbar-float split-bar")}>
      <div className={c("tf-row")}>
        <span className={c("tf-title")}>
          <Icon name="splitBed" size={14} /> Split to fit {bed.label}
        </span>
        <span className={c("vsep")} />
        {(["Left-right", "Front-back", "Up-down"] as const).map((w, i) => (
          <button
            key={w}
            type="button"
            className={c("vbtn")}
            onClick={() => (i === 2 ? st.set({ tool: { ...t, z: Math.round((b.min[2] + b.max[2]) / 2) } }) : act.info(`${w} cuts work in the app. This preview cuts across the height.`))}
            title={["A cut across the width (X)", "A cut across the depth (Y)", "A cut across the height (Z)"][i]}
          >
            <Icon name="addPlane" size={15} />
            <span>{w} cut</span>
          </button>
        ))}
        <button type="button" className={c("vbtn")} onClick={() => st.set({ tool: { ...t, z: Math.round((b.min[2] + tall / 2) * 10) / 10 } })} title="Even cuts so every part fits the bed">
          <Icon name="generate" size={15} />
          <span>Suggest cuts</span>
        </button>
        <span className={c("vsep")} />
        <button type="button" className={c("btn btn-primary btn-small btn-icon-label")} onClick={act.applySplit}>
          <Icon name="check" size={13} />
          Split
        </button>
        <button type="button" className={c("btn btn-secondary btn-small")} onClick={() => st.set({ tool: null })}>
          Cancel
        </button>
      </div>
      <div className={c("tf-row")}>
        <span className={c("plane-chip")}>
          <LengthField label="Up-down" unit={s.unit} valueMm={t.z} min={b.min[2] + 0.5} max={b.max[2] - 0.5} onCommit={(z) => st.set({ tool: { ...t, z } })} title="Where the cut goes (drag the plane in the view, or type it)" />
        </span>
      </div>
      <div className={c("tf-row")}>
        <span className={c("tf-label")}>Pegs so the parts line up</span>
        <Toggle checked={t.pegs} onChange={(pegs) => st.set({ tool: { ...t, pegs } })} label="Pegs" />
      </div>
      <div className={c("tf-hint")}>{bed.size ? "2 parts, each fits the bed. Drag a plane to move a cut." : "Pick your printer in Settings first."}</div>
    </div>
  );
}

// ------------------------------------------------------------------ check for print problems

function overhangShare(s: ReturnType<typeof useApp>): number {
  let over = 0;
  let total = 0;
  for (const id of s.doc.roots)
    for (const l of layersUnder(s.doc, id)) {
      if (!l.visible || l.mode === "hole" || l.source.kind === "text") continue;
      for (const part of worldOf(l).parts)
        for (const f of part.faces) {
          const pts = f.loops[0];
          let nx = 0,
            ny = 0,
            nz = 0;
          for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            nx += (a[1] - b[1]) * (a[2] + b[2]);
            ny += (a[2] - b[2]) * (a[0] + b[0]);
            nz += (a[0] - b[0]) * (a[1] + b[1]);
          }
          const area = Math.hypot(nx, ny, nz) / 2;
          total += area;
          if (area > 0 && nz / (2 * area) < -0.55 && Math.min(...pts.map((p) => p[2])) > 0.4) over += area;
        }
    }
  return total ? (100 * over) / total : 0;
}

export function CheckCard() {
  const s = useApp();
  const st = useStore();
  const ch = s.checks;
  if (!ch.open) return null;
  const set = (p: Partial<typeof ch>) => st.set({ checks: { ...ch, ...p } });
  const pct = overhangShare(s);
  const run = () => {
    set({ report: "checking" });
    window.setTimeout(() => st.set((x) => ({ checks: { ...x.checks, report: "done" } })), 1300);
  };
  return (
    <div className={c("check-card")}>
      <div className={c("check-head")}>
        <Icon name="inspect" size={15} />
        <span>Check for print problems</span>
        <button type="button" className={c("icon-btn")} onClick={() => set({ open: false })} title="Close">
          <Icon name="close" size={12} />
        </button>
      </div>
      <div className={c("check-row")}>
        <span className={c("check-swatch heat")} />
        <span className={c("check-label")} title="Faces that lean out more than 45 degrees from straight up need support underneath (overhangs).">
          Needs support
        </span>
        <Toggle checked={ch.overhang} onChange={(overhang) => set({ overhang })} label="Needs support" />
      </div>
      {ch.overhang && <div className={c("check-result")}>{pct > 0.05 ? `${pct < 1 ? pct.toFixed(1) : Math.round(pct)}% of the surface` : "Nothing"}</div>}
      <div className={c("check-row")}>
        <span className={c("check-swatch thin")} />
        <span className={c("check-label")} title="Walls thinner than 0.8 mm (measured straight through the model) may not print.">
          Too thin to print
        </span>
        <Toggle checked={ch.thin} onChange={(thin) => set({ thin })} label="Too thin to print" />
      </div>
      {ch.thin && <div className={c("check-result")}>Nothing</div>}
      <div className={c("check-row")}>
        <span className={c("check-swatch gap")} />
        <span className={c("check-label")} title="Edges with a face on one side only (open edges). Slicers may guess wrong there.">
          Gaps in the surface
        </span>
        <Toggle checked={ch.gaps} onChange={(gaps) => set({ gaps })} label="Gaps in the surface" />
      </div>
      {ch.gaps && <div className={c("check-result")}>None, it&apos;s closed</div>}
      <div className={c("check-note")}>This only shows problems. Nothing is changed.</div>
      <div className={c("advisor")}>
        <button type="button" className={c("btn btn-primary btn-small btn-icon-label advisor-go")} disabled={ch.report === "checking"} onClick={run} title="Checks overhangs, thin spots, open edges, the bed and more, then suggests fixes. It doesn't change anything.">
          <Icon name="generate" size={13} />
          {ch.report === "checking" ? "Checking..." : ch.report ? "Check again" : "Will this print?"}
        </button>
        {ch.report === "done" && (
          <>
            <div className={c("advisor-headline")}>
              <Icon name="check" size={14} />
              <span>{pct > 0.5 ? "Prints with supports" : "Ready to print"}</span>
            </div>
            <div className={c("advisor-verdict")}>
              {pct > 0.5
                ? `It fits the bed. About ${Math.round(pct)}% of the surface hangs out over nothing, so turn on supports in your slicer, or lay it flat on a bigger face.`
                : "It fits the bed, sits flat and needs no supports. The walls are thick enough everywhere and the surface is closed."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Generate (ai/GeneratePanel.tsx)

const PIC = crop(1508, 187, 181, 181);
const PIC_NO_BG = crop(1699, 187, 181, 181);
const LOOKS = [1509, 1604, 1699, 1794].map((x) => crop(x, 476, 86, 86));
const CANDS = [PIC, PIC_NO_BG, { ...PIC, transform: "scaleX(-1)" }, { ...PIC_NO_BG, transform: "scaleX(-1)" }];

/** A fake job with a progress bar and "about N s" left; `done` runs at the end. */
function runJob(st: Store, kind: GenState["jobKind"], stages: string[], seconds: number, ms: number, done: () => void) {
  const t0 = Date.now();
  const tick = () => {
    const p = Math.min(1, (Date.now() - t0) / ms);
    const stage = stages[Math.min(stages.length - 1, Math.floor(p * stages.length))];
    const left = Math.max(1, Math.ceil(seconds * (1 - p)));
    st.set((x) => ({ gen: { ...x.gen, jobKind: kind, job: { label: stage, pct: p, left: `about ${left} s left` } } }));
    if (p >= 1) {
      window.clearInterval(id);
      st.set((x) => ({ gen: { ...x.gen, job: null, jobKind: null } }));
      done();
    }
  };
  const id = window.setInterval(tick, 120);
  tick();
}

function JobBar({ job, onCancel }: { job: NonNullable<GenState["job"]>; onCancel: () => void }) {
  return (
    <div className={c("ai-job")}>
      <div className={c("ai-job-row")}>
        <span className={c("spinner")} />
        <span className={c("ai-job-label")}>{job.label}</span>
        <span className={c("ai-job-left")}>{job.left}</span>
        <button type="button" className={c("btn btn-secondary btn-small")} onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className={c("ai-bar")}>
        <div style={{ width: `${Math.round(job.pct * 100)}%` }} />
      </div>
    </div>
  );
}

export function GeneratePanel() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const { notify } = useDemo();
  const cancelled = useRef(false);
  const g = s.gen;
  if (!g.open || s.panel !== "workspace") return null;
  const set = (p: Partial<GenState>) => st.set((x) => ({ gen: { ...x.gen, ...p } }));
  const busy = !!g.job;
  const spec = parseLength(g.size, s.unit);
  const guess = g.detail === "quick" ? 23 : 95;

  const start = (kind: GenState["jobKind"], stages: string[], seconds: number, ms: number, done: () => void) => {
    cancelled.current = false;
    runJob(st, kind, stages, seconds, ms, () => {
      if (!cancelled.current) done();
    });
  };

  const makeIt = () => {
    if (!spec) return;
    start("make", ["Loading the model...", "Shaping it in 3D...", g.keepColors ? "Painting the colors..." : "Smoothing the surface...", "Adding it to the scene..."], guess, 5200, () => {
      const name = st.get().gen.description.trim() ? "a cute round owl" : "Owl";
      const l: Layer = makeLayer(name, { kind: "owl", colors: g.keepColors }, "#8a5a36", [0, 0, 0]);
      const b = localOf(l).box;
      const ax = g.sizeAxis === "height" ? 2 : g.sizeAxis === "width" ? 0 : 1;
      const k = spec / Math.max(1, b.max[ax] - b.min[ax]);
      const scaled: Layer = { ...l, scale: [k, k, k] };
      act.addLayers([scaled], `Generate ${name}`);
      set({ result: { layerId: scaled.id, name, printable: false } });
    });
  };

  const tab = g.tab;
  const result = g.result && s.doc.nodes[g.result.layerId] ? g.result : null;

  return (
    <div className={c("ai-panel")}>
      <div className={c("ai-head")}>
        <Icon name="generate" size={16} />
        <span className={c("ai-title")}>Generate</span>
        <Segmented<GenState["tab"]>
          value={tab}
          options={[
            { value: "picture", label: "Picture" },
            { value: "description", label: "Description" },
            { value: "models", label: "Models" },
          ]}
          onChange={(t) => set({ tab: t })}
        />
        <button type="button" className={c("tbtn icon")} onClick={() => set({ open: false })} title="Close (Esc)">
          <Icon name="close" size={14} />
        </button>
      </div>
      {g.job && (
        <JobBar
          job={g.job}
          onCancel={() => {
            cancelled.current = true;
            set({ job: null, jobKind: null });
          }}
        />
      )}
      <div className={c("ai-body")}>
        {tab === "picture" && (
          <>
            <div className={c("ai-step")}>
              <div className={c("ai-label")}>1. Picture</div>
              <div className={c("ai-pics")}>
                <div className={c("ai-pic")}>
                  <div className={c("ai-img")} style={g.pickedCand !== null ? CANDS[g.pickedCand] : PIC} />
                  <span>Picture</span>
                </div>
                <div className={c("ai-pic")}>
                  <div className={c("ai-img")} style={g.removeBg ? PIC_NO_BG : PIC} />
                  <span>{g.removeBg ? "Without background" : "As it is"}</span>
                </div>
              </div>
              <div className={c("ai-row")}>
                <button type="button" className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app this opens a picture from your PC.")}>
                  Another picture...
                </button>
                <label className={c("ai-toggle")} title="Takes the background away so only the object is turned into 3D">
                  <Toggle checked={g.removeBg} onChange={(v) => set({ removeBg: v })} disabled={busy} label="Take the background away" />
                  <span>Take the background away</span>
                </label>
              </div>
            </div>
            <div className={c("ai-step")}>
              <div className={c("ai-label")}>
                2. Quick looks <span className={c("ai-dim")}>(about 48 s)</span>
              </div>
              {g.looks ? (
                <div className={c("ai-looks")}>
                  {LOOKS.map((lk, i) => (
                    <button key={i} type="button" className={c("ai-look", g.picked === i && "on")} onClick={() => set({ picked: i })} title={`Variant ${i + 1}`}>
                      <div className={c("ai-img")} style={lk} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className={c("ai-hint")}>Four rough versions to pick from before making the real one. Optional.</div>
              )}
              <button
                type="button"
                className={c("btn btn-secondary btn-small")}
                disabled={busy}
                onClick={() => start("looks", ["Making four quick looks..."], 48, 3200, () => set({ looks: true, picked: 0 }))}
              >
                {g.looks ? "Four new looks" : "Show four quick looks"}
              </button>
            </div>
            <div className={c("ai-step")}>
              <div className={c("ai-label")}>3. Make it</div>
              <div className={c("ai-label")}>How big</div>
              <div className={c("ai-row")}>
                <input
                  className={c("field-input ai-size-input")}
                  value={g.size}
                  placeholder={s.unit === "in" ? "3 in" : "80 mm"}
                  onChange={(e) => set({ size: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                  title='Type a size like "80 mm", "3 in". Plain numbers use the unit set at the top.'
                />
                <Segmented<GenState["sizeAxis"]>
                  value={g.sizeAxis}
                  options={[
                    { value: "height", label: "Tall" },
                    { value: "width", label: "Wide" },
                    { value: "depth", label: "Deep" },
                  ]}
                  onChange={(v) => set({ sizeAxis: v })}
                />
              </div>
              {spec ? (
                <div className={c("ai-hint")}>
                  It will be {formatLength(spec, s.unit)} {s.unit} {g.sizeAxis === "height" ? "tall" : g.sizeAxis === "width" ? "wide" : "deep"}, on the bed.
                </div>
              ) : (
                <div className={c("ai-hint")}>Type how big it should be first.</div>
              )}
              <div className={c("ai-row")}>
                <span className={c("ai-label-inline")}>Detail</span>
                <Segmented<GenState["detail"]>
                  value={g.detail}
                  options={[
                    { value: "quick", label: "Quick" },
                    { value: "fine", label: "Fine" },
                  ]}
                  onChange={(v) => set({ detail: v })}
                />
                <span className={c("ai-label-inline")}>about {guess < 60 ? `${guess} s` : `${Math.round(guess / 60)} min`}</span>
              </div>
              <div className={c("ai-row")}>
                <label className={c("ai-toggle")} title="Paints the model in the picture's colors, as filament colors for multi-color printing">
                  <Toggle checked={g.keepColors} onChange={(v) => set({ keepColors: v })} label="Keep the colors" />
                  <span>Keep the colors</span>
                </label>
                {g.keepColors && (
                  <>
                    <span className={c("ai-label-inline")}>Filaments</span>
                    <Segmented<string> value={String(g.filaments)} options={["2", "3", "4", "6", "8"].map((v) => ({ value: v, label: v }))} onChange={(v) => set({ filaments: Number(v) })} />
                  </>
                )}
              </div>
              <button type="button" className={c("btn btn-primary")} disabled={busy || !spec} onClick={makeIt}>
                {g.looks && g.picked !== null ? `Make look ${g.picked + 1}` : "Make it"}
              </button>
            </div>
          </>
        )}

        {tab === "description" && (
          <>
            <div className={c("ai-step")}>
              <div className={c("ai-label")}>1. Describe it</div>
              <textarea
                className={c("field-input text-area ai-text")}
                rows={3}
                value={g.description}
                placeholder="A small owl figurine sitting on a branch"
                onChange={(e) => set({ description: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className={c("btn btn-primary btn-small")}
                disabled={busy || !g.description.trim()}
                onClick={() => start("pictures", ["Drawing four pictures..."], 30, 3400, () => set({ cands: true, pickedCand: null }))}
              >
                Draw four pictures (about 30 s)
              </button>
            </div>
            {g.cands && (
              <div className={c("ai-step")}>
                <div className={c("ai-label")}>2. Pick one</div>
                <div className={c("ai-cands")}>
                  {CANDS.map((cd, i) => (
                    <button key={i} type="button" className={c("ai-cand", g.pickedCand === i && "on")} disabled={busy} onClick={() => set({ pickedCand: i, tab: "picture", looks: false, picked: null })}>
                      <div className={c("ai-img")} style={cd} />
                    </button>
                  ))}
                </div>
                <div className={c("ai-hint")}>Click a picture to turn it into 3D.</div>
              </div>
            )}
          </>
        )}

        {tab === "models" && (
          <>
            <div className={c("ai-hint")}>Graphics card: NVIDIA GeForce RTX 3060 Ti (8 GB). Everything below runs on this PC, with no account and no internet once it&apos;s downloaded.</div>
            {[
              { name: "Picture to 3D", what: "Turns one picture into a colored 3D model.", size: "14.8 GB", have: true },
              { name: "Pictures from words", what: "Draws four pictures from a description.", size: "6.9 GB", have: true },
              { name: "Finer detail", what: "Sharper small details when Detail is set to Fine.", size: "3.1 GB", have: false },
            ].map((m) => (
              <div key={m.name} className={c("ai-model")}>
                <Icon name={m.have ? "check" : "generate"} size={16} />
                <div className={c("ai-model-text")}>
                  <div className={c("ai-model-name")}>{m.name}</div>
                  <div className={c("ai-hint")}>
                    {m.what} {m.size}
                  </div>
                </div>
                <button
                  type="button"
                  className={c("btn btn-small", m.have ? "btn-secondary" : "btn-primary")}
                  onClick={() => notify(m.have ? `In the app this removes "${m.name}" from your PC.` : `In the app this downloads "${m.name}" (${m.size}) to your PC.`)}
                >
                  {m.have ? "Remove" : "Download"}
                </button>
              </div>
            ))}
          </>
        )}

        {result && (
          <div className={c("ai-result")}>
            <div className={c("ai-result-title")}>
              <Icon name="check" size={14} /> Added &quot;{result.name}&quot; to the scene
            </div>
            <div className={c("ai-hint")}>
              {result.printable
                ? "Closed and ready to print."
                : "It came in as made. AI models often have small gaps and tangled faces; Make it printable removes loose crumbs and rebuilds it as one closed, solid surface (Undo takes it back)."}
            </div>
            <div className={c("ai-row")}>
              <button
                type="button"
                className={c("btn btn-primary btn-small")}
                disabled={busy || result.printable}
                onClick={() =>
                  start("printable", ["Removing loose crumbs...", "Closing the gaps...", "Rebuilding the surface..."], 9, 2600, () => {
                    set({ result: { ...result, printable: true } });
                    act.info("Closed and ready to print in 9 s (removed 3 loose crumbs).", "success");
                  })
                }
              >
                Make it printable
              </button>
              <button type="button" className={c("btn btn-secondary btn-small btn-icon-label")} onClick={() => act.info("Make it flexi turns it into a print-in-place toy with moving joints.")}>
                <Icon name="flexi" size={13} />
                Make it flexi
              </button>
              <button type="button" className={c("btn btn-secondary btn-small")} onClick={() => act.select([result.layerId])}>
                Select it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
