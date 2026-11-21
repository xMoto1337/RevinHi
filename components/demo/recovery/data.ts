// Sample data for the RevinHi Recovery preview: the same drives, health reports and found files the
// real app's own screenshots use (revinhi-recovery/src/preview/mock.ts), trimmed to what fits here.

import type { Kind } from "./ui";

const GB = 1e9;
const MB = 1e6;
const DAY = 86_400_000;
/** "Now" for the sample data (fixed, so the page renders the same on the server and in the browser). */
export const NOW = Date.UTC(2026, 10, 18, 15, 0);

// ------------------------------------------------------------------ drives

export type Bus = "nvme" | "sata" | "usb" | "sd" | "virtual";
export type Group = "pc" | "usb" | "images";
export type Health = "good" | "caution" | "unknown";

export interface Volume {
  letter: string | null;
  label: string;
  fs: string;
  size: number;
  free: number | null;
}

export interface Drive {
  id: number;
  name: string;
  bus: Bus;
  busLabel: string;
  size: number;
  isSystem: boolean;
  group: Group;
  health: Health;
  volumes: Volume[];
  /** Minutes a full scan takes (for the estimate). */
  fullMin: number;
  /** How much a scan of this drive finds, compared with the sample scan of the Windows drive. */
  found: number;
}

export const DRIVES: Drive[] = [
  {
    id: 0,
    name: "Samsung SSD 980 PRO 1TB",
    bus: "nvme",
    busLabel: "NVMe",
    size: 1000.2 * GB,
    isSystem: true,
    group: "pc",
    health: "good",
    volumes: [
      { letter: null, label: "", fs: "FAT32", size: 0.1 * GB, free: null },
      { letter: "C:", label: "Windows", fs: "NTFS", size: 999.4 * GB, free: 412.6 * GB },
      { letter: null, label: "", fs: "NTFS", size: 0.7 * GB, free: null },
    ],
    fullMin: 12,
    found: 1,
  },
  {
    id: 1,
    name: "WD Blue 2TB",
    bus: "sata",
    busLabel: "SATA",
    size: 2000.4 * GB,
    isSystem: false,
    group: "pc",
    health: "caution",
    volumes: [{ letter: "D:", label: "Data", fs: "NTFS", size: 2000.3 * GB, free: 1104.2 * GB }],
    fullMin: 48,
    found: 1.38,
  },
  {
    id: 2,
    name: "SanDisk Ultra USB 3.0",
    bus: "usb",
    busLabel: "USB",
    size: 64.1 * GB,
    isSystem: false,
    group: "usb",
    health: "unknown",
    volumes: [{ letter: "E:", label: "SANDISK", fs: "exFAT", size: 64.1 * GB, free: 20.3 * GB }],
    fullMin: 6,
    found: 0.21,
  },
  {
    id: 3,
    name: "SD card (32 GB)",
    bus: "sd",
    busLabel: "SD card",
    size: 31.9 * GB,
    isSystem: false,
    group: "usb",
    health: "unknown",
    volumes: [{ letter: "F:", label: "CANON_DC", fs: "FAT32", size: 31.9 * GB, free: 3.1 * GB }],
    fullMin: 4,
    found: 0.12,
  },
  {
    id: 4,
    name: "Old Laptop Backup.vhd (opened in Windows)",
    bus: "virtual",
    busLabel: "Disk image",
    size: 8.6 * GB,
    isSystem: false,
    group: "images",
    health: "unknown",
    volumes: [
      { letter: "G:", label: "Backup", fs: "FAT32", size: 2.1 * GB, free: 1.2 * GB },
      { letter: null, label: "", fs: "", size: 6.4 * GB, free: null },
    ],
    fullMin: 2,
    found: 0.04,
  },
];

export const driveLetters = (d: Drive) =>
  d.volumes
    .map((v) => v.letter)
    .filter(Boolean)
    .join(", ");

export const formats = (d: Drive) => [...new Set(d.volumes.map((v) => v.fs).filter(Boolean))].join(", ");

export function usedSpace(d: Drive): number | null {
  const known = d.volumes.filter((v) => v.free != null);
  if (!known.length) return null;
  return known.reduce((s, v) => s + Math.max(0, v.size - (v.free ?? 0)), 0);
}

// ------------------------------------------------------------------ drive health

export interface HealthReport {
  drive: number;
  name: string;
  status: Health;
  reasons: string[];
  facts: [string, string][];
}

export const HEALTH: HealthReport[] = [
  {
    drive: 0,
    name: "Samsung SSD 980 PRO 1TB",
    status: "good",
    reasons: ["No problems reported. 94% of its rated life is left."],
    facts: [
      ["Temperature", "41 °C"],
      ["Rated life left", "94%"],
      ["Powered on", "6,120 hours (0.7 years)"],
      ["Times switched on", "1,432"],
      ["Data written", "48.2 TB"],
      ["Read-back errors", "0"],
    ],
  },
  {
    drive: 1,
    name: "WD Blue 2TB",
    status: "caution",
    reasons: ["8 worn-out sectors have been swapped for spares. Keep a backup of anything important on this drive."],
    facts: [
      ["Temperature", "36 °C"],
      ["Powered on", "31,877 hours (3.6 years)"],
      ["Times switched on", "2,210"],
      ["Worn-out sectors replaced", "8"],
      ["Sectors waiting to be checked", "0"],
      ["Unreadable sectors", "0"],
    ],
  },
  { drive: 2, name: "SanDisk Ultra USB 3.0", status: "unknown", reasons: ["USB sticks don't report their health."], facts: [] },
  { drive: 3, name: "SD card (32 GB)", status: "unknown", reasons: ["Memory cards don't report their health."], facts: [] },
  { drive: 4, name: "Old Laptop Backup.vhd (opened in Windows)", status: "unknown", reasons: ["Disk images have no health to report."], facts: [] },
];

export const HEALTH_LABEL: Record<Health, string> = { good: "Good", caution: "Caution", unknown: "Not available" };
export const HEALTH_DOT: Record<Health, string> = { good: "dot-success", caution: "dot-warning", unknown: "dot-muted" };

// ------------------------------------------------------------------ recent scans

export interface RecentScan {
  id: string;
  drive: number;
  title: string;
  when: string;
  finished: boolean;
  file: string;
}

export const RECENT: RecentScan[] = [
  { id: "r1", drive: 0, title: "Samsung SSD 980 PRO 1TB", when: "15 hours ago", finished: true, file: "412 MB" },
  { id: "r2", drive: 3, title: "SD card (32 GB)", when: "2 days ago", finished: false, file: "38.0 MB" },
  { id: "r3", drive: 4, title: "Old Laptop Backup.vhd", when: "6 days ago", finished: true, file: "12.0 MB" },
];

// ------------------------------------------------------------------ found files

export type Chance = "good" | "partial" | "poor";
/** Where a file's name came from, when it isn't the drive's own record. */
export type NameFrom = "guess" | "number";

export interface FileRec {
  id: number;
  name: string;
  ext: string;
  kind: Kind;
  /** Folder it was in, or null when it was found by its contents. */
  folder: string | null;
  /** Which part of the folders view it shows under. */
  where: "named" | "records" | "contents";
  deleted: boolean;
  chance: Chance;
  size: number;
  modified: number;
  created: number;
  nameFrom?: NameFrom;
  /** Picks the picture shown in the preview. */
  look: number;
}

const KIND_OF: Record<string, Kind> = {};
for (const e of ["jpg", "png", "heic"]) KIND_OF[e] = "pictures";
for (const e of ["mp4", "mov"]) KIND_OF[e] = "videos";
for (const e of ["mp3", "m4a", "flac"]) KIND_OF[e] = "music";
for (const e of ["pdf", "docx", "txt", "xlsx", "pptx"]) KIND_OF[e] = "documents";
for (const e of ["zip", "7z", "rar"]) KIND_OF[e] = "archives";

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

const FILES: FileRec[] = [];
let nextId = 101;
const rand = rng(7);

function add(
  name: string,
  folder: string | null,
  size: number,
  daysAgo: number,
  opts: { deleted?: boolean; chance?: Chance; where?: FileRec["where"]; nameFrom?: NameFrom } = {},
) {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  const modified = NOW - daysAgo * DAY - Math.floor(rand() * 9 * 3600_000);
  FILES.push({
    id: nextId++,
    name,
    ext,
    kind: KIND_OF[ext] ?? "other",
    folder,
    where: opts.where ?? (folder ? "named" : "contents"),
    deleted: opts.deleted ?? false,
    chance: opts.chance ?? "good",
    size,
    modified,
    created: modified - Math.floor(rand() * 20) * DAY - 3600_000,
    nameFrom: opts.nameFrom,
    look: FILES.length,
  });
}

const W = "Users\\Wes";

// Pictures
const VAC = `${W}\\Pictures\\Vacation 2024`;
const vac: [number, boolean, Chance][] = [
  [4.9, true, "partial"],
  [3.4, false, "good"],
  [6.2, false, "good"],
  [5.3, false, "good"],
  [2.4, false, "good"],
  [3.0, false, "good"],
  [6.0, true, "partial"],
  [2.4, false, "good"],
  [4.1, true, "good"],
  [5.6, true, "good"],
  [3.8, false, "good"],
  [4.4, true, "poor"],
  [2.9, true, "good"],
  [5.1, false, "good"],
];
vac.forEach(([mb, del, ch], i) => add(`IMG_${4100 + i}.JPG`, VAC, mb * MB, 120 - i * 3, { deleted: del, chance: ch }));
add("IMG_2201.JPG", `${W}\\Pictures\\Family`, 3.1 * MB, 300, { deleted: true });
add("IMG_2207.JPG", `${W}\\Pictures\\Family`, 2.8 * MB, 296, { deleted: true });
add("Grandma 80th.jpg", `${W}\\Pictures\\Family`, 4.6 * MB, 410);
add("IMG_0912.HEIC", `${W}\\Pictures\\Family`, 1.9 * MB, 205, { deleted: true, chance: "partial" });
add("Screenshot 2026-03-02 101544.png", `${W}\\Pictures\\Screenshots`, 0.9 * MB, 261, { deleted: true });
add("Screenshot 2026-06-14 182210.png", `${W}\\Pictures\\Screenshots`, 1.2 * MB, 157);

// Videos
add("Holiday video.mp4", `${W}\\Videos`, 1.84 * GB, 118, { deleted: true });
add("Beach day.mov", `${W}\\Videos`, 912 * MB, 125, { deleted: true, chance: "partial" });
add("Birthday party.mp4", `${W}\\Videos`, 640 * MB, 44);

// Music
add("Fleetwood Mac - Dreams.mp3", `${W}\\Music`, 8.4 * MB, 610, { deleted: true });
add("Queen - Don't Stop Me Now.flac", `${W}\\Music`, 31.2 * MB, 590);
add("Voice memo 12.m4a", `${W}\\Music`, 2.2 * MB, 33, { deleted: true });
add("The Weeknd - Blinding Lights.mp3", `${W}\\Music`, 7.9 * MB, 402, { deleted: true, chance: "partial" });

// Documents
add("Budget Oct.xlsx", `${W}\\Desktop`, 48 * 1000, 39, { deleted: true });
add("Wedding speech.docx", `${W}\\Desktop`, 31 * 1000, 76, { deleted: true });
add("Notes.txt", `${W}\\Desktop`, 4 * 1000, 12);
add("Tax return 2024.pdf", `${W}\\Documents`, 1.6 * MB, 214, { deleted: true });
add("Lease agreement.pdf", `${W}\\Documents`, 2.3 * MB, 380);
add("Resume 2026.docx", `${W}\\Documents`, 96 * 1000, 58, { deleted: true, chance: "partial" });
add("Quarterly review.pptx", `${W}\\Documents`, 6.8 * MB, 25);
add("Contacts.vcf", `${W}\\Documents`, 22 * 1000, 340, { deleted: true });

// Archives
add("setup_1004.zip", `${W}\\Downloads`, 151 * MB, 613);
add("Photos backup 2023.zip", `${W}\\Downloads`, 4.2 * GB, 330, { deleted: true });
add("Project files.7z", `${W}\\Downloads`, 512 * MB, 92, { deleted: true, chance: "partial" });
add("Old drivers.rar", `${W}\\Downloads`, 88 * MB, 700, { deleted: true, chance: "poor" });

// Other
add("app-settings.bak", "Program Files\\RevinHi", 120 * 1000, 64);
add("World 3.sav", "Program Files\\Games", 3.4 * MB, 21, { deleted: true });

// Lost folders, found records
add("IMG_0331.JPG", "Lost folders\\Folder 17", 3.3 * MB, 520, { deleted: true });
add("invoice-0412.pdf", "Lost folders\\Folder 17", 210 * 1000, 515, { deleted: true, chance: "partial" });
add("Holiday card.png", "Found file records", 2.1 * MB, 330, { deleted: true, where: "records" });
add("Old budget.xlsx", "Found file records", 61 * 1000, 410, { deleted: true, where: "records", chance: "partial" });

// Found by their contents
add("2024-07-21 14-03-55 Canon EOS R6.jpg", null, 7.2 * MB, 485, { deleted: true, nameFrom: "guess" });
add("JPEG 412.jpg", null, 2.6 * MB, 640, { deleted: true, nameFrom: "number", chance: "partial" });
add("Daft Punk - One More Time.mp3", null, 9.1 * MB, 700, { deleted: true, nameFrom: "guess" });
add("MP4 7.mp4", null, 1.1 * GB, 380, { deleted: true, nameFrom: "number" });
add("PDF 31.pdf", null, 840 * 1000, 450, { deleted: true, nameFrom: "number", chance: "poor" });
add("ZIP 1.zip", null, 64 * MB, 800, { deleted: true, nameFrom: "number" });

export { FILES };

// ------------------------------------------------------------------ result trees

export type NodeType = "kind" | "ext" | "section" | "volume" | "folder" | "file";

export interface TreeNode {
  id: string;
  type: NodeType;
  name: string;
  /** Icon: a kind, "folder" or "volume". */
  icon: string;
  /** Files inside (the whole scan's number; only a few sample files are listed). */
  count: number;
  size: number;
  note?: string;
  children: TreeNode[];
  file?: FileRec;
}

export interface Session {
  drive: number;
  title: string;
  /** Index of the partition, when only one partition was scanned. */
  volume?: number;
  deep: boolean;
  finished: boolean;
}

const file = (f: FileRec): TreeNode => ({ id: `f${f.id}`, type: "file", name: f.name, icon: f.kind, count: 1, size: f.size, children: [], file: f });

/** Scale a count from the sample Windows-drive scan to this scan, never below the files listed. */
const scaled = (count: number, k: number, listed: number) => Math.max(listed, Math.round(count * k));

const EXTS: Record<Kind, [string, number, number][]> = {
  pictures: [
    ["jpg", 2410, 9.6 * GB],
    ["png", 412, 1.1 * GB],
    ["heic", 141, 0.4 * GB],
  ],
  videos: [
    ["mp4", 71, 38.0 * GB],
    ["mov", 29, 11.2 * GB],
  ],
  music: [
    ["mp3", 488, 6.1 * GB],
    ["m4a", 48, 0.3 * GB],
    ["flac", 31, 1.1 * GB],
  ],
  documents: [
    ["pdf", 363, 5.8 * GB],
    ["docx", 80, 166 * MB],
    ["txt", 54, 111 * MB],
    ["xlsx", 52, 114 * MB],
    ["pptx", 39, 69.5 * MB],
  ],
  archives: [
    ["zip", 180, 19.9 * GB],
    ["7z", 28, 3.9 * GB],
    ["rar", 18, 1.5 * GB],
  ],
  other: [
    ["bak", 210, 6.2 * GB],
    ["sav", 148, 3.1 * GB],
    ["vcf", 86, 0.9 * GB],
  ],
};

function sum(nodes: TreeNode[]) {
  return { count: nodes.reduce((s, x) => s + x.count, 0), size: nodes.reduce((s, x) => s + x.size, 0) };
}

/** The types view: Photos > JPG > files. */
function typesTree(files: FileRec[], k: number): TreeNode[] {
  return (Object.keys(EXTS) as Kind[]).map((kind) => {
    const exts = EXTS[kind].map(([ext, count, size]) => {
      const leaves = files.filter((f) => f.kind === kind && f.ext === ext).map(file);
      return {
        id: `t:${kind}:${ext}`,
        type: "ext" as const,
        name: ext.toUpperCase(),
        icon: kind,
        count: scaled(count, k, leaves.length),
        size: Math.max(size * k, leaves.reduce((s, l) => s + l.size, 0)),
        children: leaves,
      };
    });
    return { id: `t:${kind}`, type: "kind" as const, name: kind, icon: kind, ...sum(exts), children: exts };
  });
}

type FolderSpec = [name: string, count: number, size: number, sub?: FolderSpec[]];

function folders(path: string, specs: FolderSpec[], files: FileRec[], k: number): TreeNode[] {
  return specs.map(([name, count, size, sub]) => {
    const here = path ? `${path}\\${name}` : name;
    const children = sub ? folders(here, sub, files, k) : files.filter((f) => f.folder === here).map(file);
    const listed = sub ? sum(children).count : children.length;
    return {
      id: `d:${here}`,
      type: "folder" as const,
      name,
      icon: "folder",
      count: scaled(count, k, listed),
      size: Math.max(size * k, sum(children).size),
      children,
    };
  });
}

/** The folders view: what the file system lists, rebuilt folders, then files found by contents. */
function foldersTree(files: FileRec[], k: number, s: Session, volumeName: string): TreeNode[] {
  const named = folders(
    "",
    [
      ["Program Files", 380, 1.6 * GB, [["RevinHi", 120, 0.4 * GB], ["Games", 260, 1.2 * GB]]],
      [
        "Users",
        2588,
        73.7 * GB,
        [
          [
            "Wes",
            2588,
            73.7 * GB,
            [
              ["Desktop", 42, 0.9 * GB],
              ["Documents", 318, 5.2 * GB],
              ["Downloads", 212, 22.4 * GB],
              ["Music", 310, 5.9 * GB],
              ["Pictures", 1680, 6.5 * GB, [["Family", 260, 750 * MB], ["Screenshots", 180, 165 * MB], ["Vacation 2024", 1240, 5.6 * GB]]],
              ["Videos", 26, 32.8 * GB],
            ],
          ],
        ],
      ],
      ["Lost folders", 92, 290 * MB, [["Folder 17", 92, 290 * MB]]],
    ],
    files,
    k,
  );
  const volume: TreeNode = { id: "v:0", type: "volume", name: volumeName, icon: "volume", ...sum(named), children: named };
  const out: TreeNode[] = [
    {
      id: "s:named",
      type: "section",
      name: "Files with their folders",
      icon: "volume",
      note: "Names and folders as the drive's file system lists them",
      ...sum([volume]),
      children: [volume],
    },
  ];
  if (!s.deep) return out;
  const records = folders("", [["Found file records", 46, 115 * MB]], files, k);
  out.push({
    id: "s:records",
    type: "section",
    name: "Recovered folders",
    icon: "folder",
    note: "Rebuilt from leftover folder and file records",
    ...sum(records),
    children: records,
  });
  const byContents: [string, string, number, number][] = [
    ["JPEG", "jpg", 1180, 4.4 * GB],
    ["MP3", "mp3", 240, 1.6 * GB],
    ["MP4", "mp4", 54, 16.4 * GB],
    ["PDF", "pdf", 190, 1.2 * GB],
    ["ZIP", "zip", 118, 10.3 * GB],
  ];
  const groups: TreeNode[] = byContents.map(([label, ext, count, size]) => {
    const leaves = files.filter((f) => f.where === "contents" && f.ext === ext).map(file);
    return { id: `c:${ext}`, type: "folder", name: label, icon: "folder", count: scaled(count, k, leaves.length), size: Math.max(size * k, sum(leaves).size), children: leaves };
  });
  out.push({
    id: "s:contents",
    type: "section",
    name: "Found by contents",
    icon: "other",
    note: "Found by what's inside them, sorted by type",
    ...sum(groups),
    children: groups,
  });
  return out;
}

export interface Results {
  types: TreeNode[];
  folders: TreeNode[];
  files: FileRec[];
  total: { count: number; size: number; deleted: number; good: number };
}

/**
 * The trees for a scan. `progress` (0..1) shrinks the numbers while a scan is still running, so
 * "files found so far" grows like the real thing.
 */
export function buildResults(s: Session, progress = 1): Results {
  const d = DRIVES[s.drive];
  const k = d.found * (s.volume !== undefined ? 0.82 : 1) * (s.deep ? 1 : 0.626) * Math.max(0.04, progress);
  const files = FILES.filter((f) => s.deep || f.where === "named");
  const vol = (s.volume !== undefined ? d.volumes[s.volume] : d.volumes.find((v) => v.letter)) ?? d.volumes[0];
  const volumeName = `${vol.letter ? `${vol.letter} ` : ""}${vol.label || "Partition"} (${vol.fs || "unknown"})`;
  const types = typesTree(files, k);
  const total = sum(types);
  return {
    types,
    folders: foldersTree(files, k, s, volumeName),
    files,
    total: { ...total, deleted: Math.round((total.count * 3025) / 4888), good: Math.round((total.count * 3907) / 4888) },
  };
}

/** The scan's numbers per type, in KIND_ORDER (the live "Found so far" chips). */
export function kindTotals(r: Results): number[] {
  return r.types.map((t) => t.count);
}

/** What a full scan of the drive is estimated to take. */
export const fullMinutes = (drive: number, volume?: number) => Math.max(1, Math.round(DRIVES[drive].fullMin * (volume !== undefined ? 0.8 : 1)));
