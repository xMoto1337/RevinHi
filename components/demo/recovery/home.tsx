"use client";

import { useMemo, useState } from "react";
import { useDemo } from "../AppWindow";
import { DRIVES, Drive, Group, HEALTH_DOT, RecentScan, Session, driveLetters, formats, fullMinutes, usedSpace } from "./data";
import {
  IconChevron,
  IconGrid,
  IconImage,
  IconInfo,
  IconLayers,
  IconList,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconWindows,
  KIND_LABEL,
  KIND_ORDER,
  KindIcon,
  Kind,
  Modal,
  Toggle,
  c,
  humanSize,
  DriveIcon,
} from "./ui";
import { QUICK_TOOLS, type ToolId } from "./tools";

export interface ScanTarget {
  drive: number;
  volume?: number;
  title: string;
  size: number;
  isSystem: boolean;
  fs?: string;
}

export type StartScan = (t: ScanTarget) => void;

const GROUPS: { id: Group; title: string }[] = [
  { id: "pc", title: "This PC" },
  { id: "usb", title: "USB drives & memory cards" },
  { id: "images", title: "Disk images" },
];

type Sort = "default" | "name" | "size" | "type";
const SORTS: { id: Sort; label: string }[] = [
  { id: "default", label: "Usual" },
  { id: "name", label: "Name" },
  { id: "size", label: "Size" },
  { id: "type", label: "Type" },
];

const diskTarget = (d: Drive): ScanTarget => ({ drive: d.id, title: d.name, size: d.size, isSystem: d.isSystem, fs: formats(d) || undefined });

function Partitions({ d, onScan, onLost }: { d: Drive; onScan: StartScan; onLost: () => void }) {
  return (
    <div className={c("parts")}>
      {d.volumes.map((v, i) => {
        const used = v.free != null ? 1 - v.free / v.size : null;
        const title = v.letter ? `${v.letter} ${v.label || "Drive"}` : v.label || "Hidden partition";
        return (
          <div key={i} className={c("part-row")}>
            <span className={c("part-letter")}>{v.letter ?? "—"}</span>
            <span className={c("part-main")}>
              <span className={c("part-name")}>{v.label || (v.letter ? "No name" : "Hidden partition")}</span>
              <span className={c("part-meta")}>
                {v.fs || "Unknown format"} · {humanSize(v.size)}
                {v.free != null && ` · ${humanSize(v.free)} free`}
              </span>
            </span>
            {used !== null && (
              <span className={c("mini-bar")} title={`${Math.round(used * 100)}% used`}>
                <span style={{ width: `${used * 100}%` }} />
              </span>
            )}
            <button
              className={c("btn btn-secondary btn-tiny")}
              onClick={() => onScan({ drive: d.id, volume: i, title, size: v.size, isSystem: d.isSystem, fs: v.fs || undefined })}
              title="Scan only this partition"
            >
              Scan
            </button>
          </div>
        );
      })}
      <div className={c("parts-foot")}>
        <span className={c("text-muted")}>Partition missing?</span>
        <button className={c("link-btn")} onClick={onLost}>
          Find lost partitions on this drive
        </button>
      </div>
    </div>
  );
}

function HealthPill({ d, onHealth }: { d: Drive; onHealth: () => void }) {
  if (d.health === "unknown") return null;
  return (
    <button className={c("pill pill-soft pill-button")} onClick={onHealth} title="Click for details.">
      <span className={c("pill-dot", HEALTH_DOT[d.health])} />
      {d.health === "good" ? "Healthy" : "Caution"}
    </button>
  );
}

interface DriveProps {
  d: Drive;
  onScan: StartScan;
  onHealth: () => void;
  onLost: () => void;
}

function DriveCard({ d, onScan, onHealth, onLost }: DriveProps) {
  const [open, setOpen] = useState(false);
  const letters = driveLetters(d);
  const used = usedSpace(d);
  const pct = used !== null ? Math.min(100, (used / d.size) * 100) : 0;
  return (
    <div className={c("card drive-card", `bus-${d.bus}`)}>
      <div className={c("drive-head")}>
        <div className={c("drive-icon", `bus-${d.bus}`)}>
          <DriveIcon d={d} size={28} />
        </div>
        <div className={c("drive-title")}>
          <div className={c("drive-name")} title={d.name}>
            {d.name}
          </div>
          <div className={c("drive-meta")}>
            {humanSize(d.size)} · {d.busLabel}
            {letters && <span className={c("drive-letters")}>{letters}</span>}
          </div>
        </div>
        <div className={c("drive-pills")}>
          {d.isSystem && (
            <span className={c("pill pill-soft pill-win")} title="Windows runs from this drive">
              <IconWindows size={10} />
              Windows
            </span>
          )}
          <HealthPill d={d} onHealth={onHealth} />
        </div>
      </div>

      <div className={c("space")}>
        <div className={c("space-bar")} aria-hidden="true">
          <span style={{ width: `${pct}%` }} className={c(pct > 90 && "full")} />
        </div>
        <div className={c("space-text")}>
          {used !== null ? (
            <>
              <span>{humanSize(used)} used</span>
              <span className={c("text-muted")}>{humanSize(Math.max(0, d.size - used))} free</span>
            </>
          ) : (
            <span className={c("text-muted")}>Space used isn&apos;t known</span>
          )}
        </div>
      </div>

      <div className={c("drive-actions")}>
        <button className={c("btn btn-primary")} onClick={() => onScan(diskTarget(d))}>
          Scan
        </button>
        <span style={{ flex: 1 }} />
        <button className={c("link-btn parts-toggle", open && "open")} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {d.volumes.length === 1 ? "1 partition" : `${d.volumes.length} partitions`}
          <IconChevron size={13} />
        </button>
      </div>

      {open && <Partitions d={d} onScan={onScan} onLost={onLost} />}
    </div>
  );
}

function DriveRow({ d, onScan, onHealth, onLost }: DriveProps) {
  const [open, setOpen] = useState(false);
  const letters = driveLetters(d);
  const used = usedSpace(d);
  const pct = used !== null ? Math.min(100, (used / d.size) * 100) : 0;
  return (
    <div className={c("drive-row", `bus-${d.bus}`)}>
      <div className={c("drive-row-main")}>
        <button className={c("row-twisty", open && "open")} onClick={() => setOpen((v) => !v)} aria-label={open ? "Hide partitions" : "Show partitions"}>
          <IconChevron size={12} />
        </button>
        <span className={c("drive-icon small", `bus-${d.bus}`)}>
          <DriveIcon d={d} size={17} />
        </span>
        <span className={c("drive-row-name")}>
          <span className={c("drive-row-title")}>{d.name}</span>
          {letters && <span className={c("drive-letters")}>{letters}</span>}
          {d.isSystem && (
            <span className={c("win-mark")}>
              <IconWindows size={10} /> Windows
            </span>
          )}
        </span>
        <span className={c("drive-row-size")}>{humanSize(d.size)}</span>
        <span className={c("drive-row-fs text-muted")}>{formats(d) || "—"}</span>
        <button className={c("icon-btn icon-btn-sm")} onClick={onHealth} disabled={d.health === "unknown"} aria-label="Drive health" title="Drive health">
          <span className={c("pill-dot", HEALTH_DOT[d.health])} />
        </button>
        <span className={c("mini-bar wide")} title={`${Math.round(pct)}% used`}>
          <span style={{ width: `${pct}%` }} />
        </span>
        <button className={c("btn btn-primary btn-tiny")} onClick={() => onScan(diskTarget(d))}>
          Scan
        </button>
      </div>
      {open && <Partitions d={d} onScan={onScan} onLost={onLost} />}
    </div>
  );
}

export function RecentRow({ r, compact, onOpen, onRemove }: { r: RecentScan; compact?: boolean; onOpen: () => void; onRemove: () => void }) {
  return (
    <div className={c("recent-row")}>
      <div className={c("recent-main")}>
        <span className={c("recent-name")}>{r.title}</span>
        <span className={c("recent-meta")}>
          <span>{r.when}</span>
          {!r.finished && <span className={c("tag tag-warn")}>Not finished</span>}
          {!compact && <span>Scan file {r.file}</span>}
        </span>
      </div>
      <button className={c("btn btn-secondary btn-tiny")} onClick={onOpen}>
        Open
      </button>
      <button className={c("icon-btn icon-btn-sm")} onClick={onRemove} title="Remove this scan" aria-label="Remove this scan">
        <IconTrash size={14} />
      </button>
    </div>
  );
}

/** The scan that's running or open, with a way back to it. */
function ScanBanner({ session, running, pct, onScanView, onResults }: { session: Session; running: boolean; pct: number; onScanView: () => void; onResults: () => void }) {
  return (
    <div className={c("card scan-banner")}>
      <span className={c("scan-pill-ring")} style={{ ["--p" as string]: `${running ? pct : 100}%` }} />
      <div className={c("scan-banner-text")}>
        <div className={c("scan-banner-title")}>
          {running ? `Scanning ${session.title}… ${pct}%` : session.finished ? `Results of the scan of ${session.title}` : `Scan of ${session.title} (stopped)`}
        </div>
        <div className={c("text-muted")}>{running ? "It keeps going while you look around." : "Open the results to pick files to recover."}</div>
      </div>
      {running && (
        <button className={c("btn btn-secondary btn-small")} onClick={onScanView}>
          Back to the scan
        </button>
      )}
      <button className={c("btn btn-small", running ? "btn-secondary" : "btn-primary")} onClick={onResults}>
        {running ? "Files found so far" : "Open the results"}
      </button>
    </div>
  );
}

export function HomeView({
  onScan,
  onTool,
  recent,
  onOpenRecent,
  onRemoveRecent,
  onRecentTab,
  session,
  running,
  pct,
  onScanView,
  onResults,
}: {
  onScan: StartScan;
  onTool: (t: ToolId, drive?: number) => void;
  recent: RecentScan[];
  onOpenRecent: (r: RecentScan) => void;
  onRemoveRecent: (r: RecentScan) => void;
  onRecentTab: () => void;
  session: Session | null;
  running: boolean;
  pct: number;
  onScanView: () => void;
  onResults: () => void;
}) {
  const { notify } = useDemo();
  const [view, setView] = useState<"cards" | "list">("cards");
  const [sort, setSort] = useState<Sort>("default");
  const [folded, setFolded] = useState<Set<Group>>(new Set());
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const by = (a: Drive, b: Drive) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
        case "size":
          return b.size - a.size;
        case "type":
          return a.busLabel.localeCompare(b.busLabel, "en") || a.id - b.id;
        default:
          return Number(b.isSystem) - Number(a.isSystem) || a.id - b.id;
      }
    };
    return GROUPS.map((g) => ({ ...g, drives: DRIVES.filter((d) => d.group === g.id).sort(by) }));
  }, [sort]);

  const refresh = () => {
    setBusy(true);
    window.setTimeout(() => setBusy(false), 900);
  };

  const toggleGroup = (g: Group) =>
    setFolded((s) => {
      const n = new Set(s);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });

  const pickImage = () => notify("In the app, this opens a VHD, VHDX, IMG or ISO file from your PC to scan.");

  return (
    <div className={c("pane scroll")}>
      <div className={c("dash")}>
        <section className={c("dash-main")}>
          <div className={c("page-head")}>
            <div>
              <div className={c("page-title")}>Your drives</div>
              <div className={c("page-sub")}>Pick a drive to find deleted and lost files on it. Scanning never changes the drive.</div>
            </div>
            <span style={{ flex: 1 }} />
            <div className={c("sort-control")}>
              <span className={c("text-muted sort-label")}>Sort by</span>
              <div className={c("segmented")} role="radiogroup" aria-label="Sort drives">
                {SORTS.map((x) => (
                  <button key={x.id} role="radio" aria-checked={sort === x.id} className={c(sort === x.id && "active")} onClick={() => setSort(x.id)}>
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={c("segmented drive-view")} role="radiogroup" aria-label="Show drives as">
              <button role="radio" aria-checked={view === "cards"} className={c(view === "cards" && "active")} onClick={() => setView("cards")} title="Cards">
                <IconGrid size={14} />
              </button>
              <button role="radio" aria-checked={view === "list"} className={c(view === "list" && "active")} onClick={() => setView("list")} title="List">
                <IconList size={14} />
              </button>
            </div>
            <button className={c("icon-btn")} onClick={refresh} disabled={busy} title="Look for drives again (new drives also show up by themselves)" aria-label="Refresh">
              <IconRefresh size={16} className={busy ? "animate-spin" : undefined} />
            </button>
          </div>

          {session && <ScanBanner session={session} running={running} pct={pct} onScanView={onScanView} onResults={onResults} />}

          {grouped.map((g) => {
            const isFolded = folded.has(g.id);
            return (
              <section key={g.id} className={c("drive-group")}>
                <button className={c("group-head", !isFolded && "open")} onClick={() => toggleGroup(g.id)} aria-expanded={!isFolded}>
                  <IconChevron size={12} />
                  <span>{g.title}</span>
                  <span className={c("group-count")}>{g.drives.length}</span>
                </button>
                {!isFolded && (
                  <div className={c(view === "list" ? "drive-list" : "drive-grid")}>
                    {g.drives.map((d) => {
                      const props: DriveProps = {
                        d,
                        onScan,
                        onHealth: () => onTool("health", d.id),
                        onLost: () => onTool("partitions", d.id),
                      };
                      return view === "list" ? <DriveRow key={d.id} {...props} /> : <DriveCard key={d.id} {...props} />;
                    })}
                    {g.id === "images" &&
                      (view === "list" ? (
                        <button className={c("drive-row")} onClick={pickImage} style={{ border: "none", background: "transparent", color: "inherit", textAlign: "left" }}>
                          <span className={c("drive-row-main")}>
                            <span className={c("row-twisty")} />
                            <span className={c("drive-icon small bus-virtual")}>
                              <IconImage size={16} />
                            </span>
                            <span className={c("drive-row-name")}>
                              <span className={c("drive-row-title")}>Open disk image…</span>
                              <span className={c("text-muted")}>VHD, VHDX, IMG or ISO</span>
                            </span>
                          </span>
                        </button>
                      ) : (
                        <button className={c("add-card")} onClick={pickImage}>
                          <span className={c("add-icon")}>
                            <IconImage size={22} />
                            <span className={c("add-plus")}>
                              <IconPlus size={11} />
                            </span>
                          </span>
                          <span className={c("add-text")}>
                            <span className={c("add-title")}>Open disk image…</span>
                            <span className={c("text-muted")}>Scan a VHD, VHDX, IMG or ISO file</span>
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </section>
            );
          })}
        </section>

        <aside className={c("dash-side")}>
          <div className={c("card side-card")}>
            <div className={c("side-head")}>
              <span className={c("side-title")}>Recent scans</span>
              <span style={{ flex: 1 }} />
              {recent.length > 0 && (
                <button className={c("link-btn")} onClick={onRecentTab}>
                  See all
                </button>
              )}
            </div>
            {recent.slice(0, 4).map((r) => (
              <RecentRow key={r.id} r={r} compact onOpen={() => onOpenRecent(r)} onRemove={() => onRemoveRecent(r)} />
            ))}
            {recent.length === 0 && (
              <div className={c("side-empty")}>
                <span>Scans you run show up here, so you can open them again later without scanning.</span>
              </div>
            )}
          </div>

          <div className={c("card side-card")}>
            <div className={c("side-head")}>
              <span className={c("side-title")}>Quick tools</span>
            </div>
            {QUICK_TOOLS.map((t) => (
              <button key={t.id} className={c("quick-tool")} onClick={() => onTool(t.id)}>
                <span className={c("quick-icon", `tone-${t.tone}`)}>{t.icon(18)}</span>
                <span className={c("quick-text")}>
                  <span className={c("quick-title")}>{t.title}</span>
                  <span className={c("quick-sub")}>{t.short}</span>
                </span>
                <IconChevron size={14} className={c("quick-chev")} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ scan type window

const FORCE = ["NTFS", "exFAT", "FAT32", "FAT16", "FAT12"];

export function ScanTypeDialog({ target, onCancel, onStart }: { target: ScanTarget; onCancel: () => void; onStart: (deep: boolean) => void }) {
  const [deep, setDeep] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const [forceFs, setForceFs] = useState<string | null>(null);
  const [kinds, setKinds] = useState<Set<Kind>>(new Set(KIND_ORDER));
  const [freeOnly, setFreeOnly] = useState(false);
  const noKinds = deep && kinds.size === 0;
  const fsShown = forceFs ?? target.fs;
  const minutes = fullMinutes(target.drive, target.volume);

  const toggleKind = (k: Kind) =>
    setKinds((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <Modal
      title={`Scan ${target.title}`}
      wide
      onCancel={onCancel}
      actions={
        <>
          <button className={c("btn btn-primary")} onClick={() => onStart(deep)} disabled={noKinds}>
            {deep ? "Start full scan" : "Start quick scan"}
          </button>
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary")} onClick={onCancel}>
            Cancel
          </button>
        </>
      }
    >
      <div className={c("scan-types")} role="radiogroup" aria-label="Kind of scan">
        <button type="button" role="radio" aria-checked={!deep} className={c("scan-type", !deep && "on")} onClick={() => setDeep(false)}>
          <span className={c("scan-type-head")}>
            <span className={c("scan-type-icon tone-green")}>
              <IconSearch size={20} />
            </span>
            <span className={c("scan-type-title")}>Quick scan</span>
            <span className={c("scan-type-radio")} aria-hidden="true" />
          </span>
          <span className={c("scan-type-text")}>Reads the drive&apos;s own list of files, including deleted ones, with their names and folders.</span>
          <span className={c("scan-type-foot")}>
            <span className={c("pill pill-soft")}>{fsShown || "Finds the format by itself"}</span>
            <span className={c("scan-type-time")}>Fast</span>
          </span>
        </button>
        <button type="button" role="radio" aria-checked={deep} className={c("scan-type", deep && "on")} onClick={() => setDeep(true)}>
          <span className={c("scan-type-head")}>
            <span className={c("scan-type-icon tone-violet")}>
              <IconLayers size={20} />
            </span>
            <span className={c("scan-type-title")}>Full scan</span>
            <span className={c("scan-type-radio")} aria-hidden="true" />
          </span>
          <span className={c("scan-type-text")}>
            A quick scan, then a search of the whole drive for lost files, file records and folders. For formatted or damaged drives.
          </span>
          <span className={c("scan-type-foot")}>
            <span className={c("pill pill-soft")}>Reads all {humanSize(target.size)}</span>
            <span className={c("scan-type-time")}>About {minutes} min</span>
          </span>
        </button>
      </div>

      <button className={c("link-btn adv-toggle", advanced && "open")} onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}>
        Advanced options
        <IconChevron size={13} />
      </button>
      {advanced && (
        <div className={c("scan-adv")}>
          <div className={c("adv-row stack")}>
            <div className={c("adv-label")}>
              <div className={c("adv-title")}>Read the drive as</div>
              <div className={c("adv-help")}>If the start of the drive was damaged, or it was formatted to a different type, choose what it used to be.</div>
            </div>
            <div className={c("segmented seg-wrap")} role="radiogroup" aria-label="Read the drive as">
              <button role="radio" aria-checked={forceFs === null} className={c(forceFs === null && "active")} onClick={() => setForceFs(null)}>
                Find by itself
              </button>
              {FORCE.map((f) => (
                <button key={f} role="radio" aria-checked={forceFs === f} className={c(forceFs === f && "active")} onClick={() => setForceFs(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className={c("adv-row", !deep && "dim")}>
            <div className={c("adv-label")}>
              <div className={c("adv-title")}>Look for</div>
              <div className={c("adv-help")}>{deep ? "Types the full scan searches for by their contents." : "Used by the full scan."}</div>
            </div>
            <div className={c("adv-kinds")}>
              {KIND_ORDER.map((k) => (
                <label key={k} className={c("adv-kind", `kind-${k}`, kinds.has(k) && "on")}>
                  <input type="checkbox" checked={kinds.has(k)} disabled={!deep} onChange={() => toggleKind(k)} />
                  <KindIcon kind={k} size={15} />
                  {KIND_LABEL[k]}
                </label>
              ))}
            </div>
          </div>
          <div className={c("adv-row", !deep && "dim")}>
            <div className={c("adv-label")}>
              <div className={c("adv-title")}>Only search free space</div>
              <div className={c("adv-help")}>Faster: skips space that files still on the drive use. Deleted files are in free space.</div>
            </div>
            <Toggle checked={freeOnly} onChange={(v) => deep && setFreeOnly(v)} label="Only search free space" />
          </div>
        </div>
      )}

      {target.isSystem ? (
        <div className={c("tip tip-windows")}>
          <span className={c("tip-icon")}>
            <IconWindows size={15} />
          </span>
          <div>
            <b>This is the Windows drive.</b> Recover files to a different drive, like a USB drive, so nothing you want back gets written over. Windows
            keeps writing to this drive, so the sooner you scan, the better.
          </div>
        </div>
      ) : (
        <div className={c("tip")}>
          <span className={c("tip-icon")}>
            <IconInfo size={15} />
          </span>
          <div>Nothing on the drive is changed. You can stop a scan any time and carry on later.</div>
        </div>
      )}
    </Modal>
  );
}
