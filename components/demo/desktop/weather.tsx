"use client";

import { useId } from "react";
import { c } from "./ui";

// Weather visuals from the real app (src/weather/*: icons, graph, daily rows,
// moon, astro), fed by sample weather instead of the National Weather Service.

// ------------------------------------------------------------------ sample data

export interface Period {
  name: string;
  start: number;
  is_daytime: boolean;
  temperature_f: number;
  short_forecast: string;
  precip_chance_pct: number | null;
}

export interface Current {
  temperature_f: number;
  feels_like_f: number;
  humidity_pct: number;
  wind_speed_mph: number;
  wind_direction: string;
  short_forecast: string;
  station_name: string;
}

export interface Weather {
  current: Current;
  forecast: Period[];
  hourly: Period[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** A stormy spring week, nudged a little per location so each saved place looks different. */
export function sampleWeather(lat: number, lon: number, now: Date): Weather {
  const shift = Math.round((lat - 35.5) * -2 + (lon + 97.5) * 0.6);
  const base = 74 + shift;
  const days: [string, number, number, string, string, number][] = [
    ["Chance Showers And Thunderstorms", base + 7, base - 10, "Thunderstorms Likely", "", 70],
    ["Mostly Sunny", base + 7, base - 8, "Mostly Clear", "", 10],
    ["Partly Sunny", base + 4, base - 7, "Chance Showers", "", 30],
    ["Showers Likely", base - 2, base - 12, "Rain Showers", "", 60],
    ["Sunny", base + 6, base - 9, "Clear", "", 0],
    ["Mostly Sunny", base + 9, base - 6, "Partly Cloudy", "", 10],
    ["Chance Thunderstorms", base + 8, base - 4, "Thunderstorms", "", 40],
  ];
  const forecast: Period[] = [];
  const today = new Date(now);
  today.setHours(6, 0, 0, 0);
  days.forEach(([dayText, hi, lo, nightText, , rain], i) => {
    const d = new Date(today.getTime() + i * 86400000);
    const name = i === 0 ? "Today" : DAY_NAMES[d.getDay()];
    forecast.push({ name, start: d.getTime(), is_daytime: true, temperature_f: hi, short_forecast: dayText, precip_chance_pct: rain });
    forecast.push({ name: i === 0 ? "Tonight" : `${name} Night`, start: d.getTime() + 12 * 3600000, is_daytime: false, temperature_f: lo, short_forecast: nightText, precip_chance_pct: Math.max(0, rain - 10) });
  });
  const hourly: Period[] = [];
  const h0 = new Date(now);
  h0.setMinutes(0, 0, 0);
  for (let i = 0; i < 48; i++) {
    const t = new Date(h0.getTime() + (i + 1) * 3600000);
    const hr = t.getHours();
    const day = hr >= 7 && hr < 20;
    const curve = Math.sin(((hr - 9) / 24) * Math.PI * 2);
    const storm = i >= 2 && i <= 6;
    hourly.push({
      name: "",
      start: t.getTime(),
      is_daytime: day,
      temperature_f: Math.round(base - 3 + curve * 9 - (storm ? 5 : 0)),
      short_forecast: storm ? (i === 3 || i === 4 ? "Thunderstorms" : "Chance Showers") : day ? (i % 5 === 0 ? "Partly Sunny" : "Mostly Sunny") : "Mostly Clear",
      precip_chance_pct: storm ? [40, 70, 80, 60, 30][i - 2] : i < 10 ? 10 : 0,
    });
  }
  return {
    current: {
      temperature_f: base,
      feels_like_f: base + 5,
      humidity_pct: 82,
      wind_speed_mph: 18,
      wind_direction: "S",
      short_forecast: "Thunderstorms",
      station_name: lat > 36 ? "Tulsa International Airport" : "Will Rogers World Airport",
    },
    forecast,
    hourly,
  };
}

export interface DayRow {
  name: string;
  hi: number | null;
  lo: number | null;
  short: string;
  isDay: boolean;
  precip: number | null;
}

export function toDays(periods: Period[]): DayRow[] {
  const rows: DayRow[] = [];
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    if (p.is_daytime) {
      const night = periods[i + 1] && !periods[i + 1].is_daytime ? periods[i + 1] : null;
      rows.push({ name: shortDay(p.name), hi: p.temperature_f, lo: night ? night.temperature_f : null, short: p.short_forecast, isDay: true, precip: Math.max(p.precip_chance_pct ?? 0, night?.precip_chance_pct ?? 0) });
      if (night) i++;
    } else rows.push({ name: shortDay(p.name), hi: null, lo: p.temperature_f, short: p.short_forecast, isDay: false, precip: p.precip_chance_pct });
  }
  return rows;
}

function shortDay(name: string): string {
  const m = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/.exec(name);
  return m ? m[1].slice(0, 3) : name.replace(/ Night$/, "");
}

function weekRange(rows: DayRow[]): [number, number] {
  const vals = rows.flatMap((r) => [r.hi, r.lo]).filter((v): v is number => v !== null);
  if (!vals.length) return [0, 1];
  return [Math.min(...vals), Math.max(...vals)];
}

/** Color for a temperature in °F, cold blue -> mild green -> hot red. */
export function tempColor(f: number): string {
  const stops: [number, [number, number, number]][] = [
    [10, [120, 170, 255]],
    [35, [90, 200, 250]],
    [55, [110, 220, 160]],
    [72, [255, 214, 90]],
    [88, [255, 140, 60]],
    [100, [255, 70, 70]],
  ];
  if (f <= stops[0][0]) return `rgb(${stops[0][1].join(",")})`;
  for (let i = 1; i < stops.length; i++) {
    if (f <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const k = (f - t0) / (t1 - t0);
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(",")})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(",")})`;
}

// ------------------------------------------------------------------ icons (weather/icons.tsx)

export type WxKind = "clear" | "partly" | "cloudy" | "fog" | "rain" | "showers" | "thunder" | "snow" | "sleet" | "wind";

export function wxKind(shortForecast: string): WxKind {
  const s = shortForecast.toLowerCase();
  if (/thunder|t-storm|tstorm/.test(s)) return "thunder";
  if (/sleet|freezing|ice|wintry/.test(s)) return "sleet";
  if (/snow|flurr|blizzard/.test(s)) return "snow";
  if (/shower|drizzle|sprinkle/.test(s)) return "showers";
  if (/rain/.test(s)) return "rain";
  if (/fog|haze|smoke|mist|dust/.test(s)) return "fog";
  if (/wind|breez|blustery/.test(s) && !/cloud/.test(s)) return "wind";
  if (/partly|mostly sunny|mostly clear|few clouds|scattered clouds/.test(s)) return "partly";
  if (/cloud|overcast/.test(s)) return "cloudy";
  return "clear";
}

const WX_LABEL: Record<WxKind, string> = { clear: "Clear", partly: "Partly cloudy", cloudy: "Cloudy", fog: "Fog", rain: "Rain", showers: "Showers", thunder: "Storms", snow: "Snow", sleet: "Sleet", wind: "Windy" };

function Sun({ cx = 32, cy = 32, r = 11 }: { cx?: number; cy?: number; r?: number }) {
  return (
    <g>
      <g className={c("wx-spin")} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={cx + Math.cos(a) * (r + 4)} y1={cy + Math.sin(a) * (r + 4)} x2={cx + Math.cos(a) * (r + 9)} y2={cy + Math.sin(a) * (r + 9)} stroke="#FFD25A" strokeWidth={3} strokeLinecap="round" />;
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="url(#wxSun)" />
    </g>
  );
}
const MoonG = ({ cx = 32, cy = 30 }: { cx?: number; cy?: number }) => <path d={`M ${cx + 6} ${cy - 13} A 14 14 0 1 0 ${cx + 12} ${cy + 9} A 11 11 0 1 1 ${cx + 6} ${cy - 13} Z`} fill="url(#wxMoon)" />;
const Cloud = ({ dx = 0, dy = 0, dark = false }: { dx?: number; dy?: number; dark?: boolean }) => (
  <path transform={`translate(${dx} ${dy})`} d="M18 46 h28 a10 10 0 0 0 0 -20 a13 13 0 0 0 -24 -4 a9 9 0 0 0 -4 24 z" fill={dark ? "url(#wxCloudDark)" : "url(#wxCloud)"} />
);
function Defs() {
  return (
    <defs>
      <radialGradient id="wxSun" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#FFF4B0" />
        <stop offset="60%" stopColor="#FFC93C" />
        <stop offset="100%" stopColor="#FF9F1C" />
      </radialGradient>
      <linearGradient id="wxMoon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F4F6FF" />
        <stop offset="100%" stopColor="#B9C6F0" />
      </linearGradient>
      <linearGradient id="wxCloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#C9D3E3" />
      </linearGradient>
      <linearGradient id="wxCloudDark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A9B4C8" />
        <stop offset="100%" stopColor="#6B768C" />
      </linearGradient>
    </defs>
  );
}
const Drops = ({ snow = false }: { snow?: boolean }) => (
  <g>
    {[20, 30, 40].map((x, i) =>
      snow ? (
        <circle key={x} className={c("wx-fall")} style={{ animationDelay: `${i * 0.35}s` }} cx={x} cy={52} r={2.4} fill="#EAF4FF" />
      ) : (
        <line key={x} className={c("wx-fall")} style={{ animationDelay: `${i * 0.3}s` }} x1={x + 1} y1={49} x2={x - 2} y2={56} stroke="#5CB8FF" strokeWidth={2.6} strokeLinecap="round" />
      ),
    )}
  </g>
);

export function WxIcon({ kind, day = true, size = 32 }: { kind: WxKind; day?: boolean; size?: number }) {
  return (
    <svg className={c("wx-icon")} width={size} height={size} viewBox="0 0 64 64" aria-label={WX_LABEL[kind]} role="img">
      <Defs />
      {kind === "clear" && (day ? <Sun /> : <MoonG />)}
      {kind === "partly" && (
        <>
          {day ? <Sun cx={24} cy={24} r={9} /> : <MoonG cx={22} cy={22} />}
          <Cloud dx={4} dy={4} />
        </>
      )}
      {kind === "cloudy" && (
        <>
          <Cloud dx={-6} dy={-6} dark />
          <Cloud dx={2} dy={2} />
        </>
      )}
      {kind === "fog" && (
        <>
          <Cloud dy={-6} />
          {[48, 54].map((y, i) => (
            <line key={y} className={c("wx-drift")} style={{ animationDelay: `${i * 0.6}s` }} x1={14} y1={y} x2={50} y2={y} stroke="#C9D3E3" strokeWidth={3} strokeLinecap="round" />
          ))}
        </>
      )}
      {(kind === "rain" || kind === "showers") && (
        <>
          {kind === "showers" && day && <Sun cx={22} cy={20} r={8} />}
          <Cloud dy={-8} dark={kind === "rain"} />
          <Drops />
        </>
      )}
      {kind === "thunder" && (
        <>
          <Cloud dy={-8} dark />
          <path className={c("wx-flash")} d="M33 38 l-7 11 h6 l-3 10 l10 -14 h-6 l4 -7 z" fill="#FFD84A" />
        </>
      )}
      {kind === "snow" && (
        <>
          <Cloud dy={-8} />
          <Drops snow />
        </>
      )}
      {kind === "sleet" && (
        <>
          <Cloud dy={-8} dark />
          <Drops />
        </>
      )}
      {kind === "wind" && (
        <g fill="none" stroke="#DDE6F5" strokeWidth={3.2} strokeLinecap="round">
          <path className={c("wx-drift")} d="M10 26 h30 a6 6 0 1 0 -6 -6" />
          <path className={c("wx-drift")} style={{ animationDelay: "0.5s" }} d="M10 36 h40 a6 6 0 1 1 -6 6" />
          <path className={c("wx-drift")} style={{ animationDelay: "1s" }} d="M10 46 h20" />
        </g>
      )}
    </svg>
  );
}

// ------------------------------------------------------------------ hourly graph (weather/TempGraph.tsx)

export function TempGraph({ hours, fmt, hour12 = true, icons = true, precip = true, accent }: { hours: Period[]; fmt: (f: number) => string; hour12?: boolean; icons?: boolean; precip?: boolean; accent?: string }) {
  const id = useId().replace(/:/g, "");
  const n = hours.length;
  if (n < 2) return null;
  const COL = 46;
  const W = COL * n;
  const H = 150;
  const top = icons ? 46 : 22;
  const bottom = precip ? 112 : 128;
  const temps = hours.map((h) => h.temperature_f);
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const span = Math.max(4, hi - lo);
  const x = (i: number) => COL / 2 + i * COL;
  const y = (t: number) => bottom - ((t - lo) / span) * (bottom - top - 18) - 4;
  const pts = temps.map((t, i) => [x(i), y(t)] as const);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  const area = `${d} L ${pts[n - 1][0]} ${bottom} L ${pts[0][0]} ${bottom} Z`;
  return (
    <svg className={c("temp-graph")} viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hourly temperature">
      <defs>
        <linearGradient id={`tg-line-${id}`} x1="0" y1="0" x2="1" y2="0">
          {hours.map((h, i) => (
            <stop key={i} offset={`${(i / (n - 1)) * 100}%`} stopColor={tempColor(h.temperature_f)} />
          ))}
        </linearGradient>
        <linearGradient id={`tg-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent ?? tempColor(hi)} stopOpacity={0.35} />
          <stop offset="100%" stopColor={accent ?? tempColor(lo)} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#tg-fill-${id})`} />
      <path d={d} fill="none" stroke={accent ?? `url(#tg-line-${id})`} strokeWidth={3} strokeLinecap="round" />
      {hours.map((h, i) => {
        const label = new Date(h.start).toLocaleTimeString([], { hour: "numeric", hour12 }).replace(/\s?([AP])M/, (_, m: string) => m.toLowerCase());
        const p = h.precip_chance_pct ?? 0;
        return (
          <g key={i}>
            {icons && i % 2 === 0 && (
              <g transform={`translate(${x(i) - 13} 0)`}>
                <WxIcon kind={wxKind(h.short_forecast)} day={h.is_daytime} size={26} />
              </g>
            )}
            <circle cx={x(i)} cy={y(h.temperature_f)} r={3} fill="#fff" />
            {(i % 2 === 0 || n <= 8) && (
              <text x={x(i)} y={y(h.temperature_f) - 9} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
                {fmt(h.temperature_f)}
              </text>
            )}
            {precip && p > 0 && (
              <>
                <rect x={x(i) - 9} y={bottom + 8 + (1 - p / 100) * 14} width={18} height={(p / 100) * 14} rx={3} fill="#5CB8FF" opacity={0.25 + (p / 100) * 0.6} />
                {p >= 20 && (
                  <text x={x(i)} y={bottom + 6} textAnchor="middle" fontSize={9} fill="#7CC8FF">
                    {Math.round(p)}%
                  </text>
                )}
              </>
            )}
            <text x={x(i)} y={H - 4} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.55)">
              {i === 0 ? "Now" : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------------ daily rows (weather/DailyRows.tsx)

export function DailyRows({ days, fmt, compact = false }: { days: DayRow[]; fmt: (f: number) => string; compact?: boolean }) {
  const [wLo, wHi] = weekRange(days);
  const span = Math.max(1, wHi - wLo);
  return (
    <div className={c("daily-rows", compact && "compact")}>
      {days.map((d, i) => {
        const lo = d.lo ?? d.hi ?? 0;
        const hi = d.hi ?? d.lo ?? 0;
        return (
          <div key={i} className={c("daily-row")}>
            <span className={c("daily-name")}>{i === 0 && d.isDay ? "Today" : d.name}</span>
            <span className={c("daily-icon")}>
              <WxIcon kind={wxKind(d.short)} day={d.isDay} size={compact ? 22 : 28} />
            </span>
            <span className={c("daily-precip")}>{d.precip && d.precip >= 10 ? `${Math.round(d.precip)}%` : ""}</span>
            <span className={c("daily-lo")}>{d.lo !== null ? fmt(d.lo) : ""}</span>
            <span className={c("daily-bar")}>
              <span
                className={c("daily-bar-fill")}
                style={{ left: `${((lo - wLo) / span) * 100}%`, width: `${Math.max(4, ((hi - lo) / span) * 100)}%`, background: `linear-gradient(90deg, ${tempColor(lo)}, ${tempColor(hi)})` }}
              />
            </span>
            <span className={c("daily-hi")}>{d.hi !== null ? fmt(d.hi) : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ sun + moon (weather/astro.ts, moon.tsx)

const RAD = Math.PI / 180;

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
}

export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const jd = day / 86400000 + 2440587.5;
  const n = jd - 2451545.0 + 0.0008;
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const decl = Math.asin(Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD));
  const cosH = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(decl)) / (Math.cos(lat * RAD) * Math.cos(decl));
  if (Math.abs(cosH) > 1) return { sunrise: null, sunset: null };
  const H = Math.acos(cosH) / RAD;
  const toDate = (j: number) => new Date((j - 2440587.5) * 86400000);
  return { sunrise: toDate(jTransit - H / 360), sunset: toDate(jTransit + H / 360) };
}

export interface MoonPhase {
  phase: number;
  illumination: number;
  name: string;
}

export function moonPhase(date: Date): MoonPhase {
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const phase = (((days / 29.530588853) % 1) + 1) % 1;
  const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
  return { phase, illumination: (1 - Math.cos(phase * 2 * Math.PI)) / 2, name: names[Math.round(phase * 8) % 8] };
}

export function fmtClock(d: Date | null, hour12 = true): string {
  return d ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12 }) : "--";
}

export function dayLength(t: SunTimes): string {
  if (!t.sunrise || !t.sunset) return "--";
  const mins = Math.round((t.sunset.getTime() - t.sunrise.getTime()) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m of daylight`;
}

export function MoonDisc({ phase, size = 40 }: { phase: MoonPhase; size?: number }) {
  const r = 18;
  const p = phase.phase;
  const k = Math.cos(p * 2 * Math.PI);
  const waxing = p < 0.5;
  const rx = Math.abs(k) * r;
  const litSide = waxing ? 1 : 0;
  const gibbous = k < 0;
  const d = [`M 20 ${20 - r}`, `A ${r} ${r} 0 0 ${litSide} 20 ${20 + r}`, `A ${rx} ${r} 0 0 ${gibbous ? litSide : 1 - litSide} 20 ${20 - r}`, "Z"].join(" ");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={phase.name}>
      <circle cx={20} cy={20} r={r} fill="#2A3142" />
      <path d={d} fill="#E9EDF8" />
      <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(255,255,255,0.15)" />
    </svg>
  );
}
