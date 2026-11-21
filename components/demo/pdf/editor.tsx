"use client";

// The Editor tab: document tabs, the toolbar and tool row, page thumbnails / bookmarks, the pages
// themselves with everything placed on them, and the Properties / Comments panel.
// Mirrors revinhi-pdf/src/editor/EditorView.tsx (+ ThumbRail, Viewer, FindBar, OverlayLayer).

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDemo } from "../AppWindow";
import { MARKS, TODAY, newKey, pageOf, type Doc, type Feature, type Ov, type OutlineNode, type PageRef, type Rect, type Snap, type TextEdit } from "./data";
import { DEFAULT_STYLE, ObjectProps, OvView, TextEditProps, styleObject, type HandleDir, type Sig, type Tool, type ToolStyle } from "./objects";
import { PageView, cropBox, pagePoint, shown, type PageCtxValue } from "./pages";
import {
  ContextMenu,
  IconAdd,
  IconBack,
  IconBtn,
  IconChevronRight,
  IconClose,
  IconCrop,
  IconDown,
  IconDraw,
  IconEraser,
  IconExtract,
  IconFind,
  IconForward,
  IconHighlight,
  IconImage,
  IconInsertFile,
  IconLockLine,
  IconMinus,
  IconNote,
  IconPencil,
  IconPrint,
  IconRedo,
  IconRotate,
  IconSelect,
  IconShapes,
  IconSign,
  IconStamp,
  IconTextTool,
  IconTrash,
  IconUndo,
  IconUp,
  Modal,
  Toggle,
  SettingRow,
  c,
  toLocal,
  type MenuEntry,
} from "./ui";

export interface EditorApi {
  docs: Doc[];
  activeId: string | null;
  setActive(id: string): void;
  updateDoc(id: string, fn: (d: Doc) => Doc): void;
  closeDoc(id: string): void;
  pro: boolean;
  paywall(f: Feature | null): void;
  sigs: Sig[];
  activeSig: string | null;
  setActiveSig(id: string): void;
  toast(text: string): void;
  onOpen(): void;
  onNew(): void;
  root: HTMLElement | null;
  keyRef: MutableRefObject<((e: React.KeyboardEvent) => void) | null>;
  flags: MutableRefObject<{ editNotice: boolean }>;
}

type ZoomState = { mode: "width" | "page" | "custom"; value: number };
type Layout = "single" | "spread" | "cover";
type Sel = { pageKey: string; ids: string[] } | null;
type Hit = { pageKey: string; rects: Rect[] };

const TOOLS: { id: Tool; label: string; icon: ReactNode; title: string }[] = [
  { id: "select", label: "Select", icon: <IconSelect size={12} />, title: "Select, move and resize (V)" },
  { id: "edittext", label: "Edit text", icon: <IconPencil size={12} />, title: "Edit existing text (E)" },
  { id: "text", label: "Text", icon: <IconTextTool size={12} />, title: "Add a text box (T)" },
  { id: "highlight", label: "Highlight", icon: <IconHighlight size={12} />, title: "Highlight (H)" },
  { id: "ink", label: "Draw", icon: <IconDraw size={12} />, title: "Freehand drawing (D)" },
  { id: "shape", label: "Shapes", icon: <IconShapes size={12} />, title: "Rectangle, ellipse, line, arrow (S)" },
  { id: "image", label: "Image", icon: <IconImage size={12} />, title: "Place an image" },
  { id: "sign", label: "Sign", icon: <IconSign size={12} />, title: "Place a saved signature" },
  { id: "whiteout", label: "Whiteout", icon: <IconEraser size={12} />, title: "Cover content with a white box (W)" },
  { id: "note", label: "Note", icon: <IconNote size={12} />, title: "Sticky-note comment (N)" },
  { id: "stamp", label: "Stamp", icon: <IconStamp size={12} />, title: "Approved, Draft, Paid... stamps (P)" },
  { id: "crop", label: "Crop", icon: <IconCrop size={12} />, title: "Crop pages: drag the area to keep (C)" },
  { id: "redact", label: "Redact", icon: <IconLockLine size={12} />, title: "Mark areas for true redaction (R), then Document > Apply redactions" },
];

const TOOL_KEYS: Record<string, Tool> = { v: "select", e: "edittext", t: "text", h: "highlight", d: "ink", s: "shape", w: "whiteout", n: "note", p: "stamp", c: "crop", r: "redact" };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const winScale = (el: HTMLElement) => el.getBoundingClientRect().height / (el.offsetHeight || 1) || 1;

function drag(move: (e: PointerEvent) => void, up: (e: PointerEvent) => void) {
  const m = (e: PointerEvent) => move(e);
  const u = (e: PointerEvent) => {
    window.removeEventListener("pointermove", m);
    window.removeEventListener("pointerup", u);
    up(e);
  };
  window.addEventListener("pointermove", m);
  window.addEventListener("pointerup", u);
}

const setOv = (pageKey: string, fn: (list: Ov[]) => Ov[]) => (s: Snap): Snap => ({ ...s, overlays: { ...s.overlays, [pageKey]: fn(s.overlays[pageKey] ?? []) } });

/** Copies of pages with their objects, edits and field values (new keys). */
function clonePages(src: Snap, keys: string[]) {
  const pages: PageRef[] = [];
  const overlays: Record<string, Ov[]> = {};
  const edits: Record<string, TextEdit> = {};
  const fields: Record<string, string | boolean> = {};
  for (const k of keys) {
    const p = src.pages.find((x) => x.key === k);
    if (!p) continue;
    const nk = newKey();
    pages.push({ ...p, key: nk });
    if (src.overlays[k]) overlays[nk] = src.overlays[k].map((o) => ({ ...o, id: newKey("ov") }));
    for (const [ek, ev] of Object.entries(src.edits)) if (ek.startsWith(`${k}|`)) edits[`${nk}|${ek.slice(k.length + 1)}`] = ev;
    for (const [fk, fv] of Object.entries(src.fields)) if (fk.startsWith(`${k}|`)) fields[`${nk}|${fk.slice(k.length + 1)}`] = fv;
  }
  return { pages, overlays, edits, fields };
}

function mergeInto(s: Snap, add: ReturnType<typeof clonePages>, at: number): Snap {
  return {
    ...s,
    pages: [...s.pages.slice(0, at), ...add.pages, ...s.pages.slice(at)],
    overlays: { ...s.overlays, ...add.overlays },
    edits: { ...s.edits, ...add.edits },
    fields: { ...s.fields, ...add.fields },
  };
}

function Portal({ root, children }: { root: HTMLElement | null; children: ReactNode }) {
  return root ? createPortal(children, root) : null;
}

// ================================================================== Editor tab

export function EditorView(api: EditorApi) {
  const { notify } = useDemo();
  const active = api.docs.find((d) => d.id === api.activeId) ?? null;
  const [closeAsk, setCloseAsk] = useState<Doc | null>(null);
  const requestClose = (d: Doc) => (d.dirty ? setCloseAsk(d) : api.closeDoc(d.id));

  return (
    <div className={c("pane editor")}>
      <div className={c("doc-tabs")}>
        {api.docs.map((d) => (
          <div
            key={d.id}
            data-doc-id={d.id}
            className={c("doc-tab", d.id === active?.id && "active")}
            onClick={() => api.setActive(d.id)}
            onAuxClick={(e) => e.button === 1 && requestClose(d)}
            title={d.path + (d.dirty ? " (unsaved changes)" : "")}
          >
            <span className={c("doc-tab-name")}>
              {d.dirty && <span className={c("doc-tab-dot")} />}
              {d.title}
            </span>
            <button
              type="button"
              className={c("doc-tab-close")}
              aria-label={`Close ${d.title}`}
              onClick={(e) => {
                e.stopPropagation();
                requestClose(d);
              }}
            >
              <IconClose size={8} />
            </button>
          </div>
        ))}
        <button type="button" className={c("doc-tab-add")} onClick={api.onOpen} title="Open PDF">
          +
        </button>
      </div>

      {active ? (
        <Workspace key={active.id} doc={active} api={api} />
      ) : (
        <div className={c("card editor-empty")}>
          <div className={c("section-title text-muted")}>NO DOCUMENT OPEN</div>
          <p className={c("text-muted")}>Open a PDF or drop one anywhere on the window.</p>
          <div className={c("editor-empty-actions")}>
            <button className={c("btn btn-primary")} onClick={api.onOpen}>
              Open PDF
            </button>
            <button className={c("btn btn-secondary")} onClick={api.onNew} title="New blank PDF (Ctrl+N)">
              New blank PDF
            </button>
          </div>
        </div>
      )}

      {closeAsk && (
        <Portal root={api.root}>
          <Modal
            title="Save changes?"
            onCancel={() => setCloseAsk(null)}
            actions={
              <>
                <button
                  className={c("btn btn-primary")}
                  onClick={() => {
                    notify("In the app, this saves your PDF, then closes it.");
                    api.closeDoc(closeAsk.id);
                    setCloseAsk(null);
                  }}
                >
                  Save
                </button>
                <button
                  className={c("btn btn-danger")}
                  onClick={() => {
                    api.closeDoc(closeAsk.id);
                    setCloseAsk(null);
                  }}
                >
                  Don&apos;t save
                </button>
                <button className={c("btn btn-secondary")} onClick={() => setCloseAsk(null)}>
                  Cancel
                </button>
              </>
            }
          >
            <p className={c("modal-copy")}>
              <b>{closeAsk.title}</b> has unsaved changes. Save them before closing?
            </p>
          </Modal>
        </Portal>
      )}
    </div>
  );
}

// ================================================================== one open document

function Workspace({ doc, api }: { doc: Doc; api: EditorApi }) {
  const { notify } = useDemo();
  const { pro, paywall, root } = api;
  const snap = doc.snap;
  const pages = snap.pages;
  const total = pages.length;

  // ---- history ----------------------------------------------------------------
  const lastKey = useRef<{ key: string; t: number } | null>(null);
  const exec = (fn: (s: Snap) => Snap, key?: string) => {
    const now = Date.now();
    const coalesce = !!key && lastKey.current?.key === key && now - lastKey.current.t < 1500;
    lastKey.current = key ? { key, t: now } : null;
    api.updateDoc(doc.id, (d) => {
      const next = fn(d.snap);
      if (next === d.snap) return d;
      return { ...d, snap: next, undo: coalesce ? d.undo : [...d.undo.slice(-60), d.snap], redo: [], dirty: true };
    });
  };
  const undo = () => {
    lastKey.current = null;
    api.updateDoc(doc.id, (d) => (d.undo.length ? { ...d, snap: d.undo[d.undo.length - 1], undo: d.undo.slice(0, -1), redo: [...d.redo, d.snap], dirty: true } : d));
  };
  const redo = () => {
    lastKey.current = null;
    api.updateDoc(doc.id, (d) => (d.redo.length ? { ...d, snap: d.redo[d.redo.length - 1], redo: d.redo.slice(0, -1), undo: [...d.undo, d.snap], dirty: true } : d));
  };

  // ---- view state ---------------------------------------------------------------
  const [zoom, setZoom] = useState<ZoomState>({ mode: "width", value: 1 });
  const [layout, setLayout] = useState<Layout>("single");
  const [night, setNight] = useState(false);
  const [snapOn, setSnapOn] = useState(true);
  const [pageRaw, setPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [selectedRaw, setSelected] = useState<Set<string>>(new Set());
  const [railTab, setRailTab] = useState<"pages" | "outline">("pages");
  const [sideTab, setSideTab] = useState<"props" | "comments">("props");
  const [menu, setMenu] = useState<{ x: number; y: number; kind: "page" | "view" | "doc" } | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [dialog, setDialog] = useState<null | "saveas" | "notice" | "meta" | "deco" | "redact">(null);
  const back = useRef<number[]>([]);
  const fwd = useRef<number[]>([]);
  const [, bump] = useState(0);

  // ---- tools + objects ----------------------------------------------------------
  const [tool, setToolState] = useState<Tool>("select");
  const [style, setStyleState] = useState<ToolStyle>(DEFAULT_STYLE);
  const [sel, setSel] = useState<Sel>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runEditing, setRunEditing] = useState<string | null>(null);
  const [teSel, setTeSel] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ pageKey: string; r: Rect } | null>(null);
  const [inkDraft, setInkDraft] = useState<{ pageKey: string; pts: number[] } | null>(null);
  const [cropDraft, setCropDraft] = useState<{ pageKey: string; r: Rect } | null>(null);
  const [noteOpen, setNoteOpen] = useState<{ pageKey: string; id: string; left: number; top: number } | null>(null);

  // ---- find -------------------------------------------------------------------
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [hitIdx, setHitIdx] = useState(-1);
  const findInput = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [vs, setVs] = useState({ w: 540, h: 600 });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setVs((v) => (v.w === el.clientWidth && v.h === el.clientHeight ? v : { w: el.clientWidth, h: el.clientHeight }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pages that no longer exist (after delete / undo) drop out of the selection.
  const page = Math.min(pageRaw, Math.max(0, total - 1));
  const selected = useMemo(() => {
    const keys = new Set(pages.map((p) => p.key));
    const next = new Set([...selectedRaw].filter((x) => keys.has(x)));
    return next.size === selectedRaw.size ? selectedRaw : next;
  }, [pages, selectedRaw]);

  const maxW = Math.max(1, ...pages.map((p) => shown(p).w));
  const maxH = Math.max(1, ...pages.map((p) => shown(p).h));
  const cols = layout === "single" ? 1 : 2;
  const fitW = (vs.w - 34 - (cols - 1) * 14) / (maxW * cols);
  const fitP = Math.min(fitW, (vs.h - 34) / maxH);
  const k = clamp(zoom.mode === "width" ? fitW : zoom.mode === "page" ? fitP : zoom.value, 0.25, 4);

  const rows = useMemo(() => {
    const idx = pages.map((_, i) => i);
    if (layout === "single") return idx.map((i) => [i]);
    const out: number[][] = [];
    let i = 0;
    if (layout === "cover" && idx.length) out.push([idx[i++]]);
    for (; i < idx.length; i += 2) out.push(idx.slice(i, i + 2));
    return out;
  }, [pages, layout]);

  const pageEls = () => Array.from(scrollRef.current?.querySelectorAll<HTMLElement>("[data-page]") ?? []);

  const goTo = (i: number, remember = false) => {
    const idx = clamp(i, 0, total - 1);
    if (remember && idx !== page) {
      back.current.push(page);
      fwd.current = [];
      bump((n) => n + 1);
    }
    setPage(idx);
    setPageInput(String(idx + 1));
    const sc = scrollRef.current;
    const el = pageEls()[idx];
    if (!sc || !el) return;
    sc.scrollTop += (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / winScale(sc) - 14;
  };
  const goRef = useRef(goTo);
  goRef.current = goTo;
  const pageRefNow = useRef(page);
  pageRefNow.current = page;

  // Keep the current page in place when the zoom or layout changes.
  const firstK = useRef(true);
  useLayoutEffect(() => {
    if (firstK.current) {
      firstK.current = false;
      return;
    }
    goRef.current(pageRefNow.current);
  }, [k, layout]);


  const onScroll = () => {
    if (noteOpen) setNoteOpen(null);
    const sc = scrollRef.current;
    if (!sc) return;
    const top = sc.getBoundingClientRect().top;
    const s = winScale(sc);
    let cur = 0;
    pageEls().forEach((el, i) => {
      if ((el.getBoundingClientRect().top - top) / s < sc.clientHeight * 0.4) cur = i;
    });
    if (cur !== page) {
      setPage(cur);
      setPageInput(String(cur + 1));
    }
  };

  // Thumbnail of the current page stays in view.
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>(`[data-thumb="${page}"]`);
    if (!rail || !el) return;
    const t = el.offsetTop;
    if (t < rail.scrollTop || t + el.offsetHeight > rail.scrollTop + rail.clientHeight) rail.scrollTo({ top: t - rail.clientHeight / 2 + el.offsetHeight / 2 });
  }, [page]);

  // ---- find: search the text on the pages ----------------------------------------
  useLayoutEffect(() => {
    const sc = scrollRef.current;
    const q = query.trim();
    if (!findOpen || !q || !sc) {
      setHits((h) => (h.length ? [] : h));
      return;
    }
    const out: Hit[] = [];
    const needle = matchCase ? q : q.toLowerCase();
    for (const content of Array.from(sc.querySelectorAll<HTMLElement>("[data-page-content]"))) {
      const key = content.dataset.pageContent!;
      const p = pages.find((x) => x.key === key);
      const box = content.closest<HTMLElement>("[data-page]");
      if (!p || !box) continue;
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const raw = n.textContent ?? "";
        const hay = matchCase ? raw : raw.toLowerCase();
        let from = 0;
        for (let at = hay.indexOf(needle, from); at >= 0; at = hay.indexOf(needle, from)) {
          from = at + needle.length;
          if (wholeWord && (/\w/.test(raw[at - 1] ?? "") || /\w/.test(raw[at + needle.length] ?? ""))) continue;
          const range = document.createRange();
          range.setStart(n, at);
          range.setEnd(n, at + needle.length);
          const rects = Array.from(range.getClientRects()).map((r) => {
            const a = pagePoint(box, p, r.left, r.top);
            const b = pagePoint(box, p, r.right, r.bottom);
            return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
          });
          if (rects.length) out.push({ pageKey: key, rects });
        }
      }
    }
    setHits(out);
    setHitIdx(out.length ? 0 : -1);
  }, [findOpen, query, matchCase, wholeWord, snap, pages]);

  const revealHit = (i: number) => {
    const h = hits[i];
    const sc = scrollRef.current;
    if (!h || !sc) return;
    const pi = pages.findIndex((p) => p.key === h.pageKey);
    const el = pageEls()[pi];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const y = r.top + (h.rects[0].y / shown(pages[pi]).h) * r.height;
    sc.scrollTop += (y - sc.getBoundingClientRect().top) / winScale(sc) - sc.clientHeight / 3;
    setPage(pi);
    setPageInput(String(pi + 1));
  };
  const stepHit = (d: number) => {
    if (!hits.length) return;
    const i = (hitIdx + d + hits.length) % hits.length;
    setHitIdx(i);
    revealHit(i);
  };
  const openFind = () => {
    setFindOpen(true);
    setTimeout(() => findInput.current?.focus(), 0);
  };

  // ---- page operations ---------------------------------------------------------
  const targets = selected.size ? selected : new Set(pages[page] ? [pages[page].key] : []);
  const n = targets.size;
  const plural = n > 1 ? `${n} pages` : "page";
  const insertIndex = () => {
    let last = -1;
    pages.forEach((p, i) => targets.has(p.key) && (last = i));
    return last < 0 ? pages.length : last + 1;
  };
  const others = api.docs.filter((d) => d.id !== doc.id);

  const ops = {
    rotate: (d: number) => exec((s) => ({ ...s, pages: s.pages.map((p) => (targets.has(p.key) ? { ...p, rot: (((p.rot + d) % 360) + 360) % 360 } : p)) })),
    del: () => {
      if (n >= total) return;
      exec((s) => ({ ...s, pages: s.pages.filter((p) => !targets.has(p.key)) }));
      setSelected(new Set());
    },
    blank: () => {
      const cur = pages[page] ?? pages[0];
      const np = pageOf("blank", cur?.w, cur?.h);
      const at = insertIndex();
      exec((s) => ({ ...s, pages: [...s.pages.slice(0, at), np, ...s.pages.slice(at)] }));
    },
    duplicate: () => {
      const keys = pages.filter((p) => targets.has(p.key)).map((p) => p.key);
      const add = clonePages(snap, keys);
      const at = insertIndex();
      exec((s) => mergeInto(s, add, at));
    },
    reverse: () => {
      if (selected.size > 1) {
        const idx = pages.map((p, i) => (selected.has(p.key) ? i : -1)).filter((i) => i >= 0);
        const rev = idx.map((i) => pages[i]).reverse();
        exec((s) => ({ ...s, pages: s.pages.map((p, i) => (idx.includes(i) ? rev[idx.indexOf(i)] : p)) }));
      } else exec((s) => ({ ...s, pages: [...s.pages].reverse() }));
    },
    move: (keys: Set<string>, to: number) =>
      exec((s) => {
        const moving = s.pages.filter((p) => keys.has(p.key));
        const before = s.pages.slice(0, to).filter((p) => !keys.has(p.key)).length;
        const rest = s.pages.filter((p) => !keys.has(p.key));
        const next = [...rest.slice(0, before), ...moving, ...rest.slice(before)];
        return next.every((p, i) => p === s.pages[i]) ? s : { ...s, pages: next };
      }),
    extract: () => notify(`In the app, this saves the ${plural === "page" ? "page" : plural} as a new PDF and opens it.`),
    insertFile: () => notify("In the app, this adds pages from a PDF or picture on your PC after this page."),
    copyToTab: (toId: string, keys: Set<string>) => {
      const to = api.docs.find((d) => d.id === toId);
      if (!to) return;
      const add = clonePages(snap, pages.filter((p) => keys.has(p.key)).map((p) => p.key));
      api.updateDoc(toId, (d) => ({ ...d, snap: mergeInto(d.snap, add, d.snap.pages.length), undo: [...d.undo, d.snap], redo: [], dirty: true }));
      api.toast(`Copied ${add.pages.length} page${add.pages.length > 1 ? "s" : ""} to ${to.title}`);
    },
    insertFromTab: (fromId: string) => {
      const from = api.docs.find((d) => d.id === fromId);
      if (!from) return;
      const add = clonePages(from.snap, from.snap.pages.map((p) => p.key));
      const at = insertIndex();
      exec((s) => mergeInto(s, add, at));
    },
  };

  const step = (f: number) => setZoom({ mode: "custom", value: clamp(Math.round(k * f * 100) / 100, 0.25, 4) });

  // ---- tools --------------------------------------------------------------------
  const setTool = (t: Tool) => {
    setToolState(t);
    setSel(null);
    setEditingId(null);
    setRunEditing(null);
    setTeSel(null);
    setCropDraft(null);
  };
  const chooseTool = (t: Tool) => {
    if (t === "image") {
      notify("In the app, this opens a picture from your PC. Here's a sample logo to place.");
      setTool("image");
      return;
    }
    if (t === "redact" && !pro) return paywall("redact");
    if (t === "edittext") {
      if (!pro) return paywall("editText");
      if (!api.flags.current.editNotice) setDialog("notice");
    }
    setTool(t);
  };
  const pickMark = (m: Ov["mark"]) => {
    setTool("mark");
    setStyleState((s) => ({ ...s, mark: m ?? "check" }));
  };

  const selObjs: Ov[] = sel ? (snap.overlays[sel.pageKey] ?? []).filter((o) => sel.ids.includes(o.id)) : [];

  const setStyle = (p: Partial<ToolStyle>) => {
    setStyleState((s) => ({ ...s, ...p }));
    if (sel && sel.ids.length) {
      const ids = sel.ids;
      exec(setOv(sel.pageKey, (list) => list.map((o) => (ids.includes(o.id) ? styleObject(o, p) : o))), `style:${ids.join()}:${Object.keys(p).join()}`);
    }
  };

  const deleteSelected = () => {
    if (teSel && snap.edits[teSel]) {
      const key = teSel;
      exec((s) => {
        const edits = { ...s.edits };
        delete edits[key];
        return { ...s, edits };
      });
      setTeSel(null);
      return true;
    }
    if (!sel) return false;
    const ids = sel.ids;
    exec(setOv(sel.pageKey, (list) => list.filter((o) => !ids.includes(o.id) || o.kind === "redact" && o.applied)));
    setSel(null);
    setEditingId(null);
    return true;
  };

  const place = (pageKey: string, o: Ov, selectIt = true) => {
    exec(setOv(pageKey, (list) => [...list, o]));
    if (selectIt) setSel({ pageKey, ids: [o.id] });
  };

  const openNote = (pageKey: string, o: Ov) => {
    const p = pages.find((x) => x.key === pageKey);
    const box = scrollRef.current?.querySelector<HTMLElement>(`[data-page="${pageKey}"]`);
    if (!p || !box || !root) return;
    const r = box.getBoundingClientRect();
    const s = r.width / shown(p).w;
    const b = cropBox(p);
    const pt = toLocal(root, r.left + (o.x - b.x + o.w + 8) * s, r.top + (o.y - b.y) * s);
    setNoteOpen({ pageKey, id: o.id, left: clamp(pt.x, 8, root.offsetWidth - 262), top: clamp(pt.y, 8, root.offsetHeight - 200) });
  };

  /** Pointer down on a page while a creating tool is active. */
  const onPageDown = (e: React.PointerEvent, p: PageRef) => {
    if (e.button !== 0) return;
    const box = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-page]");
    if (!box) return;
    e.preventDefault();
    const at = (x: number, y: number) => pagePoint(box, p, x, y);
    const start = at(e.clientX, e.clientY);
    const id = newKey("ov");

    if (tool === "text") {
      if (editingId) {
        setEditingId(null);
        return;
      }
      let w = 0;
      drag(
        (ev) => {
          const q = at(ev.clientX, ev.clientY);
          w = q.x - start.x;
          if (w > 12) setGhost({ pageKey: p.key, r: { x: start.x, y: start.y - style.size * 0.7, w, h: style.size * 1.3 + 4 } });
        },
        () => {
          setGhost(null);
          const o: Ov = {
            id,
            kind: "text",
            x: start.x,
            y: start.y - style.size * 0.7,
            w: w > 12 ? w : 200,
            h: style.size * 1.25 + 6,
            text: "",
            font: style.font,
            size: style.size,
            bold: style.bold,
            italic: style.italic,
            underline: style.underline,
            strike: style.strike,
            align: style.align,
            color: style.color,
            bg: style.textBg,
            border: style.textBorder,
            opacity: style.opacity,
          };
          place(p.key, o);
          setEditingId(id);
        },
      );
      return;
    }
    if (tool === "mark") {
      const m = style.markSize;
      place(p.key, { id, kind: "mark", x: start.x - m / 2, y: start.y - m / 2, w: m, h: m, mark: style.mark, color: style.markColor, width: style.strokeWidth, opacity: style.opacity }, false);
      return;
    }
    if (tool === "sign") {
      const sig = api.sigs.find((s) => s.id === api.activeSig) ?? api.sigs[0];
      if (!sig) {
        api.toast("No saved signatures yet. Create one in Signatures.");
        return;
      }
      const w = 150;
      const h = Math.min(80, w / sig.ratio);
      place(p.key, { id, kind: "sign", x: start.x - w / 2, y: start.y - h / 2, w, h, src: sig.url, opacity: 1 });
      return;
    }
    if (tool === "image") {
      place(p.key, { id, kind: "image", x: start.x - 60, y: start.y - 30, w: 120, h: 60, opacity: 1 });
      setToolState("select");
      return;
    }
    if (tool === "stamp") {
      const st = style.stamp;
      const w = Math.max(st.label.length, (st.sub ?? "").length * 0.7) * 8.4 + 22;
      const h = st.sub ? 32 : 24;
      place(p.key, { id, kind: "stamp", x: start.x - w / 2, y: start.y - h / 2, w, h, label: st.label, sub: st.sub, color: st.color });
      return;
    }
    if (tool === "note") {
      const o: Ov = { id, kind: "note", x: start.x - 10, y: start.y - 10, w: 20, h: 20, color: style.noteColor, comment: { text: "", time: Date.now() } };
      place(p.key, o);
      setTimeout(() => openNote(p.key, o), 0);
      return;
    }
    if (tool === "ink") {
      const pts = [start.x, start.y];
      setInkDraft({ pageKey: p.key, pts: [...pts] });
      drag(
        (ev) => {
          const q = at(ev.clientX, ev.clientY);
          pts.push(q.x, q.y);
          setInkDraft({ pageKey: p.key, pts: [...pts] });
        },
        () => {
          setInkDraft(null);
          if (pts.length < 4) return;
          const xs = pts.filter((_, i) => i % 2 === 0);
          const ys = pts.filter((_, i) => i % 2 === 1);
          const x0 = Math.min(...xs) - 1,
            y0 = Math.min(...ys) - 1;
          const w = Math.max(2, Math.max(...xs) - x0 + 1),
            h = Math.max(2, Math.max(...ys) - y0 + 1);
          const rel = pts.map((v, i) => (i % 2 === 0 ? (v - x0) / w : (v - y0) / h));
          place(p.key, { id, kind: "ink", x: x0, y: y0, w, h, pts: rel, color: style.color, width: style.strokeWidth, opacity: style.opacity }, false);
        },
      );
      return;
    }

    // Box tools: highlight, whiteout, shapes, redact, crop.
    let cur = start;
    drag(
      (ev) => {
        cur = at(ev.clientX, ev.clientY);
        const r = { x: Math.min(start.x, cur.x), y: Math.min(start.y, cur.y), w: Math.abs(cur.x - start.x), h: Math.abs(cur.y - start.y) };
        if (tool === "crop") setCropDraft({ pageKey: p.key, r });
        else setGhost({ pageKey: p.key, r });
      },
      () => {
        setGhost(null);
        const r = { x: Math.min(start.x, cur.x), y: Math.min(start.y, cur.y), w: Math.abs(cur.x - start.x), h: Math.abs(cur.y - start.y) };
        if (tool === "crop") {
          if (r.w < 20 || r.h < 20) setCropDraft(null);
          return;
        }
        if (r.w < 4 && r.h < 4) return;
        if (tool === "highlight") place(p.key, { id, kind: "highlight", ...r, color: style.highlightColor, opacity: style.highlightOpacity }, false);
        else if (tool === "whiteout") place(p.key, { id, kind: "whiteout", ...r, color: style.whiteoutColor });
        else if (tool === "redact") place(p.key, { id, kind: "redact", ...r }, false);
        else if (tool === "shape") {
          const kind = style.shape;
          const dir: [number, number, number, number] = [cur.x < start.x ? 1 : 0, cur.y < start.y ? 1 : 0, cur.x < start.x ? 0 : 1, cur.y < start.y ? 0 : 1];
          place(p.key, { id, kind, ...r, color: style.color, width: style.strokeWidth, opacity: style.opacity, fill: kind === "rect" || kind === "ellipse" ? style.fill : undefined, dir });
        }
      },
    );
  };

  /** Pointer down on an object (Select tool): select it and move it. */
  const onObjDown = (e: React.PointerEvent, p: PageRef, o: Ov) => {
    if (tool === "text" && o.kind === "text") {
      e.stopPropagation();
      setSel({ pageKey: p.key, ids: [o.id] });
      setEditingId(o.id);
      return;
    }
    if (tool !== "select" || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const box = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-page]");
    if (!box) return;
    let ids = sel && sel.pageKey === p.key && sel.ids.includes(o.id) ? sel.ids : [o.id];
    if (e.shiftKey && sel && sel.pageKey === p.key) ids = sel.ids.includes(o.id) ? sel.ids.filter((x) => x !== o.id) : [...sel.ids, o.id];
    setSel({ pageKey: p.key, ids });
    setTeSel(null);
    const start = pagePoint(box, p, e.clientX, e.clientY);
    const orig = new Map((snap.overlays[p.key] ?? []).filter((x) => ids.includes(x.id)).map((x) => [x.id, { x: x.x, y: x.y }]));
    const token = `move:${Date.now()}`;
    let moved = false;
    drag(
      (ev) => {
        const q = pagePoint(box, p, ev.clientX, ev.clientY);
        const dx = q.x - start.x,
          dy = q.y - start.y;
        if (!moved && Math.hypot(dx, dy) < 2) return;
        moved = true;
        exec(setOv(p.key, (list) => list.map((x) => (orig.has(x.id) ? { ...x, x: orig.get(x.id)!.x + dx, y: orig.get(x.id)!.y + dy } : x))), token);
      },
      () => {
        if (!moved && o.kind === "note") openNote(p.key, o);
      },
    );
  };

  const onHandle = (e: React.PointerEvent, p: PageRef, o: Ov, d: HandleDir) => {
    e.stopPropagation();
    e.preventDefault();
    const box = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-page]");
    if (!box) return;
    const start = pagePoint(box, p, e.clientX, e.clientY);
    const token = `resize:${Date.now()}`;
    const keepRatio = o.kind === "sign" || o.kind === "image" || o.kind === "mark";
    drag(
      (ev) => {
        const q = pagePoint(box, p, ev.clientX, ev.clientY);
        const dx = q.x - start.x,
          dy = q.y - start.y;
        let { x, y, w, h } = o;
        if (d.includes("e")) w = Math.max(6, o.w + dx);
        if (d.includes("s")) h = Math.max(6, o.h + dy);
        if (d.includes("w")) {
          w = Math.max(6, o.w - dx);
          x = o.x + o.w - w;
        }
        if (d.includes("n")) {
          h = Math.max(6, o.h - dy);
          y = o.y + o.h - h;
        }
        if (keepRatio && d.length === 2) {
          const r = o.w / o.h;
          h = w / r;
          if (d.includes("n")) y = o.y + o.h - h;
        }
        exec(setOv(p.key, (list) => list.map((x2) => (x2.id === o.id ? { ...x2, x, y, w, h } : x2))), token);
      },
      () => {},
    );
  };

  // ---- the PDF's own text + form fields ----------------------------------------
  const ctxFor = (p: PageRef): PageCtxValue => ({
    pageKey: p.key,
    live: true,
    editText: tool === "edittext",
    forms: tool === "select",
    edits: snap.edits,
    editing: runEditing,
    fields: snap.fields,
    onRun: (key) => {
      setRunEditing(key);
      setTeSel(key);
      setSel(null);
    },
    onCommit: (key, original, text) => {
      setRunEditing(null);
      if (text === null) return;
      const prev = snap.edits[key];
      if (!prev && text === original) return;
      exec((s) => ({ ...s, edits: { ...s.edits, [key]: { ...(s.edits[key] ?? { original }), text } } }));
    },
    onField: (key, v) => exec((s) => ({ ...s, fields: { ...s.fields, [key]: v } }), `field:${key}`),
  });

  // ---- save -----------------------------------------------------------------------
  const save = () => {
    notify(pro ? "In the app, this saves your PDF." : "In the app, this saves your PDF. Free saves add a small RevinHi watermark.");
    api.updateDoc(doc.id, (d) => ({ ...d, dirty: false }));
  };
  const [flatten, setFlatten] = useState(false);
  const [flattenAnnots, setFlattenAnnots] = useState(false);
  const [protect, setProtect] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // ---- menus ----------------------------------------------------------------------
  const openMenu = (kind: "page" | "view" | "doc", x: number, y: number) => {
    if (!root) return;
    const pt = toLocal(root, x, y);
    setMenu({ kind, x: pt.x, y: pt.y });
  };
  const redactMarks = Object.values(snap.overlays).flat().filter((o) => o.kind === "redact" && !o.applied).length;
  const redactPages = Object.values(snap.overlays).filter((l) => l.some((o) => o.kind === "redact" && !o.applied)).length;
  const proOr = (f: Feature, run: () => void) => (pro ? run() : paywall(f));

  const docItems: MenuEntry[] = [
    { label: "Page numbers & watermark…", hint: pro ? undefined : "Pro", onClick: () => proOr("decorations", () => setDialog("deco")) },
    { label: "Document properties…", onClick: () => setDialog("meta") },
    "sep",
    { label: "Make searchable (OCR)…", hint: pro ? undefined : "Pro", onClick: () => proOr("ocr", () => api.toast("Every page already has text, so there was nothing to recognize.")) },
    "sep",
    {
      label: "Convert to grayscale…",
      hint: pro ? undefined : "Pro",
      onClick: () =>
        proOr("cleanup", () => {
          exec((s) => ({ ...s, gray: !s.gray }));
          api.toast(snap.gray ? "Colors are back." : "Converted to grayscale.");
        }),
    },
    {
      label: "Remove blank pages…",
      hint: pro ? undefined : "Pro",
      onClick: () =>
        proOr("cleanup", () => {
          const blanks = pages.filter((p) => p.kind === "blank" && !(snap.overlays[p.key] ?? []).length);
          if (!blanks.length || blanks.length === total) return api.toast("No blank pages found.");
          const keys = new Set(blanks.map((p) => p.key));
          exec((s) => ({ ...s, pages: s.pages.filter((p) => !keys.has(p.key)) }));
          api.toast(`Removed ${blanks.length} blank page${blanks.length > 1 ? "s" : ""}.`);
        }),
    },
    "sep",
    {
      label: redactPages ? `Apply redactions (${redactPages} page${redactPages > 1 ? "s" : ""})…` : "Apply redactions…",
      hint: pro ? undefined : "Pro",
      onClick: () => proOr("redact", () => (redactMarks ? setDialog("redact") : api.toast("Nothing is marked for redaction yet. Use the Redact tool first."))),
    },
  ];

  const pageItems: MenuEntry[] = [
    { label: "Rotate left", onClick: () => ops.rotate(-90) },
    { label: "Rotate right", onClick: () => ops.rotate(90) },
    "sep",
    { label: `Extract ${plural} to new PDF…`, onClick: ops.extract },
    { label: "Insert blank page after", onClick: ops.blank },
    { label: "Insert pages from file after…", onClick: ops.insertFile },
    ...others.map((d): MenuEntry => ({ label: `Insert all pages of “${d.title}” after`, onClick: () => ops.insertFromTab(d.id) })),
    { label: `Duplicate ${plural}`, onClick: ops.duplicate },
    { label: selected.size > 1 ? `Reverse order of ${selected.size} pages` : "Reverse page order", onClick: ops.reverse },
    { label: "Remove crop", disabled: !pages.some((p) => targets.has(p.key) && p.crop), onClick: () => exec((s) => ({ ...s, pages: s.pages.map((p) => (targets.has(p.key) ? { ...p, crop: null } : p)) })) },
    "sep",
    ...others.map((d): MenuEntry => ({ label: `Copy ${plural} to “${d.title}”`, onClick: () => ops.copyToTab(d.id, new Set(targets)) })),
    { label: "Make searchable (OCR)…", onClick: () => proOr("ocr", () => api.toast("Every page already has text, so there was nothing to recognize.")) },
    "sep",
    { label: `Delete ${plural}`, hint: "Del", danger: true, disabled: n >= total, onClick: ops.del },
  ];

  const viewItems: MenuEntry[] = [
    { label: "Single page", checked: layout === "single", onClick: () => setLayout("single") },
    { label: "Two pages", checked: layout === "spread", onClick: () => setLayout("spread") },
    { label: "Two pages, cover first", checked: layout === "cover", onClick: () => setLayout("cover") },
    "sep",
    { label: "Fit width", hint: "Ctrl+0", checked: zoom.mode === "width", onClick: () => setZoom({ mode: "width", value: k }) },
    { label: "Fit page", hint: "Ctrl+2", checked: zoom.mode === "page", onClick: () => setZoom({ mode: "page", value: k }) },
    { label: "Actual size", hint: "Ctrl+1", checked: zoom.mode === "custom" && zoom.value === 1, onClick: () => setZoom({ mode: "custom", value: 1 }) },
    "sep",
    { label: "Night reading", checked: night, onClick: () => setNight(!night) },
    { label: "Snap to guides", hint: "Ctrl+;", checked: snapOn, onClick: () => setSnapOn(!snapOn) },
    { label: "Present full screen", hint: "F5", onClick: () => setPresenting(true) },
  ];

  // ---- keyboard ----------------------------------------------------------------------
  api.keyRef.current = (e: React.KeyboardEvent) => {
    if (presenting || dialog) return;
    const kk = e.key.toLowerCase();
    const t = e.target as HTMLElement;
    const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
    if (e.ctrlKey) {
      if (kk === "f") openFind();
      else if (kk === "s") save();
      else if (kk === "p") notify("In the app, this opens Print with your printers and page options.");
      else if (kk === "=" || kk === "+") step(1.2);
      else if (kk === "-") step(1 / 1.2);
      else if (kk === "0") setZoom({ mode: "width", value: k });
      else if (kk === "2") setZoom({ mode: "page", value: k });
      else if (kk === "1") setZoom({ mode: "custom", value: 1 });
      else if (typing) return;
      else if (kk === "z" && !e.shiftKey) undo();
      else if (kk === "y" || (kk === "z" && e.shiftKey)) redo();
      else if (kk === "a") setSelected(new Set(pages.map((p) => p.key)));
      else return;
      e.preventDefault();
      return;
    }
    if (e.key === "F5") {
      e.preventDefault();
      setPresenting(true);
      return;
    }
    if (typing) return;
    if (kk.startsWith("arrow") && sel) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      const dx = kk === "arrowleft" ? -d : kk === "arrowright" ? d : 0;
      const dy = kk === "arrowup" ? -d : kk === "arrowdown" ? d : 0;
      const ids = sel.ids;
      exec(setOv(sel.pageKey, (l) => l.map((o) => (ids.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o))), `nudge:${ids.join()}`);
      return;
    }
    if (kk === "delete" || kk === "backspace") {
      e.preventDefault();
      if (!deleteSelected() && kk === "delete") ops.del();
    } else if (kk === "escape") {
      if (findOpen) setFindOpen(false);
      else if (sel) setSel(null);
      else if (tool !== "select") setTool("select");
      else setSelected(new Set());
    } else if (kk === "home") goTo(0);
    else if (kk === "end") goTo(total - 1);
    else if (!e.altKey && TOOL_KEYS[kk]) chooseTool(TOOL_KEYS[kk]);
    else if (!e.altKey) {
      const m = MARKS.find((x) => x.key === kk);
      if (m) pickMark(m.id);
    }
  };
  useEffect(() => {
    const ref = api.keyRef;
    return () => {
      ref.current = null;
    };
  }, [api.keyRef]);

  const comments = pages.flatMap((p, i) => (snap.overlays[p.key] ?? []).filter((o) => o.kind === "note").map((o) => ({ p, i, o })));
  const noteObj = noteOpen ? (snap.overlays[noteOpen.pageKey] ?? []).find((o) => o.id === noteOpen.id) : undefined;
  const creating = !["select", "edittext"].includes(tool);
  const teEdit = teSel ? snap.edits[teSel] ?? null : null;

  return (
    <div className={c("workspace")}>
      <div className={c("editor-toolbar")}>
        <div className={c("toolbar-group")}>
          <IconBtn icon={<IconUndo size={12} />} title="Undo (Ctrl+Z)" disabled={!doc.undo.length} onClick={undo} />
          <IconBtn icon={<IconRedo size={12} />} title="Redo (Ctrl+Y)" disabled={!doc.redo.length} onClick={redo} />
        </div>
        <span className={c("toolbar-sep")} />
        <div className={c("toolbar-group")}>
          <IconBtn icon={<IconRotate size={12} />} className="flip" title="Rotate left" onClick={() => ops.rotate(-90)} />
          <IconBtn icon={<IconRotate size={12} />} title="Rotate right" onClick={() => ops.rotate(90)} />
          <IconBtn icon={<IconTrash size={12} />} title={`Delete ${plural} (Del)`} disabled={n >= total} onClick={ops.del} />
          <IconBtn icon={<IconAdd size={12} />} title="Insert blank page" onClick={ops.blank} />
          <IconBtn icon={<IconInsertFile size={12} />} title="Insert pages from file (merge)" onClick={ops.insertFile} />
          <IconBtn icon={<IconExtract size={12} />} title={`Extract ${plural} to a new PDF`} onClick={ops.extract} />
          {selected.size > 1 && <span className={c("sel-count")}>{selected.size} selected</span>}
        </div>
        <span className={c("toolbar-sep")} />
        <div className={c("toolbar-group nav-btns")}>
          <IconBtn
            icon={<IconBack size={12} />}
            title="Back (Alt+Left)"
            disabled={!back.current.length}
            onClick={() => {
              const to = back.current.pop();
              if (to === undefined) return;
              fwd.current.push(page);
              goTo(to);
              bump((x) => x + 1);
            }}
          />
          <IconBtn
            icon={<IconForward size={12} />}
            title="Forward (Alt+Right)"
            disabled={!fwd.current.length}
            onClick={() => {
              const to = fwd.current.pop();
              if (to === undefined) return;
              back.current.push(page);
              goTo(to);
              bump((x) => x + 1);
            }}
          />
          <span className={c("toolbar-label")}>Page</span>
          <input
            title="Go to page (Ctrl+G)"
            className={c("text-input page-input")}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") goTo(parseInt(pageInput || "1", 10) - 1, true);
            }}
            onBlur={() => setPageInput(String(page + 1))}
          />
          <span className={c("text-muted page-total")}>/ {total}</span>
        </div>
        <span style={{ flex: 1 }} />
        <div className={c("toolbar-group")}>
          <IconBtn icon={<IconFind size={12} />} title="Find (Ctrl+F)" onClick={openFind} />
          <IconBtn icon={<IconPrint size={12} />} title="Print (Ctrl+P)" onClick={() => notify("In the app, this opens Print with your printers and page options.")} />
          <button className={c("btn btn-small btn-secondary zoom-mode")} title="Page numbers, watermark, properties, OCR, clean-up" onClick={(e) => openMenu("doc", e.currentTarget.getBoundingClientRect().left, e.currentTarget.getBoundingClientRect().bottom + 4)}>
            Document
          </button>
        </div>
        <span className={c("toolbar-sep")} />
        <div className={c("toolbar-group")}>
          <IconBtn icon={<IconMinus size={12} />} title="Zoom out (Ctrl -)" onClick={() => step(1 / 1.2)} />
          <span className={c("zoom-readout")}>{Math.round(k * 100)}%</span>
          <IconBtn icon={<IconAdd size={12} />} title="Zoom in (Ctrl +)" onClick={() => step(1.2)} />
          <button className={c("btn btn-small zoom-mode", zoom.mode === "width" ? "btn-primary" : "btn-secondary")} onClick={() => setZoom({ mode: "width", value: k })} title="Fit width (Ctrl+0)">
            Width
          </button>
          <button className={c("btn btn-small zoom-mode", zoom.mode === "page" ? "btn-primary" : "btn-secondary")} onClick={() => setZoom({ mode: "page", value: k })} title="Fit page (Ctrl+2)">
            Page
          </button>
          <button className={c("btn btn-small btn-secondary zoom-mode")} title="Page layout, night reading, presentation" onClick={(e) => openMenu("view", e.currentTarget.getBoundingClientRect().left, e.currentTarget.getBoundingClientRect().bottom + 4)}>
            View
          </button>
          <button
            className={c("btn btn-small zoom-mode", snapOn ? "btn-primary" : "btn-secondary")}
            onClick={() => setSnapOn(!snapOn)}
            title={snapOn ? "Snapping on: moved items line up with page and object edges (Ctrl+; to turn off, or hold Alt while dragging)" : "Snapping off: place items freely (Ctrl+; to turn on)"}
          >
            Snap
          </button>
        </div>
        <span className={c("toolbar-sep")} />
        <div className={c("toolbar-group")}>
          <button className={c("btn btn-small btn-primary")} onClick={save} title="Save (Ctrl+S)">
            Save
          </button>
          <button className={c("btn btn-small btn-secondary")} onClick={() => setDialog("saveas")} title="Save as (Ctrl+Shift+S)">
            Save as
          </button>
        </div>
      </div>

      <div className={c("tool-row")}>
        {TOOLS.map((t) => (
          <button key={t.id} type="button" className={c("tool-btn", tool === t.id && "on")} title={t.title} onClick={() => chooseTool(t.id)}>
            {t.icon}
            {t.label}
          </button>
        ))}
        <span className={c("tool-sep")} />
        <span className={c("tool-group-label")}>Fill &amp; Sign</span>
        {MARKS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={c("tool-btn tool-mark", tool === "mark" && style.mark === m.id && "on")}
            title={`${m.title} (${m.key.toUpperCase()}) — click a box or a line; fits itself to checkboxes and text`}
            onClick={() => pickMark(m.id)}
          >
            <span className={c("mark-glyph")}>{m.glyph}</span>
          </button>
        ))}
      </div>

      <div className={c("workspace-body")}>
        <div className={c("rail")}>
          <div className={c("rail-tabs")}>
            <button type="button" className={c("rail-tab", railTab === "pages" && "on")} onClick={() => setRailTab("pages")}>
              Pages
            </button>
            <button type="button" className={c("rail-tab", railTab === "outline" && "on")} onClick={() => setRailTab("outline")}>
              Bookmarks
            </button>
          </div>
          {railTab === "pages" ? (
            <ThumbRail
              railRef={railRef}
              root={root}
              doc={doc}
              current={page}
              selected={selected}
              onSelect={setSelected}
              onNavigate={(i) => goTo(i)}
              onMove={ops.move}
              onDropToTab={(id, keys) => ops.copyToTab(id, keys)}
              onMenu={(x, y) => openMenu("page", x, y)}
            />
          ) : (
            <Outline outline={doc.outline} onPick={(i) => goTo(i, true)} />
          )}
        </div>

        <div
          className={c("viewer-wrap")}
          onPointerDown={(e) => {
            const t = e.target as HTMLElement;
            if (!t.closest("[class*='ov-obj']") && !t.closest("[class*='find-bar']") && !t.closest("[class*='crop-bar']") && sel && !editingId) setSel(null);
          }}
        >
          <div ref={scrollRef} className={c("viewer-scroll", night && "night")} onScroll={onScroll}>
            <div className={c("viewer-pages")}>
              {rows.map((row) => (
                <div key={row.map((i) => pages[i].key).join()} className={c("viewer-row")}>
                  {row.map((i) => {
                    const p = pages[i];
                    const list = snap.overlays[p.key] ?? [];
                    const b = cropBox(p);
                    return (
                      <PageView key={p.key} pageRef={p} k={k} ctx={ctxFor(p)} gray={snap.gray} main label={`Page ${i + 1}`}>
                        <div className={c("ov-root", creating && "creating", `tool-${tool}`)} onPointerDown={creating ? (e) => onPageDown(e, p) : undefined}>
                          {hits.map((h, hi) =>
                            h.pageKey === p.key ? h.rects.map((r, ri) => <div key={`${hi}-${ri}`} className={c("find-hit", hi === hitIdx && "current")} style={{ left: r.x - 1, top: r.y - 1, width: r.w + 2, height: r.h + 2 }} />) : null,
                          )}
                          {list.map((o) => (
                            <OvView
                              key={o.id}
                              o={o}
                              selected={!!sel && sel.pageKey === p.key && sel.ids.includes(o.id)}
                              single={!!sel && sel.ids.length === 1}
                              editing={editingId === o.id}
                              onDown={(e) => onObjDown(e, p, o)}
                              onHandle={(e, d) => onHandle(e, p, o, d)}
                              onDouble={() => {
                                if (o.kind === "text") {
                                  setSel({ pageKey: p.key, ids: [o.id] });
                                  setEditingId(o.id);
                                }
                              }}
                              onText={(v, h) => exec(setOv(p.key, (l) => l.map((x) => (x.id === o.id ? { ...x, text: v, h: Math.max(h, (x.size ?? 12) * 1.25 + 6) } : x))), `type:${o.id}`)}
                              onTextDone={() => {
                                setEditingId(null);
                                const cur = (snap.overlays[p.key] ?? []).find((x) => x.id === o.id);
                                if (cur && !cur.text?.trim()) {
                                  exec(setOv(p.key, (l) => l.filter((x) => x.id !== o.id)));
                                  setSel(null);
                                }
                              }}
                            />
                          ))}
                          {ghost?.pageKey === p.key && <div className={c("ov-ghost")} style={{ left: ghost.r.x, top: ghost.r.y, width: ghost.r.w, height: ghost.r.h }} />}
                          {inkDraft?.pageKey === p.key && (
                            <svg className={c("ov-fill")} viewBox={`0 0 ${p.w} ${p.h}`} style={{ width: p.w, height: p.h }} aria-hidden="true">
                              <polyline points={inkDraft.pts.join(" ")} fill="none" stroke={style.color} strokeWidth={style.strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={style.opacity} />
                            </svg>
                          )}
                          {cropDraft?.pageKey === p.key && (
                            <>
                              <div className={c("crop-shade")} style={{ left: b.x, top: b.y, width: b.w, height: cropDraft.r.y - b.y }} />
                              <div className={c("crop-shade")} style={{ left: b.x, top: cropDraft.r.y + cropDraft.r.h, width: b.w, height: b.y + b.h - cropDraft.r.y - cropDraft.r.h }} />
                              <div className={c("crop-shade")} style={{ left: b.x, top: cropDraft.r.y, width: cropDraft.r.x - b.x, height: cropDraft.r.h }} />
                              <div className={c("crop-shade")} style={{ left: cropDraft.r.x + cropDraft.r.w, top: cropDraft.r.y, width: b.x + b.w - cropDraft.r.x - cropDraft.r.w, height: cropDraft.r.h }} />
                              <div className={c("crop-frame")} style={{ left: cropDraft.r.x, top: cropDraft.r.y, width: cropDraft.r.w, height: cropDraft.r.h }} />
                            </>
                          )}
                          {snap.numbers && (
                            <div style={{ position: "absolute", left: 0, width: p.w, top: p.h - 28, textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 9, color: "#444", pointerEvents: "none" }}>
                              Page {i + 1} of {total}
                            </div>
                          )}
                        </div>
                      </PageView>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {findOpen && (
            <div className={c("find-bar")} onPointerDown={(e) => e.stopPropagation()}>
              <span className={c("find-icon")}>
                <IconFind size={12} />
              </span>
              <input
                ref={findInput}
                className={c("find-input")}
                placeholder="Find in document"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    stepHit(e.shiftKey ? -1 : 1);
                  } else if (e.key === "Escape") setFindOpen(false);
                }}
              />
              <span className={c("find-count", query.trim() && !hits.length && "text-danger")}>{!query.trim() ? "" : hits.length ? `${hitIdx >= 0 ? hitIdx + 1 : "–"} of ${hits.length}` : "No results"}</span>
              <button type="button" className={c("chip find-opt", matchCase && "on")} title="Match case" onClick={() => setMatchCase(!matchCase)}>
                Aa
              </button>
              <button type="button" className={c("chip find-opt", wholeWord && "on")} title="Whole words only" onClick={() => setWholeWord(!wholeWord)}>
                Word
              </button>
              <button
                type="button"
                className={c("chip find-opt")}
                title="Mark every match for true redaction"
                disabled={!hits.length}
                onClick={() =>
                  proOr("redact", () => {
                    const byPage = new Map<string, Rect[]>();
                    for (const h of hits) byPage.set(h.pageKey, [...(byPage.get(h.pageKey) ?? []), ...h.rects]);
                    exec((s) => {
                      const overlays = { ...s.overlays };
                      for (const [pk, rs] of byPage) overlays[pk] = [...(overlays[pk] ?? []), ...rs.map((r) => ({ id: newKey("ov"), kind: "redact" as const, x: r.x - 1, y: r.y - 1, w: r.w + 2, h: r.h + 2 }))];
                      return { ...s, overlays };
                    });
                    api.toast(`Marked ${hits.length} match${hits.length > 1 ? "es" : ""} for redaction. Apply them from the Document menu.`);
                  })
                }
              >
                Redact all
              </button>
              <IconBtn icon={<IconUp />} title="Previous match (Shift+Enter / Shift+F3)" disabled={!hits.length} onClick={() => stepHit(-1)} />
              <IconBtn icon={<IconDown />} title="Next match (Enter / F3)" disabled={!hits.length} onClick={() => stepHit(1)} />
              <IconBtn icon={<IconClose />} title="Close (Esc)" onClick={() => setFindOpen(false)} />
            </div>
          )}

          {tool === "crop" && (
            <div className={c("crop-bar")} onPointerDown={(e) => e.stopPropagation()}>
              {cropDraft ? (
                <>
                  <span className={c("crop-bar-label")}>Crop to the box:</span>
                  {(
                    [
                      ["page", "This page", "btn-primary"],
                      ...(selected.size > 1 ? [["selected", `${selected.size} selected pages`, "btn-secondary"]] : []),
                      ["all", "All pages", "btn-secondary"],
                    ] as [string, string, string][]
                  ).map(([scope, label, cls]) => (
                    <button
                      key={scope}
                      className={c("btn btn-small", cls)}
                      onClick={() => {
                        const d = cropDraft;
                        const keys = scope === "all" ? new Set(pages.map((p) => p.key)) : scope === "selected" ? new Set(selected) : new Set([d.pageKey]);
                        exec((s) => ({ ...s, pages: s.pages.map((p) => (keys.has(p.key) ? { ...p, crop: d.r } : p)) }));
                        setCropDraft(null);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <button className={c("btn btn-small btn-secondary")} onClick={() => setCropDraft(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <span className={c("crop-bar-label")}>Drag a box over the area to keep. Same box can then go to selected or all pages.</span>
              )}
              {pages.some((p) => p.crop) && (
                <button className={c("btn btn-small btn-secondary")} title="Remove the crop from the current / selected pages" onClick={() => exec((s) => ({ ...s, pages: s.pages.map((p) => (targets.has(p.key) ? { ...p, crop: null } : p)) }))}>
                  Remove crop
                </button>
              )}
            </div>
          )}
        </div>

        <div className={c("side-panel")}>
          <div className={c("rail-tabs")}>
            <button type="button" className={c("rail-tab", sideTab === "props" && "on")} onClick={() => setSideTab("props")}>
              Properties
            </button>
            <button type="button" className={c("rail-tab", sideTab === "comments" && "on")} onClick={() => setSideTab("comments")}>
              Comments{comments.length ? ` (${comments.length})` : ""}
            </button>
          </div>
          {sideTab === "comments" ? (
            <aside className={c("props-panel")}>
              {!comments.length ? (
                <p className={c("prop-note")}>No comments yet. Use the Note tool (N) to pin a sticky note, or select text and choose Comment.</p>
              ) : (
                <div className={c("comments-list")}>
                  {comments.map(({ p, i, o }) => (
                    <div
                      key={o.id}
                      className={c("comment-item", sel?.ids.includes(o.id) && "on", o.comment?.resolved && "resolved")}
                      onClick={() => {
                        goTo(i, true);
                        setSel({ pageKey: p.key, ids: [o.id] });
                      }}
                    >
                      <div className={c("comment-item-head")}>
                        <span className={c("comment-dot")} style={{ background: o.color }} />
                        <span className={c("comment-author")}>You</span>
                        <span className={c("comment-time")}>p. {i + 1} · {TODAY}</span>
                      </div>
                      <div className={c("comment-body")}>{o.comment?.text || <span className={c("text-muted")}>(empty)</span>}</div>
                      <div className={c("comment-item-actions")} onClick={(e) => e.stopPropagation()}>
                        <label className={c("check-row comment-resolve")}>
                          <input
                            type="checkbox"
                            checked={!!o.comment?.resolved}
                            onChange={(e) => exec(setOv(p.key, (l) => l.map((x) => (x.id === o.id ? { ...x, comment: { ...(x.comment ?? { text: "", time: Date.now() }), resolved: e.target.checked } } : x))))}
                          />
                          <span>Resolved</span>
                        </label>
                        <button type="button" className={c("btn btn-small btn-secondary")} onClick={() => exec(setOv(p.key, (l) => l.filter((x) => x.id !== o.id)))}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          ) : tool === "edittext" && teSel ? (
            <TextEditProps
              edit={teEdit}
              onSet={(patch) => teSel && exec((s) => ({ ...s, edits: { ...s.edits, [teSel]: { ...s.edits[teSel], ...patch } } }), `te:${teSel}:${Object.keys(patch).join()}`)}
              onRevert={() => {
                const key = teSel;
                exec((s) => {
                  const edits = { ...s.edits };
                  delete edits[key];
                  return { ...s, edits };
                });
                setTeSel(null);
              }}
            />
          ) : (
            <ObjectProps
              tool={tool}
              style={style}
              sel={selObjs}
              setStyle={setStyle}
              onDelete={() => deleteSelected()}
              onRotate={(deg) => {
                const o = selObjs[0];
                if (o && sel) exec(setOv(sel.pageKey, (l) => l.map((x) => (x.id === o.id ? { ...x, rot: (deg + 360) % 360 } : x))), `rot:${o.id}`);
              }}
              sigs={api.sigs}
              activeSig={api.activeSig}
              setActiveSig={api.setActiveSig}
              pro={pro}
              onCustomStamp={() => (pro ? api.toast("Type the stamp's text first.") : paywall("customStamps"))}
            />
          )}
        </div>
      </div>

      {/* ---- floating bits, drawn over the whole window ---- */}
      <Portal root={root}>
        {menu && (
          <ContextMenu x={menu.x} y={menu.y} items={menu.kind === "page" ? pageItems : menu.kind === "view" ? viewItems : docItems} onClose={() => setMenu(null)} />
        )}

        {noteOpen && noteObj && (
          <div className={c("comment-pop")} style={{ left: noteOpen.left, top: noteOpen.top }} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className={c("comment-head")}>
              <span className={c("comment-author")}>You</span>
              <span className={c("comment-time")}>{TODAY}</span>
            </div>
            <textarea
              autoFocus={!noteObj.comment?.text}
              className={c("text-input comment-text")}
              placeholder="Write a comment…"
              defaultValue={noteObj.comment?.text}
              onKeyDown={(e) => e.key === "Escape" && setNoteOpen(null)}
              onChange={(e) => {
                const v = e.target.value;
                exec(setOv(noteOpen.pageKey, (l) => l.map((x) => (x.id === noteOpen.id ? { ...x, comment: { ...(x.comment ?? { time: Date.now() }), text: v, time: Date.now() } } : x))), `note:${noteOpen.id}`);
              }}
            />
            <div className={c("comment-actions")}>
              <label className={c("check-row comment-resolve")}>
                <input
                  type="checkbox"
                  checked={!!noteObj.comment?.resolved}
                  onChange={(e) => exec(setOv(noteOpen.pageKey, (l) => l.map((x) => (x.id === noteOpen.id ? { ...x, comment: { ...(x.comment ?? { text: "", time: Date.now() }), resolved: e.target.checked } } : x))))}
                />
                <span>Resolved</span>
              </label>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className={c("btn btn-small btn-danger")}
                onClick={() => {
                  exec(setOv(noteOpen.pageKey, (l) => l.filter((x) => x.id !== noteOpen.id)));
                  setNoteOpen(null);
                  setSel(null);
                }}
              >
                Delete
              </button>
              <button type="button" className={c("btn btn-small btn-secondary")} onClick={() => setNoteOpen(null)}>
                Close
              </button>
            </div>
          </div>
        )}

        {presenting && <Presentation doc={doc} start={page} night={night} w={root?.clientWidth ?? 1200} h={root?.clientHeight ?? 800} onExit={() => setPresenting(false)} />}

        {dialog === "notice" && (
          <Modal
            title="Editing existing text"
            onCancel={() => setDialog(null)}
            actions={
              <button
                className={c("btn btn-primary")}
                onClick={() => {
                  api.flags.current.editNotice = true;
                  setDialog(null);
                }}
              >
                Got it
              </button>
            }
          >
            <p className={c("modal-copy")}>
              Click any line of text to change it. <b>Edited text covers the original; it isn&apos;t secure redaction.</b> The original words are still in the file underneath, so don&apos;t use this to hide sensitive information.
            </p>
          </Modal>
        )}

        {dialog === "saveas" && (
          <Modal
            title="Save as"
            onCancel={() => setDialog(null)}
            actions={
              <>
                <button
                  className={c("btn btn-primary")}
                  disabled={protect && (!pw || pw !== pw2)}
                  onClick={() => {
                    if (protect && !pro) return paywall("protect");
                    if (flattenAnnots && !pro) return paywall("cleanup");
                    setDialog(null);
                    setPw("");
                    setPw2("");
                    notify("In the app, Windows asks where to save the new PDF.");
                    api.updateDoc(doc.id, (d) => ({ ...d, dirty: false }));
                  }}
                >
                  Choose location…
                </button>
                <button className={c("btn btn-secondary")} onClick={() => setDialog(null)}>
                  Cancel
                </button>
              </>
            }
          >
            {pages.some((p) => p.kind === "sa2") && (
              <label className={c("check-row")}>
                <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
                <span>
                  <b>Flatten forms</b>
                  <span className={c("modal-copy")}> Bake the filled-in values into the page so they can&apos;t be edited any more.</span>
                </span>
              </label>
            )}
            <label className={c("check-row")}>
              <input type="checkbox" checked={flattenAnnots} onChange={(e) => setFlattenAnnots(e.target.checked)} />
              <span>
                <b>Flatten the PDF&apos;s own comments &amp; annotations</b>
                <span className={c("modal-copy")}> Draw notes, stamps and markup from other apps into the page, so every reader shows them the same.</span>
              </span>
            </label>
            <label className={c("check-row")}>
              <input type="checkbox" checked={protect} onChange={(e) => setProtect(e.target.checked)} />
              <span>
                <b>Protect with password</b>
                <span className={c("modal-copy")}> AES-256; the password is needed to open the file.</span>
              </span>
            </label>
            {protect && (
              <>
                <input className={c("text-input")} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
                <input className={c("text-input")} type="password" placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                {pw2 && pw !== pw2 && <span className={c("text-danger modal-copy")}>The passwords don&apos;t match.</span>}
              </>
            )}
          </Modal>
        )}

        {dialog === "meta" && <MetaDialog doc={doc} onClose={() => setDialog(null)} onApply={() => api.updateDoc(doc.id, (d) => ({ ...d, dirty: true }))} />}

        {dialog === "deco" && (
          <DecoDialog
            on={!!snap.numbers}
            onClose={() => setDialog(null)}
            onApply={(on) => {
              exec((s) => ({ ...s, numbers: on }));
              setDialog(null);
            }}
          />
        )}

        {dialog === "redact" && (
          <Modal
            title="Apply redactions"
            onCancel={() => setDialog(null)}
            actions={
              <>
                <button
                  className={c("btn btn-danger")}
                  onClick={() => {
                    exec((s) => {
                      const overlays: Record<string, Ov[]> = {};
                      for (const [kk, l] of Object.entries(s.overlays)) overlays[kk] = l.map((o) => (o.kind === "redact" ? { ...o, applied: true } : o));
                      return { ...s, overlays };
                    });
                    setDialog(null);
                  }}
                >
                  Apply
                </button>
                <button className={c("btn btn-secondary")} onClick={() => setDialog(null)}>
                  Cancel
                </button>
              </>
            }
          >
            <p className={c("modal-copy")}>
              Removes the text and images under <b>{redactMarks} mark{redactMarks > 1 ? "s" : ""}</b> on {redactPages} page{redactPages > 1 ? "s" : ""} for good, and fills the areas black.
            </p>
          </Modal>
        )}
      </Portal>
    </div>
  );
}

// ================================================================== page thumbnails

const THUMB_W = 112;

function ThumbRail({
  railRef,
  root,
  doc,
  current,
  selected,
  onSelect,
  onNavigate,
  onMove,
  onMenu,
  onDropToTab,
}: {
  railRef: React.RefObject<HTMLDivElement | null>;
  root: HTMLElement | null;
  doc: Doc;
  current: number;
  selected: Set<string>;
  onSelect(keys: Set<string>): void;
  onNavigate(i: number): void;
  onMove(keys: Set<string>, to: number): void;
  onMenu(x: number, y: number): void;
  onDropToTab(id: string, keys: Set<string>): void;
}) {
  const pages = doc.snap.pages;
  const anchor = useRef(0);
  const justDragged = useRef(false);
  const [dragState, setDrag] = useState<{ keys: Set<string>; x: number; y: number; lineTop: number } | null>(null);

  const click = (e: React.MouseEvent, i: number) => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    const key = pages[i].key;
    if (e.shiftKey) {
      const [a, b] = [Math.min(anchor.current, i), Math.max(anchor.current, i)];
      const range = pages.slice(a, b + 1).map((p) => p.key);
      onSelect(new Set(e.ctrlKey ? [...selected, ...range] : range));
    } else if (e.ctrlKey || e.metaKey) {
      const next = new Set(selected);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      anchor.current = i;
      onSelect(next);
    } else {
      anchor.current = i;
      onSelect(new Set([key]));
      onNavigate(i);
    }
  };

  const dropAt = (clientY: number) => {
    const rail = railRef.current!;
    const thumbs = Array.from(rail.querySelectorAll<HTMLElement>("[data-thumb]"));
    for (let i = 0; i < thumbs.length; i++) {
      const r = thumbs[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return { drop: i, lineTop: thumbs[i].offsetTop - 7 };
    }
    const last = thumbs[thumbs.length - 1];
    return { drop: thumbs.length, lineTop: last ? last.offsetTop + last.offsetHeight + 5 : 0 };
  };

  const pointerDown = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0 || e.shiftKey || e.ctrlKey) return;
    const sx = e.clientX,
      sy = e.clientY;
    const key = pages[i].key;
    let active = false;
    let keys = new Set<string>();
    let drop = i;
    drag(
      (ev) => {
        if (!active) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
          active = true;
          keys = selected.has(key) ? new Set(selected) : new Set([key]);
          if (!selected.has(key)) onSelect(keys);
        }
        const d = dropAt(ev.clientY);
        drop = d.drop;
        const pt = root ? toLocal(root, ev.clientX, ev.clientY) : { x: 0, y: 0 };
        setDrag({ keys, x: pt.x, y: pt.y, lineTop: d.lineTop });
        // Auto-scroll near the edges.
        const rail = railRef.current;
        if (rail) {
          const r = rail.getBoundingClientRect();
          if (ev.clientY < r.top + 30) rail.scrollTop -= 10;
          else if (ev.clientY > r.bottom - 30) rail.scrollTop += 10;
        }
      },
      (ev) => {
        if (active) {
          justDragged.current = true;
          setTimeout(() => (justDragged.current = false), 0);
          const hit = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
          const tab = hit?.closest<HTMLElement>("[data-doc-id]");
          if (tab?.dataset.docId && tab.dataset.docId !== doc.id) onDropToTab(tab.dataset.docId, keys);
          else onMove(keys, drop);
        }
        setDrag(null);
      },
    );
  };

  return (
    <div className={c("thumb-rail", dragState && "dragging")} ref={railRef}>
      {pages.map((p, i) => {
        const d = shown(p);
        const tk = THUMB_W / d.w;
        return (
          <button
            key={p.key}
            type="button"
            data-thumb={i}
            className={c("thumb", i === current && "current", selected.has(p.key) && "selected", dragState?.keys.has(p.key) && "drag-src")}
            onClick={(e) => click(e, i)}
            onPointerDown={(e) => pointerDown(e, i)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (!selected.has(p.key)) {
                anchor.current = i;
                onSelect(new Set([p.key]));
              }
              onMenu(e.clientX, e.clientY);
            }}
            title={`Page ${i + 1}`}
          >
            <PageView pageRef={p} k={tk} gray={doc.snap.gray} ctx={{ pageKey: p.key, live: false, editText: false, forms: false, edits: doc.snap.edits, editing: null, fields: doc.snap.fields }}>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {(doc.snap.overlays[p.key] ?? []).map((o) => (
                  <OvView key={o.id} o={o} selected={false} single={false} editing={false} onDown={() => {}} onHandle={() => {}} onDouble={() => {}} onText={() => {}} onTextDone={() => {}} />
                ))}
              </div>
            </PageView>
            <span className={c("thumb-num")}>{i + 1}</span>
          </button>
        );
      })}
      {dragState && <div className={c("thumb-drop-line")} style={{ top: dragState.lineTop }} />}
      {dragState && (
        <Portal root={root}>
          <div className={c("thumb-drag-chip")} style={{ left: dragState.x + 14, top: dragState.y + 10 }}>
            {dragState.keys.size === 1 ? "1 page" : `${dragState.keys.size} pages`}
          </div>
        </Portal>
      )}
    </div>
  );
}

// ================================================================== bookmarks

function Outline({ outline, onPick }: { outline?: OutlineNode[]; onPick(page: number): void }) {
  if (!outline?.length) return <div className={c("outline-panel outline-empty text-muted")}>This PDF has no bookmarks.</div>;
  return (
    <div className={c("outline-panel")}>
      {outline.map((n, i) => (
        <OutlineItem key={i} node={n} depth={0} onPick={onPick} />
      ))}
    </div>
  );
}

function OutlineItem({ node, depth, onPick }: { node: OutlineNode; depth: number; onPick(page: number): void }) {
  const [open, setOpen] = useState(true);
  const kids = node.kids ?? [];
  return (
    <>
      <div className={c("outline-row")} style={{ paddingLeft: 4 + depth * 12 }}>
        {kids.length > 0 ? (
          <button type="button" className={c("outline-twisty")} aria-label={open ? "Collapse" : "Expand"} onClick={() => setOpen(!open)}>
            <span style={{ display: "inline-flex", transform: open ? "rotate(90deg)" : undefined }}>
              <IconChevronRight />
            </span>
          </button>
        ) : (
          <span className={c("outline-twisty")} />
        )}
        <button type="button" className={c("outline-item")} onClick={() => onPick(node.page)}>
          {node.title}
        </button>
      </div>
      {open && kids.map((k, i) => <OutlineItem key={i} node={k} depth={depth + 1} onPick={onPick} />)}
    </>
  );
}

// ================================================================== presentation + small dialogs

function Presentation({ doc, start, night, w: W, h: H, onExit }: { doc: Doc; start: number; night: boolean; w: number; h: number; onExit(): void }) {
  const [index, setIndex] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const pages = doc.snap.pages;
  const total = pages.length;
  useEffect(() => ref.current?.focus(), []);
  const p = pages[Math.min(index, total - 1)];
  const d = shown(p);
  const k = Math.min(W / d.w, H / d.h);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={c("present-root", night && "viewer-scroll night")}
      style={{ outline: "none", overflow: "hidden" }}
      onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
      onContextMenu={(e) => {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") onExit();
        else if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) setIndex((i) => Math.min(total - 1, i + 1));
        else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) setIndex((i) => Math.max(0, i - 1));
      }}
    >
      <PageView pageRef={p} k={k} gray={doc.snap.gray} ctx={{ pageKey: p.key, live: false, editText: false, forms: false, edits: doc.snap.edits, editing: null, fields: doc.snap.fields }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {(doc.snap.overlays[p.key] ?? []).map((o) => (
            <OvView key={o.id} o={o} selected={false} single={false} editing={false} onDown={() => {}} onHandle={() => {}} onDouble={() => {}} onText={() => {}} onTextDone={() => {}} />
          ))}
        </div>
      </PageView>
      <div key={index} className={c("present-count")}>
        {index + 1} / {total}
      </div>
      <button
        type="button"
        className={c("btn btn-secondary btn-small")}
        style={{ position: "absolute", top: 12, right: 12 }}
        onClick={(e) => {
          e.stopPropagation();
          onExit();
        }}
      >
        Esc
      </button>
    </div>
  );
}

function MetaDialog({ doc, onClose, onApply }: { doc: Doc; onClose(): void; onApply(): void }) {
  const [m, setM] = useState<Record<string, string>>({ title: doc.title.replace(/\.pdf$/i, ""), author: "Brightwater Design Co.", subject: "", keywords: "", creator: "RevinHi PDF" });
  const FIELDS = [
    { key: "title", label: "Title", placeholder: "Shown in the PDF reader's title bar" },
    { key: "author", label: "Author", placeholder: "" },
    { key: "subject", label: "Subject", placeholder: "" },
    { key: "keywords", label: "Keywords", placeholder: "Comma separated" },
    { key: "creator", label: "Creator", placeholder: "RevinHi PDF" },
  ];
  return (
    <Modal
      title="Document properties"
      onCancel={onClose}
      actions={
        <>
          <button
            className={c("btn btn-primary")}
            onClick={() => {
              onApply();
              onClose();
            }}
          >
            Apply
          </button>
          <button className={c("btn btn-secondary")} onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <div className={c("print-opts")}>
        {FIELDS.map((f) => (
          <label key={f.key} className={c("meta-row")}>
            <span className={c("prop-label")}>{f.label}</span>
            <input className={c("text-input")} placeholder={f.placeholder} value={m[f.key]} onChange={(e) => setM({ ...m, [f.key]: e.target.value })} />
          </label>
        ))}
        <p className={c("prop-note")}>Saved with the file. Empty title uses the file name.</p>
      </div>
    </Modal>
  );
}

function DecoDialog({ on, onClose, onApply }: { on: boolean; onClose(): void; onApply(on: boolean): void }) {
  const [v, setV] = useState(true);
  void on;
  return (
    <Modal
      title="Page numbers & watermark"
      onCancel={onClose}
      actions={
        <>
          <button className={c("btn btn-primary")} onClick={() => onApply(v)}>
            Apply
          </button>
          <button className={c("btn btn-secondary")} onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <SettingRow label="Page numbers" hint="“Page 1 of 6” at the bottom center of every page.">
        <Toggle checked={v} onChange={setV} />
      </SettingRow>
    </Modal>
  );
}
