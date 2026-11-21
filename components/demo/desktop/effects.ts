// Copied from the real app (revinhi-radar/src/desktop/effects.ts) for the website preview.
// Full-screen overlay effects: Rain, Snow, Light Rays, Audio Glow. A port of
// RevinHi Wallpapers' EffectsContentFactory.cs - same per-kind maths for
// intensity / speed / opacity, drawn on one Canvas2D per monitor.
//
// Rain is NOT drawn here: like Wallpapers, it's real green-screen
// rain-on-glass footage (Wallpapers' Assets/RainOverlay.mp4), chroma-keyed
// with ffmpeg once and shipped as a VP9 WebM with an alpha channel
// (public/effects/rain.webm), played by EffectsLayer in a <video>. Made with
// the ffmpeg.exe Wallpapers bundles, same key as RainVideoBaker.cs plus an
// alpha lift weighted by brightness (highlights read, interiors stay glassy):
//   ffmpeg -i RainOverlay.mp4 -an -vf "chromakey=0x00FF00:0.30:0.15,
//     despill=type=green,scale=1280:720,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':
//     b='b(X,Y)':a='clip(alpha(X,Y)*(0.75+1.9*(r(X,Y)+g(X,Y)+b(X,Y))/765),0,255)',
//     format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0
//     -b:v 0 -crf 34 -row-mt 1 rain.webm
//
// Effects sit above the wallpaper AND the widgets ("glass in front of the
// room"), one instance per kind per monitor, toggled on/off - not positioned.
// Like procedural.ts, everything is drawn in the monitor's LOGICAL
// coordinates, so the Editor preview matches the desktop exactly.

import { EffectInstance, EffectKind } from "./types";
import { Rgba, parseHex } from "./color";
import { mulberry32 } from "./procedural";

export interface EffectDef {
  kind: EffectKind;
  label: string;
  hint: string;
  /** What the Speed slider means for this kind. */
  speedLabel: string;
  intensityLabel: string;
  usesColor: boolean;
  defaults: Omit<EffectInstance, "kind" | "enabled">;
}

export const EFFECTS: EffectDef[] = [
  {
    kind: "rain",
    label: "Rain",
    hint: "Real rain-on-glass footage over everything.",
    speedLabel: "Playback speed",
    intensityLabel: "Wetness",
    usesColor: false,
    defaults: { intensity: 0.6, speed: 0.5, opacity: 0.8, color: "#FFFFFFFF" },
  },
  {
    kind: "snow",
    label: "Snow",
    hint: "Soft drifting flakes.",
    speedLabel: "Fall speed",
    intensityLabel: "Amount",
    usesColor: true,
    defaults: { intensity: 0.5, speed: 0.4, opacity: 0.85, color: "#FFFFFFFF" },
  },
  {
    kind: "light_rays",
    label: "Light Rays",
    hint: "Slow sweeping god-rays.",
    speedLabel: "Drift speed",
    intensityLabel: "Strength",
    usesColor: true,
    defaults: { intensity: 0.5, speed: 0.4, opacity: 0.45, color: "#FFE3A8FF" },
  },
  {
    kind: "audio_glow",
    label: "Audio Glow",
    hint: "A soft pulsing glow (reacts to music in a coming update).",
    speedLabel: "Responsiveness",
    intensityLabel: "Pulse size",
    usesColor: true,
    defaults: { intensity: 0.5, speed: 0.4, opacity: 0.35, color: "#8A5CFFFF" },
  },
  {
    kind: "lightning",
    label: "Lightning",
    hint: "Bolts forking down with a flash of the whole screen.",
    speedLabel: "How often",
    intensityLabel: "Storm strength",
    usesColor: true,
    defaults: { intensity: 0.6, speed: 0.45, opacity: 0.9, color: "#D6E4FFFF" },
  },
  {
    kind: "fog",
    label: "Fog",
    hint: "Soft fog banks drifting low across the screen.",
    speedLabel: "Drift speed",
    intensityLabel: "Thickness",
    usesColor: true,
    defaults: { intensity: 0.5, speed: 0.3, opacity: 0.7, color: "#DDE6F0FF" },
  },
  {
    kind: "embers",
    label: "Embers",
    hint: "Glowing sparks rising and flickering.",
    speedLabel: "Rise speed",
    intensityLabel: "Amount",
    usesColor: true,
    defaults: { intensity: 0.5, speed: 0.4, opacity: 0.9, color: "#FF8A3DFF" },
  },
  {
    kind: "shooting_stars",
    label: "Shooting Stars",
    hint: "Meteors streaking across the sky now and then.",
    speedLabel: "How often",
    intensityLabel: "How many at once",
    usesColor: true,
    defaults: { intensity: 0.4, speed: 0.4, opacity: 0.95, color: "#EAF2FFFF" },
  },
  {
    kind: "dust",
    label: "Dust Motes",
    hint: "Sunlit specks drifting slowly through the air.",
    speedLabel: "Drift speed",
    intensityLabel: "Amount",
    usesColor: true,
    defaults: { intensity: 0.5, speed: 0.3, opacity: 0.8, color: "#FFE6B8FF" },
  },
  {
    kind: "cinematic",
    label: "Cinematic",
    hint: "A soft vignette and film grain for a movie-like finish.",
    speedLabel: "Film grain",
    intensityLabel: "Vignette",
    usesColor: false,
    defaults: { intensity: 0.55, speed: 0.4, opacity: 1, color: "#000000FF" },
  },
];

export function effectDef(kind: EffectKind): EffectDef {
  return EFFECTS.find((e) => e.kind === kind) ?? EFFECTS[0];
}

/** The monitor's instance of a kind, or a disabled default one. */
export function effectOf(effects: EffectInstance[], kind: EffectKind): EffectInstance {
  return effects.find((e) => e.kind === kind) ?? { kind, enabled: false, ...effectDef(kind).defaults };
}

/** Returns a new effects list with `patch` applied to `kind` (adding it if missing). */
export function patchEffect(effects: EffectInstance[], kind: EffectKind, patch: Partial<EffectInstance>): EffectInstance[] {
  const next = { ...effectOf(effects, kind), ...patch, kind };
  return effects.some((e) => e.kind === kind) ? effects.map((e) => (e.kind === kind ? next : e)) : [...effects, next];
}

/** A full effect instance for presets. */
export function makeEffect(kind: EffectKind, patch: Partial<EffectInstance> = {}): EffectInstance {
  return { kind, enabled: true, ...effectDef(kind).defaults, ...patch };
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const wrap01 = (v: number) => v - Math.floor(v);

// ---------------------------------------------------------------------
// Rain - the app plays real rain-on-glass footage here; the preview draws a
// light stand-in on the canvas instead (same three sliders).
// ---------------------------------------------------------------------

function rain(e: EffectInstance): Painter {
  const random = mulberry32(0x7a1);
  const intensity = clamp01(e.intensity);
  const opacity = clamp01(e.opacity) * (0.4 + intensity * 0.6);
  const speedScale = 0.6 + clamp01(e.speed) * 0.8;
  const drops = Array.from({ length: Math.round(70 + intensity * 170) }, () => ({
    x: random(),
    y: random(),
    r: 1.5 + random() * random() * 7,
    a: 0.25 + random() * 0.5,
  }));
  const streaks = Array.from({ length: Math.round(8 + intensity * 26) }, () => ({
    x: random(),
    ph: random(),
    sp: 0.08 + random() * 0.22,
    len: 0.04 + random() * 0.12,
    w: 1.5 + random() * 2.5,
  }));
  const falls = Array.from({ length: Math.round(40 + intensity * 120) }, () => ({
    x: random(),
    ph: random(),
    sp: 0.9 + random() * 0.8,
    len: 0.03 + random() * 0.05,
  }));
  return (ctx, t, w, h) => {
    const k = Math.min(w, h) / 1080;
    ctx.save();
    // Fine rain falling behind the glass.
    ctx.strokeStyle = `rgba(200, 215, 235, ${0.18 * opacity})`;
    ctx.lineWidth = 1.2 * k;
    ctx.beginPath();
    for (const f of falls) {
      const y = wrap01(f.ph + t * f.sp * speedScale) * (h * 1.2) - h * 0.1;
      const x = f.x * w + (y / h) * 30 * k;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 6 * k, y + f.len * h);
    }
    ctx.stroke();
    // Beads sitting on the glass.
    for (const d of drops) {
      const x = d.x * w;
      const y = d.y * h;
      const r = d.r * k * 1.6;
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.55 * d.a * opacity})`);
      g.addColorStop(0.6, `rgba(190,205,225,${0.18 * d.a * opacity})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Drops running down the glass.
    ctx.lineCap = "round";
    for (const s of streaks) {
      const p = wrap01(s.ph + t * s.sp * speedScale * 0.35);
      const y = p * (h * 1.3) - h * 0.15;
      const x = s.x * w + Math.sin(p * 9 + s.ph * 6) * 4 * k;
      const g = ctx.createLinearGradient(x, y - s.len * h, x, y);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `rgba(235,242,255,${0.5 * opacity})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = s.w * k * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y - s.len * h);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.6 * opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, s.w * k * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
}

// ---------------------------------------------------------------------
// Canvas effects
// ---------------------------------------------------------------------

type Painter = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void;

/** Soft round sprite in a color: drawn once, stamped many times. */
function softDot(c: Rgba, size = 64): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const g = cv.getContext("2d")!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  const rgb = `${c.r}, ${c.g}, ${c.b}`;
  grad.addColorStop(0, `rgba(${rgb}, 1)`);
  grad.addColorStop(0.45, `rgba(${rgb}, 0.85)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return cv;
}

/**
 * A light shaft: soft on both long edges and fading at both ends. Wallpapers
 * used one diagonal LinearGradientBrush on a rectangle, which left hard long
 * edges; a pre-rendered sprite gives the same shape with feathered sides at
 * no per-frame cost.
 */
function raySprite(c: Rgba): HTMLCanvasElement {
  const W = 64;
  const H = 256;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const v = Math.sin((y / (H - 1)) * Math.PI); // 0 -> 1 -> 0 along the shaft
    for (let x = 0; x < W; x++) {
      const u = Math.sin((x / (W - 1)) * Math.PI); // feathered sides
      const a = Math.pow(u, 1.6) * Math.pow(v, 1.2) * 0.5 * c.a;
      const i = (y * W + x) * 4;
      img.data[i] = c.r;
      img.data[i + 1] = c.g;
      img.data[i + 2] = c.b;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
}

function snow(e: EffectInstance): Painter {
  const tint = parseHex(e.color);
  const random = mulberry32(0x5e0f1a4e);
  const sprite = softDot({ ...tint, a: 1 });
  const count = Math.round(20 + clamp01(e.intensity) * 130);
  const flakes = Array.from({ length: count }, () => {
    // Wallpapers' ranges (fall 0.03-0.08 screen/s, drift 0.01-0.03), plus
    // depth: most flakes are small and distant, a few are big, soft and
    // close, and nearer flakes fall faster. Wallpapers' flat 2-5.5 px dots
    // read as stars on a 1440p screen.
    const depth = random();
    const near = random() < 0.07;
    return {
      seedX: random(),
      seedY: random(),
      fall: 0.03 + depth * 0.05 + (near ? 0.03 : 0),
      driftPhase: random() * Math.PI * 2,
      drift: 0.01 + random() * 0.02,
      size: 2.5 + depth * depth * 6 + (near ? 7 + random() * 5 : 0),
      alpha: tint.a * (near ? 0.35 + random() * 0.25 : 0.45 + random() * 0.5),
    };
  });
  const speedScale = 0.4 + clamp01(e.speed) * 1.6;
  const opacity = clamp01(e.opacity);
  return (ctx, t, w, h) => {
    for (const f of flakes) {
      const drift = Math.sin(t * 0.6 + f.driftPhase) * f.drift;
      const x = wrap01(f.seedX + drift * 1.5 + Math.sin(t * 0.15 + f.driftPhase) * 0.02) * w;
      const y = wrap01(f.seedY + t * f.fall * speedScale) * (h + 20) - 10;
      // The sprite's soft edge makes a flake read ~1.6x its core size.
      const d = f.size * 1.6;
      ctx.globalAlpha = f.alpha * opacity;
      ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  };
}

function lightRays(e: EffectInstance): Painter {
  const tint = parseHex(e.color);
  const random = mulberry32(0x11a7e5);
  const sprite = raySprite(tint);
  const rays = Array.from({ length: 4 }, () => ({
    seedX: random(),
    drift: 0.02 + random() * 0.03,
    phase: random() * Math.PI * 2,
    widthMul: 0.8 + random() * 0.5,
  }));
  const intensity = clamp01(e.intensity);
  const speedScale = 0.3 + clamp01(e.speed) * 1.2;
  const opacityScale = (0.2 + intensity * 0.8) * clamp01(e.opacity);
  const angle = (18 * Math.PI) / 180;
  return (ctx, t, w, h) => {
    const diag = Math.hypot(w, h);
    const rayH = diag * 1.3;
    for (const r of rays) {
      // Feathered sprite, so it's drawn ~2x Wallpapers' hard-edged width.
      const rayW = diag * (0.06 + intensity * 0.05) * 2 * r.widthMul;
      const left = wrap01(r.seedX + t * r.drift * speedScale) * (w + diag) - diag / 2;
      const top = -diag * 0.15;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = opacityScale * (0.6 + ((Math.sin(t * 0.4 + r.phase) + 1) / 2) * 0.4);
      ctx.translate(left + rayW / 2, top + rayH / 2);
      ctx.rotate(angle);
      ctx.drawImage(sprite, -rayW / 2, -rayH / 2, rayW, rayH);
      ctx.restore();
    }
  };
}

/** Until real audio capture lands: a slow, slightly irregular "breathing". */
export function idleAudioLevel(t: number): number {
  return clamp01(0.35 + 0.22 * Math.sin(t * 1.1) + 0.12 * Math.sin(t * 2.7 + 1.3) + 0.06 * Math.sin(t * 5.3));
}

function audioGlow(e: EffectInstance, getLevel: (t: number) => number): Painter {
  const tint = parseHex(e.color);
  const rgb = `${tint.r}, ${tint.g}, ${tint.b}`;
  const intensity = clamp01(e.intensity);
  const opacity = clamp01(e.opacity);
  const responsiveness = 0.05 + clamp01(e.speed) * 0.5;
  let smoothed = 0;
  return (ctx, t, w, h) => {
    smoothed += (clamp01(getLevel(t)) - smoothed) * responsiveness;
    const maxDim = Math.max(w, h);
    const size = maxDim * 0.5 + maxDim * 0.9 * intensity * smoothed;
    const r = size / 2;
    const alpha = clamp01(0.15 + smoothed * 0.85) * opacity * tint.a;
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
    g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    g.addColorStop(0.5, `rgba(${rgb}, ${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(w / 2 - r, h / 2 - r, size, size);
  };
}

/**
 * Storm lightning: every few seconds a jagged bolt forks down from the top
 * with a double flash of the whole screen. Each strike is seeded by its
 * cycle number, so it's deterministic (and identical in the preview).
 */
function lightning(e: EffectInstance): Painter {
  const tint = parseHex(e.color);
  const rgb = `${tint.r}, ${tint.g}, ${tint.b}`;
  const intensity = clamp01(e.intensity);
  const opacity = clamp01(e.opacity);
  // Frequency: one strike every ~12 s at the bottom of the slider, ~2.5 s at the top.
  const period = 12 - clamp01(e.speed) * 9.5;
  type Bolt = { pts: [number, number][]; branches: [number, number][][] };
  const bolts = new Map<number, Bolt>();
  const makeBolt = (cycle: number): Bolt => {
    const r = mulberry32(0xb017 + cycle * 7919);
    const walk = (x: number, y: number, len: number, spread: number): [number, number][] => {
      const pts: [number, number][] = [[x, y]];
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        x += (r() - 0.5) * spread;
        y += len / steps;
        pts.push([x, y]);
      }
      return pts;
    };
    const pts = walk(0.15 + r() * 0.7, -0.02, 0.45 + r() * 0.35, 0.06);
    const branches = Array.from({ length: 2 + Math.floor(r() * 3) }, () => {
      const [bx, by] = pts[2 + Math.floor(r() * (pts.length - 4))];
      return walk(bx, by, 0.12 + r() * 0.15, 0.05);
    });
    return { pts, branches };
  };
  const stroke = (ctx: CanvasRenderingContext2D, pts: [number, number][], w: number, h: number) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
    ctx.stroke();
  };
  return (ctx, t, w, h) => {
    const cycle = Math.floor(t / period);
    const age = t - cycle * period;
    // Not every cycle strikes; low intensity skips more of them.
    if (mulberry32(cycle * 31 + 7)() > 0.35 + intensity * 0.65) return;
    // Double flash: a bright hit, a dip, a second hit, then a fade.
    const env = age < 0.06 ? 1 : age < 0.12 ? 0.25 : age < 0.2 ? 0.85 : Math.max(0, 1 - (age - 0.2) / 0.5);
    if (env <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(${rgb}, ${0.32 * env * opacity * (0.5 + intensity * 0.5)})`;
    ctx.fillRect(0, 0, w, h);
    if (age < 0.45) {
      let bolt = bolts.get(cycle);
      if (!bolt) {
        bolt = makeBolt(cycle);
        bolts.clear();
        bolts.set(cycle, bolt);
      }
      ctx.lineJoin = "round";
      // Wide soft glow -> bright channel -> white-hot core, so a bolt reads
      // even on a 4K screen or a scaled-down preview.
      for (const [lw, a, white] of [[28, 0.12, false], [11, 0.35, false], [4, 1, false], [1.6, 1, true]] as const) {
        ctx.strokeStyle = white ? `rgba(255, 255, 255, ${env * opacity})` : `rgba(${rgb}, ${a * env * opacity})`;
        ctx.lineWidth = lw * (Math.min(w, h) / 1080);
        stroke(ctx, bolt.pts, w, h);
        ctx.lineWidth *= 0.6;
        for (const b of bolt.branches) stroke(ctx, b, w, h);
      }
    }
    ctx.restore();
  };
}

/** Low drifting fog banks across the lower half of the screen. */
function fog(e: EffectInstance): Painter {
  const tint = parseHex(e.color);
  const random = mulberry32(0xf06);
  const sprite = softDot({ ...tint, a: 1 }, 128);
  const intensity = clamp01(e.intensity);
  const banks = Array.from({ length: 5 + Math.round(intensity * 7) }, () => ({
    x: random(),
    y: 0.45 + random() * 0.55,
    w: 0.5 + random() * 0.7,
    h: 0.12 + random() * 0.18,
    sp: (0.004 + random() * 0.01) * (random() < 0.5 ? -1 : 1),
    a: 0.08 + random() * 0.12,
    ph: random() * Math.PI * 2,
  }));
  const speedScale = 0.3 + clamp01(e.speed) * 2;
  const opacity = clamp01(e.opacity);
  return (ctx, t, w, h) => {
    for (const b of banks) {
      const x = (wrap01(b.x + t * b.sp * speedScale) * 1.6 - 0.3) * w;
      const y = (b.y + Math.sin(t * 0.05 + b.ph) * 0.02) * h;
      ctx.globalAlpha = b.a * opacity * (0.6 + intensity * 0.6) * (0.8 + 0.2 * Math.sin(t * 0.2 + b.ph));
      ctx.drawImage(sprite, x - (b.w * w) / 2, y - (b.h * h) / 2, b.w * w, b.h * h);
    }
    ctx.globalAlpha = 1;
  };
}

/** Glowing embers drifting up from the bottom, flickering as they go. */
function embers(e: EffectInstance): Painter {
  const tint = parseHex(e.color);
  const random = mulberry32(0xe3be7);
  const sprite = softDot({ ...tint, a: 1 });
  const hot = softDot({ r: 255, g: 240, b: 200, a: 1 });
  const count = Math.round(15 + clamp01(e.intensity) * 110);
  const sparks = Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    rise: 0.03 + random() * 0.08,
    sway: 0.01 + random() * 0.03,
    ph: random() * Math.PI * 2,
    size: 2 + random() * 5,
    flick: 3 + random() * 6,
  }));
  const speedScale = 0.4 + clamp01(e.speed) * 1.6;
  const opacity = clamp01(e.opacity);
  return (ctx, t, w, h) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const s of sparks) {
      const life = wrap01(s.y + t * s.rise * speedScale); // 0 = bottom, 1 = top
      const x = wrap01(s.x + Math.sin(t * 0.7 + s.ph) * s.sway + life * 0.05) * w;
      const y = (1 - life) * (h + 20) - 10;
      const fade = Math.min(1, life * 6) * (1 - life);
      const flicker = 0.6 + 0.4 * Math.sin(t * s.flick + s.ph);
      const d = s.size * 3 * (1 - life * 0.5);
      ctx.globalAlpha = fade * flicker * opacity;
      ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d);
      ctx.drawImage(hot, x - d / 6, y - d / 6, d / 3, d / 3);
    }
    ctx.restore();
  };
}

/** Occasional meteors streaking across the upper sky with a glowing head. */
function shootingStars(e: EffectInstance): Painter {
  const tint = parseHex(e.color);
  const rgb = `${tint.r}, ${tint.g}, ${tint.b}`;
  const head = softDot({ ...tint, a: 1 });
  // How often: one every ~9 s at the bottom of the slider, ~1.5 s at the top.
  const period = 9 - clamp01(e.speed) * 7.5;
  const opacity = clamp01(e.opacity);
  const lanes = 1 + Math.round(clamp01(e.intensity) * 3);
  return (ctx, t, w, h) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let lane = 0; lane < lanes; lane++) {
      const lt = t + lane * period * 0.37;
      const cycle = Math.floor(lt / period);
      const age = lt - cycle * period;
      const dur = 0.9;
      if (age > dur) continue;
      const r = mulberry32(0x5a7 + cycle * 977 + lane * 31);
      const x0 = (0.1 + r() * 0.8) * w;
      const y0 = r() * 0.35 * h;
      const ang = (20 + r() * 25) * (Math.PI / 180) * (r() < 0.5 ? 1 : -1);
      const len = (0.18 + r() * 0.2) * Math.max(w, h);
      const p = age / dur;
      const hx = x0 + Math.cos(ang) * len * p * (ang < 0 ? -1 : 1);
      const hy = y0 + Math.abs(Math.sin(ang)) * len * p;
      const tail = len * 0.35;
      const tx = hx - Math.cos(ang) * tail * (ang < 0 ? -1 : 1);
      const ty = hy - Math.abs(Math.sin(ang)) * tail;
      const fade = Math.sin(p * Math.PI) * opacity;
      const g = ctx.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, `rgba(${rgb}, 0)`);
      g.addColorStop(1, `rgba(${rgb}, ${fade})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.2 * (Math.min(w, h) / 1080);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      const d = 18 * (Math.min(w, h) / 1080);
      ctx.globalAlpha = fade;
      ctx.drawImage(head, hx - d / 2, hy - d / 2, d, d);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
}

/** Sunlit dust motes drifting slowly, catching the light as they turn. */
function dust(e: EffectInstance): Painter {
  const tint = parseHex(e.color);
  const random = mulberry32(0xd057);
  const sprite = softDot({ ...tint, a: 1 });
  const count = Math.round(20 + clamp01(e.intensity) * 120);
  const motes = Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    size: 1.5 + random() * random() * 7,
    sx: (random() - 0.5) * 0.012,
    sy: (random() - 0.6) * 0.01,
    ph: random() * Math.PI * 2,
    tw: 0.4 + random() * 1.4,
  }));
  const speedScale = 0.3 + clamp01(e.speed) * 1.8;
  const opacity = clamp01(e.opacity);
  return (ctx, t, w, h) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      const x = wrap01(m.x + t * m.sx * speedScale + Math.sin(t * 0.3 + m.ph) * 0.01) * w;
      const y = wrap01(m.y + t * m.sy * speedScale + Math.cos(t * 0.25 + m.ph) * 0.01) * h;
      const glint = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * m.tw + m.ph), 3);
      const d = m.size * 2.2 * (Math.min(w, h) / 1080);
      ctx.globalAlpha = glint * opacity * 0.8;
      ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d);
    }
    ctx.restore();
  };
}

/** Film look: a soft vignette plus animated grain. Intensity = vignette, Speed = grain. */
function cinematic(e: EffectInstance): Painter {
  const vignette = clamp01(e.intensity);
  const grainAmt = clamp01(e.speed);
  const opacity = clamp01(e.opacity);
  // One tile of noise, reused at a random offset every frame.
  const N = 192;
  const noise = document.createElement("canvas");
  noise.width = noise.height = N;
  const nctx = noise.getContext("2d")!;
  const img = nctx.createImageData(N, N);
  const random = mulberry32(0x6a1);
  for (let i = 0; i < N * N; i++) {
    const v = Math.round(random() * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  let pattern: CanvasPattern | null = null;
  return (ctx, t, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${0.75 * vignette * opacity})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (grainAmt > 0.01) {
      pattern ??= ctx.createPattern(noise, "repeat");
      if (!pattern) return;
      const f = Math.floor(t * 24);
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.18 * grainAmt * opacity;
      ctx.translate((f * 37) % N, (f * 61) % N);
      ctx.fillStyle = pattern;
      ctx.fillRect(-N, -N, w + N * 2, h + N * 2);
      ctx.restore();
    }
  };
}

/** Canvas kinds, bottom-up draw order. Rain is the <video> above them. */
const CANVAS_ORDER: EffectKind[] = ["audio_glow", "fog", "light_rays", "dust", "embers", "snow", "shooting_stars", "lightning", "cinematic", "rain"];

export function canvasEffects(effects: EffectInstance[]): EffectInstance[] {
  return CANVAS_ORDER.map((k) => effects.find((e) => e.kind === k && e.enabled)).filter((e): e is EffectInstance => !!e);
}

export const EFFECTS_FPS = 30;

/**
 * Runs the enabled canvas effects until stopped (same frame cap and
 * backing-store rule as procedural.runScene). Time is wall-clock based so a
 * rebuilt runner (a slider moved) continues where the old one was instead
 * of restarting every flake from the top.
 */
export function runEffects(
  canvas: HTMLCanvasElement,
  effects: EffectInstance[],
  logicalW: number,
  logicalH: number,
  getAudioLevel: (t: number) => number = idleAudioLevel,
  /** Paint one frame and stop (gallery thumbnails). */
  still = false,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const painters = effects.map((e) => {
    switch (e.kind) {
      case "snow":
        return snow(e);
      case "light_rays":
        return lightRays(e);
      case "audio_glow":
        return audioGlow(e, getAudioLevel);
      case "lightning":
        return lightning(e);
      case "fog":
        return fog(e);
      case "embers":
        return embers(e);
      case "shooting_stars":
        return shootingStars(e);
      case "dust":
        return dust(e);
      case "cinematic":
        return cinematic(e);
      case "rain":
        return rain(e);
      default:
        return null;
    }
  }).filter((p): p is Painter => !!p);
  if (painters.length === 0) return () => {};

  let raf = 0;
  let last = -Infinity;
  const frameMs = 1000 / EFFECTS_FPS;
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    ctx.setTransform(bw / logicalW, 0, 0, bh / logicalH, 0, 0);
    const t = (performance.timeOrigin + now) / 1000 - EPOCH;
    for (const p of painters) p(ctx, t, logicalW, logicalH);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/** Keeps wall-clock seconds small enough for float precision in sin(). */
const EPOCH = 1_790_000_000;
