"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useDemo } from "../AppWindow";
import { DesktopSurface, placementStyle } from "./surface";
import { EFFECTS, effectDef, effectOf, patchEffect } from "./effects";
import { PRESETS, PRESET_CATEGORIES, type Preset, type PresetCategory } from "./presets";
import { PROCEDURAL_PALETTES, PROCEDURAL_STYLES, proceduralSource, randomSeed } from "./procedural";
import { FREE, PRO_NAME, type Feature } from "./license";
import type { DesktopWidget, DesktopWidgetKind, EffectInstance, EffectKind, MonitorLayout, ProceduralStyle, WallpaperSource } from "./types";
import { WIDGETS, newWidget, widgetDef } from "./widgetdefs";
import { Chip, ColorPicker, LockIcon, ProChip, Section, Segmented, SettingRow, Slider, Toggle, c, useApp, type TodoItem } from "./ui";

// The Editor (src/desktop/EditorView.tsx): pick a monitor, pick its wallpaper,
// place and style widgets on a live preview, then Send to Desktop.

interface Monitor {
  id: string;
  label: string;
  width: number;
  height: number;
}

const MONITORS: Monitor[] = [
  { id: "d1", label: "Display 1 · 1920×1080 · primary", width: 1920, height: 1080 },
  { id: "d2", label: "Display 2 · 2560×1080", width: 2560, height: 1080 },
];

const FONTS = [
  "Segoe UI", "Segoe UI Light", "Segoe UI Semibold", "Segoe UI Black", "Segoe Print", "Segoe Script",
  "Arial", "Arial Black", "Bahnschrift", "Bahnschrift Light", "Calibri", "Cambria", "Candara", "Consolas", "Constantia",
  "Corbel", "Courier New", "Franklin Gothic Medium", "Gabriola", "Georgia", "Impact", "Ink Free",
  "Lucida Console", "Palatino Linotype", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana",
];

const TILE_W = 170;
const COLLAPSED_STYLES = 8;
const COLLAPSED_PALETTES = 12;

type Layout = Omit<MonitorLayout, "monitor_id">;
const EMPTY: Layout = { wallpaper: null, widgets: [], effects: [] };

/** "YYYY-MM-DD" n days from today (a sample countdown date). */
function daysFromToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function describeSource(src: WallpaperSource | null): string {
  if (!src) return "None - the normal Windows wallpaper shows on this monitor.";
  if (src.kind === "procedural") {
    const style = PROCEDURAL_STYLES.find((s) => s.value === src.style)?.label ?? src.style;
    return `${style} · ${src.palette || "Custom"} · seed ${src.seed}`;
  }
  return `${src.kind === "video" ? "Video" : "Image"}: ${src.path.split(/[\\/]/).pop()}`;
}

export function EditorView() {
  const app = useApp();
  const { notify } = useDemo();
  const { settings, update } = app;
  const [monitorId, setMonitorId] = useState("d1");
  const [draft, setDraft] = useState<Record<string, Layout>>(() => ({ d1: PRESETS.find((p) => p.id === "starter")!.build(1920, 1080), d2: EMPTY }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("Pick a wallpaper, place some widgets, then hit Send to Desktop.");
  const [sending, setSending] = useState(false);
  const [style, setStyle] = useState<ProceduralStyle>("gradient_flow");
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [showAllPalettes, setShowAllPalettes] = useState(false);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [appliedPreset, setAppliedPreset] = useState<string | null>("starter");
  const [fxPreview, setFxPreview] = useState<EffectKind | null>(null);
  const fxTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(fxTimer.current), []);
  const locked = (f: Feature) => app.openPaywall(f);

  const monitor = MONITORS.find((m) => m.id === monitorId)!;
  const current = draft[monitorId] ?? EMPTY;
  const selected = current.widgets.find((w) => w.id === selectedId) ?? null;

  // Keep the style / palette pickers showing what this monitor uses.
  const src = current.wallpaper;
  const srcStyle = src?.kind === "procedural" ? src.style : null;
  const srcPalette = src?.kind === "procedural" ? src.palette : null;
  const [prevSrc, setPrevSrc] = useState(`${srcStyle}|${srcPalette}`);
  if (prevSrc !== `${srcStyle}|${srcPalette}`) {
    setPrevSrc(`${srcStyle}|${srcPalette}`);
    if (srcStyle) setStyle(srcStyle);
    const idx = PROCEDURAL_PALETTES.findIndex((p) => p.name === srcPalette);
    if (idx >= 0) setPaletteIdx(idx);
  }

  const editMonitor = (fn: (m: Layout) => Layout) => setDraft((d) => ({ ...d, [monitorId]: fn(d[monitorId] ?? EMPTY) }));
  const editWidget = (id: string, patch: Partial<DesktopWidget>) => editMonitor((m) => ({ ...m, widgets: m.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));

  const setWallpaper = (next: WallpaperSource | null, note?: string) => {
    editMonitor((m) => ({ ...m, wallpaper: next }));
    setStatus(note ?? "Previewing - not sent to the desktop yet.");
  };

  const applyProcedural = (s = style, p = paletteIdx) => {
    if (!app.styleAllowed(s) || !app.paletteAllowed(PROCEDURAL_PALETTES[p].name)) return locked("wallpapers");
    setWallpaper(proceduralSource(s, PROCEDURAL_PALETTES[p]));
  };

  const reroll = () => {
    if (src?.kind === "procedural") setWallpaper({ ...src, seed: randomSeed() });
    else applyProcedural();
  };

  const addWidget = (kind: DesktopWidgetKind) => {
    const usable = current.widgets.filter((w) => app.widgetAllowed(w.kind)).length;
    if (!app.widgetAllowed(kind) || usable >= app.limit("desktopWidgets")) return locked("widgets");
    const w = newWidget(kind);
    if (kind === "countdown") {
      w.countdown_target = daysFromToday(23);
    }
    editMonitor((m) => ({ ...m, widgets: [...m.widgets, w] }));
    setSelectedId(w.id);
  };

  const removeWidget = (id: string) => {
    editMonitor((m) => ({ ...m, widgets: m.widgets.filter((w) => w.id !== id) }));
    setSelectedId(null);
  };

  const leftOff = (m: Layout): string[] => {
    if (app.pro) return [];
    const out: string[] = [];
    const w = m.wallpaper;
    if (w && !(w.kind === "procedural" && app.styleAllowed(w.style) && app.paletteAllowed(w.palette))) out.push("the wallpaper");
    const free = m.widgets.filter((x) => app.widgetAllowed(x.kind));
    const dropped = m.widgets.length - Math.min(free.length, app.limit("desktopWidgets"));
    if (dropped > 0) out.push(`${dropped} widget${dropped === 1 ? "" : "s"}`);
    out.push(...m.effects.filter((e) => e.enabled).map((e) => effectDef(e.kind).label));
    return out;
  };

  const send = () => {
    setSending(true);
    window.setTimeout(() => {
      const off = leftOff(current);
      const which = "this monitor";
      setStatus(
        off.length > 0
          ? `Sent to ${which} with the free limits - left off: ${off.join(", ")}. Upgrade to Pro to send everything.`
          : current.wallpaper
            ? `Sent to ${which}. Your other monitors keep what they're showing.`
            : "Sent. This monitor has no wallpaper, so the normal Windows wallpaper is showing.",
      );
      setSending(false);
      notify("In the app, this puts it on your real desktop, behind your icons.");
    }, 600);
  };

  const takeDown = () => {
    setAppliedPreset(null);
    setStatus("Live wallpaper taken down - your normal Windows wallpaper is back, and stays back after a restart, until the next Send.");
    notify("In the app, this takes the live wallpaper off your desktop.");
  };

  const setEffect = (kind: EffectKind, patch: Partial<EffectInstance>) => {
    if (!app.can("effects")) {
      // Free: a short taste in the preview, then the paywall.
      if (!patch.enabled || fxPreview) return;
      setFxPreview(kind);
      window.clearTimeout(fxTimer.current);
      fxTimer.current = window.setTimeout(() => {
        setFxPreview(null);
        locked("effects");
      }, FREE.effectPreviewMs);
      return;
    }
    editMonitor((m) => ({ ...m, effects: patchEffect(m.effects, kind, patch) }));
    setAppliedPreset(null);
  };

  const userPresets = useMemo<Preset[]>(
    () =>
      settings.user_presets.map((u) => ({
        id: `user:${u.id}`,
        name: u.name,
        tagline: `Saved ${u.created}`,
        category: "My Presets" as const,
        build: () => {
          const l = JSON.parse(JSON.stringify(u.layout)) as Layout;
          return { ...l, widgets: l.widgets.map((w) => ({ ...w, id: newWidget(w.kind).id })) };
        },
      })),
    [settings.user_presets],
  );
  const allPresets = useMemo(() => [...userPresets, ...PRESETS], [userPresets]);

  const applyPreset = (p: Preset) => {
    if (!p.id.startsWith("user:") && !app.presetAllowed(p.id)) return locked("presets");
    editMonitor(() => p.build(monitor.width, monitor.height));
    setSelectedId(null);
    setAppliedPreset(p.id);
    setStatus(`${p.name} applied to the preview - tweak anything, then hit Send to Desktop.`);
  };

  const saveAsPreset = () => {
    const name = `My setup ${settings.user_presets.length + 1}`;
    const id = `u${Date.now().toString(36)}`;
    update({
      user_presets: [{ id, name, created: new Date().toLocaleDateString(), layout: JSON.parse(JSON.stringify({ wallpaper: current.wallpaper, widgets: current.widgets, effects: current.effects })) }, ...settings.user_presets],
    });
    setAppliedPreset(`user:${id}`);
    setStatus(`Saved "${name}" to My Presets.`);
  };
  const renameUserPreset = (pid: string) => {
    const id = pid.replace(/^user:/, "");
    const p = settings.user_presets.find((x) => x.id === id);
    const name = p && window.prompt("Rename preset", p.name)?.trim();
    if (!p || !name) return;
    update({ user_presets: settings.user_presets.map((x) => (x.id === id ? { ...x, name } : x)) });
  };
  const deleteUserPreset = (pid: string) => {
    const id = pid.replace(/^user:/, "");
    update({ user_presets: settings.user_presets.filter((x) => x.id !== id) });
  };

  // Free: the preview shows no effects, except the few seconds a locked one is sampled.
  const previewLayout: Layout = app.can("effects") ? current : { ...current, effects: fxPreview ? patchEffect([], fxPreview, { enabled: true }) : [] };

  const previewBox = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(540);
  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(boxWidth / monitor.width, 420 / monitor.height);

  return (
    <div className={c("pane scroll editor")}>
      <div className={c("card editor-top")}>
        <div className={c("toolbar")} style={{ flex: 1 }}>
          <span className={c("toolbar-label")}>Monitor</span>
          {MONITORS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={c("chip", m.id === monitorId && "on")}
              onClick={() => {
                setMonitorId(m.id);
                setSelectedId(null);
                setAppliedPreset(null);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button className={c("btn btn-secondary btn-small")} onClick={takeDown} title="Remove the live wallpaper from every monitor">
          Take down
        </button>
        <button className={c("btn btn-primary editor-send")} onClick={send} disabled={sending}>
          {sending ? "Sending..." : "Send to this monitor"}
        </button>
      </div>
      <div className={c("editor-status text-muted")}>{status}</div>

      <Section title="PRESETS · ONE CLICK">
        <div className={c("toolbar")} style={{ marginBottom: 10 }}>
          <button className={c("btn btn-primary btn-small")} onClick={saveAsPreset} title="Save this monitor's wallpaper, widgets, effects and taskbar look as your own preset">
            + Save current as preset
          </button>
          {userPresets.length > 0 && (
            <span className={c("text-muted")} style={{ fontSize: 11 }}>
              {userPresets.length} saved in My Presets
            </span>
          )}
        </div>
        <PresetStrip
          width={monitor.width}
          height={monitor.height}
          active={appliedPreset}
          presets={allPresets}
          onApply={applyPreset}
          onRename={renameUserPreset}
          onDelete={deleteUserPreset}
          isLocked={(id) => !id.startsWith("user:") && !app.presetAllowed(id)}
        />
      </Section>

      <div className={c("editor-main")}>
        <div className={c("editor-left")}>
          <div className={c("editor-preview")} ref={previewBox}>
            <div className={c("editor-preview-frame")}>
              <DesktopSurface scale={scale} width={monitor.width} height={monitor.height} layout={previewLayout} watermark={!app.pro}>
                <EditOverlay widgets={current.widgets} selectedId={selectedId} onSelect={setSelectedId} onPlace={editWidget} />
                {fxPreview && (
                  <div className={c("fx-preview-badge")} style={{ fontSize: 13 / scale }}>
                    <LockIcon size={11 / scale} /> {effectDef(fxPreview).label} preview · {PRO_NAME} feature
                  </div>
                )}
                {!current.wallpaper && (
                  <div className={c("editor-empty")} style={{ fontSize: 14 / scale }}>
                    No wallpaper on this monitor yet - pick one below.
                  </div>
                )}
              </DesktopSurface>
            </div>
          </div>

          <Section title="WALLPAPER">
            <div className={c("text-secondary editor-source")}>{describeSource(current.wallpaper)}</div>
            <button
              type="button"
              className={c("upload-zone", !app.can("wallpapers") && "is-locked")}
              onClick={() => (app.can("wallpapers") ? notify("In the app, this opens a file picker for your own video or image.") : locked("wallpapers"))}
            >
              <span className={c("upload-icon")} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V4m-4 4 4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
              </span>
              <span className={c("upload-text")}>
                <span className={c("upload-title")}>
                  {!app.can("wallpapers") && <LockIcon size={10} />} Use your own wallpaper
                </span>
                <span className={c("upload-hint")}>Pick a video or image, or drag one in from File Explorer (MP4, WEBM, JPG, PNG, GIF...)</span>
              </span>
            </button>
            <div className={c("toolbar")}>
              {current.wallpaper && (
                <button className={c("btn btn-danger btn-small")} onClick={() => setWallpaper(null, "Wallpaper cleared for this monitor.")}>
                  None
                </button>
              )}
            </div>
            <div className={c("toolbar-label")} style={{ margin: "14px 0 8px" }}>
              Animated styles
            </div>
            <div className={c("style-grid")}>
              {(showAllStyles ? PROCEDURAL_STYLES : PROCEDURAL_STYLES.slice(0, COLLAPSED_STYLES)).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={c(s.value === style && "active", !app.styleAllowed(s.value) && "is-locked")}
                  title={app.styleAllowed(s.value) ? undefined : `${s.label} is a Pro style`}
                  onClick={() => {
                    if (!app.styleAllowed(s.value)) return locked("wallpapers");
                    setStyle(s.value);
                    applyProcedural(s.value, paletteIdx);
                  }}
                >
                  {!app.styleAllowed(s.value) && <LockIcon size={9} />} {s.label}
                </button>
              ))}
              <button type="button" className={c("style-more")} onClick={() => setShowAllStyles((v) => !v)}>
                {showAllStyles ? "Show less" : `+${PROCEDURAL_STYLES.length - COLLAPSED_STYLES} more`}
              </button>
            </div>
            <div className={c("palette-grid")}>
              {PROCEDURAL_PALETTES.map((p, i) => ({ p, i }))
                .filter(({ i }) => showAllPalettes || i < COLLAPSED_PALETTES || i === paletteIdx)
                .map(({ p, i }) => (
                  <button
                    key={p.name}
                    type="button"
                    className={c("palette-tile", i === paletteIdx && "on", !app.paletteAllowed(p.name) && "is-locked")}
                    title={app.paletteAllowed(p.name) ? p.name : `${p.name} - Pro palette`}
                    onClick={() => {
                      if (!app.paletteAllowed(p.name)) return locked("wallpapers");
                      setPaletteIdx(i);
                      applyProcedural(style, i);
                    }}
                  >
                    <span className={c("palette-colors")} style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}>
                      {!app.paletteAllowed(p.name) && (
                        <span className={c("palette-lock")}>
                          <LockIcon size={10} />
                        </span>
                      )}
                    </span>
                    <span className={c("palette-name")}>{p.name}</span>
                  </button>
                ))}
            </div>
            <button type="button" className={c("style-more")} style={{ marginTop: 8 }} onClick={() => setShowAllPalettes((v) => !v)}>
              {showAllPalettes ? "Fewer colors" : `All ${PROCEDURAL_PALETTES.length} color palettes`}
            </button>
            <div className={c("toolbar")} style={{ marginTop: 10 }}>
              <button className={c("btn btn-secondary btn-small")} onClick={() => applyProcedural()}>
                Use this
              </button>
              <button className={c("btn btn-secondary btn-small")} onClick={reroll} title="Same style and colors, new random layout">
                Reroll seed
              </button>
            </div>
          </Section>

          <Section title="EFFECTS">
            {!app.can("effects") && (
              <div className={c("tier-note")}>
                <ProChip feature="effects" />
                <span>
                  Flip one on to see a {FREE.effectPreviewMs / 1000}-second preview. Effects come with {PRO_NAME}.
                </span>
              </div>
            )}
            {EFFECTS.map((def) => {
              const saved = effectOf(current.effects, def.kind);
              const fx = fxPreview === def.kind ? { ...saved, enabled: true } : app.can("effects") ? saved : { ...saved, enabled: false };
              const pct = (v: number) => `${Math.round(v * 100)}%`;
              return (
                <div key={def.kind} className={c("fx-row")}>
                  <div className={c("fx-head")}>
                    <span className={c("fx-name")}>{def.label}</span>
                    <span className={c("fx-hint")}>{def.hint}</span>
                    <Toggle checked={fx.enabled} onChange={(v) => setEffect(def.kind, { enabled: v })} label={def.label} />
                  </div>
                  {fx.enabled && app.can("effects") && (
                    <div className={c("fx-body")}>
                      <SettingRow label={def.intensityLabel}>
                        <Slider value={fx.intensity} min={0} max={1} step={0.01} format={pct} onChange={(v) => setEffect(def.kind, { intensity: v })} />
                      </SettingRow>
                      <SettingRow label={def.speedLabel}>
                        <Slider value={fx.speed} min={0} max={1} step={0.01} format={pct} onChange={(v) => setEffect(def.kind, { speed: v })} />
                      </SettingRow>
                      <SettingRow label="Opacity">
                        <Slider value={fx.opacity} min={0} max={1} step={0.01} format={pct} onChange={(v) => setEffect(def.kind, { opacity: v })} />
                      </SettingRow>
                      {def.usesColor && (
                        <SettingRow label="Color">
                          <ColorPicker value={fx.color} onChange={(v) => setEffect(def.kind, { color: v })} />
                        </SettingRow>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Section>

          <Section title="ADD WIDGET">
            {!app.pro && (
              <div className={c("tier-note")}>
                <ProChip feature="widgets" />
                <span>
                  Free: Clock and Date, {FREE.desktopWidgets} on the desktop ({Math.min(current.widgets.filter((w) => app.widgetAllowed(w.kind)).length, FREE.desktopWidgets)}/{FREE.desktopWidgets} used).
                </span>
              </div>
            )}
            {(["Desktop", "Weather"] as const).map((group) => (
              <div key={group} className={c("toolbar")} style={{ marginBottom: 8 }}>
                <span className={c("toolbar-label")} style={{ minWidth: 60 }}>
                  {group}
                </span>
                {WIDGETS.filter((w) => w.group === group).map((w) => (
                  <button
                    key={w.kind}
                    className={c("btn btn-secondary btn-small", !app.widgetAllowed(w.kind) && "is-locked")}
                    title={app.widgetAllowed(w.kind) ? undefined : `${w.label} is a Pro widget`}
                    onClick={() => addWidget(w.kind)}
                  >
                    {app.widgetAllowed(w.kind) ? "+" : <LockIcon size={9} />} {w.label}
                  </button>
                ))}
              </div>
            ))}
            {current.widgets.length > 0 && (
              <div className={c("toolbar")} style={{ marginTop: 6 }}>
                <span className={c("toolbar-label")} style={{ minWidth: 60 }}>
                  Placed
                </span>
                {current.widgets.map((w) => (
                  <button key={w.id} type="button" className={c("chip", w.id === selectedId && "on")} onClick={() => setSelectedId(w.id)}>
                    {widgetDef(w.kind)?.label ?? w.kind}
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className={c("editor-right")}>
          {selected ? (
            <PropertyPanel key={selected.id} widget={selected} onChange={(patch) => editWidget(selected.id, patch)} onRemove={() => removeWidget(selected.id)} />
          ) : (
            <Section title="SELECTED WIDGET">
              <div className={c("text-muted")} style={{ fontSize: 12, lineHeight: 1.5 }}>
                Click a widget in the preview (or add one) to move it and change how it looks.
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ presets gallery

function PresetStrip({
  width,
  height,
  active,
  presets,
  onApply,
  onRename,
  onDelete,
  isLocked,
}: {
  width: number;
  height: number;
  active: string | null;
  presets: Preset[];
  onApply: (p: Preset) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  isLocked: (id: string) => boolean;
}) {
  const [category, setCategory] = useState<PresetCategory | "All">("All");
  const [expanded, setExpanded] = useState(false);
  const [perRow, setPerRow] = useState(4);
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!grid) return;
    const ro = new ResizeObserver(() => setPerRow(Math.max(1, Math.floor((grid.clientWidth + 10) / (TILE_W + 10)))));
    ro.observe(grid);
    return () => ro.disconnect();
  }, [grid]);

  const collapsedCount = perRow * 2;
  // Only the visible tiles are built (fresh widget ids each time, so built once per change).
  const { filtered, previews } = useMemo(() => {
    const list = category === "All" ? presets : presets.filter((p) => p.category === category);
    const shownList = expanded ? list : list.slice(0, collapsedCount);
    return { filtered: list, previews: shownList.map((p) => ({ preset: p, layout: p.build(width, height) })) };
  }, [presets, category, expanded, collapsedCount, width, height]);
  const hidden = filtered.length - previews.length;
  const thumbW = TILE_W - 14;
  const thumbH = 88;
  const scale = Math.min(thumbW / width, thumbH / height);
  const [hovered, setHovered] = useState<string | null>(null);
  const counts = new Map<string, number>();
  for (const p of presets) counts.set(p.category ?? "", (counts.get(p.category ?? "") ?? 0) + 1);

  return (
    <>
      <div className={c("preset-cats")}>
        <Chip on={category === "All"} onClick={() => setCategory("All")}>
          All {presets.length}
        </Chip>
        {PRESET_CATEGORIES.filter((cat) => counts.get(cat)).map((cat) => (
          <Chip key={cat} on={category === cat} onClick={() => setCategory(cat)}>
            {cat} {counts.get(cat)}
          </Chip>
        ))}
      </div>
      <div className={c("preset-strip")} ref={setGrid}>
        {previews.map(({ preset, layout }) => (
          <div
            key={preset.id}
            role="button"
            tabIndex={0}
            className={c("preset-tile", active === preset.id && "on", isLocked(preset.id) && "is-locked")}
            onClick={() => onApply(preset)}
            onMouseEnter={() => setHovered(preset.id)}
            onMouseLeave={() => setHovered((h) => (h === preset.id ? null : h))}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onApply(preset)}
            title={`${preset.name} - ${preset.tagline}`}
            style={{ width: thumbW + 14 }}
          >
            <div className={c("preset-thumb")} style={{ width: thumbW, height: thumbH }}>
              <DesktopSurface scale={scale} width={width} height={height} layout={layout} paused={hovered !== preset.id} />
              {isLocked(preset.id) && (
                <span className={c("pro-chip pro-chip-static preset-lock")}>
                  <LockIcon size={9} />
                  PRO
                </span>
              )}
              {preset.id.startsWith("user:") && (
                <span className={c("preset-user-actions")}>
                  <button
                    type="button"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename(preset.id);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(preset.id);
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <span className={c("preset-name")}>{preset.name}</span>
            <span className={c("preset-tagline")}>{preset.tagline}</span>
          </div>
        ))}
      </div>
      {(hidden > 0 || expanded) && filtered.length > collapsedCount && (
        <button className={c("btn btn-secondary btn-small preset-more")} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : `Show all ${filtered.length} (${hidden} more)`}
        </button>
      )}
    </>
  );
}

// ------------------------------------------------------------------ drag / select handles over the preview

function EditOverlay({ widgets, selectedId, onSelect, onPlace }: { widgets: DesktopWidget[]; selectedId: string | null; onSelect: (id: string | null) => void; onPlace: (id: string, patch: Partial<DesktopWidget>) => void }) {
  const layer = useRef<HTMLDivElement>(null);
  const startDrag = (e: ReactPointerEvent<HTMLDivElement>, w: DesktopWidget, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(w.id);
    const rect = layer.current?.getBoundingClientRect();
    if (!rect) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX;
    const sy = e.clientY;
    const start = { x: w.x, y: w.y, width: w.width, height: w.height };
    const round = (v: number) => Math.round(v * 10000) / 10000;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / rect.width;
      const dy = (ev.clientY - sy) / rect.height;
      if (mode === "move") {
        onPlace(w.id, { x: round(Math.min(Math.max(0, start.x + dx), Math.max(0, 1 - start.width))), y: round(Math.min(Math.max(0, start.y + dy), Math.max(0, 1 - start.height))) });
      } else {
        onPlace(w.id, { width: round(Math.min(Math.max(0.02, start.width + dx), 1 - start.x)), height: round(Math.min(Math.max(0.02, start.height + dy), 1 - start.y)) });
      }
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
  return (
    <div ref={layer} className={c("desk-layer edit-overlay")} onPointerDown={() => onSelect(null)}>
      {widgets.map((w) => (
        <div key={w.id} className={c("edit-handle", w.id === selectedId && "selected")} style={placementStyle(w)} onPointerDown={(e) => startDrag(e, w, "move")}>
          {w.id === selectedId && <div className={c("edit-resize")} onPointerDown={(e) => startDrag(e, w, "resize")} />}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ property panel

function TodoListEditor() {
  const { settings, update } = useApp();
  const todos = settings.todos;
  const [draft, setDraft] = useState("");
  const set = (next: TodoItem[]) => update({ todos: next });
  const patch = (id: string, p: Partial<TodoItem>) => set(todos.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    set([...todos, { id: `t-${Date.now().toString(36)}`, text, done: false }]);
    setDraft("");
  };
  const done = todos.filter((t) => t.done).length;
  return (
    <div className={c("todo-editor")}>
      <div className={c("todo-editor-add")}>
        <input className={c("text-input")} placeholder="Add an item..." value={draft} maxLength={200} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className={c("btn btn-primary btn-small")} onClick={add} disabled={!draft.trim()}>
          Add
        </button>
      </div>
      {todos.length > 0 && (
        <ul className={c("todo-editor-list")}>
          {todos.map((t, i) => (
            <li key={t.id} className={c(t.done && "done")}>
              <input type="checkbox" checked={t.done} onChange={(e) => patch(t.id, { done: e.target.checked })} aria-label="Done" />
              <input className={c("todo-editor-text")} value={t.text} maxLength={200} onChange={(e) => patch(t.id, { text: e.target.value })} />
              <button
                className={c("todo-editor-icon")}
                title="Move up"
                disabled={i === 0}
                onClick={() => {
                  const next = [...todos];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  set(next);
                }}
              >
                ↑
              </button>
              <button className={c("todo-editor-icon")} title="Remove" onClick={() => set(todos.filter((x) => x.id !== t.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {done > 0 && (
        <button className={c("btn btn-secondary btn-small")} onClick={() => set(todos.filter((t) => !t.done))}>
          Clear {done} finished
        </button>
      )}
      <div className={c("setting-hint")}>Changes show on your desktop right away. Every To-Do widget shares this list.</div>
    </div>
  );
}

function PropertyPanel({ widget, onChange, onRemove }: { widget: DesktopWidget; onChange: (patch: Partial<DesktopWidget>) => void; onRemove: () => void }) {
  const def = widgetDef(widget.kind);
  const { locations } = useApp();
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const fonts = FONTS.includes(widget.font_family) ? [...FONTS].sort((a, b) => a.localeCompare(b)) : [widget.font_family, ...[...FONTS].sort((a, b) => a.localeCompare(b))];
  return (
    <>
      <Section title={`SELECTED · ${(def?.label ?? widget.kind).toUpperCase()}`}>
        <SettingRow label="Opacity">
          <Slider value={widget.opacity} min={0.1} max={1} step={0.01} format={pct} onChange={(v) => onChange({ opacity: v })} />
        </SettingRow>
        <SettingRow label="Width">
          <Slider value={widget.width} min={0.05} max={0.7} step={0.005} format={pct} onChange={(v) => onChange({ width: v })} />
        </SettingRow>
        <SettingRow label="Height">
          <Slider value={widget.height} min={0.05} max={0.7} step={0.005} format={pct} onChange={(v) => onChange({ height: v })} />
        </SettingRow>
        {def?.options.map((opt) => {
          if (opt.type === "toggle")
            return (
              <SettingRow key={opt.key} label={opt.label}>
                <Toggle checked={Boolean(widget[opt.key])} onChange={(v) => onChange({ [opt.key]: v })} label={opt.label} />
              </SettingRow>
            );
          if (opt.type === "choice")
            return (
              <SettingRow key={opt.key} label={opt.label}>
                <Segmented value={String(widget[opt.key] ?? opt.choices[0].value)} options={opt.choices} onChange={(v) => onChange({ [opt.key]: v })} />
              </SettingRow>
            );
          if (opt.type === "date")
            return (
              <SettingRow key={opt.key} label={opt.label}>
                <input type="date" className={c("text-input")} value={String(widget[opt.key] ?? "")} onChange={(e) => onChange({ [opt.key]: e.target.value })} />
              </SettingRow>
            );
          if (opt.type === "todo_list")
            return (
              <div key={opt.key} className={c("setting-row")} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div className={c("setting-label")}>{opt.label}</div>
                <TodoListEditor />
              </div>
            );
          if (opt.type === "slider")
            return (
              <SettingRow key={opt.key} label={opt.label} hint={opt.hint}>
                <Slider value={Number(widget[opt.key] ?? opt.min)} min={opt.min} max={opt.max} step={opt.step} format={opt.format} onChange={(n) => onChange({ [opt.key]: n })} />
              </SettingRow>
            );
          if (opt.type === "text")
            return (
              <div key={opt.key} className={c("setting-row")} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div className={c("setting-label")}>{opt.label}</div>
                <textarea className={c("text-input")} rows={opt.multiline ? 3 : 1} value={String(widget[opt.key] ?? "")} onChange={(e) => onChange({ [opt.key]: e.target.value })} />
              </div>
            );
          return (
            <SettingRow key={opt.key} label={opt.label}>
              <select className={c("select")} value={String(widget[opt.key] ?? "")} onChange={(e) => onChange({ [opt.key]: e.target.value })}>
                <option value="">Primary location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </SettingRow>
          );
        })}
      </Section>

      {def?.usesFont && (
        <Section title="FONT">
          <SettingRow label="Family">
            <select className={c("select")} value={widget.font_family} onChange={(e) => onChange({ font_family: e.target.value })}>
              {fonts.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Size">
            <Slider value={widget.font_size} min={8} max={200} step={1} format={(v) => `${v}px`} onChange={(v) => onChange({ font_size: v })} />
          </SettingRow>
          <SettingRow label="Bold">
            <Toggle checked={widget.font_bold} onChange={(v) => onChange({ font_bold: v })} label="Bold" />
          </SettingRow>
          <SettingRow label="Italic">
            <Toggle checked={widget.font_italic} onChange={(v) => onChange({ font_italic: v })} label="Italic" />
          </SettingRow>
          <SettingRow label="Text color">
            <ColorPicker value={widget.text_color} onChange={(v) => onChange({ text_color: v })} />
          </SettingRow>
          <SettingRow label="Glow">
            <Toggle checked={Boolean(widget.text_glow)} onChange={(v) => onChange({ text_glow: v })} label="Glow" />
          </SettingRow>
          <SettingRow label="Shadow" hint="A soft shadow under the text so it reads on busy wallpapers.">
            <Toggle checked={Boolean(widget.text_shadow)} onChange={(v) => onChange({ text_shadow: v })} label="Shadow" />
          </SettingRow>
          <SettingRow label="Align">
            <Segmented
              value={widget.text_align ?? "center"}
              onChange={(v) => onChange({ text_align: v as DesktopWidget["text_align"] })}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />
          </SettingRow>
          <SettingRow label="Letter spacing">
            <Slider value={widget.letter_spacing ?? 0} min={-0.05} max={0.6} step={0.01} format={(v) => `${v.toFixed(2)}em`} onChange={(v) => onChange({ letter_spacing: v })} />
          </SettingRow>
        </Section>
      )}

      {def?.usesAccent && (
        <Section title="ACCENT">
          <SettingRow label="Accent color" hint="Seconds hand, today's date, graph line, countdown digits.">
            <ColorPicker value={widget.accent_color || "#00E5FFFF"} onChange={(v) => onChange({ accent_color: v })} />
          </SettingRow>
        </Section>
      )}

      <Section title="BACKGROUND">
        <SettingRow label="Background panel">
          <Toggle checked={widget.show_panel} onChange={(v) => onChange({ show_panel: v })} label="Background panel" />
        </SettingRow>
        {widget.show_panel && (
          <>
            <SettingRow label="Fill">
              <ColorPicker value={widget.panel_color} onChange={(v) => onChange({ panel_color: v })} />
            </SettingRow>
            <SettingRow label="Border">
              <ColorPicker value={widget.border_color} onChange={(v) => onChange({ border_color: v })} />
            </SettingRow>
            <SettingRow label="Frosted glass" hint="Blurs the wallpaper behind the panel, like Windows 11 / macOS widgets.">
              <Toggle checked={Boolean(widget.glass_blur)} onChange={(v) => onChange({ glass_blur: v })} label="Frosted glass" />
            </SettingRow>
          </>
        )}
        <SettingRow label="Corner radius">
          <Slider value={widget.corner_radius} min={0} max={30} step={1} format={(v) => `${v}px`} onChange={(v) => onChange({ corner_radius: v })} />
        </SettingRow>
      </Section>

      <button className={c("btn btn-danger")} style={{ alignSelf: "flex-start" }} onClick={onRemove}>
        Remove widget
      </button>
    </>
  );
}
