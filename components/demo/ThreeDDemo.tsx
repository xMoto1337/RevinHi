"use client";

import { useState } from "react";
import { getProduct } from "@/lib/products";
import { AppWindow, useDemo } from "./AppWindow";
import { Dialogs, SettingsView } from "./threed-demo/dialogs";
import { LayersPanel, RightColumn, StatusBar, Toolbar } from "./threed-demo/panels";
import { ActionsContext, StoreContext, createStore, initialState, makeActions, useActions, useApp, useStore } from "./threed-demo/store";
import { CheckCard, GeneratePanel, MeasureBar, SketchBar, SplitBar } from "./threed-demo/tools";
import { c } from "./threed-demo/ui";
import { Viewport } from "./threed-demo/view";

/**
 * "Try the app" preview of RevinHi 3D: the real app's layout and wording rebuilt from its own
 * components and styles (revinhi-3d/src), with a desk organizer to edit. The 3D view is drawn as
 * flat SVG; cutting, sizes, units, templates, Generate and the rest work on sample data, and
 * anything that would open or save a file on the PC only shows a note.
 */

const PRODUCT = getProduct("3d");

function TitleBar() {
  const s = useApp();
  const st = useStore();
  return (
    <div className={c("titlebar")}>
      <div className={c("titlebar-drag")}>
        <span className={c("titlebar-title rgb-chase")}>REVINHI 3D</span>
        <span className={c("titlebar-file")}>
          {s.fileName}
          {s.dirty && <span className={c("dirty-dot")} title="Not saved" />}
        </span>
      </div>
      <div className={c("titlebar-extras")}>
        <div className={c("tier-pill")}>
          <span className={c("pill")}>
            <span className={c("pill-dot dot-warning")} />
            Free
          </span>
          <button className={c("btn btn-buy btn-small")} onClick={() => st.set({ upgrade: { feature: null } })} title="Pro saves full-detail files with no mark">
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

function ThreeDApp() {
  const s = useApp();
  const st = useStore();
  const act = useActions();
  const { notify } = useDemo();

  const onKey = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select")) return;
    const k = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    let handled = true;
    if (ctrl && k === "z") act.undo();
    else if (ctrl && k === "y") act.redo();
    else if (ctrl && k === "d") act.duplicateSelection();
    else if (ctrl && k === "s") {
      notify(`In the app this saves "${s.fileName}.rv3d" on your PC.`);
      st.set({ dirty: false });
    } else if (ctrl && k === "e") st.set({ dialog: "export" });
    else if (ctrl && k === "b" && s.selection[0]) act.bake(s.selection[0]);
    else if (ctrl) handled = false;
    else if (k === "delete" || k === "backspace") act.deleteSelection();
    else if (k === "w") st.set({ gizmo: "translate" });
    else if (k === "e") st.set({ gizmo: "rotate" });
    else if (k === "r") st.set({ gizmo: "scale" });
    else if (k === "s") st.set({ snap: !s.snap });
    else if (k === "f") act.frame();
    else if (k === "escape") {
      if (s.dialog || s.upgrade) st.set({ dialog: null, upgrade: null });
      else if (s.tool) st.set({ tool: null });
      else if (s.gen.open) st.set({ gen: { ...s.gen, open: false } });
      else act.select([]);
    } else handled = false;
    if (handled) e.preventDefault();
  };

  return (
    <div className={c("root")} tabIndex={-1} onKeyDown={onKey}>
      <TitleBar />
      <Toolbar />
      <div className={c("workspace")}>
        {s.panel === "settings" ? (
          <SettingsView />
        ) : (
          <>
            <LayersPanel />
            <div className={c("center")}>
              <Viewport>
                <SketchBar />
                <MeasureBar />
                <SplitBar />
                <CheckCard />
              </Viewport>
            </div>
            <RightColumn />
          </>
        )}
      </div>
      <StatusBar />
      <GeneratePanel />
      <Dialogs />
    </div>
  );
}

function Providers() {
  const [ctx] = useState(() => {
    const store = createStore(initialState());
    return { store, actions: makeActions(store) };
  });
  return (
    <StoreContext.Provider value={ctx.store}>
      <ActionsContext.Provider value={ctx.actions}>
        <ThreeDApp />
      </ActionsContext.Provider>
    </StoreContext.Provider>
  );
}

export default function ThreeDDemo() {
  return (
    <AppWindow title={PRODUCT.name} icon={PRODUCT.icon} accent={PRODUCT.accent} width={1360} height={896}>
      <Providers />
    </AppWindow>
  );
}
