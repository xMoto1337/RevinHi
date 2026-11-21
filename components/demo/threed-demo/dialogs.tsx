"use client";

import { useState, type ReactNode } from "react";
import { useDemo } from "../AppWindow";
import { TEMPLATES, layersUnder, pawOutlines, shapeLayer, topOf, triangles, type Doc } from "./scene";
import { BEDS, useActions, useApp, useStore } from "./store";
import { MiniRender } from "./view";
import { Icon, LengthField, LockIcon, Modal, Section, Segmented, SettingRow, Toggle, c, crop, type IconName } from "./ui";

const PRICE = "$19.99";

const FEATURES: { id: "fullDetail" | "noWatermark" | "aiFullDetail"; title: string; pro: string; free: string; icon: IconName }[] = [
  { id: "fullDetail", title: "Full-detail saving", pro: "Export every triangle, as smooth as you made it", free: "First 3 saves full detail, then lighter: up to 20,000 triangles and coarser curves", icon: "sphere" },
  { id: "noWatermark", title: "No mark", pro: "Clean exports, nothing added to your model", free: "First 3 saves have no mark, then a small RevinHi mark on the bottom", icon: "check" },
  { id: "aiFullDetail", title: "Full-detail AI models", pro: "Generated models save at full detail", free: "First 3 saves full detail, then up to 5,000 triangles", icon: "generate" },
];

const fullDetailLine = "Your first 3 saves are full detail so you can see the real quality. After that, free saves are a lighter copy. Pro keeps full detail always.";

/** Root ids for what gets saved: the selection's top-level items, or everything. */
function exportRoots(doc: Doc, sel: string[], only: boolean): string[] {
  if (only && sel.length) return [...new Set(sel.filter((id) => doc.nodes[id]).map((id) => topOf(doc, id)))];
  return doc.roots.filter((r) => doc.nodes[r]?.visible);
}

const fileBase = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "model";

// ------------------------------------------------------------------ Export (panels/ExportDialog.tsx)

function TierCompare({ ids }: { ids: string[] }) {
  const s = useApp();
  const st = useStore();
  const [below, setBelow] = useState(false);
  const sub: Doc = { nodes: Object.fromEntries(ids.flatMap((id) => layersUnder(s.doc, id)).map((l) => [l.id, l])), roots: ids };
  const tris = Math.max(12, triangles(sub));
  const freeTris = Math.min(20000, Math.max(12, Math.round(tris * 0.42)));
  if (!ids.length) return null;
  if (s.freeLeft > 0)
    return (
      <div className={c("tier-compare-wrap")}>
        <div className={c("tier-compare tier-solo")}>
          <div className={c("tier-col current")}>
            <div className={c("tier-col-head")}>
              <span className={c("tier-col-name")}>
                Full detail, free: {s.freeLeft} of 3 left
              </span>
              <span className={c("tier-tag")}>What you get now</span>
            </div>
            <div className={c("tier-preview")}>
              <MiniRender doc={s.doc} ids={ids} below={below} />
            </div>
            <div className={c("tier-count")}>{tris.toLocaleString("en-US")} triangles</div>
            <div className={c("tier-note")}>Every triangle, nothing added</div>
          </div>
        </div>
        <div className={c("tier-compare-bar")}>
          <button type="button" className={c("btn btn-secondary btn-small")} onClick={() => setBelow(!below)} title="Turn the preview to look at the bottom">
            {below ? "Show the side" : "Show the bottom"}
          </button>
          <span style={{ flex: 1 }} />
          <button type="button" className={c("btn btn-secondary btn-small")} onClick={() => st.set({ upgrade: { feature: "fullDetail" } })}>
            About Pro
          </button>
        </div>
        <div className={c("setting-hint")}>{fullDetailLine}</div>
      </div>
    );
  return (
    <div className={c("tier-compare-wrap")}>
      <div className={c("tier-compare")}>
        <div className={c("tier-col current")}>
          <div className={c("tier-col-head")}>
            <span className={c("tier-col-name")}>Free</span>
            <span className={c("tier-tag")}>What you get now</span>
          </div>
          <div className={c("tier-preview")}>
            <MiniRender doc={s.doc} ids={ids} coarse mark below={below} />
          </div>
          <div className={c("tier-count")}>{freeTris.toLocaleString("en-US")} triangles + the mark</div>
          <div className={c("tier-note")}>Lighter copy, small RevinHi mark on the bottom</div>
        </div>
        <div className={c("tier-col")}>
          <div className={c("tier-col-head")}>
            <span className={c("tier-col-name")}>Pro</span>
          </div>
          <div className={c("tier-preview")}>
            <MiniRender doc={s.doc} ids={ids} below={below} />
          </div>
          <div className={c("tier-count")}>{tris.toLocaleString("en-US")} triangles</div>
          <div className={c("tier-note")}>Full detail, nothing added</div>
        </div>
      </div>
      <div className={c("tier-compare-bar")}>
        <button type="button" className={c("btn btn-secondary btn-small")} onClick={() => setBelow(!below)} title="Turn the previews to look at the bottom, where the free mark goes">
          {below ? "Show the side" : "Show the bottom"}
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" className={c("btn btn-buy btn-small")} onClick={() => st.set({ upgrade: { feature: "fullDetail" } })} title="Save every triangle, with no mark">
          Upgrade for full detail
        </button>
      </div>
      <div className={c("setting-hint")}>Your 3 full-detail free saves are used. Free now saves a lighter copy with a small RevinHi mark. Pro saves full detail.</div>
    </div>
  );
}

/** One save used: counts down the full-detail free saves. */
function useSave() {
  const st = useStore();
  const act = useActions();
  return () => {
    const left = st.get().freeLeft;
    if (left > 0) {
      st.set({ freeLeft: left - 1 });
      if (left === 1) window.setTimeout(() => act.info("That was your last full-detail free save. From now on, free saves are a lighter copy with a small RevinHi mark on the bottom. Every tool stays free."), 400);
    }
  };
}

function ExportDialog() {
  const s = useApp();
  const st = useStore();
  const { notify } = useDemo();
  const used = useSave();
  const [format, setFormat] = useState<"stl" | "3mf" | "obj" | "glb">("stl");
  const [colors, setColors] = useState(true);
  const [each, setEach] = useState(false);
  const [onlySel, setOnlySel] = useState(false);
  const hasSel = s.selection.length > 0;
  const ids = exportRoots(s.doc, s.selection, onlySel && hasSel);
  const close = () => st.set({ dialog: null });
  return (
    <Modal
      title="Export"
      className={ids.length ? "modal-wide" : undefined}
      onCancel={close}
      actions={
        <>
          <button
            className={c("btn btn-primary")}
            disabled={!ids.length}
            onClick={() => {
              notify(each ? "In the app this saves each part as its own file in a folder you pick." : `In the app this saves "${fileBase(s.fileName)}.${format}" on your PC.`);
              used();
              close();
            }}
          >
            {each ? "Export the files..." : "Export"}
          </button>
          <button className={c("btn btn-secondary")} onClick={close}>
            Cancel
          </button>
        </>
      }
    >
      <SettingRow
        label="File type"
        hint={
          format === "glb"
            ? "GLB is for web viewers, AR, game engines and Blender. It keeps parts and colors. Sizes are saved in meters, as GLB files expect, so a 50 mm part is 0.05 m."
            : "STL works in every slicer. 3MF keeps separate parts and states its unit. Sizes are always saved in millimeters, so slicers read them correctly."
        }
      >
        <Segmented<"stl" | "3mf" | "obj" | "glb">
          value={format}
          options={[
            { value: "stl", label: "STL" },
            { value: "3mf", label: "3MF" },
            { value: "obj", label: "OBJ" },
            { value: "glb", label: "GLB" },
          ]}
          onChange={setFormat}
        />
      </SettingRow>
      {format === "3mf" && (
        <SettingRow label="Keep colors" hint="Each color (and painted faces) goes to its own filament slot, for AMS and multi-material printers. Bambu Studio, OrcaSlicer and PrusaSlicer read them.">
          <Toggle checked={colors} onChange={setColors} label="Keep colors" />
        </SettingRow>
      )}
      <SettingRow
        label="Each part as its own file"
        hint={each ? "One file per object, named after its layer, all in a folder you pick. Each part stays exactly where it is, so they go back together. It counts as one save." : "Save every object (each part of a separated model) as its own file instead of one file."}
      >
        <Toggle checked={each} onChange={setEach} label="Each part as its own file" />
      </SettingRow>
      <SettingRow label="Only what's selected" hint={hasSel ? "Export just the selected objects." : "Nothing is selected, so everything visible is exported."}>
        <Toggle checked={onlySel && hasSel} disabled={!hasSel} onChange={setOnlySel} label="Only what's selected" />
      </SettingRow>
      {ids.length ? <TierCompare ids={ids} /> : <div className={c("setting-hint")}>There&apos;s nothing to export yet. Add a shape first.</div>}
    </Modal>
  );
}

// ------------------------------------------------------------------ Send to slicer

const SLICERS = ["Bambu Studio", "OrcaSlicer", "PrusaSlicer"];

function SlicerDialog() {
  const s = useApp();
  const st = useStore();
  const { notify } = useDemo();
  const used = useSave();
  const [pick, setPick] = useState(SLICERS[0]);
  const [colors, setColors] = useState(true);
  const [onlySel, setOnlySel] = useState(false);
  const [looking, setLooking] = useState(false);
  const hasSel = s.selection.length > 0;
  const close = () => st.set({ dialog: null });
  return (
    <Modal
      title="Send to slicer"
      onCancel={close}
      actions={
        <>
          <button
            className={c("btn btn-primary")}
            onClick={() => {
              notify(`In the app this saves a 3MF and opens it in ${pick} on your PC.`);
              used();
              close();
            }}
          >
            Open in {pick}
          </button>
          <button
            className={c("btn btn-secondary")}
            disabled={looking}
            onClick={() => {
              setLooking(true);
              window.setTimeout(() => setLooking(false), 900);
            }}
          >
            Look again
          </button>
          <button className={c("btn btn-secondary")} onClick={close}>
            Cancel
          </button>
        </>
      }
    >
      {looking ? (
        <div className={c("setting-hint")}>Looking for slicers on this PC...</div>
      ) : (
        <>
          <div className={c("setting-hint")}>The model is saved as a 3MF in millimeters and opened in the slicer you pick.</div>
          <div className={c("free-line")}>
            {s.freeLeft > 0 ? (
              <span>
                <b>Full detail, free: {s.freeLeft} of 3 left.</b> {fullDetailLine}
              </span>
            ) : (
              <span>Your 3 full-detail free saves are used. Free now sends a lighter copy with a small RevinHi mark. Pro sends full detail.</span>
            )}
            <button type="button" className={c("btn btn-small", s.freeLeft > 0 ? "btn-secondary" : "btn-buy")} onClick={() => st.set({ upgrade: { feature: "fullDetail" } })}>
              {s.freeLeft > 0 ? "About Pro" : "Upgrade"}
            </button>
          </div>
          <div className={c("slicer-list")}>
            {SLICERS.map((name, i) => (
              <button key={name} type="button" className={c("slicer-item", pick === name && "on")} onClick={() => setPick(name)}>
                <Icon name="printer" size={16} />
                <span>{name}</span>
                {i === 0 && <span className={c("slicer-last")}>Last used</span>}
              </button>
            ))}
          </div>
          <SettingRow label="Keep colors" hint="Each color goes to its own filament slot (AMS / multi-material).">
            <Toggle checked={colors} onChange={setColors} label="Keep colors" />
          </SettingRow>
          <SettingRow label="Only what's selected">
            <Toggle checked={onlySel && hasSel} disabled={!hasSel} onChange={setOnlySel} label="Only what's selected" />
          </SettingRow>
        </>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ Templates (help/Templates.tsx)

function TemplatesDialog({ fresh }: { fresh: boolean }) {
  const st = useStore();
  const act = useActions();
  const close = () => st.set({ dialog: null });
  return (
    <Modal
      title={fresh ? "New from template" : "Templates"}
      onCancel={close}
      actions={
        <button className={c("btn btn-secondary")} onClick={close}>
          Cancel
        </button>
      }
    >
      <div className={c("setting-hint")}>{fresh ? "Starts a new project from a ready-made model. Every part stays editable." : "Adds a ready-made model. Every part stays editable: change sizes, words and holes on the right."}</div>
      <div className={c("template-grid")}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={c("template-tile")}
            title={t.hint}
            onClick={() => {
              if (t.id === "lithophane") return st.set({ dialog: "litho" });
              close();
              act.addTemplate(t.id, fresh);
            }}
          >
            <Icon name={t.icon} size={26} />
            <span className={c("template-name")}>{t.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ Upgrade (license/ui.tsx)

function UpgradeModal({ feature }: { feature: "fullDetail" | null }) {
  const st = useStore();
  const { notify } = useDemo();
  const [enterKey, setEnterKey] = useState(false);
  const [key, setKey] = useState("");
  const close = () => st.set({ upgrade: null });
  const focus = FEATURES.find((f) => f.id === feature);
  return (
    <div className={c("modal-backdrop")} onPointerDown={close}>
      <div className={c("card modal-card upgrade-card")} onPointerDown={(e) => e.stopPropagation()}>
        <div className={c("upgrade-head")}>
          <span className={c("pro-chip pro-chip-lg")}>
            <LockIcon size={10} />
            PRO
          </span>
          <div className={c("license-title")}>{focus ? `${focus.title} is part of Pro` : "You're on RevinHi 3D Free"}</div>
          <div className={c("text-secondary license-copy")}>
            {focus ? `${focus.pro}. Free version: ${focus.free.toLowerCase()}.` : "Every tool works in the free version. Pro saves your models at full detail, without the watermark."}
          </div>
        </div>
        <div className={c("upgrade-grid")}>
          {FEATURES.map((f) => (
            <div key={f.id} className={c("upgrade-item", f.id === feature && "on")}>
              <div className={c("fa")}>
                <Icon name={f.icon} size={20} />
              </div>
              <div>
                <div className={c("upgrade-title")}>{f.title}</div>
                <div className={c("upgrade-sub")}>{f.pro}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={c("upgrade-price text-muted")}>One-time {PRICE} · free updates forever · every tool stays free</div>
        {enterKey && <KeyForm keyText={key} setKey={setKey} onActivate={() => notify("In the app this checks your key and unlocks Pro on this PC.")} />}
        <div className={c("toolbar modal-actions")}>
          <button className={c("btn btn-buy btn-buy-big")} onClick={() => notify("In the app this opens the RevinHi store to buy Pro.")}>
            Buy Pro — {PRICE}
          </button>
          {!enterKey && (
            <button className={c("btn btn-secondary")} onClick={() => setEnterKey(true)}>
              Enter key
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary btn-small")} onClick={close}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function KeyForm({ keyText, setKey, onActivate }: { keyText: string; setKey: (v: string) => void; onActivate: () => void }) {
  return (
    <div className={c("license-form")}>
      <input className={c("text-input license-input")} placeholder="XXXX-XXXX-XXXX-XXXX" value={keyText} spellCheck={false} onChange={(e) => setKey(e.target.value.toUpperCase())} onKeyDown={(e) => e.stopPropagation()} />
      <button className={c("btn btn-primary")} onClick={onActivate} disabled={!keyText.trim()}>
        Activate
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ Logo (panels/ImportDialogs.tsx)

function LogoDialog() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const { notify } = useDemo();
  const [src, setSrc] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(128);
  const [smooth, setSmooth] = useState(0.5);
  const [detail, setDetail] = useState(4);
  const [invert, setInvert] = useState(false);
  const [width, setWidth] = useState(40);
  const [depth, setDepth] = useState(3);
  const close = () => st.set({ dialog: null });
  const shapes = pawOutlines(60, smooth);
  const d = shapes.map((sh) => "M" + sh.map(([x, y]) => `${(x + 40).toFixed(2)} ${(40 - y).toFixed(2)}`).join("L") + "Z").join("");
  return (
    <Modal
      title="Logo"
      onCancel={close}
      actions={
        <>
          <button className={c("btn btn-secondary")} onClick={close}>
            Cancel
          </button>
          <button
            className={c("btn btn-primary")}
            disabled={!src}
            onClick={() => {
              close();
              act.addLogo(width, depth, smooth);
            }}
          >
            Add logo
          </button>
        </>
      }
    >
      <div className={c("logo-preview")} style={invert ? { background: "#151515" } : undefined}>
        {src ? (
          <svg viewBox="0 0 80 80" width={200} height={200}>
            <path d={d} fill={invert ? "#f4f4f4" : "#151515"} fillRule="nonzero" opacity={0.55 + (threshold / 255) * 0.45} />
          </svg>
        ) : (
          <div className={c("logo-picks")}>
            <button
              className={c("btn btn-secondary")}
              onClick={() => {
                notify("In the app this opens a picture, SVG or DXF from your PC. Here's a sample one.");
                setSrc("paw.png");
              }}
            >
              Choose a picture, SVG or DXF...
            </button>
            <button className={c("btn btn-secondary")} onClick={() => setSrc("paw print")} title="Type what you want and pick from four pictures, made on this PC">
              Describe it...
            </button>
          </div>
        )}
      </div>
      {src && (
        <>
          <div className={c("prop-line")}>
            <span className={c("prop-k")}>{src}</span>
            <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app this opens a picture, SVG or DXF from your PC.")}>
              Choose another...
            </button>
          </div>
          <SliderRow label="Threshold" value={threshold} min={1} max={254} step={1} onChange={setThreshold} show={String(threshold)} />
          <SliderRow label="Smoothing" value={smooth} min={0} max={1} step={0.05} onChange={setSmooth} show={`${Math.round(smooth * 100)}%`} />
          <SliderRow label="Ignore specks smaller than" value={detail} min={1} max={20} step={1} onChange={setDetail} show={`${detail} px`} />
          <SettingRow label="Swap dark and light">
            <Toggle checked={invert} onChange={setInvert} label="Swap dark and light" />
          </SettingRow>
          <div className={c("field-row")} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <LengthField label="Width" unit={s.unit} valueMm={width} min={0.5} onCommit={setWidth} />
            <LengthField label="Height" unit={s.unit} valueMm={depth} min={0.1} onCommit={setDepth} title="How tall the logo stands" />
          </div>
          <div className={c("prop-note")}>5 outlines. Dark parts become solid. You can change the height later, or raise it onto or cut it into another object.</div>
        </>
      )}
    </Modal>
  );
}

function SliderRow({ label, value, min, max, step, onChange, show }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; show: string }) {
  return (
    <SettingRow label={label}>
      <input type="range" className={c("range")} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      <span className={c("setting-value")}>{show}</span>
    </SettingRow>
  );
}

// ------------------------------------------------------------------ Lithophane

function LithoDialog() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const { notify } = useDemo();
  const [photo, setPhoto] = useState(false);
  const [shape, setShape] = useState<"flat" | "curved">("flat");
  const [width, setWidth] = useState(100);
  const [thin, setThin] = useState(0.8);
  const [thick, setThick] = useState(3);
  const close = () => st.set({ dialog: null });
  return (
    <Modal
      title="Lithophane"
      onCancel={close}
      actions={
        <>
          <button className={c("btn btn-secondary")} onClick={close}>
            Cancel
          </button>
          <button
            className={c("btn btn-primary")}
            disabled={!photo}
            onClick={() => {
              close();
              const plate = shapeLayer("Lithophane", "cube", { width, depth: thick, height: Math.round(width * 0.75) }, "#f2f2f2", [0, 0, 0]);
              act.addLayers([{ ...plate, plain: true }], "Add lithophane");
            }}
          >
            Add lithophane
          </button>
        </>
      }
    >
      <div className={c("logo-preview logo-dark")}>
        {photo ? (
          <div style={{ ...crop(1508, 187, 181, 181), width: 180, height: 180, borderRadius: 10, filter: "grayscale(1) contrast(1.1)" }} />
        ) : (
          <button
            className={c("btn btn-secondary")}
            onClick={() => {
              notify("In the app this opens a photo from your PC. Here's a sample one.");
              setPhoto(true);
            }}
          >
            Choose a photo...
          </button>
        )}
      </div>
      <div className={c("prop-note")}>Hold the print up to a light: dark parts of the photo are printed thicker, so they let less light through.</div>
      <div className={c("field-grid")}>
        <LengthField label="Width" unit={s.unit} valueMm={width} min={10} onCommit={setWidth} />
        <LengthField label="Thinnest" unit={s.unit} valueMm={thin} min={0.2} onCommit={setThin} />
        <LengthField label="Thickest" unit={s.unit} valueMm={thick} min={0.3} onCommit={setThick} />
      </div>
      <div className={c("prop-line")}>
        <span className={c("prop-k")}>Shape</span>
        <Segmented<"flat" | "curved">
          value={shape}
          options={[
            { value: "flat", label: "Flat" },
            { value: "curved", label: "Curved" },
          ]}
          onChange={setShape}
        />
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ Help sheets

const KEYS: [string, string][] = [
  ["New project", "Ctrl+N"],
  ["Open", "Ctrl+O"],
  ["Save", "Ctrl+S"],
  ["Import a model", "Ctrl+I"],
  ["Export", "Ctrl+E"],
  ["Undo", "Ctrl+Z"],
  ["Redo", "Ctrl+Y"],
  ["Delete", "Delete"],
  ["Duplicate", "Ctrl+D"],
  ["Move handles", "W"],
  ["Rotate handles", "E"],
  ["Resize handles", "R"],
  ["Snap", "S"],
  ["Zoom to selection", "F"],
  ["Apply (flatten)", "Ctrl+B"],
  ["Hide all panels", "Tab"],
];

function HelpSheet({ kind }: { kind: "keys" | "news" | "about" }) {
  const st = useStore();
  const act = useActions();
  const close = () => st.set({ dialog: null });
  let body: ReactNode;
  if (kind === "keys")
    body = (
      <div>
        {KEYS.map(([what, k]) => (
          <SettingRow key={what} label={what}>
            <span className={c("key")}>{k}</span>
          </SettingRow>
        ))}
      </div>
    );
  else if (kind === "news")
    body = (
      <div className={c("modal-copy")}>
        <p style={{ marginBottom: 8 }}>
          <b>Version 1.0.8</b>
        </p>
        <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Will this print? checks your model and suggests fixes in plain words.</li>
          <li>Make it flexi turns a model into a toy with moving joints that prints in one piece.</li>
          <li>Wrap Picture cuts a picture evenly into a curved surface.</li>
          <li>Sell It Kit saves listing photos and a description for your model.</li>
        </ul>
      </div>
    );
  else
    body = (
      <div className={c("modal-copy")}>
        <p>
          <b>RevinHi 3D 1.0.8</b>
        </p>
        <p>Easy 3D modeling for 3D printing. Made by RevinHi.</p>
        <button type="button" className={c("btn btn-secondary btn-small")} style={{ marginTop: 10 }} onClick={() => act.info("The app lists the open-source parts it uses, with their licenses, under About.")}>
          Licenses
        </button>
      </div>
    );
  return (
    <Modal
      title={kind === "keys" ? "Keyboard shortcuts" : kind === "news" ? "What's new" : "About RevinHi 3D"}
      onCancel={close}
      actions={
        <button className={c("btn btn-secondary")} onClick={close}>
          Close
        </button>
      }
    >
      {body}
    </Modal>
  );
}

export function Dialogs() {
  const s = useApp();
  return (
    <>
      {s.dialog === "export" && <ExportDialog />}
      {s.dialog === "slicer" && <SlicerDialog />}
      {(s.dialog === "templates-new" || s.dialog === "templates-add") && <TemplatesDialog fresh={s.dialog === "templates-new"} />}
      {s.dialog === "logo" && <LogoDialog />}
      {s.dialog === "litho" && <LithoDialog />}
      {(s.dialog === "keys" || s.dialog === "news" || s.dialog === "about") && <HelpSheet kind={s.dialog} />}
      {s.upgrade && <UpgradeModal feature={s.upgrade.feature} />}
    </>
  );
}

// ------------------------------------------------------------------ Settings (panels/SettingsView.tsx)

export function SettingsView() {
  const s = useApp();
  const st = useStore();
  const { notify } = useDemo();
  const [opts, setOpts] = useState({ separate: true, cleanWalls: true, separatePieces: true, stats: true, step: "1", left: "turn", right: "slide" });
  const [key, setKey] = useState("");
  const set = (p: Partial<typeof opts>) => setOpts((o) => ({ ...o, ...p }));
  const tab = s.settingsTab;
  return (
    <div className={c("settings-view")}>
      <div className={c("settings-nav")}>
        <div className={c("settings-title")}>Settings</div>
        {(
          [
            ["general", "General"],
            ["shortcuts", "Shortcuts"],
            ["license", "License"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={c("nav-item", tab === id && "active")} onClick={() => st.set({ settingsTab: id })}>
            {label}
          </button>
        ))}
      </div>
      <div className={c("settings-body")}>
        {tab === "general" && (
          <div className={c("settings-cards")}>
            <Section title="Units and modes">
              <SettingRow label="Units" hint="Sizes show in this unit. You can always type either, like 50 or 2in.">
                <Segmented<"mm" | "in">
                  value={s.unit}
                  options={[
                    { value: "mm", label: "Millimeters" },
                    { value: "in", label: "Inches" },
                  ]}
                  onChange={(unit) => st.set({ unit })}
                />
              </SettingRow>
              <SettingRow label="Mode" hint="Simple keeps the main tools up front. Advanced adds sculpting, fixes and expert settings.">
                <Segmented<"simple" | "advanced">
                  value={s.mode}
                  options={[
                    { value: "simple", label: "Simple" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                  onChange={(mode) => st.set({ mode })}
                />
              </SettingRow>
            </Section>
            <Section title="Editing">
              <SettingRow label="Keep cuts editable" hint="Cut and Join keep the parts as layers you can still move and resize. Off: they apply right away.">
                <Toggle checked={s.keepEditable} onChange={(keepEditable) => st.set({ keepEditable })} label="Keep cuts editable" />
              </SettingRow>
              <SettingRow label="Keep added pieces as separate objects">
                <Toggle checked={opts.separate} onChange={(v) => set({ separate: v })} label="Keep added pieces as separate objects" />
              </SettingRow>
              <SettingRow label="Clean up hidden inside walls when cutting">
                <Toggle checked={opts.cleanWalls} onChange={(v) => set({ cleanWalls: v })} label="Clean up hidden inside walls when cutting" />
              </SettingRow>
              <SettingRow label="Separate loose pieces after a cut">
                <Toggle checked={opts.separatePieces} onChange={(v) => set({ separatePieces: v })} label="Separate loose pieces after a cut" />
              </SettingRow>
              <SettingRow label="Snap step" hint="How far things jump when snapping is on while moving.">
                <select className={c("select")} value={opts.step} onChange={(e) => set({ step: e.target.value })} aria-label="Snap step">
                  {["0.1", "0.5", "1", "2", "5", "10"].map((v) => (
                    <option key={v} value={v}>
                      {v} mm
                    </option>
                  ))}
                </select>
              </SettingRow>
            </Section>
            <Section title="Mouse">
              <SettingRow label="Left drag on empty space">
                <Segmented<string>
                  value={opts.left}
                  options={[
                    { value: "turn", label: "Turn the view" },
                    { value: "select", label: "Select box" },
                  ]}
                  onChange={(v) => set({ left: v })}
                />
              </SettingRow>
              <SettingRow label="Right drag">
                <Segmented<string>
                  value={opts.right}
                  options={[
                    { value: "slide", label: "Slide the view" },
                    { value: "turn", label: "Turn the view" },
                  ]}
                  onChange={(v) => set({ right: v })}
                />
              </SettingRow>
            </Section>
            <Section title="Printer">
              <SettingRow label="Printer bed" hint="Shows your printer's bed size on the grid. Pick None to hide it.">
                <select className={c("select")} value={s.bed} onChange={(e) => st.set({ bed: e.target.value })} aria-label="Printer bed">
                  {BEDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                      {b.size ? ` (${b.size[0]} x ${b.size[1]} mm)` : ""}
                    </option>
                  ))}
                </select>
              </SettingRow>
            </Section>
            <Section title="Privacy">
              <SettingRow label="Send anonymous usage stats" hint="Only a random install number, the app version and Free or Pro. Nothing about you or your models.">
                <Toggle checked={opts.stats} onChange={(v) => set({ stats: v })} label="Send anonymous usage stats" />
              </SettingRow>
            </Section>
          </div>
        )}
        {tab === "shortcuts" && (
          <div className={c("settings-cards")}>
            <Section title="Keyboard shortcuts">
              {KEYS.map(([what, k]) => (
                <SettingRow key={what} label={what}>
                  <span className={c("key")}>{k}</span>
                </SettingRow>
              ))}
            </Section>
          </div>
        )}
        {tab === "license" && (
          <div className={c("settings-cards")}>
            <div className={c("card license-card")}>
              <div className={c("license-head")}>
                <div>
                  <div className={c("section-title text-muted")}>LICENSE</div>
                  <div className={c("license-title")}>RevinHi 3D Free</div>
                </div>
                <span className={c("pill")}>
                  <span className={c("pill-dot dot-warning")} />
                  Free version
                </span>
              </div>
              <p className={c("text-secondary license-copy")}>Pro is a one-time {PRICE} with free updates forever. Your key arrives by email right after checkout.</p>
              <p className={c("text-secondary license-copy")}>
                {s.freeLeft > 0 ? `${s.freeLeft} of your 3 full-detail free saves left.` : "Your 3 full-detail free saves are used. Free saves are a lighter copy with a small RevinHi mark."}
              </p>
              <KeyForm keyText={key} setKey={setKey} onActivate={() => notify("In the app this checks your key and unlocks Pro on this PC.")} />
              <div className={c("toolbar")} style={{ marginTop: 4 }}>
                <button className={c("btn btn-buy")} onClick={() => notify("In the app this opens the RevinHi store to buy Pro.")}>
                  Buy Pro — {PRICE}
                </button>
                <button className={c("btn btn-secondary btn-small")} onClick={() => st.set({ upgrade: { feature: null } })}>
                  What&apos;s in Pro?
                </button>
              </div>
            </div>
            <div className={c("card license-card")}>
              <div className={c("section-title text-muted")}>FREE VS PRO</div>
              <div className={c("tier-table")}>
                <div className={c("tier-row tier-headrow")}>
                  <span />
                  <span>Free</span>
                  <span>Pro</span>
                </div>
                {["Every modeling tool", "Open and edit any model"].map((t) => (
                  <div key={t} className={c("tier-row")}>
                    <span>{t}</span>
                    <span>Included</span>
                    <span>Included</span>
                  </div>
                ))}
                {FEATURES.map((f) => (
                  <div key={f.id} className={c("tier-row")}>
                    <span>{f.title}</span>
                    <span className={c("text-muted")}>{f.free}</span>
                    <span className={c("text-success")}>Included</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
