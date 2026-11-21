"use client";

// Signatures tab (signatures/SignaturesView.tsx): draw, type or upload a signature; saved ones are
// placed with the Sign tool in the editor. Saved signatures live only in this page.

import { useEffect, useRef, useState } from "react";
import { useDemo } from "../AppWindow";
import { SCRIPT_FONTS } from "./data";
import type { Sig } from "./objects";
import { IconTrash, Segmented, c } from "./ui";

type Mode = "draw" | "type" | "upload";
const INKS = ["#111111", "#1a3cff", "#0b3d91"];

/** Crops a canvas to its drawn pixels; returns a PNG data URL and its width / height ratio. */
function trimCanvas(src: HTMLCanvasElement, pad = 6): { url: string; ratio: number } | null {
  const ctx = src.getContext("2d");
  if (!ctx) return null;
  const { width: w, height: h } = src;
  const data = ctx.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { url: out.toDataURL("image/png"), ratio: out.width / out.height };
}

export function SignaturesView({
  sigs,
  activeId,
  setActiveId,
  onAdd,
  onRemove,
}: {
  sigs: Sig[];
  activeId: string | null;
  setActiveId(id: string): void;
  onAdd(s: { url: string; ratio: number }): boolean;
  onRemove(id: string): void;
}) {
  const [mode, setMode] = useState<Mode>("draw");
  return (
    <div className={c("pane scroll signatures")}>
      <div className={c("card tool-panel sig-create")}>
        <div className={c("toolbar")}>
          <div className={c("section-title rgb-chase")} style={{ marginBottom: 0 }}>
            New signature
          </div>
          <span style={{ flex: 1 }} />
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "draw", label: "Draw" },
              { value: "type", label: "Type" },
              { value: "upload", label: "Upload" },
            ]}
          />
        </div>
        {mode === "draw" && <DrawPad onSave={onAdd} />}
        {mode === "type" && <TypePad onSave={onAdd} />}
        {mode === "upload" && <UploadPad />}
      </div>

      <div className={c("card")}>
        <div className={c("section-title text-muted")}>Saved signatures</div>
        {sigs.length === 0 ? (
          <p className={c("text-muted tool-copy")}>None yet. Create one above, then use the Sign tool in the editor to place it.</p>
        ) : (
          <div className={c("sig-grid")}>
            {sigs.map((s) => (
              <div key={s.id} className={c("sig-tile", s.id === activeId && "active")} onClick={() => setActiveId(s.id)} title="Use this signature with the Sign tool">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt="Signature" draggable={false} />
                <button
                  type="button"
                  className={c("mini-btn sig-del")}
                  aria-label="Delete signature"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(s.id);
                  }}
                >
                  <IconTrash size={11} />
                </button>
                {s.id === activeId && <span className={c("sig-badge")}>In use</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Inks({ ink, setInk }: { ink: string; setInk(c: string): void }) {
  return (
    <>
      <span className={c("toolbar-label")}>Ink</span>
      {INKS.map((col) => (
        <button key={col} type="button" className={c("swatch", ink === col && "on")} style={{ background: col }} onClick={() => setInk(col)} aria-label={col} />
      ))}
    </>
  );
}

function DrawPad({ onSave }: { onSave(s: { url: string; ratio: number }): boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ink, setInk] = useState(INKS[0]);
  const [empty, setEmpty] = useState(true);

  // Canvas pixels match its layout size (the preview window is scaled, so use offsetWidth).
  useEffect(() => {
    const cv = ref.current!;
    cv.width = cv.offsetWidth * 2;
    cv.height = cv.offsetHeight * 2;
  }, []);

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = ref.current!;
    cv.setPointerCapture(e.pointerId);
    const ctx = cv.getContext("2d")!;
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width,
      sy = cv.height / r.height;
    const pt = (ev: { clientX: number; clientY: number }) => [(ev.clientX - r.left) * sx, (ev.clientY - r.top) * sy] as const;
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let [px, py] = pt(e);
    let mx = px,
      my = py;
    let lastT = performance.now();
    let width = 2.6 * 2;
    ctx.beginPath();
    ctx.arc(px, py, width / 2, 0, Math.PI * 2);
    ctx.fill();
    // Smoothed like the app: quadratic curves through midpoints, thinner when moving fast.
    const move = (ev: PointerEvent) => {
      for (const ce of ev.getCoalescedEvents?.() ?? [ev]) {
        const [x, y] = pt(ce);
        const now = performance.now();
        const speed = Math.hypot(x - px, y - py) / 2 / Math.max(1, now - lastT);
        width = width * 0.7 + Math.max(1.4, 3.2 - speed * 0.9) * 2 * 0.3;
        const nx = (px + x) / 2,
          ny = (py + y) / 2;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(px, py, nx, ny);
        ctx.stroke();
        mx = nx;
        my = ny;
        px = x;
        py = y;
        lastT = now;
      }
    };
    const up = () => {
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(px, py);
      ctx.stroke();
      setEmpty(false);
    };
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
  };

  const clear = () => {
    const cv = ref.current!;
    cv.getContext("2d")!.clearRect(0, 0, cv.width, cv.height);
    setEmpty(true);
  };

  return (
    <>
      <canvas ref={ref} className={c("sig-pad")} onPointerDown={down} aria-label="Draw your signature here" />
      <div className={c("toolbar")}>
        <Inks ink={ink} setInk={setInk} />
        <span style={{ flex: 1 }} />
        <button className={c("btn btn-secondary")} onClick={clear} disabled={empty}>
          Clear
        </button>
        <button
          className={c("btn btn-primary")}
          disabled={empty}
          onClick={() => {
            const t = trimCanvas(ref.current!);
            if (t && onSave(t)) clear();
          }}
        >
          Save signature
        </button>
      </div>
    </>
  );
}

function TypePad({ onSave }: { onSave(s: { url: string; ratio: number }): boolean }) {
  const [text, setText] = useState("");
  const [font, setFont] = useState(SCRIPT_FONTS[0].id);
  const [ink, setInk] = useState(INKS[0]);
  const render = () => {
    const def = SCRIPT_FONTS.find((f) => f.id === font)!;
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d")!;
    ctx.font = `120px ${def.css}`;
    cv.width = Math.ceil(ctx.measureText(text).width) + 80;
    cv.height = 240;
    ctx.font = `120px ${def.css}`;
    ctx.fillStyle = ink;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 40, 120);
    return trimCanvas(cv, 8);
  };
  return (
    <>
      <input className={c("text-input")} placeholder="Type your name" value={text} onChange={(e) => setText(e.target.value)} />
      <div className={c("sig-fonts")}>
        {SCRIPT_FONTS.map((f) => (
          <button key={f.id} type="button" className={c("sig-font", font === f.id && "on")} style={{ fontFamily: f.css, color: ink }} onClick={() => setFont(f.id)}>
            {text || "Your Name"}
            <span className={c("sig-font-label")}>{f.label}</span>
          </button>
        ))}
      </div>
      <div className={c("toolbar")}>
        <Inks ink={ink} setInk={setInk} />
        <span style={{ flex: 1 }} />
        <button
          className={c("btn btn-primary")}
          disabled={!text.trim()}
          onClick={() => {
            const t = render();
            if (t && onSave(t)) setText("");
          }}
        >
          Save signature
        </button>
      </div>
    </>
  );
}

function UploadPad() {
  const { notify } = useDemo();
  return (
    <>
      <p className={c("tool-copy text-muted")}>Photo or scan of your signature on white paper. White becomes transparent and the edges are trimmed.</p>
      <div className={c("sig-preview")}>
        <span className={c("text-muted")}>No image chosen</span>
      </div>
      <div className={c("toolbar")}>
        <button className={c("btn btn-secondary")} onClick={() => notify("In the app, this opens a photo of your signature from your PC.")}>
          Choose image
        </button>
        <span style={{ flex: 1 }} />
        <button className={c("btn btn-primary")} disabled>
          Save signature
        </button>
      </div>
    </>
  );
}
