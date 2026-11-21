"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Chip, LockIcon, Locked, Segmented, c, fmtClockTime, formatAge, useApp, useClock, type SavedLocation, type Settings } from "./ui";
import {
  ALERTS,
  BASEMAPS,
  BORDERS,
  CITIES,
  RADAR_PALETTES,
  RADAR_TOWERS,
  ROADS,
  alertsNear,
  describeNear,
  distanceMiles,
  nowcastFor,
  paintRadar,
  projector,
  scanTimes,
  strikesNear,
  useStrikes,
  type Strike,
  type View,
} from "./radarsim";

// The Radar tab (RadarView.tsx) and the map engine behind it (RadarCanvas.tsx),
// rebuilt on a drawn map with a pretend storm. Pan by dragging, zoom with the
// buttons, replay the last hour, drop pins.

export const RANGE_OPTIONS = [
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
  { value: 50, label: "50 mi" },
  { value: 100, label: "100 mi" },
  { value: 0, label: "Any" },
];
export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 4, 8];

const BOLT = <path d="M14 1 3 18h7l-2 13L21 12h-7z" />;

type Pin = Pick<SavedLocation, "id" | "label" | "lat" | "lon" | "is_address">;

interface MapProps {
  view: View;
  onView?: (v: View) => void;
  /** Scan time shown (ms). */
  scan: number;
  settings: Settings;
  pins: Pin[];
  /** Where the range ring / strike counter are measured from. */
  origin: { lat: number; lon: number };
  rangeMiles: number;
  lightning: boolean;
  /** Map controls (zoom, recenter) in the corner. */
  controls?: boolean;
  onRecenter?: () => void;
  extraControls?: ReactNode;
  dropMode?: boolean;
  onDropPin?: (lon: number, lat: number) => void;
  /** Map basemap/radar transparency (pop-out widget setting). */
  mapOpacity?: number;
  children?: ReactNode;
}

/** The map: basemap lines + radar + alerts + lightning on one canvas, pins and towers as markers. */
export function RadarMap({ view, onView, scan, settings, pins, origin, rangeMiles, lightning, controls = true, onRecenter, extraControls, dropMode, onDropPin, mapOpacity = 1, children }: MapProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [flash, setFlash] = useState(0);
  const strikes = useStrikes(lightning);
  const live = useRef({ strikes, settings, rangeMiles, origin, lightning });
  useEffect(() => {
    live.current = { strikes, settings, rangeMiles, origin, lightning };
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const radarImg = useMemo(
    () => (w > 0 && h > 0 ? paintRadar(view, w, h, scan, settings.radar_palette, settings.smoothing === "sharp" ? 6 : 4) : null),
    [view, w, h, scan, settings.radar_palette, settings.smoothing],
  );

  // Draw loop: the basemap and radar only change with the view/scan, strikes animate.
  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !w || !h) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const p = projector(view, w, h);
    let raf = 0;
    let last = 0;
    let lastFlash = Date.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 66) return;
      last = now;
      const { strikes: list, settings: s, rangeMiles: range, origin: o, lightning: ltn } = live.current;
      const bm = BASEMAPS[s.basemap];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = bm.bg;
      ctx.fillRect(0, 0, w, h);
      // Lakes, a hint of terrain.
      ctx.fillStyle = bm.water;
      for (const [lon, lat, r] of [[-95.45, 36.5, 0.09], [-96.0, 33.85, 0.12], [-97.0, 34.05, 0.05], [-95.05, 35.5, 0.07]] as const) {
        ctx.beginPath();
        ctx.ellipse(p.x(lon), p.y(lat), r * p.k, r * p.k * 0.55, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = bm.road;
      ctx.lineWidth = 1.4;
      for (const r of ROADS) {
        ctx.beginPath();
        r.line.forEach(([lon, lat], i) => (i ? ctx.lineTo(p.x(lon), p.y(lat)) : ctx.moveTo(p.x(lon), p.y(lat))));
        ctx.stroke();
      }
      ctx.strokeStyle = bm.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      for (const line of BORDERS) {
        ctx.beginPath();
        line.forEach(([lon, lat], i) => (i ? ctx.lineTo(p.x(lon), p.y(lat)) : ctx.moveTo(p.x(lon), p.y(lat))));
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // City labels.
      ctx.font = "600 10px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      for (const city of CITIES) {
        if (!city.big && view.zoom < 5.5) continue;
        const x = p.x(city.lon);
        const y = p.y(city.lat);
        if (x < -60 || x > w + 60 || y < -20 || y > h + 20) continue;
        const label = city.name.toUpperCase();
        ctx.lineWidth = 3;
        ctx.strokeStyle = bm.halo;
        ctx.strokeText(label, x, y + 3);
        ctx.fillStyle = bm.label;
        ctx.fillText(label, x, y + 3);
      }
      // Radar.
      if (radarImg) {
        ctx.save();
        ctx.globalAlpha = s.radar_opacity;
        ctx.imageSmoothingEnabled = s.smoothing === "smooth";
        const sat = 1 + s.radar_saturation;
        const con = 1 + s.radar_contrast * 0.6;
        if (sat !== 1 || con !== 1) ctx.filter = `saturate(${sat}) contrast(${con})`;
        const cell = Number(radarImg.dataset.cell) || 4;
        ctx.drawImage(radarImg, 0, 0, radarImg.width * cell, radarImg.height * cell);
        ctx.restore();
      }
      // Alert areas.
      if (s.show_alert_polygons) {
        for (const a of ALERTS) {
          if (s.alert_poly_level === "warnings" && a.tier !== "warning") continue;
          ctx.beginPath();
          a.poly.forEach(([lon, lat], i) => (i ? ctx.lineTo(p.x(lon), p.y(lat)) : ctx.moveTo(p.x(lon), p.y(lat))));
          ctx.closePath();
          ctx.fillStyle = a.color + (a.tier === "warning" ? "2e" : "12");
          ctx.fill();
          ctx.strokeStyle = a.color;
          ctx.lineWidth = a.tier === "warning" ? 2.2 : 1.6;
          if (a.tier === "watch") ctx.setLineDash([7, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // Range ring.
      if (ltn && s.lightning_ring && range > 0) {
        const rDeg = range / 69;
        ctx.beginPath();
        ctx.ellipse(p.x(o.lon), p.y(o.lat), rDeg * p.k / Math.cos((o.lat * Math.PI) / 180), rDeg * p.k * 1.22, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 216, 74, 0.7)";
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Lightning.
      if (ltn) {
        const t = Date.now();
        const windowMs = s.lightning_minutes * 60000;
        for (const st of list) {
          const age = t - st.t;
          if (age > windowMs || age < 0) continue;
          const x = p.x(st.lon);
          const y = p.y(st.lat);
          if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
          const f = age / windowMs;
          if (s.lightning_effects && age < 1600) {
            const k = age / 1600;
            ctx.beginPath();
            ctx.arc(x, y, 4 + k * 26, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 245, 200, ${0.8 * (1 - k)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
            g.addColorStop(0, `rgba(255,255,255,${1 - k})`);
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(x - 16, y - 16, 32, 32);
          }
          ctx.globalAlpha = 1 - f * 0.75;
          ctx.fillStyle = f < 0.08 ? "#ffffff" : f < 0.3 ? "#ffe066" : f < 0.6 ? "#ff9f40" : "#ff5a4a";
          ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
          ctx.globalAlpha = 1;
        }
        const newest = list[list.length - 1];
        if (s.lightning_effects && newest && newest.t > lastFlash && range > 0 && distanceMiles(o.lat, o.lon, newest.lat, newest.lon) <= range) setFlash((v) => v + 1);
        if (newest) lastFlash = Math.max(lastFlash, newest.t);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [view, w, h, radarImg]);

  // Drag to pan; a click in drop mode (or a right-click) drops a pin.
  const drag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button === 2) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const scale = r.width / el.clientWidth || 1;
    const sx = e.clientX;
    const sy = e.clientY;
    const start = view;
    let moved = false;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / scale;
      const dy = (ev.clientY - sy) / scale;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (!moved || !onView) return;
      const pr = projector(start, el.clientWidth, el.clientHeight);
      onView({ ...start, lon: pr.lon(el.clientWidth / 2 - dx), lat: pr.lat(el.clientHeight / 2 - dy) });
    };
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      if (!moved && dropMode && onDropPin) {
        const pr = projector(view, el.clientWidth, el.clientHeight);
        onDropPin(pr.lon((ev.clientX - r.left) / scale), pr.lat((ev.clientY - r.top) / scale));
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  const p = w ? projector(view, w, h) : null;
  const pinClass = settings.pin_size === "small" ? "pin-s" : settings.pin_size === "large" ? "pin-l" : "";

  return (
    <div className={c("map-frame")}>
      <div
        ref={box}
        className={c(settings.pin_labels_always && "labels-always")}
        style={{ position: "absolute", inset: 0, overflow: "hidden", cursor: dropMode ? "crosshair" : onView ? "grab" : "default", opacity: mapOpacity, touchAction: "none" }}
        onPointerDown={drag}
        onContextMenu={(e) => {
          if (!onDropPin || !p) return;
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          const scale = r.width / e.currentTarget.clientWidth || 1;
          onDropPin(p.lon((e.clientX - r.left) / scale), p.lat((e.clientY - r.top) / scale));
        }}
      >
        <canvas ref={canvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        {p &&
          settings.show_radar_sites &&
          RADAR_TOWERS.map((t, i) => (
            <div key={t.name} className={c("site-marker", settings.site_ripples && "ripples")} style={{ position: "absolute", left: p.x(t.lon) - 11, top: p.y(t.lat) - 11, ["--sd" as string]: `${i * 300}ms` }} title={`${t.name} radar tower`}>
              <span className={c("site-ripple")} />
              <span className={c("site-dot")} />
            </div>
          ))}
        {p &&
          settings.show_pins &&
          pins.map((pin) =>
            pin.is_address ? (
              <div key={pin.id} className={c("map-pin", pinClass)} style={{ position: "absolute", left: p.x(pin.lon), top: p.y(pin.lat), transform: "translate(-50%, -100%)" }}>
                <span className={c("map-pin-pulse")} />
                <span className={c("map-pin-stem")} />
                <span className={c("map-pin-head")} />
                <span className={c("map-pin-label")}>{pin.label}</span>
              </div>
            ) : (
              <div key={pin.id} className={c("map-dot", pinClass)} style={{ position: "absolute", left: p.x(pin.lon), top: p.y(pin.lat), transform: "translate(-50%, -50%)" }}>
                <span className={c("map-pin-label")}>{pin.label}</span>
              </div>
            ),
          )}
      </div>
      {controls && (
        <div className={c("map-controls")}>
          <button className={c("map-ctrl-btn")} title="Zoom in" onClick={() => onView?.({ ...view, zoom: Math.min(10, view.zoom + 0.5) })}>
            +
          </button>
          <button className={c("map-ctrl-btn")} title="Zoom out" onClick={() => onView?.({ ...view, zoom: Math.max(3.5, view.zoom - 0.5) })}>
            −
          </button>
          <button className={c("map-ctrl-btn")} title="Back to your location" onClick={onRecenter}>
            ◎
          </button>
          {extraControls}
        </div>
      )}
      <div key={flash} className={c("ltn-screen-flash", flash > 0 && "on")} />
      {children}
    </div>
  );
}

/** "1,234 strikes · within 10 mi · last 30 min · latest 12s ago" (lightning.tsx). */
export function LightningBadge({ strikes, minutes, origin, radiusMiles, compact = false }: { strikes: Strike[]; minutes: number; origin: { lat: number; lon: number }; radiusMiles: number; compact?: boolean }) {
  const now = useClock();
  const near = strikesNear(strikes, origin.lat, origin.lon, radiusMiles, minutes);
  return (
    <div className={c("ltn-badge", compact && "ltn-badge-compact")} title="Live lightning. The counter only counts strikes in the range around your pin.">
      <svg className={c("ltn-badge-bolt")} viewBox="0 0 24 32" aria-hidden="true">
        {BOLT}
      </svg>
      <span className={c("ltn-count")}>{near.count.toLocaleString()}</span>
      <span className={c("ltn-label")}>{near.count === 1 ? "strike" : "strikes"}</span>
      <span className={c("ltn-sub")}>
        {radiusMiles > 0 ? `· within ${radiusMiles} mi` : ""}
        {!compact ? ` · last ${minutes} min` : ""}
      </span>
      <span className={c("ltn-sub")}>{near.newest ? `· latest ${formatAge(now.getTime() - near.newest)}` : "· quiet"}</span>
    </div>
  );
}

function RadarLegend({ palette }: { palette: Settings["radar_palette"] }) {
  const shown = (RADAR_PALETTES[palette] ?? RADAR_PALETTES.classic).slice(2);
  return (
    <div className={c("radar-legend")}>
      <div className={c("radar-legend-bar")} style={{ background: `linear-gradient(90deg, ${shown.join(", ")})` }} />
      <div className={c("radar-legend-labels")}>
        <span>Light</span>
        <span>Moderate</span>
        <span>Heavy</span>
        <span>Extreme</span>
      </div>
    </div>
  );
}

function LockedChip({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button type="button" className={c("chip is-locked")} title={`${children} is a Pro feature`} onClick={onClick}>
      <LockIcon size={9} /> {children}
    </button>
  );
}

const BASEMAP_OPTIONS = (["dark", "liberty", "positron", "bright"] as const).map((k) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));

/** Plays the scan loop like useRadarPlayback: steps every 250ms / speed, rests on the newest scan. */
function usePlayback(count: number, speed: number, dwellMs: number, autoplay: boolean) {
  const [index, setIndex] = useState(count - 1);
  const [playing, setPlaying] = useState(autoplay);
  const [prevCount, setPrevCount] = useState(count);
  if (prevCount !== count) {
    setPrevCount(count);
    setIndex(count - 1);
  }
  useEffect(() => {
    if (!playing || count < 2) return;
    const atEnd = index >= count - 1;
    const id = window.setTimeout(() => setIndex((i) => (i >= count - 1 ? 0 : i + 1)), atEnd ? Math.max(250, dwellMs) : Math.round(250 / Math.max(0.1, speed)));
    return () => window.clearTimeout(id);
  }, [playing, index, count, speed, dwellMs]);
  return { index: Math.min(index, count - 1), setIndex, playing: playing && count > 1, setPlaying };
}

export function RadarView({ onSavePin }: { onSavePin: (label: string, lat: number, lon: number) => void }) {
  const app = useApp();
  const { settings, update, locations, openPaywall } = app;
  const primary = locations[0] ?? null;
  const home: View = useMemo(() => ({ lon: primary?.lon ?? -97.5, lat: primary?.lat ?? 35.5, zoom: settings.default_zoom }), [primary?.lon, primary?.lat, settings.default_zoom]);
  const [view, setView] = useState<View>(home);
  const [prevHome, setPrevHome] = useState(home);
  if (prevHome !== home) {
    setPrevHome(home);
    setView(home);
  }
  const range = primary?.range_miles ?? settings.lightning_radius_miles;
  const lightningOn = app.can("lightning") && settings.show_lightning;
  const strikes = useStrikes(lightningOn);
  const frames = useMemo(() => scanTimes(settings.loop_minutes, app.can("radar_replay")), [settings.loop_minutes, app]);
  const { index, setIndex, playing, setPlaying } = usePlayback(frames.length, settings.replay_speed, settings.loop_end_pause_ms, settings.autoplay);
  const isLive = index === frames.length - 1;
  const scan = frames[index];
  const near = useMemo(() => (primary && settings.show_alert_polygons ? alertsNear(primary.lat, primary.lon, range, settings.alert_poly_level) : []), [primary, settings.show_alert_polygons, range, settings.alert_poly_level]);
  const nowcast = primary && app.can("nowcast") && settings.nowcast ? nowcastFor(primary.lat, primary.lon) : null;
  const [dropMode, setDropMode] = useState(false);
  const [pending, setPending] = useState<{ lon: number; lat: number } | null>(null);
  const [pinName, setPinName] = useState("");
  const now = useClock();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropMode(false);
        setPending(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const towerAge = 20 + ((now.getSeconds() * 7) % 40);

  const shownPins: Pin[] = pending ? [...locations, { id: "pending", label: pinName || "New pin", lat: pending.lat, lon: pending.lon, is_address: true }] : locations;
  const savePin = () => {
    if (!pending) return;
    onSavePin(pinName.trim() || `Pin ${pending.lat.toFixed(4)}, ${pending.lon.toFixed(4)}`, pending.lat, pending.lon);
    setPending(null);
  };

  return (
    <div className={c("pane")}>
      <div className={c("toolbar")}>
        <div className={c("pill")}>
          <span className={c("pill-dot dot-success")} />
          <span>LIVE — {app.can("radar_replay") ? `${frames.length} FRAMES` : "LATEST SCAN"} (NOAA · ~2 MIN)</span>
        </div>
        {nowcast && (
          <div className={c("pill")} title="Estimated from how the rain has been moving over the last scans - not a forecast model">
            <span className={c("pill-dot", nowcast.kind === "arriving" ? "dot-warning" : nowcast.kind === "raining" ? "dot-danger" : "dot-success")} />
            <span>
              {nowcast.text.toUpperCase()}
              {nowcast.kind !== "dry" ? ` · MOVING ${nowcast.heading} ${nowcast.mph} MPH` : ""}
            </span>
          </div>
        )}
        {near.length > 0 && (
          <div className={c("pill")} title={near.map(describeNear).join("\n")}>
            <span className={c("pill-dot", near[0].tier === "warning" ? "dot-danger" : "dot-warning")} />
            <span>
              {describeNear(near[0]).toUpperCase()}
              {near.length > 1 ? ` · +${near.length - 1} MORE` : ""}
            </span>
          </div>
        )}
        {app.can("tower_radar") && settings.live_site && view.zoom >= 6 && (
          <div className={c("pill")} title="Newest sweep straight from the nearest radar tower, newer than the national map">
            <span className={c("pill-dot dot-success")} />
            <span>{settings.live_site_hd ? "HD TOWER" : "LIVE TOWER"} — TWIN LAKES · {towerAge}s ago</span>
          </div>
        )}
      </div>

      <div className={c("toolbar toolbar-layers")}>
        <span className={c("toolbar-label")}>Layers</span>
        <Chip on={settings.show_alert_polygons} onClick={() => update({ show_alert_polygons: !settings.show_alert_polygons })}>
          Alerts
        </Chip>
        {app.can("lightning") ? (
          <Chip on={settings.show_lightning} onClick={() => update({ show_lightning: !settings.show_lightning })}>
            Lightning
          </Chip>
        ) : (
          <LockedChip onClick={() => openPaywall("lightning")}>Lightning</LockedChip>
        )}
        <Chip on={settings.show_pins} onClick={() => update({ show_pins: !settings.show_pins })}>
          Pins
        </Chip>
        <Chip on={settings.show_radar_sites} onClick={() => update({ show_radar_sites: !settings.show_radar_sites })}>
          Radar towers
        </Chip>
        {app.can("tower_radar") ? (
          <Chip on={settings.live_site} onClick={() => update({ live_site: !settings.live_site })} title="Show the nearest tower's own sharper, seconds-old radar when zoomed in close to it">
            Tower radar
          </Chip>
        ) : (
          <LockedChip onClick={() => openPaywall("tower_radar")}>Tower radar</LockedChip>
        )}
      </div>

      {!app.pro && (
        <div className={c("radar-upsell")}>
          <svg viewBox="0 0 24 32" width="11" height="14" aria-hidden="true" fill="currentColor">
            {BOLT}
          </svg>
          <span>Live lightning + 2-hour replay</span>
          <button type="button" className={c("radar-upsell-btn")} onClick={() => openPaywall("lightning")}>
            Upgrade →
          </button>
        </div>
      )}

      <div className={c("toolbar toolbar-view")}>
        {lightningOn && (
          <div className={c("toolbar-group")}>
            <span className={c("toolbar-label")}>Range</span>
            <Segmented
              value={range}
              options={RANGE_OPTIONS}
              onChange={(miles) => {
                if (primary && primary.range_miles != null) app.setLocations(locations.map((l, i) => (i === 0 ? { ...l, range_miles: miles } : l)));
                else update({ lightning_radius_miles: miles });
              }}
            />
          </div>
        )}
        <div className={c("toolbar-group")}>
          <span className={c("toolbar-label")}>Map</span>
          <Segmented value={settings.basemap} options={BASEMAP_OPTIONS} onChange={(basemap) => update({ basemap })} />
        </div>
        <div className={c("toolbar-group")}>
          <span className={c("toolbar-label")}>Opacity</span>
          <input type="range" className={c("range")} style={{ width: 110 }} min={0.2} max={1} step={0.05} value={settings.radar_opacity} onChange={(e) => update({ radar_opacity: Number(e.target.value) })} />
        </div>
      </div>

      {locations.length > 1 && (
        <div className={c("toolbar")}>
          <span className={c("toolbar-label")}>Go to</span>
          {locations.map((l) => (
            <button key={l.id} type="button" className={c("chip")} onClick={() => setView({ ...view, lon: l.lon, lat: l.lat })}>
              {l.label}
            </button>
          ))}
        </div>
      )}

      <section className={c("card")} style={{ flex: 1, minHeight: 0, padding: 0, overflow: "hidden", position: "relative" }}>
        <RadarMap
          view={view}
          onView={setView}
          scan={scan}
          settings={settings}
          pins={shownPins}
          origin={{ lat: primary?.lat ?? view.lat, lon: primary?.lon ?? view.lon }}
          rangeMiles={range}
          lightning={lightningOn}
          onRecenter={() => setView(home)}
          dropMode={dropMode}
          onDropPin={(lon, lat) => {
            setPending({ lon, lat });
            setPinName(`Pin ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            setDropMode(false);
          }}
          extraControls={
            <button
              className={c("map-ctrl-btn", dropMode && "active")}
              title="Drop a pin: click, then click the map (or just right-click anywhere)"
              onClick={() => {
                setPending(null);
                setDropMode((v) => !v);
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
            </button>
          }
        >
          {!app.can("lightning") && (
            <button type="button" className={c("ltn-badge ltn-badge-locked")} onClick={() => openPaywall("lightning")}>
              <svg className={c("ltn-badge-bolt")} viewBox="0 0 24 32" aria-hidden="true">
                {BOLT}
              </svg>
              <span className={c("ltn-label")}>Lightning</span>
              <span className={c("ltn-sub")}>· Pro</span>
              <LockIcon size={10} />
            </button>
          )}
          {lightningOn && primary && <LightningBadge strikes={strikes} minutes={settings.lightning_minutes} origin={primary} radiusMiles={range} />}
          {dropMode && (
            <div className={c("map-badge")} style={{ left: "50%", bottom: "auto", top: 10, transform: "translateX(-50%)" }}>
              Click the map to drop a pin · Esc to cancel
            </div>
          )}
          {pending && (
            <div className={c("pin-dialog")}>
              <div className={c("section-title text-muted")} style={{ marginBottom: 6 }}>
                SAVE PIN
              </div>
              <input className={c("text-input")} value={pinName} onChange={(e) => setPinName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && savePin()} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className={c("btn btn-primary btn-small")} onClick={savePin}>
                  SAVE PIN
                </button>
                <button className={c("btn btn-secondary btn-small")} onClick={() => setPending(null)}>
                  CANCEL
                </button>
              </div>
            </div>
          )}
          {settings.radar_legend && <RadarLegend palette={settings.radar_palette} />}
        </RadarMap>
      </section>

      <section className={c("card")} style={{ flexShrink: 0 }}>
        <div className={c("section-title text-muted")}>RADAR FRAME</div>
        <Locked feature="radar_replay" message="Replay is a Pro feature - loop and scrub the last 2 hours" inline>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className={c("btn btn-secondary")} style={{ flexShrink: 0 }} onClick={() => setPlaying(!playing)}>
              {playing ? "PAUSE" : "PLAY"}
            </button>
            {isLive ? (
              <div className={c("pill")} style={{ flexShrink: 0 }}>
                <span className={c("pill-dot dot-success")} />
                <span>LIVE</span>
              </div>
            ) : (
              <button
                className={c("btn btn-primary")}
                style={{ flexShrink: 0 }}
                onClick={() => {
                  setPlaying(false);
                  setIndex(frames.length - 1);
                }}
              >
                GO LIVE
              </button>
            )}
            <input
              type="range"
              min={0}
              max={Math.max(frames.length - 1, 0)}
              value={index}
              onChange={(e) => {
                setPlaying(false);
                setIndex(Number(e.target.value));
              }}
              style={{ width: "100%" }}
            />
          </div>
        </Locked>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          <div className={c("text-secondary")} style={{ fontSize: 11 }}>
            Showing scan: {fmtClockTime(new Date(scan), settings.time_format)} · {formatAge(now.getTime() - scan)}
          </div>
          {app.can("radar_replay") && (
            <div className={c("toolbar-group")} style={{ marginLeft: 0 }}>
              <span className={c("toolbar-label")}>Speed</span>
              <Segmented value={settings.replay_speed} options={REPLAY_SPEEDS.map((v) => ({ value: v, label: `${v}×` }))} onChange={(replay_speed) => update({ replay_speed })} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** The radar desktop widget (RadarWidget.tsx, seamless look, no controls). */
export function RadarDeskWidget({ location, zoom, animate }: { location: SavedLocation; zoom: number; animate: boolean }) {
  const app = useApp();
  const { settings } = app;
  const frames = useMemo(() => scanTimes(30, app.can("radar_replay") && animate), [app, animate]);
  const { index } = usePlayback(frames.length, settings.replay_speed, settings.loop_end_pause_ms, true);
  const range = location.range_miles ?? settings.lightning_radius_miles;
  const lightningOn = app.can("lightning") && settings.show_lightning;
  const strikes = useStrikes(lightningOn);
  const near = settings.show_alert_polygons ? alertsNear(location.lat, location.lon, range, settings.alert_poly_level) : [];
  const nowcast = app.can("nowcast") && settings.nowcast ? nowcastFor(location.lat, location.lon) : null;
  const now = useClock();
  const scan = frames[index];
  const view = useMemo(() => ({ lon: location.lon, lat: location.lat, zoom }), [location.lon, location.lat, zoom]);
  return (
    <>
      <div className={c("widget-drag-strip")} />
      <div className={c("widget-map")}>
        {near.length > 0 && (
          <span className={c("widget-alert-chip widget-alert-float")} style={{ background: near[0].tier === "warning" ? "rgba(255,59,59,0.22)" : "rgba(255,168,0,0.2)" }}>
            ⚠ {near[0].event}
            {near.length > 1 ? ` +${near.length - 1}` : ""}
          </span>
        )}
        <RadarMap view={view} scan={scan} settings={settings} pins={app.locations} origin={location} rangeMiles={range} lightning={lightningOn} controls={false}>
          {lightningOn && (
            <div style={{ position: "absolute", right: 10, bottom: 10 }}>
              <LightningBadge strikes={strikes} minutes={settings.lightning_minutes} origin={location} radiusMiles={range} compact />
            </div>
          )}
          <div className={c("map-badge")}>
            {fmtClockTime(new Date(scan), settings.time_format)} · {formatAge(now.getTime() - scan)}
            {nowcast && <div>{nowcast.text}</div>}
            {near.length > 0 && (
              <div style={{ color: near[0].tier === "warning" ? "var(--danger)" : "var(--warning)" }}>
                ⚠ {describeNear(near[0])}
                {near.length > 1 ? ` +${near.length - 1}` : ""}
              </div>
            )}
          </div>
        </RadarMap>
      </div>
    </>
  );
}

/** The Storm Alert card (StormWidget.tsx). */
export function StormCard({ location }: { location: SavedLocation }) {
  const app = useApp();
  const { settings } = app;
  const range = location.range_miles ?? settings.lightning_radius_miles;
  const near = alertsNear(location.lat, location.lon, range, settings.alert_poly_level);
  const strikes = useStrikes(app.pro);
  const now = useClock();
  const s = strikesNear(strikes, location.lat, location.lon, range, settings.lightning_minutes);
  const nowcast = app.can("nowcast") && settings.nowcast ? nowcastFor(location.lat, location.lon) : null;
  const top = near[0];
  return (
    <>
      {!settings.widget_seamless && (
        <div className={c("pill")} style={{ alignSelf: "flex-start" }}>
          <span className={c("pill-dot", top?.tier === "warning" ? "dot-danger" : top ? "dot-warning" : "dot-success")} />
          <span className={c("pill-label")}>{location.label}</span>
        </div>
      )}
      <div className={c("storm-headline")} style={{ color: top ? top.color : "var(--success)" }}>
        {top ? top.event : "No alerts nearby"}
      </div>
      <div className={c("text-secondary")} style={{ fontSize: 11.5 }}>
        {top
          ? `${top.miles < 0.5 ? "Over your location" : `${Math.round(top.miles)} mi away`}${near.length > 1 ? ` · +${near.length - 1} more: ${near.slice(1, 3).map(describeNear).join(", ")}` : ""}`
          : range > 0
            ? `Nothing active within ${range} mi`
            : "Nothing active in range"}
      </div>
      {!app.pro ? (
        <div className={c("storm-row text-muted")}>
          <svg className={c("storm-bolt")} viewBox="0 0 24 32" aria-hidden="true">
            {BOLT}
          </svg>
          <span>Lightning near you · Pro</span>
        </div>
      ) : (
        <div className={c("storm-row")}>
          <svg className={c("storm-bolt")} viewBox="0 0 24 32" aria-hidden="true">
            {BOLT}
          </svg>
          <span>
            <b>{s.count.toLocaleString()}</b> strike{s.count === 1 ? "" : "s"} within {range > 0 ? `${range} mi` : "the map"}
            <span className={c("text-muted")}>
              {s.count > 0 ? ` · closest ${s.closest < 1 ? "<1" : Math.round(s.closest)} mi · ${formatAge(now.getTime() - s.newest)}` : ` · last ${settings.lightning_minutes} min`}
            </span>
          </span>
        </div>
      )}
      {nowcast && <div className={c("storm-row text-secondary")}>{nowcast.text}</div>}
    </>
  );
}

