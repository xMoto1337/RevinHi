"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { cssColor } from "./color";
import { runScene } from "./procedural";
import { canvasEffects, runEffects } from "./effects";
import type { DesktopWidget, EffectInstance, MonitorLayout, WallpaperSource } from "./types";
import { WEATHER_BASE_FONT, widgetDef } from "./widgetdefs";
import { c, fmtTemp, fmtWind, formatDate, formatTime, useApp, useClock, type SavedLocation } from "./ui";
import { DailyRows, MoonDisc, TempGraph, WxIcon, dayLength, fmtClock, moonPhase, sampleWeather, sunTimes, toDays, wxKind } from "./weather";
import { RadarDeskWidget, StormCard } from "./radar";

// DesktopSurface.tsx + WidgetFrame.tsx + every widget kind: the same renderer
// the Editor preview and the preset thumbnails use in the real app.

// ------------------------------------------------------------------ layers

function ProceduralBase({ source, width, height, paused }: { source: Extract<WallpaperSource, { kind: "procedural" }>; width: number; height: number; paused?: boolean }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const { style, primary, secondary, seed, palette } = source;
  useEffect(() => {
    if (!canvas) return;
    return runScene(canvas, { kind: "procedural", style, primary, secondary, seed, palette }, width, height, paused);
  }, [canvas, style, primary, secondary, seed, palette, width, height, paused]);
  return <canvas ref={setCanvas} className={c("desk-fill")} />;
}

function EffectsCanvas({ effects, width, height, paused }: { effects: EffectInstance[]; width: number; height: number; paused?: boolean }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const key = JSON.stringify(effects);
  useEffect(() => {
    if (!canvas) return;
    return runEffects(canvas, JSON.parse(key) as EffectInstance[], width, height, undefined, paused);
  }, [canvas, key, width, height, paused]);
  return <canvas ref={setCanvas} className={c("desk-fill desk-fx-canvas")} />;
}

/** The "RevinHi Desktop — Free" badge on a free desktop. */
export function Watermark({ scale = 1 }: { scale?: number }) {
  return (
    <div className={c("desk-watermark")} style={{ fontSize: 13 * scale }}>
      <span className={c("desk-watermark-dot")} />
      RevinHi Desktop — Free · revinhi.com
    </div>
  );
}

export function DesktopSurface({
  scale,
  width,
  height,
  layout,
  watermark,
  paused,
  children,
}: {
  scale: number;
  width: number;
  height: number;
  layout: Omit<MonitorLayout, "monitor_id"> | null;
  watermark?: boolean;
  paused?: boolean;
  children?: ReactNode;
}) {
  const fx = canvasEffects(layout?.effects ?? []);
  const src = layout?.wallpaper ?? null;
  return (
    <div className={c("desk-surface")} style={{ width: width * scale, height: height * scale }}>
      <div className={c("desk-stage")} style={{ width, height, transform: scale === 1 ? undefined : `scale(${scale})` }}>
        <div className={c("desk-layer desk-base")}>
          {src?.kind === "procedural" && <ProceduralBase source={src} width={width} height={height} paused={paused} />}
          {src && src.kind !== "procedural" && (
            // A sample "own" wallpaper: a still from the app's own renders.
            // eslint-disable-next-line @next/next/no-img-element
            <img className={c("desk-fill desk-media")} src={src.path} alt="" draggable={false} />
          )}
        </div>
        <div className={c("desk-layer desk-widgets")}>
          {layout?.widgets.map((wd) => (
            <WidgetFrame key={wd.id} widget={wd} still={paused} />
          ))}
        </div>
        <div className={c("desk-layer desk-effects")}>{fx.length > 0 && <EffectsCanvas effects={fx} width={width} height={height} paused={paused} />}</div>
        {watermark && <Watermark scale={Math.max(1, Math.min(width, height) / 1080)} />}
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ widget frame

export function placementStyle(w: DesktopWidget): CSSProperties {
  const cl = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
  return { position: "absolute", left: `${cl(w.x) * 100}%`, top: `${cl(w.y) * 100}%`, width: `${cl(w.width) * 100}%`, height: `${cl(w.height) * 100}%`, minWidth: 20, minHeight: 20 };
}

function WidgetFrame({ widget, still }: { widget: DesktopWidget; still?: boolean }) {
  const def = widgetDef(widget.kind);
  const style: CSSProperties = { ...placementStyle(widget), opacity: widget.opacity, borderRadius: widget.corner_radius, color: cssColor(widget.text_color) };
  if (widget.show_panel) {
    style.background = cssColor(widget.panel_color, "#08080C8C");
    style.border = `1.5px solid ${cssColor(widget.border_color, "#FFFFFF3C")}`;
    if (widget.glass_blur) {
      style.backdropFilter = "blur(18px) saturate(1.5)";
      style.boxShadow = "0 10px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)";
    }
  }
  const align = widget.text_align ?? "center";
  Object.assign(style, {
    "--desk-align": align,
    "--desk-justify": align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
    "--desk-accent": cssColor(widget.accent_color || "#00E5FFFF"),
  });
  if (widget.letter_spacing) style.letterSpacing = `${widget.letter_spacing}em`;
  if (def?.usesFont) {
    style.fontFamily = `"${widget.font_family}", "Segoe UI", sans-serif`;
    if (def.group === "Desktop") style.fontSize = widget.font_size;
    style.fontWeight = widget.font_bold ? 700 : 400;
    style.fontStyle = widget.font_italic ? "italic" : "normal";
    const shadows: string[] = [];
    if (widget.text_glow) shadows.push("0 0 0.12em currentColor", "0 0 0.45em currentColor");
    if (widget.text_shadow) shadows.push("0 0.06em 0.25em rgba(0,0,0,0.75)");
    if (shadows.length) style.textShadow = shadows.join(", ");
  }
  return (
    <div className={c("desk-widget")} style={style} data-kind={widget.kind}>
      {still && widget.kind === "radar" ? <div className={c("desk-radar-still")} /> : <WidgetBody widget={widget} />}
    </div>
  );
}

/** Sample system stats, drifting a little like a real PC. */
function useStats() {
  const now = useClock(2000);
  const t = now.getTime() / 2000;
  return { cpu: Math.round(14 + 9 * Math.abs(Math.sin(t * 0.7)) + 4 * Math.sin(t * 2.3)), ram: Math.round(41 + 2 * Math.sin(t * 0.2)), battery: 87 };
}

function pick(locations: SavedLocation[], id: string): SavedLocation | null {
  return locations.find((l) => l.id === id) ?? locations[0] ?? null;
}

function WidgetBody({ widget }: { widget: DesktopWidget }) {
  const app = useApp();
  const now = useClock();
  const stats = useStats();
  const { settings } = app;
  const accent = cssColor(widget.accent_color || "#00E5FFFF");
  const ink = cssColor(widget.text_color);
  const loc = pick(app.locations, widget.location_id);
  const weather = useMemo(() => (loc ? sampleWeather(loc.lat, loc.lon, new Date()) : null), [loc]);
  const fmt = (f: number) => fmtTemp(f, settings.temp_unit);
  const hour12 = settings.time_format !== "local24";

  switch (widget.kind) {
    case "clock":
      return (
        <div className={c("desk-text")}>
          {formatTime(now, widget.use_24_hour, widget.show_seconds)}
          {widget.show_date && <div className={c("desk-clock-date")}>{formatDate(now, false)}</div>}
        </div>
      );
    case "date":
      return <div className={c("desk-text")}>{formatDate(now, true)}</div>;
    case "text":
      return <div className={c("desk-text")}>{widget.custom_text}</div>;
    case "system_stats": {
      const lines: string[] = [];
      if (widget.show_cpu) lines.push(`CPU ${stats.cpu}%`);
      if (widget.show_ram) lines.push(`RAM ${stats.ram}%`);
      return <div className={c("desk-text")}>{lines.length ? lines.join("\n") : "No stats selected"}</div>;
    }
    case "battery":
      return <div className={c("desk-text")}>Battery {stats.battery}%</div>;
    case "analog_clock": {
      const style = widget.clock_style || "minimal";
      const sec = now.getSeconds();
      const m = now.getMinutes() + sec / 60;
      const h = (now.getHours() % 12) + m / 60;
      const hand = (deg: number, len: number, wd: number, color: string, glow = false) => (
        <line x1={50} y1={50} x2={50 + Math.sin((deg * Math.PI) / 180) * len} y2={50 - Math.cos((deg * Math.PI) / 180) * len} stroke={color} strokeWidth={wd} strokeLinecap="round" style={glow ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined} />
      );
      return (
        <svg viewBox="-9 -9 118 118" className={c("desk-analog")} role="img" aria-label="Analog clock">
          {style === "classic" && <circle cx={50} cy={50} r={47} fill="none" stroke={ink} strokeOpacity={0.35} strokeWidth={1.5} />}
          {style === "neon" && <circle cx={50} cy={50} r={47} fill="none" stroke={accent} strokeWidth={2} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />}
          {Array.from({ length: 60 }, (_, i) => {
            const major = i % 5 === 0;
            if (!major && style === "minimal") return null;
            const a = (i / 60) * Math.PI * 2;
            const r1 = major ? 38 : 41;
            return <line key={i} x1={50 + Math.sin(a) * r1} y1={50 - Math.cos(a) * r1} x2={50 + Math.sin(a) * 43} y2={50 - Math.cos(a) * 43} stroke={ink} strokeOpacity={major ? 0.9 : 0.35} strokeWidth={major ? 2.2 : 1} strokeLinecap="round" />;
          })}
          {style === "classic" &&
            [12, 3, 6, 9].map((n, k) => (
              <text key={n} x={50 + Math.sin((k * Math.PI) / 2) * 30} y={50 - Math.cos((k * Math.PI) / 2) * 30 + 4} textAnchor="middle" fontSize={11} fill={ink}>
                {n}
              </text>
            ))}
          {hand(h * 30, 22, 4, ink, style === "neon")}
          {hand(m * 6, 32, 2.6, ink, style === "neon")}
          {widget.show_seconds && hand(sec * 6, 36, 1.2, accent, style === "neon")}
          <circle cx={50} cy={50} r={3} fill={accent} />
        </svg>
      );
    }
    case "calendar": {
      const y = now.getFullYear();
      const mo = now.getMonth();
      const first = new Date(y, mo, 1).getDay();
      const daysIn = new Date(y, mo + 1, 0).getDate();
      const cells: (number | null)[] = [...Array<null>(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
      while (cells.length % 7) cells.push(null);
      const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return (
        <div className={c("desk-calendar")}>
          <div className={c("desk-cal-title")}>
            {MONTHS[mo]} <span style={{ opacity: 0.55 }}>{y}</span>
          </div>
          <div className={c("desk-cal-grid")}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className={c("desk-cal-head")}>
                {d}
              </span>
            ))}
            {cells.map((d, i) => (
              <span key={i} className={c("desk-cal-day", d === now.getDate() && "today")} style={d === now.getDate() ? { background: accent, boxShadow: `0 0 0.6em ${accent}` } : undefined}>
                {d ?? ""}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case "countdown": {
      const target = widget.countdown_target ? new Date(`${widget.countdown_target}T00:00:00`) : null;
      if (!target || Number.isNaN(target.getTime())) return <div className={c("desk-text")} style={{ fontSize: "0.7em" }}>Pick a date in the Editor.</div>;
      const ms = target.getTime() - now.getTime();
      const abs = Math.abs(ms);
      const parts: [number, string][] = [
        [Math.floor(abs / 86400000), "days"],
        [Math.floor((abs % 86400000) / 3600000), "hrs"],
        [Math.floor((abs % 3600000) / 60000), "min"],
      ];
      if (widget.show_seconds) parts.push([Math.floor((abs % 60000) / 1000), "sec"]);
      return (
        <div className={c("desk-countdown")}>
          <div className={c("desk-count-label")}>{widget.custom_text?.trim() || "Countdown"}</div>
          <div className={c("desk-count-row")}>
            {parts.map(([v, u]) => (
              <div key={u} className={c("desk-count-unit")}>
                <b style={{ color: accent }}>{String(v).padStart(2, "0")}</b>
                <span>{u}</span>
              </div>
            ))}
          </div>
          {ms < 0 && <div className={c("desk-sub")}>since {target.toLocaleDateString()}</div>}
        </div>
      );
    }
    case "todo": {
      const all = settings.todos;
      const items = widget.todo_hide_done ? all.filter((t) => !t.done) : all;
      const left = all.filter((t) => !t.done).length;
      const title = widget.custom_text?.trim();
      return (
        <div className={c("desk-todo")}>
          {title && (
            <div className={c("desk-todo-title")}>
              <span>{title}</span>
              {all.length > 0 && <span className={c("desk-todo-count")}>{left === 0 ? "all done" : `${left} left`}</span>}
            </div>
          )}
          {items.length === 0 ? (
            <div className={c("desk-todo-empty")}>{all.length ? "Nothing left to do" : "Add items in the Editor"}</div>
          ) : (
            <ul className={c("desk-todo-list")}>
              {items.map((t) => (
                <li key={t.id} className={c(t.done && "done")}>
                  <span className={c("desk-todo-box")} style={{ borderColor: accent, background: t.done ? accent : "transparent" }}>
                    {t.done && (
                      <svg viewBox="0 0 12 12" aria-hidden>
                        <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="#000" strokeOpacity={0.75} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={c("desk-todo-text")}>{t.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    case "sun_moon": {
      if (!loc) return <div className={c("desk-text")} style={{ fontSize: "0.7em" }}>Save a location to see sunrise and sunset.</div>;
      const sun = sunTimes(now, loc.lat, loc.lon);
      const moon = moonPhase(now);
      const p = sun.sunrise && sun.sunset ? (now.getTime() - sun.sunrise.getTime()) / (sun.sunset.getTime() - sun.sunrise.getTime()) : -1;
      const a = Math.PI * (1 - Math.min(1, Math.max(0, p)));
      return (
        <div className={c("desk-sunmoon")}>
          <div className={c("desk-sun")}>
            <svg viewBox="0 0 120 60" className={c("desk-sun-arc")}>
              <path d="M10 54 A 50 44 0 0 1 110 54" fill="none" stroke={accent} strokeOpacity={0.45} strokeWidth={1.6} strokeDasharray="3 4" />
              <line x1={2} y1={54} x2={118} y2={54} stroke="currentColor" strokeOpacity={0.3} />
              {p >= 0 && p <= 1 && <circle cx={60 + Math.cos(a) * 50} cy={54 - Math.sin(a) * 44} r={6} fill="#FFD25A" style={{ filter: "drop-shadow(0 0 5px #FFC93C)" }} />}
            </svg>
            <div className={c("desk-sun-times")}>
              <span>↑ {fmtClock(sun.sunrise, hour12)}</span>
              <span>↓ {fmtClock(sun.sunset, hour12)}</span>
            </div>
            <div className={c("desk-sub")}>{dayLength(sun)}</div>
          </div>
          <div className={c("desk-moon")}>
            <MoonDisc phase={moon} size={44} />
            <div>
              <div style={{ fontWeight: 700 }}>{moon.name}</div>
              <div className={c("desk-sub")}>{Math.round(moon.illumination * 100)}% lit</div>
            </div>
          </div>
        </div>
      );
    }
    case "temp_graph":
      if (!weather) return <div className={c("desk-text")} style={{ fontSize: "0.7em" }}>Save a location to see the hourly graph.</div>;
      return (
        <div className={c("desk-graph")}>
          <TempGraph hours={weather.hourly.slice(0, 12)} fmt={fmt} hour12={hour12} accent={widget.accent_color ? accent : undefined} />
        </div>
      );
    case "current":
    case "forecast":
    case "storm":
    case "radar": {
      const isRadar = widget.kind === "radar";
      return (
        <div className={c("desk-weather", isRadar && "desk-weather-map")} style={isRadar ? {} : { zoom: Math.max(0.4, widget.font_size / WEATHER_BASE_FONT) }}>
          {!loc && (
            <div className={c("widget-placeholder text-muted")} style={{ padding: isRadar ? 14 : 0 }}>
              Save a location in the Locations tab to see live weather here.
            </div>
          )}
          {loc && weather && widget.kind === "current" && <CurrentCard location={loc} weather={weather} />}
          {loc && weather && widget.kind === "forecast" && <ForecastCard location={loc} weather={weather} style={widget.fc_style ?? "days"} />}
          {loc && widget.kind === "storm" && <StormCard location={loc} />}
          {loc && isRadar && <RadarDeskWidget location={loc} zoom={widget.radar_zoom ?? 6} animate={widget.radar_animate ?? true} />}
        </div>
      );
    }
    default:
      return <div className={c("desk-text")}>Unknown widget</div>;
  }
}

// ------------------------------------------------------------------ weather cards (widgets/CurrentWidget.tsx, ForecastWidget.tsx)

type W = ReturnType<typeof sampleWeather>;

export function CurrentCard({ location, weather }: { location: SavedLocation; weather: W }) {
  const { settings } = useApp();
  const cur = weather.current;
  const stats: string[] = [];
  if (settings.cur_show_humidity) stats.push(`${cur.humidity_pct}% humidity`);
  if (settings.cur_show_wind) stats.push(`${cur.wind_direction} ${fmtWind(cur.wind_speed_mph, settings.wind_unit)}`);
  return (
    <>
      {!settings.widget_seamless && (
        <div className={c("pill")} style={{ alignSelf: "flex-start" }}>
          <span className={c("pill-dot dot-success")} />
          <span className={c("pill-label")}>{location.label}</span>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 10, marginTop: 8 }}>
        <WxIcon kind={wxKind(cur.short_forecast)} day={weather.hourly[0]?.is_daytime ?? true} size={46} />
        <span style={{ fontSize: 38, fontWeight: 700 }}>{fmtTemp(cur.temperature_f, settings.temp_unit)}</span>
        {settings.cur_show_feels_like && (
          <span className={c("text-muted")} style={{ fontSize: 11 }}>
            Feels {fmtTemp(cur.feels_like_f, settings.temp_unit)}
          </span>
        )}
      </div>
      <div className={c("text-secondary")} style={{ fontSize: 12, marginTop: 2 }}>
        {cur.short_forecast}
      </div>
      {stats.length > 0 && (
        <div className={c("widget-stats text-muted")} style={{ fontSize: 10.5, marginTop: 6 }}>
          {stats.map((st) => (
            <span key={st}>{st}</span>
          ))}
        </div>
      )}
    </>
  );
}

export function ForecastCard({ location, weather, style }: { location: SavedLocation; weather: W; style: "list" | "days" | "graph" }) {
  const app = useApp();
  const { settings } = app;
  const fmt = (f: number) => fmtTemp(f, settings.temp_unit);
  const hour12 = settings.time_format !== "local24";
  const hourly = settings.fc_mode === "hourly";
  const periods = (hourly ? weather.hourly : weather.forecast).slice(0, app.pro ? settings.fc_periods : Math.min(settings.fc_periods, 3));
  return (
    <>
      {!settings.widget_seamless && (
        <div className={c("pill")} style={{ alignSelf: "flex-start" }}>
          <span className={c("pill-dot dot-success")} />
          <span className={c("pill-label")}>
            {location.label} · {style === "graph" ? "Next hours" : style === "days" ? "This week" : hourly ? "Hourly" : "Forecast"}
          </span>
        </div>
      )}
      {style === "graph" && (
        <div style={{ marginTop: 6, minHeight: 0 }}>
          <TempGraph hours={weather.hourly.slice(0, Math.min(12, Math.max(6, settings.fc_periods * 2)))} fmt={fmt} hour12={hour12} precip={settings.fc_show_precip} icons={settings.fc_show_icons} />
        </div>
      )}
      {style === "days" && (
        <div style={{ marginTop: 6, overflowY: "auto", minHeight: 0 }}>
          <DailyRows days={toDays(weather.forecast).slice(0, Math.min(7, Math.max(5, settings.fc_periods)))} fmt={fmt} compact />
        </div>
      )}
      {style === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8, overflowY: "auto", minHeight: 0 }}>
          {periods.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              {settings.fc_show_icons && <WxIcon kind={wxKind(p.short_forecast)} day={p.is_daytime} size={24} />}
              <span className={c("text-secondary")} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {hourly ? new Date(p.start).toLocaleTimeString([], { hour: "numeric", hour12 }) : p.name}
              </span>
              {settings.fc_show_precip && p.precip_chance_pct !== null && p.precip_chance_pct > 0 && <span style={{ fontSize: 10, color: "#6cc4ff" }}>{Math.round(p.precip_chance_pct)}%</span>}
              <span style={{ fontWeight: 600, minWidth: 34, textAlign: "right" }}>{fmt(p.temperature_f)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
