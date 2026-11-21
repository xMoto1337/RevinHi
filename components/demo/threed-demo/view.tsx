"use client";

// The 3D view, drawn as flat SVG (no 3D library): an orthographic camera projects every face,
// faces are shaded by a fixed light and drawn back to front. Holes in an editable cut are drawn
// as openings in the top of what they cut (wall + floor), the way the app shows a computed cut.

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  type Doc,
  type Layer,
  type Part,
  type Vec3,
  type V2,
  boxSize,
  isEmptyBox,
  layersUnder,
  mul,
  profileOf,
  rotMatrix,
  selectionBox,
  toWorld,
  topOf,
  worldOf,
  nodeBox,
} from "./scene";
import { bedOf, moveDoc, setRotationDoc, setSizeDoc, snapMm, useActions, useApp, useStore, type AppState, type Cam } from "./store";
import { Icon, c, formatLength, type IconName } from "./ui";

// ------------------------------------------------------------------ vector math

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (...v: Vec3[]): Vec3 => v.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0] as Vec3);
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const D = Math.PI / 180;

export function basis(cam: Cam) {
  const y = cam.yaw * D;
  const p = cam.pitch * D;
  const R: Vec3 = [Math.cos(y), Math.sin(y), 0];
  const F: Vec3 = [-Math.sin(y) * Math.cos(p), Math.cos(y) * Math.cos(p), -Math.sin(p)];
  const U: Vec3 = [-Math.sin(y) * Math.sin(p), Math.cos(y) * Math.sin(p), Math.cos(p)];
  return { R, U, F };
}

type Proj = (p: Vec3) => [number, number, number];

export function projector(cam: Cam, w: number, h: number): Proj {
  const { R, U, F } = basis(cam);
  return (p) => {
    const d = sub(p, cam.target);
    return [w / 2 + cam.zoom * dot(d, R), h / 2 - cam.zoom * dot(d, U), dot(d, F)];
  };
}

function newell(pts: Vec3[]): Vec3 {
  let x = 0,
    y = 0,
    z = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const l = Math.hypot(x, y, z);
  return l < 1e-9 ? [0, 0, 0] : [x / l, y / l, z / l];
}

const pathOf = (loops: Vec3[][], P: Proj) =>
  loops
    .map((lp) => "M" + lp.map((p) => { const q = P(p); return `${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join("L") + "Z")
    .join("");

// ------------------------------------------------------------------ color

function rgbOf(hex: string): Vec3 {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex: string, k: number, lift = 0): string {
  const [r, g, b] = rgbOf(hex);
  const f = (v: number) => Math.round(Math.max(0, Math.min(255, v * k + 255 * lift)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

const CLAY = "#c9c3b9";

// ------------------------------------------------------------------ scene building

/** What a click on a drawn face means. */
export interface Pick {
  /** What a click selects. */
  id: string;
  layerId: string;
  n: Vec3;
  p0: Vec3;
}

interface Drawable {
  depth: number;
  el: ReactNode;
}

interface BuildArgs {
  doc: Doc;
  sel: string[];
  cam: Cam;
  w: number;
  h: number;
  lighting: AppState["lighting"];
  edges: boolean;
  xray: boolean;
  overhang: boolean;
  idp: string;
}

function buildScene(a: BuildArgs) {
  const P = projector(a.cam, a.w, a.h);
  const { R, U, F } = basis(a.cam);
  const L = norm(add(scl(F, -0.75), scl(U, 0.6), scl(R, -0.35)));
  const bright = (n: Vec3) => 0.5 + 0.4 * Math.max(0, dot(n, L)) + 0.12 * Math.max(0, n[2]);
  const picks: Pick[] = [];
  const draw: Drawable[] = [];
  const selSet = new Set(a.sel.flatMap((id) => layersUnder(a.doc, id).map((l) => l.id)));
  let clipN = 0;

  const faceEls = (parts: Part[], l: Layer, pickId: string, opts: { selected: boolean; ghost?: boolean }) => {
    const items: { d: number; el: ReactNode }[] = [];
    parts.forEach((part, pi) => {
      part.faces.forEach((f, fi) => {
        const pts = f.loops[0];
        if (pts.length < 3) return;
        const n = newell(pts);
        if (n[0] === 0 && n[1] === 0 && n[2] === 0) return;
        const facing = dot(n, F) < 0;
        if (part.cull && !facing && !opts.ghost) return;
        let d = 0;
        for (const p of pts) d += dot(sub(p, a.cam.target), F);
        d /= pts.length;
        let fill: string;
        let stroke: string;
        let sw = 0.6;
        if (opts.ghost) {
          fill = facing ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)";
          stroke = "rgba(255,255,255,0.3)";
          sw = 0.7;
        } else {
          const base = a.lighting === "clay" ? CLAY : (f.color ?? part.color ?? l.color);
          const minZ = Math.min(...pts.map((p) => p[2]));
          const over = a.overhang && n[2] < -0.55 && minZ > 0.4;
          fill = over ? shade("#ff5a3c", bright(n) + 0.25) : shade(base, bright(n), opts.selected ? 0.04 : 0);
          stroke = a.edges ? "rgba(255,255,255,0.38)" : fill;
          sw = 0.9;
          if (a.edges) sw = 0.7;
        }
        const idx = picks.length;
        picks.push({ id: pickId, layerId: l.id, n, p0: pts[0] });
        items.push({
          d,
          el: <path key={`${l.id}-${pi}-${fi}`} d={pathOf(f.loops, P)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" fillRule="evenodd" data-f={idx} />,
        });
      });
    });
    items.sort((x, y) => y.d - x.d);
    return items.map((i) => i.el);
  };

  /** Openings that hole layers cut into the top of a solid (the computed cut, drawn). */
  const holeDecor = (solid: Layer, holes: Layer[]): ReactNode[] => {
    if (!(a.cam.pitch > 0.5)) return [];
    const pr = profileOf(solid);
    if (!pr || solid.rot[0] || solid.rot[1]) return [];
    const sz = solid.scale[2];
    let zLo = 0;
    let zHi = pr.h;
    if (solid.clip) {
      zLo = Math.max(0, (solid.clip[0] - solid.pos[2]) / sz);
      zHi = Math.min(pr.h, (solid.clip[1] - solid.pos[2]) / sz);
    }
    const zTop = solid.pos[2] + zHi * sz;
    const zBot = solid.pos[2] + zLo * sz;
    const sAt = (z: number) => 1 + (pr.topScale - 1) * (pr.h > 0 ? z / pr.h : 0);
    const fS = toWorld(solid);
    const topLoops = pr.outer.map((o) => o.map(([x, y]) => fS([x * sAt(zHi), y * sAt(zHi), zHi])));
    const out: ReactNode[] = [];
    const base = a.lighting === "clay" ? CLAY : solid.color;
    for (const hl of holes) {
      const hp = profileOf(hl);
      if (!hp || hl.rot[0] || hl.rot[1]) continue;
      const hz = hl.scale[2];
      const hb = hl.pos[2];
      const ht = hb + hp.h * hz;
      if (!(hb < zTop - 0.01 && ht >= zTop - 0.01)) continue;
      const fH = toWorld(hl);
      const hsAt = (z: number) => 1 + (hp.topScale - 1) * (hp.h > 0 ? z / hp.h : 0);
      const ring = (zw: number) => {
        const zl = (zw - hb) / hz;
        return hp.outer.map((o) => o.map(([x, y]) => fH([x * hsAt(zl), y * hsAt(zl), zl])));
      };
      const through = hb <= zBot + 0.01;
      const floorZ = Math.max(hb, zBot);
      const open = pathOf(ring(zTop), P);
      const floor = pathOf(ring(floorZ), P);
      const k = clipN++;
      const topId = `${a.idp}top${k}`;
      const openId = `${a.idp}op${k}`;
      const wallId = `${a.idp}wl${k}`;
      const idx = picks.length;
      picks.push({ id: hl.id, layerId: hl.id, n: [0, 0, 1], p0: [hl.pos[0], hl.pos[1], zTop] });
      out.push(
        <g key={`hole-${solid.id}-${hl.id}`}>
          <defs>
            <clipPath id={topId}>
              <path d={pathOf(topLoops, P)} />
            </clipPath>
            <clipPath id={openId}>
              <path d={open} />
            </clipPath>
            {/* The far inside wall: lit near the rim, darker deeper down. */}
            <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={shade(base, 0.78)} />
              <stop offset="1" stopColor={shade(base, 0.36)} />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${topId})`} data-f={idx}>
            <path d={open} fill={`url(#${wallId})`} />
            <g clipPath={`url(#${openId})`}>
              <path d={floor} fill={through ? "#0c0d11" : shade(base, 0.7)} />
            </g>
            <path d={open} fill="none" stroke={shade(base, 0.35)} strokeWidth={1.2} />
          </g>
        </g>,
      );
    }
    return out;
  };

  const textEl = (l: Layer, selected: boolean, pickId: string): ReactNode => {
    if (l.source.kind !== "text") return null;
    const spec = l.source.spec;
    const f = toWorld(l);
    const z0 = spec.flip ? -spec.depth : 0;
    const z1 = spec.flip ? 0 : spec.depth;
    const mat = (z: number) => {
      const O = P(f([0, 0, z]));
      const X = P(f([1, 0, z]));
      const Y = P(f([0, -1, z]));
      return `matrix(${(X[0] - O[0]).toFixed(4)} ${(X[1] - O[1]).toFixed(4)} ${(Y[0] - O[0]).toFixed(4)} ${(Y[1] - O[1]).toFixed(4)} ${O[0].toFixed(2)} ${O[1].toFixed(2)})`;
    };
    const topN = norm(mul(rotMatrix(l.rot), [0, 0, 1]));
    const base = a.lighting === "clay" ? CLAY : l.color;
    const lines = spec.text.split("\n");
    const lh = spec.size * 1.25;
    const pathId = `${a.idp}tp${l.id}`;
    const r = spec.curve;
    const family = `"${spec.font}", ${spec.font.includes("Script") ? "cursive" : "sans-serif"}`;
    const body = (fill: string) => (
      <text
        fontSize={spec.size}
        fontFamily={family}
        fontWeight={spec.bold ? 700 : 400}
        letterSpacing={spec.spacing}
        textAnchor="middle"
        dominantBaseline="central"
        fill={fill}
        stroke={a.edges ? "rgba(255,255,255,0.4)" : "none"}
        strokeWidth={a.edges ? 0.08 : 0}
        transform={spec.mirror ? "scale(-1 1)" : undefined}
      >
        {r !== 0 ? (
          <textPath href={`#${pathId}`} startOffset="50%">
            {lines[0]}
          </textPath>
        ) : (
          lines.map((ln, i) => (
            <tspan key={i} x={0} y={(i - (lines.length - 1) / 2) * lh}>
              {ln}
            </tspan>
          ))
        )}
      </text>
    );
    const steps = Math.max(2, Math.min(16, Math.round(Math.abs(z1 - z0) * Math.abs(l.scale[2]) * a.cam.zoom / 1.1)));
    const layersEls: ReactNode[] = [];
    const side = shade(base, 0.52, selected ? 0.04 : 0);
    const order = Array.from({ length: steps + 1 }, (_, i) => i);
    if (dot(topN, F) > 0) order.reverse();
    for (const i of order) {
      const z = z0 + ((z1 - z0) * i) / steps;
      const isTop = i === steps;
      layersEls.push(
        <g key={i} transform={mat(z)}>
          {body(isTop ? shade(base, bright(topN), selected ? 0.04 : 0) : side)}
        </g>,
      );
    }
    const idx = picks.length;
    picks.push({ id: pickId, layerId: l.id, n: topN, p0: f([0, 0, z1]) });
    return (
      <g key={`text-${l.id}`} data-f={idx}>
        {r !== 0 && (
          <defs>
            <path id={pathId} d={r > 0 ? `M ${-r} ${r} A ${r} ${r} 0 0 1 ${r} ${r}` : `M ${r} ${r} A ${-r} ${-r} 0 0 0 ${-r} ${r}`} />
          </defs>
        )}
        {layersEls}
      </g>
    );
  };

  const centerDepth = (l: Layer) => {
    const b = worldOf(l).box;
    if (isEmptyBox(b)) return 0;
    return dot(sub(scl(add(b.min, b.max), 0.5), a.cam.target), F);
  };

  const pushLayer = (l: Layer, pickId: string, holes: Layer[], groupGhost: boolean) => {
    const selected = selSet.has(l.id);
    const ghost = l.ghost || groupGhost;
    let el: ReactNode;
    if (l.source.kind === "text") el = textEl(l, selected, pickId);
    else {
      const faces = faceEls(worldOf(l).parts, l, pickId, { selected });
      const decor = holes.length ? holeDecor(l, holes) : [];
      el = (
        <g key={l.id}>
          {faces}
          {decor}
        </g>
      );
    }
    draw.push({
      depth: centerDepth(l),
      el: (
        <g key={`o-${l.id}`} opacity={ghost ? 0.35 : a.xray ? 0.55 : 1} pointerEvents={ghost ? "none" : undefined}>
          {el}
        </g>
      ),
    });
  };

  const visit = (id: string, top: string, inheritGhost: boolean) => {
    const n = a.doc.nodes[id];
    if (!n || !n.visible) return;
    if (n.type === "layer") {
      if (n.mode === "hole") {
        draw.push({ depth: centerDepth(n) - 0.01, el: <g key={`g-${n.id}`}>{faceEls(worldOf(n).parts, n, n.id, { selected: false, ghost: true })}</g> });
        return;
      }
      pushLayer(n, top, [], inheritGhost);
      return;
    }
    const kids = n.children.map((ch) => a.doc.nodes[ch]).filter((x) => x && x.visible);
    const holes = kids.filter((k): k is Layer => k.type === "layer" && k.mode === "hole");
    if (holes.length || n.purpose === "cut") {
      const solids = kids.filter((k) => !(k.type === "layer" && k.mode === "hole"));
      for (const s of solids) {
        if (s.type === "layer") pushLayer(s, top, holes, inheritGhost || n.ghost);
        else visit(s.id, top, inheritGhost || n.ghost);
      }
      return;
    }
    for (const k of kids) visit(k.id, top, inheritGhost || n.ghost);
  };
  for (const r of a.doc.roots) visit(r, r, false);
  draw.sort((x, y) => y.depth - x.depth);

  // Selected holes show as see-through shapes on top.
  const overlay: ReactNode[] = [];
  for (const id of a.sel) {
    const l = a.doc.nodes[id];
    if (l?.type !== "layer" || l.mode !== "hole" || !l.visible) continue;
    overlay.push(<g key={`sel-${l.id}`}>{faceEls(worldOf(l).parts, l, l.id, { selected: true, ghost: true })}</g>);
  }
  return { els: draw.map((d) => d.el), overlay, picks, P };
}

// ------------------------------------------------------------------ grid and bed

function Grid({ cam, w, h, bed, idp }: { cam: Cam; w: number; h: number; bed: [number, number] | null; idp: string }) {
  const P = projector(cam, w, h);
  const lines: ReactNode[] = [];
  const ext = 320;
  for (let v = -ext; v <= ext; v += 10) {
    const major = v % 50 === 0;
    const op = major ? 0.11 : 0.05;
    const a1 = P([v, -ext, 0]);
    const b1 = P([v, ext, 0]);
    const a2 = P([-ext, v, 0]);
    const b2 = P([ext, v, 0]);
    if (v !== 0) {
      lines.push(<line key={`x${v}`} x1={a1[0]} y1={a1[1]} x2={b1[0]} y2={b1[1]} stroke={`rgba(255,255,255,${op})`} strokeWidth={1} />);
      lines.push(<line key={`y${v}`} x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} stroke={`rgba(255,255,255,${op})`} strokeWidth={1} />);
    }
  }
  const xa = P([-ext - 200, 0, 0]);
  const xb = P([ext + 200, 0, 0]);
  const ya = P([0, -ext - 200, 0]);
  const yb = P([0, ext + 200, 0]);
  const bedEls: ReactNode[] = [];
  if (bed) {
    const [bw, bd] = bed;
    const cs: Vec3[] = [
      [-bw / 2, -bd / 2, 0],
      [bw / 2, -bd / 2, 0],
      [bw / 2, bd / 2, 0],
      [-bw / 2, bd / 2, 0],
    ];
    bedEls.push(<path key="bed" d={pathOf([cs], P)} fill="rgba(255,166,48,0.025)" stroke="rgba(255,166,48,0.75)" strokeWidth={1.3} />);
    for (let v = 0; v <= Math.max(bw, bd); v += 50) {
      if (v <= bd) {
        const p = P([-bw / 2, -bd / 2 + v, 0]);
        const t = P([-bw / 2 - 5, -bd / 2 + v, 0]);
        const l = P([-bw / 2 - 12, -bd / 2 + v, 0]);
        bedEls.push(<line key={`ty${v}`} x1={p[0]} y1={p[1]} x2={t[0]} y2={t[1]} stroke="rgba(255,166,48,0.6)" />);
        if (v > 0)
          bedEls.push(
            <text key={`ly${v}`} x={l[0]} y={l[1]} fontSize={9.5} fill="rgba(184,196,217,0.75)" textAnchor="end" dominantBaseline="central">
              {v}
            </text>,
          );
      }
      if (v <= bw) {
        const p = P([-bw / 2 + v, -bd / 2, 0]);
        const t = P([-bw / 2 + v, -bd / 2 - 5, 0]);
        const l = P([-bw / 2 + v, -bd / 2 - 13, 0]);
        bedEls.push(<line key={`tx${v}`} x1={p[0]} y1={p[1]} x2={t[0]} y2={t[1]} stroke="rgba(255,166,48,0.6)" />);
        bedEls.push(
          <text key={`lx${v}`} x={l[0]} y={l[1]} fontSize={9.5} fill="rgba(184,196,217,0.75)" textAnchor="middle" dominantBaseline="central">
            {v}
          </text>,
        );
      }
    }
  }
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${idp}fade`} cx={w / 2} cy={h * 0.55} r={Math.max(w, h) * 0.75} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${idp}mask`}>
          <rect x={0} y={0} width={w} height={h} fill={`url(#${idp}fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${idp}mask)`}>
        {lines}
        <line x1={xa[0]} y1={xa[1]} x2={xb[0]} y2={xb[1]} stroke="rgba(255,90,110,0.55)" strokeWidth={1.1} />
        <line x1={ya[0]} y1={ya[1]} x2={yb[0]} y2={yb[1]} stroke="rgba(46,213,115,0.5)" strokeWidth={1.1} />
      </g>
      {bedEls}
    </g>
  );
}

// ------------------------------------------------------------------ selection brackets and handles

const AXIS_COLOR = ["#ff3b4e", "#2ed573", "#3d7bff"];

function Brackets({ box, P }: { box: { min: Vec3; max: Vec3 }; P: Proj }) {
  const segs: ReactNode[] = [];
  const xs = [box.min[0], box.max[0]];
  const ys = [box.min[1], box.max[1]];
  const zs = [box.min[2], box.max[2]];
  let k = 0;
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      for (let m = 0; m < 2; m++) {
        const c0: Vec3 = [xs[i], ys[j], zs[m]];
        const p0 = P(c0);
        const nbrs: Vec3[] = [
          [xs[1 - i], ys[j], zs[m]],
          [xs[i], ys[1 - j], zs[m]],
          [xs[i], ys[j], zs[1 - m]],
        ];
        for (const nb of nbrs) {
          const p1 = P(nb);
          const dx = p1[0] - p0[0];
          const dy = p1[1] - p0[1];
          const len = Math.hypot(dx, dy);
          if (len < 1) continue;
          const t = Math.min(10, len * 0.25) / len;
          segs.push(<line key={k++} x1={p0[0]} y1={p0[1]} x2={p0[0] + dx * t} y2={p0[1] + dy * t} stroke="rgba(255,255,255,0.85)" strokeWidth={1.4} strokeLinecap="round" />);
        }
      }
  return <g pointerEvents="none">{segs}</g>;
}

function Gizmo({ origin, mode, P, cam }: { origin: Vec3; mode: AppState["gizmo"]; P: Proj; cam: Cam }) {
  const { F } = basis(cam);
  const o = P(origin);
  const len = 66 / cam.zoom;
  const els: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const e: Vec3 = [0, 0, 0];
    e[i] = 1;
    const col = AXIS_COLOR[i];
    if (mode === "rotate") {
      const rad = 54 / cam.zoom;
      const [u, v] = i === 2 ? [0, 1] : i === 0 ? [1, 2] : [2, 0];
      const pts: Vec3[] = Array.from({ length: 64 }, (_, k) => {
        const p = [...origin] as Vec3;
        p[u] += rad * Math.cos((2 * Math.PI * k) / 64);
        p[v] += rad * Math.sin((2 * Math.PI * k) / 64);
        return p;
      });
      const d = pathOf([pts], P);
      els.push(
        <g key={i} data-gz={`r${i}`} style={{ cursor: "grab" }}>
          <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
          <path d={d} fill="none" stroke={col} strokeWidth={2} opacity={Math.abs(dot(e, F)) < 0.12 ? 0.4 : 0.95} />
        </g>,
      );
      continue;
    }
    const end = P(add(origin, scl(e, len)));
    const dx = end[0] - o[0];
    const dy = end[1] - o[1];
    const sl = Math.hypot(dx, dy);
    if (sl < 6) continue;
    const ux = dx / sl;
    const uy = dy / sl;
    const head =
      mode === "translate" ? (
        <path d={`M${end[0] + ux * 11} ${end[1] + uy * 11}L${end[0] - uy * 5} ${end[1] + ux * 5}L${end[0] + uy * 5} ${end[1] - ux * 5}Z`} fill={col} />
      ) : (
        <rect x={end[0] - 5} y={end[1] - 5} width={10} height={10} rx={1.5} fill={col} />
      );
    els.push(
      <g key={i} data-gz={`${mode === "translate" ? "t" : "s"}${i}`} style={{ cursor: "grab" }}>
        <line x1={o[0]} y1={o[1]} x2={end[0] + ux * 8} y2={end[1] + uy * 8} stroke="transparent" strokeWidth={14} />
        <line x1={o[0]} y1={o[1]} x2={end[0]} y2={end[1]} stroke={col} strokeWidth={2.4} />
        {head}
      </g>,
    );
  }
  return (
    <g>
      {els}
      <rect x={o[0] - 5} y={o[1] - 5} width={10} height={10} rx={2} fill="rgba(255,240,120,0.85)" stroke="rgba(0,0,0,0.35)" pointerEvents="none" />
    </g>
  );
}

// ------------------------------------------------------------------ view cube

const CUBE_FACES: { n: Vec3; label: string; view: [number, number] }[] = [
  { n: [0, 0, 1], label: "TOP", view: [0, 89.9] },
  { n: [0, -1, 0], label: "FRONT", view: [0, 0] },
  { n: [1, 0, 0], label: "RIGHT", view: [90, 0] },
  { n: [0, 1, 0], label: "BACK", view: [180, 0] },
  { n: [-1, 0, 0], label: "LEFT", view: [-90, 0] },
  { n: [0, 0, -1], label: "BOTTOM", view: [0, -89.9] },
];

function ViewCube({ cam, onView }: { cam: Cam; onView: (yaw: number, pitch: number) => void }) {
  const { R, U, F } = basis(cam);
  const s = 27;
  const P = (p: Vec3): [number, number] => [55 + s * dot(p, R), 55 - s * dot(p, U)];
  const faces = CUBE_FACES.map((f) => {
    const t1: Vec3 = Math.abs(f.n[2]) > 0.5 ? [1, 0, 0] : [f.n[1], -f.n[0], 0].map((v) => -v) as Vec3;
    const t2: Vec3 = Math.abs(f.n[2]) > 0.5 ? (f.n[2] > 0 ? [0, 1, 0] : [0, -1, 0]) : [0, 0, 1];
    const corner = (a: number, b: number) => add(f.n, scl(t1, a), scl(t2, b));
    const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].map(P);
    const O = P(f.n);
    const X = P(add(f.n, t1));
    const Y = P(add(f.n, scl(t2, -1)));
    return { f, pts, facing: dot(f.n, F) < -0.02, d: dot(f.n, F), m: `matrix(${X[0] - O[0]} ${X[1] - O[1]} ${Y[0] - O[0]} ${Y[1] - O[1]} ${O[0]} ${O[1]})` };
  })
    .filter((x) => x.facing)
    .sort((x, y) => y.d - x.d);
  return (
    <div className={c("view-cube")}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        {faces.map(({ f, pts, m }) => (
          <g key={f.label} onClick={() => onView(f.view[0], f.view[1])} style={{ cursor: "pointer" }}>
            <title>{`Look from the ${f.label.toLowerCase()}`}</title>
            <path d={"M" + pts.map((p) => p.join(" ")).join("L") + "Z"} fill="rgba(36,38,46,0.92)" stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
            <text transform={m} fontSize={0.36} fontWeight={700} fill="rgba(220,226,240,0.85)" textAnchor="middle" dominantBaseline="central" letterSpacing={0.02}>
              {f.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------ view bar (panels/ViewBar.tsx)

function Tool({ icon, label, on, onClick, title }: { icon: IconName; label?: string; on?: boolean; onClick: () => void; title: string }) {
  return (
    <button type="button" className={c("vbtn", on && "on")} onClick={onClick} title={title} aria-pressed={on}>
      <Icon name={icon} size={15} />
      {label && <span>{label}</span>}
    </button>
  );
}

function ViewBar() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const advanced = s.mode === "advanced";
  return (
    <div className={c("viewbar")}>
      <div className={c("vgroup")}>
        <Tool icon="move" on={s.gizmo === "translate"} onClick={() => st.set({ gizmo: "translate" })} title="Move handles (W). You can also drag any object to move it." />
        <Tool icon="rotate" on={s.gizmo === "rotate"} onClick={() => st.set({ gizmo: "rotate" })} title="Rotate (E)" />
        <Tool icon="scale" on={s.gizmo === "scale"} onClick={() => st.set({ gizmo: "scale" })} title="Resize handles (R)" />
      </div>
      <div className={c("vgroup")}>
        <Tool icon="magnet" label="Snap" on={s.snap} onClick={() => st.set({ snap: !s.snap })} title="Snap to the grid while moving, with the handles or by dragging an object (S)" />
      </div>
      <div className={c("vgroup")}>
        <Tool icon={s.lighting === "studio" ? "light" : "circle"} label={s.lighting === "studio" ? "Studio" : "Clay"} onClick={() => st.set({ lighting: s.lighting === "studio" ? "clay" : "studio" })} title="Switch between studio lighting and the clay look" />
        <Tool icon="wireframe" label="Edges" on={s.edges} onClick={() => st.set({ edges: !s.edges })} title="Show the edges of every face (Alt+W)" />
        {advanced && <Tool icon="xray" label="See-through" on={s.xray} onClick={() => st.set({ xray: !s.xray })} title="See through everything (Alt+X)" />}
        <Tool icon="frame" onClick={() => act.frame()} title="Zoom to selection (F)" />
      </div>
    </div>
  );
}

function SizeReadout() {
  const s = useApp();
  if (!s.selection.length) return null;
  const b = selectionBox(s.doc, s.selection);
  if (isEmptyBox(b)) return null;
  const [w, d, h] = boxSize(b);
  return (
    <div className={c("size-readout")} title="Size of the selection: width x depth x height">
      <span className={c("size-k")}>W</span>
      <span className={c("size-v")}>{formatLength(w, s.unit)}</span>
      <span className={c("size-x")}>&times;</span>
      <span className={c("size-k")}>D</span>
      <span className={c("size-v")}>{formatLength(d, s.unit)}</span>
      <span className={c("size-x")}>&times;</span>
      <span className={c("size-k")}>H</span>
      <span className={c("size-v")}>{formatLength(h, s.unit)}</span>
      <span className={c("size-u")}>{s.unit}</span>
    </div>
  );
}

function Notices() {
  const s = useApp();
  const st = useStore();
  if (!s.notices.length) return null;
  return (
    <div className={c("notices")}>
      {s.notices.map((n) => (
        <div key={n.id} className={c("notice", n.kind === "error" && "notice-error", n.kind === "success" && "notice-success")}>
          <span className={c("notice-text")}>{n.text}</span>
          <button type="button" className={c("notice-close")} onClick={() => st.set((x) => ({ notices: x.notices.filter((y) => y.id !== n.id) }))} aria-label="Close">
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ measuring helpers

/** How thick the object is straight behind a clicked point (along -normal). */
export function thicknessAt(l: Layer, p: Vec3, n: Vec3): number | null {
  const dir = scl(n, -1);
  let best: number | null = null;
  for (const part of worldOf(l).parts)
    for (const f of part.faces) {
      const pts = f.loops[0];
      const fn = newell(pts);
      const den = dot(fn, dir);
      if (Math.abs(den) < 1e-6) continue;
      const t = dot(fn, sub(pts[0], p)) / den;
      if (t < 0.05) continue;
      const q = add(p, scl(dir, t));
      const ax = fn.map(Math.abs);
      const drop = ax.indexOf(Math.max(...ax));
      const [i, j] = drop === 0 ? [1, 2] : drop === 1 ? [0, 2] : [0, 1];
      let inside = false;
      for (let k = 0, m = pts.length - 1; k < pts.length; m = k++) {
        const a = pts[k];
        const b = pts[m];
        if (a[j] > q[j] !== b[j] > q[j] && q[i] < ((b[i] - a[i]) * (q[j] - a[j])) / (b[j] - a[j]) + a[i]) inside = !inside;
      }
      if (inside && (best === null || t < best)) best = t;
    }
  return best;
}

// ------------------------------------------------------------------ the viewport

type Drag =
  | { kind: "orbit"; sx: number; sy: number; cam: Cam; moved: boolean }
  | { kind: "pan"; sx: number; sy: number; cam: Cam }
  | { kind: "object"; sx: number; sy: number; pick: Pick; start: Vec3; moved: boolean; shift: boolean; ids: string[]; base: Doc }
  | { kind: "gizmo"; sx: number; sy: number; mode: "t" | "r" | "s"; axis: number; ids: string[]; base: Doc; center: [number, number] }
  | { kind: "split"; sx: number; sy: number; z0: number }
  | { kind: "sketch"; sx: number; sy: number; p: V2; moved: boolean };

export function Viewport({ children }: { children?: ReactNode }) {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const idp = useId().replace(/[^a-zA-Z0-9]/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const engaged = useRef(false);
  const [size, setSize] = useState({ w: 760, h: 700 });
  const [hover, setHover] = useState<V2 | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 760, h: el.clientHeight || 700 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Smooth camera moves (view cube, zoom to selection).
  const goal = s.camGoal;
  useEffect(() => {
    if (!goal) return;
    const from = st.get().cam;
    let dyaw = goal.yaw - from.yaw;
    dyaw = ((((dyaw + 180) % 360) + 360) % 360) - 180;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 320);
      const e = 1 - (1 - t) ** 3;
      st.set({
        cam: {
          yaw: from.yaw + dyaw * e,
          pitch: from.pitch + (goal.pitch - from.pitch) * e,
          zoom: from.zoom + (goal.zoom - from.zoom) * e,
          target: [0, 1, 2].map((i) => from.target[i] + (goal.target[i] - from.target[i]) * e) as Vec3,
        },
        ...(t >= 1 ? { camGoal: null } : {}),
      });
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [goal, st]);

  // The wheel zooms only once the view has been clicked, so the page still scrolls past it.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!engaged.current) return;
      e.preventDefault();
      const cam = st.get().cam;
      st.set({ cam: { ...cam, zoom: Math.max(0.5, Math.min(16, cam.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12))) } });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [st]);

  const bed = bedOf(s.bed).size;
  const scene = useMemo(
    () =>
      buildScene({
        doc: s.doc,
        sel: s.selection,
        cam: s.cam,
        w: size.w,
        h: size.h,
        lighting: s.lighting,
        edges: s.edges,
        xray: s.xray,
        overhang: s.checks.open && s.checks.overhang,
        idp,
      }),
    [s.doc, s.selection, s.cam, size, s.lighting, s.edges, s.xray, s.checks.open, s.checks.overhang, idp],
  );
  const P = scene.P;

  const selBox = s.selection.length ? selectionBox(s.doc, s.selection) : null;
  const tool = s.tool;
  const showHandles = !!selBox && !isEmptyBox(selBox) && (!tool || tool.kind === "split") && !s.selection.some((id) => s.doc.nodes[id]?.locked);
  const gizmoOrigin: Vec3 | null = selBox && !isEmptyBox(selBox) ? [(selBox.min[0] + selBox.max[0]) / 2, (selBox.min[1] + selBox.max[1]) / 2, selBox.min[2]] : null;

  const toPlane = (sx: number, sy: number, n: Vec3, p0: Vec3): Vec3 | null => {
    const cam = st.get().cam;
    const { R, U, F } = basis(cam);
    const base = add(cam.target, scl(R, (sx - size.w / 2) / cam.zoom), scl(U, (size.h / 2 - sy) / cam.zoom));
    const den = dot(n, F);
    if (Math.abs(den) < 1e-6) return null;
    return add(base, scl(F, dot(n, sub(p0, base)) / den));
  };
  const bedPoint = (sx: number, sy: number): V2 | null => {
    const p = toPlane(sx, sy, [0, 0, 1], [0, 0, 0]);
    if (!p) return null;
    const step = st.get().snap ? (st.get().unit === "in" ? 25.4 / 16 : 1) : 0.5;
    return [Math.round(p[0] / step) * step, Math.round(p[1] / step) * step];
  };

  const local = (e: { clientX: number; clientY: number }) => {
    const el = svgRef.current!;
    const r = el.getBoundingClientRect();
    const k = r.width / (el.clientWidth || r.width);
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k] as [number, number];
  };

  const sketchClick = (p: V2, dragged: V2 | null) => {
    const t = st.get().tool;
    if (t?.kind !== "sketch") return;
    const shapes = [...t.shapes];
    const finish = (pts: V2[]) => st.set({ tool: { ...t, shapes: [...shapes, pts], draft: [] } });
    if (t.tool === "line") {
      const d = t.draft;
      if (d.length >= 3) {
        const f = P([d[0][0], d[0][1], 0]);
        const q = P([p[0], p[1], 0]);
        if (Math.hypot(f[0] - q[0], f[1] - q[1]) < 9) return finish(d);
      }
      return st.set({ tool: { ...t, draft: [...d, p] } });
    }
    const a0 = dragged ? t.draft[0] ?? p : t.draft[0];
    const b0 = dragged ?? p;
    if (!a0 || (!dragged && !t.draft.length)) return st.set({ tool: { ...t, draft: [p] } });
    const dist = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]);
    if (dist < 0.5) return;
    if (t.tool === "rect")
      return finish([
        [Math.min(a0[0], b0[0]), Math.min(a0[1], b0[1])],
        [Math.max(a0[0], b0[0]), Math.min(a0[1], b0[1])],
        [Math.max(a0[0], b0[0]), Math.max(a0[1], b0[1])],
        [Math.min(a0[0], b0[0]), Math.max(a0[1], b0[1])],
      ]);
    const n = t.tool === "circle" ? 48 : 6;
    const a = Math.atan2(b0[1] - a0[1], b0[0] - a0[0]);
    finish(Array.from({ length: n }, (_, i) => [a0[0] + dist * Math.cos(a + (2 * Math.PI * i) / n), a0[1] + dist * Math.sin(a + (2 * Math.PI * i) / n)] as V2));
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    engaged.current = true;
    const [sx, sy] = local(e);
    const target = e.target as Element;
    const gz = target.closest("[data-gz]")?.getAttribute("data-gz");
    const fAttr = target.closest("[data-f]")?.getAttribute("data-f");
    const pick = fAttr != null ? scene.picks[Number(fAttr)] : null;
    const cur = st.get();
    if (e.button === 1 || e.button === 2) {
      drag.current = { kind: "pan", sx, sy, cam: cur.cam };
    } else if (cur.tool?.kind === "sketch") {
      const p = bedPoint(sx, sy);
      if (!p) return;
      if ((cur.tool.tool === "rect" || cur.tool.tool === "circle" || cur.tool.tool === "polygon") && !cur.tool.draft.length) st.set({ tool: { ...cur.tool, draft: [p] } });
      drag.current = { kind: "sketch", sx, sy, p, moved: false };
    } else if (cur.tool?.kind === "measure" && pick) {
      const hit = toPlane(sx, sy, pick.n, pick.p0) ?? pick.p0;
      const t = cur.tool;
      const need = t.mode === "distance" ? 2 : t.mode === "thickness" ? 1 : 3;
      if (t.mode === "thickness") {
        const l = cur.doc.nodes[pick.layerId];
        const th = l?.type === "layer" ? thicknessAt(l, hit, pick.n) : null;
        st.set({ tool: { ...t, pts: th ? [hit, add(hit, scl(pick.n, -th))] : [hit] } });
      } else st.set({ tool: { ...t, pts: t.pts.length >= need ? [hit] : [...t.pts, hit] } });
      return;
    } else if (cur.tool?.kind === "pick" && pick) {
      const t = cur.tool;
      st.set({ tool: null });
      if (t.purpose === "layflat") act.layFlat(topOf(cur.doc, pick.layerId), pick.n);
      else act.info(t.purpose === "emboss" ? "Raised onto the surface. In the app it bends to follow curved surfaces too." : "Cut into the surface. In the app it bends to follow curved surfaces too.", "success");
      return;
    } else if (gz === "split" && cur.tool?.kind === "split") {
      drag.current = { kind: "split", sx, sy, z0: cur.tool.z };
    } else if (gz && cur.selection.length) {
      const o = gizmoOrigin ? P(gizmoOrigin) : [sx, sy];
      act.beginLive();
      drag.current = { kind: "gizmo", sx, sy, mode: gz[0] as "t" | "r" | "s", axis: Number(gz[1]), ids: cur.selection.filter((id) => !cur.doc.nodes[id]?.locked), base: cur.doc, center: [o[0], o[1]] };
    } else if (pick) {
      const node = cur.doc.nodes[pick.id];
      const start = toPlane(sx, sy, [0, 0, 1], pick.p0) ?? pick.p0;
      // Click again on something already selected: pick the part inside it.
      let target = pick.id;
      if (cur.selection.includes(pick.id) && pick.layerId !== pick.id && cur.selection.length === 1) target = pick.layerId;
      if (cur.selection.includes(pick.layerId)) target = pick.layerId;
      const ids = cur.selection.includes(target) ? cur.selection : [target];
      drag.current = { kind: "object", sx, sy, pick: { ...pick, id: target }, start, moved: false, shift: e.shiftKey || e.ctrlKey, ids, base: cur.doc };
      if (!node) drag.current = null;
    } else {
      drag.current = { kind: "orbit", sx, sy, cam: cur.cam, moved: false };
    }

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const [mx, my] = local(ev);
      const dx = mx - d.sx;
      const dy = my - d.sy;
      const now = st.get();
      if (d.kind === "orbit") {
        if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
        st.set({ cam: { ...d.cam, yaw: d.cam.yaw - dx * 0.4, pitch: Math.max(-20, Math.min(89.9, d.cam.pitch + dy * 0.35)) }, camGoal: null });
      } else if (d.kind === "pan") {
        const { R, U } = basis(d.cam);
        st.set({ cam: { ...d.cam, target: add(d.cam.target, scl(R, -dx / d.cam.zoom), scl(U, dy / d.cam.zoom)) }, camGoal: null });
      } else if (d.kind === "object") {
        if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
        if (d.ids.some((id) => now.doc.nodes[id]?.locked)) return;
        if (!d.moved) {
          d.moved = true;
          act.beginLive();
          st.set({ selection: d.ids });
        }
        const p = toPlane(mx, my, [0, 0, 1], d.start);
        if (!p) return;
        act.live(moveDoc(d.base, d.ids, [snapMm(p[0] - d.start[0], now), snapMm(p[1] - d.start[1], now), 0]));
      } else if (d.kind === "gizmo") {
        const cam = now.cam;
        if (d.mode === "r") {
          const a0 = Math.atan2(d.sy - d.center[1], d.sx - d.center[0]);
          const a1 = Math.atan2(my - d.center[1], mx - d.center[0]);
          let delta = ((a1 - a0) * 180) / Math.PI;
          const e3: Vec3 = [0, 0, 0];
          e3[d.axis] = 1;
          delta = -delta * Math.sign(-dot(e3, basis(cam).F) || 1);
          if (now.snap) delta = Math.round(delta / 15) * 15;
          let doc = d.base;
          for (const id of d.ids) doc = setRotationDoc(doc, id, d.axis, Math.round((d.base.nodes[id].rot[d.axis] + delta) * 10) / 10);
          act.live(doc);
          return;
        }
        const { R, U } = basis(cam);
        const e3: Vec3 = [0, 0, 0];
        e3[d.axis] = 1;
        const vx = cam.zoom * dot(e3, R);
        const vy = -cam.zoom * dot(e3, U);
        const l2 = vx * vx + vy * vy;
        if (l2 < 1e-6) return;
        const t = (dx * vx + dy * vy) / l2;
        if (d.mode === "t") {
          const delta: Vec3 = [0, 0, 0];
          delta[d.axis] = snapMm(t, now);
          act.live(moveDoc(d.base, d.ids, delta));
        } else {
          let doc = d.base;
          for (const id of d.ids) {
            const sz = boxSize(nodeBox(d.base, id))[d.axis];
            doc = setSizeDoc(doc, id, d.axis, Math.max(0.5, snapMm(sz + t, now)), false);
          }
          act.live(doc);
        }
      } else if (d.kind === "split") {
        const cam = now.cam;
        const { U } = basis(cam);
        const vy = -cam.zoom * U[2];
        if (Math.abs(vy) < 1e-3) return;
        const t = now.tool;
        if (t?.kind !== "split") return;
        const b = nodeBox(now.doc, t.targetId);
        const z = Math.max(b.min[2] + 1, Math.min(b.max[2] - 1, d.z0 + (dy * vy) / (vy * vy)));
        st.set({ tool: { ...t, z: Math.round(z * 10) / 10 } });
      } else if (d.kind === "sketch") {
        if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
        const p = bedPoint(mx, my);
        if (p) setHover(p);
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      if (d.kind === "orbit" && !d.moved) {
        if (!st.get().tool) act.select([]);
      } else if (d.kind === "object") {
        if (d.moved) act.endLive("Move");
        else act.select([d.pick.id], d.shift ? "toggle" : "replace");
      } else if (d.kind === "gizmo") {
        act.endLive(d.mode === "t" ? "Move" : d.mode === "r" ? "Rotate" : "Resize");
      } else if (d.kind === "sketch") {
        const [mx, my] = local(ev);
        const p = bedPoint(mx, my);
        if (!p) return;
        sketchClick(p, d.moved && st.get().tool?.kind === "sketch" && (st.get().tool as { tool: string }).tool !== "line" ? p : null);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onHoverMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (s.tool?.kind !== "sketch" || drag.current) return;
    const [sx, sy] = local(e);
    setHover(bedPoint(sx, sy));
  };

  // ---- overlays for the tools
  const toolEls: ReactNode[] = [];
  if (tool?.kind === "split") {
    const b = nodeBox(s.doc, tool.targetId);
    if (!isEmptyBox(b)) {
      const m = 14;
      const z = tool.z;
      const pts: Vec3[] = [
        [b.min[0] - m, b.min[1] - m, z],
        [b.max[0] + m, b.min[1] - m, z],
        [b.max[0] + m, b.max[1] + m, z],
        [b.min[0] - m, b.max[1] + m, z],
      ];
      toolEls.push(
        <path key="plane" data-gz="split" d={pathOf([pts], P)} fill="rgba(0,212,255,0.17)" stroke="rgba(0,212,255,0.8)" strokeWidth={1.4} style={{ cursor: "ns-resize" }}>
          <title>Drag to move the cut</title>
        </path>,
      );
    }
  }
  if (tool?.kind === "measure") {
    const pts = tool.pts.map(P);
    for (let i = 0; i + 1 < pts.length; i++) toolEls.push(<line key={`ml${i}`} x1={pts[i][0]} y1={pts[i][1]} x2={pts[i + 1][0]} y2={pts[i + 1][1]} stroke="#ffd166" strokeWidth={2} strokeDasharray={tool.mode === "thickness" ? "4 3" : undefined} />);
    pts.forEach((p, i) => toolEls.push(<circle key={`mp${i}`} cx={p[0]} cy={p[1]} r={4.5} fill="#ffd166" stroke="#1a1408" strokeWidth={1.2} />));
  }
  if (tool?.kind === "sketch") {
    const poly = (pts: V2[], closed: boolean) => {
      const d = "M" + pts.map((p) => { const q = P([p[0], p[1], 0.05]); return `${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join("L") + (closed ? "Z" : "");
      return d;
    };
    tool.shapes.forEach((sh, i) => toolEls.push(<path key={`sk${i}`} d={poly(sh, true)} fill="rgba(255,209,102,0.14)" stroke="#ffd166" strokeWidth={1.8} />));
    const dft = tool.draft;
    if (dft.length && hover) {
      let pts: V2[] = [];
      let closed = true;
      if (tool.tool === "line") {
        pts = [...dft, hover];
        closed = false;
      } else if (tool.tool === "rect")
        pts = [
          [dft[0][0], dft[0][1]],
          [hover[0], dft[0][1]],
          [hover[0], hover[1]],
          [dft[0][0], hover[1]],
        ];
      else {
        const r = Math.hypot(hover[0] - dft[0][0], hover[1] - dft[0][1]);
        const n = tool.tool === "circle" ? 48 : 6;
        const a = Math.atan2(hover[1] - dft[0][1], hover[0] - dft[0][0]);
        pts = Array.from({ length: n }, (_, i) => [dft[0][0] + r * Math.cos(a + (2 * Math.PI * i) / n), dft[0][1] + r * Math.sin(a + (2 * Math.PI * i) / n)] as V2);
      }
      toolEls.push(<path key="draft" d={poly(pts, closed)} fill={closed ? "rgba(255,209,102,0.08)" : "none"} stroke="#ffd166" strokeWidth={1.5} strokeDasharray="5 4" />);
    }
    if (hover) {
      const q = P([hover[0], hover[1], 0]);
      toolEls.push(<circle key="cur" cx={q[0]} cy={q[1]} r={3.5} fill="none" stroke="#ffd166" strokeWidth={1.5} />);
    }
  }

  return (
    <div className={c("viewport")} ref={wrap} onPointerLeave={() => (engaged.current = false)} onContextMenu={(e) => e.preventDefault()} data-tour="view">
      <svg
        ref={svgRef}
        className={c("scene")}
        width={size.w}
        height={size.h}
        onPointerDown={onDown}
        onPointerMove={onHoverMove}
        style={{ cursor: tool?.kind === "sketch" || tool?.kind === "measure" || tool?.kind === "pick" ? "crosshair" : "default" }}
      >
        <Grid cam={s.cam} w={size.w} h={size.h} bed={bed} idp={idp} />
        {scene.els}
        {scene.overlay}
        {showHandles && selBox && <Brackets box={selBox} P={P} />}
        {showHandles && gizmoOrigin && <Gizmo origin={gizmoOrigin} mode={s.gizmo} P={P} cam={s.cam} />}
        {toolEls}
      </svg>
      <ViewBar />
      <ViewCube cam={s.cam} onView={(yaw, pitch) => st.set({ camGoal: { ...s.cam, yaw, pitch } })} />
      <SizeReadout />
      <Notices />
      {s.busy && (
        <div className={c("busy-chip")}>
          <span className={c("spinner")} />
          {s.busy}
        </div>
      )}
      {children}
    </div>
  );
}

/** A small still render of the scene, for the export dialog's Free vs Pro previews. */
export function MiniRender({ doc, ids, coarse, mark, below }: { doc: Doc; ids: string[]; coarse?: boolean; mark?: boolean; below?: boolean }) {
  const idp = useId().replace(/[^a-zA-Z0-9]/g, "");
  const box = selectionBox(doc, ids);
  if (isEmptyBox(box)) return null;
  const size = boxSize(box);
  const w = 230;
  const h = 170;
  const cam: Cam = { yaw: 24, pitch: below ? -35 : 30, zoom: 130 / Math.max(Math.hypot(...size), 1), target: scl(add(box.min, box.max), 0.5) };
  // Coarse copy: the same scene with fewer sides on every curve.
  const view = coarse ? coarseDoc(doc) : doc;
  const shown = { ...view, roots: view.roots.filter((r) => ids.includes(r)) };
  const scene = buildScene({ doc: shown, sel: [], cam, w, h, lighting: "studio", edges: !!coarse, xray: false, overhang: false, idp });
  const P = projector(cam, w, h);
  const mid = P([(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, box.min[2]]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: "100%" }} pointerEvents="none">
      {scene.els}
      {mark && below && (
        <text x={mid[0]} y={mid[1]} fontSize={11} fontWeight={800} fill="rgba(255,255,255,0.8)" textAnchor="middle" dominantBaseline="central" letterSpacing={1}>
          RevinHi
        </text>
      )}
    </svg>
  );
}

function coarseDoc(doc: Doc): Doc {
  const nodes: Doc["nodes"] = {};
  for (const [k, n] of Object.entries(doc.nodes)) {
    if (n.type === "layer" && n.source.kind === "shape" && n.source.params.sides) nodes[k] = { ...n, source: { ...n.source, params: { ...n.source.params, sides: Math.max(8, Math.round(n.source.params.sides / 6)) } } };
    else nodes[k] = n;
  }
  return { ...doc, nodes };
}
