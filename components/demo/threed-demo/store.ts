"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  EMPTY_DOC,
  type Doc,
  type Group,
  type Layer,
  type SNode,
  type ShapeKind,
  type PartKind,
  type TemplateId,
  type V2,
  type Vec3,
  addToDoc,
  buildTemplate,
  cloneTree,
  defaultParams,
  descendants,
  deskOrganizer,
  layersUnder,
  makeLayer,
  nextColor,
  nodeBox,
  partLayer,
  selectionBox,
  textSpec,
  isEmptyBox,
  boxSize,
  profileOf,
  pawOutlines,
  uid,
} from "./scene";
import type { Unit } from "./ui";

export interface Cam {
  yaw: number;
  pitch: number;
  zoom: number;
  target: Vec3;
}

export interface Notice {
  id: number;
  kind: "info" | "success" | "error";
  text: string;
}

export type MeasureMode = "distance" | "angle" | "radius" | "thickness";
export type SketchTool = "line" | "rect" | "circle" | "polygon";

export type ToolState =
  | null
  | { kind: "measure"; mode: MeasureMode; pts: Vec3[] }
  | { kind: "split"; targetId: string; z: number; pegs: boolean }
  | { kind: "sketch"; tool: SketchTool; shapes: V2[][]; draft: V2[] }
  | { kind: "pick"; purpose: "emboss" | "engrave" | "layflat"; layerId?: string };

export interface GenJob {
  label: string;
  pct: number;
  left: string;
}

export interface GenState {
  open: boolean;
  tab: "picture" | "description" | "models";
  removeBg: boolean;
  looks: boolean;
  picked: number | null;
  size: string;
  sizeAxis: "height" | "width" | "depth";
  detail: "quick" | "fine";
  keepColors: boolean;
  filaments: number;
  description: string;
  cands: boolean;
  pickedCand: number | null;
  job: GenJob | null;
  jobKind: "looks" | "make" | "pictures" | "printable" | null;
  result: { layerId: string; name: string; printable: boolean } | null;
}

export type Dialog = null | "export" | "slicer" | "templates-new" | "templates-add" | "logo" | "keys" | "news" | "about" | "litho";

export interface AppState {
  doc: Doc;
  selection: string[];
  past: { label: string; doc: Doc; sel: string[] }[];
  future: { label: string; doc: Doc; sel: string[] }[];
  unit: Unit;
  mode: "simple" | "advanced";
  panel: "workspace" | "settings";
  settingsTab: "general" | "shortcuts" | "license";
  fileName: string;
  dirty: boolean;
  gizmo: "translate" | "rotate" | "scale";
  snap: boolean;
  lighting: "studio" | "clay";
  edges: boolean;
  xray: boolean;
  cam: Cam;
  camGoal: Cam | null;
  tool: ToolState;
  checks: { open: boolean; overhang: boolean; thin: boolean; gaps: boolean; report: null | "checking" | "done" };
  gen: GenState;
  dialog: Dialog;
  upgrade: null | { feature: "fullDetail" | null };
  notices: Notice[];
  busy: string | null;
  freeLeft: number;
  keepEditable: boolean;
  bed: string;
  layersOpen: boolean;
  rightOpen: boolean;
  propsFolded: boolean;
  liveBase: { doc: Doc; sel: string[] } | null;
}

export const BEDS: { id: string; label: string; size: [number, number] | null }[] = [
  { id: "none", label: "None", size: null },
  { id: "bambu-x1", label: "Bambu Lab X1", size: [256, 256] },
  { id: "bambu-a1mini", label: "Bambu Lab A1 mini", size: [180, 180] },
  { id: "prusa-mk4", label: "Prusa MK4", size: [250, 210] },
  { id: "ender3", label: "Creality Ender 3", size: [220, 220] },
];
export const bedOf = (id: string) => BEDS.find((b) => b.id === id) ?? BEDS[1];

export const START_CAM: Cam = { yaw: 24, pitch: 34, zoom: 3.6, target: [0, 0, 18] };

export function initialState(): AppState {
  const { doc, selected } = deskOrganizer();
  return {
    doc,
    selection: [selected],
    past: [],
    future: [],
    unit: "mm",
    mode: "simple",
    panel: "workspace",
    settingsTab: "general",
    fileName: "Desk organizer",
    dirty: true,
    gizmo: "translate",
    snap: false,
    lighting: "studio",
    edges: false,
    xray: false,
    cam: START_CAM,
    camGoal: null,
    tool: null,
    checks: { open: false, overhang: true, thin: false, gaps: false, report: null },
    gen: {
      open: false,
      tab: "picture",
      removeBg: true,
      looks: false,
      picked: null,
      size: "80 mm",
      sizeAxis: "height",
      detail: "quick",
      keepColors: true,
      filaments: 4,
      description: "a cute round owl figurine sitting on a branch",
      cands: false,
      pickedCand: null,
      job: null,
      jobKind: null,
      result: null,
    },
    dialog: null,
    upgrade: null,
    notices: [],
    busy: null,
    freeLeft: 3,
    keepEditable: true,
    bed: "bambu-x1",
    layersOpen: true,
    rightOpen: true,
    propsFolded: false,
    liveBase: null,
  };
}

// ------------------------------------------------------------------ tiny store

type Listener = () => void;
export interface Store {
  get: () => AppState;
  set: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  subscribe: (f: Listener) => () => void;
}

export function createStore(init: AppState): Store {
  let state = init;
  const subs = new Set<Listener>();
  return {
    get: () => state,
    set: (patch) => {
      state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
      subs.forEach((f) => f());
    },
    subscribe: (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}

export const StoreContext = createContext<Store | null>(null);

export function useApp(): AppState {
  const store = useContext(StoreContext)!;
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function useStore(): Store {
  return useContext(StoreContext)!;
}

// ------------------------------------------------------------------ doc helpers

const S = (st: Store) => st.get();

export function updateNode(doc: Doc, id: string, patch: Partial<Layer> | Partial<Group>): Doc {
  const n = doc.nodes[id];
  if (!n) return doc;
  return { ...doc, nodes: { ...doc.nodes, [id]: { ...n, ...patch } as SNode } };
}

function updateLayers(doc: Doc, ids: string[], f: (l: Layer) => Layer): Doc {
  const nodes = { ...doc.nodes };
  for (const id of ids) {
    const n = nodes[id];
    if (n?.type === "layer") nodes[id] = f(n);
  }
  return { ...doc, nodes };
}

export function removeNodes(doc: Doc, ids: string[]): Doc {
  const gone = new Set(ids.flatMap((id) => descendants(doc, id)));
  const nodes: Record<string, SNode> = {};
  for (const [k, n] of Object.entries(doc.nodes)) {
    if (gone.has(k)) continue;
    nodes[k] = n.type === "group" ? { ...n, children: n.children.filter((ch) => !gone.has(ch)) } : n;
  }
  // A group left empty goes too.
  for (const [k, n] of Object.entries(nodes)) if (n.type === "group" && n.children.length === 0) delete nodes[k];
  return { nodes, roots: doc.roots.filter((r) => nodes[r]) };
}

export const snapMm = (v: number, st: AppState) => {
  if (!st.snap) return Math.round(v * 100) / 100;
  const step = st.unit === "in" ? 25.4 / 16 : 1;
  return Math.round(v / step) * step;
};

/** Position shown in Properties: a layer's own, or a group's middle (bottom for Z). */
export function nodePosition(doc: Doc, id: string): Vec3 {
  const n = doc.nodes[id];
  if (n.type === "layer") return n.pos;
  const b = nodeBox(doc, id);
  if (isEmptyBox(b)) return [0, 0, 0];
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, b.min[2]];
}

export function moveDoc(doc: Doc, ids: string[], d: Vec3): Doc {
  const layers = ids.flatMap((id) => layersUnder(doc, id).map((l) => l.id));
  return updateLayers(doc, [...new Set(layers)], (l) => ({ ...l, pos: [l.pos[0] + d[0], l.pos[1] + d[1], l.pos[2] + d[2]], clip: l.clip ? [l.clip[0] + d[2], l.clip[1] + d[2]] : l.clip }));
}

export function setPositionDoc(doc: Doc, id: string, axis: number, v: number): Doc {
  const cur = nodePosition(doc, id);
  const d: Vec3 = [0, 0, 0];
  d[axis] = v - cur[axis];
  return moveDoc(doc, [id], d);
}

export function setSizeDoc(doc: Doc, id: string, axis: number, v: number, uniform: boolean): Doc {
  const b = nodeBox(doc, id);
  const size = boxSize(b);
  if (size[axis] <= 1e-6 || v <= 0) return doc;
  const f = v / size[axis];
  const fx: Vec3 = uniform ? [f, f, f] : ([0, 1, 2].map((i) => (i === axis ? f : 1)) as Vec3);
  const n = doc.nodes[id];
  if (n.type === "layer") return updateLayers(doc, [id], (l) => ({ ...l, scale: [l.scale[0] * fx[0], l.scale[1] * fx[1], l.scale[2] * fx[2]] }));
  const C: Vec3 = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, b.min[2]];
  return updateLayers(
    doc,
    layersUnder(doc, id).map((l) => l.id),
    (l) => ({
      ...l,
      scale: [l.scale[0] * fx[0], l.scale[1] * fx[1], l.scale[2] * fx[2]],
      pos: [C[0] + (l.pos[0] - C[0]) * fx[0], C[1] + (l.pos[1] - C[1]) * fx[1], C[2] + (l.pos[2] - C[2]) * fx[2]],
      clip: l.clip ? [C[2] + (l.clip[0] - C[2]) * fx[2], C[2] + (l.clip[1] - C[2]) * fx[2]] : l.clip,
    }),
  );
}

export function setRotationDoc(doc: Doc, id: string, axis: number, deg: number): Doc {
  const n = doc.nodes[id];
  if (n.type === "layer") {
    const r = [...n.rot] as Vec3;
    r[axis] = deg;
    return updateNode(doc, id, { rot: r });
  }
  const delta = deg - n.rot[axis];
  const b = nodeBox(doc, id);
  const C: Vec3 = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
  const a = (delta * Math.PI) / 180;
  const [i, j] = axis === 2 ? [0, 1] : axis === 1 ? [2, 0] : [1, 2];
  let out = updateLayers(
    doc,
    layersUnder(doc, id).map((l) => l.id),
    (l) => {
      const p = [...l.pos] as Vec3;
      const u = p[i] - C[i];
      const w = p[j] - C[j];
      p[i] = C[i] + u * Math.cos(a) - w * Math.sin(a);
      p[j] = C[j] + u * Math.sin(a) + w * Math.cos(a);
      const r = [...l.rot] as Vec3;
      r[axis] += delta;
      return { ...l, pos: p, rot: r };
    },
  );
  const r = [...n.rot] as Vec3;
  r[axis] = deg;
  out = updateNode(out, id, { rot: r });
  return out;
}

export function dropDoc(doc: Doc, ids: string[]): Doc {
  let out = doc;
  for (const id of ids) {
    const b = nodeBox(out, id);
    if (!isEmptyBox(b)) out = moveDoc(out, [id], [0, 0, -b.min[2]]);
  }
  return out;
}

// ------------------------------------------------------------------ actions

let noticeId = 1;

export function makeActions(st: Store) {
  const info = (text: string, kind: Notice["kind"] = "info") => {
    const id = noticeId++;
    st.set((s) => ({ notices: [...s.notices.slice(-2), { id, kind, text }] }));
    window.setTimeout(() => st.set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })), 5200);
  };

  const commit = (label: string, doc: Doc, sel?: string[]) =>
    st.set((s) => ({
      past: [...s.past, { label, doc: s.doc, sel: s.selection }].slice(-60),
      future: [],
      doc,
      selection: (sel ?? s.selection).filter((id) => doc.nodes[id]),
      dirty: true,
    }));

  /** Places new layers to the right of what's already there, like the app's templates. */
  const placeBeside = (layers: Layer[]): Layer[] => {
    const s = S(st);
    const before = selectionBox(s.doc, s.doc.roots);
    if (isEmptyBox(before)) return layers;
    const tmp = addToDoc(EMPTY_DOC, layers).doc;
    const b = selectionBox(tmp, tmp.roots);
    const dx = before.max[0] + 12 - b.min[0];
    const dy = (before.min[1] + before.max[1]) / 2 - (b.min[1] + b.max[1]) / 2;
    return layers.map((l) => ({ ...l, pos: [l.pos[0] + dx, l.pos[1] + dy, l.pos[2]] }));
  };

  const editableSel = () => {
    const s = S(st);
    return s.selection.filter((id) => s.doc.nodes[id] && !s.doc.nodes[id].locked);
  };

  const a = {
    info,
    commit,
    select(ids: string[], mode: "replace" | "toggle" = "replace") {
      st.set((s) => {
        if (mode === "replace") return { selection: ids };
        const sel = [...s.selection];
        for (const id of ids) {
          const i = sel.indexOf(id);
          if (i >= 0) sel.splice(i, 1);
          else sel.push(id);
        }
        return { selection: sel };
      });
    },
    undo() {
      const s = S(st);
      const last = s.past[s.past.length - 1];
      if (!last) return;
      st.set({ past: s.past.slice(0, -1), future: [{ label: last.label, doc: s.doc, sel: s.selection }, ...s.future], doc: last.doc, selection: last.sel.filter((id) => last.doc.nodes[id]) });
    },
    redo() {
      const s = S(st);
      const next = s.future[0];
      if (!next) return;
      st.set({ future: s.future.slice(1), past: [...s.past, { label: next.label, doc: s.doc, sel: s.selection }], doc: next.doc, selection: next.sel.filter((id) => next.doc.nodes[id]) });
    },
    /** Jump to a point in History (index into past; past.length = now). */
    jumpTo(i: number) {
      const s = S(st);
      const steps = s.past.length - i;
      if (steps > 0) for (let k = 0; k < steps; k++) a.undo();
      else for (let k = 0; k < -steps; k++) a.redo();
    },

    // Live changes while dragging: one undo step when the drag ends.
    beginLive() {
      const s = S(st);
      if (!s.liveBase) st.set({ liveBase: { doc: s.doc, sel: s.selection } });
    },
    live(doc: Doc) {
      st.set({ doc });
    },
    endLive(label: string) {
      const s = S(st);
      const base = s.liveBase;
      if (!base) return;
      if (base.doc === s.doc) return st.set({ liveBase: null });
      st.set({ liveBase: null, past: [...s.past, { label, doc: base.doc, sel: base.sel }].slice(-60), future: [], dirty: true });
    },

    setNode(id: string, patch: Partial<Layer> | Partial<Group>, label: string) {
      commit(label, updateNode(S(st).doc, id, patch));
    },
    setPosition(id: string, axis: number, v: number) {
      commit(`Move ${S(st).doc.nodes[id].name}`, setPositionDoc(S(st).doc, id, axis, v));
    },
    setSize(id: string, axis: number, v: number, uniform: boolean) {
      commit(`Resize ${S(st).doc.nodes[id].name}`, setSizeDoc(S(st).doc, id, axis, v, uniform));
    },
    setRotation(id: string, axis: number, deg: number) {
      commit(`Rotate ${S(st).doc.nodes[id].name}`, setRotationDoc(S(st).doc, id, axis, deg));
    },
    setScalePct(id: string, pct: number) {
      const s = S(st);
      const size = boxSize(nodeBox(s.doc, id));
      const axis = size.indexOf(Math.max(...size));
      commit(`Scale ${s.doc.nodes[id].name}`, setSizeDoc(s.doc, id, axis, (size[axis] * pct) / 100, true));
    },

    addLayers(layers: Layer[], label: string, group?: { name: string; purpose: "cut" | "join" }) {
      const placed = placeBeside(layers);
      const { doc, ids } = addToDoc(S(st).doc, placed, group);
      commit(label, doc, ids);
      st.set({ panel: "workspace" });
      // Keep the new piece in view.
      a.frame(true);
    },
    addShape(kind: ShapeKind) {
      const s = S(st);
      const label = { cube: "Cube", cylinder: "Cylinder", sphere: "Sphere", cone: "Cone", torus: "Ring", wedge: "Wedge", tube: "Tube", star: "Star", heart: "Heart" }[kind];
      const l = makeLayer(label, { kind: "shape", shape: kind, params: defaultParams(kind) }, nextColor(s.doc), [0, 0, 0]);
      a.addLayers([l], `Add ${label.toLowerCase()}`);
    },
    addPart(kind: PartKind) {
      const c = nextColor(S(st).doc);
      if (kind === "box") return a.addLayers([partLayer("box", c, [-35, 0, 0]), partLayer("lid", c, [35, 0, 0])], "Add box with lid");
      a.addLayers([partLayer(kind, c, [0, 0, 0])], `Add ${kind === "threadedHole" ? "threaded hole" : kind}`);
    },
    addText() {
      const l = makeLayer("Text", { kind: "text", spec: textSpec("Text", { size: 12, depth: 3 }) }, nextColor(S(st).doc), [0, 0, 0]);
      a.addLayers([l], "Add text");
    },
    addLogo(width: number, height: number, smooth: number) {
      const l = makeLayer("paw", { kind: "drawing", outlines: pawOutlines(width, smooth), solid: "extrude", height, origin: "logo" }, nextColor(S(st).doc), [0, 0, 0]);
      a.addLayers([l], "Add logo");
    },
    addTemplate(id: TemplateId, fresh: boolean) {
      if (fresh) st.set({ doc: EMPTY_DOC, selection: [], past: [], future: [], fileName: TEMPLATE_NAME[id] ?? "Untitled", dirty: false, tool: null });
      const t = buildTemplate(id, nextColor(S(st).doc));
      if (!t) return;
      a.addLayers(t.layers, `Add ${(TEMPLATE_NAME[id] ?? "template").toLowerCase()}`, t.group);
      a.frame(true);
    },
    newProject() {
      st.set({ doc: EMPTY_DOC, selection: [], past: [], future: [], fileName: "Untitled", dirty: false, tool: null, cam: START_CAM });
    },

    combine(kind: "cut" | "join", editable = S(st).keepEditable) {
      const s = S(st);
      const ids = editableSel();
      if (ids.length < 2) {
        info(kind === "cut" ? "Click the object to cut first, then Shift-click the shape (or shapes) that cut into it." : "Select two or more objects to join (Shift-click to add to the selection).");
        return;
      }
      let doc = s.doc;
      // Pull the picked items out of where they are, then wrap them in one group.
      const gid = uid();
      const nodes = { ...doc.nodes };
      for (const id of ids) {
        const n = nodes[id];
        if (n.parent) {
          const p = nodes[n.parent] as Group;
          nodes[p.id] = { ...p, children: p.children.filter((ch) => ch !== id) };
        }
        nodes[id] = { ...n, parent: gid, ...(kind === "cut" && id !== ids[0] && n.type === "layer" ? { mode: "hole" as const } : {}) } as SNode;
      }
      const first = nodes[ids[0]];
      nodes[gid] = { type: "group", id: gid, name: `${kind === "cut" ? "Cut" : "Join"} ${first.name}`, parent: null, color: first.color, visible: true, locked: false, ghost: false, children: ids, purpose: kind, baked: !editable, rot: [0, 0, 0] };
      doc = { nodes, roots: [...doc.roots.filter((r) => !ids.includes(r)), gid] };
      const label = kind === "cut" ? "Cut" : "Join";
      st.set({ busy: kind === "cut" ? "Cutting..." : "Joining..." });
      window.setTimeout(() => {
        st.set({ busy: null });
        commit(editable ? label : `${label} and apply`, doc, [gid]);
      }, 450);
    },
    bake(id: string) {
      const n = S(st).doc.nodes[id];
      if (!n) return;
      if (n.type === "group") a.setNode(id, { baked: true }, "Apply");
      else {
        a.setNode(id, { plain: true } as Partial<Layer>, "Apply");
        info("It's a plain shape now. Undo takes it back.");
      }
    },
    deleteSelection() {
      const ids = editableSel();
      if (!ids.length) return;
      commit("Delete", removeNodes(S(st).doc, ids), []);
    },
    duplicateSelection() {
      const s = S(st);
      const ids = s.selection.filter((id) => s.doc.nodes[id]);
      if (!ids.length) return;
      let doc = s.doc;
      const fresh: string[] = [];
      for (const id of ids) {
        const n = doc.nodes[id];
        const size = boxSize(nodeBox(doc, id));
        const c = cloneTree(doc, id, n.parent, (l) => ({ ...l, pos: [l.pos[0] + size[0] + 8, l.pos[1], l.pos[2]] }));
        const nodes = { ...doc.nodes, ...c.nodes };
        if (n.parent) {
          const p = nodes[n.parent] as Group;
          nodes[p.id] = { ...p, children: [...p.children, c.id] };
        }
        nodes[c.id] = { ...nodes[c.id], name: `${n.name} copy` };
        doc = { nodes, roots: n.parent ? doc.roots : [...doc.roots, c.id] };
        fresh.push(c.id);
      }
      commit("Duplicate", doc, fresh);
    },
    putOnBed(ids = S(st).selection) {
      commit("Put on bed", dropDoc(S(st).doc, ids));
    },
    group() {
      const ids = editableSel();
      if (ids.length < 1) return info("Select the objects to group first.");
      const s = S(st);
      const gid = uid();
      const nodes = { ...s.doc.nodes };
      for (const id of ids) {
        const n = nodes[id];
        if (n.parent) {
          const p = nodes[n.parent] as Group;
          nodes[p.id] = { ...p, children: p.children.filter((ch) => ch !== id) };
        }
        nodes[id] = { ...n, parent: gid } as SNode;
      }
      nodes[gid] = { type: "group", id: gid, name: "Group", parent: null, color: nodes[ids[0]].color, visible: true, locked: false, ghost: false, children: ids, purpose: null, rot: [0, 0, 0] };
      commit("Group", { nodes, roots: [...s.doc.roots.filter((r) => !ids.includes(r)), gid] }, [gid]);
    },
    ungroup() {
      const s = S(st);
      const g = s.doc.nodes[s.selection[0]];
      if (!g || g.type !== "group") return;
      const nodes = { ...s.doc.nodes };
      for (const ch of g.children) nodes[ch] = { ...nodes[ch], parent: g.parent } as SNode;
      delete nodes[g.id];
      let roots = s.doc.roots;
      if (g.parent) {
        const p = nodes[g.parent] as Group;
        nodes[p.id] = { ...p, children: p.children.flatMap((ch) => (ch === g.id ? g.children : [ch])) };
      } else roots = roots.flatMap((r) => (r === g.id ? g.children : [r]));
      commit("Ungroup", { nodes, roots }, g.children);
    },
    mirror(axis: 0 | 1) {
      const s = S(st);
      const ids = editableSel();
      let doc = s.doc;
      for (const id of ids) {
        const b = nodeBox(doc, id);
        const mid = (b.min[axis] + b.max[axis]) / 2;
        doc = updateLayers(
          doc,
          layersUnder(doc, id).map((l) => l.id),
          (l) => {
            const pos = [...l.pos] as Vec3;
            pos[axis] = 2 * mid - pos[axis];
            const scale = [...l.scale] as Vec3;
            scale[axis] = -scale[axis];
            return { ...l, pos, scale };
          },
        );
      }
      commit(`Mirror ${axis === 0 ? "X" : "Y"}`, doc);
    },
    /** Turns the object so the clicked face sits on the bed (nearest straight side). */
    layFlat(id: string, n: Vec3) {
      const s = S(st);
      const node = s.doc.nodes[id];
      if (!node) return;
      const ax = n.map(Math.abs);
      const k = ax.indexOf(Math.max(...ax));
      const sign = Math.sign(n[k]);
      let doc = s.doc;
      if (k === 2 && sign > 0) doc = setRotationDoc(doc, id, 0, (nodeRot(doc, id)[0] + 180) % 360);
      else if (k === 0) doc = setRotationDoc(doc, id, 1, nodeRot(doc, id)[1] + (sign > 0 ? 90 : -90));
      else if (k === 1) doc = setRotationDoc(doc, id, 0, nodeRot(doc, id)[0] + (sign > 0 ? -90 : 90));
      commit("Lay flat", dropDoc(doc, [id]), [id]);
    },

    fix(label: string) {
      const ids = editableSel();
      if (!ids.length) return info("Select the object to fix first.");
      st.set({ busy: `${label}...` });
      window.setTimeout(() => {
        st.set({ busy: null });
        info(label === "Close holes" ? "No holes to close: it's already a closed solid." : `${label}: nothing needed changing.`, "success");
      }, 900);
    },

    // ---- split to fit the bed
    startSplit(id = S(st).selection[0]) {
      const s = S(st);
      if (!id || !s.doc.nodes[id]) return info("Select the object to split first.");
      const b = nodeBox(s.doc, id);
      st.set({ tool: { kind: "split", targetId: id, z: Math.round((b.min[2] + b.max[2]) / 2), pegs: true }, panel: "workspace" });
    },
    applySplit() {
      const s = S(st);
      const t = s.tool;
      if (t?.kind !== "split") return;
      const id = t.targetId;
      const n = s.doc.nodes[id];
      if (!n) return st.set({ tool: null });
      const layers = layersUnder(s.doc, id);
      const solids = layers.filter((l) => l.mode === "solid");
      if (solids.some((l) => !profileOf(l) || l.rot[0] || l.rot[1])) {
        st.set({ tool: null });
        return info("This one is split in the app. In this preview, Split works on straight-sided shapes.");
      }
      const b = nodeBox(s.doc, id);
      const z = t.z;
      const lower = cloneTree(s.doc, id, null, (l) => ({ ...l, clip: [l.clip?.[0] ?? -1e6, Math.min(l.clip?.[1] ?? 1e6, z)] }));
      const upper = cloneTree(s.doc, id, null, (l) => ({ ...l, clip: [Math.max(l.clip?.[0] ?? -1e6, z), l.clip?.[1] ?? 1e6] }));
      let doc: Doc = removeNodes(s.doc, [id]);
      doc = { nodes: { ...doc.nodes, ...lower.nodes, ...upper.nodes }, roots: [...doc.roots, lower.id, upper.id] };
      doc = updateNode(doc, lower.id, { name: `${n.name} (part 1)` });
      doc = updateNode(doc, upper.id, { name: `${n.name} (part 2)` });
      // Part 2 goes beside part 1, cut face down on the bed, ready to print.
      const w = b.max[0] - b.min[0];
      doc = moveDoc(doc, [upper.id], [w + 14, 0, -(z - b.min[2])]);
      st.set({ tool: null, busy: "Splitting..." });
      window.setTimeout(() => {
        st.set({ busy: null });
        commit("Split to fit the bed", doc, [lower.id, upper.id]);
        a.frame(true);
        info(`Split into 2 parts${t.pegs ? ", with pegs so they line up" : ""}. Each fits the bed.`, "success");
      }, 600);
    },

    frame(all = false) {
      const s = S(st);
      const ids = !all && s.selection.length ? s.selection : s.doc.roots;
      const b = selectionBox(s.doc, ids);
      if (isEmptyBox(b)) return st.set({ camGoal: { ...s.cam, target: [0, 0, 10], zoom: 2.4 } });
      const size = boxSize(b);
      const diag = Math.hypot(...size);
      st.set({ camGoal: { ...s.cam, target: [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2], zoom: Math.max(0.6, Math.min(14, 360 / Math.max(diag, 10))) } });
    },
  };
  return a;
}

const nodeRot = (doc: Doc, id: string): Vec3 => doc.nodes[id].rot;

const TEMPLATE_NAME: Partial<Record<TemplateId, string>> = {
  keychain: "Keychain",
  sign: "Sign",
  stamp: "Stamp",
  box: "Box with lid",
  phoneStand: "Phone stand",
  cableClip: "Cable clip",
  plantPot: "Plant pot",
  namePlate: "Name plate",
  coaster: "Coaster",
  boltNut: "Bolt and nut",
};

export type Actions = ReturnType<typeof makeActions>;
export const ActionsContext = createContext<Actions | null>(null);
export const useActions = () => useContext(ActionsContext)!;
