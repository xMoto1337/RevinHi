// Copied from the real app (revinhi-radar/src/desktop/procedural.ts) for the website preview.
// Generated (not sourced) animated wallpapers - a Canvas2D port of RevinHi
// Wallpapers' ProceduralContentFactory.cs + ProceduralPalette.cs +
// ProceduralSpec.cs. Same 4 styles x 15 palettes, same per-style constants
// and animation maths; the seed reshuffles layout within a style+palette.
//
// One implementation drives both the Editor preview and the live desktop.
// Everything is drawn in the monitor's LOGICAL coordinate space (the surface
// is laid out at monitor size and only visually scaled in the preview), so
// dot sizes, wave shapes etc. match between preview and desktop exactly.
//
// The seeded RNG is mulberry32, not .NET's System.Random, so a given seed
// produces a different (but equally random) layout than the WPF app did.

import { ProceduralStyle, WallpaperSource } from "./types";
import { Rgba, parseHex, rgbaCss } from "./color";
import { EXTRA_STYLES, ExtraStyle, SceneFn, makeExtraScene } from "./scenes";

export interface ProceduralPalette {
  name: string;
  primary: string;
  secondary: string;
}

/** Wallpapers' ProceduralPalettes.All, converted from #AARRGGBB to CSS hex. */
export const PROCEDURAL_PALETTES: ProceduralPalette[] = [
  { name: "Cyan Drift", primary: "#00E5FF", secondary: "#8A5CFF" },
  { name: "Sunset Blaze", primary: "#FF7A00", secondary: "#FF2FD1" },
  { name: "Forest Pulse", primary: "#2ED573", secondary: "#00B8A9" },
  { name: "Deep Space", primary: "#3B3F7A", secondary: "#6C5CE7" },
  { name: "Crimson Ember", primary: "#FF3B30", secondary: "#FFB400" },
  { name: "Mint Frost", primary: "#7CF5D6", secondary: "#FFFFFF" },
  { name: "Royal Violet", primary: "#8A5CFF", secondary: "#FF2FD1" },
  { name: "Golden Hour", primary: "#FFD54F", secondary: "#FF7A00" },
  { name: "Arctic Blue", primary: "#00B8FF", secondary: "#E8F9FF" },
  { name: "Blood Moon", primary: "#FF3B30", secondary: "#3B3F7A" },
  { name: "Toxic Bloom", primary: "#B6FF00", secondary: "#00FFA3" },
  { name: "Rose Gold", primary: "#FFB6C1", secondary: "#FFD700" },
  { name: "Midnight Teal", primary: "#0D7377", secondary: "#14FFEC" },
  { name: "Solar Flare", primary: "#FF9500", secondary: "#FFEE00" },
  { name: "Ultraviolet", primary: "#7B2FF7", secondary: "#F107A3" },
  // Added with the scene styles (scenes.ts).
  { name: "Aurora", primary: "#00FFA3", secondary: "#7B2FF7" },
  { name: "Vaporwave", primary: "#01CDFE", secondary: "#FF71CE" },
  { name: "Outrun", primary: "#FFD54F", secondary: "#FF2FD1" },
  { name: "Matrix", primary: "#00FF66", secondary: "#003A1C" },
  { name: "Alpenglow", primary: "#FF9E6B", secondary: "#5B4BDB" },
  { name: "Moonlight", primary: "#8FB8FF", secondary: "#1B2A4A" },
  { name: "Lava", primary: "#FF5E3A", secondary: "#FFB400" },
  { name: "Opal", primary: "#7CF5D6", secondary: "#FF71CE" },
  { name: "Firefly", primary: "#FFE066", secondary: "#2ED573" },
];

export const PROCEDURAL_STYLES: { value: ProceduralStyle; label: string }[] = [
  { value: "particles", label: "Particles" },
  { value: "starfield", label: "Starfield" },
  { value: "gradient_flow", label: "Gradient Flow" },
  { value: "waves", label: "Waves" },
  ...(Object.keys(EXTRA_STYLES) as ExtraStyle[]).map((value) => ({ value, label: EXTRA_STYLES[value].label })),
];

export type ProceduralSpec = Extract<WallpaperSource, { kind: "procedural" }>;

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

export function proceduralSource(style: ProceduralStyle, palette: ProceduralPalette, seed = randomSeed()): ProceduralSpec {
  return { kind: "procedural", style, palette: palette.name, primary: palette.primary, secondary: palette.secondary, seed };
}

/** Deterministic PRNG in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wrap01 = (v: number) => v - Math.floor(v);

function lerp(a: Rgba, b: Rgba, t: number): Rgba {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: a.a + (b.a - a.a) * t };
}

/** BackgroundBrush(): a diagonal gradient from near-black to a very dark tint. */
function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, tint: Rgba, darker: boolean) {
  const dark = { r: Math.floor(tint.r * 0.06), g: Math.floor(tint.g * 0.06), b: Math.floor(tint.b * 0.06), a: 1 };
  const darkest = darker ? { r: 0, g: 0, b: 0, a: 1 } : { r: 5, g: 5, b: 8, a: 1 };
  // WPF LinearGradientBrush (0,0)->(1,1) in relative units = corner to corner.
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, rgbaCss(darkest));
  g.addColorStop(1, rgbaCss(dark));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A built scene: draw(ctx, t, w, h) paints one full frame in logical units. */
export type Scene = SceneFn;

export function createScene(spec: ProceduralSpec): Scene {
  const primary = parseHex(spec.primary);
  const secondary = parseHex(spec.secondary);
  const random = mulberry32(spec.seed);
  switch (spec.style) {
    case "particles":
      return particles(primary, secondary, random);
    case "starfield":
      return starfield(primary, secondary, random);
    case "gradient_flow":
      return gradientFlow(primary, secondary, random);
    case "waves":
      return waves(primary, secondary, random);
    default:
      return makeExtraScene(spec.style, primary, secondary, random) ?? ((ctx, _t, w, h) => {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
      });
  }
}

function particles(primary: Rgba, secondary: Rgba, random: () => number): Scene {
  const count = 60;
  const dots = Array.from({ length: count }, (_, i) => ({
    seedX: random(),
    seedY: random(),
    speed: 0.01 + random() * 0.02,
    driftAngle: random() * Math.PI * 2,
    phase: random() * Math.PI * 2,
    radius: 1.5 + random() * 3,
    color: rgbaCss(i % 2 === 0 ? primary : secondary),
  }));
  return (ctx, t, w, h) => {
    paintBackground(ctx, w, h, primary, false);
    for (const d of dots) {
      // WPF placed the ellipse's top-left corner at (x, y).
      const x = wrap01(d.seedX + Math.cos(d.driftAngle) * d.speed * t) * w;
      const y = wrap01(d.seedY + Math.sin(d.driftAngle) * d.speed * t) * h;
      ctx.globalAlpha = 0.3 + ((Math.sin(t * 1.5 + d.phase) + 1) / 2) * 0.6;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(x + d.radius, y + d.radius, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
}

function starfield(primary: Rgba, secondary: Rgba, random: () => number): Scene {
  const count = 140;
  const stars = Array.from({ length: count }, () => {
    const x = random();
    const y = random();
    const phase = random() * Math.PI * 2;
    const twinkleSpeed = 0.6 + random() * 1.4;
    const size = random() < 0.15 ? 2.5 : 1.2;
    const color = random() < 0.2 ? rgbaCss(secondary) : "#FFFFFF";
    return { x, y, phase, twinkleSpeed, size, color };
  });
  return (ctx, t, w, h) => {
    paintBackground(ctx, w, h, primary, true);
    for (const s of stars) {
      ctx.globalAlpha = 0.2 + ((Math.sin(t * s.twinkleSpeed + s.phase) + 1) / 2) * 0.8;
      ctx.fillStyle = s.color;
      const r = s.size / 2;
      ctx.beginPath();
      ctx.arc(s.x * w + r, s.y * h + r, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
}

function gradientFlow(primary: Rgba, secondary: Rgba, random: () => number): Scene {
  const blobCount = 4;
  const blobs = Array.from({ length: blobCount }, (_, i) => {
    const color = i % 2 === 0 ? primary : secondary;
    return {
      inner: rgbaCss({ ...color, a: 140 / 255 }),
      outer: rgbaCss({ ...color, a: 0 }),
      orbitRadiusX: 0.15 + random() * 0.2,
      orbitRadiusY: 0.15 + random() * 0.2,
      orbitSpeed: 0.08 + random() * 0.1,
      orbitPhase: random() * Math.PI * 2,
      blobSize: 0.35 + random() * 0.25,
    };
  });
  return (ctx, t, w, h) => {
    paintBackground(ctx, w, h, primary, true);
    for (const b of blobs) {
      const size = b.blobSize * Math.max(w, h);
      const cx = w / 2 + Math.cos(t * b.orbitSpeed + b.orbitPhase) * w * b.orbitRadiusX;
      const cy = h / 2 + Math.sin(t * b.orbitSpeed * 1.3 + b.orbitPhase) * h * b.orbitRadiusY;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      g.addColorStop(0, b.inner);
      g.addColorStop(1, b.outer);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

function waves(primary: Rgba, secondary: Rgba, random: () => number): Scene {
  const bandCount = 5;
  const bands = Array.from({ length: bandCount }, (_, i) => {
    const progress = i / (bandCount - 1);
    const color = lerp(primary, secondary, progress);
    return {
      fill: rgbaCss({ ...color, a: 70 / 255 }),
      frequency: 1.2 + random() * 1.0,
      speed: 0.5 + random() * 0.6,
      phase: random() * Math.PI * 2,
      amplitude: 0.04 + random() * 0.05,
      baseline: 0.35 + progress * 0.5,
    };
  });
  const steps = 24;
  return (ctx, t, w, h) => {
    paintBackground(ctx, w, h, primary, true);
    for (const b of bands) {
      ctx.fillStyle = b.fill;
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const xf = s / steps;
        const y = (b.baseline + Math.sin(xf * b.frequency * Math.PI * 2 + t * b.speed + b.phase) * b.amplitude) * h;
        if (s === 0) ctx.moveTo(xf * w, y);
        else ctx.lineTo(xf * w, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    }
  };
}

/** Frame cap: Wallpapers' renderer ticked at ~30 fps; a wallpaper should stay cheap. */
export const PROCEDURAL_FPS = 30;

/**
 * Runs a scene on a canvas until stopped. The canvas is laid out at the
 * monitor's logical size (logicalW x logicalH CSS px); its backing store
 * follows the canvas's ON-SCREEN size x devicePixelRatio every frame, so a
 * scaled-down preview doesn't render a full 4K bitmap and a resize / DPI
 * change is picked up without extra wiring.
 *
 * `still` paints a single representative frame and stops (gallery thumbnails):
 * trail-based scenes get a short warm-up so the still isn't blank.
 */
export const STILL_T = 9;

export function runScene(canvas: HTMLCanvasElement, spec: ProceduralSpec, logicalW: number, logicalH: number, still = false): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const scene = createScene(spec);
  const start = performance.now();
  let raf = 0;
  let last = -Infinity;
  const frameMs = 1000 / PROCEDURAL_FPS;

  const frame = (now: number) => {
    if (!still) raf = requestAnimationFrame(frame);
    if (!still && now - last < frameMs - 1) return;
    last = now;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const bw = Math.max(1, Math.round(rect.width * dpr));
    const bh = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(bw / logicalW, 0, 0, bh / logicalH, 0, 0);
    if (!still) {
      scene(ctx, (now - start) / 1000, logicalW, logicalH);
    } else if (scene.trails) {
      for (let i = 0; i < 90; i++) scene(ctx, STILL_T - 3 + i / 30, logicalW, logicalH);
    } else {
      scene(ctx, STILL_T, logicalW, logicalH);
    }
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
