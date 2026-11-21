// Copied from the real app (revinhi-radar/src/desktop/scenes.ts) for the website preview.
// The "mesmerizing" procedural wallpapers (everything past the 4 styles ported
// from RevinHi Wallpapers in procedural.ts). Same contract: a scene is built
// once from (primary, secondary, seeded rng) and then paints a full frame in
// the monitor's LOGICAL units for any time t (seconds).
//
// They run behind the icons all day at 30 fps, so every one is built to be
// cheap: glow is stamped from cached sprites (never shadowBlur / ctx.filter),
// fluid looks (lava, liquid) are computed on a tiny field and scaled up, and
// counts are fixed rather than growing with resolution.

import { Rgba } from "./color";

export type SceneFn = ((ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void) & {
  /** Paints on top of its previous frame (fading trails) - needs a warm-up for a still thumbnail. */
  trails?: boolean;
};

const TAU = Math.PI * 2;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const frac = (v: number) => v - Math.floor(v);
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function mix(a: Rgba, b: Rgba, t: number): Rgba {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
}
function shade(c: Rgba, k: number): Rgba {
  return { r: c.r * k, g: c.g * k, b: c.b * k, a: 1 };
}
const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const css = (c: Rgba, a = 1) => `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`;

// ---------------------------------------------------------------------
// Cached sprites
// ---------------------------------------------------------------------

type SpriteKind = "glow" | "bokeh" | "ray";
const sprites = new Map<string, HTMLCanvasElement>();

/** A soft glow / bokeh disc / aurora ray in one color, drawn once and stamped with drawImage. */
function sprite(c: Rgba, kind: SpriteKind = "glow"): HTMLCanvasElement {
  const rgb = `${c.r | 0},${c.g | 0},${c.b | 0}`;
  const key = `${kind}:${rgb}`;
  const cached = sprites.get(key);
  if (cached) return cached;
  const cv = document.createElement("canvas");
  if (kind === "ray") {
    cv.width = 32;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const v = g.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, `rgba(${rgb},0)`);
    v.addColorStop(0.5, `rgba(${rgb},0.25)`);
    v.addColorStop(0.85, `rgba(${rgb},1)`);
    v.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = v;
    g.fillRect(0, 0, 32, 256);
    g.globalCompositeOperation = "destination-in";
    const hz = g.createLinearGradient(0, 0, 32, 0);
    hz.addColorStop(0, "rgba(0,0,0,0)");
    hz.addColorStop(0.5, "rgba(0,0,0,1)");
    hz.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = hz;
    g.fillRect(0, 0, 32, 256);
  } else {
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    const stops: [number, number][] =
      kind === "bokeh"
        ? [[0, 0.32], [0.7, 0.42], [0.88, 0.75], [0.96, 0.3], [1, 0]]
        : [[0, 1], [0.12, 0.7], [0.35, 0.22], [0.65, 0.05], [1, 0]];
    for (const [o, a] of stops) r.addColorStop(o, `rgba(${rgb},${a})`);
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  }
  sprites.set(key, cv);
  return cv;
}

function stamp(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, size: number, alpha: number) {
  if (alpha <= 0.003 || size <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

function verticalSky(ctx: CanvasRenderingContext2D, w: number, h: number, stops: [number, Rgba][]) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [o, c] of stops) g.addColorStop(o, css(c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

interface Star {
  x: number;
  y: number;
  r: number;
  ph: number;
  sp: number;
}
function makeStars(rnd: () => number, n: number, maxY = 1): Star[] {
  return Array.from({ length: n }, () => ({
    x: rnd(),
    y: rnd() * maxY,
    r: rnd() < 0.08 ? 1.7 : rnd() < 0.4 ? 1.1 : 0.7,
    ph: rnd() * TAU,
    sp: 0.4 + rnd() * 1.6,
  }));
}
function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], t: number, w: number, h: number, tint: Rgba = WHITE, k = 1) {
  ctx.fillStyle = css(tint);
  for (const s of stars) {
    ctx.globalAlpha = k * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)));
    ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
  }
  ctx.globalAlpha = 1;
}

/** A periodic ridge line: sum of integer-frequency sines, so it tiles seamlessly as it scrolls. */
function ridge(rnd: () => number, octaves = 4) {
  const terms = Array.from({ length: octaves }, (_, i) => ({ k: 1 + i * 2 + Math.floor(rnd() * 3), a: 1 / (1 + i * 1.4), ph: rnd() * TAU }));
  const norm = terms.reduce((s, x) => s + x.a, 0);
  return (u: number) => terms.reduce((s, x) => s + x.a * Math.sin(u * TAU * x.k + x.ph), 0) / norm;
}

/** Low-res field -> scaled-up image, for the fluid styles. */
function fieldCanvas() {
  const cv = document.createElement("canvas");
  let img: ImageData | null = null;
  return {
    cv,
    ensure(fw: number, fh: number) {
      if (cv.width !== fw || cv.height !== fh || !img) {
        cv.width = fw;
        cv.height = fh;
        img = cv.getContext("2d")!.createImageData(fw, fh);
      }
      return img;
    },
    commit() {
      if (img) cv.getContext("2d")!.putImageData(img, 0, 0);
    },
  };
}

// ---------------------------------------------------------------------
// Aurora - rippling light curtains over a dark ridge
// ---------------------------------------------------------------------

function aurora(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const stars = makeStars(rnd, 220, 0.8);
  const curtains = [0, 1, 2].map((i) => ({
    base: 0.3 + i * 0.07 + rnd() * 0.05,
    amp: 0.05 + rnd() * 0.05,
    f1: 0.8 + rnd() * 1.2,
    f2: 2.2 + rnd() * 2,
    sp: 0.05 + rnd() * 0.05,
    ph: rnd() * TAU,
    col: i === 1 ? s : i === 2 ? mix(p, s, 0.5) : p,
    height: 0.24 + rnd() * 0.12,
    alpha: 0.26 - i * 0.045,
  }));
  const hills = ridge(rnd, 5);
  const N = 200;
  return (ctx, t, w, h) => {
    verticalSky(ctx, w, h, [
      [0, { r: 1, g: 2, b: 8, a: 1 }],
      [0.65, shade(mix(p, s, 0.5), 0.07)],
      [1, shade(p, 0.16)],
    ]);
    drawStars(ctx, stars, t, w, h);
    ctx.globalCompositeOperation = "lighter";
    const rw = (w / N) * 5;
    for (const c of curtains) {
      const img = sprite(c.col, "ray");
      for (let i = 0; i <= N; i++) {
        const xf = i / N;
        const y = (c.base + c.amp * Math.sin(xf * TAU * c.f1 + t * c.sp * 2 + c.ph) + c.amp * 0.45 * Math.sin(xf * TAU * c.f2 - t * c.sp * 3.4)) * h;
        const hh = c.height * h * (0.65 + 0.35 * Math.sin(xf * TAU * 3.3 + t * 0.6 + c.ph));
        const a = c.alpha * (0.5 + 0.5 * Math.sin(xf * TAU * c.f2 * 1.7 + t * 0.9 + c.ph));
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.drawImage(img, xf * w - rw / 2, y - hh * 0.85, rw, hh);
      }
    }
    stamp(ctx, sprite(p), w * 0.5, h * 0.95, w * 1.1, 0.12);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#010204";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= 80; i++) ctx.lineTo((i / 80) * w, h * (0.86 + hills(i / 80) * 0.05));
    ctx.lineTo(w, h);
    ctx.fill();
  };
}

// ---------------------------------------------------------------------
// Nebula - slowly turning clouds of colored gas and twinkling stars
// ---------------------------------------------------------------------

function nebula(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const stars = makeStars(rnd, 320);
  const clouds = Array.from({ length: 18 }, (_, i) => ({
    ang: rnd() * TAU,
    rad: 0.04 + rnd() * 0.32,
    size: i < 8 ? 0.35 + rnd() * 0.5 : 0.12 + rnd() * 0.2,
    col: mix(p, s, rnd()),
    alpha: 0.2 + rnd() * 0.25,
    spin: (0.004 + rnd() * 0.008) * (rnd() < 0.3 ? -1 : 1),
    ph: rnd() * TAU,
  }));
  const bright = Array.from({ length: 7 }, () => ({ x: rnd(), y: rnd(), ph: rnd() * TAU, c: rnd() < 0.5 ? p : s }));
  return (ctx, t, w, h) => {
    verticalSky(ctx, w, h, [
      [0, { r: 2, g: 2, b: 6, a: 1 }],
      [1, shade(s, 0.06)],
    ]);
    drawStars(ctx, stars, t, w, h, WHITE, 0.9);
    ctx.globalCompositeOperation = "lighter";
    const m = Math.max(w, h);
    for (const c of clouds) {
      const a = c.ang + t * c.spin;
      const x = w / 2 + Math.cos(a) * c.rad * w;
      const y = h / 2 + Math.sin(a) * c.rad * h * 0.8;
      stamp(ctx, sprite(c.col), x, y, c.size * m, c.alpha * (0.8 + 0.2 * Math.sin(t * 0.15 + c.ph)));
    }
    for (const b of bright) {
      const k = 0.6 + 0.4 * Math.sin(t * 0.8 + b.ph);
      stamp(ctx, sprite(mix(b.c, WHITE, 0.6)), b.x * w, b.y * h, 26 * k, 0.9);
      ctx.globalAlpha = 0.35 * k;
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x * w - 14 * k, b.y * h - 0.5, 28 * k, 1);
      ctx.fillRect(b.x * w - 0.5, b.y * h - 14 * k, 1, 28 * k);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Synthwave - striped retro sun, neon mountains, endless grid
// ---------------------------------------------------------------------

function synthwave(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const stars = makeStars(rnd, 140, 0.5);
  const far = ridge(rnd, 5);
  const near = ridge(rnd, 4);
  const sunCv = document.createElement("canvas");
  return (ctx, t, w, h) => {
    const hz = h * 0.6;
    verticalSky(ctx, w, h, [
      [0, { r: 8, g: 2, b: 24, a: 1 }],
      [0.45, shade(s, 0.35)],
      [0.6, mix(s, p, 0.35)],
      [0.601, { r: 6, g: 0, b: 16, a: 1 }],
      [1, { r: 2, g: 0, b: 8, a: 1 }],
    ]);
    drawStars(ctx, stars, t, w, h, WHITE, 0.8);

    // Sun, with stripes cut out of its lower half that scroll downwards.
    const R = Math.min(h * 0.22, w * 0.3);
    const size = Math.ceil(R * 2);
    if (sunCv.width !== size) sunCv.width = sunCv.height = size;
    const sc = sunCv.getContext("2d")!;
    sc.globalCompositeOperation = "source-over";
    sc.clearRect(0, 0, size, size);
    const sg = sc.createLinearGradient(0, 0, 0, size);
    sg.addColorStop(0, css(mix(p, WHITE, 0.35)));
    sg.addColorStop(0.35, css(p));
    sg.addColorStop(0.68, css(s));
    sc.fillStyle = sg;
    sc.beginPath();
    sc.arc(R, R, R, 0, TAU);
    sc.fill();
    sc.globalCompositeOperation = "destination-out";
    for (let k = 0; k < 7; k++) {
      const f = frac(k / 7 + t * 0.05);
      const y = R * (0.3 + f * 1.05);
      sc.fillRect(0, y, size, 1 + f * R * 0.1);
    }
    // The sun sets INTO the horizon: nothing of it is drawn over the floor.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, hz);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, sprite(p), w / 2, hz - R * 0.35, R * 4.5, 0.35);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(sunCv, w / 2 - R, hz - R * 1.35);
    ctx.restore();

    // Mountains, far then near, rim-lit in neon.
    const drift = t * 0.004;
    const mountains = (fn: (u: number) => number, height: number, fill: string, rim: Rgba, off: number) => {
      const ridgeLine = new Path2D();
      for (let i = 0; i <= 120; i++) {
        const u = i / 120;
        const edge = Math.min(1, Math.abs(u - 0.5) * 2.4);
        const y = hz - Math.max(0, fn(u + off) * 0.5 + 0.5) * height * edge;
        if (i === 0) ridgeLine.moveTo(0, y);
        else ridgeLine.lineTo(u * w, y);
      }
      const body = new Path2D(ridgeLine);
      body.lineTo(w, hz);
      body.lineTo(0, hz);
      body.closePath();
      ctx.fillStyle = fill;
      ctx.fill(body);
      // Neon rim on the ridge only (not the base or the screen edges).
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = css(rim, 0.7);
      ctx.lineWidth = 1.5;
      ctx.stroke(ridgeLine);
      ctx.globalCompositeOperation = "source-over";
    };
    mountains(far, h * 0.2, "#12042a", s, drift);
    mountains(near, h * 0.12, "#070114", p, drift * 2);

    // Grid floor.
    ctx.globalCompositeOperation = "lighter";
    const vp = w / 2;
    ctx.strokeStyle = css(s, 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let j = -24; j <= 24; j++) {
      ctx.moveTo(vp + j * w * 0.004, hz);
      ctx.lineTo(vp + j * w * 0.09, h);
    }
    ctx.stroke();
    for (let i = 0; i < 26; i++) {
      const d = frac(i / 26 - t * 0.04) * 26 + 0.6;
      const y = hz + (h - hz) * (0.9 / d);
      if (y > h) continue;
      ctx.globalAlpha = Math.min(1, 2.2 / d);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    stamp(ctx, sprite(s), w / 2, hz, w * 0.9, 0.18);
    ctx.globalCompositeOperation = "source-over";
  };
}

// ---------------------------------------------------------------------
// Lava lamp - metaballs rising and sinking (low-res field, scaled up)
// ---------------------------------------------------------------------

function lavaLamp(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const blobs = Array.from({ length: 10 }, () => ({
    x: 0.12 + rnd() * 0.76,
    r: 0.07 + rnd() * 0.08,
    sp: 0.05 + rnd() * 0.07,
    ph: rnd() * TAU,
    wob: 0.03 + rnd() * 0.05,
  }));
  const field = fieldCanvas();
  const bgTop = shade(s, 0.12);
  const bgBot = shade(p, 0.18);
  const hot = mix(p, WHITE, 0.25);
  return (ctx, t, w, h) => {
    const fw = 176;
    const fh = Math.max(40, Math.round((fw * h) / w));
    const img = field.ensure(fw, fh);
    const d = img.data;
    const aspect = w / h;
    const pos = blobs.map((b) => ({
      x: b.x + Math.sin(t * 0.13 + b.ph) * b.wob,
      y: 0.5 + 0.46 * Math.sin(t * b.sp + b.ph),
      r2: b.r * b.r,
    }));
    for (let j = 0; j < fh; j++) {
      const v = j / (fh - 1);
      const bg = mix(bgTop, bgBot, v);
      for (let i = 0; i < fw; i++) {
        const u = i / (fw - 1);
        let f = 0;
        for (const b of pos) {
          const dx = (u - b.x) * aspect;
          const dy = v - b.y;
          f += b.r2 / (dx * dx + dy * dy + 0.0004);
        }
        const edge = smooth(0.85, 1.05, f);
        const core = smooth(1.2, 3.2, f);
        const lava = mix(mix(s, p, v * 0.6 + 0.2), hot, core);
        const glow = smooth(0.35, 0.85, f) * 0.25;
        const o = (j * fw + i) * 4;
        d[o] = bg.r + (lava.r - bg.r) * edge + p.r * glow * (1 - edge);
        d[o + 1] = bg.g + (lava.g - bg.g) * edge + p.g * glow * (1 - edge);
        d[o + 2] = bg.b + (lava.b - bg.b) * edge + p.b * glow * (1 - edge);
        d[o + 3] = 255;
      }
    }
    field.commit();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(field.cv, 0, 0, w, h);
    // Glass highlight.
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, sprite(WHITE), w * 0.2, h * 0.15, Math.min(w, h) * 0.5, 0.05);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Liquid - silky interference plasma through the palette
// ---------------------------------------------------------------------

function liquid(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const field = fieldCanvas();
  const f = Array.from({ length: 4 }, () => 2 + rnd() * 3);
  const ph = Array.from({ length: 4 }, () => rnd() * TAU);
  // 256-entry cyclic palette: deep -> primary -> light -> secondary -> deep.
  const deep = shade(mix(p, s, 0.5), 0.12);
  const light = mix(mix(p, s, 0.5), WHITE, 0.45);
  const lut = Array.from({ length: 256 }, (_, i) => {
    const x = (i / 256) * 4;
    const seg = Math.floor(x);
    const k = smooth(0, 1, x - seg);
    const stops = [deep, p, light, s, deep];
    return mix(stops[seg], stops[seg + 1], k);
  });
  return (ctx, t, w, h) => {
    const fw = 144;
    const fh = Math.max(32, Math.round((fw * h) / w));
    const img = field.ensure(fw, fh);
    const d = img.data;
    const aspect = w / h;
    const tt = t * 0.12;
    for (let j = 0; j < fh; j++) {
      const y = j / fh - 0.5;
      for (let i = 0; i < fw; i++) {
        const x = (i / fw - 0.5) * aspect;
        const v =
          Math.sin(x * f[0] + tt * 1.3 + ph[0]) +
          Math.sin(y * f[1] - tt + ph[1]) +
          Math.sin((x + y) * f[2] + tt * 0.7 + ph[2]) +
          Math.sin(Math.sqrt(x * x * 9 + y * y * 9) * f[3] - tt * 1.6 + ph[3]);
        const c = lut[Math.floor(frac(v * 0.125 + tt * 0.05) * 255.99)];
        const o = (j * fw + i) * 4;
        d[o] = c.r;
        d[o + 1] = c.g;
        d[o + 2] = c.b;
        d[o + 3] = 255;
      }
    }
    field.commit();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(field.cv, 0, 0, w, h);
    // Vignette so widgets on the edges stay readable.
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  };
}

// ---------------------------------------------------------------------
// Fireflies - a dusky treeline with drifting, blinking lights
// ---------------------------------------------------------------------

function fireflies(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const stars = makeStars(rnd, 120, 0.45);
  const layers = [0, 1, 2].map((i) => ({ fn: ridge(rnd, 6), base: 0.55 + i * 0.13, amp: 0.1 - i * 0.02, trees: 70 + i * 30, seed: rnd() * 1000 }));
  const flies = Array.from({ length: 80 }, (_, i) => ({
    x: rnd(),
    y: 0.45 + rnd() * 0.5,
    a1: 0.1 + rnd() * 0.25,
    a2: 0.2 + rnd() * 0.4,
    ph: rnd() * TAU,
    bs: 0.4 + rnd() * 0.9,
    size: (i < 40 ? 16 : 30) + rnd() * 18,
    front: i >= 40,
  }));
  const fly = mix(p, { r: 255, g: 240, b: 150, a: 1 }, 0.35);
  const night = mix(s, { r: 18, g: 26, b: 64, a: 1 }, 0.7);
  const treeline = (ctx: CanvasRenderingContext2D, L: (typeof layers)[number], w: number, h: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, h);
    const n = L.trees;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const g = L.base + L.fn(u) * L.amp;
      const spike = frac(Math.sin((i + L.seed) * 12.9898) * 43758.5453);
      ctx.lineTo(u * w - w / n / 2, h * (g + 0.02));
      ctx.lineTo(u * w, h * (g - 0.02 - spike * 0.05));
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };
  const drawFlies = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number, front: boolean) => {
    ctx.globalCompositeOperation = "lighter";
    const img = sprite(fly);
    for (const f of flies) {
      if (f.front !== front) continue;
      const x = (f.x + 0.04 * Math.sin(t * f.a1 + f.ph) + 0.02 * Math.sin(t * f.a2 * 1.7 + f.ph * 2)) * w;
      const y = (f.y + 0.03 * Math.sin(t * f.a2 + f.ph * 3) + 0.015 * Math.cos(t * f.a1 * 2.3)) * h;
      const b = Math.pow(Math.max(0, Math.sin(t * f.bs + f.ph)), 3);
      stamp(ctx, img, x, y, f.size * (0.35 + b * 0.9), 0.15 + b * 0.85);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
  return (ctx, t, w, h) => {
    verticalSky(ctx, w, h, [
      [0, shade(night, 0.35)],
      [0.55, mix(shade(night, 0.8), shade(p, 0.35), 0.25)],
      [1, shade(night, 0.2)],
    ]);
    drawStars(ctx, stars, t, w, h, WHITE, 0.7);
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, sprite(mix(WHITE, p, 0.2)), w * 0.78, h * 0.18, Math.min(w, h) * 0.5, 0.25);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f2f0e2";
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.18, Math.min(w, h) * 0.035, 0, TAU);
    ctx.fill();
    treeline(ctx, layers[0], w, h, css(shade(night, 0.45)));
    drawFlies(ctx, t, w, h, false);
    const mist = ctx.createLinearGradient(0, h * 0.6, 0, h * 0.8);
    mist.addColorStop(0, "rgba(0,0,0,0)");
    mist.addColorStop(1, css(shade(night, 0.9), 0.35));
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.6, w, h * 0.2);
    treeline(ctx, layers[1], w, h, css(shade(night, 0.2)));
    treeline(ctx, layers[2], w, h, "#020403");
    drawFlies(ctx, t, w, h, true);
  };
}

// ---------------------------------------------------------------------
// Tunnel - hypnotic rings flying out of a vanishing point
// ---------------------------------------------------------------------

function tunnel(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const N = 34;
  const sides = rnd() < 0.5 ? 6 : 0; // hexagons or circles
  const twist = 0.25 + rnd() * 0.25;
  return (ctx, t, w, h) => {
    ctx.fillStyle = "#010103";
    ctx.fillRect(0, 0, w, h);
    const m = Math.min(w, h);
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, sprite(mix(p, s, 0.5)), w / 2, h / 2, m * 0.9, 0.35);
    for (let i = 0; i < N; i++) {
      const d = 1 - frac(i / N + t * 0.045);
      const r = (m * 0.035) / Math.max(0.035, d);
      if (r > Math.max(w, h) * 1.3) continue;
      const cx = w / 2 + Math.sin(t * 0.21 + d * 3) * m * 0.05 * d;
      const cy = h / 2 + Math.cos(t * 0.17 + d * 2.4) * m * 0.035 * d;
      const a = smooth(0.15, 0.85, 1 - d) * smooth(0.02, 0.4, d) * 0.9;
      if (a < 0.01) continue;
      const col = i % 2 ? p : s;
      const rot = d * TAU * twist + t * 0.1;
      for (const [lw, al] of [[3, 0.12], [1, 0.8]] as const) {
        ctx.strokeStyle = css(col, a * al);
        ctx.lineWidth = Math.min(14, (1.2 * lw) / Math.max(0.1, d));
        ctx.beginPath();
        if (sides) {
          for (let k = 0; k <= sides; k++) {
            const ang = rot + (k / sides) * TAU;
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          ctx.arc(cx, cy, r, 0, TAU);
        }
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Galaxy - a tilted spiral turning with differential rotation
// ---------------------------------------------------------------------

function galaxy(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const stars = makeStars(rnd, 200);
  const arms = 2 + Math.floor(rnd() * 3);
  const BUCKETS = 8;
  const colors = Array.from({ length: BUCKETS }, (_, i) => css(mix(mix(p, WHITE, 0.55), s, i / (BUCKETS - 1))));
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const pts = Array.from({ length: 2600 }, (_, i) => {
    const r = Math.pow(rnd(), 0.7);
    const arm = i % arms;
    return {
      r,
      a0: (arm / arms) * TAU + r * 4.2 + gauss() * (0.55 * (1 - r) + 0.18),
      z: gauss() * 0.04 * (1 - r),
      size: rnd() < 0.08 ? 2.6 : 1.4,
      bucket: Math.min(BUCKETS - 1, Math.floor(r * BUCKETS)),
      alpha: 0.35 + rnd() * 0.65,
    };
  });
  const byBucket = colors.map((_, b) => pts.filter((q) => q.bucket === b));
  const tilt = -0.35 + rnd() * 0.2;
  return (ctx, t, w, h) => {
    ctx.fillStyle = "#010104";
    ctx.fillRect(0, 0, w, h);
    drawStars(ctx, stars, t, w, h, WHITE, 0.6);
    const R = Math.min(w, h) * 0.7;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(tilt);
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, sprite(mix(p, s, 0.3)), 0, 0, R * 2.6, 0.22);
    for (let b = 0; b < BUCKETS; b++) {
      ctx.fillStyle = colors[b];
      for (const q of byBucket[b]) {
        const a = q.a0 + (t * 0.035) / (0.25 + q.r);
        ctx.globalAlpha = q.alpha;
        ctx.fillRect(Math.cos(a) * q.r * R, (Math.sin(a) * q.r * 0.42 + q.z) * R, q.size, q.size);
      }
    }
    stamp(ctx, sprite(mix(p, WHITE, 0.6)), 0, 0, R * 0.7, 0.8);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Bokeh - out-of-focus city lights drifting in the dark
// ---------------------------------------------------------------------

function bokeh(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const lights = Array.from({ length: 48 }, () => ({
    x: rnd(),
    y: rnd(),
    size: 0.03 + Math.pow(rnd(), 2) * 0.13,
    col: rnd() < 0.15 ? mix(p, WHITE, 0.5) : mix(p, s, rnd()),
    sp: 0.004 + rnd() * 0.01,
    sway: rnd() * TAU,
    ph: rnd() * TAU,
    a: 0.25 + rnd() * 0.45,
  }));
  const sparks = Array.from({ length: 40 }, () => ({ x: rnd(), y: rnd(), ph: rnd() * TAU, sp: 0.5 + rnd() * 2 }));
  return (ctx, t, w, h) => {
    verticalSky(ctx, w, h, [
      [0, shade(s, 0.08)],
      [1, shade(p, 0.12)],
    ]);
    const m = Math.min(w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const l of lights) {
      const y = frac(l.y - t * l.sp) * 1.3 - 0.15;
      const x = l.x + Math.sin(t * 0.1 + l.sway) * 0.03;
      stamp(ctx, sprite(l.col, "bokeh"), x * w, y * h, l.size * m * 2, l.a * (0.7 + 0.3 * Math.sin(t * 0.5 + l.ph)));
    }
    ctx.fillStyle = "#fff";
    for (const k of sparks) {
      ctx.globalAlpha = 0.5 * Math.pow(Math.max(0, Math.sin(t * k.sp + k.ph)), 8);
      ctx.fillRect(k.x * w, k.y * h, 1.5, 1.5);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Silk flow - particles tracing a slowly changing flow field (trails)
// ---------------------------------------------------------------------

function flowField(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const N = 1500;
  const parts = Array.from({ length: N }, () => ({ x: rnd(), y: rnd(), c: rnd() < 0.5 ? 0 : 1, life: rnd() * 300 }));
  const k = [1.5 + rnd() * 2, 1.5 + rnd() * 2, 0.8 + rnd(), rnd() * TAU];
  const bg = shade(mix(p, s, 0.5), 0.05);
  const strokes = [css(p, 0.5), css(s, 0.5)];
  let lastKey = "";
  const scene: SceneFn = (ctx, t, w, h) => {
    const key = `${ctx.canvas.width}x${ctx.canvas.height}`;
    if (key !== lastKey) {
      lastKey = key;
      ctx.globalAlpha = 1;
      ctx.fillStyle = css(bg);
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = css(bg, 0.05);
    ctx.fillRect(0, 0, w, h);
    const aspect = w / h;
    const step = 0.0016;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 2; c++) {
      ctx.strokeStyle = strokes[c];
      ctx.beginPath();
      for (const q of parts) {
        if (q.c !== c) continue;
        const ang =
          (Math.sin(q.x * k[0] * aspect + t * 0.05) + Math.cos(q.y * k[1] - t * 0.04) + Math.sin((q.x + q.y) * k[2] + k[3] + t * 0.03)) * Math.PI * 0.75;
        const nx = q.x + (Math.cos(ang) * step) / aspect;
        const ny = q.y + Math.sin(ang) * step;
        ctx.moveTo(q.x * w, q.y * h);
        ctx.lineTo(nx * w, ny * h);
        q.x = nx;
        q.y = ny;
        q.life -= 1;
        if (q.life < 0 || q.x < -0.02 || q.x > 1.02 || q.y < -0.02 || q.y > 1.02) {
          q.x = rnd();
          q.y = rnd();
          q.life = 150 + rnd() * 300;
        }
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  };
  scene.trails = true;
  return scene;
}

// ---------------------------------------------------------------------
// Digital rain - falling glyph columns
// ---------------------------------------------------------------------

const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFZ:.=*+<>";

function digitalRain(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const cols = Array.from({ length: 240 }, () => ({ sp: 5 + rnd() * 11, off: rnd() * 200, len: 10 + Math.floor(rnd() * 20) }));
  const head = css(mix(p, WHITE, 0.75));
  const body = css(p);
  const hash = (a: number, b: number) => frac(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
  return (ctx, t, w, h) => {
    verticalSky(ctx, w, h, [
      [0, shade(s, 0.1)],
      [1, { r: 0, g: 0, b: 0, a: 1 }],
    ]);
    const fs = Math.max(12, Math.round(Math.min(w, h) / 56));
    const ncol = Math.min(cols.length, Math.ceil(w / fs));
    const rows = Math.ceil(h / fs) + 1;
    ctx.font = `${fs}px "MS Gothic", Consolas, monospace`;
    ctx.textBaseline = "top";
    const tick = Math.floor(t * 4);
    for (let c = 0; c < ncol; c++) {
      const col = cols[c];
      const hd = (t * col.sp + col.off) % (rows + col.len);
      const top = Math.floor(hd);
      for (let k = 0; k < col.len; k++) {
        const r = top - k;
        if (r < 0 || r >= rows) continue;
        const g = GLYPHS[Math.floor(hash(c, r + (k < 3 ? tick : Math.floor(tick / 6))) * GLYPHS.length)];
        ctx.fillStyle = k === 0 ? head : body;
        ctx.globalAlpha = k === 0 ? 1 : Math.pow(1 - k / col.len, 1.3);
        ctx.fillText(g, c * fs, r * fs);
      }
    }
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Mountain dusk - parallax ridgelines, low sun, drifting cloud
// ---------------------------------------------------------------------

function ridges(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const L = 6;
  const layers = Array.from({ length: L }, (_, i) => ({
    fn: ridge(rnd, 5),
    base: 0.5 + i * 0.075,
    amp: 0.09 - i * 0.008,
    speed: 0.0008 + i * 0.0012,
    col: mix(mix(mix(p, s, 0.45), WHITE, 0.35 - i * 0.06), shade(s, 0.12), Math.pow(i / (L - 1), 0.8)),
  }));
  const clouds = Array.from({ length: 7 }, () => ({ x: rnd(), y: 0.12 + rnd() * 0.3, w: 0.2 + rnd() * 0.3, sp: 0.002 + rnd() * 0.004, a: 0.08 + rnd() * 0.1 }));
  const sunX = 0.25 + rnd() * 0.5;
  return (ctx, t, w, h) => {
    verticalSky(ctx, w, h, [
      [0, shade(s, 0.35)],
      [0.45, mix(s, p, 0.6)],
      [0.62, mix(p, WHITE, 0.35)],
      [1, mix(p, s, 0.5)],
    ]);
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, sprite(mix(p, WHITE, 0.4)), sunX * w, h * 0.5, Math.min(w, h) * 0.9, 0.45);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = css(mix(p, WHITE, 0.7));
    ctx.beginPath();
    ctx.arc(sunX * w, h * 0.5, Math.min(w, h) * 0.05, 0, TAU);
    ctx.fill();
    const cloudImg = sprite(mix(p, WHITE, 0.6));
    for (const c of clouds) {
      const x = (frac(c.x + t * c.sp) * 1.4 - 0.2) * w;
      ctx.globalAlpha = c.a;
      ctx.drawImage(cloudImg, x - (c.w * w) / 2, c.y * h - c.w * h * 0.08, c.w * w, c.w * h * 0.16);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < L; i++) {
      const l = layers[i];
      const off = t * l.speed;
      ctx.fillStyle = css(l.col);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let k = 0; k <= 140; k++) {
        const u = k / 140;
        ctx.lineTo(u * w, h * (l.base - l.fn(u + off) * l.amp));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      if (i < L - 1) {
        const mist = ctx.createLinearGradient(0, h * (l.base - 0.02), 0, h * (l.base + 0.1));
        mist.addColorStop(0, css(l.col, 0));
        mist.addColorStop(1, css(mix(l.col, WHITE, 0.25), 0.35));
        ctx.fillStyle = mist;
        ctx.fillRect(0, h * (l.base - 0.02), w, h * 0.12);
      }
    }
  };
}

// ---------------------------------------------------------------------
// Moonlit sea - moon path glittering on a calm sea
// ---------------------------------------------------------------------

function moonlitSea(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const stars = makeStars(rnd, 200, 0.5);
  const ROWS = 70;
  const rows = Array.from({ length: ROWS }, () =>
    Array.from({ length: 26 }, () => ({ x: rnd(), ph: rnd() * TAU, sp: 1 + rnd() * 3, drift: (rnd() - 0.5) * 0.01, len: 0.4 + rnd() })),
  );
  const moonX = 0.35 + rnd() * 0.3;
  const moonCol = mix(p, WHITE, 0.75);
  return (ctx, t, w, h) => {
    const hz = h * 0.56;
    verticalSky(ctx, w, h, [
      [0, { r: 1, g: 2, b: 8, a: 1 }],
      [0.55, shade(mix(p, s, 0.4), 0.45)],
      [0.56, shade(s, 0.35)],
      [1, { r: 1, g: 2, b: 6, a: 1 }],
    ]);
    drawStars(ctx, stars, t, w, h, WHITE, 0.8);
    const mr = Math.min(w, h) * 0.055;
    const mx = moonX * w;
    const my = h * 0.24;
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, sprite(moonCol), mx, my, mr * 12, 0.35);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = css(moonCol);
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = css(shade(moonCol, 0.85), 0.35);
    for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.35, 0.12]]) {
      ctx.beginPath();
      ctx.arc(mx + dx * mr, my + dy * mr, rr * mr, 0, TAU);
      ctx.fill();
    }
    // Glitter: dashes whose brightness peaks in the moon's column and widens toward the viewer.
    ctx.globalCompositeOperation = "lighter";
    for (let r = 0; r < ROWS; r++) {
      const f = Math.pow((r + 1) / ROWS, 1.7);
      const y = hz + (h - hz) * f;
      const spread = 0.03 + f * 0.22;
      const dashH = 1 + f * 2.5;
      for (const d of rows[r]) {
        const x = frac(d.x + t * d.drift);
        const dist = (x - moonX) / spread;
        const moon = Math.exp(-dist * dist);
        const flick = Math.pow(0.5 + 0.5 * Math.sin(t * d.sp + d.ph), 3);
        const a = (moon * 0.95 + 0.07) * flick;
        if (a < 0.02) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = moon > 0.3 ? css(moonCol) : css(p);
        const len = (4 + f * 38) * d.len * (0.4 + moon);
        ctx.fillRect(x * w - len / 2, y, len, dashH);
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Night city - skyline with flickering windows, neon and searchlights
// ---------------------------------------------------------------------

function skyline(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const seed = rnd() * 1000;
  const hash = (a: number) => frac(Math.sin(a * 91.345 + seed) * 47453.5453);
  const cache = document.createElement("canvas");
  let cacheKey = "";
  let neons: { x: number; y: number; w: number; h: number; c: Rgba }[] = [];
  let flickers: { x: number; y: number; ww: number; wh: number; c: string }[] = [];
  const warm = { r: 255, g: 196, b: 120, a: 1 };
  const cool = mix(s, WHITE, 0.5);

  const build = (w: number, h: number) => {
    cache.width = Math.ceil(w);
    cache.height = Math.ceil(h);
    const g = cache.getContext("2d")!;
    g.clearRect(0, 0, w, h);
    neons = [];
    flickers = [];
    const layers = [
      { top: 0.42, fill: css(shade(mix(s, p, 0.3), 0.3)), win: 0.06, minW: 0.02, maxW: 0.05 },
      { top: 0.52, fill: css(shade(s, 0.14)), win: 0.22, minW: 0.03, maxW: 0.07 },
      { top: 0.64, fill: "#030208", win: 0.3, minW: 0.04, maxW: 0.1 },
    ];
    let n = 0;
    layers.forEach((L, li) => {
      let x = -0.02;
      while (x < 1.02) {
        const bw = L.minW + hash(n++) * (L.maxW - L.minW);
        const bt = L.top + hash(n++) * (1 - L.top) * 0.45;
        g.fillStyle = L.fill;
        g.fillRect(x * w, bt * h, bw * w + 1, h - bt * h);
        // windows
        const ww = Math.max(2, w * 0.004);
        const wh = Math.max(2, h * 0.007);
        for (let yy = bt * h + wh * 2; yy < h - wh; yy += wh * 2.4) {
          for (let xx = x * w + ww * 1.5; xx < (x + bw) * w - ww * 1.5; xx += ww * 2.4) {
            const r = hash(n++);
            if (r < L.win) {
              const c = hash(n++) < 0.7 ? warm : cool;
              g.fillStyle = css(c, li === 0 ? 0.35 : 0.85);
              g.fillRect(xx, yy, ww, wh);
              if (li > 0 && hash(n++) < 0.03) flickers.push({ x: xx, y: yy, ww, wh, c: css(c) });
            }
          }
        }
        if (li === 2 && hash(n++) < 0.25) neons.push({ x: (x + bw * 0.2) * w, y: (bt + 0.03) * h, w: bw * w * 0.6, h: h * 0.012, c: hash(n++) < 0.5 ? p : s });
        x += bw + hash(n++) * 0.006;
      }
    });
  };

  return (ctx, t, w, h) => {
    const key = `${Math.round(w)}x${Math.round(h)}`;
    if (key !== cacheKey) {
      cacheKey = key;
      build(w, h);
    }
    verticalSky(ctx, w, h, [
      [0, { r: 3, g: 2, b: 10, a: 1 }],
      [0.55, shade(s, 0.4)],
      [0.8, mix(s, p, 0.4)],
      [1, shade(p, 0.3)],
    ]);
    // searchlights
    ctx.globalCompositeOperation = "lighter";
    for (const [bx, sp, ph] of [[0.3, 0.2, 0], [0.72, 0.15, 2]] as const) {
      const ang = -Math.PI / 2 + Math.sin(t * sp + ph) * 0.45;
      const len = h * 1.1;
      const ox = bx * w;
      const oy = h * 0.7;
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
      g.addColorStop(0, css(mix(s, WHITE, 0.5), 0.16));
      g.addColorStop(1, css(s, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(ang - 0.05) * len, oy + Math.sin(ang - 0.05) * len);
      ctx.lineTo(ox + Math.cos(ang + 0.05) * len, oy + Math.sin(ang + 0.05) * len);
      ctx.closePath();
      ctx.fill();
    }
    stamp(ctx, sprite(p), w / 2, h * 0.75, w * 1.2, 0.2);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(cache, 0, 0, w, h);
    // flickering windows
    const tick = Math.floor(t * 0.7);
    for (let i = 0; i < flickers.length; i++) {
      const f = flickers[i];
      if (hash(i * 7.1 + tick) < 0.5) {
        ctx.fillStyle = "#030208";
        ctx.fillRect(f.x, f.y, f.ww, f.wh);
      }
    }
    // neon signs
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < neons.length; i++) {
      const n = neons[i];
      const on = hash(i * 3.3 + Math.floor(t * 3)) > 0.04 ? 1 : 0.2;
      const pulse = on * (0.75 + 0.25 * Math.sin(t * 2 + i));
      stamp(ctx, sprite(n.c), n.x + n.w / 2, n.y + n.h / 2, n.w * 1.6, 0.3 * pulse);
      ctx.globalAlpha = 0.9 * pulse;
      ctx.fillStyle = css(mix(n.c, WHITE, 0.3));
      ctx.fillRect(n.x, n.y, n.w, n.h);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    // aircraft light
    const ax = frac(t * 0.012) * 1.2 - 0.1;
    if (Math.sin(t * 5) > 0.6) {
      ctx.fillStyle = "#ff4040";
      ctx.fillRect(ax * w, h * 0.12, 2.5, 2.5);
    }
  };
}

// ---------------------------------------------------------------------
// Mandala - a slowly breathing kaleidoscope
// ---------------------------------------------------------------------

function mandala(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const seg = 8 + 2 * Math.floor(rnd() * 3);
  const dots = Array.from({ length: 11 }, () => ({ r0: 0.08 + rnd() * 0.85, a0: rnd() * (Math.PI / seg), sp: 0.1 + rnd() * 0.25, ph: rnd() * TAU, size: 0.08 + rnd() * 0.2, col: mix(p, s, rnd()) }));
  const petals = Array.from({ length: 5 }, (_, i) => ({ r: 0.2 + i * 0.17, bend: 0.4 + rnd() * 0.5, sp: 0.15 + rnd() * 0.2, ph: rnd() * TAU, col: i % 2 ? p : s }));
  return (ctx, t, w, h) => {
    const m = Math.min(w, h);
    const R = m * 0.62;
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bg.addColorStop(0, css(shade(mix(p, s, 0.5), 0.14)));
    bg.addColorStop(1, "#010102");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(t * 0.025);
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < seg; k++) {
      ctx.save();
      ctx.rotate((k / seg) * TAU);
      if (k % 2) ctx.scale(1, -1);
      for (const d of dots) {
        const r = d.r0 * R * (0.85 + 0.15 * Math.sin(t * d.sp + d.ph));
        const a = d.a0 + Math.sin(t * d.sp * 0.6 + d.ph) * 0.12;
        stamp(ctx, sprite(d.col), Math.cos(a) * r, Math.sin(a) * r, d.size * R, 0.55);
      }
      for (const pe of petals) {
        const r = pe.r * R * (0.9 + 0.1 * Math.sin(t * pe.sp + pe.ph));
        const b = pe.bend * (0.8 + 0.2 * Math.sin(t * pe.sp * 1.3 + pe.ph));
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = css(pe.col, 0.6);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(r * 0.35, 0);
        ctx.quadraticCurveTo(r * 0.7, r * b * 0.5, r, 0);
        ctx.quadraticCurveTo(r * 0.7, -r * b * 0.12, r * 0.35, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
    stamp(ctx, sprite(mix(p, WHITE, 0.5)), 0, 0, R * 0.6, 0.5 + 0.2 * Math.sin(t * 0.4));
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Harmonograph - a glowing pendulum drawing that endlessly re-forms
// ---------------------------------------------------------------------

function harmonograph(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const ratios: [number, number][] = [[3, 2], [2, 1], [3, 4], [5, 4], [4, 3], [5, 3]];
  const [fx, fy] = ratios[Math.floor(rnd() * ratios.length)];
  const detune = 0.004 + rnd() * 0.004;
  const n = 900;
  const loops = 6;
  return (ctx, t, w, h) => {
    ctx.fillStyle = "#020203";
    ctx.fillRect(0, 0, w, h);
    const A = Math.min(w, h) * 0.38;
    const g = ctx.createLinearGradient(w / 2 - A, h / 2 - A, w / 2 + A, h / 2 + A);
    g.addColorStop(0, css(p));
    g.addColorStop(1, css(s));
    const px = t * 0.05;
    const py = t * (0.05 + detune);
    const path = new Path2D();
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * TAU * loops;
      const damp = 1 - (i / n) * 0.55;
      const x = w / 2 + A * damp * Math.sin(fx * u + px);
      const y = h / 2 + A * damp * Math.sin(fy * u + py + Math.PI / 4);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = g;
    for (const [lw, a] of [[7, 0.06], [2.5, 0.22], [1, 0.75]] as const) {
      ctx.globalAlpha = a;
      ctx.lineWidth = lw;
      ctx.stroke(path);
    }
    stamp(ctx, sprite(mix(p, s, 0.5)), w / 2, h / 2, A * 2.2, 0.12);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

// ---------------------------------------------------------------------
// Underwater - light shafts, shimmering caustics, rising bubbles
// ---------------------------------------------------------------------

function underwater(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const field = fieldCanvas();
  const shafts = Array.from({ length: 7 }, () => ({ x: rnd(), w: 0.04 + rnd() * 0.08, sp: 0.05 + rnd() * 0.08, ph: rnd() * TAU, a: 0.18 + rnd() * 0.2 }));
  const bubbles = Array.from({ length: 46 }, () => ({ x: rnd(), y: rnd(), r: 1.5 + rnd() * rnd() * 9, sp: 0.03 + rnd() * 0.06, ph: rnd() * TAU }));
  const motes = Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd(), sp: (rnd() - 0.5) * 0.01, ph: rnd() * TAU }));
  const light = mix(p, WHITE, 0.55);
  return (ctx, t, w, h) => {
    verticalSky(ctx, w, h, [
      [0, mix(p, WHITE, 0.15)],
      [0.35, shade(mix(p, s, 0.5), 0.55)],
      [1, shade(s, 0.12)],
    ]);
    // Caustics: a low-res field of interfering ripples, upscaled and screened over the top half.
    const fw = 160;
    const fh = Math.max(40, Math.round((fw * h) / w / 1.6));
    const img = field.ensure(fw, fh);
    const d = img.data;
    const tt = t * 0.6;
    for (let j = 0; j < fh; j++) {
      for (let i = 0; i < fw; i++) {
        const x = i / 18;
        const y = j / 18;
        const v =
          Math.abs(Math.sin(x * 1.7 + Math.sin(y * 1.3 + tt) + tt * 0.8)) +
          Math.abs(Math.sin(y * 1.9 + Math.sin(x * 1.1 - tt * 0.7) - tt * 0.6));
        const c = Math.pow(Math.max(0, 1 - v * 0.62), 3);
        const o = (j * fw + i) * 4;
        d[o] = light.r;
        d[o + 1] = light.g;
        d[o + 2] = light.b;
        d[o + 3] = Math.round(c * 255 * (1 - j / fh));
      }
    }
    field.commit();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(field.cv, 0, 0, w, h * 0.62);
    ctx.globalAlpha = 1;
    // Light shafts from the surface, swaying.
    const ray = sprite(light, "ray");
    for (const sh of shafts) {
      const x = (sh.x + Math.sin(t * sh.sp + sh.ph) * 0.05) * w;
      ctx.globalAlpha = sh.a * (0.7 + 0.3 * Math.sin(t * 0.4 + sh.ph));
      ctx.save();
      ctx.translate(x, -h * 0.05);
      ctx.rotate(0.18 + Math.sin(t * 0.07 + sh.ph) * 0.05);
      ctx.scale(1, -1);
      ctx.drawImage(ray, (-sh.w * w) / 2, -h * 1.05, sh.w * w, h * 1.05);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Drifting particles.
    ctx.fillStyle = css(light);
    for (const m of motes) {
      ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.8 + m.ph));
      ctx.fillRect(frac(m.x + t * m.sp) * w, frac(m.y + t * 0.004) * h, 1.6, 1.6);
    }
    ctx.restore();
    // Bubbles rising and wobbling.
    ctx.save();
    ctx.lineWidth = 1.2;
    for (const b of bubbles) {
      const y = (1 - frac(b.y + t * b.sp)) * (h + 40) - 20;
      const x = (b.x + Math.sin(t * 1.4 + b.ph) * 0.006) * w;
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "rgba(220,245,255,0.8)";
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(x - b.r * 0.4, y - b.r * 0.5, Math.max(1, b.r * 0.3), Math.max(1, b.r * 0.3));
    }
    ctx.restore();
  };
}

// ---------------------------------------------------------------------
// Starry lake - the Milky Way over mountains, mirrored in a still lake
// ---------------------------------------------------------------------

function starryLake(p: Rgba, s: Rgba, rnd: () => number): SceneFn {
  const stars = makeStars(rnd, 420, 1);
  // Milky Way: a diagonal band of dense stars + soft glow.
  const band = Array.from({ length: 900 }, () => {
    const u = rnd();
    const off = (rnd() + rnd() + rnd() - 1.5) * 0.09;
    return { u, off, r: rnd() < 0.05 ? 1.6 : 0.8, ph: rnd() * TAU };
  });
  const glows = Array.from({ length: 14 }, () => ({ u: rnd(), off: (rnd() - 0.5) * 0.08, size: 0.12 + rnd() * 0.18, col: mix(p, s, rnd()) }));
  const peaks = ridge(rnd, 6);
  const sky = document.createElement("canvas");
  return (ctx, t, w, h) => {
    const hz = 0.6;
    const sw = Math.ceil(w / 2);
    const sh = Math.ceil((h * hz) / 2);
    if (sky.width !== sw || sky.height !== sh) {
      sky.width = sw;
      sky.height = sh;
    }
    const k = sky.getContext("2d")!;
    // Sky at half resolution (it's soft anyway), reused for the reflection.
    const g = k.createLinearGradient(0, 0, 0, sh);
    g.addColorStop(0, "#02030a");
    g.addColorStop(0.7, css(shade(mix(p, s, 0.5), 0.22)));
    g.addColorStop(1, css(shade(mix(p, s, 0.5), 0.4)));
    k.fillStyle = g;
    k.fillRect(0, 0, sw, sh);
    drawStars(k, stars, t, sw, sh, WHITE, 0.8);
    k.save();
    k.globalCompositeOperation = "lighter";
    const bx = (u: number) => u * sw;
    const by = (u: number) => (0.95 - u * 0.85) * sh;
    for (const gl of glows) stamp(k, sprite(gl.col), bx(gl.u), by(gl.u) + gl.off * sh, gl.size * sw, 0.16);
    k.fillStyle = "#fff";
    for (const b of band) {
      k.globalAlpha = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.3 + b.ph));
      k.fillRect(bx(b.u) + b.off * sh * 0.4, by(b.u) + b.off * sh, b.r, b.r);
    }
    k.restore();
    // Faint glow along the horizon, then a low tinted ridge.
    k.save();
    k.globalCompositeOperation = "lighter";
    stamp(k, sprite(mix(p, s, 0.5)), sw * 0.5, sh * 0.95, sw * 1.2, 0.18);
    k.restore();
    k.fillStyle = css(shade(mix(p, s, 0.5), 0.1));
    k.beginPath();
    k.moveTo(0, sh);
    for (let i = 0; i <= 120; i++) k.lineTo((i / 120) * sw, sh * (0.95 - Math.max(0, peaks(i / 120) * 0.5 + 0.35) * 0.16));
    k.lineTo(sw, sh);
    k.fill();

    ctx.drawImage(sky, 0, 0, w, h * hz);
    // Lake: the sky flipped, darkened, with horizontal ripples.
    ctx.fillStyle = "#01020a";
    ctx.fillRect(0, h * hz, w, h * (1 - hz));
    const rows = 48;
    const rowH = (h * (1 - hz)) / rows;
    for (let r = 0; r < rows; r++) {
      const depth = r / rows;
      const srcY = sh * (1 - depth * (1 - hz) / hz) - 1;
      if (srcY < 0) break;
      const dx = Math.sin(t * 1.2 + r * 0.9) * (1 + depth * 6);
      ctx.globalAlpha = 0.55 * (1 - depth * 0.7);
      ctx.drawImage(sky, 0, Math.max(0, srcY), sw, 1.5, dx, h * hz + r * rowH, w, rowH + 1);
    }
    ctx.globalAlpha = 1;
    const shore = ctx.createLinearGradient(0, h * hz - 2, 0, h * hz + 6);
    shore.addColorStop(0, "rgba(0,0,0,0)");
    shore.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = shore;
    ctx.fillRect(0, h * hz - 2, w, 8);
  };
}

// ---------------------------------------------------------------------

export const EXTRA_STYLES = {
  aurora: { label: "Aurora", make: aurora },
  nebula: { label: "Nebula", make: nebula },
  galaxy: { label: "Galaxy", make: galaxy },
  synthwave: { label: "Synthwave", make: synthwave },
  skyline: { label: "Night City", make: skyline },
  digital_rain: { label: "Digital Rain", make: digitalRain },
  ridges: { label: "Mountain Dusk", make: ridges },
  moonlit_sea: { label: "Moonlit Sea", make: moonlitSea },
  fireflies: { label: "Fireflies", make: fireflies },
  bokeh: { label: "Bokeh", make: bokeh },
  lava_lamp: { label: "Lava Lamp", make: lavaLamp },
  liquid: { label: "Liquid", make: liquid },
  flow_field: { label: "Silk Flow", make: flowField },
  tunnel: { label: "Hypno Tunnel", make: tunnel },
  mandala: { label: "Mandala", make: mandala },
  harmonograph: { label: "Harmonograph", make: harmonograph },
  underwater: { label: "Underwater", make: underwater },
  starry_lake: { label: "Starry Lake", make: starryLake },
} as const;

export type ExtraStyle = keyof typeof EXTRA_STYLES;

export function makeExtraScene(style: string, p: Rgba, s: Rgba, rnd: () => number): SceneFn | null {
  const entry = (EXTRA_STYLES as Record<string, { make: (p: Rgba, s: Rgba, rnd: () => number) => SceneFn }>)[style];
  return entry ? entry.make(p, s, rnd) : null;
}
