"use client";

import { useEffect, useMemo, useState } from "react";
import { useDemo } from "../AppWindow";
import { FEATURES, FREE, PRICE, PRO_NAME, type Feature, type FeatureArt } from "./license";
import { RANGE_OPTIONS, REPLAY_SPEEDS } from "./radar";
import { alertsNear } from "./radarsim";
import { DailyRows, MoonDisc, TempGraph, WxIcon, dayLength, fmtClock, moonPhase, sampleWeather, sunTimes, toDays, wxKind } from "./weather";
import { ColorPicker, LockIcon, Locked, ProChip, Section, Segmented, SettingRow, Slider, Toggle, c, fmtTemp, fmtWind, useApp, type DockItem, type SavedLocation, type Settings, type SizePreset } from "./ui";

// The other tabs: Locations (App.tsx + LocationRow.tsx), Forecast (WeatherView.tsx),
// Widgets (WidgetsPane.tsx), Taskbar & Dock (TaskbarDockPane.tsx), Settings
// (SettingsPane.tsx), License and the upgrade window (license/ui.tsx).

type Setter = <K extends keyof Settings>(key: K) => (value: Settings[K]) => void;
function useSetter(): Setter {
  const { update } = useApp();
  return (key) => (value) => update({ [key]: value } as Partial<Settings>);
}

// ------------------------------------------------------------------ Locations

/** A small offline place list, like the app's own gazetteer of cities and ZIP codes. */
const PLACES: { label: string; lat: number; lon: number; zip?: string }[] = [
  { label: "Oklahoma City, OK", lat: 35.4676, lon: -97.5164, zip: "73102" },
  { label: "Norman, OK", lat: 35.2226, lon: -97.4395, zip: "73069" },
  { label: "Edmond, OK", lat: 35.6528, lon: -97.4781, zip: "73034" },
  { label: "Moore, OK", lat: 35.3395, lon: -97.4867, zip: "73160" },
  { label: "Tulsa, OK", lat: 36.154, lon: -95.9928, zip: "74103" },
  { label: "Stillwater, OK", lat: 36.1156, lon: -97.0584, zip: "74074" },
  { label: "Lawton, OK", lat: 34.6036, lon: -98.3959, zip: "73501" },
  { label: "Wichita, KS", lat: 37.6872, lon: -97.3301, zip: "67202" },
  { label: "Dallas, TX", lat: 32.7767, lon: -96.797, zip: "75201" },
  { label: "Austin, TX", lat: 30.2672, lon: -97.7431, zip: "78701" },
  { label: "Amarillo, TX", lat: 35.222, lon: -101.8313, zip: "79101" },
  { label: "Kansas City, MO", lat: 39.0997, lon: -94.5786, zip: "64106" },
  { label: "Denver, CO", lat: 39.7392, lon: -104.9903, zip: "80202" },
  { label: "Chicago, IL", lat: 41.8781, lon: -87.6298, zip: "60601" },
  { label: "Nashville, TN", lat: 36.1627, lon: -86.7816, zip: "37201" },
  { label: "Atlanta, GA", lat: 33.749, lon: -84.388, zip: "30303" },
  { label: "Miami, FL", lat: 25.7617, lon: -80.1918, zip: "33130" },
  { label: "New York, NY", lat: 40.7128, lon: -74.006, zip: "10007" },
  { label: "Los Angeles, CA", lat: 34.0522, lon: -118.2437, zip: "90012" },
  { label: "Seattle, WA", lat: 47.6062, lon: -122.3321, zip: "98104" },
  { label: "Phoenix, AZ", lat: 33.4484, lon: -112.074, zip: "85003" },
  { label: "Omaha, NE", lat: 41.2565, lon: -95.9345, zip: "68102" },
  { label: "Little Rock, AR", lat: 34.7465, lon: -92.2896, zip: "72201" },
  { label: "Fort Worth, TX", lat: 32.7555, lon: -97.3308, zip: "76102" },
];

const looksLikeStreetAddress = (q: string) => /^\d+\s+\S/.test(q);

interface Match {
  label: string;
  lat: number;
  lon: number;
  isAddress: boolean;
}

function search(q: string): Match[] {
  const t = q.trim().toLowerCase();
  if (looksLikeStreetAddress(t)) {
    const city = PLACES.find((p) => t.includes(p.label.split(",")[0].toLowerCase())) ?? PLACES[0];
    const n = t.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const street = q.trim().split(",")[0].replace(/\b\w/g, (m) => m.toUpperCase());
    return [{ label: `${street}, ${city.label}`, lat: city.lat + ((n % 40) - 20) / 1000, lon: city.lon + ((n % 30) - 15) / 1000, isAddress: true }];
  }
  return PLACES.filter((p) => p.label.toLowerCase().includes(t) || p.zip?.startsWith(t))
    .slice(0, 6)
    .map((p) => ({ label: p.zip && /^\d/.test(t) ? `${p.zip} · ${p.label}` : p.label, lat: p.lat, lon: p.lon, isAddress: false }));
}

const RANGE = [
  { value: "default", label: "Default" },
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "0", label: "Any" },
];
const TRI = [
  { value: "default", label: "Default" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];
const triOf = (v: boolean | null | undefined) => (v == null ? "default" : v ? "on" : "off");
const boolOf = (t: string): boolean | null => (t === "default" ? null : t === "on");

function LocationRow({ loc, isPrimary, globalRange, onChange, onMakePrimary, onRemove }: { loc: SavedLocation; isPrimary: boolean; globalRange: number; onChange: (patch: Partial<SavedLocation>) => void; onMakePrimary: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const customised = loc.range_miles != null || loc.lightning_alerts != null || loc.alerts_notify != null;
  return (
    <div className={c("location-row")}>
      <div className={c("result-item saved-item")} style={{ cursor: "default" }}>
        <span>
          {isPrimary && <span className={c("pin-tag")}>PRIMARY</span>}
          {loc.is_address && <span className={c("pin-tag")}>PIN</span>}
          {loc.label}
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          <button className={c("btn btn-secondary")} style={{ padding: "4px 10px" }} onClick={() => setOpen((o) => !o)}>
            {open ? "HIDE" : customised ? "OPTIONS •" : "OPTIONS"}
          </button>
          {!isPrimary && (
            <button className={c("btn btn-secondary")} style={{ padding: "4px 10px" }} onClick={onMakePrimary}>
              MAKE PRIMARY
            </button>
          )}
          <button className={c("btn btn-secondary")} style={{ padding: "4px 10px" }} onClick={onRemove}>
            REMOVE
          </button>
        </span>
      </div>
      {open && (
        <div className={c("location-options")}>
          <div className={c("location-option")}>
            <span className={c("toolbar-label")}>Range (mi)</span>
            <Segmented value={loc.range_miles == null ? "default" : String(loc.range_miles)} options={RANGE} onChange={(v) => onChange({ range_miles: v === "default" ? null : Number(v) })} />
            <span className={c("text-muted")} style={{ fontSize: 10.5 }}>
              Default is {globalRange > 0 ? `${globalRange} mi` : "Any"}
            </span>
          </div>
          <div className={c("location-option")}>
            <span className={c("toolbar-label")}>Lightning alerts</span>
            <Segmented value={triOf(loc.lightning_alerts)} options={TRI} onChange={(v) => onChange({ lightning_alerts: boolOf(v) })} />
          </div>
          <div className={c("location-option")}>
            <span className={c("toolbar-label")}>Weather alerts</span>
            <Segmented value={triOf(loc.alerts_notify)} options={TRI} onChange={(v) => onChange({ alerts_notify: boolOf(v) })} />
          </div>
        </div>
      )}
    </div>
  );
}

export function LocationsPane({ onAdd }: { onAdd: (label: string, lat: number, lon: number, isAddress: boolean) => boolean }) {
  const app = useApp();
  const { notify } = useDemo();
  const { locations, setLocations, settings } = app;
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState<{ q: string; results: Match[] } | null>(null);
  const [locating, setLocating] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const id = window.setTimeout(() => setSearched({ q: trimmed, results: search(trimmed) }), looksLikeStreetAddress(trimmed) ? 700 : 250);
    return () => window.clearTimeout(id);
  }, [trimmed]);

  const fresh = searched && searched.q === trimmed ? searched : null;
  const results = trimmed.length >= 2 ? (fresh?.results ?? []) : [];
  const searching = trimmed.length >= 2 && !fresh;

  const add = (m: Match) => {
    if (onAdd(m.label, m.lat, m.lon, m.isAddress)) {
      setQuery("");
      setSearched(null);
    }
  };

  return (
    <div className={c("pane")}>
      {!app.pro && locations.length >= app.limit("locations") && (
        <div className={c("card tier-banner")}>
          <ProChip feature="locations" />
          <span>The free version keeps 1 saved location. Pro saves as many as you like.</span>
          <button className={c("btn btn-buy btn-small")} onClick={() => app.openPaywall("locations")}>
            Unlock
          </button>
        </div>
      )}
      <div className={c("card")}>
        <div className={c("section-title text-muted")}>SEARCH</div>
        <input
          className={c("text-input")}
          type="text"
          placeholder="City, ZIP, or street address (e.g. 400 W 6th St, Austin, TX)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && trimmed.length >= 2 && setSearched({ q: trimmed, results: search(trimmed) })}
        />
        {searching && (
          <div className={c("text-muted")} style={{ fontSize: 11, marginTop: 8 }}>
            Searching...
          </div>
        )}
        {!searching && fresh && results.length === 0 && (
          <div className={c("text-muted")} style={{ fontSize: 11, marginTop: 8 }}>
            No matches found.
          </div>
        )}
        {results.length > 0 && (
          <div className={c("result-list")}>
            {results.map((r, i) => (
              <button key={`${r.label}-${i}`} className={c("result-item")} onClick={() => add(r)}>
                <span>
                  {r.isAddress && <span className={c("pin-tag")}>PIN</span>}
                  {r.label}
                </span>
                <span className={c("text-muted")} style={{ fontSize: 10.5 }}>
                  {r.lat.toFixed(3)}, {r.lon.toFixed(3)}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          className={c("btn btn-secondary")}
          style={{ marginTop: 12 }}
          disabled={locating}
          onClick={() => {
            setLocating(true);
            window.setTimeout(() => {
              setLocating(false);
              notify("In the app, this asks Windows where you are and saves it.");
            }, 700);
          }}
        >
          {locating ? "LOCATING..." : "USE MY LOCATION"}
        </button>
      </div>

      <div className={c("card")}>
        <div className={c("section-title text-muted")}>SAVED LOCATIONS</div>
        {locations.length === 0 ? (
          <div className={c("text-muted")} style={{ fontSize: 12 }}>
            No locations saved yet - search above to add one.
          </div>
        ) : (
          <div className={c("result-list")}>
            {locations.map((loc, i) => (
              <LocationRow
                key={loc.id}
                loc={loc}
                isPrimary={i === 0}
                globalRange={settings.lightning_radius_miles}
                onChange={(patch) => setLocations(locations.map((l) => (l.id === loc.id ? { ...l, ...patch } : l)))}
                onMakePrimary={() => setLocations([loc, ...locations.filter((l) => l.id !== loc.id)])}
                onRemove={() => setLocations(locations.filter((l) => l.id !== loc.id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Forecast

function heroTone(short: string, day: boolean): string {
  const k = wxKind(short);
  if (!day) return "linear-gradient(135deg, #0b1230 0%, #1a1440 60%, #070a18 100%)";
  if (k === "thunder") return "linear-gradient(135deg, #1b1f3a 0%, #3a2a5a 55%, #121426 100%)";
  if (k === "rain" || k === "showers" || k === "sleet") return "linear-gradient(135deg, #0f2440 0%, #1d3c66 55%, #0b1626 100%)";
  if (k === "cloudy" || k === "fog") return "linear-gradient(135deg, #222a38 0%, #3a4558 55%, #151a24 100%)";
  return "linear-gradient(135deg, #0e5fa8 0%, #2b8fd6 50%, #f0a64a 130%)";
}

const DIRS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function Compass({ dir }: { dir: string }) {
  const i = DIRS.indexOf(dir.toUpperCase());
  const deg = (i < 0 ? 0 : i * 22.5) + 180;
  return (
    <svg width={58} height={58} viewBox="0 0 58 58">
      <circle cx={29} cy={29} r={26} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
      {["N", "E", "S", "W"].map((l, k) => (
        <text key={l} x={29 + Math.sin((k * Math.PI) / 2) * 19} y={29 - Math.cos((k * Math.PI) / 2) * 19 + 3.5} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.5)">
          {l}
        </text>
      ))}
      <g transform={`rotate(${deg} 29 29)`}>
        <path d="M29 12 L34 30 L29 27 L24 30 Z" fill="#5CB8FF" />
      </g>
    </svg>
  );
}

function SunArc({ sunrise, sunset }: { sunrise: Date | null; sunset: Date | null }) {
  const [now] = useState(() => Date.now());
  const p = sunrise && sunset ? (now - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime()) : 0.5;
  const a = Math.PI * (1 - Math.min(1, Math.max(0, p)));
  return (
    <svg width={120} height={58} viewBox="0 0 120 58">
      <path d="M12 52 A 48 40 0 0 1 108 52" fill="none" stroke="rgba(255,210,90,0.35)" strokeWidth={2} strokeDasharray="4 4" />
      <line x1={4} y1={52} x2={116} y2={52} stroke="rgba(255,255,255,0.2)" />
      {p >= 0 && p <= 1 && <circle cx={60 + Math.cos(a) * 48} cy={52 - Math.sin(a) * 40} r={6} fill="#FFD25A" style={{ filter: "drop-shadow(0 0 6px #FFC93C)" }} />}
    </svg>
  );
}

export function ForecastPane() {
  const app = useApp();
  const { settings } = app;
  const location = app.locations[0] ?? null;
  const [now] = useState(() => new Date());
  const weather = useMemo(() => (location ? sampleWeather(location.lat, location.lon, now) : null), [location, now]);
  const alerts = location ? alertsNear(location.lat, location.lon, 25, "all") : [];
  if (!location || !weather) {
    return (
      <div className={c("pane")}>
        <div className={c("card")}>
          <div className={c("text-muted")} style={{ fontSize: 12 }}>
            Save a location on the Locations tab to see the forecast.
          </div>
        </div>
      </div>
    );
  }
  const hour12 = settings.time_format !== "local24";
  const fmt = (f: number) => fmtTemp(f, settings.temp_unit);
  const days = toDays(weather.forecast);
  const cur = weather.current;
  const isDay = weather.hourly[0]?.is_daytime ?? true;
  const today = days[0];
  const hours = weather.hourly.slice(0, app.pro ? 24 : FREE.hourlyPeriods);
  const dayRows = days.slice(0, app.pro ? 7 : Math.ceil(FREE.forecastPeriods / 2) + 1);
  const rainNext12 = Math.max(0, ...weather.hourly.slice(0, 12).map((h) => h.precip_chance_pct ?? 0));
  const sun = sunTimes(now, location.lat, location.lon);
  const moon = moonPhase(now);
  return (
    <div className={c("pane forecast-pane")} style={{ overflowY: "auto" }}>
      <div className={c("pill")} style={{ alignSelf: "flex-start" }}>
        <span className={c("pill-dot dot-success")} />
        <span className={c("pill-label")}>LIVE · {location.label}</span>
      </div>

      {alerts.length > 0 && (
        <div className={c("card fc-alerts")}>
          <div className={c("section-title text-muted")}>ACTIVE ALERTS</div>
          <div className={c("result-list")}>
            {alerts.map((a) => (
              <div key={a.event} className={c("result-item saved-item")} style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={c("pill-dot", a.tier === "warning" ? "dot-danger" : "dot-warning")} />
                  <span style={{ fontWeight: 700 }}>{a.event}</span>
                </div>
                <div className={c("text-muted")} style={{ fontSize: 10.5 }}>
                  {a.tier === "warning" ? "Canadian, Kingfisher and Oklahoma counties" : "Central and western Oklahoma"}
                </div>
                <div className={c("text-secondary")} style={{ fontSize: 11 }}>
                  {a.event} in effect until {a.until}. {a.tier === "warning" ? "60 mph wind gusts and quarter size hail possible." : "Conditions are favorable for tornadoes in and near the watch area."}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={c("fc-hero")} style={{ background: heroTone(cur.short_forecast, isDay) }}>
        <div className={c("fc-hero-main")}>
          <WxIcon kind={wxKind(cur.short_forecast)} day={isDay} size={92} />
          <div>
            <div className={c("fc-hero-temp")}>{fmt(cur.temperature_f)}</div>
            <div className={c("fc-hero-cond")}>{cur.short_forecast}</div>
            {today && (
              <div className={c("fc-hero-hilo")}>
                {today.hi !== null && `H ${fmt(today.hi)}`}
                {today.hi !== null && today.lo !== null && "  ·  "}
                {today.lo !== null && `L ${fmt(today.lo)}`}
              </div>
            )}
          </div>
        </div>
        <div className={c("fc-hero-chips")}>
          <div className={c("fc-chip")}>
            <span>Feels like</span>
            <b>{fmt(cur.feels_like_f)}</b>
          </div>
          <div className={c("fc-chip")}>
            <span>Humidity</span>
            <b>{cur.humidity_pct}%</b>
          </div>
          <div className={c("fc-chip")}>
            <span>Wind</span>
            <b>
              {cur.wind_direction} {fmtWind(cur.wind_speed_mph, settings.wind_unit)}
            </b>
          </div>
          <div className={c("fc-chip")}>
            <span>Rain, next 12h</span>
            <b>{Math.round(rainNext12)}%</b>
          </div>
        </div>
        <div className={c("fc-hero-foot")}>{cur.station_name}</div>
      </div>

      <div className={c("card")}>
        <div className={c("section-title text-muted")}>NEXT {hours.length} HOURS</div>
        <div className={c("fc-graph-scroll")}>
          <div style={{ minWidth: hours.length * 46 }}>
            <TempGraph hours={hours} fmt={fmt} hour12={hour12} />
          </div>
        </div>
      </div>

      <div className={c("card")}>
        <div className={c("section-title text-muted")}>{app.pro ? "7-DAY FORECAST" : "FORECAST"}</div>
        <DailyRows days={dayRows} fmt={fmt} />
        {!app.pro && (
          <div style={{ marginTop: 8 }}>
            <Locked feature="full_forecast" inline message="The full 7-day forecast and 24 hours of hourly are Pro">
              <div className={c("result-list")}>
                {["Thursday", "Friday", "Saturday"].map((d) => (
                  <div key={d} className={c("result-item saved-item")}>
                    <span>{d}</span>
                    <span>--°</span>
                  </div>
                ))}
              </div>
            </Locked>
          </div>
        )}
      </div>

      <div className={c("fc-tiles")}>
        <div className={c("fc-tile")}>
          <div className={c("fc-tile-label")}>Sunrise · Sunset</div>
          <div className={c("fc-sun-arc")}>
            <SunArc sunrise={sun.sunrise} sunset={sun.sunset} />
          </div>
          <div className={c("fc-tile-value")}>
            {fmtClock(sun.sunrise, hour12)} · {fmtClock(sun.sunset, hour12)}
          </div>
          <div className={c("fc-tile-sub")}>{dayLength(sun)}</div>
        </div>
        <div className={c("fc-tile")}>
          <div className={c("fc-tile-label")}>Moon</div>
          <MoonDisc phase={moon} size={58} />
          <div className={c("fc-tile-value")}>{moon.name}</div>
          <div className={c("fc-tile-sub")}>{Math.round(moon.illumination * 100)}% lit</div>
        </div>
        <div className={c("fc-tile")}>
          <div className={c("fc-tile-label")}>Wind</div>
          <Compass dir={cur.wind_direction} />
          <div className={c("fc-tile-value")}>{fmtWind(cur.wind_speed_mph, settings.wind_unit)}</div>
          <div className={c("fc-tile-sub")}>from the {cur.wind_direction}</div>
        </div>
        <div className={c("fc-tile")}>
          <div className={c("fc-tile-label")}>Humidity</div>
          <div className={c("fc-gauge")}>
            <span style={{ height: `${cur.humidity_pct}%` }} />
          </div>
          <div className={c("fc-tile-value")}>{cur.humidity_pct}%</div>
          <div className={c("fc-tile-sub")}>{cur.humidity_pct > 70 ? "Muggy" : cur.humidity_pct < 30 ? "Dry" : "Comfortable"}</div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Widgets (pop-out windows)

type WidgetKind = "current" | "forecast" | "radar" | "storm";
type Placement = "floating" | "desktop" | "behind_icons";
const KIND_LABELS: Record<WidgetKind, string> = { current: "Current Conditions", forecast: "Forecast", radar: "Radar", storm: "Storm Alert" };
const SIZE_OPTIONS: { value: SizePreset; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xl", label: "X-Large" },
];
const PLACEMENT_OPTIONS: { value: Placement; label: string }[] = [
  { value: "desktop", label: "On desktop" },
  { value: "floating", label: "Floating" },
  { value: "behind_icons", label: "Behind icons" },
];
const PLACEMENT_HINTS: Record<Placement, string> = {
  floating: "A normal window that stays on top of everything.",
  desktop: "Sits on the desktop underneath your other windows and stays fully clickable - pan the radar, use its buttons.",
  behind_icons: "Experimental: parked behind the desktop icons like a live wallpaper. Glance-only - it can't take clicks there.",
};
const pct = (v: number) => `${Math.round(v * 100)}%`;

export function WidgetsPane() {
  const app = useApp();
  const { notify } = useDemo();
  const { settings, locations } = app;
  const set = useSetter();
  const [kind, setKind] = useState<WidgetKind>("current");
  const [open, setOpen] = useState<Record<WidgetKind, boolean>>({ current: false, forecast: false, radar: false, storm: false });
  const [placement, setPlacement] = useState<Record<WidgetKind, Placement>>({ current: "desktop", forecast: "desktop", radar: "desktop", storm: "desktop" });
  const [error, setError] = useState<string | null>(null);
  const popoutAllowed = (k: WidgetKind) => app.pro || !FREE.lockedPopouts.includes(k);
  const isOpen = open[kind];
  const current = placement[kind];
  const sizeKey = `size_${kind}` as const;
  const locationKey = `widget_location_${kind}` as const;

  const spawn = () => {
    const count = Object.values(open).filter(Boolean).length;
    if (!app.pro && count >= FREE.popouts) {
      app.openPaywall("popouts");
      setError("Pro: the free version opens 1 pop-out widget at a time.");
      return;
    }
    setError(null);
    setOpen((o) => ({ ...o, [kind]: true }));
    notify("In the app, this opens the widget as its own window on your desktop.");
  };

  return (
    <div className={c("pane scroll")}>
      <Section title="WIDGET TYPE">
        {!app.pro && (
          <div className={c("tier-note")}>
            <ProChip feature="popouts" />
            <span>Free: {FREE.popouts} pop-out widget at a time; the live radar widget is Pro.</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.keys(KIND_LABELS) as WidgetKind[]).map((k) => (
            <button key={k} className={c(k === kind ? "btn btn-primary" : "btn btn-secondary", !popoutAllowed(k) && "is-locked")} onClick={() => (popoutAllowed(k) ? setKind(k) : app.openPaywall("popouts"))}>
              {!popoutAllowed(k) && <LockIcon size={9} />} {KIND_LABELS[k].toUpperCase()}
              {open[k] && " •"}
            </button>
          ))}
        </div>
      </Section>

      <Section title={`${KIND_LABELS[kind].toUpperCase()} WIDGET`}>
        <div className={c("pill")} style={{ marginBottom: 12 }}>
          <span className={c("pill-dot", !isOpen ? "dot-muted" : current === "behind_icons" ? "dot-warning" : "dot-success")} />
          <span>{!isOpen ? "NOT OPEN" : current === "behind_icons" ? "BEHIND ICONS (EXPERIMENTAL)" : current === "desktop" ? "ON DESKTOP" : "FLOATING"}</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className={c("btn btn-primary")} onClick={spawn} disabled={isOpen}>
            OPEN WIDGET
          </button>
          <button
            className={c("btn btn-secondary")}
            disabled={!isOpen}
            onClick={() => {
              setOpen((o) => ({ ...o, [kind]: false }));
              setPlacement((p) => ({ ...p, [kind]: "desktop" }));
            }}
          >
            CLOSE WIDGET
          </button>
        </div>
        {error && (
          <div className={c("text-danger")} style={{ fontSize: 11, marginTop: 10 }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <SettingRow label="Placement" hint={PLACEMENT_HINTS[current]}>
            <Segmented
              value={current}
              options={PLACEMENT_OPTIONS}
              onChange={(next) => {
                if (!isOpen) return setError("Open the widget first, then choose where it sits.");
                setError(null);
                setPlacement((p) => ({ ...p, [kind]: next }));
              }}
            />
          </SettingRow>
          <SettingRow label="Size" hint="Applies to the open widget immediately.">
            <Segmented value={settings[sizeKey]} options={SIZE_OPTIONS} onChange={(v) => app.update({ [sizeKey]: v } as Partial<Settings>)} />
          </SettingRow>
          <SettingRow label="Location" hint="Which saved location this widget shows.">
            <select className={c("select")} value={settings[locationKey]} onChange={(e) => app.update({ [locationKey]: e.target.value } as Partial<Settings>)}>
              <option value="">First saved location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </SettingRow>
          {kind === "current" && (
            <>
              <SettingRow label="Show feels-like temperature">
                <Toggle checked={settings.cur_show_feels_like} onChange={set("cur_show_feels_like")} label="Feels like" />
              </SettingRow>
              <SettingRow label="Show humidity">
                <Toggle checked={settings.cur_show_humidity} onChange={set("cur_show_humidity")} label="Humidity" />
              </SettingRow>
              <SettingRow label="Show wind">
                <Toggle checked={settings.cur_show_wind} onChange={set("cur_show_wind")} label="Wind" />
              </SettingRow>
            </>
          )}
          {kind === "forecast" && (
            <>
              <SettingRow label="Style" hint="Daily bars shows the week's highs and lows; Graph shows the next hours as a temperature curve.">
                <Segmented
                  value={settings.fc_style}
                  onChange={set("fc_style")}
                  options={[
                    { value: "days", label: "Daily bars" },
                    { value: "graph", label: "Graph" },
                    { value: "list", label: "List" },
                  ]}
                />
              </SettingRow>
              <SettingRow label="List mode">
                <Segmented
                  value={settings.fc_mode}
                  onChange={set("fc_mode")}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "hourly", label: "Hourly" },
                  ]}
                />
              </SettingRow>
              <SettingRow label="Periods shown">
                <Slider value={settings.fc_periods} min={2} max={8} step={1} onChange={set("fc_periods")} />
              </SettingRow>
              <SettingRow label="Show chance of precipitation">
                <Toggle checked={settings.fc_show_precip} onChange={set("fc_show_precip")} label="Precip chance" />
              </SettingRow>
              <SettingRow label="Show weather icons">
                <Toggle checked={settings.fc_show_icons} onChange={set("fc_show_icons")} label="Icons" />
              </SettingRow>
            </>
          )}
          {kind === "radar" && (
            <>
              <SettingRow label="Animate recent scans" hint="Loop the last few scans instead of only showing the newest.">
                <Toggle checked={settings.radar_widget_animate} onChange={set("radar_widget_animate")} label="Animate" />
              </SettingRow>
              <SettingRow label="On-map controls" hint="Zoom, recenter and animate buttons over the map.">
                <Toggle checked={settings.radar_widget_controls} onChange={set("radar_widget_controls")} label="Controls" />
              </SettingRow>
              <SettingRow label="Starting zoom" hint="Takes effect the next time the widget opens.">
                <Slider value={settings.radar_widget_zoom} min={3} max={10} step={0.5} onChange={set("radar_widget_zoom")} format={(v) => v.toFixed(1)} />
              </SettingRow>
              <div className={c("setting-hint")}>Drag the map to pan and scroll to zoom; drag the top bar to move the widget. Basemap, opacity, HD overlay, alerts and pins follow the settings on the Radar and Settings tabs.</div>
            </>
          )}
        </div>
      </Section>

      <Section title="TROUBLESHOOTING">
        <SettingRow label="Repair desktop" hint="If a widget frame is ever stuck on the desktop, this takes any widget out from behind the icons and repaints the desktop.">
          <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this repaints your desktop.")}>
            REPAIR
          </button>
        </SettingRow>
      </Section>

      <Section title="ALL WIDGETS">
        <SettingRow label="Transparency" hint="How solid the widget background is. Lower lets the desktop show through.">
          <Slider value={settings.widget_opacity} min={0.3} max={1} step={0.05} onChange={set("widget_opacity")} format={pct} />
        </SettingRow>
        <SettingRow label="Seamless look" hint="Hides the title bar and location label so widgets blend into your desktop. Drag any widget to move it - the radar moves from the thin strip along its top edge.">
          <Toggle checked={settings.widget_seamless} onChange={set("widget_seamless")} label="Seamless look" />
        </SettingRow>
        <SettingRow label="Keep on top of other windows" hint="Off lets other windows cover the widget.">
          <Toggle checked={settings.widget_keep_on_top} onChange={set("widget_keep_on_top")} label="Keep on top" />
        </SettingRow>
      </Section>
    </div>
  );
}

// ------------------------------------------------------------------ Taskbar & Dock

const START_APPS = ["Google Chrome", "Discord", "Spotify", "Steam", "File Explorer", "Microsoft Edge", "Visual Studio Code", "OBS Studio", "Notepad", "Calculator", "Photos", "Microsoft Word", "Microsoft Excel", "Settings", "Epic Games Launcher", "VLC media player"];

function LetterTile({ name, size }: { name: string; size: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <div className={c("dock-url-tile")} style={{ width: size, height: size, borderRadius: size * 0.24, background: `linear-gradient(135deg, hsl(${h} 75% 55%), hsl(${(h + 40) % 360} 75% 40%))`, fontSize: size * 0.48 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function TaskbarDockPane() {
  const app = useApp();
  const { notify } = useDemo();
  const { settings: s, update } = app;
  const set = useSetter();
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const filtered = START_APPS.filter((a) => !query.trim() || a.toLowerCase().includes(query.trim().toLowerCase()));

  const add = (it: Omit<DockItem, "id">) => {
    if (s.dock_items.some((x) => x.target === it.target)) return;
    update({ dock_items: [...s.dock_items, { ...it, id: `d${Date.now().toString(36)}${s.dock_items.length}` }], ...(s.dock_enabled ? {} : { dock_enabled: true }) });
  };
  const move = (i: number, d: number) => {
    const next = [...s.dock_items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    update({ dock_items: next });
  };
  const addUrl = () => {
    let u = url.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    try {
      const host = new URL(u).hostname.replace(/^www\./, "");
      add({ name: host.split(".")[0].replace(/^\w/, (m) => m.toUpperCase()), target: u, kind: "url" });
      setUrl("");
      setError(null);
    } catch {
      setError("That doesn't look like a web address.");
    }
  };
  const changed = (patch: Partial<Settings>, note: string) => {
    update(patch);
    notify(note);
  };

  const content = (
    <>
      <Section title="TASKBAR LOOK">
        <SettingRow label="Style" hint="Clear and Blur look best over animated wallpapers. Normal hands the taskbar back to Windows.">
          <Segmented
            value={s.taskbar_mode}
            onChange={(v) => changed({ taskbar_mode: v }, "In the app, this restyles your Windows taskbar.")}
            options={[
              { value: "normal", label: "Normal" },
              { value: "clear", label: "Clear" },
              { value: "blur", label: "Blur" },
              { value: "acrylic", label: "Acrylic" },
              { value: "tint", label: "Tinted" },
            ]}
          />
        </SettingRow>
        {(s.taskbar_mode === "tint" || s.taskbar_mode === "acrylic") && (
          <SettingRow label="Tint color" hint="Lower the alpha for a see-through tint.">
            <ColorPicker value={s.taskbar_color} onChange={set("taskbar_color")} />
          </SettingRow>
        )}
        <SettingRow label="Presets can style the taskbar" hint="Scenes like Neo Tokyo or Midnight Lake bring a matching taskbar when you apply them.">
          <Toggle checked={s.taskbar_follow_presets} onChange={set("taskbar_follow_presets")} label="Follow presets" />
        </SettingRow>
      </Section>

      <Section title="TASKBAR OPTIONS">
        <SettingRow label="Icons position">
          <Segmented
            value={s.taskbar_align}
            onChange={(v) => changed({ taskbar_align: v }, "In the app, this moves your taskbar icons.")}
            options={[
              { value: "default", label: "Windows default" },
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Search">
          <Segmented value={s.taskbar_search} onChange={(v) => changed({ taskbar_search: v }, "In the app, this changes the taskbar search box.")} options={[{ value: "default", label: "Default" }, { value: "hidden", label: "Hidden" }, { value: "icon", label: "Icon" }, { value: "box", label: "Box" }]} />
        </SettingRow>
        <SettingRow label="Task View button">
          <Segmented value={s.taskbar_task_view} onChange={(v) => changed({ taskbar_task_view: v }, "In the app, this shows or hides the Task View button.")} options={[{ value: "default", label: "Default" }, { value: "hide", label: "Hide" }, { value: "show", label: "Show" }]} />
        </SettingRow>
        <SettingRow label="Widgets button">
          <Segmented value={s.taskbar_widgets} onChange={(v) => changed({ taskbar_widgets: v }, "In the app, this shows or hides the Windows widgets button.")} options={[{ value: "default", label: "Default" }, { value: "hide", label: "Hide" }, { value: "show", label: "Show" }]} />
        </SettingRow>
        <SettingRow label="Auto-hide the taskbar" hint="Slides away until your mouse touches the screen edge.">
          <Segmented value={s.taskbar_autohide} onChange={(v) => changed({ taskbar_autohide: v }, "In the app, this auto-hides your taskbar.")} options={[{ value: "default", label: "Default" }, { value: "on", label: "On" }, { value: "off", label: "Off" }]} />
        </SettingRow>
        <SettingRow label="Restore Windows defaults" hint="Puts every taskbar setting back to how it was before RevinHi changed it.">
          <button
            className={c("btn btn-secondary btn-small")}
            onClick={() => changed({ taskbar_mode: "normal", taskbar_align: "default", taskbar_search: "default", taskbar_task_view: "default", taskbar_widgets: "default", taskbar_autohide: "default", dock_hide_taskbar: false }, "In the app, this puts your taskbar back to normal.")}
          >
            Restore
          </button>
        </SettingRow>
      </Section>

      <Section title="REVINHI DOCK">
        <SettingRow label="Show the dock" hint="A glass dock for your favourite apps, folders and websites. Right-click an icon in the dock to remove it.">
          <Toggle checked={s.dock_enabled} onChange={(v) => changed({ dock_enabled: v }, v ? "In the app, the dock appears on your desktop." : "In the app, the dock goes away.")} label="Dock" />
        </SettingRow>
        <div className={c("dock-list")}>
          {s.dock_items.length === 0 && (
            <div className={c("text-muted")} style={{ fontSize: 11.5 }}>
              No items yet. Add some below.
            </div>
          )}
          {s.dock_items.map((it, i) => (
            <div key={it.id} className={c("dock-row")}>
              <LetterTile name={it.name} size={28} />
              <div className={c("dock-row-text")}>
                <div className={c("dock-row-name")}>{it.name}</div>
                <div className={c("dock-row-target")}>{it.target}</div>
              </div>
              <button className={c("btn btn-secondary btn-small")} disabled={i === 0} onClick={() => move(i, -1)} title="Move left">
                ↑
              </button>
              <button className={c("btn btn-secondary btn-small")} disabled={i === s.dock_items.length - 1} onClick={() => move(i, 1)} title="Move right">
                ↓
              </button>
              <button className={c("btn btn-danger btn-small")} onClick={() => update({ dock_items: s.dock_items.filter((x) => x.id !== it.id) })}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className={c("toolbar")} style={{ marginTop: 10 }}>
          <button className={c("btn btn-primary btn-small")} onClick={() => setPicker((v) => !v)}>
            {picker ? "Close Start menu list" : "Add from Start menu"}
          </button>
          <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this opens a file picker for an app, shortcut or file.")}>
            Add app or file...
          </button>
          <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this opens a folder picker.")}>
            Add folder...
          </button>
        </div>
        <div className={c("toolbar")} style={{ marginTop: 8 }}>
          <input className={c("text-input")} style={{ flex: 1, minWidth: 180 }} placeholder="Website, e.g. youtube.com" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addUrl()} />
          <button className={c("btn btn-secondary btn-small")} onClick={addUrl}>
            Add website
          </button>
        </div>
        {error && (
          <div className={c("text-danger")} style={{ fontSize: 11, marginTop: 6 }}>
            {error}
          </div>
        )}
        {picker && (
          <div className={c("dock-picker")}>
            <input className={c("text-input")} placeholder="Search your apps..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className={c("dock-picker-list")}>
              {filtered.map((a) => {
                const target = `Start menu\\${a}`;
                const added = s.dock_items.some((x) => x.target === target);
                return (
                  <button key={a} className={c("dock-picker-item", added && "added")} disabled={added} onClick={() => add({ name: a, target, kind: "app" })}>
                    <LetterTile name={a} size={22} />
                    <span>{a}</span>
                    {added && (
                      <span className={c("text-muted")} style={{ marginLeft: "auto", fontSize: 10 }}>
                        In dock
                      </span>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className={c("text-muted")} style={{ padding: 8, fontSize: 11.5 }}>
                  No apps match.
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section title="DOCK LOOK">
        <SettingRow label="Position">
          <Segmented value={s.dock_edge} onChange={set("dock_edge")} options={[{ value: "bottom", label: "Bottom" }, { value: "top", label: "Top" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
        </SettingRow>
        <SettingRow label="Distance from edge">
          <Slider value={s.dock_offset} min={0} max={80} step={1} format={(v) => `${v}px`} onChange={set("dock_offset")} />
        </SettingRow>
        <SettingRow label="Icon size">
          <Slider value={s.dock_icon_size} min={32} max={96} step={2} format={(v) => `${v}px`} onChange={set("dock_icon_size")} />
        </SettingRow>
        <SettingRow label="Magnify on hover">
          <Slider value={s.dock_magnify} min={1} max={2} step={0.05} format={(v) => (v <= 1 ? "Off" : `${Math.round(v * 100)}%`)} onChange={set("dock_magnify")} />
        </SettingRow>
        <SettingRow label="Background">
          <Segmented value={s.dock_style} onChange={set("dock_style")} options={[{ value: "glass", label: "Glass" }, { value: "tint", label: "Tinted" }, { value: "clear", label: "None" }]} />
        </SettingRow>
        {s.dock_style === "tint" && (
          <SettingRow label="Tint color">
            <ColorPicker value={s.dock_tint} onChange={set("dock_tint")} />
          </SettingRow>
        )}
        <SettingRow label="Show names on hover">
          <Toggle checked={s.dock_labels} onChange={set("dock_labels")} label="Labels" />
        </SettingRow>
        <SettingRow label="Keep on top of windows" hint="Off tucks the dock behind your open windows, like the desktop.">
          <Toggle checked={s.dock_on_top} onChange={set("dock_on_top")} label="On top" />
        </SettingRow>
        <SettingRow label="Hide the Windows taskbar" hint="Auto-hides the Windows taskbar while the dock is on, so the dock becomes your taskbar. Move your mouse to the edge to bring the taskbar back.">
          <Toggle checked={s.dock_hide_taskbar} onChange={set("dock_hide_taskbar")} label="Hide taskbar" />
        </SettingRow>
      </Section>
    </>
  );

  return (
    <div className={c("pane scroll")}>
      {app.pro ? (
        content
      ) : (
        <Locked feature="taskbar" message="Taskbar styles and the RevinHi Dock are Pro">
          {content}
        </Locked>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Settings

const signed = (v: number) => (v > 0 ? `+${Math.round(v * 100)}` : `${Math.round(v * 100)}`);

export function SettingsPane() {
  const app = useApp();
  const { notify } = useDemo();
  const { settings: s, reset } = app;
  const set = useSetter();
  const [confirmReset, setConfirmReset] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  return (
    <div className={c("pane scroll")}>
      <Section title="RADAR APPEARANCE">
        <SettingRow label="Base map" hint="The map underneath the radar. Dark suits the theme; Positron is a clean light map.">
          <Segmented value={s.basemap} onChange={set("basemap")} options={[{ value: "dark", label: "Dark" }, { value: "liberty", label: "Liberty" }, { value: "positron", label: "Positron" }, { value: "bright", label: "Bright" }]} />
        </SettingRow>
        <SettingRow label="Radar opacity" hint="How strongly the radar draws over the map.">
          <Slider value={s.radar_opacity} min={0.2} max={1} step={0.05} onChange={set("radar_opacity")} format={pct} />
        </SettingRow>
        <SettingRow label="Color scheme" hint="Classic is the familiar weather-app look; Vivid is the National Weather Service standard; Aurora and Ice are made to match a styled desktop.">
          <Segmented value={s.radar_palette} onChange={set("radar_palette")} options={[{ value: "classic", label: "Classic" }, { value: "vivid", label: "Vivid" }, { value: "aurora", label: "Aurora" }, { value: "ice", label: "Ice" }]} />
        </SettingRow>
        <SettingRow label="Color legend" hint="Show the light-to-extreme color key on the Radar tab.">
          <Toggle checked={s.radar_legend} onChange={set("radar_legend")} label="Legend" />
        </SettingRow>
        <SettingRow label="Color saturation" hint="Boost or mute the radar colors.">
          <Slider value={s.radar_saturation} min={-1} max={1} step={0.1} onChange={set("radar_saturation")} format={signed} />
        </SettingRow>
        <SettingRow label="Contrast" hint="Separates light rain from heavy cores.">
          <Slider value={s.radar_contrast} min={-1} max={1} step={0.1} onChange={set("radar_contrast")} format={signed} />
        </SettingRow>
        <SettingRow label="Pixel style" hint="Smooth blends between radar cells. Sharp shows the raw grid squares exactly as measured.">
          <Segmented value={s.smoothing} onChange={set("smoothing")} options={[{ value: "smooth", label: "Smooth" }, { value: "sharp", label: "Sharp" }]} />
        </SettingRow>
      </Section>

      <Section title="RADAR LAYERS">
        <SettingRow label="Alert polygons" hint="Draw active weather alert areas on the map. Hover one for details.">
          <Toggle checked={s.show_alert_polygons} onChange={set("show_alert_polygons")} label="Alert polygons" />
        </SettingRow>
        <SettingRow label="Alert detail" hint="Warnings are tornado / severe storm / flash flood boxes; watches are the larger areas.">
          <Segmented value={s.alert_poly_level} onChange={set("alert_poly_level")} options={[{ value: "warnings", label: "Warnings" }, { value: "watches", label: "+ Watches" }, { value: "all", label: "Everything" }]} />
        </SettingRow>
        <Locked feature="tower_radar" mode="dim" message="Live tower radar is Pro">
          <SettingRow label="Tower radar (live)" hint="Near a radar tower, shows that tower's newest sweep - a few seconds old - while it is newer than the 2-minute national map.">
            <Toggle checked={s.live_site} onChange={set("live_site")} label="Live site" />
          </SettingRow>
          <SettingRow label="Tower radar (HD)" hint="Zoomed in near a radar tower, always show that tower's own high-detail radar (about 4x sharper than the national map).">
            <Toggle checked={s.live_site_hd} onChange={set("live_site_hd")} label="HD near towers" />
          </SettingRow>
        </Locked>
        <SettingRow label="Radar site markers" hint="Show the radar towers; hover one for its name.">
          <Toggle checked={s.show_radar_sites} onChange={set("show_radar_sites")} label="Radar sites" />
        </SettingRow>
        <SettingRow label="Radar site ripples" hint="Animated ripple around each tower marker so they are easy to spot.">
          <Toggle checked={s.site_ripples} onChange={set("site_ripples")} label="Ripples" />
        </SettingRow>
      </Section>

      <Section title="LIGHTNING">
        <Locked feature="lightning" mode="dim" message="Live lightning, strike alerts and animations are Pro">
          <SettingRow label="Lightning layer" hint="Live strikes from NOAA's lightning-mapping satellite (US and nearby coasts).">
            <Toggle checked={s.show_lightning} onChange={set("show_lightning")} label="Lightning" />
          </SettingRow>
          <SettingRow label="Default range" hint="The strike counter, new-strike animations, lightning notifications and nearby-alert callouts only cover this distance from a location (each location can set its own).">
            <Segmented value={s.lightning_radius_miles} onChange={set("lightning_radius_miles")} options={RANGE_OPTIONS} />
          </SettingRow>
          <SettingRow label="Lightning alerts" hint="Windows notification when new strikes land within range of a saved location, at most once per cooldown per location.">
            <Toggle checked={s.lightning_notify} onChange={set("lightning_notify")} label="Lightning alerts" />
          </SettingRow>
          {s.lightning_notify && (
            <SettingRow label="Alert cooldown" hint="Minimum time between lightning notifications for the same location.">
              <Segmented value={s.lightning_notify_cooldown_min} onChange={set("lightning_notify_cooldown_min")} options={[{ value: 5, label: "5 min" }, { value: 15, label: "15 min" }, { value: 30, label: "30 min" }, { value: 60, label: "1 hour" }]} />
            </SettingRow>
          )}
          <SettingRow label="Show range circle" hint="Dashed ring on the map marking the range.">
            <Toggle checked={s.lightning_ring} onChange={set("lightning_ring")} label="Range circle" />
          </SettingRow>
          <SettingRow label="Keep strikes for" hint="How long a strike stays on the map before it fades out.">
            <Segmented value={s.lightning_minutes} onChange={set("lightning_minutes")} options={[{ value: 10, label: "10m" }, { value: 30, label: "30m" }, { value: 60, label: "1h" }]} />
          </SettingRow>
          <SettingRow label="Strike animations" hint="New strikes flash and ripple with a small bolt when watching live.">
            <Toggle checked={s.lightning_effects} onChange={set("lightning_effects")} label="Animations" />
          </SettingRow>
        </Locked>
      </Section>

      <Section title="PLAYBACK">
        <Locked feature="radar_replay" mode="dim" message="Radar replay is Pro - the free version shows the latest scan">
          <SettingRow label="Replay speed" hint="How fast past scans play back. Also adjustable right on the radar.">
            <Segmented value={s.replay_speed} onChange={set("replay_speed")} options={REPLAY_SPEEDS.map((v) => ({ value: v, label: `${v}×` }))} />
          </SettingRow>
          <SettingRow label="Pause on newest scan" hint="How long the latest scan stays on screen before the loop starts over.">
            <Segmented value={s.loop_end_pause_ms} onChange={set("loop_end_pause_ms")} options={[{ value: 0, label: "None" }, { value: 1500, label: "1.5s" }, { value: 3000, label: "3s" }, { value: 5000, label: "5s" }, { value: 8000, label: "8s" }]} />
          </SettingRow>
          <SettingRow label="Loop length" hint="How much recent history the loop covers.">
            <Segmented value={s.loop_minutes} onChange={set("loop_minutes")} options={[{ value: 30, label: "30m" }, { value: 60, label: "1h" }, { value: 90, label: "1.5h" }, { value: 120, label: "2h" }]} />
          </SettingRow>
          <SettingRow label="Start playing automatically" hint="Begin looping as soon as the radar opens.">
            <Toggle checked={s.autoplay} onChange={set("autoplay")} label="Autoplay" />
          </SettingRow>
        </Locked>
      </Section>

      <Section title="NOWCAST">
        <Locked feature="nowcast" mode="dim" message="The rain arrival estimate is Pro">
          <SettingRow label="Rain arrival estimate" hint="Tracks how nearby rain is moving between recent scans and estimates when it reaches your location. An estimate, not a forecast model.">
            <Toggle checked={s.nowcast} onChange={set("nowcast")} label="Nowcast" />
          </SettingRow>
        </Locked>
      </Section>

      <Section title="MAP & PINS">
        <SettingRow label="Show pins" hint="Mark saved locations on the map - exact addresses as pins, city/ZIP as dots.">
          <Toggle checked={s.show_pins} onChange={set("show_pins")} label="Show pins" />
        </SettingRow>
        <SettingRow label="Pin size">
          <Segmented value={s.pin_size} onChange={set("pin_size")} options={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} />
        </SettingRow>
        <SettingRow label="Always show pin labels" hint="Otherwise a pin's name only appears when you hover it.">
          <Toggle checked={s.pin_labels_always} onChange={set("pin_labels_always")} label="Pin labels" />
        </SettingRow>
        <SettingRow label="Starting zoom" hint="How close the radar opens to your location.">
          <Slider value={s.default_zoom} min={4} max={10} step={0.5} onChange={set("default_zoom")} format={(v) => v.toFixed(1)} />
        </SettingRow>
      </Section>

      <Section title="UNITS & TIME">
        <SettingRow label="Temperature">
          <Segmented value={s.temp_unit} onChange={set("temp_unit")} options={[{ value: "f", label: "°F" }, { value: "c", label: "°C" }]} />
        </SettingRow>
        <SettingRow label="Wind speed">
          <Segmented value={s.wind_unit} onChange={set("wind_unit")} options={[{ value: "mph", label: "mph" }, { value: "kph", label: "km/h" }]} />
        </SettingRow>
        <SettingRow label="Time format" hint="How radar scan times are shown.">
          <Segmented value={s.time_format} onChange={set("time_format")} options={[{ value: "local12", label: "12-hour" }, { value: "local24", label: "24-hour" }, { value: "utc", label: "UTC" }]} />
        </SettingRow>
      </Section>

      <Section title="ALERTS & NOTIFICATIONS">
        <SettingRow label="Desktop notifications" hint="Pop a Windows notification when a new alert is issued for a saved location.">
          <Toggle checked={s.notifications} onChange={set("notifications")} label="Notifications" />
        </SettingRow>
        <SettingRow label="Notify from" hint="Only notify for alerts at or above this severity.">
          <Segmented value={s.notify_min_severity} onChange={set("notify_min_severity")} options={[{ value: "minor", label: "All" }, { value: "moderate", label: "Moderate+" }, { value: "severe", label: "Severe+" }, { value: "extreme", label: "Extreme" }]} />
        </SettingRow>
        <SettingRow label="Check for alerts" hint="How often saved locations are checked in the background.">
          <Segmented value={s.alert_poll_secs} onChange={set("alert_poll_secs")} options={[{ value: 60, label: "1m" }, { value: 120, label: "2m" }, { value: 300, label: "5m" }, { value: 600, label: "10m" }]} />
        </SettingRow>
      </Section>

      <Section title="UPDATES">
        <SettingRow label="RevinHi Desktop is up to date" hint="You have version 0.2.5. Updates are free forever and are checked for automatically; installing takes a few seconds and reopens the app.">
          <button
            className={c("btn btn-secondary")}
            disabled={checking}
            onClick={() => {
              setChecking(true);
              window.setTimeout(() => {
                setChecking(false);
                setChecked(true);
              }, 900);
            }}
          >
            {checking ? "Checking..." : "Check for updates"}
          </button>
        </SettingRow>
        {checked && (
          <div className={c("text-muted")} style={{ fontSize: 11 }}>
            You&apos;re on the newest version.
          </div>
        )}
      </Section>

      <Section title="PRIVACY">
        <SettingRow label="Send anonymous usage stats" hint="Tells revinhi.com that a copy is running (app version and Free/Pro, with a random ID made on this PC). No name, email, key or files - it just helps us know how many people use RevinHi Desktop.">
          <Toggle checked={s.usage_stats} onChange={set("usage_stats")} label="Usage stats" />
        </SettingRow>
      </Section>

      <Section title="STARTUP">
        <SettingRow label="Launch at login" hint="Starts RevinHi Desktop with Windows, minimized, and brings your widgets back exactly where you left them.">
          <Toggle
            checked={s.launch_at_login}
            onChange={(v) => {
              app.update({ launch_at_login: v });
              notify(v ? "In the app, this starts RevinHi Desktop with Windows." : "In the app, this stops it starting with Windows.");
            }}
            label="Launch at login"
          />
        </SettingRow>
        <div className={c("setting-hint")}>Address lookups use the US Census address finder, with OpenStreetMap data (© OpenStreetMap contributors) as a backup.</div>
      </Section>

      <Section title="RESET">
        <SettingRow label="Restore all settings to their defaults" hint="Applies to the app and every widget. Saved locations are not touched.">
          {confirmReset ? (
            <>
              <button
                className={c("btn btn-danger btn-small")}
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
              >
                CONFIRM RESET
              </button>
              <button className={c("btn btn-secondary btn-small")} onClick={() => setConfirmReset(false)}>
                CANCEL
              </button>
            </>
          ) : (
            <button className={c("btn btn-secondary btn-small")} onClick={() => setConfirmReset(true)}>
              RESET
            </button>
          )}
        </SettingRow>
      </Section>
    </div>
  );
}

// ------------------------------------------------------------------ License + upgrade window

function Art({ art }: { art: FeatureArt }) {
  const bolt = <path d="M14 1 3 18h7l-2 13L21 12h-7z" />;
  switch (art) {
    case "lightning":
      return (
        <div className={c("fa fa-lightning")}>
          <svg viewBox="0 0 24 32" className={c("fa-bolt")}>
            {bolt}
          </svg>
          <span className={c("fa-dot")} style={{ left: "18%", top: "30%" }} />
          <span className={c("fa-dot")} style={{ left: "74%", top: "62%" }} />
          <span className={c("fa-dot")} style={{ left: "60%", top: "22%" }} />
        </div>
      );
    case "replay":
      return (
        <div className={c("fa fa-replay")}>
          {[0.35, 0.5, 0.7, 0.55, 0.85, 1].map((h, i) => (
            <span key={i} style={{ height: `${h * 70}%` }} />
          ))}
        </div>
      );
    case "rain":
      return (
        <div className={c("fa fa-rain")}>
          {/* The app plays its rain clip here; the preview uses a still of the rain effect. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/desktop/gallery/midnight-lofi.jpg" alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      );
    case "presets":
      return (
        <div className={c("fa fa-presets")}>
          <span style={{ background: "linear-gradient(135deg,#5B4BDB,#FF7A59)" }} />
          <span style={{ background: "linear-gradient(135deg,#FF2FD1,#00E5FF)" }} />
          <span style={{ background: "linear-gradient(135deg,#2B4C7E,#FF8A3D)" }} />
        </div>
      );
    case "wallpaper":
      return <div className={c("fa fa-wallpaper")} />;
    case "widgets":
      return (
        <div className={c("fa fa-widgets")}>
          <span className={c("fa-w1")}>71°</span>
          <span className={c("fa-w2")} />
        </div>
      );
    case "watermark":
      return (
        <div className={c("fa fa-watermark")}>
          <span>Free</span>
        </div>
      );
    default:
      return (
        <div className={c("fa fa-generic")}>
          <LockIcon size={14} />
        </div>
      );
  }
}

function ActivateForm() {
  const app = useApp();
  const { notify } = useDemo();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className={c("license-form")}>
      <input className={c("text-input license-input")} placeholder="XXXX-XXXX-XXXX-XXXX" value={key} spellCheck={false} onChange={(e) => setKey(e.target.value.toUpperCase())} />
      <button
        className={c("btn btn-primary")}
        disabled={busy || !key.trim()}
        onClick={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            setKey("");
            app.setPro(true);
            notify("Pro is unlocked in this preview. In the app, the key from your email does this.");
          }, 800);
        }}
      >
        {busy ? "Checking..." : "Activate"}
      </button>
    </div>
  );
}

function BuyButton({ big = false }: { big?: boolean }) {
  const { notify } = useDemo();
  return (
    <button className={c("btn btn-buy", big && "btn-buy-big")} onClick={() => notify(`In the app, this opens the page to buy ${PRO_NAME} (${PRICE}, one time).`)}>
      Buy {PRO_NAME} — {PRICE}
    </button>
  );
}

export function UpgradeModal({ feature, onClose }: { feature: Feature | null; onClose: () => void }) {
  const app = useApp();
  const { notify } = useDemo();
  const [enterKey, setEnterKey] = useState(false);
  const focus = feature ? FEATURES[feature] : null;
  const list = (Object.keys(FEATURES) as Feature[]).filter((f) => FEATURES[f].highlight && f !== feature);
  const shown = (feature ? [feature, ...list] : list).slice(0, 6);
  return (
    <div className={c("modal-backdrop")} onPointerDown={onClose}>
      <div className={c("card modal-card upgrade-card")} onPointerDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Upgrade to Pro">
        <div className={c("upgrade-head")}>
          <span className={c("pro-chip pro-chip-static pro-chip-lg")}>
            <LockIcon size={10} />
            {PRO_NAME.toUpperCase()}
          </span>
          <div className={c("license-title")}>{focus ? `${focus.title} is a ${PRO_NAME} feature` : "You're on RevinHi Desktop Free"}</div>
          <div className={c("text-secondary license-copy")}>{focus ? `${focus.pro}. Free version: ${focus.free.toLowerCase()}.` : "Everything below is one purchase away. The free version keeps working either way."}</div>
        </div>
        <div className={c("upgrade-grid")}>
          {shown.map((f) => (
            <div key={f} className={c("upgrade-item", f === feature && "on")}>
              <Art art={FEATURES[f].art} />
              <div className={c("upgrade-text")}>
                <div className={c("upgrade-title")}>{FEATURES[f].title}</div>
                <div className={c("upgrade-sub")}>{FEATURES[f].pro}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={c("upgrade-price text-muted")}>One-time {PRICE} · free updates forever · severe-weather alerts stay free for everyone</div>
        {enterKey && <ActivateForm />}
        <div className={c("toolbar modal-actions")}>
          <BuyButton big />
          {!enterKey && (
            <button className={c("btn btn-secondary")} onClick={() => setEnterKey(true)}>
              Enter key
            </button>
          )}
          <button
            className={c("btn btn-secondary demo-try-pro")}
            onClick={() => {
              app.setPro(true);
              notify("Pro is unlocked in this preview, so you can try everything.");
            }}
            title="Only in this preview: unlock Pro to try every feature"
          >
            Try Pro here
          </button>
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary btn-small")} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export function LicenseView() {
  const app = useApp();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [activated] = useState(() => new Date().toLocaleString());
  return (
    <div className={c("pane scroll")}>
      <div className={c("card license-card")}>
        <div className={c("license-head")}>
          <div>
            <div className={c("section-title text-muted")}>LICENSE</div>
            <div className={c("license-title")}>RevinHi Desktop {app.pro ? PRO_NAME : "Free"}</div>
          </div>
          <span className={c("pill")}>
            <span className={c("pill-dot", app.pro ? "dot-success" : "dot-warning")} />
            {app.pro ? `${PRO_NAME} · activated` : "Free version"}
          </span>
        </div>
        {app.pro ? (
          <>
            <div className={c("license-row")}>
              <span className={c("text-muted")}>Key</span>
              <span className={c("license-mono")}>••••-••••-••••-7Q2K</span>
            </div>
            <div className={c("license-row")}>
              <span className={c("text-muted")}>Activated</span>
              <span>{activated}</span>
            </div>
            <p className={c("text-secondary license-copy")}>Thanks for supporting RevinHi. Your key covers every future update of RevinHi Desktop.</p>
            {confirmRemove ? (
              <div className={c("toolbar")}>
                <span className={c("text-muted")} style={{ fontSize: 12 }}>
                  Remove the key from this PC?
                </span>
                <button
                  className={c("btn btn-danger btn-small")}
                  onClick={() => {
                    app.setPro(false);
                    setConfirmRemove(false);
                  }}
                >
                  Remove
                </button>
                <button className={c("btn btn-secondary btn-small")} onClick={() => setConfirmRemove(false)}>
                  Keep
                </button>
              </div>
            ) : (
              <button className={c("btn btn-secondary btn-small")} style={{ alignSelf: "flex-start" }} onClick={() => setConfirmRemove(true)}>
                Remove license from this PC
              </button>
            )}
          </>
        ) : (
          <>
            <p className={c("text-secondary license-copy")}>
              {PRO_NAME} is a one-time {PRICE} with free updates forever. Your key arrives by email right after checkout.
            </p>
            <ActivateForm />
            <div className={c("toolbar")} style={{ marginTop: 4 }}>
              <BuyButton />
              <button className={c("btn btn-secondary btn-small")} onClick={() => app.openPaywall(null)}>
                What&apos;s in {PRO_NAME}?
              </button>
            </div>
          </>
        )}
      </div>

      <div className={c("card license-card")}>
        <div className={c("section-title text-muted")}>FREE VS {PRO_NAME.toUpperCase()}</div>
        <div className={c("tier-table")}>
          <div className={c("tier-row tier-headrow")}>
            <span />
            <span>Free</span>
            <span>{PRO_NAME}</span>
          </div>
          <div className={c("tier-row")}>
            <span>Severe-weather alerts</span>
            <span>Included</span>
            <span>Included</span>
          </div>
          {(Object.keys(FEATURES) as Feature[]).map((f) => (
            <div key={f} className={c("tier-row")}>
              <span>{FEATURES[f].title}</span>
              <span className={c("text-muted")}>{FEATURES[f].free}</span>
              <span className={c("text-success")}>Included</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Sidebar footer: FREE + Upgrade, or a quiet PRO pill. */
export function SidebarTier() {
  const app = useApp();
  return (
    <div className={c("sidebar-tier")}>
      {app.pro ? (
        <span className={c("pill")}>
          <span className={c("pill-dot dot-success")} />
          {PRO_NAME}
        </span>
      ) : (
        <>
          <span className={c("pill")}>
            <span className={c("pill-dot dot-warning")} />
            Free
          </span>
          <button className={c("btn btn-buy btn-small")} onClick={() => app.openPaywall(null)}>
            Upgrade
          </button>
        </>
      )}
    </div>
  );
}
