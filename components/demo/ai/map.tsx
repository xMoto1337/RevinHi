"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "../AppWindow";
import { PIN_KINDS, kindOf, type MapPin } from "./data";
import { Icon, Switch, c, compass, contours, elevationAt, fmtDistance, fmtLatLng, heights, makeNoise, relief, sized } from "./ui";

type Tool = "none" | "pin" | "measure" | "rings";
type LngLat = [number, number];

// About 7 m per screen pixel (zoom 13.2 at this latitude), like the app's screenshot.
const PX_LAT = 15635;
const PX_LNG = 13488;
const M_PER_PX = 7.12;
const START: LngLat = [-98.48, 30.3849];
const noise = makeNoise(23);

const PREFS: [string, string][] = [
  ["contours", "Elevation lines"],
  ["hills", "Shaded hills"],
  ["grid", "Coordinate grid"],
  ["water", "Water sources"],
  ["places", "Useful places"],
  ["cameras", "Traffic cameras"],
  ["feet", "Feet and miles"],
];

// A creek and two other water sources near camp (map data in the real app).
const CREEK: LngLat[] = [
  [-98.535, 30.352],
  [-98.522, 30.36],
  [-98.512, 30.366],
  [-98.505, 30.372],
  [-98.499, 30.379],
  [-98.493, 30.384],
  [-98.489, 30.392],
  [-98.481, 30.401],
  [-98.474, 30.414],
];
const SOURCES: { name: string; kind: string; at: LngLat }[] = [
  { name: "Unnamed creek", kind: "Stream, flows most of the year", at: [-98.493, 30.384] },
  { name: "Spring", kind: "Spring", at: [-98.462, 30.392] },
  { name: "Stock tank", kind: "Pond", at: [-98.49, 30.364] },
];

function distance(a: LngLat, b: LngLat) {
  const R = 6371000;
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLng = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearing(a: LngLat, b: LngLat) {
  const r = Math.PI / 180;
  const y = Math.sin((b[0] - a[0]) * r) * Math.cos(b[1] * r);
  const x = Math.cos(a[1] * r) * Math.sin(b[1] * r) - Math.sin(a[1] * r) * Math.cos(b[1] * r) * Math.cos((b[0] - a[0]) * r);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

export function MapView({
  pins,
  setPins,
  sel,
  setSel,
  online,
  focus,
}: {
  pins: MapPin[];
  setPins: (fn: (p: MapPin[]) => MapPin[]) => void;
  sel: string | null;
  setSel: (id: string | null) => void;
  online: boolean;
  focus: number;
}) {
  const { notify } = useDemo();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [center, setCenter] = useState<LngLat>(START);
  const [tool, setTool] = useState<Tool>("none");
  const [measure, setMeasure] = useState<LngLat[]>([]);
  const [ringCenter, setRingCenter] = useState<LngLat | null>(null);
  const [water, setWater] = useState<LngLat | null>(null);
  const [pointer, setPointer] = useState<{ at: LngLat; ele: number } | null>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ contours: true, hills: true, grid: false, water: true, places: true, cameras: true, feet: true });
  const drag = useRef<{ x: number; y: number; c: LngLat; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const selPin = pins.find((p) => p.id === sel) ?? null;

  // A pin picked from elsewhere (the chat's "Show on map"): bring it into view.
  const [seenFocus, setSeenFocus] = useState(focus);
  if (focus !== seenFocus) {
    setSeenFocus(focus);
    const p = pins.find((x) => x.id === sel);
    if (p) setCenter([p.lng, p.lat - 0.0025]);
  }

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Terrain: shaded hills and elevation lines, drawn for the area on screen.
  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !size.w || !size.h) return;
    const raf = requestAnimationFrame(() => {
      const { w, h } = size;
      const ctx = sized(cv, w, h);
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, w, h);
      const step = 6;
      const left = center[0] * PX_LNG - w / 2;
      const top = -center[1] * PX_LAT - h / 2;
      const sx = Math.floor(left / step) * step;
      const sy = Math.floor(top / step) * step;
      const F = heights(noise, w + step * 2, h + step * 2, step, 260, sx, sy);
      if (prefs.hills) relief(ctx, F, "15,15,15", "38,35,31", sx - left, sy - top);
      if (prefs.contours) contours(ctx, F, 0.034, "rgba(210, 168, 97, 0.17)", "rgba(210, 168, 97, 0.55)", [0.8, 1.2], sx - left, sy - top);
    });
    return () => cancelAnimationFrame(raf);
  }, [size, center, prefs.hills, prefs.contours]);

  const toPx = ([lng, lat]: LngLat): [number, number] => [size.w / 2 + (lng - center[0]) * PX_LNG, size.h / 2 - (lat - center[1]) * PX_LAT];
  const toLngLat = (x: number, y: number): LngLat => [center[0] + (x - size.w / 2) / PX_LNG, center[1] - (y - size.h / 2) / PX_LAT];
  const local = (e: React.MouseEvent) => {
    const el = wrap.current!;
    const r = el.getBoundingClientRect();
    const k = r.width / el.offsetWidth || 1;
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k, k] as const;
  };
  const eleAt = ([lng, lat]: LngLat) => 380 + elevationAt(noise, (lng * PX_LNG) / 260, (-lat * PX_LAT) / 260) * 240;

  function clickMap(at: LngLat) {
    if (tool === "pin") {
      const n = pins.filter((p) => p.name.startsWith("Pin")).length + 1;
      const p: MapPin = { id: `pin-${Date.now()}`, name: `Pin ${n}`, kind: "point", lng: at[0], lat: at[1] };
      setPins((x) => [...x, p]);
      setSel(p.id);
      setTool("none");
    } else if (tool === "measure") setMeasure((x) => [...x, at]);
    else if (tool === "rings") setRingCenter(at);
    else {
      setSel(null);
      setWater(null);
    }
  }

  const total = measure.reduce((s, p, i) => (i ? s + distance(measure[i - 1], p) : s), 0);
  const lastBearing = measure.length > 1 ? bearing(measure[measure.length - 2], measure[measure.length - 1]) : null;
  const camp = pins.find((p) => p.kind === "camp" && p.id !== selPin?.id);
  const ringRadii = prefs.feet ? [402.336, 804.672, 1609.344] : [500, 1000, 2000];
  const waterFrom = water ?? (selPin ? ([selPin.lng, selPin.lat] as LngLat) : center);
  const sources = [...pins.filter((p) => p.kind === "water").map((p) => ({ name: p.name, kind: "Water pin", at: [p.lng, p.lat] as LngLat })), ...SOURCES]
    .map((s) => ({ ...s, d: distance(waterFrom, s.at), b: bearing(waterFrom, s.at) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4);

  return (
    <div className={c("mapv")}>
      <aside className={c("map-side")}>
        <div className={c("map-side-title")}>Pins</div>
        <div className={c("map-pins")}>
          {!pins.length && <div className={c("hint-sm")}>Pick Pin, then click the map to drop one.</div>}
          {pins.map((p) => {
            const [, label, icon, color] = kindOf(p.kind);
            return (
              <div
                key={p.id}
                className={c("map-pin-row", p.id === sel && "active")}
                onClick={() => {
                  setSel(p.id);
                  setWater(null);
                  setCenter([p.lng, p.lat - 0.0025]);
                }}
              >
                <span className={c("map-pin-ic")} style={{ color, background: `${color}22` }}>
                  <Icon name={icon} size="sm" />
                </span>
                <div>
                  <b>{p.name}</b>
                  <small>
                    {label} · {fmtLatLng([p.lng, p.lat])}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
        <div className={c("map-side-title")}>Map areas</div>
        <div className={c("map-pin-row")} onClick={() => setCenter(START)}>
          <span className={c("map-pin-ic")}>
            <Icon name="layers" size="sm" />
          </span>
          <div>
            <b>usa terrain</b>
            <small>1 MB · elevation lines only</small>
          </div>
          <button
            className={c("mini")}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              notify("In the app this deletes that map area from the drive.");
            }}
          >
            <Icon name="trash" size="sm" />
          </button>
        </div>
        <div className={c("map-get")}>
          <select className={c("select")} defaultValue="screen">
            <option value="screen">Area on screen</option>
            <option value="usa">Whole USA (main roads)</option>
            <option value="usa-terrain">USA terrain only (elevation lines)</option>
            <option value="photos">Satellite photos (area on screen)</option>
            <optgroup label="A state (every street and trail)">
              <option value="tx">Texas</option>
              <option value="co">Colorado</option>
              <option value="ca">California</option>
            </optgroup>
          </select>
          <button className={c("btn btn-primary btn-small")} disabled={!online} title={online ? "See the size, then download" : "Turn Internet on (top right) to download maps"} onClick={() => notify("In the app this shows the size, then downloads the map to the drive.")}>
            <Icon name="download" size="sm" /> {online ? "Get map" : "Internet off"}
          </button>
        </div>
        <div className={c("map-side-title")}>Show on map</div>
        {PREFS.map(([k, label]) => (
          <div key={k} className={c("map-layer")}>
            {label}
            <Switch on={prefs[k]} extra="mini-switch calm" onClick={() => setPrefs((p) => ({ ...p, [k]: !p[k] }))} />
          </div>
        ))}
        <div className={c("side-note")}>
          <Icon name="map" />
          <span>Map data on this drive: 1 map pack, 2 terrain. Works fully offline.</span>
        </div>
      </aside>

      <div
        ref={wrap}
        className={c("map-wrap")}
        onMouseMove={(e) => {
          const [x, y, k] = local(e);
          const at = toLngLat(x, y);
          setPointer({ at, ele: eleAt(at) });
          const d = drag.current;
          if (d && (d.moved || Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4)) {
            d.moved = true;
            setDragging(true);
            setCenter([d.c[0] - (e.clientX - d.x) / k / PX_LNG, d.c[1] + (e.clientY - d.y) / k / PX_LAT]);
          }
        }}
        onMouseLeave={() => {
          setPointer(null);
          drag.current = null;
          setDragging(false);
        }}
      >
        <canvas
          ref={canvas}
          className={c("map-canvas", dragging && "dragging", tool !== "none" && "aim")}
          onMouseDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY, c: center, moved: false };
          }}
          onMouseUp={(e) => {
            const d = drag.current;
            drag.current = null;
            setDragging(false);
            if (d && !d.moved) {
              const [x, y] = local(e);
              clickMap(toLngLat(x, y));
            }
          }}
        />

        <svg className={c("map-overlay")} width={size.w} height={size.h}>
          {prefs.grid &&
            Array.from({ length: 12 }, (_, i) => {
              const lng = Math.floor(center[0] * 100) / 100 + (i - 6) * 0.01;
              const lat = Math.floor(center[1] * 100) / 100 + (i - 6) * 0.01;
              const [x] = toPx([lng, 0 + center[1]]);
              const [, y] = toPx([center[0], lat]);
              return (
                <g key={i} stroke="rgba(255,255,255,0.18)" fill="rgba(255,255,255,0.45)" fontSize="10">
                  <line x1={x} y1={0} x2={x} y2={size.h} />
                  <line x1={0} y1={y} x2={size.w} y2={y} />
                  <text x={x + 4} y={size.h - 64} stroke="none">
                    {Math.abs(lng).toFixed(2)}°W
                  </text>
                  <text x={6} y={y - 4} stroke="none">
                    {lat.toFixed(2)}°N
                  </text>
                </g>
              );
            })}
          {prefs.water && <polyline points={CREEK.map((p) => toPx(p).join(",")).join(" ")} fill="none" stroke="rgba(110, 180, 255, 0.55)" strokeWidth={2} strokeLinejoin="round" />}
          {prefs.places &&
            [
              { at: [-98.4705, 30.3768] as LngLat, label: "Trailhead parking" },
              { at: [-98.4985, 30.3935] as LngLat, label: "Ranger station" },
            ].map((p) => {
              const [x, y] = toPx(p.at);
              return (
                <g key={p.label}>
                  <rect x={x - 4} y={y - 4} width={8} height={8} rx={2} fill="#c7a0ff" opacity={0.85} />
                  <text x={x + 9} y={y + 4} fontSize="11" fill="rgba(255,255,255,0.6)" style={{ paintOrder: "stroke" }} stroke="#000" strokeWidth={3}>
                    {p.label}
                  </text>
                </g>
              );
            })}
          {ringCenter &&
            ringRadii.map((r) => {
              const [x, y] = toPx(ringCenter);
              const pr = r / M_PER_PX;
              return (
                <g key={r}>
                  <circle cx={x} cy={y} r={pr} fill="none" stroke="var(--brand)" strokeOpacity={0.75} strokeDasharray="6 5" strokeWidth={1.5} />
                  <text x={x} y={y - pr - 5} textAnchor="middle" fontSize="11" fill="var(--brand)" style={{ paintOrder: "stroke" }} stroke="#000" strokeWidth={3}>
                    {fmtDistance(r, prefs.feet).replace(/\.00 /, " ")}
                  </text>
                </g>
              );
            })}
          {measure.length > 0 && (
            <g>
              <polyline points={measure.map((p) => toPx(p).join(",")).join(" ")} fill="none" stroke="var(--brand)" strokeWidth={2.5} />
              {measure.map((p, i) => {
                const [x, y] = toPx(p);
                return <circle key={i} cx={x} cy={y} r={4} fill="#0b0b0b" stroke="var(--brand)" strokeWidth={2} />;
              })}
            </g>
          )}
        </svg>

        {pins.map((p) => {
          const [x, y] = toPx([p.lng, p.lat]);
          if (x < -40 || y < -40 || x > size.w + 200 || y > size.h + 40) return null;
          const [, , icon, color] = kindOf(p.kind);
          return (
            <button
              key={p.id}
              className={c("map-pin", p.id === sel && "selected")}
              style={{ left: x, top: y }}
              onClick={(e) => {
                e.stopPropagation();
                setSel(p.id);
                setWater(null);
              }}
            >
              <span className={c("map-pin-dot")} style={{ ["--pin" as string]: color }}>
                <Icon name={icon} size="sm" />
              </span>
              <span className={c("map-pin-label")}>{p.name}</span>
            </button>
          );
        })}

        <div className={c("map-tools")}>
          {(
            [
              ["pin", "pin", "Pin"],
              ["measure", "ruler", "Measure"],
              ["rings", "rings", "Distance rings"],
            ] as [Tool, string, string][]
          ).map(([id, icon, label]) => (
            <button
              key={id}
              className={c("map-tool", tool === id && "on")}
              onClick={() => {
                const next = tool === id ? "none" : id;
                setTool(next);
                if (id === "measure") setMeasure([]);
                if (id === "rings") setRingCenter(next === "rings" && selPin ? [selPin.lng, selPin.lat] : null);
              }}
            >
              <Icon name={icon} size="sm" />
              {label}
            </button>
          ))}
          <button
            className={c("map-tool")}
            title="Nearest water to the selected pin, or to the map center"
            onClick={() => {
              setWater(selPin ? [selPin.lng, selPin.lat] : center);
              setSel(null);
            }}
          >
            <Icon name="drop" size="sm" />
            Find water
          </button>
          <button className={c("map-tool")} onClick={() => notify("In the app this puts a pin where this PC is.")}>
            <Icon name="locate" size="sm" />
            My location
          </button>
        </div>

        {tool !== "none" && (
          <div className={c("map-hint")}>
            {tool === "pin" && "Click the map to drop a pin."}
            {tool === "measure" &&
              (measure.length < 2 ? "Click points along the way." : `${fmtDistance(total, prefs.feet)} total · last leg heading ${Math.round(lastBearing!)}° (${compass(lastBearing!)})`)}
            {tool === "rings" && (ringCenter ? "Distance rings around the point. Click elsewhere to move them." : "Click the map (or pick a pin first) to center the rings.")}
            {tool === "measure" && measure.length > 0 && (
              <button className={c("btn btn-secondary btn-small")} onClick={() => setMeasure([])}>
                Clear
              </button>
            )}
          </div>
        )}

        {water && (
          <div className={c("map-card")}>
            <div className={c("map-card-head")}>
              <span className={c("map-card-title")}>Nearest water</span>
              <button className={c("mini")} title="Close" onClick={() => setWater(null)}>
                <Icon name="x" size="sm" />
              </button>
            </div>
            {sources.map((s) => (
              <div key={s.name} className={c("map-water-row")} onClick={() => setCenter([s.at[0], s.at[1] - 0.002])}>
                <Icon name="drop" />
                <div>
                  <b>{s.name}</b>
                  <small>
                    {s.kind} · {fmtDistance(s.d, prefs.feet)} {compass(s.b)}
                  </small>
                </div>
              </div>
            ))}
            <div className={c("hint-sm")}>Always filter and boil water from the wild.</div>
          </div>
        )}

        {selPin && !water && (
          <div className={c("map-card")}>
            <div className={c("map-card-head")}>
              <input className={c("map-card-name")} value={selPin.name} onChange={(e) => setPins((x) => x.map((p) => (p.id === selPin.id ? { ...p, name: e.target.value } : p)))} />
              <button className={c("mini")} title="Close" onClick={() => setSel(null)}>
                <Icon name="x" size="sm" />
              </button>
            </div>
            <div className={c("map-kinds")}>
              {PIN_KINDS.map(([id, label, icon, color]) => (
                <button key={id} className={c("map-kind", selPin.kind === id && "on")} title={label} style={{ color }} onClick={() => setPins((x) => x.map((p) => (p.id === selPin.id ? { ...p, kind: id } : p)))}>
                  <Icon name={icon} size="sm" />
                </button>
              ))}
            </div>
            <div className={c("map-kv")}>
              <span>Type</span>
              <span>{kindOf(selPin.kind)[1]}</span>
              <span>Coordinates</span>
              <span className={c("mono")}>{fmtLatLng([selPin.lng, selPin.lat])}</span>
              <span>Elevation</span>
              <span className={c("mono")}>{prefs.feet ? `${Math.round(eleAt([selPin.lng, selPin.lat]) * 3.28084).toLocaleString("en-US")} ft` : `${Math.round(eleAt([selPin.lng, selPin.lat]))} m`}</span>
              {camp && (
                <>
                  <span>From {camp.name}</span>
                  <span className={c("mono")}>
                    {fmtDistance(distance([camp.lng, camp.lat], [selPin.lng, selPin.lat]), prefs.feet)} · {Math.round(bearing([camp.lng, camp.lat], [selPin.lng, selPin.lat]))}° {compass(bearing([camp.lng, camp.lat], [selPin.lng, selPin.lat]))}
                  </span>
                </>
              )}
            </div>
            <textarea
              className={c("text-input map-notes")}
              rows={2}
              placeholder="Notes"
              value={selPin.notes ?? ""}
              onChange={(e) => setPins((x) => x.map((p) => (p.id === selPin.id ? { ...p, notes: e.target.value } : p)))}
            />
            <div className={c("map-card-actions")}>
              <button
                className={c("btn btn-secondary btn-small")}
                onClick={() => {
                  setTool("rings");
                  setRingCenter([selPin.lng, selPin.lat]);
                }}
              >
                <Icon name="rings" size="sm" /> Rings
              </button>
              <button
                className={c("btn btn-secondary btn-small")}
                onClick={() => {
                  navigator.clipboard?.writeText(`${selPin.lat.toFixed(6)}, ${selPin.lng.toFixed(6)}`).catch(() => {});
                  notify("Coordinates copied.");
                }}
              >
                <Icon name="copy" size="sm" /> Copy
              </button>
              <span style={{ flex: 1 }} />
              <button
                className={c("btn btn-danger btn-small")}
                onClick={() => {
                  setPins((x) => x.filter((p) => p.id !== selPin.id));
                  setSel(null);
                }}
              >
                <Icon name="trash" size="sm" /> Delete
              </button>
            </div>
          </div>
        )}

        {!water && !selPin && tool === "none" && (
          <div className={c("map-coverage")}>
            <Icon name="info" size="sm" /> Less detail here: only the overview map covers this area at this zoom. <small>{online ? "Use Get map on the left to download it." : "Turn Internet on to download it."}</small>
          </div>
        )}
        <div className={c("map-scale")} style={{ width: (prefs.feet ? 609.6 : 500) / M_PER_PX }}>
          {prefs.feet ? "2000 ft" : "500 m"}
        </div>
        <div className={c("map-readout")}>
          <span>
            Zoom <b>13.2</b>
          </span>
          {pointer && (
            <>
              <span>
                <b>{fmtLatLng(pointer.at)}</b>
              </span>
              <span>
                Elevation <b>{prefs.feet ? `${Math.round(pointer.ele * 3.28084).toLocaleString("en-US")} ft` : `${Math.round(pointer.ele)} m`}</b>
              </span>
            </>
          )}
        </div>
        <div className={c("map-attrib")}>© OpenStreetMap</div>
      </div>
    </div>
  );
}
