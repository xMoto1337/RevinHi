"use client";

import { useId } from "react";
import s from "./ai.module.css";

/** Class names as the real app writes them ("btn btn-primary"), mapped to this module's scoped names. */
export function c(...names: (string | false | null | undefined)[]): string {
  return names
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => s[n] ?? n)
    .join(" ");
}

// ------------------------------------------------------------------ icons (the app's own line icons)

const P: Record<string, string> = {
  chat: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-5 4V6a1 1 0 0 1 1-1z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6",
  box: "M12 3 3 8l9 5 9-5zM3 13l9 5 9-5",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  plus: "M12 5v14M5 12h14",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18",
  text: "M5 6h14M5 12h14M5 18h9",
  image: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM9 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM21 16l-5-5-9 9",
  brush: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  video: "M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM16 10l5-3v10l-5-3",
  music: "M9 18V5l11-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  waves: "M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2",
  clip: "m20 11-8 8a5 5 0 0 1-7-7l8-8a3 3 0 0 1 4 4l-8 8a1 1 0 0 1-2-2l7-7",
  mic: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM5 11a7 7 0 0 0 14 0M12 18v3",
  arrow: "M5 12h14M13 6l6 6-6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  copy: "M9 8h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3",
  speaker: "M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6",
  redo: "M20 12a8 8 0 1 1-3-6.2M20 4v5h-5",
  alert: "M12 3 2 20h20zM12 10v4M12 17v.5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
  pin: "M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  ruler: "m3 17 14-14 4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  rings: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  locate: "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 2v3M12 19v3M2 12h3M19 12h3",
  layers: "M12 3 2 8l10 5 10-5zM2 13l10 5 10-5",
  tent: "M12 4 3 20h18zM12 11l-3 9M12 11l3 9",
  flag: "M5 21V4h11l-2 4 2 4H5",
  heli: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 8v8M15 8v8M9 12h6",
  drop: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z",
  x: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5 10 17l9-10",
  chevron: "m6 9 6 6 6-6",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  upload: "M12 20V9M7 14l5-5 5 5M5 4h14",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  folder: "M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
  play: "M7 4v16l13-8z",
  stop: "M6 6h12v12H6z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  code: "M9 7l-5 5 5 5M15 7l5 5-5 5",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  megaphone: "M3 10v4h4l7 4V6l-7 4zM18 9a4 4 0 0 1 0 6",
  palette: "M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3.5 3H16a2 2 0 0 0-1.5 3.3c.4.5.5 1 .5 1.4 0 .8-1.3 1.3-3 1.3zM7.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM11 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM16 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  unlock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 7.7-1.5",
  cpu: "M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4",
  wand: "M15 4V2M15 10V8M11 6h2M17 6h2M4 20 14 10M18 8l-2-2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-3.5 3.5-5.5 7-5.5s6.2 2 7 5.5M16 3.5a4 4 0 0 1 0 7.5M22 21c-.5-2.5-2-4.3-4-5",
  shirt: "M9 3 4 5.5 2.5 10l3.2 1.3L7 10v11h10V10l1.3 1.3 3.2-1.3L20 5.5 15 3c-.5 1.4-1.6 2.3-3 2.3S9.5 4.4 9 3z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  doc: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6",
  dot: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  layout: "M4 4h16v16H4zM4 10h16M10 10v10",
};

export function Icon({ name, size, className = "" }: { name: string; size?: "sm" | "lg"; className?: string }) {
  return (
    <svg className={c("ic", size, className)} viewBox="0 0 24 24" aria-hidden="true">
      <path d={P[name] ?? P.dot} />
    </svg>
  );
}

// ------------------------------------------------------------------ the RevinHi R (from the app's R.svg)

const R_BODY =
  "M472,553 L1520,553 C1650,553 1713,620 1713,725 C1713,880 1620,1040 1500,1075 C1450,1092 1420,1100 1380,1100 L1260,1100 L1712,1488 L1264,1488 L867,1094 L251,1488 L651,931 L1296,931 C1340,931 1372,905 1388,862 L1399,815 C1404,790 1395,778 1372,778 L272,778 Z";
const R_SLASH = "M287,794 L884,815 L335,927 L540,845 Z";
const R_FIN = "M251,1488 L867,1094 L931,1157 L921,1195 L290,1488 Z";

export function RLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} style={style} viewBox="230 530 1505 980" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="553" x2="0" y2="1488" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#1c1c1c" />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="340" y1="920" x2="880" y2="815" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9b1fd6" />
          <stop offset="1" stopColor="#b53cf0" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="300" y1="1480" x2="900" y2="1140" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14c83a" />
          <stop offset="1" stopColor="#2ee85a" />
        </linearGradient>
        <filter id={`${id}b`} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <g fill="#ffffff" opacity="0.45" filter={`url(#${id}b)`}>
        <path d={R_SLASH} />
        <path d={R_FIN} />
        <path d={R_BODY} />
      </g>
      <path d={R_SLASH} fill={`url(#${id}f)`} />
      <path d={R_FIN} fill={`url(#${id}f)`} />
      <path d={R_BODY} fill={`url(#${id}f)`} />
      <path d="M343,921 L542,849 L870,817 Z" fill={`url(#${id}p)`} />
      <path d="M306,1477 L876,1127 L912,1187 Z" fill={`url(#${id}g)`} />
    </svg>
  );
}

// ------------------------------------------------------------------ pictures (cut from the site's screenshot)

/** Areas of /ai/create.jpg (a real screenshot of the app's gallery), as x, y, w, h. */
const PICS = {
  neon: [436, 460, 172, 232],
  cup: [627, 486, 172, 206],
  mug: [818, 486, 171, 206],
  ramen: [1008, 461, 172, 230],
  street: [1199, 460, 172, 232],
  ramenBig: [447, 153, 185, 274],
} as const;
export type PicId = keyof typeof PICS;

/** One of the pictures, cropped to fill its box (like object-fit: cover). */
export function Pic({ id, className, moving }: { id: PicId; className?: string; moving?: boolean }) {
  const [x, y, w, h] = PICS[id];
  return (
    <svg className={c("pic", moving && "moving", className)} viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <image href="/ai/create.jpg" x="0" y="0" width="1400" height="860" />
    </svg>
  );
}

export function Switch({ on, onClick, extra }: { on: boolean; onClick?: () => void; extra?: string }) {
  return (
    <button type="button" className={c("switch", extra, on && "on")} onClick={onClick} aria-pressed={on}>
      <span className={c("switch-knob")} />
    </button>
  );
}

// ------------------------------------------------------------------ elevation lines (same method as the app's lib/topo.ts)

export type Noise = (x: number, y: number) => number;

export function makeNoise(seed: number): Noise {
  const p = new Uint8Array(512);
  const perm = [...Array(256).keys()];
  let st = seed;
  const rnd = () => (st = (st * 16807) % 2147483647) / 2147483647;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const g = (hh: number, x: number, y: number) => (hh & 1 ? -x : x) + (hh & 2 ? -y : y);
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  return (x, y) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = p[X] + Y;
    const b = p[X + 1] + Y;
    return lerp(v, lerp(u, g(p[a], x, y), g(p[b], x - 1, y)), lerp(u, g(p[a + 1], x, y - 1), g(p[b + 1], x - 1, y - 1)));
  };
}

export interface Field {
  f: Float32Array;
  cols: number;
  rows: number;
  step: number;
}

export const elevationAt = (noise: Noise, x: number, y: number) => noise(x, y) * 0.65 + noise(x * 2.1, y * 2.1) * 0.25 + noise(x * 4.3, y * 4.3) * 0.1;

/** Height samples every `step` px; `scale` = feature size in px; ox/oy shift the terrain (px). */
export function heights(noise: Noise, w: number, h: number, step: number, scale: number, ox = 0, oy = 0): Field {
  const cols = Math.ceil(w / step) + 1;
  const rows = Math.ceil(h / step) + 1;
  const f = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) f[j * cols + i] = elevationAt(noise, (i * step + ox) / scale, (j * step + oy) / scale);
  return { f, cols, rows, step };
}

const SEG: Record<number, number[]> = { 1: [3, 0], 2: [0, 1], 3: [3, 1], 4: [1, 2], 5: [3, 0, 1, 2], 6: [0, 2], 7: [3, 2], 8: [2, 3], 9: [2, 0], 10: [0, 1, 2, 3], 11: [2, 1], 12: [1, 3], 13: [1, 0], 14: [0, 3] };

/** Contour lines at every `gap` of height; every 5th line is a major (index) line. */
export function contours(ctx: CanvasRenderingContext2D, F: Field, gap: number, minor: string, major: string, widths: [number, number] = [0.8, 1.15], dx = 0, dy = 0) {
  const { f, cols, rows, step } = F;
  let k = 0;
  for (let t = -0.6; t <= 0.6; t += gap, k++) {
    const isMajor = k % 5 === 0;
    ctx.strokeStyle = isMajor ? major : minor;
    ctx.lineWidth = isMajor ? widths[1] : widths[0];
    ctx.beginPath();
    for (let j = 0; j < rows - 1; j++)
      for (let i = 0; i < cols - 1; i++) {
        const a = f[j * cols + i];
        const b = f[j * cols + i + 1];
        const cc = f[(j + 1) * cols + i + 1];
        const d = f[(j + 1) * cols + i];
        const idx = (a > t ? 1 : 0) | (b > t ? 2 : 0) | (cc > t ? 4 : 0) | (d > t ? 8 : 0);
        if (!idx || idx === 15) continue;
        const x = i * step + dx;
        const y = j * step + dy;
        const L = (p: number, q: number) => (t - p) / (q - p);
        const PT = [
          [x + step * L(a, b), y],
          [x + step, y + step * L(b, cc)],
          [x + step * L(d, cc), y + step],
          [x, y + step * L(a, d)],
        ];
        const sg = SEG[idx];
        for (let n = 0; n < sg.length; n += 2) {
          ctx.moveTo(PT[sg[n]][0], PT[sg[n]][1]);
          ctx.lineTo(PT[sg[n + 1]][0], PT[sg[n + 1]][1]);
        }
      }
    ctx.stroke();
  }
}

/** Shaded relief (light from the north-west) between two "r, g, b" colors. */
export function relief(ctx: CanvasRenderingContext2D, F: Field, low: string, high: string, dx = 0, dy = 0) {
  const lo = low.split(",").map(Number);
  const hi = high.split(",").map(Number);
  const { f, cols, rows, step } = F;
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols - 1; i++) {
      const e = f[j * cols + i];
      const sx = f[j * cols + i + 1] - e;
      const sy = f[(j + 1) * cols + i] - e;
      const t = Math.max(0, Math.min(1, e + 0.5));
      const sh = Math.max(0, Math.min(1, 0.55 + (sx - sy) * 7));
      const m = (a: number, b: number) => ((a + (b - a) * t) * (0.7 + sh * 0.55)) | 0;
      ctx.fillStyle = `rgb(${m(lo[0], hi[0])},${m(lo[1], hi[1])},${m(lo[2], hi[2])})`;
      ctx.fillRect(i * step + dx, j * step + dy, step + 1, step + 1);
    }
}

/** A canvas sized for the screen's pixel density; returns its context in CSS pixels. */
export function sized(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// ------------------------------------------------------------------ formatting (same rules as the app)

export const gb = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(b / 1e6))} MB`);

export function leftText(secs: number): string {
  if (secs < 8) return "almost done";
  if (secs < 60) return `about ${Math.round(secs / 5) * 5} s left`;
  if (secs < 3600) return `about ${Math.round(secs / 60)} min left`;
  const h = Math.floor(secs / 3600);
  return `about ${h} h ${Math.round((secs - h * 3600) / 60)} min left`;
}

export function fmtLatLng([lon, lat]: [number, number]) {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
}

export function fmtDistance(m: number, feet = false) {
  if (feet) {
    const ft = m * 3.28084;
    return ft < 1000 ? `${Math.round(ft)} ft` : `${(m / 1609.344).toFixed(ft < 52800 ? 2 : 1)} mi`;
  }
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const compass = (deg: number) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
