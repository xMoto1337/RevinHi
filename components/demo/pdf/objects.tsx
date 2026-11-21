"use client";

// Objects placed on pages (text boxes, marks, signatures, stamps, notes, shapes...) and the
// right-hand Properties panel that styles them. Mirrors editor/OverlayLayer.tsx + PropertiesPanel.tsx.

import { useEffect, useRef } from "react";
import {
  FONTS,
  HL_SWATCHES,
  NOTE_SWATCHES,
  PRESET_STAMPS,
  SWATCHES,
  fontCss,
  type MarkKind,
  type Ov,
  type OvKind,
  type ShapeKind,
  type StampSpec,
  type TextEdit,
} from "./data";
import { Chip, Segmented, Slider, c } from "./ui";

export type Tool = "select" | "edittext" | "text" | "highlight" | "ink" | "shape" | "image" | "sign" | "whiteout" | "note" | "stamp" | "crop" | "redact" | "mark";

export interface ToolStyle {
  font: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  align: "left" | "center" | "right";
  color: string;
  textBg: string | null;
  textBorder: string | null;
  strokeWidth: number;
  opacity: number;
  highlightColor: string;
  highlightOpacity: number;
  mark: MarkKind;
  markColor: string;
  markSize: number;
  shape: ShapeKind;
  fill: string | null;
  noteColor: string;
  stamp: StampSpec;
  whiteoutColor: string;
}

export const DEFAULT_STYLE: ToolStyle = {
  font: "helvetica",
  size: 12,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  align: "left",
  color: "#111111",
  textBg: null,
  textBorder: null,
  strokeWidth: 2,
  opacity: 1,
  highlightColor: "#ffe600",
  highlightOpacity: 0.4,
  mark: "check",
  markColor: "#111111",
  markSize: 14,
  shape: "rect",
  fill: null,
  noteColor: "#ffd54f",
  stamp: PRESET_STAMPS[0],
  whiteoutColor: "#ffffff",
};

/** What a style change does to one object. */
export function styleObject(o: Ov, s: Partial<ToolStyle>): Ov {
  const n: Ov = { ...o };
  const has = (k: keyof ToolStyle) => k in s;
  switch (o.kind) {
    case "text":
      if (has("font")) n.font = s.font;
      if (has("size")) n.size = s.size;
      if (has("bold")) n.bold = s.bold;
      if (has("italic")) n.italic = s.italic;
      if (has("underline")) n.underline = s.underline;
      if (has("strike")) n.strike = s.strike;
      if (has("align")) n.align = s.align;
      if (has("color")) n.color = s.color;
      if (has("textBg")) n.bg = s.textBg;
      if (has("textBorder")) n.border = s.textBorder;
      if (has("opacity")) n.opacity = s.opacity;
      break;
    case "ink":
    case "rect":
    case "ellipse":
    case "line":
    case "arrow":
      if (has("color")) n.color = s.color;
      if (has("strokeWidth")) n.width = s.strokeWidth;
      if (has("opacity")) n.opacity = s.opacity;
      if (has("fill") && (o.kind === "rect" || o.kind === "ellipse")) n.fill = s.fill;
      break;
    case "highlight":
      if (has("highlightColor")) n.color = s.highlightColor;
      if (has("highlightOpacity")) n.opacity = s.highlightOpacity;
      break;
    case "mark":
      if (has("markColor")) n.color = s.markColor;
      if (has("mark")) n.mark = s.mark;
      if (has("strokeWidth")) n.width = s.strokeWidth;
      if (has("opacity")) n.opacity = s.opacity;
      if (has("markSize") && s.markSize) {
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        n.w = n.h = s.markSize;
        n.x = cx - s.markSize / 2;
        n.y = cy - s.markSize / 2;
      }
      break;
    case "note":
      if (has("noteColor")) n.color = s.noteColor;
      break;
    case "stamp":
      if (has("stamp") && s.stamp) {
        n.label = s.stamp.label;
        n.sub = s.stamp.sub;
        n.color = s.stamp.color;
      }
      break;
    case "whiteout":
      if (has("whiteoutColor")) n.color = s.whiteoutColor;
      break;
    case "sign":
    case "image":
      if (has("opacity")) n.opacity = s.opacity;
      break;
  }
  return n;
}

/** Values shown: the first selected object's, else the defaults. */
function current(style: ToolStyle, o?: Ov): ToolStyle {
  if (!o) return style;
  const s = { ...style };
  if (o.kind === "text") Object.assign(s, { font: o.font, size: o.size, bold: !!o.bold, italic: !!o.italic, underline: !!o.underline, strike: !!o.strike, align: o.align ?? "left", color: o.color, textBg: o.bg ?? null, textBorder: o.border ?? null });
  if (["ink", "rect", "ellipse", "line", "arrow"].includes(o.kind)) Object.assign(s, { color: o.color, strokeWidth: o.width ?? 2, fill: o.fill ?? null });
  if (o.kind === "highlight") Object.assign(s, { highlightColor: o.color, highlightOpacity: o.opacity ?? 0.4 });
  else if (o.opacity !== undefined) s.opacity = o.opacity;
  if (o.kind === "mark") Object.assign(s, { markColor: o.color, mark: o.mark, markSize: Math.round(o.w * 2) / 2 });
  if (o.kind === "note") s.noteColor = o.color ?? s.noteColor;
  if (o.kind === "stamp") s.stamp = { label: o.label ?? "", sub: o.sub, color: o.color ?? "#2e7d32" };
  if (o.kind === "whiteout") s.whiteoutColor = o.color ?? "#ffffff";
  return s;
}

// ------------------------------------------------------------------ drawing one object

const NAMES: Record<OvKind, string> = {
  text: "Text",
  mark: "Mark",
  sign: "Signature",
  image: "Image",
  stamp: "Stamp",
  note: "Note",
  highlight: "Highlight",
  whiteout: "Whiteout",
  redact: "Redaction",
  ink: "Drawing",
  rect: "Rectangle",
  ellipse: "Ellipse",
  line: "Line",
  arrow: "Arrow",
};

function MarkSvg({ o }: { o: Ov }) {
  const sw = Math.max(1, (o.width ?? 2) * 0.8);
  const col = o.color ?? "#111";
  const common = { stroke: col, strokeWidth: sw, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg className={c("ov-fill")} viewBox="0 0 20 20" preserveAspectRatio="none" aria-hidden="true">
      {o.mark === "check" && <path d="M3 10.5l4.5 4.5L17 4.5" {...common} />}
      {o.mark === "cross" && <path d="M4 4l12 12M16 4L4 16" {...common} />}
      {o.mark === "dot" && <circle cx="10" cy="10" r="5.5" fill={col} />}
      {o.mark === "circle" && <ellipse cx="10" cy="10" rx="9" ry="9" {...common} />}
      {o.mark === "line" && <path d="M1 10h18" {...common} />}
      {o.mark === "checkbox" && (
        <>
          <rect x="1.5" y="1.5" width="17" height="17" {...common} />
          <path d="M5 10.5l3.5 3.5L15 6" {...common} />
        </>
      )}
    </svg>
  );
}

/** The sample logo placed by the Image tool. */
export function SampleLogo() {
  return (
    <svg className={c("ov-fill")} viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="120" height="60" rx="6" fill="#0f1a2b" />
      <circle cx="26" cy="30" r="14" fill="#3aa6ff" />
      <path d="M19 31l5 5 10-12" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text x="48" y="27" fill="#fff" fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="11">OAKRIDGE</text>
      <text x="48" y="41" fill="#9fb3cc" fontFamily="Helvetica, Arial, sans-serif" fontSize="8">ANALYTICS</text>
    </svg>
  );
}

function Body({ o, editing, onText, onTextDone }: { o: Ov; editing: boolean; onText(v: string, h: number): void; onTextDone(): void }) {
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editing) ta.current?.focus({ preventScroll: true });
  }, [editing]);

  switch (o.kind) {
    case "text": {
      const style = {
        fontFamily: fontCss(o.font),
        fontSize: o.size,
        fontWeight: o.bold ? 700 : 400,
        fontStyle: o.italic ? "italic" : "normal",
        textDecoration: [o.underline && "underline", o.strike && "line-through"].filter(Boolean).join(" ") || "none",
        textAlign: o.align,
        color: o.color,
        lineHeight: 1.25,
        padding: 2,
        background: o.bg ?? undefined,
        border: o.border ? `1px solid ${o.border}` : undefined,
      } as const;
      return editing ? (
        <textarea
          ref={ta}
          className={c("ov-text ov-edit")}
          style={{ ...style, width: "100%", height: "100%" }}
          value={o.text}
          placeholder="Type here"
          spellCheck={false}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") onTextDone();
          }}
          onChange={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            const h = el.scrollHeight;
            el.style.height = "100%";
            onText(e.target.value, h);
          }}
          onBlur={onTextDone}
        />
      ) : (
        <div className={c("ov-text")} style={style}>
          {o.text}
        </div>
      );
    }
    case "mark":
      return <MarkSvg o={o} />;
    case "sign":
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={o.src} alt="Signature" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />;
    case "image":
      return <SampleLogo />;
    case "stamp":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `2px solid ${o.color}`,
            borderRadius: 5,
            color: o.color,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: 12,
            lineHeight: 1.1,
            letterSpacing: "0.04em",
            opacity: 0.9,
          }}
        >
          {o.label}
          {o.sub && <span style={{ fontSize: 7.5, fontWeight: 600 }}>{o.sub}</span>}
        </div>
      );
    case "note":
      return (
        <svg className={c("ov-fill")} viewBox="0 0 20 20" aria-hidden="true">
          <path d="M1 1h18v13l-5 5H1z" fill={o.color} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
          <path d="M14 19v-5h5" fill="rgba(0,0,0,0.12)" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
          <path d="M4.5 6h11M4.5 9.5h11M4.5 13h7" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" />
        </svg>
      );
    case "highlight":
      return <div className={c("ov-blend")} style={{ width: "100%", height: "100%", background: o.color, opacity: o.opacity ?? 0.4 }} />;
    case "whiteout":
      return <div style={{ width: "100%", height: "100%", background: o.color }} />;
    case "redact":
      return o.applied ? <div style={{ width: "100%", height: "100%", background: "#000" }} /> : <div className={c("ov-redact")} style={{ width: "100%", height: "100%" }} />;
    case "ink": {
      const pts = o.pts ?? [];
      let d = "";
      for (let i = 0; i < pts.length; i += 2) d += `${i ? "L" : "M"}${pts[i] * o.w} ${pts[i + 1] * o.h} `;
      return (
        <svg className={c("ov-fill")} viewBox={`0 0 ${o.w} ${o.h}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={d} stroke={o.color} strokeWidth={o.width} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o.opacity} />
        </svg>
      );
    }
    case "rect":
    case "ellipse": {
      const sw = o.width ?? 2;
      return (
        <svg className={c("ov-fill")} viewBox={`0 0 ${o.w} ${o.h}`} preserveAspectRatio="none" aria-hidden="true" opacity={o.opacity}>
          {o.kind === "rect" ? (
            <rect x={sw / 2} y={sw / 2} width={Math.max(0, o.w - sw)} height={Math.max(0, o.h - sw)} stroke={o.color} strokeWidth={sw} fill={o.fill ?? "none"} />
          ) : (
            <ellipse cx={o.w / 2} cy={o.h / 2} rx={Math.max(0, o.w / 2 - sw / 2)} ry={Math.max(0, o.h / 2 - sw / 2)} stroke={o.color} strokeWidth={sw} fill={o.fill ?? "none"} />
          )}
        </svg>
      );
    }
    case "line":
    case "arrow": {
      const [a, b, cc, d] = o.dir ?? [0, 0, 1, 1];
      const x1 = a * o.w,
        y1 = b * o.h,
        x2 = cc * o.w,
        y2 = d * o.h;
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const L = 6 + (o.width ?? 2) * 2;
      const head = `M${x2 - L * Math.cos(ang - 0.45)} ${y2 - L * Math.sin(ang - 0.45)} L${x2} ${y2} L${x2 - L * Math.cos(ang + 0.45)} ${y2 - L * Math.sin(ang + 0.45)}`;
      return (
        <svg className={c("ov-fill")} viewBox={`0 0 ${Math.max(o.w, 0.1)} ${Math.max(o.h, 0.1)}`} preserveAspectRatio="none" aria-hidden="true" opacity={o.opacity} style={{ overflow: "visible" }}>
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={o.color} strokeWidth={o.width} strokeLinecap="round" fill="none" />
          {o.kind === "arrow" && <path d={head} stroke={o.color} strokeWidth={o.width} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
        </svg>
      );
    }
  }
}

export type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const HANDLES: HandleDir[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function OvView({
  o,
  selected,
  single,
  editing,
  onDown,
  onHandle,
  onDouble,
  onText,
  onTextDone,
}: {
  o: Ov;
  selected: boolean;
  single: boolean;
  editing: boolean;
  onDown(e: React.PointerEvent): void;
  onHandle(e: React.PointerEvent, d: HandleDir): void;
  onDouble(): void;
  onText(v: string, h: number): void;
  onTextDone(): void;
}) {
  const noHandles = o.kind === "note" || o.kind === "line" || o.kind === "arrow";
  return (
    <div
      className={c("ov-obj", `kind-${o.kind}`, selected && !editing && "sel", editing && "editing")}
      style={{ left: o.x, top: o.y, width: Math.max(o.w, 1), height: Math.max(o.h, 1), transform: o.rot ? `rotate(${o.rot}deg)` : undefined, opacity: o.kind === "text" || o.kind === "sign" || o.kind === "image" || o.kind === "mark" ? o.opacity : undefined }}
      onPointerDown={editing ? undefined : onDown}
      onDoubleClick={onDouble}
      title={o.kind === "note" ? o.comment?.text || "Note" : undefined}
    >
      <Body o={o} editing={editing} onText={onText} onTextDone={onTextDone} />
      {selected && single && !editing && !noHandles && HANDLES.map((d) => <span key={d} className={c("ov-handle", `h-${d}`)} onPointerDown={(e) => onHandle(e, d)} />)}
    </div>
  );
}

// ------------------------------------------------------------------ Properties panel

function ColorGrid({ value, swatches = SWATCHES, allowNone, onChange }: { value: string | null; swatches?: string[]; allowNone?: boolean; onChange(v: string | null): void }) {
  return (
    <div className={c("swatches")}>
      {allowNone && <button type="button" className={c("swatch swatch-none", value === null && "on")} title="None" aria-label="None" onClick={() => onChange(null)} />}
      {swatches.map((s) => (
        <button key={s} type="button" className={c("swatch", value?.toLowerCase() === s && "on")} style={{ background: s }} aria-label={s} onClick={() => onChange(s)} />
      ))}
    </div>
  );
}

function ColorRow({ label, value, swatches, onChange, allowNone }: { label: string; value: string | null; swatches?: string[]; allowNone?: boolean; onChange(v: string | null): void }) {
  return (
    <div className={c("prop-row")}>
      <span className={c("prop-label")}>{label}</span>
      <ColorGrid value={value} swatches={swatches} allowNone={allowNone} onChange={onChange} />
    </div>
  );
}

function SliderRow(props: { label: string; value: number; min: number; max: number; step: number; onChange(v: number): void; format?(v: number): string }) {
  return (
    <div className={c("prop-row")}>
      <span className={c("prop-label")}>{props.label}</span>
      <div className={c("prop-slider")}>
        <Slider value={props.value} min={props.min} max={props.max} step={props.step} onChange={props.onChange} format={props.format} />
      </div>
    </div>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function kindsFor(tool: Tool, shape: ShapeKind, sel: Ov[]): Set<OvKind> {
  if (sel.length) return new Set(sel.map((o) => o.kind));
  switch (tool) {
    case "note":
    case "stamp":
    case "text":
    case "ink":
    case "highlight":
    case "whiteout":
    case "mark":
      return new Set([tool]);
    case "shape":
      return new Set([shape]);
    default:
      return new Set();
  }
}

const TOOL_NAMES: Partial<Record<Tool, string>> = {
  edittext: "Edit text",
  text: "Text",
  highlight: "Highlight",
  ink: "Draw",
  shape: "Shapes",
  image: "Image",
  sign: "Sign",
  whiteout: "Whiteout",
  note: "Note",
  stamp: "Stamp",
  crop: "Crop",
  redact: "Redact",
  mark: "Fill & Sign",
};

export interface Sig {
  id: string;
  url: string;
  ratio: number;
}

export function ObjectProps({
  tool,
  style,
  sel,
  setStyle,
  onDelete,
  onRotate,
  sigs,
  activeSig,
  setActiveSig,
  pro,
  onCustomStamp,
}: {
  tool: Tool;
  style: ToolStyle;
  sel: Ov[];
  setStyle(p: Partial<ToolStyle>): void;
  onDelete(): void;
  onRotate(deg: number): void;
  sigs: Sig[];
  activeSig: string | null;
  setActiveSig(id: string): void;
  pro: boolean;
  onCustomStamp(): void;
}) {
  const kinds = kindsFor(tool, style.shape, sel);
  const v = current(style, sel[0]);
  const has = (...k: OvKind[]) => k.some((x) => kinds.has(x));
  const title = sel.length > 1 ? `${sel.length} objects` : sel.length === 1 ? NAMES[sel[0].kind] : tool === "select" ? "Properties" : TOOL_NAMES[tool] ?? "Properties";
  const set = setStyle;

  return (
    <aside className={c("props-panel")}>
      <div className={c("section-title text-muted")}>{title}</div>

      {tool === "shape" && !sel.length && (
        <div className={c("prop-row")}>
          <span className={c("prop-label")}>Shape</span>
          <Segmented<ShapeKind>
            value={style.shape}
            onChange={(shape) => set({ shape })}
            options={[
              { value: "rect", label: "▭" },
              { value: "ellipse", label: "◯" },
              { value: "line", label: "╱" },
              { value: "arrow", label: "↗" },
            ]}
          />
        </div>
      )}

      {tool === "sign" && (
        <div className={c("prop-col")}>
          <span className={c("prop-label")}>Click the page to place</span>
          {sigs.length === 0 && <p className={c("prop-note")}>No saved signatures yet. Create one in Signatures.</p>}
          <div className={c("sig-pick")}>
            {sigs.map((s) => (
              <button key={s.id} type="button" className={c("sig-pick-item", s.id === activeSig && "on")} onClick={() => setActiveSig(s.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt="Signature" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      {tool === "image" && !sel.length && <p className={c("prop-note")}>Click the page to place the image.</p>}

      {has("text") && (
        <>
          {tool === "text" && !sel.length && <p className={c("prop-note")}>Click the page to start typing, or drag to set the box width. Click a text box to edit it; Esc finishes.</p>}
          <div className={c("prop-row")}>
            <span className={c("prop-label")}>Font</span>
            <select className={c("select")} value={v.font} onChange={(e) => set({ font: e.target.value })} style={{ fontFamily: fontCss(v.font) }}>
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className={c("prop-row")}>
            <span className={c("prop-label")}>Size</span>
            <div className={c("prop-inline")}>
              <input
                className={c("text-input size-input")}
                type="number"
                min={4}
                max={96}
                value={v.size}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 4 && n <= 96) set({ size: n });
                }}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <span className={c("text-muted prop-note")}>pt</span>
            </div>
          </div>
          <div className={c("prop-row")}>
            <span className={c("prop-label")}>Style</span>
            <div className={c("toolbar")}>
              <Chip on={v.bold} onClick={() => set({ bold: !v.bold })} title="Bold">
                <b>B</b>
              </Chip>
              <Chip on={v.italic} onClick={() => set({ italic: !v.italic })} title="Italic">
                <i>I</i>
              </Chip>
              <Chip on={v.underline} onClick={() => set({ underline: !v.underline })} title="Underline">
                <u>U</u>
              </Chip>
              <Chip on={v.strike} onClick={() => set({ strike: !v.strike })} title="Strikethrough">
                <s>S</s>
              </Chip>
            </div>
          </div>
          <div className={c("prop-row")}>
            <span className={c("prop-label")}>Align</span>
            <Segmented
              value={v.align}
              onChange={(align) => set({ align })}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />
          </div>
        </>
      )}

      {has("text", "ink", "rect", "ellipse", "line", "arrow") && (
        <ColorRow label={has("rect", "ellipse") && !has("text") ? "Stroke" : "Color"} value={v.color} onChange={(color) => color && set({ color })} />
      )}

      {has("text") && (
        <>
          <ColorRow label="Fill" value={v.textBg} allowNone onChange={(textBg) => set({ textBg })} />
          <ColorRow label="Border" value={v.textBorder} allowNone onChange={(textBorder) => set({ textBorder })} />
        </>
      )}

      {has("ink", "rect", "ellipse", "line", "arrow") && (
        <SliderRow label="Width" value={v.strokeWidth} min={0.5} max={20} step={0.5} onChange={(strokeWidth) => set({ strokeWidth })} format={(x) => `${x}pt`} />
      )}

      {has("rect", "ellipse") && (
        <>
          <div className={c("prop-row")}>
            <span className={c("prop-label")}>Fill</span>
            <div>
              <Chip on={v.fill !== null} onClick={() => set({ fill: v.fill === null ? "#ffffff" : null })}>
                {v.fill === null ? "None" : "On"}
              </Chip>
            </div>
          </div>
          {v.fill !== null && <ColorRow label="Fill color" value={v.fill} onChange={(fill) => fill && set({ fill })} />}
        </>
      )}

      {has("highlight") && (
        <>
          <ColorRow label="Color" value={v.highlightColor} swatches={HL_SWATCHES} onChange={(highlightColor) => highlightColor && set({ highlightColor })} />
          <SliderRow label="Strength" value={v.highlightOpacity} min={0.1} max={1} step={0.05} onChange={(highlightOpacity) => set({ highlightOpacity })} format={pct} />
        </>
      )}

      {has("mark") && (
        <>
          <div className={c("prop-row")}>
            <span className={c("prop-label")}>Mark</span>
            <Segmented<MarkKind>
              value={v.mark}
              onChange={(mark) => set({ mark })}
              options={[
                { value: "check", label: "✓" },
                { value: "cross", label: "✗" },
                { value: "dot", label: "●" },
                { value: "circle", label: "◯" },
                { value: "line", label: "—" },
                { value: "checkbox", label: "☑" },
              ]}
            />
          </div>
          <ColorRow label="Color" value={v.markColor} onChange={(markColor) => markColor && set({ markColor })} />
          <SliderRow label="Size" value={v.markSize} min={4} max={72} step={0.5} onChange={(markSize) => set({ markSize })} format={(x) => `${x}pt`} />
          {!sel.length && <p className={c("prop-note")}>Click a checkbox, a drawn box or next to text: the mark sizes itself to fit. Keys: K ✓, X ✗, . dot, O circle, L line, B box.</p>}
        </>
      )}

      {tool === "stamp" && !sel.length && <StampPicker value={style.stamp} onPick={(stamp) => set({ stamp })} pro={pro} onCustom={onCustomStamp} />}

      {has("stamp") && sel.length > 0 && (
        <>
          <div className={c("prop-row")}>
            <span className={c("prop-label")}>Text</span>
            <input className={c("text-input")} maxLength={40} value={v.stamp.label} onKeyDown={(e) => e.stopPropagation()} onChange={(e) => set({ stamp: { ...v.stamp, label: e.target.value } })} />
          </div>
          <ColorRow label="Color" value={v.stamp.color} onChange={(color) => color && set({ stamp: { ...v.stamp, color } })} />
        </>
      )}

      {has("note") && (
        <>
          <ColorRow label="Note color" value={v.noteColor} swatches={NOTE_SWATCHES} onChange={(noteColor) => noteColor && set({ noteColor })} />
          {!sel.length && <p className={c("prop-note")}>Click the page to pin a note, then type your comment. Notes are saved as real PDF comments.</p>}
        </>
      )}

      {has("whiteout") && <ColorRow label="Color" value={v.whiteoutColor} onChange={(whiteoutColor) => whiteoutColor && set({ whiteoutColor })} />}

      {has("text", "ink", "rect", "ellipse", "line", "arrow", "image", "sign", "mark") && (
        <SliderRow label="Opacity" value={v.opacity} min={0.1} max={1} step={0.05} onChange={(opacity) => set({ opacity })} format={pct} />
      )}

      {has("whiteout") && <p className={c("prop-note")}>Whiteout covers what&apos;s underneath; it doesn&apos;t remove it from the file.</p>}

      {(tool === "redact" || has("redact")) && (
        <p className={c("prop-note")}>
          Drag over everything that must go. Marks do nothing until you choose <b>Document › Apply redactions</b>, which removes what&apos;s under them for good. You can also mark every Find match.
        </p>
      )}

      {tool === "crop" && !sel.length && <p className={c("prop-note")}>Drag a box over the area to keep.</p>}

      {sel.length === 1 && sel[0].kind !== "line" && sel[0].kind !== "arrow" && sel[0].kind !== "note" && (
        <SliderRow
          label="Rotation"
          value={Math.round((sel[0].rot ?? 0) > 180 ? (sel[0].rot ?? 0) - 360 : sel[0].rot ?? 0)}
          min={-180}
          max={180}
          step={1}
          format={(x) => `${x}°`}
          onChange={onRotate}
        />
      )}

      {sel.length > 0 && (
        <button className={c("btn btn-danger btn-small prop-delete")} onClick={onDelete}>
          Delete
        </button>
      )}

      {!kinds.size && tool === "select" && <p className={c("prop-note")}>Pick a tool above, or select an object on the page to style it.</p>}
      {tool === "edittext" && <p className={c("prop-note")}>Click a line of text on the page to edit it. Enter saves, Esc cancels.</p>}
    </aside>
  );
}

function StampPicker({ value, onPick, pro, onCustom }: { value: StampSpec; onPick(s: StampSpec): void; pro: boolean; onCustom(): void }) {
  const same = (a: StampSpec, b: StampSpec) => a.label === b.label && (a.sub ?? "") === (b.sub ?? "") && a.color === b.color;
  return (
    <div className={c("prop-col")}>
      <span className={c("prop-label")}>Click the page to place</span>
      <div className={c("stamp-grid")}>
        {PRESET_STAMPS.map((s) => (
          <button key={s.label + (s.sub ?? "")} type="button" className={c("stamp-chip", same(value, s) && "on")} style={{ color: s.color, borderColor: s.color }} onClick={() => onPick(s)}>
            <span>{s.label}</span>
            {s.sub && <span className={c("stamp-chip-sub")}>{s.sub}</span>}
          </button>
        ))}
      </div>
      <span className={c("prop-label")}>Custom stamps{pro ? "" : " (Pro)"}</span>
      <button type="button" className={c("btn btn-small btn-secondary")} style={{ alignSelf: "flex-start" }} onClick={onCustom}>
        Save custom stamp
      </button>
    </div>
  );
}

/** Properties for a line of the PDF's own text that was retyped. */
export function TextEditProps({ edit, onSet, onRevert }: { edit: TextEdit | null; onSet(p: Partial<TextEdit>): void; onRevert(): void }) {
  if (!edit) {
    return (
      <aside className={c("props-panel")}>
        <div className={c("section-title text-muted")}>Edit text</div>
        <p className={c("prop-note")}>Type the new text and press Enter. Esc cancels.</p>
      </aside>
    );
  }
  return (
    <aside className={c("props-panel")}>
      <div className={c("section-title text-muted")}>Edited text</div>
      <p className={c("prop-note te-orig")} title={edit.original}>
        Was: “{edit.original}”
      </p>
      <div className={c("prop-row")}>
        <span className={c("prop-label")}>Font</span>
        <select className={c("select")} value={edit.font ?? ""} onChange={(e) => onSet({ font: e.target.value || null })}>
          <option value="">Matched (Helvetica)</option>
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <SliderRow label="Size" value={edit.size ?? 10} min={4} max={96} step={0.5} onChange={(size) => onSet({ size })} format={(x) => `${x}pt`} />
      <ColorRow label="Color" value={edit.color ?? "#1d1d1f"} onChange={(color) => color && onSet({ color })} />
      <ColorRow label="Cover" value={edit.cover ?? "#ffffff"} swatches={["#ffffff", "#f5f5f5", "#000000"]} onChange={(cover) => cover && onSet({ cover })} />
      <p className={c("prop-note")}>The cover hides the original text visually; it isn&apos;t secure redaction.</p>
      <button className={c("btn btn-secondary btn-small prop-delete")} onClick={onRevert}>
        Revert to original
      </button>
    </aside>
  );
}
