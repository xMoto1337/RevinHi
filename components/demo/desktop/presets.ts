// Copied from the real app (revinhi-radar/src/desktop/presets.ts) for the website preview.
// One-click desktop setups (all Pro except "starter"): each fills a monitor's whole layout (wallpaper +
// widgets with their appearance + effects). They're the "POV: your desktop"
// clip material, so every one is a composed scene rather than a pile of
// widgets in a corner.
//
// Layouts are built for the monitor they're applied to: fonts scale with the
// monitor's short side (sizes below are for a 1080p screen) and portrait
// monitors get their own arrangement. Seeds are fixed so the gallery preview
// is exactly what gets applied.

import { DesktopWidget, DesktopWidgetKind, EffectInstance, MonitorLayout, ProceduralStyle, WallpaperSource } from "./types";
import { makeEffect } from "./effects";
import { WEATHER_BASE_FONT, newWidget } from "./widgetdefs";

export const PRESET_CATEGORIES = ["My Presets", "Signature", "Weather", "Night Sky", "Retro & Neon", "Nature", "Hypnotic", "Fluid", "Chill", "Classic"] as const;
export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export interface Preset {
  id: string;
  name: string;
  tagline: string;
  /** Gallery filter; set for every preset in PRESETS below. */
  category?: PresetCategory;
  /** Taskbar look applied with the preset (Signature presets), when the user allows it. */
  taskbar?: { mode: "clear" | "blur" | "acrylic" | "tint"; color: string };
  build: (width: number, height: number) => Omit<MonitorLayout, "monitor_id">;
}

type Box = [x: number, y: number, w: number, h: number];

interface Ctx {
  portrait: boolean;
  /** Font scale: monitor short side / 1080. */
  s: number;
  /** Landscape box, portrait box. */
  at: (landscape: Box, portrait: Box) => Pick<DesktopWidget, "x" | "y" | "width" | "height">;
  /** A widget of `kind` with WIDGET_DEFAULTS + the kind's defaults + `patch`. */
  widget: (kind: DesktopWidgetKind, patch: Partial<DesktopWidget>) => DesktopWidget;
}

function ctxFor(width: number, height: number): Ctx {
  const portrait = height > width;
  const s = Math.max(0.5, Math.min(width, height) / 1080);
  return {
    portrait,
    s,
    at: (l, p) => {
      const [x, y, w, h] = portrait ? p : l;
      return { x, y, width: w, height: h };
    },
    widget: (kind, patch) => ({ ...newWidget(kind), ...patch }),
  };
}

const NO_PANEL: Partial<DesktopWidget> = { show_panel: false };

function procedural(style: "particles" | "starfield" | "gradient_flow" | "waves", palette: string, primary: string, secondary: string, seed: number): WallpaperSource {
  return { kind: "procedural", style, palette, primary, secondary, seed };
}

function scene(wallpaper: WallpaperSource, widgets: DesktopWidget[], effects: EffectInstance[]) {
  return { wallpaper, widgets, effects };
}

const CORE_PRESETS: Preset[] = [
  {
    // The one free preset: built only from free-tier parts (Gradient Flow in a
    // free palette, Clock + Date, no effects) and deliberately plain.
    id: "starter",
    name: "Starter",
    tagline: "Free · gradient + clock",
    build: (width, height) => {
      const c = ctxFor(width, height);
      return scene(
        procedural("gradient_flow", "Cyan Drift", "#00E5FF", "#8A5CFF", 5),
        [
          c.widget("clock", { ...c.at([0.04, 0.05, 0.2, 0.12], [0.06, 0.04, 0.5, 0.08]), font_size: Math.round(30 * c.s), show_date: false }),
          c.widget("date", { ...c.at([0.04, 0.19, 0.2, 0.06], [0.06, 0.13, 0.5, 0.04]), font_size: Math.round(16 * c.s) }),
        ],
        [],
      );
    },
  },
  {
    id: "lofi-rain",
    name: "Lo-fi Rain",
    tagline: "Rain on the glass, dusk-lit city glow",
    build: (width, height) => {
      const c = ctxFor(width, height);
      return scene(
        procedural("gradient_flow", "Lo-fi Dusk", "#FF7A59", "#5B4BDB", 7),
        [
          c.widget("clock", {
            ...c.at([0.05, 0.62, 0.34, 0.28], [0.06, 0.6, 0.88, 0.2]),
            ...NO_PANEL,
            font_family: "Segoe UI Light",
            font_size: Math.round(120 * c.s),
            text_color: "#FFFFFFF0",
            show_date: true,
          }),
          c.widget("text", {
            ...c.at([0.6, 0.8, 0.36, 0.08], [0.06, 0.82, 0.88, 0.06]),
            ...NO_PANEL,
            font_family: "Georgia",
            font_italic: true,
            font_size: Math.round(26 * c.s),
            text_color: "#FFFFFFB3",
            custom_text: "rainy day. lo-fi on. nowhere to be.",
          }),
        ],
        [
          makeEffect("rain", { intensity: 0.75, speed: 0.45, opacity: 0.9 }),
          makeEffect("audio_glow", { color: "#FF9B6AFF", opacity: 0.22, intensity: 0.35, speed: 0.2 }),
        ],
      );
    },
  },
  {
    id: "storm-watch",
    name: "Storm Watch",
    tagline: "Live radar, conditions and alerts",
    build: (width, height) => {
      const c = ctxFor(width, height);
      const weatherFont = Math.round(WEATHER_BASE_FONT * 1.25 * c.s);
      const card: Partial<DesktopWidget> = {
        panel_color: "#05080DD1",
        border_color: "#6FB8FF40",
        corner_radius: 18,
        font_size: weatherFont,
      };
      return scene(
        procedural("waves", "Storm Front", "#1F6FB2", "#3B2A7A", 21),
        [
          c.widget("radar", {
            ...c.at([0.55, 0.08, 0.4, 0.66], [0.06, 0.05, 0.88, 0.44]),
            ...card,
            border_color: "#6FB8FF66",
          }),
          c.widget("current", { ...c.at([0.05, 0.08, 0.22, 0.21], [0.06, 0.52, 0.43, 0.15]), ...card }),
          c.widget("storm", { ...c.at([0.05, 0.32, 0.22, 0.21], [0.51, 0.52, 0.43, 0.15]), ...card }),
          c.widget("clock", {
            ...c.at([0.05, 0.74, 0.3, 0.18], [0.06, 0.72, 0.88, 0.14]),
            ...NO_PANEL,
            font_family: "Bahnschrift",
            font_size: Math.round(78 * c.s),
            text_color: "#E6F1FFFF",
            show_date: true,
          }),
        ],
        [makeEffect("rain", { intensity: 0.25, speed: 0.6, opacity: 0.32 })],
      );
    },
  },
  {
    id: "neon-city",
    name: "Neon City",
    tagline: "Synthwave waves and a glowing clock",
    build: (width, height) => {
      const c = ctxFor(width, height);
      return scene(
        procedural("waves", "Synthwave", "#FF2FD1", "#00E5FF", 88),
        [
          c.widget("clock", {
            ...c.at([0.28, 0.1, 0.44, 0.28], [0.06, 0.1, 0.88, 0.18]),
            ...NO_PANEL,
            font_family: "Bahnschrift",
            font_size: Math.round(130 * c.s),
            text_color: "#FF6BE6FF",
            text_glow: true,
            show_date: true,
          }),
          c.widget("system_stats", {
            ...c.at([0.8, 0.8, 0.15, 0.12], [0.58, 0.84, 0.36, 0.08]),
            font_family: "Consolas",
            font_size: Math.round(22 * c.s),
            text_color: "#00E5FFFF",
            text_glow: true,
            panel_color: "#0A0014B3",
            border_color: "#00E5FF80",
            corner_radius: 4,
          }),
          c.widget("text", {
            ...c.at([0.05, 0.84, 0.3, 0.07], [0.06, 0.85, 0.48, 0.06]),
            ...NO_PANEL,
            font_family: "Bahnschrift",
            font_bold: true,
            font_size: Math.round(28 * c.s),
            text_color: "#FFFFFFD9",
            custom_text: "N I G H T   D R I V E",
          }),
        ],
        [
          makeEffect("light_rays", { color: "#FF7BEAFF", opacity: 0.8, intensity: 0.7, speed: 0.35 }),
          makeEffect("audio_glow", { color: "#00E5FFFF", opacity: 0.3, intensity: 0.4, speed: 0.3 }),
        ],
      );
    },
  },
  {
    id: "cozy-snow",
    name: "Cozy Snow",
    tagline: "Fireside glow and falling snow",
    build: (width, height) => {
      const c = ctxFor(width, height);
      return scene(
        procedural("gradient_flow", "Fireside", "#FF8A3D", "#2B4C7E", 12),
        [
          c.widget("clock", {
            ...c.at([0.28, 0.28, 0.44, 0.28], [0.06, 0.3, 0.88, 0.18]),
            ...NO_PANEL,
            font_family: "Palatino Linotype",
            font_size: Math.round(120 * c.s),
            text_color: "#FFF4E6F2",
            show_date: true,
          }),
          c.widget("text", {
            ...c.at([0.3, 0.57, 0.4, 0.08], [0.06, 0.49, 0.88, 0.06]),
            ...NO_PANEL,
            font_family: "Ink Free",
            font_size: Math.round(34 * c.s),
            text_color: "#FFE2C4E0",
            custom_text: "hot cocoa weather",
          }),
          c.widget("current", {
            ...c.at([0.77, 0.73, 0.18, 0.19], [0.28, 0.76, 0.44, 0.14]),
            panel_color: "#1A0F08B8",
            border_color: "#FFD2A640",
            corner_radius: 20,
            font_size: Math.round(WEATHER_BASE_FONT * 1.2 * c.s),
          }),
        ],
        [
          makeEffect("snow", { intensity: 0.9, speed: 0.3, opacity: 0.95 }),
          makeEffect("audio_glow", { color: "#FFB066FF", opacity: 0.25, intensity: 0.3, speed: 0.15 }),
        ],
      );
    },
  },
  {
    id: "space",
    name: "Space",
    tagline: "Deep starfield, mission-control stats",
    build: (width, height) => {
      const c = ctxFor(width, height);
      return scene(
        procedural("starfield", "Deep Space", "#3B3F7A", "#9D8CFF", 404),
        [
          c.widget("clock", {
            ...c.at([0.64, 0.7, 0.32, 0.24], [0.06, 0.74, 0.88, 0.16]),
            ...NO_PANEL,
            font_family: "Segoe UI Light",
            font_size: Math.round(104 * c.s),
            text_color: "#E8ECFFFF",
            show_date: true,
          }),
          c.widget("system_stats", {
            ...c.at([0.04, 0.06, 0.13, 0.1], [0.06, 0.05, 0.4, 0.07]),
            ...NO_PANEL,
            font_family: "Consolas",
            font_size: Math.round(20 * c.s),
            text_color: "#9DB4FFFF",
          }),
          c.widget("text", {
            ...c.at([0.04, 0.16, 0.13, 0.05], [0.06, 0.12, 0.4, 0.04]),
            ...NO_PANEL,
            font_family: "Consolas",
            font_size: Math.round(15 * c.s),
            text_color: "#9DB4FF8C",
            custom_text: "SOL III · LOW ORBIT",
          }),
        ],
        [
          makeEffect("audio_glow", { color: "#6C5CE7FF", opacity: 0.6, intensity: 0.5, speed: 0.15 }),
          makeEffect("light_rays", { color: "#9DB4FFFF", opacity: 0.45, intensity: 0.5, speed: 0.2 }),
        ],
      );
    },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    tagline: "Black, white and nothing else",
    build: (width, height) => {
      const c = ctxFor(width, height);
      return scene(
        procedural("particles", "Mono", "#FFFFFF", "#7A7A7A", 3),
        [
          c.widget("clock", {
            ...c.at([0.25, 0.34, 0.5, 0.24], [0.06, 0.38, 0.88, 0.14]),
            ...NO_PANEL,
            font_family: "Segoe UI Light",
            font_size: Math.round(150 * c.s),
            text_color: "#FFFFFFFF",
            show_date: false,
          }),
          c.widget("date", {
            ...c.at([0.3, 0.57, 0.4, 0.06], [0.06, 0.52, 0.88, 0.05]),
            ...NO_PANEL,
            font_family: "Segoe UI",
            font_size: Math.round(20 * c.s),
            text_color: "#FFFFFF8C",
          }),
        ],
        [],
      );
    },
  },
];

// ---------------------------------------------------------------------
// Scene presets: one per mood, built on the scene styles in scenes.ts.
// A handful of layout recipes keep them consistent: the wallpaper is the
// star, widgets stay out of its way.
// ---------------------------------------------------------------------

interface Look {
  font: string;
  /** "#RRGGBBAA" */
  color: string;
  glow?: boolean;
  captionFont?: string;
  italic?: boolean;
}

/** Same color, different alpha ("#RRGGBBAA" in, "#RRGGBB" + aa out). */
const dim = (hex: string, aa = "99") => hex.slice(0, 7) + aa;

function clockW(c: Ctx, look: Look, box: [Box, Box], size: number, patch: Partial<DesktopWidget> = {}) {
  return c.widget("clock", {
    ...c.at(box[0], box[1]),
    ...NO_PANEL,
    font_family: look.font,
    font_size: Math.round(size * c.s),
    text_color: look.color,
    text_glow: !!look.glow,
    show_date: false,
    ...patch,
  });
}

function textW(c: Ctx, look: Look, box: [Box, Box], size: number, text: string, patch: Partial<DesktopWidget> = {}) {
  return c.widget("text", {
    ...c.at(box[0], box[1]),
    ...NO_PANEL,
    font_family: look.captionFont ?? look.font,
    font_italic: !!look.italic,
    font_size: Math.round(size * c.s),
    text_color: dim(look.color, "B3"),
    custom_text: text,
    ...patch,
  });
}

function dateW(c: Ctx, look: Look, box: [Box, Box], size: number) {
  return c.widget("date", { ...c.at(box[0], box[1]), ...NO_PANEL, font_family: look.font, font_size: Math.round(size * c.s), text_color: dim(look.color, "A6") });
}

/** Big clock in the middle, date under it, optional caption at the bottom. */
function centered(c: Ctx, look: Look, caption?: string): DesktopWidget[] {
  return [
    clockW(c, look, [[0.25, 0.3, 0.5, 0.24], [0.06, 0.36, 0.88, 0.14]], 140),
    dateW(c, look, [[0.3, 0.53, 0.4, 0.06], [0.06, 0.5, 0.88, 0.05]], 22),
    ...(caption ? [textW(c, look, [[0.2, 0.86, 0.6, 0.06], [0.06, 0.88, 0.88, 0.05]], 22, caption)] : []),
  ];
}

/** Clock + date tucked bottom-left, caption bottom-right - the scene gets the whole screen. */
function corner(c: Ctx, look: Look, caption?: string): DesktopWidget[] {
  return [
    clockW(c, look, [[0.04, 0.7, 0.3, 0.2], [0.06, 0.74, 0.88, 0.12]], 104, { show_date: true }),
    ...(caption ? [textW(c, look, [[0.62, 0.85, 0.34, 0.06], [0.06, 0.88, 0.88, 0.05]], 22, caption)] : []),
  ];
}

/** Clock across the top of the sky. */
function top(c: Ctx, look: Look, caption?: string): DesktopWidget[] {
  return [
    clockW(c, look, [[0.28, 0.06, 0.44, 0.22], [0.06, 0.06, 0.88, 0.14]], 124),
    dateW(c, look, [[0.3, 0.27, 0.4, 0.05], [0.06, 0.2, 0.88, 0.04]], 20),
    ...(caption ? [textW(c, look, [[0.25, 0.32, 0.5, 0.05], [0.06, 0.25, 0.88, 0.04]], 20, caption)] : []),
  ];
}

/** A small HUD: clock, system stats and a status line down the left edge. */
function hud(c: Ctx, look: Look, caption?: string): DesktopWidget[] {
  return [
    clockW(c, look, [[0.04, 0.06, 0.24, 0.14], [0.06, 0.05, 0.6, 0.1]], 76, { show_date: true }),
    c.widget("system_stats", {
      ...c.at([0.04, 0.22, 0.16, 0.1], [0.06, 0.17, 0.5, 0.07]),
      ...NO_PANEL,
      font_family: "Consolas",
      font_size: Math.round(19 * c.s),
      text_color: look.color,
      text_glow: !!look.glow,
    }),
    ...(caption ? [textW(c, { ...look, captionFont: "Consolas" }, [[0.04, 0.33, 0.24, 0.05], [0.06, 0.25, 0.88, 0.04]], 15, caption)] : []),
  ];
}

/** Clock plus live weather cards, for the scenes that pair with the radar side of the app. */
function weatherDeck(c: Ctx, look: Look, panel: string, border: string): DesktopWidget[] {
  const card: Partial<DesktopWidget> = { panel_color: panel, border_color: border, corner_radius: 18, font_size: Math.round(WEATHER_BASE_FONT * 1.2 * c.s) };
  return [
    clockW(c, look, [[0.04, 0.06, 0.3, 0.18], [0.06, 0.05, 0.88, 0.12]], 96, { show_date: true }),
    c.widget("current", { ...c.at([0.75, 0.06, 0.21, 0.2], [0.06, 0.62, 0.43, 0.15]), ...card }),
    c.widget("forecast", { ...c.at([0.75, 0.29, 0.21, 0.3], [0.51, 0.62, 0.43, 0.3]), ...card }),
  ];
}

type Layout = (c: Ctx) => DesktopWidget[];

function scenePreset(
  id: string,
  name: string,
  tagline: string,
  style: ProceduralStyle,
  primary: string,
  secondary: string,
  seed: number,
  layout: Layout,
  effects: EffectInstance[] = [],
): Preset {
  return {
    id,
    name,
    tagline,
    build: (width, height) => {
      const c = ctxFor(width, height);
      return scene({ kind: "procedural", style, palette: name, primary, secondary, seed }, layout(c), effects);
    },
  };
}

const LIGHT: Look = { font: "Segoe UI Light", color: "#FFFFFFF0" };
const glowing = (color: string, font = "Bahnschrift"): Look => ({ font, color, glow: true });

const SCENE_PRESETS: Preset[] = [
  // --- Night sky ---
  scenePreset("northern-lights", "Northern Lights", "Aurora curtains over a silent ridge", "aurora", "#00FFA3", "#7B2FF7", 11, (c) =>
    top(c, { ...LIGHT, color: "#E6FFF5F0" }, "somewhere north of everything"),
  ),
  scenePreset("aurora-rosa", "Aurora Rosa", "Pink and violet sky-fire", "aurora", "#FF4FA3", "#6C5CE7", 23, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#FFE6F3F0" }, "the sky is putting on a show"),
  ),
  scenePreset("violet-nebula", "Violet Nebula", "Slow-turning clouds of violet gas", "nebula", "#8A5CFF", "#FF2FD1", 5, (c) =>
    hud(c, glowing("#D9C9FFFF", "Consolas"), "NEBULA-7 · DRIFT NOMINAL"),
  ),
  scenePreset("ice-nebula", "Ice Nebula", "Cold blue starbirth", "nebula", "#00B8FF", "#E8F9FF", 44, (c) => centered(c, { ...LIGHT, color: "#EAF8FFF0" })),
  scenePreset("milky-core", "Milky Core", "A whole galaxy, turning slowly", "galaxy", "#FFD6A0", "#6C8CFF", 7, (c) =>
    corner(c, { ...LIGHT, color: "#FFF1DEF0" }, "you are here, roughly"),
  ),
  scenePreset("emerald-spiral", "Emerald Spiral", "A green spiral galaxy", "galaxy", "#B6FF00", "#00B8A9", 91, (c) => top(c, { ...LIGHT, color: "#EFFFE0F0" })),
  scenePreset("stargazer", "Stargazer", "Galaxy, starlight and a quiet clock", "galaxy", "#E8ECFF", "#9D8CFF", 303, (c) => hud(c, { font: "Consolas", color: "#C9D3FFFF" }, "OBSERVATORY LINK · CLEAR SKIES"), [
    makeEffect("light_rays", { color: "#9DB4FFFF", opacity: 0.3, intensity: 0.4, speed: 0.15 }),
  ]),

  // --- Retro / neon ---
  scenePreset("outrun", "Outrun", "Striped sun, neon grid, endless highway", "synthwave", "#FFD54F", "#FF2FD1", 1985, (c) =>
    top(c, glowing("#FF7BEAFF"), "N I G H T   D R I V E"),
  ),
  scenePreset("vaporwave", "Vaporwave", "Pastel sunset on a chrome grid", "synthwave", "#01CDFE", "#FF71CE", 1995, (c) =>
    corner(c, glowing("#B9F3FFFF", "Segoe UI Light"), "V A P O R"),
  ),
  scenePreset("midnight-grid", "Midnight Grid", "Blood-red sun over a violet grid", "synthwave", "#FF3B30", "#7B2FF7", 77, (c) => centered(c, glowing("#FF8A80FF"))),
  scenePreset("the-construct", "The Construct", "Falling green code", "digital_rain", "#00FF66", "#003A1C", 3, (c) =>
    hud(c, glowing("#7CFF9EFF", "Consolas"), "WAKE UP."),
  ),
  scenePreset("crimson-code", "Crimson Code", "Red glyphs raining down", "digital_rain", "#FF3B30", "#3A0008", 13, (c) => hud(c, glowing("#FF8A80FF", "Consolas"), "ACCESS GRANTED")),
  scenePreset("cyan-stream", "Cyan Stream", "A cool blue data waterfall", "digital_rain", "#14FFEC", "#0D2B3A", 29, (c) => corner(c, glowing("#9FFFF6FF", "Consolas"))),
  scenePreset("neon-skyline", "Neon Skyline", "A city that never sleeps, in the rain", "skyline", "#FF2FD1", "#00E5FF", 8, (c) =>
    top(c, glowing("#FF9BF0FF"), "city lights, wet streets"),
  [makeEffect("rain", { intensity: 0.45, speed: 0.5, opacity: 0.55 })]),
  scenePreset("midnight-lofi", "Midnight Lo-fi", "Warm windows, soft rain, lo-fi on", "skyline", "#FFB36B", "#5B4BDB", 42, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#FFF1E0F0", captionFont: "Georgia", italic: true }, "late night. lo-fi. rain on the window."),
  [makeEffect("rain", { intensity: 0.7, speed: 0.4, opacity: 0.85 }), makeEffect("audio_glow", { color: "#FF9B6AFF", opacity: 0.2, intensity: 0.3, speed: 0.2 })]),
  scenePreset("rooftop", "Rooftop", "Searchlights over the skyline", "skyline", "#00E5FF", "#3B2A7A", 64, (c) => hud(c, glowing("#9FF3FFFF", "Consolas"), "SECTOR 7 · 02:14")),

  // --- Nature ---
  scenePreset("firefly-meadow", "Firefly Meadow", "Summer dusk, fireflies in the trees", "fireflies", "#FFE066", "#2ED573", 21, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#FFF8DCF0", captionFont: "Ink Free" }, "stay out till the fireflies come"),
  ),
  scenePreset("glowwood", "Glowwood", "Blue lights in a moonlit forest", "fireflies", "#7CF5D6", "#3B3F7A", 55, (c) => top(c, { ...LIGHT, color: "#E3FFF8F0" })),
  scenePreset("alpenglow", "Alpenglow", "Ridges fading into a golden sunset", "ridges", "#FF9E6B", "#5B4BDB", 17, (c) =>
    top(c, { font: "Segoe UI Light", color: "#FFFFFFF0" }, "golden hour, every hour"),
  ),
  scenePreset("misty-pines", "Misty Pines", "Layered hills in cool morning mist", "ridges", "#9FC5C8", "#2B4C5E", 31, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#F2FBFFF0", captionFont: "Georgia", italic: true }, "slow morning"),
  ),
  scenePreset("first-snow", "First Snow", "Pale peaks and falling snow", "ridges", "#CFE3FF", "#3B4F7A", 60, (c) => centered(c, { font: "Segoe UI Light", color: "#FFFFFFF5" }, "the first snow of the year"), [
    makeEffect("snow", { intensity: 0.7, speed: 0.3, opacity: 0.9 }),
  ]),
  scenePreset("moonlit-sea", "Moonlit Sea", "Moonlight glittering on a calm sea", "moonlit_sea", "#8FB8FF", "#1B2A4A", 12, (c) =>
    top(c, { ...LIGHT, color: "#EAF1FFF0" }, "listen to the tide"),
  ),
  scenePreset("golden-sea", "Golden Sea", "A low sun melting into the water", "moonlit_sea", "#FFB45E", "#7A3B5E", 36, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#FFF3E2F0", captionFont: "Georgia", italic: true }, "stay for the sunset"),
  ),
  scenePreset("weather-deck", "Weather Deck", "Mountain dusk with live weather", "ridges", "#6FB8FF", "#1F2F4A", 88, (c) =>
    weatherDeck(c, { font: "Bahnschrift", color: "#E6F1FFFF" }, "#05080DB8", "#6FB8FF40"),
  [makeEffect("rain", { intensity: 0.2, speed: 0.6, opacity: 0.3 })]),

  // --- Hypnotic ---
  scenePreset("hypno-tunnel", "Hypno Tunnel", "Rings rushing out of the void", "tunnel", "#FF2FD1", "#00E5FF", 2, (c) => corner(c, glowing("#FFB3F4FF"))),
  scenePreset("warp-drive", "Warp Drive", "Punch it", "tunnel", "#E8F9FF", "#3B7BFF", 9, (c) => hud(c, glowing("#CFE6FFFF", "Consolas"), "WARP 9.975 · HOLDING")),
  scenePreset("lotus-mandala", "Lotus Mandala", "A breathing kaleidoscope of light", "mandala", "#FFB6C1", "#FFD700", 4, (c) =>
    corner(c, { font: "Gabriola", color: "#FFF4E8F0" }, "breathe in, breathe out"),
  ),
  scenePreset("cosmic-mandala", "Cosmic Mandala", "Violet and teal, endlessly unfolding", "mandala", "#7B2FF7", "#14FFEC", 19, (c) => corner(c, glowing("#D9FFFBFF", "Segoe UI Light"))),
  scenePreset("silk", "Silk", "Threads of light following an invisible current", "flow_field", "#00E5FF", "#8A5CFF", 6, (c) =>
    centered(c, { ...LIGHT, color: "#F0F6FFF5" }),
  ),
  scenePreset("embers", "Embers", "Sparks drifting up from a fire", "flow_field", "#FFB400", "#FF3B30", 15, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#FFEBD6F0", captionFont: "Georgia", italic: true }, "keep the fire going"),
  ),
  scenePreset("orbitals", "Orbitals", "A pendulum drawing that never repeats", "harmonograph", "#00E5FF", "#FF2FD1", 33, (c) => corner(c, { ...LIGHT, color: "#F2F4FFF0" })),
  scenePreset("golden-ratio", "Golden Ratio", "Gold light tracing a slow figure", "harmonograph", "#FFD54F", "#FF7A00", 61, (c) => top(c, { font: "Palatino Linotype", color: "#FFF4DCF0" })),

  // --- Fluid ---
  scenePreset("lava-lamp", "Lava Lamp", "Warm blobs rising and falling", "lava_lamp", "#FF5E3A", "#FFB400", 70, (c) =>
    corner(c, glowing("#FFE3C4FF", "Segoe UI Light"), "groovy"),
  ),
  scenePreset("cool-lamp", "Cool Lamp", "A lava lamp in blue and violet", "lava_lamp", "#00E5FF", "#7B2FF7", 71, (c) => corner(c, glowing("#D6F7FFFF", "Segoe UI Light"))),
  scenePreset("liquid-opal", "Liquid Opal", "Pearly color flowing like oil on water", "liquid", "#7CF5D6", "#FF71CE", 40, (c) => centered(c, { ...LIGHT, color: "#FFFFFFF5" })),
  scenePreset("liquid-sunset", "Liquid Sunset", "Orange and violet melting together", "liquid", "#FF7A00", "#7B2FF7", 47, (c) => top(c, { ...LIGHT, color: "#FFFFFFF5" }, "melting")),

  // --- Chill ---
  scenePreset("city-bokeh", "City Bokeh", "Blurred city lights on a rainy night", "bokeh", "#FFB36B", "#FF4F7B", 27, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#FFF1E6F0", captionFont: "Georgia", italic: true }, "out of focus, in the moment"),
  [makeEffect("rain", { intensity: 0.4, speed: 0.4, opacity: 0.55 })]),
  scenePreset("holiday-lights", "Holiday Lights", "Soft festive bokeh and snow", "bokeh", "#FFD54F", "#2ED573", 25, (c) =>
    centered(c, { font: "Segoe UI Light", color: "#FFFAEAF5", captionFont: "Segoe Script" }, "cozy season"),
  [makeEffect("snow", { intensity: 0.5, speed: 0.25, opacity: 0.8 })]),
  scenePreset("deep-focus", "Deep Focus", "Minimal, dark, nothing to distract you", "harmonograph", "#FFFFFF", "#6A6A6A", 99, (c) =>
    hud(c, { font: "Consolas", color: "#D9D9D9FF" }, "FOCUS MODE"),
  ),
];

// ---------------------------------------------------------------------
// Weather presets: the live radar / conditions / forecast / alert widgets
// as part of the scene. Cards are tinted to match each wallpaper.
// ---------------------------------------------------------------------

interface Card {
  panel: string;
  border: string;
  radius?: number;
}

const cardOf = (c: Ctx, k: Card, scale = 1.2): Partial<DesktopWidget> => ({
  panel_color: k.panel,
  border_color: k.border,
  corner_radius: k.radius ?? 18,
  font_size: Math.round(WEATHER_BASE_FONT * scale * c.s),
});

const captionAt = (c: Ctx, look: Look, text: string | undefined, box: [Box, Box]) => (text ? [textW(c, look, box, 20, text)] : []);

/** Big live radar as the centrepiece, conditions and alerts beside it. */
function radarHero(c: Ctx, look: Look, k: Card, caption?: string): DesktopWidget[] {
  const card = cardOf(c, k);
  return [
    c.widget("radar", { ...c.at([0.36, 0.08, 0.46, 0.66], [0.06, 0.18, 0.88, 0.42]), ...card }),
    c.widget("current", { ...c.at([0.05, 0.08, 0.26, 0.22], [0.06, 0.62, 0.43, 0.15]), ...card }),
    c.widget("storm", { ...c.at([0.05, 0.33, 0.26, 0.2], [0.51, 0.62, 0.43, 0.15]), ...card }),
    clockW(c, look, [[0.05, 0.72, 0.3, 0.18], [0.06, 0.04, 0.88, 0.12]], 88, { show_date: true }),
    ...captionAt(c, look, caption, [[0.4, 0.8, 0.42, 0.06], [0.06, 0.8, 0.88, 0.05]]),
  ];
}

/** Clock on the left, conditions + forecast stacked on the right. */
function forecastColumn(c: Ctx, look: Look, k: Card, caption?: string): DesktopWidget[] {
  const card = cardOf(c, k);
  return [
    clockW(c, look, [[0.05, 0.08, 0.36, 0.22], [0.06, 0.05, 0.88, 0.13]], 120, { show_date: true }),
    ...captionAt(c, look, caption, [[0.05, 0.3, 0.36, 0.06], [0.06, 0.18, 0.88, 0.04]]),
    c.widget("current", { ...c.at([0.74, 0.08, 0.22, 0.2], [0.06, 0.52, 0.43, 0.15]), ...card }),
    c.widget("forecast", { ...c.at([0.74, 0.31, 0.22, 0.34], [0.51, 0.52, 0.43, 0.32]), ...card }),
  ];
}

/** Everything at once: radar, conditions, forecast, alerts and system stats. */
function controlRoom(c: Ctx, look: Look, k: Card): DesktopWidget[] {
  const card = cardOf(c, k, 1.1);
  return [
    c.widget("radar", { ...c.at([0.04, 0.06, 0.4, 0.58], [0.06, 0.04, 0.88, 0.34]), ...card }),
    c.widget("current", { ...c.at([0.46, 0.06, 0.2, 0.2], [0.06, 0.4, 0.43, 0.14]), ...card }),
    c.widget("storm", { ...c.at([0.46, 0.28, 0.2, 0.18], [0.51, 0.4, 0.43, 0.14]), ...card }),
    c.widget("forecast", { ...c.at([0.68, 0.06, 0.28, 0.4], [0.06, 0.56, 0.88, 0.24]), ...card }),
    clockW(c, look, [[0.46, 0.7, 0.32, 0.18], [0.06, 0.82, 0.58, 0.1]], 92, { show_date: true }),
    c.widget("system_stats", {
      ...c.at([0.04, 0.68, 0.18, 0.1], [0.66, 0.83, 0.28, 0.08]),
      ...NO_PANEL,
      font_family: "Consolas",
      font_size: Math.round(19 * c.s),
      text_color: look.color,
      text_glow: !!look.glow,
    }),
  ];
}

/** Minimal: the clock with one glass conditions card under it. */
function glanceWeather(c: Ctx, look: Look, k: Card, caption?: string): DesktopWidget[] {
  return [
    clockW(c, look, [[0.28, 0.24, 0.44, 0.22], [0.06, 0.3, 0.88, 0.13]], 132),
    dateW(c, look, [[0.3, 0.45, 0.4, 0.05], [0.06, 0.43, 0.88, 0.04]], 20),
    c.widget("current", { ...c.at([0.41, 0.52, 0.18, 0.17], [0.28, 0.5, 0.44, 0.14]), ...cardOf(c, k) }),
    ...captionAt(c, look, caption, [[0.2, 0.86, 0.6, 0.06], [0.06, 0.88, 0.88, 0.05]]),
  ];
}

/** A small radar and conditions in the top-right corner: the scene stays the star. */
function cornerRadar(c: Ctx, look: Look, k: Card, caption?: string): DesktopWidget[] {
  const card = cardOf(c, k);
  return [
    c.widget("radar", { ...c.at([0.72, 0.06, 0.24, 0.36], [0.06, 0.05, 0.88, 0.32]), ...card }),
    c.widget("current", { ...c.at([0.72, 0.45, 0.24, 0.18], [0.06, 0.39, 0.88, 0.13]), ...card }),
    ...corner(c, look, caption),
  ];
}

const GLASS: Card = { panel: "#0A0C12B8", border: "#FFFFFF33" };
const tint = (panelRgb: string, borderRgb: string, radius?: number): Card => ({ panel: `${panelRgb}C4`, border: `${borderRgb}59`, radius });

const WEATHER_PRESETS: Preset[] = [
  scenePreset("storm-chaser", "Storm Chaser", "Live radar over a city in the storm", "skyline", "#FF3B30", "#1F2F4A", 501, (c) =>
    radarHero(c, glowing("#FFD2CCFF"), tint("#0A0608", "#FF6B5B", 12), "chasing the next cell"),
  [makeEffect("rain", { intensity: 0.55, speed: 0.7, opacity: 0.6 })]),
  scenePreset("tornado-alley", "Tornado Alley", "Green-sky dusk, radar and alerts front and centre", "ridges", "#8FA36B", "#2B3A2A", 502, (c) =>
    radarHero(c, { font: "Bahnschrift", color: "#EEF5E6FF" }, tint("#0B100A", "#B8D68A")),
  [makeEffect("rain", { intensity: 0.35, speed: 0.8, opacity: 0.45 })]),
  scenePreset("thunder-night", "Thunder Night", "Purple storm light, heavy rain, live radar", "skyline", "#B388FF", "#2A1B4A", 503, (c) =>
    radarHero(c, glowing("#E3D6FFFF"), tint("#0C0814", "#B388FF", 16)),
  [makeEffect("rain", { intensity: 0.85, speed: 0.75, opacity: 0.85 }), makeEffect("light_rays", { color: "#C9B8FFFF", opacity: 0.35, intensity: 0.5, speed: 0.5 })]),
  scenePreset("hurricane-desk", "Hurricane Desk", "Swirling teal, radar and storm tracker", "liquid", "#00B8FF", "#0D7377", 504, (c) =>
    radarHero(c, { font: "Bahnschrift", color: "#E6FBFFFF" }, tint("#031418", "#5FE3FF")),
  ),
  scenePreset("blizzard-watch", "Blizzard Watch", "Icy peaks, heavy snow, the forecast at a glance", "ridges", "#CFE3FF", "#2B3B5A", 505, (c) =>
    forecastColumn(c, { font: "Segoe UI Light", color: "#FFFFFFF5" }, tint("#0B1220", "#CFE3FF"), "stay in. it's wild out there."),
  [makeEffect("snow", { intensity: 1, speed: 0.55, opacity: 0.95 })]),
  scenePreset("morning-forecast", "Morning Forecast", "Soft sunrise and today's weather", "ridges", "#FFC48A", "#6FA8DC", 506, (c) =>
    forecastColumn(c, { font: "Segoe UI Light", color: "#FFFFFFF5" }, tint("#141A26", "#FFE2C2"), "good morning"),
  ),
  scenePreset("cozy-forecast", "Cozy Forecast", "Warm lights, gentle snow, forecast for the week", "bokeh", "#FFB36B", "#FF7A59", 507, (c) =>
    forecastColumn(c, { font: "Segoe UI Light", color: "#FFF4E6F5", captionFont: "Georgia", italic: true }, tint("#1A0F08", "#FFD2A6"), "blanket weather"),
  [makeEffect("snow", { intensity: 0.45, speed: 0.25, opacity: 0.8 })]),
  scenePreset("aurora-forecast", "Aurora Forecast", "Northern lights with the week ahead", "aurora", "#00FFA3", "#3B7BFF", 508, (c) =>
    forecastColumn(c, { ...LIGHT, color: "#E6FFF5F0" }, tint("#04100C", "#7CFFD0")),
  ),
  scenePreset("summer-evening", "Summer Evening", "Fireflies, warm air and tonight's forecast", "fireflies", "#FFE066", "#3B3F7A", 509, (c) =>
    forecastColumn(c, { font: "Segoe UI Light", color: "#FFF8DCF0", captionFont: "Ink Free" }, tint("#0A0C14", "#FFE9A0"), "windows open tonight"),
  ),
  scenePreset("rainy-day-radar", "Rainy Day Radar", "Lo-fi city in the rain, radar in the corner", "skyline", "#FFB36B", "#3B4F7A", 510, (c) =>
    cornerRadar(c, { font: "Segoe UI Light", color: "#FFF1E0F0", captionFont: "Georgia", italic: true }, tint("#0B0D14", "#FFCFA0"), "rain check on everything"),
  [makeEffect("rain", { intensity: 0.8, speed: 0.45, opacity: 0.9 })]),
  scenePreset("night-watch", "Night Watch", "Moonlit sea with a quiet eye on the sky", "moonlit_sea", "#8FB8FF", "#1B2A4A", 511, (c) =>
    cornerRadar(c, { ...LIGHT, color: "#EAF1FFF0" }, tint("#050A14", "#8FB8FF"), "all quiet on the radar"),
  ),
  scenePreset("neon-radar", "Neon Radar", "Outrun sunset with a neon weather radar", "synthwave", "#FF2FD1", "#00E5FF", 512, (c) =>
    cornerRadar(c, glowing("#FF9BF0FF"), tint("#12001F", "#FF2FD1", 6)),
  ),
  scenePreset("weather-lab", "Weather Lab", "Data waterfall and every weather feed at once", "digital_rain", "#14FFEC", "#0D2B3A", 513, (c) =>
    controlRoom(c, glowing("#9FFFF6FF", "Consolas"), tint("#021012", "#14FFEC", 6)),
  ),
  scenePreset("mission-control", "Mission Control", "Deep space ops with radar, alerts and stats", "nebula", "#6C8CFF", "#FF2FD1", 514, (c) =>
    controlRoom(c, { font: "Consolas", color: "#C9D3FFFF" }, tint("#060818", "#9DB4FF", 10)),
  ),
  scenePreset("cosmic-weather", "Cosmic Weather", "A galaxy and the weather outside", "galaxy", "#FFD6A0", "#6C8CFF", 515, (c) =>
    glanceWeather(c, { ...LIGHT, color: "#FFF1DEF0" }, GLASS),
  ),
  scenePreset("sunny-side", "Sunny Side", "Warm liquid color and today's conditions", "liquid", "#FF9500", "#FF2F6D", 516, (c) =>
    glanceWeather(c, { ...LIGHT, color: "#FFFFFFF5" }, tint("#1A0A08", "#FFD2A6"), "looking up"),
  ),
  scenePreset("beach-forecast", "Beach Forecast", "Golden-hour sea and the weather", "moonlit_sea", "#FFB45E", "#7A3B5E", 517, (c) =>
    glanceWeather(c, { font: "Segoe UI Light", color: "#FFF3E2F0", captionFont: "Georgia", italic: true }, tint("#1A0C10", "#FFD2A6"), "one more sunset"),
  ),
  scenePreset("rain-on-glass", "Rain on Glass", "Deep blue calm, rain and conditions", "liquid", "#3B7BFF", "#0D1B3A", 518, (c) =>
    glanceWeather(c, { ...LIGHT, color: "#EAF1FFF5" }, tint("#050A18", "#9DB4FF"), "listen"),
  [makeEffect("rain", { intensity: 0.9, speed: 0.4, opacity: 0.95 })]),
];

const MORE_SCENES: Preset[] = [
  scenePreset("sakura-drift", "Sakura Drift", "Pink bokeh and falling petals", "bokeh", "#FFB6C1", "#FF71CE", 601, (c) =>
    centered(c, { font: "Segoe UI Light", color: "#FFF0F5F5", captionFont: "Segoe Script" }, "spring, finally"),
  [makeEffect("snow", { color: "#FFC4D6FF", intensity: 0.55, speed: 0.2, opacity: 0.9 })]),
  scenePreset("deep-sea", "Deep Sea", "Drifting lights in the blue deep", "bokeh", "#00B8FF", "#0D2B3A", 602, (c) => corner(c, { ...LIGHT, color: "#E0F7FFF0" }, "down where it's quiet"), [
    makeEffect("light_rays", { color: "#7FD8FFFF", opacity: 0.5, intensity: 0.5, speed: 0.2 }),
  ]),
  scenePreset("winter-aurora", "Winter Aurora", "Pale aurora and slow snowfall", "aurora", "#7CF5D6", "#CFE3FF", 603, (c) => top(c, { ...LIGHT, color: "#F2FFFCF5" }), [
    makeEffect("snow", { intensity: 0.4, speed: 0.2, opacity: 0.75 }),
  ]),
  scenePreset("rose-nebula", "Rose Nebula", "Pink and gold starbirth", "nebula", "#FF4F7B", "#FFB36B", 604, (c) => corner(c, { ...LIGHT, color: "#FFEAF0F0" }, "made of star stuff")),
  scenePreset("cyber-violet", "Cyber Violet", "Violet code falling forever", "digital_rain", "#B388FF", "#1A0033", 605, (c) => hud(c, glowing("#D9C9FFFF", "Consolas"), "SYSTEM ONLINE")),
  scenePreset("solar-tunnel", "Solar Tunnel", "Falling into a golden vortex", "tunnel", "#FFD54F", "#FF7A00", 606, (c) => corner(c, glowing("#FFE9A8FF", "Segoe UI Light"))),
  scenePreset("vapor-mandala", "Vapor Mandala", "Pastel kaleidoscope", "mandala", "#01CDFE", "#FF71CE", 607, (c) => corner(c, glowing("#D6F7FFFF", "Segoe UI Light"))),
  scenePreset("toxic-flow", "Toxic Flow", "Acid-green threads in the dark", "flow_field", "#B6FF00", "#00FFA3", 608, (c) => hud(c, glowing("#D9FF8CFF", "Consolas"), "CONTAINMENT: STABLE")),
  scenePreset("ocean-liquid", "Ocean Liquid", "Turquoise water in motion", "liquid", "#00F5D4", "#0077B6", 609, (c) => centered(c, { ...LIGHT, color: "#FFFFFFF5" })),
  scenePreset("lavender-hills", "Lavender Hills", "Violet ridges at the end of the day", "ridges", "#C3A6FF", "#3B2A7A", 610, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#FFFFFFF0", captionFont: "Georgia", italic: true }, "take the long way home"),
  ),
];

// Presets built on the storm / atmosphere effects (lightning, fog, embers).
const LIGHTNING = (patch: Partial<EffectInstance> = {}) => makeEffect("lightning", patch);
const FOG = (patch: Partial<EffectInstance> = {}) => makeEffect("fog", patch);
const EMBERS = (patch: Partial<EffectInstance> = {}) => makeEffect("embers", patch);
const RAIN = (patch: Partial<EffectInstance> = {}) => makeEffect("rain", patch);

const ATMOSPHERE_PRESETS: [PresetCategory, Preset][] = [
  ["Weather", scenePreset("supercell", "Supercell", "Lightning, heavy rain and the live radar", "skyline", "#7FA8FF", "#161E36", 701, (c) =>
    radarHero(c, glowing("#DCE6FFFF"), tint("#060A14", "#8FB0FF", 14), "severe weather mode"),
  [RAIN({ intensity: 0.8, speed: 0.7, opacity: 0.8 }), LIGHTNING({ intensity: 0.8, speed: 0.6 })])],
  ["Weather", scenePreset("storm-front", "Storm Front", "A wall of storms rolling over the ridges", "ridges", "#8A9BB8", "#1E2436", 702, (c) =>
    radarHero(c, { font: "Bahnschrift", color: "#EEF2FAFF" }, tint("#0A0C12", "#B8C6E0")),
  [LIGHTNING({ intensity: 0.6, speed: 0.4 }), RAIN({ intensity: 0.35, speed: 0.7, opacity: 0.45 })])],
  ["Weather", scenePreset("heat-lightning", "Heat Lightning", "Silent flashes on a hot summer night", "ridges", "#FF8A5C", "#3B1F4A", 703, (c) =>
    forecastColumn(c, { font: "Segoe UI Light", color: "#FFF1E6F5" }, tint("#140A12", "#FFB38A"), "too hot to sleep"),
  [LIGHTNING({ intensity: 0.4, speed: 0.35, color: "#FFD2B0FF" })])],
  ["Weather", scenePreset("stormy-sea", "Stormy Sea", "Lightning over dark water", "moonlit_sea", "#9DB4FF", "#0F1626", 704, (c) =>
    cornerRadar(c, { ...LIGHT, color: "#E6EEFFF0" }, tint("#050810", "#9DB4FF"), "batten down the hatches"),
  [LIGHTNING({ intensity: 0.7, speed: 0.5 }), RAIN({ intensity: 0.5, speed: 0.8, opacity: 0.55 })])],
  ["Weather", scenePreset("cyberstorm", "Cyberstorm", "Code rain, real rain, lightning", "digital_rain", "#00E5FF", "#001A2A", 705, (c) =>
    controlRoom(c, glowing("#9FF3FFFF", "Consolas"), tint("#010C12", "#00E5FF", 6)),
  [LIGHTNING({ intensity: 0.6, speed: 0.5, color: "#BDF6FFFF" }), RAIN({ intensity: 0.4, speed: 0.6, opacity: 0.4 })])],
  ["Weather", scenePreset("misty-morning", "Misty Morning", "Fog in the valleys, today's forecast", "ridges", "#E8D9C8", "#5E7390", 706, (c) =>
    forecastColumn(c, { font: "Segoe UI Light", color: "#FFFFFFF5" }, tint("#1A1E26", "#F2E6D8"), "coffee first"),
  [FOG({ intensity: 0.7, speed: 0.25 })])],
  ["Weather", scenePreset("london-fog", "London Fog", "A grey city, drizzle and fog", "skyline", "#C9D2DE", "#2E3440", 707, (c) =>
    glanceWeather(c, { font: "Georgia", color: "#F2F4F8F5" }, tint("#12151A", "#C9D2DE"), "fancy a cuppa?"),
  [FOG({ intensity: 0.8, speed: 0.2, opacity: 0.6 }), RAIN({ intensity: 0.3, speed: 0.4, opacity: 0.45 })])],
  ["Weather", scenePreset("foggy-harbor", "Foggy Harbor", "Moonlight through the sea fog", "moonlit_sea", "#C8D6E8", "#1B2433", 708, (c) =>
    cornerRadar(c, { ...LIGHT, color: "#EEF3FAF0" }, tint("#0A0E14", "#C8D6E8"), "foghorns in the distance"),
  [FOG({ intensity: 0.75, speed: 0.2 })])],
  ["Weather", scenePreset("autumn-dusk", "Autumn Dusk", "Falling leaves and the week's forecast", "ridges", "#FF9A3D", "#6B2F3A", 709, (c) =>
    forecastColumn(c, { font: "Segoe UI Light", color: "#FFF4E8F5", captionFont: "Georgia", italic: true }, tint("#1A0E0A", "#FFC08A"), "sweater weather"),
  [makeEffect("snow", { color: "#FFA24DFF", intensity: 0.35, speed: 0.25, opacity: 0.85 })])],
  ["Weather", scenePreset("campfire", "Campfire", "Sparks rising into a starry night", "fireflies", "#FF9E40", "#1E2B4A", 710, (c) =>
    glanceWeather(c, { font: "Segoe UI Light", color: "#FFF1E0F5", captionFont: "Ink Free" }, tint("#120C0A", "#FFC08A"), "one more story"),
  [EMBERS({ intensity: 0.6, speed: 0.4 })])],

  ["Night Sky", scenePreset("electric-nebula", "Electric Nebula", "Lightning inside a violet cloud", "nebula", "#8A5CFF", "#00E5FF", 711, (c) => corner(c, glowing("#E0D6FFFF", "Segoe UI Light")), [
    LIGHTNING({ intensity: 0.5, speed: 0.35, color: "#C9B8FFFF" }),
  ])],
  ["Night Sky", scenePreset("ember-galaxy", "Ember Galaxy", "A golden galaxy with drifting sparks", "galaxy", "#FFB45E", "#FF3B30", 712, (c) => top(c, { ...LIGHT, color: "#FFEEDCF0" }), [EMBERS({ intensity: 0.35, speed: 0.25 })])],
  ["Night Sky", scenePreset("arctic-night", "Arctic Night", "Aurora, ice fog and snow", "aurora", "#7CF5D6", "#3B7BFF", 713, (c) => centered(c, { ...LIGHT, color: "#F0FFFBF5" }, "-30 and clear"), [
    FOG({ intensity: 0.5, speed: 0.2, color: "#CFF6EEFF" }),
    makeEffect("snow", { intensity: 0.3, speed: 0.2, opacity: 0.7 }),
  ])],

  ["Retro & Neon", scenePreset("thunderdome", "Thunderdome", "Neon grid under a lightning sky", "synthwave", "#FF2FD1", "#7B2FF7", 714, (c) => top(c, glowing("#FF9BF0FF"), "T H U N D E R"), [
    LIGHTNING({ intensity: 0.7, speed: 0.55, color: "#FFB3F4FF" }),
  ])],
  ["Retro & Neon", scenePreset("blade-city", "Blade City", "Neon rain and fog, forever night", "skyline", "#FF6B3D", "#00B8C4", 715, (c) =>
    corner(c, glowing("#FFC9B0FF", "Segoe UI Light"), "more human than human"),
  [FOG({ intensity: 0.6, speed: 0.3, color: "#FFB89AFF", opacity: 0.45 }), RAIN({ intensity: 0.6, speed: 0.5, opacity: 0.7 })])],

  ["Nature", scenePreset("haunted-woods", "Haunted Woods", "Green lights in the fog", "fireflies", "#9CFF6B", "#2A1B3D", 716, (c) =>
    corner(c, { font: "Segoe UI Light", color: "#E8FFE0F0", captionFont: "Ink Free" }, "don't go in there"),
  [FOG({ intensity: 0.8, speed: 0.2, color: "#B8D6C0FF" })])],
  ["Nature", scenePreset("volcano", "Volcano", "Black ridges, red sky, rising embers", "ridges", "#FF5E3A", "#2A0A0A", 717, (c) => top(c, { ...LIGHT, color: "#FFE6DCF5" }), [EMBERS({ intensity: 0.8, speed: 0.5 })])],
  ["Nature", scenePreset("ghost-ship", "Ghost Ship", "Green moonlight and drifting fog", "moonlit_sea", "#9DFFCB", "#0E1F1A", 718, (c) => corner(c, { ...LIGHT, color: "#E6FFF3F0" }, "something's out there"), [
    FOG({ intensity: 0.7, speed: 0.25, color: "#C8F0DCFF" }),
  ])],

  ["Chill", scenePreset("fireplace", "Fireplace", "Warm glow, drifting embers, the weather outside", "bokeh", "#FF8A3D", "#8A2B1A", 719, (c) =>
    glanceWeather(c, { font: "Segoe UI Light", color: "#FFF1E0F5", captionFont: "Georgia", italic: true }, tint("#140A06", "#FFB38A"), "stay warm"),
  [EMBERS({ intensity: 0.5, speed: 0.35 })])],
  ["Hypnotic", scenePreset("the-forge", "The Forge", "Molten threads and flying sparks", "flow_field", "#FF7A00", "#FFD54F", 720, (c) => hud(c, glowing("#FFD9A8FF", "Consolas"), "TEMP 1,450°C"), [EMBERS({ intensity: 0.7, speed: 0.6 })])],
  ["Fluid", scenePreset("dragons-den", "Dragon's Den", "A lava lamp that means business", "lava_lamp", "#FF2A1A", "#FF8A00", 721, (c) => corner(c, glowing("#FFD2C4FF", "Segoe UI Light")), [EMBERS({ intensity: 0.5, speed: 0.45 })])],
];

// ---------------------------------------------------------------------
// Signature presets: the showcase set. Frosted-glass widgets, the premium
// widgets (analog clock, calendar, sun & moon, temperature graph, countdown)
// and layered effects (shooting stars, dust motes, cinematic grade).
// ---------------------------------------------------------------------

const FROSTED: Partial<DesktopWidget> = {
  show_panel: true,
  panel_color: "#FFFFFF12",
  border_color: "#FFFFFF2E",
  corner_radius: 22,
  glass_blur: true,
  text_shadow: true,
};
const frostedTint = (rgb: string): Partial<DesktopWidget> => ({ ...FROSTED, panel_color: `${rgb}2E`, border_color: `${rgb}55` });

function wgt(c: Ctx, kind: DesktopWidgetKind, box: [Box, Box], patch: Partial<DesktopWidget>): DesktopWidget {
  return c.widget(kind, { ...c.at(box[0], box[1]), ...patch });
}
const wx = (c: Ctx, scale = 1.2) => Math.round(WEATHER_BASE_FONT * scale * c.s);
const STARS = (patch: Partial<EffectInstance> = {}) => makeEffect("shooting_stars", patch);
const DUST = (patch: Partial<EffectInstance> = {}) => makeEffect("dust", patch);
const FILM = (patch: Partial<EffectInstance> = {}) => makeEffect("cinematic", patch);

/** Next New Year's Day as "YYYY-01-01", for the countdown presets. */
const nextNewYear = () => `${new Date().getFullYear() + 1}-01-01`;

const SIGNATURE_PRESETS: Preset[] = [
  scenePreset("midnight-lake", "Midnight Lake", "The Milky Way mirrored in still water", "starry_lake", "#9D8CFF", "#3B7BFF", 801, (c) => [
    clockW(c, { font: "Segoe UI Light", color: "#F2F4FFF5" }, [[0.3, 0.08, 0.4, 0.18], [0.06, 0.06, 0.88, 0.12]], 120, { text_shadow: true }),
    wgt(c, "sun_moon", [[0.76, 0.66, 0.2, 0.26], [0.06, 0.74, 0.43, 0.2]], { ...frostedTint("#B8C4FF"), font_size: Math.round(27 * c.s), text_color: "#EEF1FFFF", accent_color: "#FFD25AFF" }),
    textW(c, { font: "Segoe UI Light", color: "#E6E9FFF0", captionFont: "Georgia", italic: true }, [[0.04, 0.86, 0.4, 0.06], [0.51, 0.86, 0.43, 0.05]], 22, "make a wish"),
  ], [STARS({ intensity: 0.5, speed: 0.45 }), FILM({ intensity: 0.5, speed: 0.25 })]),

  scenePreset("deep-blue", "Deep Blue", "Sun shafts and bubbles, far below the surface", "underwater", "#00C2D4", "#06204A", 802, (c) => [
    wgt(c, "analog_clock", [[0.78, 0.07, 0.16, 0.28], [0.3, 0.06, 0.4, 0.22]], { show_panel: false, text_color: "#E6FBFFFF", accent_color: "#5CF0FFFF", clock_style: "neon", show_seconds: true }),
    wgt(c, "temp_graph", [[0.05, 0.72, 0.36, 0.22], [0.06, 0.74, 0.88, 0.18]], { ...frostedTint("#8FE9FF"), font_size: wx(c, 1.55), accent_color: "#7FF3FFFF" }),
    textW(c, { font: "Segoe UI Light", color: "#D8F7FFF0" }, [[0.05, 0.06, 0.4, 0.07], [0.06, 0.32, 0.88, 0.05]], 26, "breathe.", { letter_spacing: 0.3 }),
  ], [DUST({ color: "#BFF6FFFF", intensity: 0.35, speed: 0.2 }), FILM({ intensity: 0.45, speed: 0.15 })]),

  scenePreset("executive", "Executive", "Navy and gold silk, everything at a glance", "flow_field", "#D4AF5A", "#2B4C7E", 803, (c) => [
    wgt(c, "analog_clock", [[0.06, 0.08, 0.15, 0.27], [0.06, 0.05, 0.4, 0.2]], { show_panel: false, text_color: "#F3E6C4FF", accent_color: "#E8C26AFF", clock_style: "classic", show_seconds: true }),
    wgt(c, "calendar", [[0.06, 0.4, 0.17, 0.3], [0.52, 0.05, 0.42, 0.2]], { ...frostedTint("#E8D3A0"), font_family: "Palatino Linotype", font_size: Math.round(27 * c.s), text_color: "#FBF4E2FF", accent_color: "#E8C26AFF" }),
    wgt(c, "forecast", [[0.76, 0.08, 0.2, 0.36], [0.06, 0.3, 0.88, 0.3]], { ...frostedTint("#E8D3A0"), font_size: wx(c, 1.55), fc_style: "days" }),
    clockW(c, { font: "Palatino Linotype", color: "#FBF4E2F5" }, [[0.6, 0.74, 0.36, 0.18], [0.06, 0.78, 0.88, 0.12]], 96, { show_date: true, text_shadow: true }),
  ], [FILM({ intensity: 0.6, speed: 0.3 })]),

  scenePreset("storm-command", "Storm Command", "Lightning outside, every weather feed on glass", "skyline", "#7FA8FF", "#141C34", 804, (c) => [
    wgt(c, "radar", [[0.36, 0.07, 0.4, 0.58], [0.06, 0.18, 0.88, 0.36]], { ...frostedTint("#9DB8FF"), radar_zoom: 7, radar_animate: true }),
    wgt(c, "current", [[0.04, 0.07, 0.29, 0.2], [0.06, 0.56, 0.43, 0.14]], { ...frostedTint("#9DB8FF"), font_size: wx(c, 1.55) }),
    wgt(c, "storm", [[0.04, 0.3, 0.29, 0.18], [0.51, 0.56, 0.43, 0.14]], { ...frostedTint("#FF8A8A"), font_size: wx(c, 1.55) }),
    wgt(c, "forecast", [[0.79, 0.07, 0.18, 0.58], [0.06, 0.72, 0.43, 0.22]], { ...frostedTint("#9DB8FF"), font_size: wx(c, 1.55), fc_style: "days" }),
    wgt(c, "temp_graph", [[0.36, 0.68, 0.4, 0.22], [0.51, 0.72, 0.43, 0.22]], { ...frostedTint("#9DB8FF"), font_size: wx(c, 1.55) }),
    clockW(c, glowing("#DCE6FFFF"), [[0.04, 0.74, 0.29, 0.16], [0.06, 0.04, 0.88, 0.1]], 84, { show_date: true }),
  ], [RAIN({ intensity: 0.55, speed: 0.6, opacity: 0.6 }), LIGHTNING({ intensity: 0.5, speed: 0.35 })]),

  scenePreset("golden-hour-studio", "Golden Hour", "Warm light, floating dust, the day ahead", "ridges", "#FFB86B", "#7A3B5E", 805, (c) => [
    clockW(c, { font: "Segoe UI Light", color: "#FFF6EAF5" }, [[0.05, 0.08, 0.36, 0.2], [0.06, 0.05, 0.88, 0.12]], 120, { show_date: true, text_shadow: true, text_align: "left" }),
    wgt(c, "forecast", [[0.73, 0.08, 0.23, 0.34], [0.06, 0.6, 0.88, 0.24]], { ...frostedTint("#FFE2C2"), font_size: wx(c, 1.55), fc_style: "days" }),
    wgt(c, "sun_moon", [[0.73, 0.46, 0.23, 0.26], [0.06, 0.86, 0.43, 0.12]], { ...frostedTint("#FFE2C2"), font_size: Math.round(27 * c.s), text_color: "#FFF6EAFF", accent_color: "#FFD25AFF" }),
  ], [DUST({ intensity: 0.6, speed: 0.25 }), makeEffect("light_rays", { color: "#FFD9A0FF", opacity: 0.5, intensity: 0.55, speed: 0.25 }), FILM({ intensity: 0.4, speed: 0.2 })]),

  scenePreset("neo-tokyo", "Neo Tokyo", "Neon rain, glass widgets, film grain", "skyline", "#FF2FD1", "#00E5FF", 806, (c) => [
    wgt(c, "analog_clock", [[0.06, 0.08, 0.14, 0.25], [0.06, 0.05, 0.4, 0.2]], { show_panel: false, text_color: "#FFD6F7FF", accent_color: "#00E5FFFF", clock_style: "neon", show_seconds: true }),
    wgt(c, "calendar", [[0.06, 0.38, 0.16, 0.28], [0.52, 0.05, 0.42, 0.2]], { ...frostedTint("#FF8FE8"), font_size: Math.round(24 * c.s), text_color: "#FFFFFFFF", accent_color: "#FF2FD1FF" }),
    wgt(c, "temp_graph", [[0.62, 0.74, 0.34, 0.2], [0.06, 0.74, 0.88, 0.18]], { ...frostedTint("#8FF4FF"), font_size: wx(c, 1.55), accent_color: "#00E5FFFF" }),
    textW(c, glowing("#FF9BF0FF"), [[0.6, 0.06, 0.36, 0.07], [0.06, 0.3, 0.88, 0.05]], 30, "ネオ東京", { letter_spacing: 0.2 }),
  ], [RAIN({ intensity: 0.6, speed: 0.5, opacity: 0.7 }), FILM({ intensity: 0.55, speed: 0.45 })]),

  scenePreset("cosmos", "Cosmos", "Violet nebula, meteor shower, countdown to the new year", "nebula", "#8A5CFF", "#FF2FD1", 807, (c) => [
    wgt(c, "analog_clock", [[0.08, 0.1, 0.16, 0.28], [0.3, 0.05, 0.4, 0.22]], { show_panel: false, text_color: "#EDE6FFFF", accent_color: "#FF6BE6FF", clock_style: "neon", show_seconds: true }),
    wgt(c, "countdown", [[0.62, 0.76, 0.34, 0.16], [0.06, 0.78, 0.88, 0.14]], { ...frostedTint("#C9B8FF"), font_family: "Segoe UI Light", font_size: Math.round(26 * c.s), text_color: "#F4EEFFFF", accent_color: "#FF8FF0FF", custom_text: "New Year", countdown_target: nextNewYear(), show_seconds: true }),
  ], [STARS({ intensity: 0.6, speed: 0.55 }), FILM({ intensity: 0.5, speed: 0.3 })]),

  scenePreset("zen-garden", "Zen Garden", "A slow golden mandala and floating dust", "mandala", "#E8C26A", "#FF9E6B", 808, (c) => [
    wgt(c, "analog_clock", [[0.43, 0.38, 0.14, 0.25], [0.3, 0.38, 0.4, 0.22]], { show_panel: false, text_color: "#FFF4DCFF", accent_color: "#FFD25AFF", clock_style: "minimal", show_seconds: false }),
    textW(c, { font: "Gabriola", color: "#FFF1D6F0" }, [[0.3, 0.84, 0.4, 0.08], [0.06, 0.86, 0.88, 0.06]], 36, "be here now"),
  ], [DUST({ color: "#FFE2A8FF", intensity: 0.45, speed: 0.2 }), FILM({ intensity: 0.5, speed: 0.2 })]),

  scenePreset("arctic-station", "Arctic Station", "Aurora, ice fog and the live conditions", "aurora", "#7CF5D6", "#3B7BFF", 809, (c) => [
    wgt(c, "current", [[0.05, 0.07, 0.24, 0.2], [0.06, 0.6, 0.43, 0.15]], { ...frostedTint("#BFF6EE"), font_size: wx(c, 1.55) }),
    wgt(c, "temp_graph", [[0.05, 0.3, 0.3, 0.2], [0.06, 0.77, 0.88, 0.17]], { ...frostedTint("#BFF6EE"), font_size: wx(c, 1.55), accent_color: "#7CF5D6FF" }),
    wgt(c, "sun_moon", [[0.77, 0.07, 0.19, 0.25], [0.51, 0.6, 0.43, 0.15]], { ...frostedTint("#BFF6EE"), font_size: Math.round(27 * c.s), text_color: "#F0FFFBFF", accent_color: "#7CF5D6FF" }),
    clockW(c, { font: "Segoe UI Light", color: "#F0FFFBF5" }, [[0.6, 0.74, 0.36, 0.18], [0.06, 0.06, 0.88, 0.12]], 104, { show_date: true, text_shadow: true }),
  ], [FOG({ intensity: 0.45, speed: 0.2, color: "#CFF6EEFF" }), makeEffect("snow", { intensity: 0.35, speed: 0.2, opacity: 0.7 })]),

  scenePreset("lofi-cafe", "Lo-fi Café", "Warm bokeh, rain on the window, a cozy desk", "bokeh", "#FFB36B", "#8A3B2A", 810, (c) => [
    clockW(c, { font: "Segoe UI Light", color: "#FFF1E0F5", captionFont: "Georgia", italic: true }, [[0.05, 0.66, 0.34, 0.2], [0.06, 0.06, 0.88, 0.12]], 112, { show_date: true, text_shadow: true, text_align: "left" }),
    wgt(c, "forecast", [[0.74, 0.08, 0.22, 0.34], [0.06, 0.6, 0.88, 0.24]], { ...frostedTint("#FFD2A6"), font_size: wx(c, 1.55), fc_style: "days" }),
    wgt(c, "calendar", [[0.79, 0.46, 0.17, 0.28], [0.06, 0.86, 0.43, 0.12]], { ...frostedTint("#FFD2A6"), font_size: Math.round(24 * c.s), text_color: "#FFF6EAFF", accent_color: "#FF9E5EFF" }),
    textW(c, { font: "Segoe UI Light", color: "#FFF1E0F0", captionFont: "Georgia", italic: true }, [[0.05, 0.86, 0.34, 0.05], [0.51, 0.86, 0.43, 0.05]], 20, "one more chapter", { text_align: "left" }),
  ], [RAIN({ intensity: 0.75, speed: 0.4, opacity: 0.85 }), DUST({ color: "#FFD9A8FF", intensity: 0.25, speed: 0.15 }), FILM({ intensity: 0.5, speed: 0.35 })]),

  scenePreset("synth-drive", "Synth Drive", "Outrun sunset with meteors and a neon clock face", "synthwave", "#FFD54F", "#FF2FD1", 811, (c) => [
    wgt(c, "analog_clock", [[0.42, 0.06, 0.16, 0.28], [0.3, 0.05, 0.4, 0.22]], { show_panel: false, text_color: "#FFE8F9FF", accent_color: "#00E5FFFF", clock_style: "neon", show_seconds: true }),
    textW(c, glowing("#FF7BEAFF"), [[0.3, 0.86, 0.4, 0.07], [0.06, 0.88, 0.88, 0.05]], 30, "N I G H T   D R I V E"),
  ], [STARS({ intensity: 0.45, speed: 0.4, color: "#FFE0F7FF" }), FILM({ intensity: 0.45, speed: 0.35 })]),

  scenePreset("weather-wall", "Weather Wall", "Moonlit sea and a complete weather station", "moonlit_sea", "#8FB8FF", "#1B2A4A", 812, (c) => [
    wgt(c, "current", [[0.04, 0.06, 0.22, 0.2], [0.06, 0.05, 0.43, 0.14]], { ...frostedTint("#C8D8FF"), font_size: wx(c, 1.55) }),
    wgt(c, "forecast", [[0.04, 0.29, 0.22, 0.36], [0.51, 0.05, 0.43, 0.3]], { ...frostedTint("#C8D8FF"), font_size: wx(c, 1.55), fc_style: "days" }),
    wgt(c, "radar", [[0.74, 0.06, 0.22, 0.36], [0.06, 0.37, 0.88, 0.28]], { ...frostedTint("#C8D8FF"), radar_zoom: 6.5 }),
    wgt(c, "sun_moon", [[0.74, 0.45, 0.22, 0.24], [0.06, 0.67, 0.43, 0.15]], { ...frostedTint("#C8D8FF"), font_size: Math.round(27 * c.s), text_color: "#EEF3FFFF", accent_color: "#FFD25AFF" }),
    wgt(c, "temp_graph", [[0.3, 0.74, 0.4, 0.2], [0.51, 0.67, 0.43, 0.15]], { ...frostedTint("#C8D8FF"), font_size: wx(c, 1.55) }),
  ], [FILM({ intensity: 0.35, speed: 0.15 })]),

  scenePreset("daybreak", "Daybreak", "Pastel morning hills and your forecast", "ridges", "#FFC4A8", "#6FA8DC", 813, (c) => [
    clockW(c, { font: "Segoe UI Light", color: "#FFFFFFF5" }, [[0.3, 0.1, 0.4, 0.2], [0.06, 0.06, 0.88, 0.12]], 126, { show_date: true, text_shadow: true }),
    wgt(c, "forecast", [[0.04, 0.68, 0.3, 0.26], [0.06, 0.6, 0.88, 0.22]], { ...frostedTint("#FFFFFF"), font_size: wx(c, 1.55), fc_style: "graph" }),
    wgt(c, "sun_moon", [[0.77, 0.7, 0.19, 0.24], [0.06, 0.84, 0.43, 0.14]], { ...frostedTint("#FFFFFF"), font_size: Math.round(27 * c.s), text_color: "#FFFFFFFF", accent_color: "#FFB86BFF" }),
  ], [DUST({ color: "#FFF1D6FF", intensity: 0.35, speed: 0.2 }), makeEffect("light_rays", { color: "#FFE6C8FF", opacity: 0.45, intensity: 0.5, speed: 0.2 })]),

  scenePreset("event-horizon", "Event Horizon", "A turning galaxy, meteors and a quiet countdown", "galaxy", "#FFD6A0", "#6C8CFF", 814, (c) => [
    wgt(c, "analog_clock", [[0.06, 0.1, 0.15, 0.27], [0.3, 0.05, 0.4, 0.22]], { show_panel: false, text_color: "#FFF3E2FF", accent_color: "#FFD6A0FF", clock_style: "minimal", show_seconds: true }),
    wgt(c, "countdown", [[0.62, 0.78, 0.34, 0.15], [0.06, 0.8, 0.88, 0.13]], { ...FROSTED, font_family: "Segoe UI Light", font_size: Math.round(24 * c.s), text_color: "#FFF3E2FF", accent_color: "#FFD6A0FF", custom_text: "New Year", countdown_target: nextNewYear() }),
  ], [STARS({ intensity: 0.4, speed: 0.35 }), FILM({ intensity: 0.5, speed: 0.25 })]),
];

/** Taskbar look per Signature preset (the rest default to fully clear). */
const SIGNATURE_TASKBAR: Record<string, Preset["taskbar"]> = {
  "midnight-lake": { mode: "acrylic", color: "#0A0C2466" },
  "deep-blue": { mode: "tint", color: "#00243A55" },
  executive: { mode: "acrylic", color: "#0B1A3A80" },
  "storm-command": { mode: "blur", color: "#00000000" },
  "neo-tokyo": { mode: "tint", color: "#2A003A55" },
  "lofi-cafe": { mode: "acrylic", color: "#2A140A66" },
  "weather-wall": { mode: "blur", color: "#00000000" },
};

/** Gallery filter for every preset that isn't in WEATHER_PRESETS. */
const CATEGORY_OF: Record<string, PresetCategory> = {
  starter: "Classic",
  "lofi-rain": "Chill",
  "storm-watch": "Weather",
  "neon-city": "Retro & Neon",
  "cozy-snow": "Chill",
  space: "Night Sky",
  "minimal-mono": "Classic",
  "northern-lights": "Night Sky",
  "aurora-rosa": "Night Sky",
  "violet-nebula": "Night Sky",
  "ice-nebula": "Night Sky",
  "milky-core": "Night Sky",
  "emerald-spiral": "Night Sky",
  stargazer: "Night Sky",
  outrun: "Retro & Neon",
  vaporwave: "Retro & Neon",
  "midnight-grid": "Retro & Neon",
  "the-construct": "Retro & Neon",
  "crimson-code": "Retro & Neon",
  "cyan-stream": "Retro & Neon",
  "neon-skyline": "Retro & Neon",
  "midnight-lofi": "Chill",
  rooftop: "Retro & Neon",
  "firefly-meadow": "Nature",
  glowwood: "Nature",
  alpenglow: "Nature",
  "misty-pines": "Nature",
  "first-snow": "Nature",
  "moonlit-sea": "Nature",
  "golden-sea": "Nature",
  "weather-deck": "Weather",
  "hypno-tunnel": "Hypnotic",
  "warp-drive": "Hypnotic",
  "lotus-mandala": "Hypnotic",
  "cosmic-mandala": "Hypnotic",
  silk: "Hypnotic",
  embers: "Hypnotic",
  orbitals: "Hypnotic",
  "golden-ratio": "Hypnotic",
  "lava-lamp": "Fluid",
  "cool-lamp": "Fluid",
  "liquid-opal": "Fluid",
  "liquid-sunset": "Fluid",
  "city-bokeh": "Chill",
  "holiday-lights": "Chill",
  "deep-focus": "Classic",
  "sakura-drift": "Chill",
  "deep-sea": "Chill",
  "winter-aurora": "Night Sky",
  "rose-nebula": "Night Sky",
  "cyber-violet": "Retro & Neon",
  "solar-tunnel": "Hypnotic",
  "vapor-mandala": "Hypnotic",
  "toxic-flow": "Hypnotic",
  "ocean-liquid": "Fluid",
  "lavender-hills": "Nature",
};

/** Every preset, in gallery order: the originals, then weather, then the scenes. */
export const PRESETS: Preset[] = [
  ...SIGNATURE_PRESETS.map((p) => ({ ...p, category: "Signature" as const, taskbar: SIGNATURE_TASKBAR[p.id] ?? { mode: "clear" as const, color: "#00000000" } })),
  ...CORE_PRESETS.map((p) => ({ ...p, category: CATEGORY_OF[p.id] ?? "Classic" })),
  ...WEATHER_PRESETS.map((p) => ({ ...p, category: "Weather" as const })),
  ...ATMOSPHERE_PRESETS.map(([category, p]) => ({ ...p, category })),
  ...[...SCENE_PRESETS, ...MORE_SCENES].map((p) => ({ ...p, category: CATEGORY_OF[p.id] ?? "Chill" })),
];

/** The full monitor layout a preset produces for this monitor. */
export function presetLayout(preset: Preset, monitorId: string, width: number, height: number): MonitorLayout {
  return { monitor_id: monitorId, ...preset.build(width, height) };
}
