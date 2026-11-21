"use client";

import { useMemo, useRef, useState } from "react";
import { useDemo } from "../AppWindow";
import { FileRec, NOW, Results, Session, TreeNode } from "./data";
import { PreviewBody } from "./preview";
import {
  IconBack,
  IconCheck,
  IconEye,
  IconFolder,
  IconGrid,
  IconGuess,
  IconInfo,
  IconRecover,
  IconSearch,
  IconX,
  KIND_LABEL,
  KIND_ORDER,
  Kind,
  KindIcon,
  ProChip,
  c,
  formatDate,
  formatDay,
  humanSize,
  n,
} from "./ui";

type Show = "all" | "deleted";
type ChanceF = "any" | "good" | "partial";
type SizeF = "any" | "small" | "medium" | "large";
type DateF = "any" | "week" | "month" | "year" | "older";
interface Filters {
  show: Show;
  chance: ChanceF;
  size: SizeF;
  date: DateF;
  system: boolean;
}
const DEFAULT: Filters = { show: "all", chance: "any", size: "any", date: "any", system: false };

const CHANCE_LABEL = { good: "Good", partial: "Partial", poor: "Poor" } as const;
const CHANCE_DOT = { good: "dot-success", partial: "dot-warning", poor: "dot-danger" } as const;
const CHANCE_HELP = {
  good: "Nothing else has been saved over this file. It should come back whole.",
  partial: "Some of this file's space has been reused, so parts of it may be missing.",
  poor: "Most of this file's space has been reused or can't be read. It will likely come back damaged.",
};
const NAME_FROM = {
  guess: { title: "Name guessed from what's inside", help: "The file's own name wasn't kept on the drive." },
  number: { title: "Its name wasn't kept on the drive", help: "It's named by its type and a number. Its place on the drive is below." },
};
const MORE_PAGE = 500;
const DAY = 86_400_000;

/** A node as shown: the numbers after filters, and the children that still match. */
interface View {
  node: TreeNode;
  count: number;
  size: number;
  children: View[];
}

interface Row {
  v: View;
  depth: number;
  ancestors: string[];
  /** A "show more" line under a folder whose files are only partly listed. */
  more?: number;
}

const LEAVES = new WeakMap<TreeNode, FileRec[]>();

function leavesOf(node: TreeNode): FileRec[] {
  const hit = LEAVES.get(node);
  if (hit) return hit;
  const out = node.file ? [node.file] : node.children.flatMap(leavesOf);
  LEAVES.set(node, out);
  return out;
}

function parseSearch(q: string) {
  let text = q.trim().toLowerCase();
  let ext: string | null = null;
  let min = 0;
  let max = Infinity;
  text = text
    .replace(/(^|\s)\.([a-z0-9]{1,5})(?=\s|$)/g, (_, sp, e) => {
      ext = e;
      return sp;
    })
    .replace(/(^|\s)([<>])(\d+(?:\.\d+)?)(kb|mb|gb)(?=\s|$)/g, (_, sp, op, num, unit) => {
      const bytes = parseFloat(num) * (unit === "kb" ? 1e3 : unit === "mb" ? 1e6 : 1e9);
      if (op === ">") min = bytes;
      else max = bytes;
      return sp;
    })
    .trim();
  return { text, ext: ext as string | null, min, max };
}

function Chance({ f }: { f: FileRec }) {
  return (
    <span className={c("chance")} title={CHANCE_HELP[f.chance]}>
      <span className={c("pill-dot", CHANCE_DOT[f.chance])} />
      {CHANCE_LABEL[f.chance]}
    </span>
  );
}

function Highlight({ name, q }: { name: string; q: string }) {
  const i = q ? name.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, i)}
      <mark>{name.slice(i, i + q.length)}</mark>
      {name.slice(i + q.length)}
    </>
  );
}

export function ResultsView({
  session,
  results,
  running,
  progress,
  took,
  onBack,
  onClose,
  onContinue,
  onScanView,
  onStop,
  onPro,
}: {
  session: Session;
  results: Results;
  running: boolean;
  progress: number;
  took: string;
  onBack: () => void;
  onClose: () => void;
  onContinue: () => void;
  onScanView: () => void;
  onStop: () => void;
  onPro: () => void;
}) {
  const { notify } = useDemo();
  const [kind, setKindState] = useState<Kind | "">("");
  const [mode, setMode] = useState<"types" | "folders">("types");
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [big, setBig] = useState(false);
  const [doneOpen, setDoneOpen] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const setF = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  const setKind = (k: Kind | "") => {
    setKindState(k);
    if (k) setExpanded((s) => new Set(s).add(`t:${k}`));
  };
  const clearFilters = () => {
    setFilters(DEFAULT);
    setKindState("");
    setSearch("");
  };

  const q = useMemo(() => parseSearch(search), [search]);
  const flat = search.trim().length > 0;
  const filtersOn = filters.show !== "all" || filters.chance !== "any" || filters.size !== "any" || filters.date !== "any";
  const filtered = filtersOn || kind !== "" || flat;

  const passes = useMemo(() => {
    const age = (f: FileRec) => (NOW - f.modified) / DAY;
    return (f: FileRec, withKind: boolean) => {
      if (withKind && kind && f.kind !== kind) return false;
      if (filters.show === "deleted" && !f.deleted) return false;
      if (filters.chance === "good" && f.chance !== "good") return false;
      if (filters.chance === "partial" && f.chance === "poor") return false;
      if (filters.size === "small" && f.size >= 1e6) return false;
      if (filters.size === "medium" && (f.size < 1e6 || f.size > 1e8)) return false;
      if (filters.size === "large" && f.size <= 1e8) return false;
      if (filters.date === "week" && age(f) > 7) return false;
      if (filters.date === "month" && age(f) > 31) return false;
      if (filters.date === "year" && age(f) > 365) return false;
      if (filters.date === "older" && age(f) <= 365) return false;
      return true;
    };
  }, [filters, kind]);

  // Shown numbers: the scan's own while nothing is filtered, otherwise scaled by how many of the
  // listed files still match.
  const viewOf = useMemo(() => {
    const go = (node: TreeNode, withKind: boolean): View | null => {
      const p = (f: FileRec) => passes(f, withKind);
      if (node.file) return p(node.file) ? { node, count: 1, size: node.file.size, children: [] } : null;
      const children = node.children.map((ch) => go(ch, withKind)).filter((x): x is View => x !== null);
      const on = filtersOn || (withKind && kind !== "");
      if (!on) return { node, count: node.count, size: node.size, children };
      const all = leavesOf(node);
      const match = all.filter(p);
      if (!match.length) return null;
      const allSize = all.reduce((s, f) => s + f.size, 0) || 1;
      const matchSize = match.reduce((s, f) => s + f.size, 0);
      return {
        node,
        count: Math.max(match.length, Math.round((node.count * match.length) / all.length)),
        size: Math.max(matchSize, (node.size * matchSize) / allSize),
        children,
      };
    };
    return go;
  }, [passes, filtersOn, kind]);

  const tops = useMemo(() => {
    const base = mode === "types" ? results.types.filter((t) => !kind || t.id === `t:${kind}`) : results.folders;
    return base.map((t) => viewOf(t, true)).filter((x): x is View => x !== null);
  }, [mode, results, kind, viewOf]);

  // Kind chips: counts under the other filters.
  const chipViews = useMemo(() => results.types.map((t) => viewOf(t, false)), [results, viewOf]);
  const allCount = chipViews.reduce((s, v) => s + (v?.count ?? 0), 0);
  const allSize = chipViews.reduce((s, v) => s + (v?.size ?? 0), 0);

  // Search: one flat list of matching files from the whole scan.
  const found = useMemo(() => {
    if (!flat) return [];
    return results.files.filter(
      (f) =>
        passes(f, true) &&
        (!q.text || f.name.toLowerCase().includes(q.text)) &&
        (!q.ext || f.ext === q.ext || (q.ext === "jpeg" && f.ext === "jpg")) &&
        f.size >= q.min &&
        f.size <= q.max,
    );
  }, [flat, results, passes, q]);

  const rows: Row[] = useMemo(() => {
    if (flat) return found.map((f) => ({ v: { node: { id: `f${f.id}`, type: "file", name: f.name, icon: f.kind, count: 1, size: f.size, children: [], file: f }, count: 1, size: f.size, children: [] }, depth: 0, ancestors: [] }));
    const out: Row[] = [];
    const walk = (v: View, depth: number, ancestors: string[]) => {
      out.push({ v, depth, ancestors });
      if (!expanded.has(v.node.id) || v.node.file) return;
      const next = [...ancestors, v.node.id];
      v.children.forEach((ch) => walk(ch, depth + 1, next));
      const files = v.children.filter((ch) => ch.node.file).length;
      if (files > 0 && v.count > files) out.push({ v, depth: depth + 1, ancestors: next, more: v.count - files });
    };
    tops.forEach((t) => walk(t, 0, []));
    return out;
  }, [flat, found, tops, expanded]);

  // The whole list the totals and ticks apply to.
  const listTotal = useMemo(
    () =>
      flat
        ? { count: found.length, size: found.reduce((s, f) => s + f.size, 0) }
        : { count: tops.reduce((s, t) => s + t.count, 0), size: tops.reduce((s, t) => s + t.size, 0) },
    [flat, found, tops],
  );

  const selection = useMemo(() => {
    if (checked.has("all")) return listTotal;
    let count = 0;
    let size = 0;
    const walk = (v: View) => {
      if (checked.has(v.node.id)) {
        count += v.count;
        size += v.size;
        return;
      }
      v.children.forEach(walk);
    };
    if (flat) found.forEach((f) => checked.has(`f${f.id}`) && ((count += 1), (size += f.size)));
    else tops.forEach(walk);
    return { count, size };
  }, [checked, tops, flat, found, listTotal]);

  const toggleCheck = (id: string) =>
    setChecked((s) => {
      const nx = new Set(s);
      if (nx.has(id)) nx.delete(id);
      else nx.add(id);
      return nx;
    });
  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const nx = new Set(s);
      if (nx.has(id)) nx.delete(id);
      else nx.add(id);
      return nx;
    });

  const active = useMemo(() => {
    if (!activeId) return null;
    return rows.find((r) => r.v.node.id === activeId && !r.more)?.v ?? null;
  }, [rows, activeId]);

  // Page subtitle numbers.
  const totals = useMemo(() => {
    if (!filtered) return results.total;
    const sample = flat ? found : results.files.filter((f) => passes(f, true));
    const m = sample.length || 1;
    const count = listTotal.count;
    return {
      count,
      size: listTotal.size,
      deleted: Math.round((count * sample.filter((f) => f.deleted).length) / m),
      good: Math.round((count * sample.filter((f) => f.chance === "good").length) / m),
    };
  }, [filtered, results, flat, found, passes, listTotal]);

  const allChecked = checked.has("all");
  const pct = Math.floor(progress * 100);

  return (
    <div className={c("results")}>
      <div className={c("results-head")}>
        <div className={c("crumbs")}>
          <button className={c("back-btn")} onClick={onBack} title="Back to your drives (this scan stays open)">
            <IconBack size={14} /> Drives
          </button>
          <span className={c("crumb-sep")}>/</span>
          <span className={c("crumb-here")}>{running ? "Files found so far" : session.deep ? "Full scan results" : "Scan results"}</span>
        </div>
        <div className={c("page-head")} style={{ alignItems: "flex-end" }}>
          <div style={{ minWidth: 0 }}>
            <div className={c("page-title")}>{session.title}</div>
            <div className={c("page-sub")}>
              <b>{n(totals.count)}</b> files ({humanSize(totals.size)}) · <b>{n(totals.deleted)}</b> deleted
              {totals.good > 0 && <> · {n(totals.good)} with a good chance</>}
              {filtered && " · filtered"}
            </div>
          </div>
          <span style={{ flex: 1 }} />
          {!session.finished && !running && (
            <button className={c("btn btn-primary btn-small")} onClick={onContinue}>
              Continue scan
            </button>
          )}
          <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this saves the scan as a file, so you can open it again later without scanning.")}>
            Save scan…
          </button>
          {!running && (
            <button className={c("btn btn-secondary btn-small")} onClick={onClose} title="Close this scan (it stays under Recent scans)">
              Close
            </button>
          )}
        </div>
      </div>

      {running && (
        <div className={c("banner live-bar")}>
          <span className={c("live-dot")} aria-hidden="true" />
          <span>
            <b>Still scanning, {pct}%.</b> New files appear here as they&apos;re found.
          </span>
          <span className={c("live-bar-track")} aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
          <button className={c("btn btn-secondary btn-tiny")} onClick={onScanView}>
            Back to the scan
          </button>
          <button className={c("btn btn-secondary btn-tiny")} onClick={onStop}>
            Stop scan
          </button>
        </div>
      )}
      {!session.finished && !running && (
        <div className={c("banner banner-warn")}>The scan was stopped before the end, so some files may be missing. Continue scan finishes it.</div>
      )}

      {doneOpen && session.finished && !running && !filtered && (
        <div className={c("done-card")}>
          <div className={c("done-mark")}>
            <IconCheck size={20} />
          </div>
          <div className={c("done-main")}>
            <div className={c("done-title")}>
              Scan finished<span className={c("done-took")}> in {took}</span>
            </div>
            <div className={c("done-stats")}>
              <span>
                <b>{n(results.total.count)}</b> files found
              </span>
              <span>
                <b>{n(results.total.deleted)}</b> deleted
              </span>
              <span className={c("done-good")}>
                <b>{n(results.total.good)}</b> with a good chance
              </span>
              <span className={c("text-muted")}>{humanSize(results.total.size)} in all</span>
            </div>
          </div>
          <div className={c("done-actions")}>
            <button
              className={c("btn btn-primary btn-small")}
              onClick={() => {
                setF("chance", "good");
                setChecked(new Set(["all"]));
                setDoneOpen(false);
              }}
            >
              Tick all with a good chance
            </button>
            <button
              className={c("btn btn-secondary btn-small")}
              onClick={() => {
                setF("show", "deleted");
                setDoneOpen(false);
              }}
            >
              Show deleted only
            </button>
            <button className={c("btn btn-secondary btn-small")} onClick={() => searchRef.current?.focus()}>
              <IconSearch size={12} /> Search by name
            </button>
            <button className={c("icon-btn icon-btn-sm")} onClick={() => setDoneOpen(false)} aria-label="Hide this summary" title="Hide this summary">
              <IconX size={12} />
            </button>
          </div>
        </div>
      )}

      <div className={c("chips-row")}>
        <div className={c("kind-chips")} role="tablist" aria-label="File types">
          <button className={c("kind-chip first", kind === "" && "on")} onClick={() => setKind("")}>
            <span className={c("kind-chip-label")}>All files</span>
            <span className={c("kind-chip-num")}>{n(allCount)}</span>
            <span className={c("kind-chip-size")}>{humanSize(allSize)}</span>
          </button>
          {KIND_ORDER.map((k, i) => {
            const v = chipViews[i];
            return (
              <button key={k} className={c("kind-chip", `kind-${k}`, kind === k && "on")} onClick={() => setKind(kind === k ? "" : k)} disabled={!v && kind !== k}>
                <span className={c("kind-chip-icon")}>
                  <KindIcon kind={k} size={15} />
                </span>
                <span className={c("kind-chip-label")}>{KIND_LABEL[k]}</span>
                <span className={c("kind-chip-num")}>{n(v?.count ?? 0)}</span>
              </button>
            );
          })}
        </div>
        <div className={c("segmented chips-view")} title={flat ? "Search shows a flat list" : undefined}>
          <button className={c(mode === "types" && !flat && "active")} onClick={() => setMode("types")} disabled={flat}>
            <IconGrid size={13} /> Types
          </button>
          <button className={c(mode === "folders" && !flat && "active")} onClick={() => setMode("folders")} disabled={flat}>
            <IconFolder size={13} /> Folders
          </button>
        </div>
      </div>

      <div className={c("filter-bar")}>
        <div className={c("segmented")}>
          <button className={c(filters.show !== "deleted" && "active")} onClick={() => setF("show", "all")}>
            All files
          </button>
          <button className={c(filters.show === "deleted" && "active")} onClick={() => setF("show", "deleted")}>
            Deleted only
          </button>
        </div>
        <select className={c("select")} value={filters.chance} onChange={(e) => setF("chance", e.target.value as ChanceF)} aria-label="Recovery chance">
          <option value="any">Any recovery chance</option>
          <option value="good">Good chance only</option>
          <option value="partial">Good or partial</option>
        </select>
        <select className={c("select")} value={filters.size} onChange={(e) => setF("size", e.target.value as SizeF)} aria-label="Size">
          <option value="any">Any size</option>
          <option value="small">Under 1 MB</option>
          <option value="medium">1 MB to 100 MB</option>
          <option value="large">Over 100 MB</option>
        </select>
        <select className={c("select")} value={filters.date} onChange={(e) => setF("date", e.target.value as DateF)} aria-label="Date changed">
          <option value="any">Any date</option>
          <option value="week">Last week</option>
          <option value="month">Last month</option>
          <option value="year">Last year</option>
          <option value="older">Over a year ago</option>
        </select>
        <label className={c("toggle-check")} title="Windows housekeeping files, empty files and second copies of a file">
          <input type="checkbox" checked={filters.system} onChange={(e) => setF("system", e.target.checked)} />
          Show system and empty files
        </label>
        {filtered && (
          <button className={c("link-btn")} onClick={clearFilters}>
            Clear filters
          </button>
        )}
        <span style={{ flex: 1 }} />
        <label className={c("search")}>
          <IconSearch size={14} />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search all files, or try .zip  >100mb" aria-label="Search" />
          {search ? (
            <button className={c("search-clear")} onClick={() => setSearch("")} aria-label="Clear">
              <IconX size={12} />
            </button>
          ) : (
            <kbd className={c("kbd")}>Ctrl F</kbd>
          )}
        </label>
      </div>

      <div className={c("results-body")}>
        <div className={c("card tree-card")}>
          {flat && (
            <div className={c("search-strip")}>
              <IconSearch size={13} />
              <span>
                <b>{n(found.length)}</b> {found.length === 1 ? "file matches" : "files match"}
                {q.text && (
                  <>
                    {" "}
                    <span className={c("search-q")}>“{q.text}”</span>
                  </>
                )}
                {q.ext && <span className={c("text-muted")}> · .{q.ext} files</span>}
                <span className={c("text-muted")}> in the whole scan</span>
              </span>
              <span style={{ flex: 1 }} />
              <button className={c("link-btn")} onClick={() => setSearch("")}>
                Back to {mode === "types" ? "types" : "folders"}
              </button>
            </div>
          )}
          <div className={c("tree-head")}>
            <label className={c("chk-cell")}>
              <input type="checkbox" checked={allChecked} onChange={() => toggleCheck("all")} aria-label="Tick everything shown" title="Tick everything shown (Ctrl+A)" />
            </label>
            <span>Name</span>
            <span className={c("num")}>Size</span>
            <span>Changed</span>
            <span>Chance</span>
          </div>
          <div className={c("tree-scroll")}>
            <div key={flat ? "flat" : mode} className={c("tree-fade")}>
              {rows.map((r) => {
                const { v, depth, ancestors } = r;
                const nd = v.node;
                if (r.more !== undefined)
                  return (
                    <div key={`more:${nd.id}`} className={c("tree-row more-row")} style={{ paddingLeft: 40 + depth * 18, alignItems: "center" }}>
                      <button className={c("link-btn")} onClick={() => notify("This preview lists a few sample files. The app lists every file it finds.")}>
                        Show {n(Math.min(MORE_PAGE, r.more))} more ({n(r.more)} left)
                      </button>
                    </div>
                  );
                const inherited = allChecked || ancestors.some((a) => checked.has(a));
                const isChecked = inherited || checked.has(nd.id);
                const open = expanded.has(nd.id);
                const expandable = !nd.file && nd.children.length > 0;
                const f = nd.file;
                const name = nd.type === "kind" ? KIND_LABEL[nd.name as Kind] : nd.name;
                return (
                  <div
                    key={`${nd.id}:${ancestors.join(">")}`}
                    className={c("tree-row", activeId === nd.id && "active", f?.deleted && "is-deleted", isChecked && "is-checked", nd.type === "section" && "section-row")}
                    onClick={() => setActiveId(nd.id)}
                    onDoubleClick={() => (expandable ? toggleExpand(nd.id) : f && setBig(true))}
                  >
                    <label className={c("chk-cell")} onClick={(e) => e.stopPropagation()}>
                      {nd.type !== "section" && (
                        <input type="checkbox" checked={isChecked} disabled={inherited} onChange={() => toggleCheck(nd.id)} aria-label={`Select ${name}`} />
                      )}
                    </label>
                    <span className={c("name-cell")} style={{ paddingLeft: depth * 18 }}>
                      {expandable ? (
                        <button
                          className={c("twisty", open && "open")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(nd.id);
                          }}
                          aria-label={open ? "Close" : "Open"}
                        >
                          <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true">
                            <path d="M3 1.5L7 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : (
                        <span className={c("twisty-space")} />
                      )}
                      <span className={c("row-icon", `kind-${nd.icon}`)}>
                        <KindIcon kind={nd.icon} size={15} />
                      </span>
                      <span className={c("row-name")}>{flat ? <Highlight name={name} q={q.text} /> : name}</span>
                      {f?.nameFrom === "guess" && (
                        <span className={c("text-muted")} title="Name guessed from what's inside" style={{ display: "flex" }}>
                          <IconGuess size={12} />
                        </span>
                      )}
                      {f?.deleted && <span className={c("tag tag-deleted")}>Deleted</span>}
                      {!f && v.count > 0 && <span className={c("row-count")}>{n(v.count)}</span>}
                      {nd.type === "section" && nd.note && <span className={c("row-path")}>{nd.note}</span>}
                      {flat && f && <span className={c("row-path")}>{f.folder ?? "Found by contents"}</span>}
                    </span>
                    <span className={c("num text-muted")}>{humanSize(v.size)}</span>
                    <span className={c("text-muted date-cell")}>{f ? formatDay(f.modified) : ""}</span>
                    <span>{f && <Chance f={f} />}</span>
                  </div>
                );
              })}
            </div>
            {rows.length === 0 && (
              <div className={c("empty-state")}>
                <div className={c("empty-title")}>{flat ? "No files match this search" : "No files match these filters"}</div>
                <div className={c("text-muted")}>Try a different type, date or size, or show everything again.</div>
                <button className={c("btn btn-secondary btn-small")} onClick={clearFilters}>
                  Show everything
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={c("card details-card")}>
          <Preview v={active} big={big} setBig={setBig} />
          {active && <Details v={active} />}
        </div>
      </div>

      <div className={c("recover-bar")}>
        <span className={c("recover-sel")}>
          {checked.size === 0 ? (
            <span className={c("text-muted")}>
              Tick the files and folders you want back. <kbd className={c("kbd")}>Ctrl A</kbd> ticks everything shown.
            </span>
          ) : selection.count === 0 ? (
            <span className={c("text-muted")}>None of the ticked files match the filters now. Clear the filters to see them.</span>
          ) : (
            <>
              <b>{n(selection.count)}</b> {selection.count === 1 ? "file" : "files"} selected · {humanSize(selection.size)}
            </>
          )}
        </span>
        <span style={{ flex: 1 }} />
        {checked.size > 0 && (
          <button className={c("btn btn-secondary btn-small")} onClick={() => setChecked(new Set())}>
            Clear
          </button>
        )}
        <button className={c("btn btn-primary recover-btn")} disabled={checked.size === 0 || selection.count === 0} onClick={onPro}>
          <IconRecover size={14} />
          {checked.size > 0 && selection.count > 0 ? `Recover ${n(selection.count)} ${selection.count === 1 ? "file" : "files"} (${humanSize(selection.size)})` : "Recover"}
          <ProChip />
        </button>
      </div>
    </div>
  );
}

function Preview({ v, big, setBig }: { v: View | null; big: boolean; setBig: (b: boolean) => void }) {
  if (!v) {
    return (
      <div className={c("preview-slot")}>
        <IconEye size={26} />
        <span>Click a file to preview it here.</span>
        <span className={c("text-muted")}>Previews are free, and nothing is saved.</span>
      </div>
    );
  }
  const f = v.node.file;
  if (!f) {
    return (
      <div className={c("preview-slot")}>
        <span className={c("row-icon", `kind-${v.node.icon}`)} style={{ width: 44, height: 44, borderRadius: 12 }}>
          <KindIcon kind={v.node.icon} size={24} />
        </span>
        <span>{n(v.count)} files inside</span>
      </div>
    );
  }
  return (
    <div>
      <div className={c("preview-box")}>
        {big ? <span className={c("text-muted preview-note")}>Shown bigger.</span> : <PreviewBody key={f.id} f={f} />}
        {!big && (
          <button className={c("preview-zoom")} onClick={() => setBig(true)} title="Show it bigger (Space)">
            Bigger <kbd className={c("kbd")}>Space</kbd>
          </button>
        )}
      </div>
      {big && (
        <div className={c("preview-overlay")} onMouseDown={(e) => e.target === e.currentTarget && setBig(false)}>
          <div className={c("card preview-overlay-card")}>
            <div className={c("preview-head")}>
              <span className={c("details-name")}>{f.name}</span>
              <span style={{ flex: 1 }} />
              <button className={c("btn btn-secondary btn-small")} onClick={() => setBig(false)}>
                Close
              </button>
            </div>
            <div className={c("preview-box preview-box-big")} style={{ overflow: "auto" }}>
              <PreviewBody f={f} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Details({ v }: { v: View }) {
  const f = v.node.file;
  const name = v.node.type === "kind" ? KIND_LABEL[v.node.name as Kind] : v.node.name;
  return (
    <div className={c("details")}>
      <div className={c("details-name")}>{name}</div>
      {f?.folder && <div className={c("details-path")}>{f.folder}</div>}
      {f?.nameFrom && (
        <div className={c("name-box")}>
          <div className={c("name-box-title")}>
            {f.nameFrom === "guess" ? <IconGuess size={13} /> : <IconInfo size={13} />}
            {NAME_FROM[f.nameFrom].title}
          </div>
          <div className={c("text-secondary")}>{NAME_FROM[f.nameFrom].help}</div>
        </div>
      )}
      {f && (
        <div className={c("chance-box", `chance-${f.chance}`)}>
          <div className={c("chance-title")}>
            <span className={c("pill-dot", CHANCE_DOT[f.chance])} /> {CHANCE_LABEL[f.chance]} chance of recovery
          </div>
          <div className={c("text-secondary")}>{CHANCE_HELP[f.chance]}</div>
        </div>
      )}
      <div className={c("details-facts")}>
        {f ? (
          <>
            <span className={c("text-muted")}>Size</span>
            <span>{humanSize(f.size)}</span>
            <span className={c("text-muted")}>Status</span>
            <span>{f.deleted ? "Deleted" : "Not deleted"}</span>
            <span className={c("text-muted")}>Changed</span>
            <span>{formatDate(f.modified)}</span>
            {f.where !== "contents" && (
              <>
                <span className={c("text-muted")}>Created</span>
                <span>{formatDate(f.created)}</span>
              </>
            )}
          </>
        ) : (
          <>
            <span className={c("text-muted")}>Files inside</span>
            <span>{n(v.count)}</span>
            <span className={c("text-muted")}>Total size</span>
            <span>{humanSize(v.size)}</span>
          </>
        )}
      </div>
      {f?.where === "contents" && (
        <div className={c("text-muted details-note")}>Found by its contents. Its folder wasn&apos;t kept on the drive, so it&apos;s listed with others of its type.</div>
      )}
      {f?.where === "records" && <div className={c("text-muted details-note")}>Found from a file record left on the drive after its file table was lost.</div>}
      {f?.folder?.startsWith("Lost folders") && <div className={c("text-muted details-note")}>Its original folder is gone, so it&apos;s shown under Lost folders.</div>}
    </div>
  );
}
