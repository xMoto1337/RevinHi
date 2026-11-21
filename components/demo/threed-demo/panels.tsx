"use client";

import { useState } from "react";
import { useDemo } from "../AppWindow";
import {
  FILAMENTS,
  FONTS,
  PARTS,
  SHAPES,
  SHAPE_BY_KIND,
  type Doc,
  type Group,
  type Layer,
  type SNode,
  type TextSpec,
  boxSize,
  isComputed,
  isEmptyBox,
  localOf,
  nodeBox,
  selectionBox,
  triangles,
  type Vec3,
} from "./scene";
import { bedOf, nodePosition, useActions, useApp, useStore } from "./store";
import { AngleField, CountField, Icon, LengthField, Menu, MenuItem, MenuSep, PropSection, Segmented, Toggle, c, formatSize, type IconName } from "./ui";

// ------------------------------------------------------------------ toolbar (panels/Toolbar.tsx)

function Verb({ icon, label, onClick, title, active }: { icon: IconName; label: string; onClick: () => void; title?: string; active?: boolean }) {
  return (
    <button type="button" className={c("verb", active && "on")} onClick={onClick} title={title ?? label}>
      <Icon name={icon} size={18} />
      <span className={c("verb-label")}>{label}</span>
    </button>
  );
}

function SplitButton({ icon, label, title, onClick, open, toggle, active }: { icon: IconName; label: string; title: string; onClick: () => void; open: boolean; toggle: () => void; active?: boolean }) {
  return (
    <div className={c("split", open && "open")}>
      <button type="button" className={c("verb", active && "on")} onClick={onClick} title={title}>
        <Icon name={icon} size={18} />
        <span className={c("verb-label")}>{label}</span>
      </button>
      <button type="button" className={c("split-caret")} onClick={toggle} title={`${label} options`}>
        <Icon name="chevronDown" size={12} />
      </button>
    </div>
  );
}

function AddMenuBody({ close }: { close: () => void }) {
  const [tab, setTab] = useState<"shapes" | "parts">("shapes");
  const act = useActions();
  const st = useStore();
  const { notify } = useDemo();
  return (
    <>
      <div className={c("add-tabs")}>
        <Segmented<"shapes" | "parts">
          value={tab}
          options={[
            { value: "shapes", label: "Shapes" },
            { value: "parts", label: "Parts" },
          ]}
          onChange={setTab}
        />
      </div>
      <div className={c("shape-grid")}>
        {tab === "shapes"
          ? SHAPES.map((s) => (
              <button
                key={s.kind}
                type="button"
                className={c("shape-tile")}
                onClick={() => {
                  close();
                  act.addShape(s.kind);
                }}
              >
                <Icon name={s.kind} size={24} />
                <span>{s.label}</span>
              </button>
            ))
          : PARTS.map((p) => (
              <button
                key={p.kind}
                type="button"
                className={c("shape-tile")}
                onClick={() => {
                  close();
                  act.addPart(p.kind);
                }}
              >
                <Icon name={p.icon} size={24} />
                <span>{p.label}</span>
              </button>
            ))}
      </div>
      {tab === "shapes" && (
        <>
          <MenuSep />
          <MenuItem
            onClick={() => {
              close();
              st.set({ dialog: "litho" });
            }}
          >
            Lithophane from a photo...
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              notify("In the app this opens a picture from your PC to wrap onto a curved surface.");
            }}
          >
            Wrap Picture...
          </MenuItem>
          <MenuItem
            onClick={() => {
              close();
              act.info("Roller stamp: pick a picture or words, and it wraps around a roller you can print.");
            }}
          >
            Roller stamp...
          </MenuItem>
        </>
      )}
      <MenuSep />
      <MenuItem
        onClick={() => {
          close();
          notify("In the app this opens a model file from your PC.");
        }}
        hint="Ctrl+I"
      >
        Import a model (STL, OBJ, 3MF, STEP, PLY, GLB)...
      </MenuItem>
    </>
  );
}

export function Toolbar() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const { notify } = useDemo();
  const advanced = s.mode === "advanced";
  const save = () => {
    notify(`In the app this saves "${s.fileName}.rv3d" on your PC.`);
    st.set({ dirty: false });
  };
  const startSketch = () => st.set({ tool: { kind: "sketch", tool: "rect", shapes: [], draft: [] }, panel: "workspace" });

  return (
    <div className={c("toolbar-main")}>
      <Menu
        trigger={(open, toggle) => (
          <button type="button" className={c("tbtn", open && "on")} onClick={toggle} title="New, open, save, import, export and recent files">
            <Icon name="file" size={15} />
            <span>File</span>
          </button>
        )}
      >
        {(close) => {
          const run = (f: () => void) => () => {
            close();
            f();
          };
          return (
            <>
              <MenuItem onClick={run(act.newProject)} hint="Ctrl+N">
                New project
              </MenuItem>
              <MenuItem onClick={run(() => st.set({ dialog: "templates-new" }))}>New from template...</MenuItem>
              <MenuItem onClick={run(() => notify("In the app this opens a project from your PC."))} hint="Ctrl+O">
                Open...
              </MenuItem>
              <MenuItem onClick={run(save)} hint="Ctrl+S">
                Save
              </MenuItem>
              <MenuItem onClick={run(() => notify("In the app this asks where to save the project on your PC."))} hint="Ctrl+Shift+S">
                Save as...
              </MenuItem>
              <MenuSep />
              <MenuItem onClick={run(() => notify("In the app this opens a model file from your PC."))} hint="Ctrl+I">
                Import a model (STL, OBJ, 3MF, STEP, PLY, GLB)...
              </MenuItem>
              <MenuItem onClick={run(() => st.set({ dialog: "export" }))} hint="Ctrl+E">
                Export...
              </MenuItem>
              <MenuItem onClick={run(() => notify("In the app this saves a picture of your model on your PC."))}>Save picture...</MenuItem>
              <MenuItem onClick={run(() => notify("In the app this saves a spinning video of your model on your PC."))}>Spin video...</MenuItem>
              <MenuSep />
              <div className={c("menu-heading")}>Recent</div>
              {["Desk organizer.rv3d", "Plant pot.rv3d", "owl.stl", "phone stand v2.3mf"].map((r) => (
                <MenuItem key={r} onClick={run(() => notify(`In the app this opens "${r}" from your PC.`))}>
                  {r}
                </MenuItem>
              ))}
            </>
          );
        }}
      </Menu>
      <Menu
        trigger={(open, toggle) => (
          <button type="button" className={c("tbtn", open && "on")} onClick={toggle} title="Help, tutorial and templates">
            <Icon name="help" size={15} />
            <span>Help</span>
          </button>
        )}
      >
        {(close) => {
          const run = (f: () => void) => () => {
            close();
            f();
          };
          return (
            <>
              <MenuItem onClick={run(() => act.info("Ask RevinHi answers questions about the app and can do steps for you. It runs on your PC."))}>Ask RevinHi...</MenuItem>
              <MenuItem onClick={run(() => act.info("The tutorial walks you through Add, Cut, sizes and Export in a minute."))}>Tutorial</MenuItem>
              <MenuItem onClick={run(() => st.set({ dialog: "templates-add" }))}>Templates...</MenuItem>
              <MenuSep />
              <MenuItem onClick={run(() => st.set({ dialog: "keys" }))}>Keyboard shortcuts</MenuItem>
              <MenuItem onClick={run(() => st.set({ dialog: "news" }))}>What&apos;s new</MenuItem>
              <MenuItem onClick={run(() => st.set({ dialog: "about" }))}>About RevinHi 3D</MenuItem>
            </>
          );
        }}
      </Menu>
      <button type="button" className={c("tbtn icon")} disabled={!s.past.length} onClick={act.undo} title="Undo (Ctrl+Z)">
        <Icon name="undo" size={16} />
      </button>
      <button type="button" className={c("tbtn icon")} disabled={!s.future.length} onClick={act.redo} title="Redo (Ctrl+Y)">
        <Icon name="redo" size={16} />
      </button>
      <span className={c("tsep")} />

      <Menu className="add-menu" trigger={(open, toggle) => <Verb icon="plus" label="Add" onClick={toggle} active={open} title="Add a shape, a part (bolts, gears, boxes) or a model file" />}>
        {(close) => <AddMenuBody close={close} />}
      </Menu>
      {(["cut", "join"] as const).map((kind) => {
        const label = kind === "cut" ? "Cut" : "Join";
        return (
          <Menu
            key={kind}
            trigger={(open, toggle) => (
              <SplitButton
                icon={kind}
                label={label}
                open={open}
                toggle={toggle}
                onClick={() => act.combine(kind)}
                title={kind === "cut" ? "Cut: click the object to cut, Shift-click the shape that cuts it, then click Cut" : "Join: select two or more objects and merge them into one"}
              />
            )}
          >
            {(close) => (
              <>
                <MenuItem
                  onClick={() => {
                    close();
                    act.combine(kind, true);
                  }}
                  hint={s.keepEditable ? "Default" : undefined}
                >
                  {label}, keep editable
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    close();
                    act.combine(kind, false);
                  }}
                  hint={!s.keepEditable ? "Default" : undefined}
                >
                  {label} and apply now
                </MenuItem>
                <div className={c("menu-note")}>Editable cuts and joins can still be moved and changed later. Applied ones become one plain shape. Change the default in Settings.</div>
                {kind === "cut" && advanced && (
                  <>
                    <MenuSep />
                    <MenuItem
                      onClick={() => {
                        close();
                        act.info("Click the object to split, then Shift-click the shape that splits it, then Split.");
                      }}
                    >
                      Split into two parts
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        close();
                        act.startSplit();
                      }}
                    >
                      Cut along the slice plane
                    </MenuItem>
                  </>
                )}
              </>
            )}
          </Menu>
        );
      })}
      <Menu trigger={(open, toggle) => <Verb icon="draw" label="Draw" onClick={toggle} active={open || s.tool?.kind === "sketch"} title="Draw outlines on the grid or on a face, then make them 3D" />}>
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                close();
                startSketch();
              }}
            >
              Draw on the grid
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                startSketch();
                act.info("In the app you click a face first and draw right on it. Here you draw on the grid.");
              }}
            >
              Draw on a face...
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                act.info("Trace a face: click a face and its exact outline becomes a drawing you can pull out or push in.");
              }}
            >
              Trace a face...
            </MenuItem>
            <MenuSep />
            <MenuItem
              onClick={() => {
                close();
                notify("In the app this opens an SVG or DXF file from your PC.");
              }}
            >
              Import outline (SVG, DXF)...
            </MenuItem>
            <div className={c("menu-note")}>Draw lines, rectangles, circles, arcs and curves. Then pick the drawing and use Extrude or Revolve to make it 3D.</div>
          </>
        )}
      </Menu>
      <Verb icon="text" label="Text" onClick={act.addText} title="Add 3D text (change the words, font and size on the right)" />
      <Verb icon="logo" label="Logo" onClick={() => st.set({ dialog: "logo" })} title="Turn a picture, SVG or DXF into a raised logo" />
      <Verb icon="generate" label="Generate" active={s.gen.open} onClick={() => st.set({ gen: { ...s.gen, open: !s.gen.open }, panel: "workspace" })} title="Make a 3D model from a picture or a description (runs on this PC)" />
      <Verb
        icon="measure"
        label="Measure"
        active={s.tool?.kind === "measure"}
        onClick={() => st.set({ tool: s.tool?.kind === "measure" ? null : { kind: "measure", mode: "distance", pts: [] }, panel: "workspace" })}
        title="Measure distances, angles, circles and wall thickness"
      />
      <Verb icon="inspect" label="Check" active={s.checks.open} onClick={() => st.set({ checks: { ...s.checks, open: !s.checks.open }, panel: "workspace" })} title="Check for print problems: overhangs that need support, walls too thin to print, gaps in the surface." />
      <Menu
        trigger={(open, toggle) => (
          <SplitButton icon="send" label="Slicer" open={open} toggle={toggle} onClick={() => st.set({ dialog: "slicer" })} title="Open the model in your slicer (Bambu Studio, OrcaSlicer, PrusaSlicer, Cura...)" />
        )}
      >
        {(close) => {
          const run = (f: () => void) => () => {
            close();
            f();
          };
          return (
            <>
              <MenuItem onClick={run(() => st.set({ dialog: "slicer" }))}>Send to slicer...</MenuItem>
              <MenuItem onClick={run(() => st.set({ checks: { ...s.checks, open: true } }))}>Check for print problems</MenuItem>
              <MenuItem onClick={run(() => st.set({ checks: { ...s.checks, open: true, report: "done" } }))}>Will this print?</MenuItem>
              <MenuSep />
              <MenuItem onClick={run(() => act.startSplit())}>Split to fit the bed</MenuItem>
              <MenuItem onClick={run(() => act.info("Make it flexi turns a model into a toy with moving joints that prints in one piece."))}>Make it flexi</MenuItem>
              <MenuItem onClick={run(() => act.info(s.selection.length ? "Hollowed: the inside is empty now, with a 2 mm wall." : "Select the object to hollow first."))}>Hollow</MenuItem>
              <MenuItem onClick={run(() => notify("In the app this opens a picture from your PC to wrap onto the model."))}>Wrap Picture...</MenuItem>
              {advanced && <MenuItem onClick={run(() => act.info("Paint faces: brush colors onto the model for a multi-color 3MF."))}>Paint faces</MenuItem>}
              <div className={c("menu-note")}>Split cuts a big model into parts that fit your printer. Hollow empties the inside and keeps a wall. Check only shows problems, it never changes the model.</div>
            </>
          );
        }}
      </Menu>
      <Verb icon="export" label="Export" onClick={() => st.set({ dialog: "export" })} title="Save the model as STL, 3MF, OBJ or GLB (Ctrl+E)" />
      <Menu trigger={(open, toggle) => <Verb icon="camera" label="Picture" onClick={toggle} active={open} title="Save a picture or a spinning video of your model, or make a listing pack (Sell It Kit)" />}>
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                close();
                notify("In the app this saves a picture of your model on your PC.");
              }}
            >
              Save picture...
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                notify("In the app this saves a spinning video of your model on your PC.");
              }}
            >
              Spin video...
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                notify("In the app this saves listing photos and a description to a folder on your PC.");
              }}
            >
              Sell It Kit...
            </MenuItem>
          </>
        )}
      </Menu>
      {advanced && <Verb icon="sculpt" label="Sculpt" onClick={() => act.info(s.selection.length ? "Sculpt: push, pull, smooth, pinch and inflate the surface with brushes." : "Select the object to sculpt first.")} title="Sculpt the selected object with brushes" />}
      {advanced && (
        <Menu trigger={(open, toggle) => <Verb icon="fix" label="Fix" onClick={toggle} active={open} title="Optional fixes for broken models. They only run when you click them." />}>
          {(close) => (
            <>
              {["Close holes", "Fix flipped faces", "Remove duplicates"].map((f) => (
                <MenuItem
                  key={f}
                  onClick={() => {
                    close();
                    act.fix(f);
                  }}
                >
                  {f}
                </MenuItem>
              ))}
              <div className={c("menu-note")}>Cuts and joins work on broken models as they are, so you never need these. They change the selected object only when you click one, and Undo takes it back.</div>
            </>
          )}
        </Menu>
      )}

      <span style={{ flex: 1 }} />
      <Segmented<"mm" | "in">
        value={s.unit}
        options={[
          { value: "mm", label: "mm", title: "Show sizes in millimeters (you can always type either)" },
          { value: "in", label: "in", title: "Show sizes in inches (you can always type either)" },
        ]}
        onChange={(unit) => st.set({ unit })}
      />
      <Segmented<"simple" | "advanced">
        value={s.mode}
        options={[
          { value: "simple", label: "Simple", title: "The main tools only" },
          { value: "advanced", label: "Advanced", title: "Adds sculpting, face editing, fixes and expert settings" },
        ]}
        onChange={(mode) => st.set({ mode })}
      />
      <button type="button" className={c("tbtn icon", s.panel === "settings" && "on")} onClick={() => st.set({ panel: s.panel === "settings" ? "workspace" : "settings" })} title="Settings: units, printer bed, shortcuts, license and updates">
        <Icon name="settings" size={16} />
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ layers (panels/LayersPanel.tsx)

function nodeIcon(doc: Doc, n: SNode): IconName {
  if (n.type === "group") {
    if (n.baked) return "cube";
    return isComputed(doc, n.id) ? (n.purpose === "join" ? "join" : "cut") : "folder";
  }
  if (n.mode === "hole") return "hole";
  switch (n.source.kind) {
    case "shape":
      return n.source.shape;
    case "text":
      return "text";
    case "drawing":
      return n.source.origin === "logo" ? "logo" : "draw";
    case "part":
      return ({ bolt: "bolt", nut: "nut", gear: "gear", hinge: "hinge", box: "boxLid", lid: "boxLid", threadedHole: "threadHole" } as const)[n.source.part];
    default:
      return "cube";
  }
}

function LayerRow({ id, depth, collapsed, toggle }: { id: string; depth: number; collapsed: Set<string>; toggle: (id: string) => void }) {
  const s = useApp();
  const act = useActions();
  const [editing, setEditing] = useState(false);
  const n = s.doc.nodes[id];
  if (!n) return null;
  const isGroup = n.type === "group" && !n.baked;
  const open = isGroup && !collapsed.has(id);
  const selected = s.selection.includes(id);
  const flag = (key: "visible" | "locked" | "ghost", label: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    act.setNode(id, { [key]: !n[key] } as Partial<Layer>, `${label} ${n.name}`);
  };
  return (
    <>
      <div
        className={c("layer-row", selected && "selected", !n.visible && "hidden")}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={(e) => act.select([id], e.shiftKey || e.ctrlKey ? "toggle" : "replace")}
        onDoubleClick={() => setEditing(true)}
      >
        <button
          type="button"
          className={c("layer-caret", !isGroup && "invisible")}
          onClick={(e) => {
            e.stopPropagation();
            toggle(id);
          }}
          tabIndex={-1}
        >
          <Icon name={open ? "chevronDown" : "chevronRight"} size={12} />
        </button>
        <span className={c("layer-swatch")} style={{ background: n.type === "layer" && n.mode === "hole" ? "transparent" : n.color }} />
        <span className={c("layer-icon")}>
          <Icon name={nodeIcon(s.doc, n)} size={14} />
        </span>
        {editing ? (
          <input
            className={c("layer-rename")}
            autoFocus
            defaultValue={n.name}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={(e) => {
              setEditing(false);
              const v = e.target.value.trim();
              if (v && v !== n.name) act.setNode(id, { name: v }, `Rename to ${v}`);
            }}
          />
        ) : (
          <span className={c("layer-name")} title={n.name}>
            {n.name}
          </span>
        )}
        {n.type === "layer" && n.mode === "hole" && <span className={c("layer-tag")}>Hole</span>}
        <span className={c("layer-flags")}>
          <button type="button" className={c("flag", n.ghost && "on")} onClick={flag("ghost", n.ghost ? "Unghost" : "Ghost")} title="Ghost: see-through and not clickable in the view">
            <Icon name="ghost" size={13} />
          </button>
          <button type="button" className={c("flag", n.locked && "on")} onClick={flag("locked", n.locked ? "Unlock" : "Lock")} title={n.locked ? "Unlock" : "Lock"}>
            <Icon name={n.locked ? "lock" : "unlock"} size={13} />
          </button>
          <button type="button" className={c("flag", !n.visible && "on")} onClick={flag("visible", n.visible ? "Hide" : "Show")} title={n.visible ? "Hide" : "Show"}>
            <Icon name={n.visible ? "eye" : "eyeOff"} size={13} />
          </button>
        </span>
      </div>
      {open && (n as Group).children.map((ch) => <LayerRow key={ch} id={ch} depth={depth + 1} collapsed={collapsed} toggle={toggle} />)}
    </>
  );
}

function HeadButton({ icon, title, onClick }: { icon: IconName; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={c("panel-head-btn")}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}

function PanelRail({ icon, label, side, count, onOpen }: { icon: IconName; label: string; side: "left" | "right"; count?: number; onOpen: () => void }) {
  return (
    <button type="button" className={c("panel panel-rail", side === "left" ? "rail-left" : "rail-right")} onClick={onOpen} title={`Show ${label}`}>
      <Icon name={icon} size={15} />
      <span className={c("rail-label")}>{label}</span>
      {count !== undefined && <span className={c("rail-count")}>{count}</span>}
    </button>
  );
}

export function LayersPanel() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  if (!s.layersOpen) return <PanelRail icon="layers" label="Layers" side="left" count={s.doc.roots.length} onOpen={() => st.set({ layersOpen: true })} />;
  const groups = Object.values(s.doc.nodes)
    .filter((n) => n.type === "group")
    .map((n) => n.id);
  return (
    <div className={c("panel-wrap")} style={{ width: 240 }}>
      <div className={c("panel layers-panel")}>
        <div className={c("panel-head")}>
          <Icon name="layers" size={14} />
          <span>Layers</span>
          <span className={c("panel-head-tools")}>
            <HeadButton icon="foldAll" title="Fold all folders" onClick={() => setCollapsed(new Set(groups))} />
            <HeadButton icon="unfoldAll" title="Unfold all folders" onClick={() => setCollapsed(new Set())} />
            <HeadButton icon="chevronLeft" title="Hide the layers panel (Tab hides all panels)" onClick={() => st.set({ layersOpen: false })} />
          </span>
        </div>
        <div className={c("layer-list")} onClick={(e) => e.target === e.currentTarget && act.select([])}>
          {s.doc.roots.length === 0 && <div className={c("empty-hint")}>Nothing here yet. Use Add to place a shape, or import a model.</div>}
          {s.doc.roots.map((id) => (
            <LayerRow
              key={id}
              id={id}
              depth={0}
              collapsed={collapsed}
              toggle={(x) =>
                setCollapsed((cs) => {
                  const nx = new Set(cs);
                  if (nx.has(x)) nx.delete(x);
                  else nx.add(x);
                  return nx;
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ properties (panels/PropertiesPanel.tsx)

function Btn({ icon, label, onClick, title, kind = "secondary" }: { icon: IconName; label: string; onClick: () => void; title?: string; kind?: string }) {
  return (
    <button type="button" className={c(`btn btn-${kind} btn-small btn-icon-label`)} onClick={onClick} title={title ?? label}>
      <Icon name={icon} size={13} />
      {label}
    </button>
  );
}

function TransformFields({ node, disabled }: { node: SNode; disabled: boolean }) {
  const s = useApp();
  const act = useActions();
  const [uniform, setUniform] = useState(true);
  const pos = nodePosition(s.doc, node.id);
  const size = boxSize(nodeBox(s.doc, node.id));
  const axes = ["X", "Y", "Z"] as const;
  return (
    <PropSection id="transform" title="Size and position">
      <div className={c("psub")}>Position</div>
      <div className={c("field-row")}>
        {axes.map((a, i) => (
          <LengthField key={a} label={a} unit={s.unit} valueMm={pos[i]} disabled={disabled} onCommit={(mm) => act.setPosition(node.id, i, mm)} />
        ))}
      </div>
      <div className={c("psub")}>
        Size
        <button type="button" className={c("mini-toggle", uniform && "on")} onClick={() => setUniform(!uniform)} title="Keep proportions when changing one size">
          <Icon name={uniform ? "lock" : "unlock"} size={11} />
          Keep proportions
        </button>
      </div>
      <div className={c("field-row")}>
        {(["W", "D", "H"] as const).map((a, i) => (
          <LengthField key={a} label={a} unit={s.unit} valueMm={size[i]} min={0.001} disabled={disabled} onCommit={(mm) => act.setSize(node.id, i, mm, uniform)} />
        ))}
      </div>
      <div className={c("psub")}>Rotation</div>
      <div className={c("field-row")}>
        {axes.map((a, i) => (
          <AngleField key={a} label={a} value={node.rot[i]} disabled={disabled} onCommit={(deg) => act.setRotation(node.id, i, deg)} />
        ))}
      </div>
      {s.mode === "advanced" && node.type === "layer" && (
        <>
          <div className={c("psub")}>Scale</div>
          <div className={c("field-row")}>
            {axes.map((a, i) => (
              <CountField
                key={a}
                label={a}
                suffix="%"
                value={Math.abs(node.scale[i]) * 100}
                disabled={disabled}
                onCommit={(pct) => {
                  if (!pct) return;
                  const sc = [...node.scale] as Vec3;
                  sc[i] = (Math.sign(sc[i]) || 1) * (pct / 100);
                  act.setNode(node.id, { scale: sc }, `Scale ${node.name}`);
                }}
              />
            ))}
          </div>
        </>
      )}
    </PropSection>
  );
}

function ShapeFields({ layer, disabled }: { layer: Layer; disabled: boolean }) {
  const s = useApp();
  const act = useActions();
  const src = layer.source;
  if (layer.plain || (src.kind !== "shape" && src.kind !== "part")) return null;
  const info = src.kind === "shape" ? SHAPE_BY_KIND[src.shape] : (PARTS.find((p) => p.kind === src.part) ?? { label: "Lid", params: PARTS.find((p) => p.kind === "box")!.params });
  const set = (key: string, v: number) => act.setNode(layer.id, { source: { ...src, params: { ...src.params, [key]: v } } as Layer["source"] }, `Change ${info.label.toLowerCase()} ${key}`);
  return (
    <PropSection id={`shape-${src.kind}`} title={src.kind === "shape" ? `${info.label} shape` : info.label}>
      <div className={c("field-grid")}>
        {info.params.map((p) =>
          p.kind === "length" && !p.label.includes("(M)") ? (
            <LengthField key={p.key} label={p.label} unit={s.unit} valueMm={src.params[p.key]} min={p.min} disabled={disabled} onCommit={(mm) => set(p.key, mm)} />
          ) : (
            <CountField key={p.key} label={p.label.replace(" (M)", "")} value={src.params[p.key]} min={p.min} max={p.max} disabled={disabled} onCommit={(n) => set(p.key, p.kind === "count" ? Math.round(n) : n)} suffix={p.label.includes("(M)") ? "M" : undefined} />
          ),
        )}
      </div>
    </PropSection>
  );
}

function TextProps({ layer, disabled }: { layer: Layer; disabled: boolean }) {
  const s = useApp();
  const act = useActions();
  if (layer.source.kind !== "text") return null;
  const spec = layer.source.spec;
  const set = (p: Partial<TextSpec>, label: string) => act.setNode(layer.id, { source: { kind: "text", spec: { ...spec, ...p } } }, label);
  return (
    <>
      <PropSection id="text" title="Text">
        <textarea
          key={`${layer.id}:${spec.text}`}
          className={c("text-input text-area")}
          defaultValue={spec.text}
          disabled={disabled}
          rows={Math.min(4, spec.text.split("\n").length + 1)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          onBlur={(e) => {
            const v = e.target.value;
            if (v.trim() && v !== spec.text) set({ text: v }, "Change text");
          }}
          placeholder="Type your text"
          title="Enter applies. Shift+Enter starts a new line."
        />
        <div className={c("font-row")}>
          <select className={c("select")} value={spec.font} disabled={disabled} onChange={(e) => set({ font: e.target.value }, `Font ${e.target.value}`)} aria-label="Font" style={{ fontFamily: spec.font }}>
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button type="button" className={c("btn btn-secondary btn-small bold-btn", spec.bold && "on")} onClick={() => set({ bold: !spec.bold }, spec.bold ? "Not bold" : "Bold")} disabled={disabled}>
            Bold
          </button>
        </div>
        <div className={c("field-grid")}>
          <LengthField label="Letter height" unit={s.unit} valueMm={spec.size} min={0.5} disabled={disabled} onCommit={(size) => set({ size }, "Text size")} />
          <LengthField label="Letter spacing" unit={s.unit} valueMm={spec.spacing} disabled={disabled} onCommit={(spacing) => set({ spacing }, "Letter spacing")} />
          <LengthField
            label="Curve radius"
            unit={s.unit}
            valueMm={spec.curve}
            disabled={disabled}
            onCommit={(curve) => set({ curve }, curve ? "Curve text" : "Straighten text")}
            title="Bend the text around a circle of this radius. 0 = straight; negative bends it the other way."
          />
        </div>
        {s.mode === "advanced" && (
          <div className={c("prop-line")}>
            <span className={c("prop-k")}>Mirrored (for stamps)</span>
            <Toggle checked={spec.mirror} disabled={disabled} onChange={(mirror) => set({ mirror }, mirror ? "Mirror text" : "Unmirror text")} label="Mirrored" />
          </div>
        )}
      </PropSection>
      <PropSection id="make3d-text" title="Depth">
        <div className={c("field-grid")}>
          <LengthField label="Depth" unit={s.unit} valueMm={spec.depth} min={0.05} disabled={disabled} onCommit={(depth) => set({ depth }, "Change height")} />
          <LengthField label="Bevel" unit={s.unit} valueMm={spec.bevel} min={0} disabled={disabled} onCommit={(bevel) => set({ bevel }, "Bevel edges")} title="Slants the top edges" />
        </div>
        <div className={c("prop-line")}>
          <span className={c("prop-k")}>Go the other way</span>
          <Toggle checked={spec.flip} disabled={disabled} onChange={(flip) => set({ flip }, flip ? "Extrude the other way" : "Extrude outward")} label="Go the other way" />
        </div>
      </PropSection>
      <SurfaceButtons layer={layer} />
    </>
  );
}

function SurfaceButtons({ layer }: { layer: Layer }) {
  const st = useStore();
  const act = useActions();
  const pick = (purpose: "emboss" | "engrave") => {
    st.set({ tool: { kind: "pick", purpose, layerId: layer.id } });
    act.info(purpose === "emboss" ? "Click the surface to raise this onto." : "Click the surface to cut this into.");
  };
  return (
    <PropSection id="on-surface" title="On a surface">
      <div className={c("prop-actions")}>
        <Btn icon="raise" label="Raise onto..." onClick={() => pick("emboss")} title="Click a surface on another object: this is raised out of it, following its shape" />
        <Btn icon="engrave" label="Cut into..." onClick={() => pick("engrave")} title="Click a surface on another object: this is cut into it, following its shape" />
      </div>
    </PropSection>
  );
}

function DrawingProps({ layer, disabled }: { layer: Layer; disabled: boolean }) {
  const s = useApp();
  const act = useActions();
  const src = layer.source;
  if (src.kind !== "drawing" || layer.plain) return null;
  const set = (p: Partial<typeof src>, label: string) => act.setNode(layer.id, { source: { ...src, ...p } }, label);
  return (
    <>
      <PropSection id="make3d" title="Make 3D">
        <Segmented<"flat" | "extrude" | "revolve">
          value={src.solid}
          options={[
            { value: "flat", label: "Flat" },
            { value: "extrude", label: "Extrude" },
            { value: "revolve", label: "Revolve" },
          ]}
          onChange={(k) => set({ solid: k }, k === "flat" ? "Make flat" : k === "extrude" ? "Extrude" : "Revolve")}
        />
        {src.solid === "extrude" && (
          <div className={c("field-grid")}>
            <LengthField label="Height" unit={s.unit} valueMm={src.height} min={0.05} disabled={disabled} onCommit={(height) => set({ height }, "Change height")} />
          </div>
        )}
        {src.solid === "revolve" && <div className={c("prop-note")}>The outline turns around the drawing&apos;s center line, like a vase on a potter&apos;s wheel.</div>}
        {src.solid === "flat" && <div className={c("prop-note")}>A flat drawing. Pick Extrude to pull it up into a solid.</div>}
      </PropSection>
      <SurfaceButtons layer={layer} />
    </>
  );
}

function SingleNode({ id }: { id: string }) {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const node = s.doc.nodes[id];
  if (!node) return null;
  const locked = node.locked;
  const computed = isComputed(s.doc, id);
  const isHole = node.type === "layer" && node.mode === "hole";
  const advanced = s.mode === "advanced";
  const tris = node.type === "layer" ? localOf(node).parts.reduce((a, p) => a + p.faces.reduce((b, f) => b + f.loops[0].length - 2, 0), 0) : 0;
  return (
    <div className={c("props")}>
      <div className={c("prop-head")}>
        <label className={c("color-well", (locked || isHole) && "disabled")} title="Color">
          <span style={{ background: node.color }} />
          <input type="color" value={node.color} disabled={locked || isHole} onChange={(e) => act.setNode(id, { color: e.target.value }, `Color ${node.name}`)} />
        </label>
        <input
          key={node.name}
          className={c("text-input prop-name")}
          defaultValue={node.name}
          disabled={locked}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== node.name) act.setNode(id, { name: v }, `Rename to ${v}`);
          }}
        />
      </div>
      {!isHole && (
        <div className={c("color-row")}>
          {FILAMENTS.map((f, i) => (
            <button key={f.name} type="button" className={c("swatch", f.color === node.color && "on")} style={{ background: f.color }} disabled={locked} onClick={() => act.setNode(id, { color: f.color }, `Color ${node.name}`)} title={`${i + 1}: ${f.name}`} />
          ))}
          <button type="button" className={c("icon-btn")} onClick={() => act.info("Colors: up to 16 filament colors. In a 3MF, color 1 is filament slot 1, color 2 slot 2, and so on.")} title="Edit colors">
            <Icon name="palette" size={14} />
          </button>
        </div>
      )}
      {locked && <div className={c("prop-note")}>Locked. Unlock it in Layers to make changes.</div>}

      {node.type === "layer" && (
        <div className={c("prop-line")}>
          <span className={c("prop-k")}>Type</span>
          <Segmented<"solid" | "hole">
            value={node.mode}
            options={[
              { value: "solid", label: "Solid" },
              { value: "hole", label: "Hole" },
            ]}
            onChange={(mode) => !locked && act.setNode(id, { mode }, mode === "hole" ? "Make hole" : "Make solid")}
          />
        </div>
      )}
      {isHole && !node.parent && <div className={c("prop-note")}>A hole cuts the solids in its group. Select it with a solid and use Cut or Group.</div>}

      {computed && node.type === "group" && (
        <div className={c("computed-card")}>
          <div className={c("prop-line")}>
            <span className={c("prop-k")}>{node.purpose === "join" ? "Join" : node.purpose === "cut" ? "Cut" : "Group with holes"}</span>
            <span className={c("state ok")}>Up to date</span>
          </div>
          <div className={c("prop-note")}>Still editable: select a part in Layers (or click a hole) and move it, and this updates.</div>
          <Btn icon="bake" label="Apply (flatten)" kind="primary" onClick={() => act.bake(id)} title="Turn this into one plain shape (Ctrl+B)" />
        </div>
      )}

      {node.type === "layer" && <TextProps layer={node} disabled={locked} />}
      {node.type === "layer" && <DrawingProps layer={node} disabled={locked} />}
      <TransformFields node={node} disabled={locked} />
      {node.type === "layer" && <ShapeFields layer={node} disabled={locked} />}
      {!isHole && (
        <PropSection id="copies" title="Copies and mirror">
          <div className={c("prop-actions")}>
            <Btn icon="pattern" label="Pattern in a line" onClick={() => act.info("Pattern in a line: editable copies in a row. Set how many and how far apart.")} />
            <Btn icon="radial" label="Pattern in a circle" onClick={() => act.info("Pattern in a circle: copies around a center, at an exact distance.")} title="Copies around a center: an object's middle (e.g. clips around a wheel), the bed center or a point, at an exact distance" />
          </div>
        </PropSection>
      )}
      <PropSection id="arrange-one" title="Arrange">
        <div className={c("prop-actions")}>
          <Btn
            icon="layflat"
            label="Lay flat"
            onClick={() => {
              st.set({ tool: { kind: "pick", purpose: "layflat" } });
              act.info("Click the face that should sit on the bed.");
            }}
            title="Click a face: the object turns so that face sits on the bed"
          />
          <Btn icon="mirror" label="Mirror X" onClick={() => act.mirror(0)} />
          <Btn icon="mirror" label="Mirror Y" onClick={() => act.mirror(1)} />
        </div>
        <div className={c("field-grid")}>
          <CountField label="Scale" suffix="%" value={100} min={0.1} max={100000} onCommit={(pct) => act.setScalePct(id, pct)} disabled={locked} />
        </div>
      </PropSection>
      {!isHole && (
        <PropSection id="print" title="Print">
          <div className={c("prop-actions")}>
            {node.type === "layer" && <Btn icon="hollow" label="Hollow" onClick={() => act.info("Hollowed: the inside is empty now, with a 2 mm wall. Add a drain hole for resin.")} title="Empty the inside, keeping a wall (saves material, needed for resin)" />}
            <Btn icon="threadHole" label="Add thread" onClick={() => act.info("Click on the inside wall of a round hole, or on the side of a round peg, to thread it.")} title="Click a round hole or peg on any object: a thread is cut there" />
            <Btn icon="splitBed" label="Split to fit the bed" onClick={() => act.startSplit(id)} title="Cut it into parts that each fit your printer" />
            <Btn icon="flexi" label="Make it flexi" onClick={() => act.info("Make it flexi turns a model into a toy with moving joints that prints in one piece.")} title="Turn it into a print-in-place toy with moving joints" />
            <Btn icon="send" label="Send to slicer" onClick={() => st.set({ dialog: "slicer" })} />
          </div>
        </PropSection>
      )}
      {advanced && node.type === "layer" && (
        <PropSection id="mesh-check" title="Mesh check" defaultOpen={false}>
          <div className={c("prop-stats")}>
            <div className={c("prop-line")}>
              <span className={c("prop-k")}>Triangles</span>
              <span>{tris.toLocaleString("en-US")}</span>
            </div>
            <div className={c("prop-line")}>
              <span className={c("prop-k")}>Closed solid</span>
              <span className={c("text-success")}>Yes</span>
            </div>
          </div>
        </PropSection>
      )}

      <div className={c("prop-actions prop-actions-end")}>
        <Btn icon="bed" label="Put on bed" onClick={() => act.putOnBed([id])} />
        <Btn icon="copy" label="Duplicate" onClick={act.duplicateSelection} />
        {node.type === "group" && !node.baked && <Btn icon="ungroup" label="Ungroup" onClick={act.ungroup} />}
        {node.type === "layer" && !node.plain && (node.source.kind === "shape" || node.source.kind === "text" || node.source.kind === "drawing") && <Btn icon="bake" label="Apply" onClick={() => act.bake(id)} title="Make it a plain shape (its settings stop being editable)" />}
        <Btn icon="trash" label="Delete" kind="danger" onClick={act.deleteSelection} />
      </div>
      {node.type === "group" && node.baked && <div className={c("prop-note")}>Applied: one plain shape. Undo takes it back.</div>}
    </div>
  );
}

function MultiSelection({ ids }: { ids: string[] }) {
  const s = useApp();
  const act = useActions();
  const b = selectionBox(s.doc, ids);
  const size = isEmptyBox(b) ? [0, 0, 0] : boxSize(b);
  return (
    <div className={c("props")}>
      <div className={c("prop-title")}>{ids.length} items selected</div>
      <div className={c("prop-note")}>Size together: {formatSize(size, s.unit)}</div>
      <div className={c("prop-note")}>To cut: the first item you clicked is cut by the others. Holes always cut.</div>
      <div className={c("prop-actions prop-actions-end")}>
        <Btn icon="cut" label="Cut" kind="primary" onClick={() => act.combine("cut")} />
        <Btn icon="join" label="Join" kind="primary" onClick={() => act.combine("join")} />
        <Btn icon="group" label="Group" onClick={act.group} />
        <Btn icon="bed" label="Put on bed" onClick={() => act.putOnBed()} />
        <Btn icon="copy" label="Duplicate" onClick={act.duplicateSelection} />
        <Btn icon="trash" label="Delete" kind="danger" onClick={act.deleteSelection} />
      </div>
    </div>
  );
}

function HistoryPanel() {
  const s = useApp();
  const act = useActions();
  const rows: { label: string; i: number; state: "done" | "current" | "undone" }[] = [
    { label: "Opened", i: 0, state: s.past.length === 0 ? "current" : "done" },
    ...s.past.map((p, k) => ({ label: p.label, i: k + 1, state: (k + 1 === s.past.length ? "current" : "done") as "current" | "done" })),
    ...s.future.map((f, k) => ({ label: f.label, i: s.past.length + k + 1, state: "undone" as const })),
  ];
  return (
    <div className={c("panel history-panel")}>
      <div className={c("panel-head")}>
        <Icon name="history" size={14} />
        <span>History</span>
      </div>
      <div className={c("history-list")}>
        {rows.map((r) => (
          <button key={r.i} type="button" className={c("history-row", r.state === "current" && "current", r.state === "undone" && "undone")} onClick={() => act.jumpTo(r.i)}>
            <span className={c("history-thumb")}>
              <Icon name="cube" size={13} />
            </span>
            <span className={c("history-label")}>{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function RightColumn() {
  const s = useApp();
  const st = useStore();
  if (!s.rightOpen) return <PanelRail icon="settings" label="Properties" side="right" onOpen={() => st.set({ rightOpen: true })} />;
  const ids = s.selection.filter((id) => s.doc.nodes[id]);
  const folded = s.propsFolded;
  return (
    <div className={c("panel-wrap")} style={{ width: 320 }}>
      <div className={c("right-col")}>
        <div className={c("panel props-panel", folded && "folded")}>
          <div className={c("panel-head foldable")} onClick={() => st.set({ propsFolded: !folded })} title={folded ? "Unfold" : "Fold"}>
            <Icon name={folded ? "chevronRight" : "chevronDown"} size={12} />
            <Icon name="settings" size={14} />
            <span>Properties</span>
            <span className={c("panel-head-tools")}>
              <HeadButton icon="chevronRight" title="Hide the right panels (Tab hides all panels)" onClick={() => st.set({ rightOpen: false })} />
            </span>
          </div>
          {!folded && (
            <div className={c("panel-body")}>
              {ids.length === 0 && (
                <div className={c("empty-hint")}>
                  Click an object to see its size and position.
                  <br />
                  Type sizes in mm or inches, like <b>50</b>, <b>2in</b> or <b>1.5&quot;</b>.
                </div>
              )}
              {ids.length === 1 && <SingleNode key={ids[0]} id={ids[0]} />}
              {ids.length > 1 && <MultiSelection ids={ids} />}
            </div>
          )}
        </div>
        {s.mode === "advanced" && <HistoryPanel />}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ status bar

export function StatusBar() {
  const s = useApp();
  const count = Object.keys(s.doc.nodes).length;
  return (
    <div className={c("statusbar")}>
      <span className={c("status-dot", s.busy ? "busy" : "ok")} />
      <span>{s.busy ?? "Ready"}</span>
      <span className={c("status-sep")} />
      <span>
        {count} {count === 1 ? "layer" : "layers"}
        {s.selection.length ? `, ${s.selection.length} selected` : ""}
      </span>
      <span className={c("status-sep")} />
      <span>{triangles(s.doc).toLocaleString("en-US")} triangles</span>
      <span style={{ flex: 1 }} />
      <span>Bed: {bedOf(s.bed).label}</span>
      <span className={c("status-sep")} />
      <span>Snap {s.snap ? "on" : "off"}</span>
      <span className={c("status-sep")} />
      <span>Units: {s.unit === "mm" ? "millimeters" : "inches"}</span>
    </div>
  );
}
