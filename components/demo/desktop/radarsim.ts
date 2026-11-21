// A pretend storm for the preview: a squall line moving across central Oklahoma,
// drawn like the app's radar (same color scales, smooth/sharp, opacity) with
// lightning strikes, alert areas and a basemap sketched in plain lines.
// Nothing here is real weather.

import { useEffect, useState } from "react";

export const RADAR_PALETTES: Record<"classic" | "vivid" | "aurora" | "ice", string[]> = {
  classic: ["#58b2c8", "#4092de", "#3c70e8", "#30c470", "#24aa4e", "#1c923e", "#f2e22c", "#f6b61e", "#f6801a", "#ec3c2c", "#c41820", "#a00e54", "#de2cb6", "#a25ce2", "#f6eeff"],
  vivid: ["#04e9e7", "#019ff4", "#0300f4", "#02fd02", "#01c501", "#008e00", "#fdf802", "#e5bc00", "#fd9500", "#fd0000", "#d40000", "#bc0000", "#f800fd", "#9854c6", "#fdfdfd"],
  aurora: ["#144664", "#00788c", "#00aaaa", "#00d2b4", "#28e6c8", "#5ac8ff", "#788cff", "#9664ff", "#be50f0", "#eb46c8", "#ff4696", "#ff6e78", "#ffaa96", "#ffdcc8", "#ffffff"],
  ice: ["#1e375f", "#284b7d", "#3264a0", "#3c7dc3", "#4b94da", "#5faaec", "#78bef6", "#96cefa", "#afdcfc", "#c8e8ff", "#dcf0ff", "#ebf6ff", "#f5faff", "#fafcff", "#ffffff"],
};

/** When the preview opened: storms are placed relative to this. */
const T0 = Date.now();

// ------------------------------------------------------------------ geometry

const R = 3958.8;
export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR;
  const dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const mercY = (lat: number) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;

export interface View {
  lon: number;
  lat: number;
  zoom: number;
}

/** lon/lat -> pixels for a w x h map around the view centre (web-mercator, 256px tiles). */
export function projector(view: View, w: number, h: number) {
  const k = (512 * 2 ** view.zoom) / 360;
  const cy = mercY(view.lat);
  return {
    k,
    x: (lon: number) => w / 2 + (lon - view.lon) * k,
    y: (lat: number) => h / 2 - (mercY(lat) - cy) * k,
    lon: (px: number) => view.lon + (px - w / 2) / k,
    lat: (py: number) => {
      const my = cy - (py - h / 2) / k;
      return (Math.atan(Math.exp((my * Math.PI) / 180)) * 360) / Math.PI - 90;
    },
  };
}

// ------------------------------------------------------------------ storms

interface Cell {
  lon: number;
  lat: number;
  /** Size along / across the line, degrees. */
  a: number;
  b: number;
  ang: number;
  peak: number;
  pulse: number;
}

/** Motion of the whole system, degrees per hour (toward the east-northeast). */
const VX = 0.42;
const VY = 0.2;

const LINE: Cell[] = (() => {
  const cells: Cell[] = [];
  // The squall line, southwest to northeast, just west of Oklahoma City.
  const pts: [number, number][] = [
    [-99.1, 34.25],
    [-98.75, 34.6],
    [-98.42, 34.95],
    [-98.15, 35.28],
    [-97.92, 35.6],
    [-97.7, 35.95],
    [-97.5, 36.3],
    [-97.3, 36.68],
    [-97.1, 37.05],
  ];
  pts.forEach(([lon, lat], i) => {
    const core = i === 3 || i === 4 || i === 6 ? 66 : i % 2 ? 56 : 50;
    cells.push({ lon: lon + 0.3, lat, a: 0.3, b: 0.13, ang: 0.85, peak: core, pulse: i * 1.3 });
    // Lighter rain trailing behind the line.
    cells.push({ lon: lon + 0.3 - 0.32, lat: lat + 0.06, a: 0.45, b: 0.26, ang: 0.85, peak: 32, pulse: i });
  });
  // A lone supercell out ahead, and scattered showers.
  cells.push({ lon: -98.55, lat: 34.2, a: 0.1, b: 0.08, ang: 0.6, peak: 70, pulse: 2 });
  cells.push({ lon: -96.6, lat: 34.6, a: 0.12, b: 0.08, ang: 0.4, peak: 34, pulse: 5 });
  cells.push({ lon: -95.9, lat: 35.1, a: 0.09, b: 0.07, ang: 0.2, peak: 28, pulse: 3 });
  cells.push({ lon: -99.6, lat: 36.4, a: 0.25, b: 0.14, ang: 0.9, peak: 26, pulse: 7 });
  return cells;
})();

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Storm cells where they are at time `t` (ms). */
export function cellsAt(t: number): (Cell & { dbz: number })[] {
  const hrs = (t - T0) / 3600000;
  return LINE.map((cl) => ({
    ...cl,
    lon: cl.lon + VX * hrs,
    lat: cl.lat + VY * hrs,
    dbz: cl.peak * (0.92 + 0.08 * Math.sin(hrs * 6 + cl.pulse)),
  }));
}

/** Reflectivity (dBZ) at a point for the given cells. */
function dbzAt(lon: number, lat: number, cells: ReturnType<typeof cellsAt>, hrs: number): number {
  let best = 0;
  for (const cl of cells) {
    const dx = lon - cl.lon;
    const dy = lat - cl.lat;
    const ca = Math.cos(cl.ang);
    const sa = Math.sin(cl.ang);
    const u = (dx * ca + dy * sa) / cl.a;
    const v = (-dx * sa + dy * ca) / cl.b;
    const d2 = u * u + v * v;
    if (d2 > 9) continue;
    const val = cl.dbz * Math.exp(-d2 * 0.9);
    if (val > best) best = val;
  }
  if (best <= 0) return 0;
  const nx = (lon - VX * hrs) * 14;
  const ny = (lat - VY * hrs) * 14;
  const tex = noise(nx, ny) * 0.6 + noise(nx * 2.3, ny * 2.3) * 0.4;
  return best * (0.68 + tex * 0.55);
}

/** Paints the radar for one scan time into an offscreen canvas the size of the field grid. */
export function paintRadar(view: View, w: number, h: number, t: number, palette: keyof typeof RADAR_PALETTES, cell = 4): HTMLCanvasElement {
  const gw = Math.max(1, Math.ceil(w / cell));
  const gh = Math.max(1, Math.ceil(h / cell));
  const cv = document.createElement("canvas");
  cv.width = gw;
  cv.height = gh;
  cv.dataset.cell = String(cell);
  const ctx = cv.getContext("2d");
  if (!ctx) return cv;
  const img = ctx.createImageData(gw, gh);
  const p = projector(view, w, h);
  const cells = cellsAt(t);
  const hrs = (t - T0) / 3600000;
  const stops = (RADAR_PALETTES[palette] ?? RADAR_PALETTES.classic).map((hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
  for (let gy = 0; gy < gh; gy++) {
    const lat = p.lat((gy + 0.5) * cell);
    for (let gx = 0; gx < gw; gx++) {
      const lon = p.lon((gx + 0.5) * cell);
      const dbz = dbzAt(lon, lat, cells, hrs);
      if (dbz < 12) continue;
      const idx = Math.min(stops.length - 1, Math.max(0, Math.floor((dbz - 5) / 5)));
      const [r, g, b] = stops[idx];
      const i = (gy * gw + gx) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = Math.round(255 * Math.min(1, (dbz - 12) / 10));
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ------------------------------------------------------------------ basemap

type Line = [number, number][];

export const BORDERS: Line[] = [
  [[-109, 37], [-94.62, 37]],
  [[-94.62, 37], [-94.62, 40]],
  [[-102.05, 40], [-95.3, 40]],
  [[-102.05, 37], [-102.05, 40]],
  [[-103, 37], [-103, 32]],
  [[-103, 36.5], [-100, 36.5], [-100, 34.56]],
  [[-100, 34.56], [-99.2, 34.4], [-98.4, 34.12], [-97.6, 33.9], [-97.0, 33.75], [-96.3, 33.85], [-95.6, 33.88], [-94.9, 33.7], [-94.48, 33.64]],
  [[-94.48, 33.64], [-94.43, 35.4], [-94.62, 37]],
  [[-94.04, 33.02], [-94.04, 31.0]],
  [[-94.48, 33.64], [-94.04, 33.55], [-94.04, 33.02], [-91.2, 33.02]],
];

export const ROADS: { name: string; line: Line }[] = [
  { name: "35", line: [[-97.2, 32.4], [-97.25, 33.2], [-97.3, 34.2], [-97.45, 35.2], [-97.5, 35.47], [-97.33, 36.0], [-97.3, 36.9], [-97.34, 37.69], [-96.2, 38.4]] },
  { name: "40", line: [[-103.5, 35.15], [-101.83, 35.2], [-100, 35.22], [-99.4, 35.4], [-97.5, 35.47], [-96.9, 35.35], [-95.4, 35.45], [-94.4, 35.38], [-92.3, 35.0]] },
  { name: "44", line: [[-98.5, 33.9], [-98.4, 34.6], [-97.9, 35.1], [-97.5, 35.47], [-96.6, 35.85], [-95.99, 36.15], [-95.2, 36.6], [-94.5, 37.1]] },
  { name: "70", line: [[-102.05, 39.3], [-98.5, 38.9], [-95.7, 39.05]] },
  { name: "27", line: [[-101.83, 35.2], [-101.85, 33.58], [-101.9, 32.2]] },
];

export const CITIES: { name: string; lon: number; lat: number; big?: boolean }[] = [
  { name: "Oklahoma City", lon: -97.52, lat: 35.47, big: true },
  { name: "Tulsa", lon: -95.99, lat: 36.15, big: true },
  { name: "Wichita", lon: -97.34, lat: 37.69, big: true },
  { name: "Dallas", lon: -96.8, lat: 32.78, big: true },
  { name: "Amarillo", lon: -101.83, lat: 35.22, big: true },
  { name: "Norman", lon: -97.44, lat: 35.22 },
  { name: "Lawton", lon: -98.39, lat: 34.6 },
  { name: "Wichita Falls", lon: -98.49, lat: 33.91 },
  { name: "Enid", lon: -97.88, lat: 36.4 },
  { name: "Stillwater", lon: -97.06, lat: 36.12 },
  { name: "Ponca City", lon: -97.09, lat: 36.71 },
  { name: "Woodward", lon: -99.39, lat: 36.43 },
  { name: "Ardmore", lon: -97.14, lat: 34.17 },
  { name: "Fort Smith", lon: -94.4, lat: 35.39 },
  { name: "Joplin", lon: -94.51, lat: 37.08 },
  { name: "Guymon", lon: -101.48, lat: 36.68 },
  { name: "Elk City", lon: -99.4, lat: 35.41 },
  { name: "Shawnee", lon: -96.93, lat: 35.33 },
  { name: "Muskogee", lon: -95.37, lat: 35.75 },
  { name: "Durant", lon: -96.37, lat: 33.99 },
  { name: "Coffeyville", lon: -95.62, lat: 37.04 },
  { name: "Dodge City", lon: -100.02, lat: 37.75 },
  { name: "Salina", lon: -97.61, lat: 38.84 },
  { name: "Altus", lon: -99.33, lat: 34.64 },
];

export const BASEMAPS: Record<"dark" | "liberty" | "positron" | "bright", { bg: string; land2: string; border: string; road: string; label: string; halo: string; water: string }> = {
  dark: { bg: "#0b0d12", land2: "#0f1218", border: "rgba(255,255,255,0.22)", road: "rgba(255,255,255,0.11)", label: "rgba(200,210,225,0.62)", halo: "rgba(0,0,0,0.85)", water: "#0a1420" },
  liberty: { bg: "#f2efe9", land2: "#e8efd9", border: "rgba(120,100,140,0.55)", road: "rgba(230,160,90,0.8)", label: "rgba(50,50,60,0.85)", halo: "rgba(255,255,255,0.9)", water: "#a8cfe8" },
  positron: { bg: "#f3f4f4", land2: "#eceeee", border: "rgba(150,150,150,0.6)", road: "rgba(210,210,210,1)", label: "rgba(90,90,90,0.85)", halo: "rgba(255,255,255,0.9)", water: "#cad7e0" },
  bright: { bg: "#f8f4f0", land2: "#e4efd2", border: "rgba(160,120,170,0.6)", road: "rgba(255,200,80,0.95)", label: "rgba(40,40,40,0.9)", halo: "rgba(255,255,255,0.9)", water: "#9ec8ef" },
};

export const RADAR_TOWERS = [
  { name: "Twin Lakes", lon: -97.278, lat: 35.333 },
  { name: "Tulsa", lon: -95.565, lat: 36.175 },
  { name: "Vance", lon: -98.128, lat: 36.741 },
  { name: "Frederick", lon: -98.976, lat: 34.362 },
  { name: "Wichita", lon: -97.443, lat: 37.654 },
  { name: "Amarillo", lon: -101.709, lat: 35.233 },
];

// ------------------------------------------------------------------ alerts

export interface AlertArea {
  event: string;
  tier: "warning" | "watch";
  color: string;
  poly: Line;
  until: string;
}

export const ALERTS: AlertArea[] = [
  {
    event: "Tornado Watch",
    tier: "watch",
    color: "#ffe23a",
    poly: [[-99.6, 34.0], [-96.6, 34.0], [-96.6, 36.9], [-99.6, 36.9]],
    until: "10:00 PM",
  },
  {
    event: "Severe Thunderstorm Warning",
    tier: "warning",
    color: "#ffb000",
    poly: [[-98.05, 35.1], [-97.45, 35.2], [-97.4, 35.78], [-97.85, 35.9], [-98.15, 35.5]],
    until: "7:45 PM",
  },
];

function inside(lon: number, lat: number, poly: Line): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export interface NearAlert extends AlertArea {
  miles: number;
}

/** Alerts over or within `range` miles of a point (0 = any), warnings first. */
export function alertsNear(lat: number, lon: number, range: number, level: "warnings" | "watches" | "all"): NearAlert[] {
  const out: NearAlert[] = [];
  for (const a of ALERTS) {
    if (level === "warnings" && a.tier !== "warning") continue;
    let miles = 0;
    if (!inside(lon, lat, a.poly)) {
      miles = Infinity;
      for (let i = 0; i < a.poly.length; i++) {
        const [x1, y1] = a.poly[i];
        const [x2, y2] = a.poly[(i + 1) % a.poly.length];
        for (let s = 0; s <= 10; s++) {
          const f = s / 10;
          miles = Math.min(miles, distanceMiles(lat, lon, y1 + (y2 - y1) * f, x1 + (x2 - x1) * f));
        }
      }
    }
    if (range > 0 && miles > range) continue;
    out.push({ ...a, miles });
  }
  return out.sort((x, y) => (x.tier === y.tier ? x.miles - y.miles : x.tier === "warning" ? -1 : 1));
}

export const describeNear = (a: NearAlert) => `${a.event} · ${a.miles < 0.5 ? "over you" : `${Math.round(a.miles)} mi`}`;

/** The rain-arrival estimate for a point (nowcast.ts wording). */
export function nowcastFor(lat: number, lon: number): { text: string; kind: "arriving" | "raining" | "dry"; heading: string; mph: number } {
  const hrs = (Date.now() - T0) / 3600000;
  const cells = cellsAt(Date.now());
  if (dbzAt(lon, lat, cells, hrs) >= 20) return { text: "Raining now · likely clears in ~40 min", kind: "raining", heading: "NE", mph: 31 };
  for (let m = 5; m <= 120; m += 5) {
    const t = Date.now() + m * 60000;
    if (dbzAt(lon, lat, cellsAt(t), (t - T0) / 3600000) >= 20) return { text: `Rain likely in ~${m} min`, kind: "arriving", heading: "NE", mph: 31 };
  }
  return { text: "No rain heading your way", kind: "dry", heading: "NE", mph: 31 };
}

// ------------------------------------------------------------------ lightning (shared by every map + the storm widget)

export interface Strike {
  lon: number;
  lat: number;
  t: number;
}

const strikes: Strike[] = [];
let seeded = false;
let timer = 0;
let users = 0;
const listeners = new Set<() => void>();

function spawn(at: number) {
  const strong = cellsAt(at).filter((cl) => cl.peak >= 50);
  const cl = strong[Math.floor(Math.random() * strong.length)];
  const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.7;
  strikes.push({ lon: cl.lon + g() * cl.a * 1.2, lat: cl.lat + g() * cl.a * 0.9, t: at });
}

function seed() {
  if (seeded) return;
  seeded = true;
  const now = Date.now();
  for (let i = 0; i < 260; i++) spawn(now - Math.random() * 60 * 60000);
  strikes.sort((a, b) => a.t - b.t);
}

function tick() {
  const n = Math.random() < 0.35 ? 2 : 1;
  for (let i = 0; i < n; i++) spawn(Date.now());
  const cutoff = Date.now() - 61 * 60000;
  while (strikes.length && strikes[0].t < cutoff) strikes.shift();
  listeners.forEach((l) => l());
  timer = window.setTimeout(tick, 350 + Math.random() * 900);
}

/** Live strikes; re-renders the caller every second and on new strikes when `onStrike` is used. */
export function useStrikes(enabled: boolean): Strike[] {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    seed();
    users++;
    if (users === 1) timer = window.setTimeout(tick, 600);
    const l = () => setN((v) => v + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
      users--;
      if (users === 0) window.clearTimeout(timer);
    };
  }, [enabled]);
  return enabled ? strikes : [];
}

export function strikesNear(list: Strike[], lat: number, lon: number, range: number, minutes: number): { count: number; closest: number; newest: number } {
  const since = Date.now() - minutes * 60000;
  let count = 0;
  let closest = Infinity;
  let newest = 0;
  for (const s of list) {
    if (s.t < since) continue;
    const d = distanceMiles(lat, lon, s.lat, s.lon);
    if (range > 0 && d > range) continue;
    count++;
    closest = Math.min(closest, d);
    newest = Math.max(newest, s.t);
  }
  return { count, closest, newest };
}

/** Scan times: newest first is the last item, one every 5 minutes, the newest about 2 minutes old. */
export function scanTimes(minutes: number, pro: boolean): number[] {
  const newest = Math.floor((Date.now() - 90000) / 120000) * 120000;
  const n = pro ? Math.round(minutes / 5) + 1 : 1;
  return Array.from({ length: n }, (_, i) => newest - (n - 1 - i) * 5 * 60000);
}
