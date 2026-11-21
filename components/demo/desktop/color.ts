// Copied from the real app (revinhi-radar/src/desktop/color.ts) for the website preview.
// Color helpers shared by the widgets, the procedural renderer and the
// color picker. Hex is CSS order: "#RRGGBB" or "#RRGGBBAA".

export interface Rgba {
  r: number; // 0-255
  g: number;
  b: number;
  a: number; // 0-1
}

export function parseHex(hex: string, fallback: Rgba = { r: 255, g: 255, b: 255, a: 1 }): Rgba {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(h)) return fallback;
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

const hx = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0").toUpperCase();

/** Always 8-digit "#RRGGBBAA". */
export function toHex({ r, g, b, a }: Rgba): string {
  return `#${hx(r)}${hx(g)}${hx(b)}${hx(a * 255)}`;
}

export function rgbaCss(c: Rgba, alphaMul = 1): string {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${+(c.a * alphaMul).toFixed(4)})`;
}

/** Any stored hex -> a CSS color string (CSS itself understands #RRGGBBAA,
 * this also normalises bad input to the fallback). */
export function cssColor(hex: string, fallback = "#FFFFFFFF"): string {
  return rgbaCss(parseHex(hex, parseHex(fallback)));
}

// HSV: h 0-360, s 0-1, v 0-1.
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r, g, b] = [0, 0, 0];
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
