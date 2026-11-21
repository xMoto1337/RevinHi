"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CONFIDENCE_LABEL, CRASHES, FIXES, GHOSTS, HARDWARE, OLD, PACKAGES, PROBLEM_DEVICES, deviceName, type Crash, type FixId, type ProblemDevice } from "./data";
import { useDrv, type Feature } from "./store";
import {
  DeviceIcon,
  IconBack,
  IconBluetooth,
  IconBox,
  IconCheck,
  IconChip,
  IconClock,
  IconDisplay,
  IconHistory,
  IconInfo,
  IconNetwork,
  IconRefresh,
  IconShield,
  IconSpeaker,
  IconTrash,
  IconUpdate,
  IconUsb,
  IconWarn,
  IconWrench,
  IconX,
  LockIcon,
  SettingRow,
  SkeletonRows,
  Toggle,
  c,
  driverDate,
  humanSize,
  kindName,
  plural,
} from "./ui";

// The Tools tab (views/ToolsView.tsx and tools/*): a grid of tool cards; a tool opens in this tab
// with a back crumb. Lists use the sample PC; anything that would write to a drive or change the PC
// plays out its steps here and ends with a note saying what the app does.

export type ToolId = "offline" | "rescue" | "backup" | "restore" | "old" | "ghosts" | "problems" | "crash" | "fixes" | "keep" | "schedule" | "hardware";

const TOOLS: { id: ToolId; title: string; sub: string; icon: ReactNode; tone: string; pro?: boolean }[] = [
  { id: "offline", title: "Offline updater", sub: "Update drivers on a PC without internet: save its hardware list, build a pack on another PC, install it there.", icon: <IconBox size={22} />, tone: "blue", pro: true },
  { id: "rescue", title: "Network rescue", sub: "Put network and Wi-Fi drivers on a USB stick for a PC that can't get online.", icon: <IconNetwork size={22} />, tone: "green" },
  { id: "backup", title: "Back up drivers", sub: "Save this PC's drivers to a folder or .zip, to put back any time.", icon: <IconShield size={22} />, tone: "violet" },
  { id: "restore", title: "Restore drivers", sub: "Put back drivers from a backup. To undo one update, use Roll back in the History tab.", icon: <IconHistory size={22} />, tone: "amber", pro: true },
  { id: "old", title: "Old driver cleanup", sub: "Older copies of drivers Windows keeps after updates, that nothing uses any more.", icon: <IconTrash size={22} />, tone: "red", pro: true },
  { id: "ghosts", title: "Unplugged devices", sub: "Devices Windows still remembers that aren't plugged in: old mice, phones, USB sticks.", icon: <IconUsb size={22} />, tone: "cyan", pro: true },
  { id: "problems", title: "Problem devices", sub: "Devices with a yellow mark in Device Manager, explained in plain words, with a fix.", icon: <IconWarn size={22} />, tone: "amber" },
  { id: "crash", title: "Crash driver finder", sub: "Read Windows' crash reports and name the driver most likely behind a blue screen.", icon: <IconWarn size={22} />, tone: "red" },
  { id: "fixes", title: "One-click fixes", sub: "No sound, no internet, wrong screen resolution, USB not recognized, Bluetooth: plain steps that can be undone.", icon: <IconWrench size={22} />, tone: "green" },
  { id: "keep", title: "Keep drivers as they are", sub: "Devices whose updates you ignore, and stopping Windows Update from replacing drivers.", icon: <IconShield size={22} />, tone: "blue" },
  { id: "schedule", title: "Scheduled scan", sub: "Scan when you sign in or once a week, and get a quiet note when updates are found. Off until you turn it on.", icon: <IconClock size={22} />, tone: "violet" },
  { id: "hardware", title: "Hardware info", sub: "What's inside this PC: processor, graphics, memory, drives, network and more.", icon: <IconChip size={22} />, tone: "cyan" },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const toggle = (set: Set<string>, key: string) => {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
};

// ------------------------------------------------------------------ a tool's job (toolStore + tools/common.tsx)

interface Line {
  key: string;
  name: string;
  ok: boolean | null;
  detail: string | null;
}

interface Job {
  running: boolean;
  step: string;
  fraction: number | null;
  lines: Line[];
  title: string;
  extra: ReactNode;
  note: string | null;
}

interface JobCtl {
  step: (text: string, fraction?: number | null) => void;
  lines: (l: Line[]) => void;
  line: (i: number, ok: boolean, detail?: string | null) => void;
  wait: (ms: number) => Promise<void>;
}

/** One tool's job: what it's doing, how far, a line per item, then a calm summary. */
function useJob() {
  const [job, setJob] = useState<Job | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const run = useCallback(async (first: string, work: (ctl: JobCtl) => Promise<{ title: string; extra?: ReactNode; note?: string | null }>, done?: string) => {
    const j: Job = { running: true, step: first, fraction: null, lines: [], title: "", extra: null, note: null };
    const push = () => alive.current && setJob({ ...j, lines: j.lines.map((l) => ({ ...l })) });
    push();
    const ctl: JobCtl = {
      step: (text, fraction = null) => {
        j.step = text;
        j.fraction = fraction;
        push();
      },
      lines: (l) => {
        j.lines = l;
        push();
      },
      line: (i, ok, detail = null) => {
        j.lines[i] = { ...j.lines[i], ok, detail };
        push();
      },
      wait: sleep,
    };
    const r = await work(ctl);
    j.running = false;
    j.fraction = null;
    j.title = r.title;
    j.extra = r.extra ?? null;
    j.note = r.note ?? null;
    push();
    return done;
  }, []);
  return { job, run, clear: () => setJob(null) };
}

function JobLines({ lines }: { lines: Line[] }) {
  return (
    <div className={c("tl-lines")}>
      {lines.map((l) => (
        <div key={l.key} className={c("tl-line", l.ok == null ? "waiting" : l.ok ? "ok" : "bad")}>
          <span className={c("tl-line-mark")}>{l.ok == null ? <span className={c("step-spin")} /> : l.ok ? <IconCheck size={12} /> : <IconInfo size={12} />}</span>
          <span className={c("tl-line-name")}>{l.name}</span>
          {l.detail && <span className={c("tl-line-detail text-muted")}>{l.detail}</span>}
        </div>
      ))}
    </div>
  );
}

function JobView({ job, onClose }: { job: Job | null; onClose: () => void }) {
  if (!job) return null;
  if (job.running) {
    const pct = job.fraction != null ? Math.round(Math.min(1, Math.max(0, job.fraction)) * 100) : null;
    return (
      <div className={c("card tl-job running")} role="status">
        <div className={c("ib-head")}>
          <span className={c("step-spin big")} />
          <div className={c("ib-title")}>{job.step}</div>
          {pct != null && <span className={c("ib-pct num")}>{pct}%</span>}
        </div>
        <div className={c("progress-bar")}>
          <div className={c("progress-fill", pct == null && "indeterminate")} style={{ width: `${pct ?? 35}%` }} />
        </div>
        {job.lines.length > 0 && <JobLines lines={job.lines} />}
        <div className={c("ib-sub text-muted")}>You can look at other tools or tabs meanwhile; this keeps going.</div>
      </div>
    );
  }
  return (
    <div className={c("card tl-job finished")} role="status">
      <div className={c("ib-head")}>
        <span className={c("ib-mark")}>
          <IconCheck size={15} />
        </span>
        <div className={c("ib-title")}>{job.title}</div>
        <button className={c("icon-btn icon-btn-sm")} onClick={onClose} aria-label="Close">
          <IconX size={12} />
        </button>
      </div>
      {job.lines.length > 0 && <JobLines lines={job.lines} />}
      {job.extra}
      {job.note && (
        <div className={c("ib-sub text-muted")}>
          <span>{job.note}</span>
        </div>
      )}
    </div>
  );
}

/** A button for something Pro does: for free users it shows a lock and the click opens the upgrade window. */
function ActionButton({ feature, onClick, disabled, children, kind = "primary" }: { feature?: Feature; onClick: () => void; disabled?: boolean; children: ReactNode; kind?: "primary" | "secondary" }) {
  const { pro, openPaywall } = useDrv();
  const locked = !!feature && !pro;
  return (
    <button className={c("btn", `btn-${kind}`)} onClick={() => (locked && feature ? openPaywall(feature) : onClick())} disabled={disabled} title={locked ? "A Pro feature" : undefined}>
      {locked && <LockIcon size={11} />}
      {children}
    </button>
  );
}

function SafetyNote({ children }: { children: ReactNode }) {
  return (
    <div className={c("tl-safety text-muted")}>
      <IconShield size={12} /> {children}
    </div>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className={c("chk-cell")} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} />
    </label>
  );
}

/** Where something is saved: a folder (or USB stick), as a folder or a .zip. */
function DestRow({ dest, setDest, zip, setZip }: { dest: string | null; setDest: (d: string) => void; zip: boolean; setZip: (z: boolean) => void }) {
  const { notify } = useDrv();
  return (
    <div className={c("tl-dest")}>
      <div className={c("tl-dest-main")}>
        <div className={c("tl-label")}>Save to</div>
        <div className={c("tl-path", !dest && "text-muted")}>{dest ?? "No folder picked yet"}</div>
      </div>
      <button
        className={c("btn btn-secondary btn-small")}
        onClick={() => {
          setDest("E:\\");
          notify("In the app, Windows' folder picker opens here. This preview picks a USB stick (E:).");
        }}
      >
        {dest ? "Change…" : "Pick a folder or USB stick…"}
      </button>
      <div className={c("segmented")} role="group" aria-label="Save as">
        <button className={c(!zip && "active")} onClick={() => setZip(false)}>
          Folder
        </button>
        <button className={c(zip && "active")} onClick={() => setZip(true)}>
          .zip file
        </button>
      </div>
    </div>
  );
}

/** A list that takes a moment to read, like the app's (skeleton rows first). */
function useLoaded(ms = 350) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return loaded;
}

// ------------------------------------------------------------------ back up / restore (tools/Backup.tsx)

function BackupTool() {
  const { notify } = useDrv();
  const { job, run, clear } = useJob();
  const loaded = useLoaded(250);
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(PACKAGES.map((p) => p.published)));
  const [dest, setDest] = useState<string | null>(null);
  const [zip, setZip] = useState(false);
  const picked = PACKAGES.filter((p) => ticked.has(p.published));
  const bytes = picked.reduce((s, p) => s + p.bytes, 0);
  const all = picked.length === PACKAGES.length;

  const backUp = () =>
    void run("Reading the driver list", async (j) => {
      for (let i = 0; i < picked.length; i++) {
        j.step(`Copying driver ${i + 1} of ${picked.length}`, ((i + 1) / picked.length) * (zip ? 0.6 : 1));
        await j.wait(220);
      }
      if (zip) {
        j.step("Writing the .zip file", 0.8);
        await j.wait(700);
      }
      notify("In the app, this saves copies of the drivers there. Nothing on the PC changes.");
      return {
        title: `${plural(picked.length, "driver")} backed up (${humanSize(bytes)})`,
        extra: (
          <div className={c("tl-result")}>
            Saved as <span className={c("mono")}>{`${dest}RevinHi Drivers backup ${today()}${zip ? ".zip" : ""}`}</span>
          </div>
        ),
      };
    });

  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>
        Saves this PC&apos;s drivers (the ones that didn&apos;t come with Windows) so they can be put back after Windows is reinstalled, or on a PC like this one. Nothing on this PC is changed.
      </p>
      <JobView job={job} onClose={clear} />
      <div className={c("card tl-card")}>
        <div className={c("tl-card-head")}>
          <div className={c("tl-card-title")}>Drivers on this PC</div>
          <span className={c("text-muted")}>{loaded ? `${plural(picked.length, "driver")} picked · ${humanSize(bytes)}` : "Reading the driver list…"}</span>
          <span style={{ flex: 1 }} />
          {loaded && (
            <button className={c("link-btn")} onClick={() => setTicked(all ? new Set() : new Set(PACKAGES.map((p) => p.published)))}>
              {all ? "Pick none" : "Pick all"}
            </button>
          )}
        </div>
        {!loaded && <SkeletonRows n={4} />}
        {loaded && (
          <div className={c("tl-list")}>
            {PACKAGES.map((p) => (
              <div key={p.published} className={c("tl-row")} onClick={() => setTicked((t) => toggle(t, p.published))}>
                <Check checked={ticked.has(p.published)} onChange={() => setTicked((t) => toggle(t, p.published))} label={p.original} />
                <div className={c("tl-row-main")}>
                  <div className={c("tl-row-name")}>{p.devices[0] ?? `${p.provider} ${kindName(p.class).toLowerCase()} driver`}</div>
                  <div className={c("tl-row-sub text-muted")}>
                    {p.provider} · {p.original} · {p.version} · {driverDate(p.date)}
                    {p.devices.length === 0 ? " · not used by a device now" : ""}
                  </div>
                </div>
                <span className={c("tl-size num")}>{humanSize(p.bytes)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={c("card tl-card")}>
        <DestRow dest={dest} setDest={setDest} zip={zip} setZip={setZip} />
        <div className={c("toolbar tl-actions")}>
          <ActionButton disabled={!dest || picked.length === 0 || !!job?.running} onClick={backUp}>
            <IconShield size={13} /> Back up {plural(picked.length, "driver")}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

const BACKUP = PACKAGES.slice(0, 6).map((p, i) => ({ ...p, name: p.devices[0] ?? p.original, complete: i !== 5 }));

function RestoreTool({ onHistory }: { onHistory: () => void }) {
  const { notify } = useDrv();
  const [opened, setOpened] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const open = (zip: boolean) => {
    setOpening(true);
    window.setTimeout(() => {
      setOpened(`RevinHi Drivers backup 2026-10-31${zip ? ".zip" : ""}`);
      setTicked(new Set(BACKUP.filter((x) => x.complete).map((x) => x.published)));
      setOpening(false);
    }, 300);
  };
  const picked = BACKUP.filter((p) => ticked.has(p.published));
  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>
        Puts back drivers from a backup made with Back up drivers. Windows only uses a restored driver where it fits a device better than the one it has, so nothing newer is swapped for something older.
      </p>
      <div className={c("calm-note")}>
        <IconHistory size={14} />
        <span>
          To undo one update, use Roll back in the{" "}
          <button className={c("link-btn")} onClick={onHistory}>
            History tab
          </button>
          : it puts back the driver that device had before.
        </span>
      </div>
      <div className={c("card tl-card")}>
        <div className={c("toolbar")}>
          <button className={c("btn btn-secondary")} onClick={() => open(false)} disabled={opening}>
            Open a backup folder…
          </button>
          <button className={c("btn btn-secondary")} onClick={() => open(true)} disabled={opening}>
            Open a .zip backup…
          </button>
          {opening && <span className={c("text-muted")}>Opening…</span>}
        </div>
        {opened && (
          <>
            <div className={c("tl-card-head")}>
              <div className={c("tl-card-title")}>{opened}</div>
              <span className={c("text-muted")}>Made 10/31/2026 on Windows 11 Home 24H2 · {plural(BACKUP.length, "driver")}</span>
            </div>
            <div className={c("tl-list")}>
              {BACKUP.map((p) => (
                <div key={p.published} className={c("tl-row", !p.complete && "muted")} onClick={() => p.complete && setTicked((t) => toggle(t, p.published))}>
                  <Check checked={ticked.has(p.published)} onChange={() => p.complete && setTicked((t) => toggle(t, p.published))} label={p.name} />
                  <div className={c("tl-row-main")}>
                    <div className={c("tl-row-name")}>{p.name}</div>
                    <div className={c("tl-row-sub text-muted")}>
                      {p.provider} · {p.original} · {p.version}
                      {!p.complete && " · files are missing from the backup"}
                    </div>
                  </div>
                  <span className={c("tl-size num")}>{humanSize(p.bytes)}</span>
                </div>
              ))}
            </div>
            <div className={c("toolbar tl-actions")}>
              <ActionButton feature="restore" disabled={picked.length === 0} onClick={() => notify("In the app, this puts these drivers back after a restore point.")}>
                Restore {plural(picked.length, "driver")}
              </ActionButton>
            </div>
            <SafetyNote>A restore point is made first, and each driver&apos;s signature is checked.</SafetyNote>
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ offline updater, network rescue (tools/Offline.tsx)

interface ListView {
  file: string;
  windows: string;
  devices: number;
  network: number;
  saved: string;
}

const OFFICE: ListView = { file: "Office PC.rdhw", windows: "Windows 10 Pro 22H2 (64-bit, build 19045)", devices: 128, network: 2, saved: "11/20/2026" };

function ListSummary({ v }: { v: ListView }) {
  return (
    <div className={c("tl-summary")}>
      <IconCheck size={13} />
      <span>
        <b>{v.file}</b> · {v.windows} · {plural(v.devices, "device")} ({plural(v.network, "network adapter")}) · saved {v.saved}
      </span>
    </div>
  );
}

function BuiltSummary({ items, bytes, path, leftOut }: { items: number; bytes: number; path: string; leftOut?: { device: string; why: string }[] }) {
  return (
    <div className={c("tl-result")}>
      <div>
        {plural(items, "driver")} ({humanSize(bytes)}) saved as <span className={c("mono")}>{path}</span>
      </div>
      {leftOut && leftOut.length > 0 && (
        <div className={c("tl-left")}>
          <div className={c("text-muted")}>Not in the pack:</div>
          {leftOut.map((l, i) => (
            <div key={i} className={c("text-muted")}>
              {l.device}: {l.why}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuiltInDrivers() {
  const { notify } = useDrv();
  const { job, run, clear } = useJob();
  return (
    <div className={c("card tl-card")}>
      <div className={c("tl-step-head")}>
        <span className={c("tl-step-icon tone-amber")}>
          <IconRefresh size={16} />
        </span>
        <div>
          <div className={c("tl-card-title")}>Try Windows&apos; built-in drivers</div>
          <div className={c("text-muted")}>On a PC without internet: Windows looks for hardware changes and sets up devices that have no driver yet from the drivers it already has.</div>
        </div>
      </div>
      <JobView job={job} onClose={clear} />
      <div className={c("toolbar tl-actions")}>
        <ActionButton
          kind="secondary"
          disabled={!!job?.running}
          onClick={() =>
            void run("Getting ready", async (j) => {
              j.step("Making a restore point");
              await j.wait(700);
              j.step("Looking for hardware changes and setting up devices", 0.5);
              await j.wait(1200);
              notify("In the app, Windows looks for hardware changes on your PC here, after a restore point.");
              return { title: "Windows had nothing for 1 device" };
            })
          }
        >
          Try Windows&apos; built-in drivers
        </ActionButton>
      </div>
    </div>
  );
}

const PACK = [
  { index: 0, device: "NVIDIA GeForce RTX 3060 Laptop GPU", title: "NVIDIA GeForce Game Ready Driver 621.01", source: "NVIDIA", bytes: 1037.2e6, here: true },
  { index: 1, device: "Realtek RTL8822CE 802.11ac PCIe Adapter", title: "Realtek Semiconductor Corp. - Net - 2024.0.10.230", source: "Microsoft", bytes: 18.9e6, here: true },
  { index: 2, device: "Intel(R) Wi-Fi 6 AX200 160MHz", title: "Intel Wi-Fi 24.70.0.3", source: "RevinHi", bytes: 54.4e6, here: false },
];

async function askSources(j: JobCtl) {
  j.step("Asking every driver source");
  j.lines(["Microsoft", "NVIDIA", "Intel", "RevinHi"].map((s) => ({ key: s, name: s, ok: null, detail: null })));
  const found = ["3 found", "1 found", "1 found", "nothing new"];
  for (let i = 0; i < 4; i++) {
    j.step("Asking every driver source", (0.4 * (i + 1)) / 4);
    await j.wait(350);
    j.line(i, true, found[i]);
  }
}

function OfflineTool() {
  const { notify } = useDrv();
  const { job, run, clear } = useJob();
  const [saved, setSaved] = useState<ListView | null>(null);
  const [list, setList] = useState<ListView | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [zip, setZip] = useState(false);
  const [pack, setPack] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  const build = () =>
    void run("Reading the hardware list", async (j) => {
      await askSources(j);
      for (let f = 0; f <= 1.001; f += 0.2) {
        j.step("Downloading 4 drivers", 0.4 + 0.45 * f);
        await j.wait(260);
      }
      j.step("Writing the pack", 0.97);
      await j.wait(300);
      notify("In the app, this downloads the drivers into one pack on your USB stick.");
      return {
        title: "Offline pack ready",
        extra: (
          <BuiltSummary
            items={4}
            bytes={1310e6}
            path={`${dest}RevinHi offline pack ${today()}${zip ? ".zip" : ""}`}
            leftOut={[{ device: "HP Wireless Button Driver", why: "Only Windows Update offers it, and Windows Update installs it on that PC itself once it's online." }]}
          />
        ),
      };
    });

  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>
        For a PC without internet: save its hardware list there, build a pack of updates for it on a PC that&apos;s online, then install the pack back on the first PC. A USB stick carries both.
      </p>

      <div className={c("card tl-card")}>
        <div className={c("tl-step-head")}>
          <span className={c("tl-step-num")}>1</span>
          <div>
            <div className={c("tl-card-title")}>On the PC without internet: save its hardware list</div>
            <div className={c("text-muted")}>A small .rdhw file with each device&apos;s IDs, its current driver, and the Windows version. No names, serial numbers or files of yours.</div>
          </div>
        </div>
        {saved && <ListSummary v={saved} />}
        <div className={c("toolbar tl-actions")}>
          <ActionButton
            kind="secondary"
            onClick={() => {
              setSaved({ file: "This PC.rdhw", windows: "Windows 11 Home 24H2 (64-bit, build 26100)", devices: 139, network: 2, saved: "11/20/2026" });
              notify("In the app, this saves the hardware list file where you pick, like a USB stick.");
            }}
          >
            Save this PC&apos;s hardware list…
          </ActionButton>
        </div>
      </div>

      <div className={c("card tl-card")}>
        <div className={c("tl-step-head")}>
          <span className={c("tl-step-num")}>2</span>
          <div>
            <div className={c("tl-card-title")}>On a PC with internet: build the offline pack</div>
            <div className={c("text-muted")}>Every driver source is asked about that PC&apos;s devices, with the same safety rules as a scan, and the drivers are downloaded into one pack.</div>
          </div>
        </div>
        <div className={c("toolbar")}>
          <button className={c("btn btn-secondary")} onClick={() => setList(OFFICE)}>
            {list ? "Pick another hardware list…" : "Pick the hardware list…"}
          </button>
        </div>
        {list && <ListSummary v={list} />}
        <JobView job={job} onClose={clear} />
        {list && (
          <>
            <DestRow dest={dest} setDest={setDest} zip={zip} setZip={setZip} />
            <div className={c("toolbar tl-actions")}>
              <ActionButton feature="offline" disabled={!dest || !!job?.running} onClick={build}>
                <IconBox size={13} /> Build offline pack
              </ActionButton>
            </div>
          </>
        )}
      </div>

      <div className={c("card tl-card")}>
        <div className={c("tl-step-head")}>
          <span className={c("tl-step-num")}>3</span>
          <div>
            <div className={c("tl-card-title")}>Back on the PC without internet: install the pack</div>
            <div className={c("text-muted")}>Each driver is checked again against what&apos;s installed now, then installed like any update.</div>
          </div>
        </div>
        <div className={c("toolbar")}>
          {["Open a pack folder…", "Open a .zip pack…"].map((label) => (
            <button
              key={label}
              className={c("btn btn-secondary")}
              onClick={() => {
                setPack(true);
                setTicked(new Set(PACK.filter((x) => x.here).map((x) => String(x.index))));
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {pack && (
          <>
            <div className={c("tl-card-head")}>
              <div className={c("tl-card-title")}>RevinHi offline pack 2026-11-19.zip</div>
              <span className={c("text-muted")}>For Windows 11 Home 24H2 · {plural(PACK.length, "driver")}</span>
            </div>
            <div className={c("tl-list")}>
              {PACK.map((it) => (
                <div key={it.index} className={c("tl-row", !it.here && "muted")} onClick={() => it.here && setTicked((t) => toggle(t, String(it.index)))}>
                  <Check checked={ticked.has(String(it.index))} onChange={() => it.here && setTicked((t) => toggle(t, String(it.index)))} label={it.device} />
                  <div className={c("tl-row-main")}>
                    <div className={c("tl-row-name")}>{it.device}</div>
                    <div className={c("tl-row-sub text-muted")}>
                      {it.title} · {it.source}
                      {!it.here && " · not plugged into this PC"}
                    </div>
                  </div>
                  <span className={c("tl-size num")}>{humanSize(it.bytes)}</span>
                </div>
              ))}
            </div>
            <div className={c("toolbar tl-actions")}>
              <ActionButton feature="offline" disabled={ticked.size === 0} onClick={() => notify("In the app, this installs the pack's drivers after a restore point. You can roll them back any time.")}>
                Install {plural(ticked.size, "driver")}
              </ActionButton>
            </div>
            <SafetyNote>A restore point and a backup of each old driver come first. Every change can be rolled back from the History tab.</SafetyNote>
          </>
        )}
      </div>

      <BuiltInDrivers />
    </div>
  );
}

function RescueTool() {
  const { notify } = useDrv();
  const { job, run, clear } = useJob();
  const [mode, setMode] = useState<"list" | "general">("general");
  const [list, setList] = useState<ListView | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [zip, setZip] = useState(false);

  const make = () =>
    void run("Reading the hardware list", async (j) => {
      if (mode === "list") await askSources(j);
      else {
        j.step("Reading RevinHi's driver list", 0.1);
        await j.wait(400);
      }
      const n = mode === "list" ? 2 : 1;
      for (let f = 0; f <= 1.001; f += 0.2) {
        j.step(`Downloading ${n} drivers`, 0.4 + 0.45 * f);
        await j.wait(220);
      }
      j.step("Writing the pack", 0.97);
      await j.wait(300);
      notify("In the app, this puts the network drivers on your USB stick.");
      return {
        title: "Network rescue pack ready",
        extra: (
          <>
            <BuiltSummary items={n} bytes={mode === "list" ? 73.1e6 : 54.4e6} path={`${dest}RevinHi network rescue ${today()}${zip ? ".zip" : ""}`} />
            <div className={c("text-muted")}>On the other PC, open &quot;HOW TO USE THIS ON THE PC WITHOUT INTERNET.txt&quot; in the pack.</div>
          </>
        ),
      };
    });

  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>
        For a PC that can&apos;t get online because its network driver is missing: put Ethernet and Wi-Fi drivers on a USB stick. The pack has a plain note on how to use it, and works even where
        RevinHi Drivers isn&apos;t installed.
      </p>
      <div className={c("card tl-card")}>
        <div className={c("segmented")} role="group" aria-label="Which drivers">
          <button className={c(mode === "general" && "active")} onClick={() => setMode("general")}>
            General set (Intel and Killer Wi-Fi)
          </button>
          <button className={c(mode === "list" && "active")} onClick={() => setMode("list")}>
            For a PC&apos;s hardware list
          </button>
        </div>
        {mode === "list" ? (
          <>
            <div className={c("text-muted")}>The network drivers made for that PC&apos;s own adapters. Save its hardware list there first (Offline updater, step 1).</div>
            <div className={c("toolbar")}>
              <button className={c("btn btn-secondary")} onClick={() => setList(OFFICE)}>
                {list ? "Pick another hardware list…" : "Pick the hardware list…"}
              </button>
            </div>
            {list && <ListSummary v={list} />}
          </>
        ) : (
          <div className={c("text-muted")}>Intel&apos;s Wi-Fi drivers from RevinHi&apos;s driver list, which also cover Killer cards. For other makers, use a hardware list.</div>
        )}
        <JobView job={job} onClose={clear} />
        <DestRow dest={dest} setDest={setDest} zip={zip} setZip={setZip} />
        <div className={c("toolbar tl-actions")}>
          <ActionButton disabled={!dest || (mode === "list" && !list) || !!job?.running} onClick={make}>
            <IconNetwork size={13} /> Make network rescue pack
          </ActionButton>
        </div>
      </div>
      <BuiltInDrivers />
    </div>
  );
}

// ------------------------------------------------------------------ cleanup, unplugged, problem devices (tools/Cleanup.tsx)

function Refresh({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button className={c("btn btn-secondary btn-small")} onClick={onClick} disabled={loading}>
      <IconRefresh size={12} /> {loading ? "Reading…" : "Check again"}
    </button>
  );
}

/** "Check again" re-reads a list (a short wait, like the app). */
function useReload(): [boolean, () => void] {
  const [loading, setLoading] = useState(false);
  return [
    loading,
    () => {
      setLoading(true);
      window.setTimeout(() => setLoading(false), 350);
    },
  ];
}

function OldDriversTool() {
  const { notify } = useDrv();
  const { job, run, clear } = useJob();
  const loaded = useLoaded();
  const [loading, reload] = useReload();
  const [old, setOld] = useState(OLD);
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(OLD.map((o) => o.published)));
  const picked = old.filter((o) => ticked.has(o.published));
  const bytes = picked.reduce((s, o) => s + o.bytes, 0);

  const remove = () =>
    void run("Getting ready", async (j) => {
      j.step("Making a restore point");
      await j.wait(700);
      const ids = picked.map((o) => o.published);
      j.lines([]);
      for (let i = 0; i < picked.length; i++) {
        j.step(`Removing ${i + 1} of ${picked.length}`, (i + 1) / picked.length);
        await j.wait(400);
      }
      j.lines(picked.map((o) => ({ key: o.published, name: `${o.original} ${o.version}`, ok: true, detail: null })));
      setOld((l) => l.filter((x) => !ids.includes(x.published)));
      notify("In the app, this removes the old copies after a restore point.");
      return { title: `${plural(ids.length, "old driver")} removed` };
    });

  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>
        Windows keeps every driver it was ever given. These older copies aren&apos;t used by any device, and a newer version of each is kept, so removing them only frees space. Drivers in use,
        drivers that came with Windows and the only copy of a driver are never listed.
      </p>
      <JobView job={job} onClose={clear} />
      <div className={c("card tl-card")}>
        <div className={c("tl-card-head")}>
          <div className={c("tl-card-title")}>
            {loaded ? (old.length ? `${plural(old.length, "old driver")} · ${humanSize(old.reduce((s, o) => s + o.bytes, 0))}` : "No old drivers") : "Reading the driver store…"}
          </div>
          {loaded && <span className={c("text-muted")}>of 149 driver packages on this PC</span>}
          <span style={{ flex: 1 }} />
          <Refresh onClick={reload} loading={loading} />
        </div>
        {(!loaded || loading) && <SkeletonRows n={4} />}
        {loaded && !loading && old.length === 0 && (
          <div className={c("tl-empty")}>
            <IconCheck size={16} /> Nothing to clean up: every driver package here is in use or the newest copy of its driver.
          </div>
        )}
        {loaded && !loading && (
          <div className={c("tl-list")}>
            {old.map((o) => (
              <div key={o.published} className={c("tl-row")} onClick={() => setTicked((t) => toggle(t, o.published))}>
                <Check checked={ticked.has(o.published)} onChange={() => setTicked((t) => toggle(t, o.published))} label={o.original} />
                <div className={c("tl-row-main")}>
                  <div className={c("tl-row-name")}>
                    {o.provider} {kindName(o.class).toLowerCase()} driver {o.version}
                  </div>
                  <div className={c("tl-row-sub text-muted")}>
                    {o.original} · {driverDate(o.date)} · newer kept: {o.newestVersion}
                  </div>
                </div>
                <span className={c("tl-size num")}>{humanSize(o.bytes)}</span>
              </div>
            ))}
          </div>
        )}
        {loaded && old.length > 0 && (
          <>
            <div className={c("toolbar tl-actions")}>
              <ActionButton feature="cleanup" disabled={picked.length === 0 || !!job?.running} onClick={remove}>
                <IconTrash size={13} /> Remove {plural(picked.length, "old driver")} ({humanSize(bytes)})
              </ActionButton>
            </div>
            <SafetyNote>A restore point is made first, and each one is checked again just before it&apos;s removed.</SafetyNote>
          </>
        )}
      </div>
    </div>
  );
}

function GhostsTool() {
  const { notify } = useDrv();
  const { job, run, clear } = useJob();
  const loaded = useLoaded();
  const [loading, reload] = useReload();
  const [all, setAll] = useState(GHOSTS);
  const [showAll, setShowAll] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const ghosts = useMemo(() => all.filter((g) => showAll || !g.hidden), [all, showAll]);
  const hidden = all.filter((g) => g.hidden).length;
  const picked = ghosts.filter((g) => ticked.has(g.instanceId));

  const remove = () =>
    void run("Getting ready", async (j) => {
      j.step("Making a restore point");
      await j.wait(700);
      const ids = picked.map((g) => g.instanceId);
      for (let i = 0; i < picked.length; i++) {
        j.step(`Removing ${i + 1} of ${picked.length}`, (i + 1) / picked.length);
        await j.wait(250);
      }
      j.lines(picked.map((g) => ({ key: g.instanceId, name: g.name, ok: true, detail: null })));
      setAll((l) => l.filter((x) => !ids.includes(x.instanceId)));
      setTicked(new Set());
      notify("In the app, this clears these devices from Windows' memory after a restore point.");
      return { title: `${plural(ids.length, "device")} removed` };
    });

  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>
        Devices Windows remembers that aren&apos;t plugged in: old mice, phones, USB sticks, earlier network adapters. Removing them tidies Device Manager; a device that&apos;s plugged in again is
        simply set up again.
      </p>
      <JobView job={job} onClose={clear} />
      <div className={c("card tl-card")}>
        <div className={c("tl-card-head")}>
          <div className={c("tl-card-title")}>{loaded ? plural(ghosts.length, "device") + " not plugged in" : "Reading the device list…"}</div>
          <span style={{ flex: 1 }} />
          {hidden > 0 && (
            <label className={c("toggle-check")}>
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show drives and Windows&apos; own entries ({hidden})
            </label>
          )}
          <Refresh onClick={reload} loading={loading} />
        </div>
        {(!loaded || loading) && <SkeletonRows n={5} />}
        {loaded && !loading && (
          <div className={c("tl-list")}>
            {ghosts.map((g) => (
              <div key={g.instanceId} className={c("tl-row")} onClick={() => setTicked((t) => toggle(t, g.instanceId))}>
                <Check checked={ticked.has(g.instanceId)} onChange={() => setTicked((t) => toggle(t, g.instanceId))} label={g.name} />
                <span className={c("drv-icon")}>
                  <DeviceIcon cls={g.class} size={15} />
                </span>
                <div className={c("tl-row-main")}>
                  <div className={c("tl-row-name")}>{g.name}</div>
                  <div className={c("tl-row-sub text-muted")}>
                    {kindName(g.class) || "Other"}
                    {g.hidden ? " · drive or Windows entry" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {loaded && ghosts.length > 0 && (
          <>
            <div className={c("toolbar tl-actions")}>
              <button className={c("link-btn")} onClick={() => setTicked(new Set(ghosts.map((g) => g.instanceId)))}>
                Pick all shown
              </button>
              <span style={{ flex: 1 }} />
              <ActionButton feature="cleanup" disabled={picked.length === 0 || !!job?.running} onClick={remove}>
                <IconTrash size={13} /> Remove {plural(picked.length, "device")}
              </ActionButton>
            </div>
            <SafetyNote>A restore point is made first. Only devices that are still unplugged are removed.</SafetyNote>
          </>
        )}
      </div>
    </div>
  );
}

function ProblemsTool({ onDrivers }: { onDrivers: (id?: string) => void }) {
  const { notify } = useDrv();
  const loaded = useLoaded();
  const [loading, reload] = useReload();
  const [list, setList] = useState<ProblemDevice[]>(PROBLEM_DEVICES);
  const [busy, setBusy] = useState<string | null>(null);

  const act = (p: ProblemDevice) => {
    if (p.fix === "findDriver") return onDrivers();
    setBusy(p.instanceId);
    window.setTimeout(() => {
      setBusy(null);
      setList((l) => l.filter((x) => x.instanceId !== p.instanceId));
      notify(p.fix === "enable" ? "In the app, this turns the device back on." : "In the app, Windows sets the device up again, after a restore point.");
    }, 800);
  };

  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>Devices Windows reports a problem with (the yellow mark in Device Manager), what it means in plain words, and what usually fixes it.</p>
      <div className={c("card tl-card")}>
        <div className={c("tl-card-head")}>
          <div className={c("tl-card-title")}>{loaded ? (list.length ? plural(list.length, "device") + " with a problem" : "No problem devices") : "Reading the device list…"}</div>
          <span style={{ flex: 1 }} />
          <Refresh onClick={reload} loading={loading} />
        </div>
        {(!loaded || loading) && <SkeletonRows n={3} />}
        {loaded && !loading && list.length === 0 && (
          <div className={c("tl-empty")}>
            <IconCheck size={16} /> Every plugged-in device is working.
          </div>
        )}
        {loaded && !loading && (
          <div className={c("tl-list")}>
            {list.map((p) => (
              <div key={p.instanceId} className={c("tl-row tl-problem")}>
                <span className={c("drv-icon status-problem")}>
                  <DeviceIcon cls={p.class} size={15} />
                </span>
                <div className={c("tl-row-main")}>
                  <div className={c("tl-row-name")}>{p.name}</div>
                  <div className={c("tl-row-sub")}>
                    <b>{p.problem.title}.</b> <span className={c("text-muted")}>{p.problem.advice}</span>
                  </div>
                  {p.driverMayHelp && (
                    <button className={c("link-btn")} onClick={() => onDrivers()}>
                      Look for a newer driver
                    </button>
                  )}
                </div>
                <button className={c("btn btn-secondary btn-small")} onClick={() => act(p)} disabled={busy === p.instanceId}>
                  {busy === p.instanceId ? "Working…" : p.fixLabel}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ crash driver finder (tools/Crash.tsx)

function crashWhen(cr: Crash): string {
  const d = new Date(Date.now() - cr.daysAgo * 86_400_000);
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
  return `${M} ${d.getDate()}, ${d.getFullYear()}, ${cr.hour % 12 || 12}:${String(cr.minute).padStart(2, "0")} ${cr.hour < 12 ? "AM" : "PM"}`;
}

function CrashRow({ cr, onDrivers }: { cr: Crash; onDrivers: (id?: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={c("tl-crash")}>
      <div className={c("tl-crash-head")}>
        <div className={c("tl-row-main")}>
          <div className={c("tl-row-name")}>
            {crashWhen(cr)} <span className={c("text-muted")}>· {cr.plain}</span>
          </div>
          <div className={c("tl-verdict")}>
            {cr.confidence && <span className={c("pill conf-pill", `conf-${cr.confidence}`)}>{CONFIDENCE_LABEL[cr.confidence]}</span>}
            {cr.module && <span className={c("mono")}>{cr.module}</span>}
            {cr.device && <span>({cr.device.name})</span>}
            <span className={c("text-muted")}>{cr.why}</span>
          </div>
        </div>
        {cr.device && (
          <button className={c("btn btn-secondary btn-small")} onClick={() => onDrivers(cr.device!.instanceId)}>
            <IconUpdate size={12} /> See its update
          </button>
        )}
      </div>
      <button className={c("link-btn")} onClick={() => setOpen((v) => !v)}>
        {open ? "Hide details" : "Details"}
      </button>
      {open && (
        <div className={c("tl-crash-details mono")}>
          Stop code {cr.codeText} ({cr.name}) · parameters {cr.params.join(", ")}
          {cr.file ? ` · ${cr.file}` : " · from Windows' event log only"}
        </div>
      )}
    </div>
  );
}

function CrashTool({ onDrivers }: { onDrivers: (id?: string) => void }) {
  const loaded = useLoaded(300);
  const [loading, reload] = useReload();
  const ready = loaded && !loading;
  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>After a blue screen Windows saves a small crash report. This reads them (nothing is changed or sent anywhere) and names the driver most likely behind each crash.</p>
      <div className={c("card tl-card")}>
        <div className={c("tl-card-head")}>
          <div className={c("tl-card-title")}>{ready ? plural(CRASHES.length, "crash", "crashes") + " found" : "Reading crash reports…"}</div>
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary btn-small")} onClick={reload} disabled={loading}>
            <IconRefresh size={12} /> {loading ? "Reading…" : "Check again"}
          </button>
        </div>
        {!ready && <SkeletonRows n={2} />}
        {ready && (
          <div className={c("tl-list")}>
            {CRASHES.map((cr, i) => (
              <CrashRow key={i} cr={cr} onDrivers={onDrivers} />
            ))}
          </div>
        )}
        {ready && (
          <div className={c("tl-safety text-muted")}>
            &quot;Very likely&quot; means the crash happened inside that driver; &quot;Likely&quot; and &quot;Possibly&quot; mean it was involved. Updating that driver is the usual fix.
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ one-click fixes (tools/Fixes.tsx)

const FIX_ICON: Record<FixId, ReactNode> = {
  noSound: <IconSpeaker size={20} />,
  noInternet: <IconNetwork size={20} />,
  wrongResolution: <IconDisplay size={20} />,
  usb: <IconUsb size={20} />,
  bluetooth: <IconBluetooth size={20} />,
};
const FIX_TONE: Record<FixId, string> = { noSound: "violet", noInternet: "green", wrongResolution: "blue", usb: "amber", bluetooth: "cyan" };

function FixesTool() {
  const { notify } = useDrv();
  const { job, run, clear } = useJob();
  const [open, setOpen] = useState<FixId | null>(null);
  const [ranFor, setRanFor] = useState<FixId | null>(null);
  const fix = FIXES.find((f) => f.id === open);

  if (!fix) {
    return (
      <div className={c("tl-page")}>
        <p className={c("tl-intro")}>Common problems, fixed with a few plain steps. A step that finds nothing wrong changes nothing, and a restore point comes first.</p>
        <div className={c("tool-grid")}>
          {FIXES.map((f) => (
            <button key={f.id} className={c("card tool-card")} onClick={() => setOpen(f.id)}>
              <span className={c("tool-icon", `tone-${FIX_TONE[f.id]}`)}>{FIX_ICON[f.id]}</span>
              <span className={c("tool-title")}>{f.title}</span>
              <span className={c("tool-sub")}>{f.sub}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const busy = !!job?.running;
  const runFix = () => {
    setRanFor(fix.id);
    void run("Making a restore point", async (j) => {
      j.lines(fix.steps.map((st, i) => ({ key: `step-${i}`, name: st, ok: null, detail: null })));
      await j.wait(700);
      for (let i = 0; i < fix.steps.length; i++) {
        j.step(fix.steps[i], i / fix.steps.length);
        await j.wait(450);
        j.line(i, true, fix.results[i][1]);
      }
      notify("In the app, these steps run on your PC after a restore point.");
      return { title: fix.results.some((r) => r[0]) ? "Fixed what it found" : "Nothing needed fixing", note: fix.id === "noInternet" ? "Restart the PC to finish." : null };
    });
  };

  return (
    <div className={c("tl-page")}>
      <div className={c("toolbar")}>
        <button className={c("link-btn")} onClick={() => !busy && setOpen(null)} disabled={busy}>
          All fixes
        </button>
      </div>
      <div className={c("card tl-card")}>
        <div className={c("tl-step-head")}>
          <span className={c("tool-icon", `tone-${FIX_TONE[fix.id]}`)}>{FIX_ICON[fix.id]}</span>
          <div>
            <div className={c("tl-card-title")}>{fix.title}</div>
            <div className={c("text-muted")}>{fix.sub}</div>
          </div>
        </div>
        {job && ranFor === fix.id ? (
          <JobView job={job} onClose={clear} />
        ) : (
          <ol className={c("tl-steps")}>
            {fix.steps.map((st) => (
              <li key={st}>{st}</li>
            ))}
          </ol>
        )}
        <div className={c("tl-undo")}>
          <IconWrench size={12} /> <b>To undo:</b> <span className={c("text-muted")}>{fix.undo}</span>
        </div>
        <div className={c("toolbar tl-actions")}>
          <ActionButton disabled={busy} onClick={runFix}>
            <IconCheck size={13} /> {job && !job.running && ranFor === fix.id ? "Run it again" : "Run this fix"}
          </ActionButton>
        </div>
        <SafetyNote>A restore point is made first.</SafetyNote>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ keep drivers, scheduled scan, hardware info (tools/Keep.tsx)

function KeepTool() {
  const { ignored, setIgnored, notify } = useDrv();
  const [wu, setWu] = useState(false);
  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>Keep a driver you&apos;re happy with. Every scan, the scheduled one too, leaves ignored devices out, and nothing is installed for them.</p>
      <div className={c("card tl-card")}>
        <SettingRow
          label="Stop Windows Update replacing my drivers"
          hint="Turns on Windows' own setting that keeps Windows Update from installing drivers with its monthly updates. Turning it off puts back exactly what was there before."
        >
          <Toggle
            checked={wu}
            onChange={(v) => {
              setWu(v);
              notify(v ? "In the app, this turns on Windows' own setting." : "In the app, this puts Windows' setting back as it was.");
            }}
            label="Stop Windows Update replacing my drivers"
          />
        </SettingRow>
      </div>
      <div className={c("card tl-card")}>
        <div className={c("tl-card-head")}>
          <div className={c("tl-card-title")}>Ignored devices</div>
          <span className={c("text-muted")}>{ignored.length}</span>
        </div>
        {ignored.length === 0 && (
          <div className={c("tl-empty")}>
            <IconInfo size={15} /> None. To keep a device&apos;s driver, open it in the Drivers tab and choose &quot;Ignore updates for this device&quot;.
          </div>
        )}
        <div className={c("tl-list")}>
          {ignored.map((id) => (
            <div key={id} className={c("tl-row")}>
              <div className={c("tl-row-main")}>
                <div className={c("tl-row-name")}>{deviceName(id)}</div>
                <div className={c("tl-row-sub text-muted mono")}>{id}</div>
              </div>
              <button className={c("btn btn-secondary btn-small")} onClick={() => setIgnored(ignored.filter((x) => x !== id))}>
                Show updates again
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const WHEN: { id: "off" | "logon" | "weekly"; label: string; sub: string }[] = [
  { id: "off", label: "Off", sub: "Scan only when you click Scan." },
  { id: "logon", label: "When I sign in", sub: "A couple of minutes after you sign in to Windows." },
  { id: "weekly", label: "Once a week", sub: "Mondays at noon, or the next time the PC is on." },
];

function ScheduleTool() {
  const { notify } = useDrv();
  const [when, setWhen] = useState<(typeof WHEN)[number]["id"]>("off");
  return (
    <div className={c("tl-page")}>
      <p className={c("tl-intro")}>
        A quiet scan in the background. If it finds updates you get one small notification; if not, nothing at all. It never installs anything, and it&apos;s off until you turn it on here.
      </p>
      <div className={c("card tl-card")}>
        <div className={c("tl-choices")} role="radiogroup" aria-label="Scheduled scan">
          {WHEN.map((w) => (
            <button
              key={w.id}
              role="radio"
              aria-checked={when === w.id}
              className={c("tl-choice", when === w.id && "active")}
              onClick={() => {
                if (when === w.id) return;
                setWhen(w.id);
                notify(w.id === "off" ? "In the app, this removes the scheduled scan." : "In the app, this sets up the scheduled scan in Windows.");
              }}
            >
              <span className={c("tl-choice-dot")}>{when === w.id && <IconCheck size={11} />}</span>
              <span>
                <span className={c("tl-choice-label")}>{w.label}</span>
                <span className={c("tl-choice-sub text-muted")}>{w.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div className={c("tl-hint text-muted")}>
          It runs only while you&apos;re signed in, not on battery, and only with a network. It&apos;s a task in Windows&apos; Task Scheduler named &quot;RevinHi Drivers\Scheduled scan&quot;.
        </div>
      </div>
    </div>
  );
}

function HardwareTool() {
  const loaded = useLoaded(300);
  const [copied, setCopied] = useState(false);
  return (
    <div className={c("tl-page")}>
      <div className={c("toolbar")}>
        <p className={c("tl-intro")} style={{ flex: 1, maxWidth: "none" }}>
          What&apos;s inside this PC. Serial numbers aren&apos;t read.
        </p>
        <button
          className={c("btn btn-secondary btn-small")}
          disabled={!loaded}
          onClick={() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy as text"}
        </button>
      </div>
      {!loaded && (
        <div className={c("card")}>
          <SkeletonRows n={4} />
        </div>
      )}
      {loaded && (
        <div className={c("hw-grid")}>
          {HARDWARE.map((g) => (
            <div key={g.id} className={c("card hw-card", `hw-${g.id}`)}>
              <div className={c("hw-title")}>
                <IconChip size={13} /> {g.title}
              </div>
              {g.items.map((i, n) => (
                <div key={n} className={c("hw-item")}>
                  <div className={c("hw-name")}>{i.name}</div>
                  {i.details.map(([k, v]) => (
                    <div key={k} className={c("hw-line")}>
                      <span className={c("text-muted")}>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ the tab

/** Tools that keep their state (and a running job) while closed. */
const KEEP: ToolId[] = ["offline", "rescue", "backup", "restore", "old", "ghosts", "fixes"];

export function ToolsView({ onDrivers, onHistory }: { onDrivers: (instanceId?: string) => void; onHistory: () => void }) {
  const { pro } = useDrv();
  const [tool, setTool] = useState<ToolId | null>(null);
  const [opened, setOpened] = useState<Set<ToolId>>(new Set());
  const openTool = (t: ToolId | null) => {
    setTool(t);
    if (t) setOpened((s) => (s.has(t) ? s : new Set(s).add(t)));
  };
  const current = TOOLS.find((t) => t.id === tool);
  const panel = (id: ToolId, node: ReactNode) =>
    (KEEP.includes(id) ? opened.has(id) : tool === id) && (
      <div className={c("tool-panel scroll")} hidden={tool !== id} key={id}>
        {node}
      </div>
    );

  return (
    <div className={c("tools-page")}>
      <div className={c("pane scroll fade-in")} hidden={tool !== null}>
        <div className={c("page-head")}>
          <div>
            <div className={c("page-title")}>Tools</div>
            <div className={c("page-sub")}>More ways to look after your drivers. Nothing is changed until you say so, and every change comes after a restore point.</div>
          </div>
        </div>
        <div className={c("tool-grid")}>
          {TOOLS.map((t) => (
            <button key={t.id} className={c("card tool-card")} onClick={() => openTool(t.id)}>
              <span className={c("tool-icon", `tone-${t.tone}`)}>{t.icon}</span>
              <span className={c("tool-title")}>
                {t.title}
                {t.pro && !pro && (
                  <span className={c("pro-chip pro-chip-static")} title="Some of this tool is a Pro feature">
                    <LockIcon size={8} />
                    PRO
                  </span>
                )}
              </span>
              <span className={c("tool-sub")}>{t.sub}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={c("tool-open fade-in")} hidden={tool === null}>
        <div className={c("crumbs")}>
          <button className={c("back-btn")} onClick={() => setTool(null)}>
            <IconBack size={14} /> Tools
          </button>
          <span className={c("crumb-sep")}>/</span>
          <span className={c("crumb-here")}>{current?.title}</span>
        </div>
        <div className={c("tool-body")}>
          {panel("offline", <OfflineTool />)}
          {panel("rescue", <RescueTool />)}
          {panel("backup", <BackupTool />)}
          {panel("restore", <RestoreTool onHistory={onHistory} />)}
          {panel("old", <OldDriversTool />)}
          {panel("ghosts", <GhostsTool />)}
          {panel("problems", <ProblemsTool onDrivers={onDrivers} />)}
          {panel("crash", <CrashTool onDrivers={onDrivers} />)}
          {panel("fixes", <FixesTool />)}
          {panel("keep", <KeepTool />)}
          {panel("schedule", <ScheduleTool />)}
          {panel("hardware", <HardwareTool />)}
        </div>
      </div>
    </div>
  );
}
