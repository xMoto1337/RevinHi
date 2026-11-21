// The preview's scene: layers and groups like the real app's (core/scene.ts), and a small
// geometry kit that turns each layer into flat faces for the drawn view. Sizes are in mm;
// every shape sits on the bed (z = 0) centered on X/Y, as in the app's core/shapes.ts.

export type Vec3 = [number, number, number];
export type V2 = [number, number];

export type ShapeKind = "cube" | "cylinder" | "sphere" | "cone" | "torus" | "wedge" | "tube" | "star" | "heart";
export type PartKind = "bolt" | "nut" | "gear" | "hinge" | "box" | "lid" | "threadedHole";

export interface TextSpec {
  text: string;
  font: string;
  bold: boolean;
  size: number;
  spacing: number;
  curve: number;
  depth: number;
  bevel: number;
  flip: boolean;
  mirror: boolean;
}

export type Source =
  | { kind: "shape"; shape: ShapeKind; params: Record<string, number> }
  | { kind: "part"; part: PartKind; params: Record<string, number> }
  | { kind: "drawing"; outlines: V2[][]; solid: "flat" | "extrude" | "revolve"; height: number; origin: "draw" | "logo" }
  | { kind: "text"; spec: TextSpec }
  | { kind: "owl"; colors: boolean };

interface Base {
  id: string;
  name: string;
  parent: string | null;
  color: string;
  visible: boolean;
  locked: boolean;
  ghost: boolean;
}

export interface Layer extends Base {
  type: "layer";
  mode: "solid" | "hole";
  source: Source;
  /** Center X/Y and bottom Z, in mm. */
  pos: Vec3;
  /** Degrees. */
  rot: Vec3;
  scale: Vec3;
  /** Kept part after Split to fit the bed: world Z range. */
  clip?: [number, number] | null;
  /** Applied: its shape settings are no longer editable. */
  plain?: boolean;
}

export interface Group extends Base {
  type: "group";
  children: string[];
  purpose: "cut" | "join" | null;
  /** Applied (flattened): one plain shape, its parts no longer editable. */
  baked?: boolean;
  rot: Vec3;
}

export type SNode = Layer | Group;
export interface Doc {
  nodes: Record<string, SNode>;
  roots: string[];
}

let counter = 100;
export const uid = () => `n${++counter}`;

// ------------------------------------------------------------------ shapes (the app's SHAPES list)

type Param = { key: string; label: string; kind: "length" | "count"; def: number; min: number; max?: number };
const L = (key: string, label: string, def: number, min = 0.01): Param => ({ key, label, kind: "length", def, min });
const N = (key: string, label: string, def: number, min: number, max: number): Param => ({ key, label, kind: "count", def, min, max });

export const SHAPES: { kind: ShapeKind; label: string; params: Param[] }[] = [
  { kind: "cube", label: "Cube", params: [L("width", "Width", 20), L("depth", "Depth", 20), L("height", "Height", 20)] },
  { kind: "cylinder", label: "Cylinder", params: [L("diameter", "Diameter", 20), L("height", "Height", 20), N("sides", "Sides", 64, 3, 512)] },
  { kind: "sphere", label: "Sphere", params: [L("diameter", "Diameter", 20), N("sides", "Smoothness", 48, 6, 256)] },
  { kind: "cone", label: "Cone", params: [L("diameter", "Base diameter", 20), L("top", "Top diameter", 0, 0), L("height", "Height", 20), N("sides", "Sides", 64, 3, 512)] },
  { kind: "torus", label: "Ring", params: [L("diameter", "Outer diameter", 40), L("thickness", "Thickness", 10), N("sides", "Sides", 64, 6, 512), N("tubeSides", "Roundness", 24, 4, 128)] },
  { kind: "wedge", label: "Wedge", params: [L("width", "Width", 20), L("depth", "Depth", 20), L("height", "Height", 20)] },
  { kind: "tube", label: "Tube", params: [L("diameter", "Outer diameter", 20), L("wall", "Wall thickness", 2), L("height", "Height", 20), N("sides", "Sides", 64, 3, 512)] },
  { kind: "star", label: "Star", params: [N("points", "Points", 5, 3, 64), L("diameter", "Outer diameter", 30), L("inner", "Inner diameter", 15), L("height", "Height", 5)] },
  { kind: "heart", label: "Heart", params: [L("width", "Width", 30), L("height", "Height", 5)] },
];
export const SHAPE_BY_KIND = Object.fromEntries(SHAPES.map((s) => [s.kind, s])) as Record<ShapeKind, (typeof SHAPES)[number]>;
export const defaultParams = (k: ShapeKind) => Object.fromEntries(SHAPE_BY_KIND[k].params.map((p) => [p.key, p.def]));

export const PARTS: { kind: PartKind; label: string; icon: "bolt" | "nut" | "gear" | "hinge" | "boxLid" | "threadHole"; params: Param[] }[] = [
  { kind: "bolt", label: "Bolt", icon: "bolt", params: [L("size", "Thread size (M)", 8, 2), L("length", "Length", 30, 4)] },
  { kind: "nut", label: "Nut", icon: "nut", params: [L("size", "Thread size (M)", 8, 2)] },
  { kind: "threadedHole", label: "Threaded hole", icon: "threadHole", params: [L("size", "Thread size (M)", 8, 2), L("depth", "Depth", 12, 1)] },
  { kind: "gear", label: "Gear", icon: "gear", params: [N("teeth", "Teeth", 18, 6, 80), L("diameter", "Diameter", 40, 8), L("thickness", "Thickness", 6, 1), L("hole", "Hole", 6, 0)] },
  { kind: "hinge", label: "Hinge", icon: "hinge", params: [L("width", "Width", 40, 10), L("length", "Length", 30, 10)] },
  { kind: "box", label: "Box with lid", icon: "boxLid", params: [L("width", "Width", 60, 10), L("depth", "Depth", 40, 10), L("height", "Height", 30, 5), L("wall", "Wall", 2, 0.8)] },
];

export const FILAMENTS = [
  { name: "White", color: "#f2f2f2" },
  { name: "Black", color: "#2e2e30" },
  { name: "Red", color: "#e53935" },
  { name: "Blue", color: "#1e88e5" },
];
const PALETTE = ["#4f9dff", "#ff8a3d", "#2ed573", "#b967ff", "#ffd166", "#ff5d73", "#00d4ff"];
export const nextColor = (doc: Doc) => PALETTE[Object.keys(doc.nodes).length % PALETTE.length];

// ------------------------------------------------------------------ text size (fonts measured roughly, the same on every PC)

export const FONTS = ["Segoe UI", "Arial", "Segoe Script", "Impact", "Georgia", "Comic Sans MS", "Consolas", "Bahnschrift"];
const FONT_W: Record<string, number> = { "Segoe UI": 0.56, Arial: 0.56, "Segoe Script": 0.66, Impact: 0.47, Georgia: 0.6, "Comic Sans MS": 0.6, Consolas: 0.55, Bahnschrift: 0.52 };

export function textBox(t: TextSpec): { w: number; d: number } {
  const lines = t.text.split("\n");
  const per = (FONT_W[t.font] ?? 0.56) * (t.bold ? 1.07 : 1);
  const w = Math.max(
    ...lines.map((line) => {
      let u = 0;
      for (const ch of line) u += /[ilj.,'!|:;]/.test(ch) ? 0.32 : /[mwMW]/.test(ch) ? 1.3 : /[A-Z]/.test(ch) ? 1.15 : 1;
      return u * per * t.size + Math.max(0, line.length - 1) * t.spacing;
    }),
  );
  return { w: Math.max(w, 1), d: t.size * (1 + (lines.length - 1) * 1.25) * 1.05 };
}

// ------------------------------------------------------------------ outlines

const circle = (r: number, n: number): V2[] => Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n)] as V2);
const rect = (w: number, d: number): V2[] => [
  [-w / 2, -d / 2],
  [w / 2, -d / 2],
  [w / 2, d / 2],
  [-w / 2, d / 2],
];

export function roundRect(w: number, d: number, r: number, seg = 8): V2[] {
  r = Math.max(0, Math.min(r, w / 2 - 0.01, d / 2 - 0.01));
  if (r <= 0) return rect(w, d);
  const out: V2[] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, -d / 2 + r, -90],
    [w / 2 - r, d / 2 - r, 0],
    [-w / 2 + r, d / 2 - r, 90],
    [-w / 2 + r, -d / 2 + r, 180],
  ];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= seg; i++) {
      const a = ((a0 + (90 * i) / seg) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  return out;
}

function heartOutline(width: number): V2[] {
  const raw: V2[] = [];
  for (let i = 0; i < 64; i++) {
    const t = (2 * Math.PI * i) / 64;
    raw.push([16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)]);
  }
  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const s = width / (Math.max(...xs) - Math.min(...xs));
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return raw.map(([x, y]) => [(x - cx) * s, (y - cy) * s]);
}

function starOutline(points: number, outer: number, inner: number): V2[] {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = (i % 2 === 0 ? outer : inner) / 2;
    const a = Math.PI / 2 + (Math.PI * i) / points;
    return [r * Math.cos(a), r * Math.sin(a)] as V2;
  });
}

function gearOutline(teeth: number, dia: number): V2[] {
  const out: V2[] = [];
  const ro = dia / 2;
  const ri = ro - Math.max(1.2, (dia / teeth) * 0.9);
  for (let i = 0; i < teeth; i++) {
    const a = (2 * Math.PI * i) / teeth;
    const st = (2 * Math.PI) / teeth;
    const pts: [number, number][] = [
      [ri, a],
      [ri, a + st * 0.18],
      [ro, a + st * 0.32],
      [ro, a + st * 0.58],
      [ri, a + st * 0.72],
    ];
    for (const [r, ang] of pts) out.push([r * Math.cos(ang), r * Math.sin(ang)]);
  }
  return out;
}

export const polyArea = (pts: V2[]) => pts.reduce((a, [x0, y0], i) => a + x0 * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * y0, 0) / 2;
const ccw = (pts: V2[]) => (polyArea(pts) < 0 ? [...pts].reverse() : pts);
const cw = (pts: V2[]) => (polyArea(pts) > 0 ? [...pts].reverse() : pts);

/** A paw print: the sample picture the Logo dialog traces. */
export function pawOutlines(width: number, smooth = 0.5): V2[][] {
  const n = Math.round(14 + smooth * 30);
  const s = width / 60;
  const pad = circle(1, n).map(([x, y]) => [x * 15 * s, y * 12 * s - 8 * s] as V2);
  const toes: V2[][] = [
    [-19, 7, 6.5],
    [-7, 17, 7],
    [7, 17, 7],
    [19, 7, 6.5],
  ].map(([cx, cy, r]) => circle(r * s, n).map(([x, y]) => [x + cx * s, y * 1.15 + cy * s] as V2));
  return [pad, ...toes];
}

// ------------------------------------------------------------------ meshes

export interface Face {
  loops: Vec3[][];
  color?: string;
}
export interface Part {
  faces: Face[];
  /** Closed and outward-facing: back faces can be skipped. */
  cull: boolean;
  color?: string;
}

/** Straight-sided (or tapered) shapes: what holes can be cut into and Split can cut across. */
export interface Profile {
  outer: V2[][];
  inner: V2[][];
  h: number;
  topScale: number;
}

const sides = (n: number | undefined, q: number) => Math.max(6, Math.round((n ?? 48) * q));

export function profileOf(l: Layer, q = 1): Profile | null {
  const src = l.source;
  if (src.kind === "shape") {
    const p = src.params;
    switch (src.shape) {
      case "cube":
        return { outer: [rect(p.width, p.depth)], inner: [], h: p.height, topScale: 1 };
      case "cylinder":
        return { outer: [circle(p.diameter / 2, sides(Math.min(p.sides, 72), q))], inner: [], h: p.height, topScale: 1 };
      case "cone":
        return { outer: [circle(p.diameter / 2, sides(Math.min(p.sides, 72), q))], inner: [], h: p.height, topScale: p.top / p.diameter };
      case "tube": {
        const n = sides(Math.min(p.sides, 72), q);
        return { outer: [circle(p.diameter / 2, n)], inner: [cw(circle(Math.max(0.1, p.diameter / 2 - p.wall), n))], h: p.height, topScale: 1 };
      }
      case "star":
        return { outer: [starOutline(Math.round(p.points), p.diameter, p.inner)], inner: [], h: p.height, topScale: 1 };
      case "heart":
        return { outer: [ccw(heartOutline(p.width))], inner: [], h: p.height, topScale: 1 };
      default:
        return null;
    }
  }
  if (src.kind === "drawing") {
    if (src.solid === "revolve") return null;
    return { outer: src.outlines.map(ccw), inner: [], h: src.solid === "flat" ? 0.4 : src.height, topScale: 1 };
  }
  if (src.kind === "part") {
    const p = src.params;
    if (src.part === "nut") {
      const hex = circle(p.size * 0.92, 6);
      return { outer: [hex], inner: [cw(circle(p.size / 2, sides(40, q)))], h: p.size * 0.8, topScale: 1 };
    }
    if (src.part === "gear") return { outer: [ccw(gearOutline(Math.round(p.teeth), p.diameter))], inner: p.hole > 0 ? [cw(circle(p.hole / 2, sides(32, q)))] : [], h: p.thickness, topScale: 1 };
    if (src.part === "threadedHole") return { outer: [circle(p.size / 2, sides(40, q))], inner: [], h: p.depth, topScale: 1 };
  }
  return null;
}

const at = (pts: V2[], z: number, s = 1): Vec3[] => pts.map(([x, y]) => [x * s, y * s, z]);

/** Walls and caps of a profile between local heights z0 and z1. */
export function prismFaces(pr: Profile, z0 = 0, z1 = pr.h): Face[] {
  const sAt = (z: number) => 1 + (pr.topScale - 1) * (pr.h > 0 ? z / pr.h : 0);
  const faces: Face[] = [];
  const s0 = sAt(z0);
  const s1 = sAt(z1);
  const walls = (loop: V2[]) => {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      faces.push({
        loops: [
          [
            [a[0] * s0, a[1] * s0, z0],
            [b[0] * s0, b[1] * s0, z0],
            [b[0] * s1, b[1] * s1, z1],
            [a[0] * s1, a[1] * s1, z1],
          ],
        ],
      });
    }
  };
  for (const o of pr.outer) walls(o);
  for (const i of pr.inner) walls(i);
  if (s1 > 1e-3) faces.push({ loops: [...pr.outer.map((o) => at(o, z1, s1)), ...pr.inner.map((i) => at(i, z1, s1))] });
  faces.push({ loops: [...pr.outer.map((o) => at(o, z0, s0).reverse()), ...pr.inner.map((i) => at(i, z0, s0).reverse())] });
  return faces;
}

/** Turns a profile of (radius, z) around the Z axis (open: starts and ends on the axis). */
function lathe(profile: V2[], closed: boolean, n: number): Face[] {
  const ring = (r: number, z: number) => Array.from({ length: n }, (_, k) => [r * Math.cos((2 * Math.PI * k) / n), r * Math.sin((2 * Math.PI * k) / n), z] as Vec3);
  const rings = profile.map(([r, z]) => ring(r, z));
  const faces: Face[] = [];
  const count = closed ? rings.length : rings.length - 1;
  for (let i = 0; i < count; i++) {
    const lo = rings[i];
    const hi = rings[(i + 1) % rings.length];
    for (let k = 0; k < n; k++) {
      const k1 = (k + 1) % n;
      faces.push({ loops: [[lo[k], lo[k1], hi[k1], hi[k]]] });
    }
  }
  return faces;
}

function sphereFaces(d: number, n: number, q: number): Face[] {
  const r = d / 2;
  const rings = Math.max(4, Math.round((n / 2) * q));
  const prof: V2[] = [[0, 0]];
  for (let i = 1; i < rings; i++) {
    const phi = (Math.PI * i) / rings;
    prof.push([r * Math.sin(phi), r - r * Math.cos(phi)]);
  }
  prof.push([0, 2 * r]);
  return lathe(prof, false, Math.max(8, Math.round(n * q)));
}

const move = (faces: Face[], f: (p: Vec3) => Vec3): Face[] => faces.map((fc) => ({ ...fc, loops: fc.loops.map((lp) => lp.map(f)) }));
const box = (w: number, d: number, h: number, x = 0, y = 0, z = 0) => move(prismFaces({ outer: [rect(w, d)], inner: [], h, topScale: 1 }), ([a, b, cc]) => [a + x, b + y, cc + z]);

function wedgeFaces(w: number, d: number, h: number): Face[] {
  const [x, y] = [w / 2, d / 2];
  const v: Vec3[] = [
    [-x, -y, 0],
    [x, -y, 0],
    [x, y, 0],
    [-x, y, 0],
    [-x, -y, h],
    [x, -y, h],
  ];
  const F = (...ix: number[]): Face => ({ loops: [ix.map((i) => v[i])] });
  return [F(0, 3, 2, 1), F(0, 1, 5, 4), F(4, 5, 2, 3), F(0, 4, 3), F(1, 2, 5)];
}

/** The AI-made owl: round body, belly, eyes, beak, ear tufts and a branch. */
function owlParts(q: number, colors: boolean): Part[] {
  const n = Math.max(10, Math.round(22 * q));
  const ell = (rx: number, ry: number, rz: number, cx: number, cy: number, cz: number, color: string): Part => ({
    faces: move(sphereFaces(2, n, 1), ([x, y, z]) => [cx + x * rx, cy + y * ry, cz + (z - 1) * rz]),
    cull: true,
    color: colors ? color : undefined,
  });
  const brown = "#6e4527";
  const cream = "#e9d6b4";
  const branch: Part = {
    faces: move(lathe([[0, -48], [4.5, -48], [4.5, 48], [0, 48]] as V2[], false, 12), ([x, y, z]) => [z, 2 - y, x + 6]),
    cull: true,
    color: colors ? "#5a3a22" : undefined,
  };
  const tuft = (side: number): Part => ({
    faces: move(lathe([[0, 0], [5, 0], [0, 12]] as V2[], false, 10), ([x, y, z]) => [x + side * (13 - z * 0.15), y + 2, z + 59]),
    cull: true,
    color: colors ? brown : undefined,
  });
  return [
    branch,
    ell(24, 21, 29, 0, 3, 38, brown),
    ell(17, 10, 21, 0, -9, 34, cream),
    ell(8.5, 5, 8.5, -9.5, -15, 52, cream),
    ell(8.5, 5, 8.5, 9.5, -15, 52, cream),
    ell(4.2, 3, 4.6, -9, -19, 52, "#141010"),
    ell(4.2, 3, 4.6, 9, -19, 52, "#141010"),
    ell(2.6, 3, 4, 0, -20, 45, "#3b2414"),
    tuft(-1),
    tuft(1),
  ];
}

function boltParts(size: number, length: number, q: number): Part[] {
  const head = size * 0.7;
  const parts: Part[] = [{ faces: prismFaces({ outer: [circle(size * 0.92, 6)], inner: [], h: head, topScale: 1 }), cull: true }];
  const pitch = Math.max(0.8, size * 0.16);
  const n = sides(28, q);
  const steps = Math.max(2, Math.round(length / pitch));
  for (let i = 0; i < steps; i++) {
    const r = i % 2 === 0 ? size / 2 : size * 0.43;
    const z0 = head + (length * i) / steps;
    parts.push({ faces: move(prismFaces({ outer: [circle(r, n)], inner: [], h: length / steps, topScale: 1 }), ([x, y, z]) => [x, y, z + z0]), cull: true });
  }
  return parts;
}

function hingeParts(w: number, len: number, q: number): Part[] {
  const t = 2.4;
  const kr = 3.6;
  const leafW = len / 2 - kr;
  const knuckle = move(lathe([[0, -w / 2], [kr, -w / 2], [kr, w / 2], [0, w / 2]] as V2[], false, sides(20, q)), ([x, y, z]) => [z, -y, x + kr]);
  return [
    { faces: box(w, leafW, t, 0, -(kr + leafW / 2), 0), cull: true },
    { faces: box(w, leafW, t, 0, kr + leafW / 2, 0), cull: true },
    { faces: knuckle, cull: true },
  ];
}

function boxParts(p: Record<string, number>, lid: boolean): Part[] {
  const { width: w, depth: d, height: h, wall } = p;
  if (lid) {
    return [
      { faces: box(w, d, wall), cull: true },
      { faces: move(prismFaces({ outer: [rect(w - 2 * wall - 0.4, d - 2 * wall - 0.4)], inner: [cw(rect(w - 4 * wall, d - 4 * wall))], h: 4, topScale: 1 }), ([x, y, z]) => [x, y, z + wall]), cull: true },
    ];
  }
  return [
    { faces: box(w, d, wall), cull: true },
    { faces: move(prismFaces({ outer: [rect(w, d)], inner: [cw(rect(w - 2 * wall, d - 2 * wall))], h: h - wall, topScale: 1 }), ([x, y, z]) => [x, y, z + wall]), cull: true },
  ];
}

function revolveFaces(outlines: V2[][], n: number): Face[] {
  const o = outlines[0];
  const minY = Math.min(...o.map((p) => p[1]));
  const prof = o.map(([x, y]) => [Math.max(0, x), y - minY] as V2);
  return lathe(prof, true, n);
}

/**
 * Local faces of a layer (bottom at z = 0, centered on X/Y). `q` < 1 gives the coarser
 * copy a free export would save. Text has no faces: the view draws its letters.
 */
export function layerParts(l: Layer, q = 1): Part[] {
  const src = l.source;
  const pr = profileOf(l, q);
  if (pr) {
    let z0 = 0;
    let z1 = pr.h;
    if (l.clip && l.rot[0] === 0 && l.rot[1] === 0) {
      z0 = Math.max(0, (l.clip[0] - l.pos[2]) / l.scale[2]);
      z1 = Math.min(pr.h, (l.clip[1] - l.pos[2]) / l.scale[2]);
      if (z1 <= z0) return [];
    }
    return [{ faces: prismFaces(pr, z0, z1), cull: true }];
  }
  switch (src.kind) {
    case "shape": {
      const p = src.params;
      if (src.shape === "sphere") return [{ faces: sphereFaces(p.diameter, Math.min(p.sides, 40), q), cull: true }];
      if (src.shape === "wedge") return [{ faces: wedgeFaces(p.width, p.depth, p.height), cull: true }];
      if (src.shape === "torus") {
        const t = p.thickness / 2;
        const R = p.diameter / 2 - t;
        const ts = sides(Math.min(p.tubeSides, 16), q);
        const prof: V2[] = Array.from({ length: ts }, (_, i) => {
          const a = (2 * Math.PI * i) / ts - Math.PI / 2;
          return [R + t * Math.cos(a), t + t * Math.sin(a)];
        });
        return [{ faces: lathe(prof, true, sides(Math.min(p.sides, 48), q)), cull: true }];
      }
      return [];
    }
    case "part":
      if (src.part === "bolt") return boltParts(src.params.size, src.params.length, q);
      if (src.part === "hinge") return hingeParts(src.params.width, src.params.length, q);
      if (src.part === "box" || src.part === "lid") return boxParts(src.params, src.part === "lid");
      return [];
    case "drawing":
      return [{ faces: revolveFaces(src.outlines, sides(40, q)), cull: false }];
    case "owl":
      return owlParts(q, src.colors);
    default:
      return [];
  }
}

// ------------------------------------------------------------------ transforms and bounds

export type Box3 = { min: Vec3; max: Vec3 };
const EMPTY = (): Box3 => ({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
export const isEmptyBox = (b: Box3) => b.min[0] > b.max[0];
export const boxSize = (b: Box3): Vec3 => (isEmptyBox(b) ? [0, 0, 0] : [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]]);
function grow(b: Box3, p: Vec3) {
  for (let i = 0; i < 3; i++) {
    if (p[i] < b.min[i]) b.min[i] = p[i];
    if (p[i] > b.max[i]) b.max[i] = p[i];
  }
}
export function union(a: Box3, b: Box3): Box3 {
  const out = EMPTY();
  for (const x of [a, b]) {
    if (isEmptyBox(x)) continue;
    grow(out, x.min);
    grow(out, x.max);
  }
  return out;
}

const D = Math.PI / 180;
export type M3 = [number, number, number, number, number, number, number, number, number];
/** Rz * Ry * Rx (X turns first). */
export function rotMatrix([rx, ry, rz]: Vec3): M3 {
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx * D), Math.sin(rx * D), Math.cos(ry * D), Math.sin(ry * D), Math.cos(rz * D), Math.sin(rz * D)];
  return [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx, sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx, -sy, cy * sx, cy * cx];
}
export const mul = (m: M3, [x, y, z]: Vec3): Vec3 => [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];

function textLocal(spec: TextSpec): Box3 {
  const { w, d } = textBox(spec);
  return { min: [-w / 2, -d / 2, spec.flip ? -spec.depth : 0], max: [w / 2, d / 2, spec.flip ? 0 : spec.depth] };
}

const localCache = new WeakMap<Layer, { parts: Part[]; box: Box3 }>();
export function localOf(l: Layer): { parts: Part[]; box: Box3 } {
  let v = localCache.get(l);
  if (!v) {
    const parts = layerParts(l);
    const b = EMPTY();
    if (l.source.kind === "text") {
      const t = textLocal(l.source.spec);
      grow(b, t.min);
      grow(b, t.max);
    } else for (const p of parts) for (const f of p.faces) for (const pt of f.loops[0]) grow(b, pt);
    v = { parts, box: b };
    localCache.set(l, v);
  }
  return v;
}

/** Local point -> world (pivot: the middle of the shape, so it turns in place). */
export function toWorld(l: Layer): (p: Vec3) => Vec3 {
  const b = localOf(l).box;
  const c: Vec3 = isEmptyBox(b) ? [0, 0, 0] : [0, 0, (b.min[2] + b.max[2]) / 2];
  const m = rotMatrix(l.rot);
  const [sx, sy, sz] = l.scale;
  return ([x, y, z]) => {
    const r = mul(m, [(x - c[0]) * sx, (y - c[1]) * sy, (z - c[2]) * sz]);
    return [l.pos[0] + c[0] * sx + r[0], l.pos[1] + c[1] * sy + r[1], l.pos[2] + c[2] * sz + r[2]];
  };
}

const worldCache = new WeakMap<Layer, { parts: Part[]; box: Box3 }>();
export function worldOf(l: Layer): { parts: Part[]; box: Box3 } {
  let v = worldCache.get(l);
  if (!v) {
    const loc = localOf(l);
    const f = toWorld(l);
    const b = EMPTY();
    // A mirrored layer (negative scale) turns its faces inside out: flip them back.
    const flipped = l.scale[0] * l.scale[1] * l.scale[2] < 0;
    const parts = loc.parts.map((p) => ({ ...p, faces: move(p.faces, f).map((fc) => (flipped ? { ...fc, loops: fc.loops.map((lp) => [...lp].reverse()) } : fc)) }));
    if (l.source.kind === "text" || !parts.length) {
      const { min, max } = loc.box;
      if (!isEmptyBox(loc.box))
        for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) grow(b, f([x, y, z]));
    } else for (const p of parts) for (const fc of p.faces) for (const pt of fc.loops[0]) grow(b, pt);
    v = { parts, box: b };
    worldCache.set(l, v);
  }
  return v;
}

export function descendants(doc: Doc, id: string): string[] {
  const n = doc.nodes[id];
  if (!n || n.type === "layer") return [id];
  return [id, ...n.children.flatMap((c) => descendants(doc, c))];
}
export const layersUnder = (doc: Doc, id: string) => descendants(doc, id).map((i) => doc.nodes[i]).filter((n): n is Layer => !!n && n.type === "layer");

/** World bounds. Holes inside a group with solids don't count: they only take material away. */
export function nodeBox(doc: Doc, id: string): Box3 {
  const all = layersUnder(doc, id);
  const solids = all.filter((l) => l.mode === "solid");
  return (solids.length ? solids : all).reduce((b, l) => union(b, worldOf(l).box), EMPTY());
}
export const selectionBox = (doc: Doc, ids: string[]) => ids.reduce((b, id) => union(b, nodeBox(doc, id)), EMPTY());

export const topOf = (doc: Doc, id: string): string => {
  let n = doc.nodes[id];
  while (n?.parent) n = doc.nodes[n.parent];
  return n?.id ?? id;
};

export const isComputed = (doc: Doc, id: string) => {
  const n = doc.nodes[id];
  return n?.type === "group" && !n.baked && (n.purpose === "cut" || n.purpose === "join" || n.children.some((c) => (doc.nodes[c] as Layer)?.mode === "hole"));
};

export function triangles(doc: Doc): number {
  let t = 0;
  for (const n of Object.values(doc.nodes)) {
    if (n.type !== "layer") continue;
    if (n.source.kind === "text") t += Math.round(n.source.spec.text.replace(/\s/g, "").length * 420);
    else if (n.source.kind === "owl") t += 400000;
    else for (const p of localOf(n).parts) for (const f of p.faces) t += f.loops.reduce((a, lp) => a + lp.length, 0) - 2 + 2 * (f.loops.length - 1);
  }
  return t;
}

// ------------------------------------------------------------------ building scenes

export function makeLayer(name: string, source: Source, color: string, pos: Vec3, extra: Partial<Layer> = {}): Layer {
  return { type: "layer", id: uid(), name, parent: null, color, visible: true, locked: false, ghost: false, mode: "solid", source, pos, rot: [0, 0, 0], scale: [1, 1, 1], ...extra };
}

export const shapeLayer = (name: string, shape: ShapeKind, params: Record<string, number>, color: string, pos: Vec3, hole = false, rz = 0) =>
  makeLayer(name, { kind: "shape", shape, params: { ...defaultParams(shape), ...params } }, color, pos, { mode: hole ? "hole" : "solid", rot: [0, 0, rz] });

export const textSpec = (text: string, p: Partial<TextSpec> = {}): TextSpec => ({ text, font: "Segoe UI", bold: true, size: 10, spacing: 0, curve: 0, depth: 2, bevel: 0, flip: false, mirror: false, ...p });

/** Adds layers (and optionally wraps them in a group) to a doc. Returns the new doc and the top id(s). */
export function addToDoc(doc: Doc, layers: Layer[], group?: { name: string; purpose: "cut" | "join" }): { doc: Doc; ids: string[] } {
  const nodes = { ...doc.nodes };
  if (!group) {
    for (const l of layers) nodes[l.id] = { ...l, parent: null };
    return { doc: { nodes, roots: [...doc.roots, ...layers.map((l) => l.id)] }, ids: layers.map((l) => l.id) };
  }
  const gid = uid();
  for (const l of layers) nodes[l.id] = { ...l, parent: gid };
  nodes[gid] = { type: "group", id: gid, name: group.name, parent: null, color: layers[0].color, visible: true, locked: false, ghost: false, children: layers.map((l) => l.id), purpose: group.purpose, rot: [0, 0, 0] };
  return { doc: { nodes, roots: [...doc.roots, gid] }, ids: [gid] };
}

export const EMPTY_DOC: Doc = { nodes: {}, roots: [] };

/** The project the preview opens with: the desk organizer from the app's store screenshots. */
export function deskOrganizer(): { doc: Doc; selected: string } {
  counter = 100; // the same ids on the server and in the browser
  const blue = "#3b9ee6";
  const body = makeLayer("Body", { kind: "drawing", outlines: [roundRect(150, 80, 18)], solid: "extrude", height: 50, origin: "draw" }, blue, [0, 0, 0]);
  const marker = shapeLayer("Marker hole", "cylinder", { diameter: 18, height: 46, sides: 96 }, blue, [2, 0, 4], true);
  const layers = [
    body,
    shapeLayer("Pen hole", "cylinder", { diameter: 32, height: 46, sides: 96 }, blue, [-42, 4, 4], true),
    marker,
    shapeLayer("Pencil hole", "cylinder", { diameter: 14, height: 46, sides: 96 }, blue, [42, 12, 4], true),
    shapeLayer("Card slot", "cube", { width: 52, depth: 4, height: 30 }, blue, [36, -22, 20], true),
  ];
  const { doc } = addToDoc(EMPTY_DOC, layers, { name: "Desk organizer", purpose: "cut" });
  return { doc, selected: marker.id };
}

export type TemplateId = "keychain" | "sign" | "stamp" | "box" | "phoneStand" | "cableClip" | "plantPot" | "namePlate" | "coaster" | "lithophane" | "boltNut";

export const TEMPLATES: { id: TemplateId; label: string; hint: string; icon: "tag" | "sign" | "stamp" | "boxLid" | "wedge" | "clip" | "cone" | "textPlate" | "cylinder" | "photo" | "bolt" }[] = [
  { id: "keychain", label: "Keychain", hint: "A tag with a ring hole and a name", icon: "tag" },
  { id: "sign", label: "Sign", hint: "A plate with raised words", icon: "sign" },
  { id: "stamp", label: "Stamp", hint: "A block with mirrored letters", icon: "stamp" },
  { id: "box", label: "Box with lid", hint: "A box and a lid that presses on", icon: "boxLid" },
  { id: "phoneStand", label: "Phone stand", hint: "Leans a phone back, with a cable slot", icon: "wedge" },
  { id: "cableClip", label: "Cable clip", hint: "Holds a cable along a desk", icon: "clip" },
  { id: "plantPot", label: "Plant pot", hint: "A pot with a drain hole in the bottom", icon: "cone" },
  { id: "namePlate", label: "Name plate", hint: "A flat plate with a name on it", icon: "textPlate" },
  { id: "coaster", label: "Coaster", hint: "A round coaster with a raised rim", icon: "cylinder" },
  { id: "lithophane", label: "Lithophane", hint: "A photo that shows when light shines through", icon: "photo" },
  { id: "boltNut", label: "Bolt and nut", hint: "An M8 bolt and a nut that fits it", icon: "bolt" },
];

export const partLayer = (kind: PartKind, color: string, pos: Vec3, params: Record<string, number> = {}): Layer => {
  const info = PARTS.find((p) => p.kind === kind) ?? { label: "Lid", params: PARTS.find((p) => p.kind === "box")!.params };
  const all = { ...Object.fromEntries(info.params.map((p) => [p.key, p.def])), ...params };
  const name = kind === "bolt" ? `M${all.size} bolt` : kind === "nut" ? `M${all.size} nut` : kind === "threadedHole" ? `M${all.size} threaded hole` : kind === "box" ? "Box" : kind === "lid" ? "Lid" : info.label;
  return makeLayer(name, { kind: "part", part: kind, params: all }, color, pos, kind === "threadedHole" ? { mode: "hole" } : {});
};

/** Builds a template's layers (centered on the bed), like help/templateList.ts. */
export function buildTemplate(id: TemplateId, color: string): { layers: Layer[]; group?: { name: string; purpose: "cut" | "join" } } | null {
  const c = color;
  switch (id) {
    case "keychain":
      return {
        layers: [
          makeLayer("Tag", { kind: "drawing", outlines: [roundRect(60, 24, 6)], solid: "extrude", height: 3, origin: "draw" }, c, [0, 0, 0]),
          shapeLayer("Ring hole", "cylinder", { diameter: 6, height: 5 }, c, [-23, 0, -1], true),
          makeLayer("Name", { kind: "text", spec: textSpec("ALEX", { size: 11, depth: 1.5 }) }, "#f2f2f2", [4, 0, 3]),
        ],
        group: { name: "Keychain", purpose: "cut" },
      };
    case "sign":
      return {
        layers: [
          makeLayer("Plate", { kind: "drawing", outlines: [roundRect(120, 40, 5)], solid: "extrude", height: 4, origin: "draw" }, "#1e6fe0", [0, 0, 0]),
          makeLayer("Welcome", { kind: "text", spec: textSpec("Welcome", { font: "Segoe Script", bold: false, size: 15, depth: 2 }) }, "#f2f2f2", [0, 0, 4]),
        ],
      };
    case "stamp":
      return {
        layers: [
          shapeLayer("Block", "cube", { width: 50, depth: 30, height: 15 }, c, [0, 0, 0]),
          makeLayer("Letters", { kind: "text", spec: textSpec("JO", { size: 18, depth: 2, mirror: true }) }, c, [0, 0, 15]),
        ],
      };
    case "box":
      return { layers: [partLayer("box", c, [-35, 0, 0]), partLayer("lid", c, [35, 0, 0])] };
    case "phoneStand":
      return {
        layers: [
          shapeLayer("Base", "cube", { width: 70, depth: 60, height: 4 }, c, [0, 0, 0]),
          shapeLayer("Back rest", "wedge", { width: 70, depth: 40, height: 60 }, c, [0, 10, 4], false, 180),
          shapeLayer("Front lip", "cube", { width: 70, depth: 6, height: 12 }, c, [0, -27, 4]),
          shapeLayer("Cable slot", "cube", { width: 16, depth: 10, height: 14 }, c, [0, -27, 4], true),
        ],
        group: { name: "Phone stand", purpose: "cut" },
      };
    case "cableClip":
      return {
        layers: [
          shapeLayer("Ring", "tube", { diameter: 12, wall: 2, height: 8 }, c, [0, 0, 0]),
          shapeLayer("Foot", "cube", { width: 26, depth: 3, height: 8 }, c, [0, -6.5, 0]),
          shapeLayer("Opening", "cube", { width: 5, depth: 8, height: 10 }, c, [0, 5, -1], true),
        ],
        group: { name: "Cable clip", purpose: "cut" },
      };
    case "plantPot":
      return {
        layers: [
          shapeLayer("Pot", "cone", { diameter: 70, top: 90, height: 80, sides: 96 }, c, [0, 0, 0]),
          shapeLayer("Inside", "cone", { diameter: 63, top: 84, height: 80, sides: 96 }, c, [0, 0, 4], true),
          shapeLayer("Drain hole", "cylinder", { diameter: 10, height: 8, sides: 48 }, c, [0, 0, -2], true),
        ],
        group: { name: "Plant pot", purpose: "cut" },
      };
    case "namePlate":
      return {
        layers: [
          shapeLayer("Plate", "cube", { width: 90, depth: 26, height: 3 }, c, [0, 0, 0]),
          makeLayer("Name", { kind: "text", spec: textSpec("Sam's desk", { size: 10, depth: 1.5 }) }, "#f2f2f2", [0, 0, 3]),
        ],
      };
    case "coaster":
      return {
        layers: [shapeLayer("Disc", "cylinder", { diameter: 95, height: 4, sides: 128 }, c, [0, 0, 0]), shapeLayer("Rim", "tube", { diameter: 95, wall: 3, height: 6, sides: 128 }, c, [0, 0, 0])],
        group: { name: "Coaster", purpose: "join" },
      };
    case "boltNut":
      return { layers: [partLayer("bolt", c, [-15, 0, 0]), partLayer("nut", c, [15, 0, 0])] };
    default:
      return null;
  }
}

/** Deep copy of a node and everything inside it, with new ids. */
export function cloneTree(doc: Doc, id: string, parent: string | null, edit: (l: Layer) => Layer): { nodes: Record<string, SNode>; id: string } {
  const n = doc.nodes[id];
  const out: Record<string, SNode> = {};
  const nid = uid();
  if (n.type === "layer") out[nid] = edit({ ...n, id: nid, parent });
  else {
    const kids = n.children.map((ch) => cloneTree(doc, ch, nid, edit));
    for (const k of kids) Object.assign(out, k.nodes);
    out[nid] = { ...n, id: nid, parent, children: kids.map((k) => k.id) };
  }
  return { nodes: out, id: nid };
}
