"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDemo } from "../AppWindow";
import { DRIVES, HEALTH, HEALTH_DOT, HEALTH_LABEL, driveLetters } from "./data";
import type { ScanTarget } from "./home";
import {
  DriveIcon,
  IconBack,
  IconBackup,
  IconHealth,
  IconLost,
  IconSectors,
  IconWrite,
  ProChip,
  Toggle,
  c,
  humanSize,
  n,
} from "./ui";

export type ToolId = "write" | "backup" | "health" | "partitions" | "sectors";

export const TOOLS: { id: ToolId; title: string; sub: string; short: string; icon: (size: number) => ReactNode; tone: string; advanced?: boolean; pro?: boolean }[] = [
  {
    id: "write",
    title: "Write image to drive",
    sub: "Put a VHD, VHDX or disk image onto a USB drive byte for byte, then check the copy.",
    short: "Put an image onto a USB drive",
    icon: (s) => <IconWrite size={s} />,
    tone: "green",
    pro: true,
  },
  {
    id: "backup",
    title: "Disk backup image",
    sub: "Copy a whole drive to an image file, so a failing drive is read only once and the copy is scanned instead.",
    short: "Copy a drive to an image file",
    icon: (s) => <IconBackup size={s} />,
    tone: "blue",
  },
  {
    id: "health",
    title: "Drive health",
    sub: "Temperature, wear and errors each drive reports about itself, in plain words.",
    short: "Wear, temperature and errors",
    icon: (s) => <IconHealth size={s} />,
    tone: "red",
  },
  {
    id: "partitions",
    title: "Find lost partitions",
    sub: "Find partitions that were deleted or vanished from a drive, then scan their files.",
    short: "Bring back vanished partitions",
    icon: (s) => <IconLost size={s} />,
    tone: "amber",
  },
  {
    id: "sectors",
    title: "Sector viewer",
    sub: "A drive's raw contents as hex and text, with partition tables and boot sectors labeled.",
    short: "A drive's raw contents, labeled",
    icon: (s) => <IconSectors size={s} />,
    tone: "violet",
    advanced: true,
  },
];

export const QUICK_TOOLS = TOOLS.filter((t) => !t.advanced);

function Head({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className={c("page-head")}>
      <div>
        <div className={c("page-title")}>{title}</div>
        <div className={c("page-sub")}>{sub}</div>
      </div>
      <span style={{ flex: 1 }} />
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ write image

function WriteImage({ onPro }: { onPro: () => void }) {
  const { notify } = useDemo();
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<number | null>(2);
  const [confirm, setConfirm] = useState("");
  const targets = DRIVES.filter((d) => (showAll ? !d.isSystem && d.bus !== "virtual" : d.group === "usb"));
  const target = DRIVES.find((d) => d.id === selected && targets.includes(d)) ?? null;
  const code = target ? String(3957 + target.id * 211) : "";
  const ready = !!target && (confirm.trim() === code || confirm.trim().toLowerCase() === target.name.toLowerCase());
  const letters = target ? driveLetters(target) : "";

  return (
    <div className={c("pane scroll")}>
      <Head title="Write image to drive" sub="Copies a VHD, VHDX or disk image onto a drive exactly, byte for byte, then reads the drive back to check the copy." />
      <div className={c("card step-card")}>
        <div className={c("step-head")}>
          <span className={c("step-num")}>1</span>
          <span className={c("step-title")}>Choose the image</span>
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this opens a disk image file from your PC.")}>
            Choose another…
          </button>
        </div>
        <div className={c("facts")}>
          <div className={c("fact fact-wide")}>
            <span className={c("text-muted")}>File</span>
            <span className={c("fact-value")}>Old Laptop Backup.vhd</span>
          </div>
          <div className={c("fact")}>
            <span className={c("text-muted")}>Type</span>
            <span className={c("fact-value")}>VHD (dynamic)</span>
          </div>
          <div className={c("fact")}>
            <span className={c("text-muted")}>Disk size</span>
            <span className={c("fact-value")}>8.6 GB</span>
          </div>
          <div className={c("fact")}>
            <span className={c("text-muted")}>Sector size</span>
            <span className={c("fact-value")}>512 bytes</span>
          </div>
          <div className={c("fact")}>
            <span className={c("text-muted")}>File size</span>
            <span className={c("fact-value")}>3.4 GB</span>
          </div>
        </div>
      </div>

      <div className={c("card step-card")}>
        <div className={c("step-head")}>
          <span className={c("step-num")}>2</span>
          <span className={c("step-title")}>Choose the drive</span>
          <span style={{ flex: 1 }} />
          <label className={c("inline-toggle")}>
            <span className={c("text-muted")}>Show all drives (not Windows)</span>
            <Toggle checked={showAll} onChange={setShowAll} label="Show all drives (not Windows)" />
          </label>
          <button className={c("btn btn-secondary btn-small")} onClick={() => notify("No new drives found.")}>
            Refresh
          </button>
        </div>
        {showAll && (
          <div className={c("step-note")} style={{ color: "var(--warning)" }}>
            Showing internal drives too. Double-check which one you pick: writing erases it completely.
          </div>
        )}
        <div className={c("target-list")}>
          {targets.map((d) => {
            const l = driveLetters(d);
            return (
              <button
                key={d.id}
                className={c("target-row", selected === d.id && "selected erase")}
                onClick={() => {
                  setSelected(d.id);
                  setConfirm("");
                }}
              >
                <DriveIcon d={d} size={18} />
                <b>{d.name}</b>
                <span className={c("text-muted")} style={{ fontSize: 11.5 }}>
                  {humanSize(d.size)} · {d.busLabel}
                  {l && ` · ${l}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {target && (
        <div className={c("card step-card erase-card")}>
          <div className={c("erase-title")}>
            Everything on {target.name}
            {letters && ` (${letters})`} will be erased.
          </div>
          <div className={c("text-secondary step-note")}>
            The whole drive is replaced by the image, including its partitions. This can&apos;t be undone. To confirm, type the drive&apos;s name{" "}
            <b style={{ color: "#fff" }}>{target.name}</b> or the code <b style={{ color: "#fff" }}>{code}</b>.
          </div>
          <div className={c("confirm-row")}>
            <input
              className={c("text-input")}
              placeholder={`Type ${code} here`}
              value={confirm}
              spellCheck={false}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button className={c("btn btn-danger")} disabled={!ready} onClick={onPro}>
              Write
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ backup image

function BackupImage() {
  const { notify } = useDemo();
  const [selected, setSelected] = useState<number | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const d = selected !== null ? DRIVES[selected] : null;
  return (
    <div className={c("pane scroll")}>
      <Head title="Disk backup image" sub="Copies a whole drive into one image file, skipping past bad areas first and going back for them later. Scan the image instead of a failing drive." />
      <div className={c("card step-card")}>
        <div className={c("step-head")}>
          <span className={c("step-num")}>1</span>
          <span className={c("step-title")}>Choose the drive to copy</span>
        </div>
        <div className={c("target-list")}>
          {DRIVES.filter((x) => x.bus !== "virtual").map((x) => (
            <button key={x.id} className={c("target-row", selected === x.id && "selected")} onClick={() => setSelected(x.id)}>
              <DriveIcon d={x} size={18} />
              <b>{x.name}</b>
              <span className={c("text-muted")} style={{ fontSize: 11.5 }}>
                {humanSize(x.size)} · {x.busLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className={c("card step-card")}>
        <div className={c("step-head")}>
          <span className={c("step-num")}>2</span>
          <span className={c("step-title")}>Choose where to save it</span>
          <span style={{ flex: 1 }} />
          <button
            className={c("btn btn-secondary btn-small")}
            disabled={!d}
            onClick={() => {
              if (!d) return;
              setDest(`E:\\Backups\\${d.name}.img`);
              notify("In the app, Windows asks where to save the image. Here's an example.");
            }}
          >
            {dest ? "Choose another…" : "Save as…"}
          </button>
        </div>
        {dest && d ? (
          <div className={c("facts")}>
            <div className={c("fact fact-wide")}>
              <span className={c("text-muted")}>File</span>
              <span className={c("fact-value")}>{dest}</span>
            </div>
            <div className={c("fact")}>
              <span className={c("text-muted")}>Size</span>
              <span className={c("fact-value")}>{humanSize(d.size)}</span>
            </div>
            <div className={c("fact")}>
              <span className={c("text-muted")}>Kind</span>
              <span className={c("fact-value")}>Disk image (.img)</span>
            </div>
          </div>
        ) : (
          <div className={c("text-muted step-note")}>{d ? "Save it on a different drive, with room for the whole drive." : "Pick a drive first."}</div>
        )}
        <div className={c("toolbar")}>
          <button
            className={c("btn btn-primary")}
            disabled={!dest}
            onClick={() => notify("In the app, this copies the whole drive into the image file. The drive itself isn't changed.")}
          >
            Start backup
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ drive health

function DriveHealth({ focus }: { focus: number | null }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className={c("pane scroll")}>
      <Head title="Drive health" sub="What each drive reports about its own wear and errors. Nothing is written to the drives.">
        <button
          className={c("btn btn-secondary btn-small")}
          disabled={busy}
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => setBusy(false), 1100);
          }}
        >
          {busy ? "Asking the drives…" : "Refresh"}
        </button>
      </Head>
      {HEALTH.map((h) => (
        <div key={h.drive} className={c("card step-card health-card", `health-${h.status}`, focus === h.drive && "focused")}>
          <div className={c("step-head")}>
            <span className={c("step-title")}>{h.name}</span>
            <span style={{ flex: 1 }} />
            <span className={c("pill")}>
              <span className={c("pill-dot", HEALTH_DOT[h.status])} />
              {HEALTH_LABEL[h.status]}
            </span>
          </div>
          <ul className={c("health-reasons")}>
            {h.reasons.map((r) => (
              <li key={r} className={c(h.status === "caution" ? "text-secondary" : "text-muted")}>
                {r}
              </li>
            ))}
          </ul>
          {h.facts.length > 0 && (
            <div className={c("facts")}>
              {h.facts.map(([k, v]) => (
                <div key={k} className={c("fact")}>
                  <span className={c("text-muted")}>{k}</span>
                  <span className={c("fact-value")}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ lost partitions

const LOST: Record<number, { name: string; fs: string; meta: string; size: number }[]> = {
  2: [{ name: "Photos backup", fs: "NTFS", meta: "24.0 GB · starts at 16.0 GB (sector 31,250,000) · Found by its backup copy (its first sector is gone)", size: 24 * 1e9 }],
  3: [{ name: "EOS_DIGITAL", fs: "exFAT", meta: "31.9 GB · starts at 4.2 MB (sector 8,192) · Listed in an old partition table", size: 31.9 * 1e9 }],
};

function LostPartitions({ focus, onScan }: { focus: number | null; onScan: (t: ScanTarget) => void }) {
  const { notify } = useDemo();
  const [selected, setSelected] = useState<number | null>(focus ?? 2);
  const [state, setState] = useState<Record<number, "searching" | "done">>({});
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current && window.clearInterval(timer.current)), []);

  const d = selected !== null ? DRIVES[selected] : null;
  const st = d ? state[d.id] : undefined;
  const search = () => {
    if (!d) return;
    const id = d.id;
    setState((s) => ({ ...s, [id]: "searching" }));
    setProgress(0);
    if (timer.current) window.clearInterval(timer.current);
    let p = 0;
    timer.current = window.setInterval(() => {
      p += 0.05;
      setProgress(Math.min(1, p));
      if (p >= 1) {
        if (timer.current) window.clearInterval(timer.current);
        setState((s) => ({ ...s, [id]: "done" }));
      }
    }, 90);
  };

  return (
    <div className={c("pane scroll")}>
      <Head title="Find lost partitions" sub="Finds partitions that were deleted or dropped from the partition list, so their files can be scanned. The drive isn't changed.">
        <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this opens a disk image file to search.")}>
          Open disk image…
        </button>
      </Head>
      <div className={c("card step-card")}>
        <div className={c("target-list")}>
          {DRIVES.map((x) => (
            <button key={x.id} className={c("target-row", selected === x.id && "selected")} onClick={() => setSelected(x.id)}>
              <DriveIcon d={x} size={18} />
              <b>{x.name}</b>
              <span className={c("text-muted")} style={{ fontSize: 11.5 }}>
                {humanSize(x.size)} · {x.busLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
      {d && (
        <div className={c("card step-card lost-search")}>
          <div className={c("step-title")}>{d.name}</div>
          <div className={c("toolbar")}>
            <button className={c("btn btn-primary btn-small")} onClick={search} disabled={st === "searching"}>
              {st === "done" ? "Search again" : "Search this drive"}
            </button>
            <span className={c("text-muted")} style={{ fontSize: 12 }}>
              Reads the whole drive once. Nothing on it is changed.
            </span>
          </div>
          {st === "searching" && (
            <>
              <div className={c("text-secondary")} style={{ fontSize: 12 }}>
                Searching… {Math.floor(progress * 100)}%
              </div>
              <div className={c("busy-bar")}>
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            </>
          )}
          {st === "done" &&
            (LOST[d.id] ? (
              LOST[d.id].map((p) => (
                <div key={p.name} className={c("lost-row")}>
                  <div className={c("lost-main")}>
                    <div className={c("lost-name")}>
                      {p.name} <span className={c("text-muted")} style={{ fontWeight: 400 }}>· {p.fs}</span>
                    </div>
                    <div className={c("lost-meta text-muted")}>{p.meta}</div>
                  </div>
                  <button className={c("btn btn-secondary btn-tiny")} onClick={() => onScan({ drive: d.id, title: p.name, size: p.size, isSystem: false, fs: p.fs })}>
                    Scan
                  </button>
                </div>
              ))
            ) : (
              <div className={c("text-muted step-note")}>No lost partitions: everything found is already in the partition list.</div>
            ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ sector viewer

const FIELDS: { from: number; to: number; name: string; value: string; tone: string; cls: string }[] = [
  { from: 0, to: 0x1b8, name: "Boot code", value: "440 bytes", tone: "160, 176, 200", cls: "f0" },
  { from: 0x1b8, to: 0x1bc, name: "Disk signature", value: "0x00000000", tone: "46, 213, 115", cls: "f1" },
  { from: 0x1be, to: 0x1bf, name: "Entry 1: active", value: "No", tone: "84, 160, 255", cls: "f4" },
  { from: 0x1c2, to: 0x1c3, name: "Entry 1: type", value: "0xEE (GPT protective)", tone: "255, 168, 0", cls: "f2" },
  { from: 0x1c6, to: 0x1ca, name: "Entry 1: first sector", value: "1", tone: "163, 123, 255", cls: "f3" },
  { from: 0x1ca, to: 0x1ce, name: "Entry 1: sectors", value: "4,294,967,295", tone: "0, 212, 255", cls: "f4" },
  { from: 0x1ce, to: 0x1fe, name: "Entries 2–4", value: "Empty", tone: "255, 92, 92", cls: "f5" },
  { from: 0x1fe, to: 0x200, name: "Signature", value: "55 AA (valid)", tone: "255, 200, 90", cls: "f6" },
];

const SECTOR0: number[] = (() => {
  let s = 99;
  const b = Array.from({ length: 512 }, (_, i) => {
    if (i >= 0x1b8) return 0;
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s >>> 16) & 0xff;
  });
  b[0x1c2] = 0xee;
  b[0x1c6] = 1;
  [0x1ca, 0x1cb, 0x1cc, 0x1cd].forEach((i) => (b[i] = 0xff));
  b[0x1bf] = 0;
  b[0x1c0] = 2;
  b[0x1fe] = 0x55;
  b[0x1ff] = 0xaa;
  return b;
})();

const fieldAt = (i: number) => FIELDS.find((f) => i >= f.from && i < f.to);
const hex2 = (b: number) => b.toString(16).padStart(2, "0").toUpperCase();

function SectorViewer() {
  const { notify } = useDemo();
  const [drive, setDrive] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const d = DRIVES[drive];
  return (
    <div className={c("pane")}>
      <Head title="Sector viewer" sub="A drive's raw contents, read-only. Structures at the top of the view are labeled.">
        <select className={c("select")} value={drive} onChange={(e) => setDrive(Number(e.target.value))} aria-label="Drive">
          {DRIVES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this opens a disk image file to look inside.")}>
          Open disk image…
        </button>
      </Head>
      <div style={{ fontSize: 12 }}>
        <b>{d.name}</b>{" "}
        <span className={c("text-muted")}>
          {humanSize(d.size)} · {n(Math.floor(d.size / 512))} sectors of 512 bytes
        </span>
      </div>
      <div className={c("sector-body")}>
        <div className={c("card hex-card")}>
          {Array.from({ length: 32 }, (_, row) => {
            const o = row * 16;
            const bytes = SECTOR0.slice(o, o + 16);
            return (
              <div key={row} className={c("hex-line")}>
                <span className={c("hex-off")}>{o.toString(16).padStart(10, "0").toUpperCase()}</span>
                <span className={c("hex-bytes")}>
                  {bytes.map((b, i) => {
                    const f = fieldAt(o + i);
                    const lit = f && (hover === null || hover === f.name);
                    return (
                      <span key={i} className={c(lit && f.cls)}>
                        {hex2(b)}
                        {i < 15 ? (i === 7 ? "  " : " ") : ""}
                      </span>
                    );
                  })}
                </span>
                <span className={c("hex-ascii")}>{bytes.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : "·")).join("")}</span>
              </div>
            );
          })}
        </div>
        <div className={c("card fields-card")}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            Partition table (MBR) <span className={c("text-muted")}>at sector 0</span>
          </div>
          {FIELDS.map((f) => (
            <div
              key={f.name}
              className={c("field-row")}
              style={{ ["--tone" as string]: f.tone }}
              onMouseEnter={() => setHover(f.name)}
              onMouseLeave={() => setHover(null)}
            >
              <b>{f.name}</b>
              <span className={c("field-off")}>+{f.from.toString(16).toUpperCase()}</span>
              <span className={c("mono")}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ the Tools tab

export function ToolsView({
  open,
  focus,
  advanced,
  onOpen,
  onSettings,
  onScan,
  onPro,
}: {
  open: ToolId | null;
  focus: number | null;
  advanced: boolean;
  onOpen: (t: ToolId | null) => void;
  onSettings: () => void;
  onScan: (t: ScanTarget) => void;
  onPro: () => void;
}) {
  if (!open) {
    const shown = TOOLS.filter((t) => !t.advanced || advanced);
    return (
      <div className={c("pane scroll")}>
        <Head title="Tools" sub="For drives that need more than a scan. None of them change a drive unless they say so first." />
        <div className={c("tool-grid")}>
          {shown.map((t) => (
            <button key={t.id} className={c("card tool-card")} onClick={() => onOpen(t.id)}>
              <span className={c("tool-icon", `tone-${t.tone}`)}>{t.icon(26)}</span>
              <span className={c("tool-title")}>
                {t.title}
                {t.pro && <ProChip />}
              </span>
              <span className={c("tool-sub")}>{t.sub}</span>
            </button>
          ))}
        </div>
        {!advanced && (
          <div className={c("tool-hint")}>
            Looking for the Sector viewer? It&apos;s part of Advanced mode.{" "}
            <button className={c("link-btn")} style={{ color: "#fff" }} onClick={onSettings}>
              Turn it on in Settings
            </button>
          </div>
        )}
      </div>
    );
  }
  const t = TOOLS.find((x) => x.id === open)!;
  return (
    <div className={c("pane")} style={{ gap: 10 }}>
      <div className={c("crumbs")}>
        <button className={c("back-btn")} onClick={() => onOpen(null)}>
          <IconBack size={14} /> Tools
        </button>
        <span className={c("crumb-sep")}>/</span>
        <span className={c("crumb-here")}>{t.title}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {open === "write" && <WriteImage onPro={onPro} />}
        {open === "backup" && <BackupImage />}
        {open === "health" && <DriveHealth focus={focus} />}
        {open === "partitions" && <LostPartitions key={focus ?? -1} focus={focus} onScan={onScan} />}
        {open === "sectors" && <SectorViewer />}
      </div>
    </div>
  );
}

