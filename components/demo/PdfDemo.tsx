"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProduct } from "@/lib/products";
import { AppWindow, useDemo } from "./AppWindow";
import { LicenseView, SettingsView, UpgradeModal } from "./pdf/account";
import { RECENT, makeDoc, pageOf, sample, type Doc, type Feature, type PageRef, type RecentFile } from "./pdf/data";
import { EditorView } from "./pdf/editor";
import { HomeView, NewBlankDialog, type QuickTool } from "./pdf/home";
import type { Sig } from "./pdf/objects";
import { SignaturesView } from "./pdf/signatures";
import { ToolsView } from "./pdf/tools";
import { c } from "./pdf/ui";

/**
 * "Try the app" preview of RevinHi PDF: the real app's screens rebuilt from its own components and
 * styles (revinhi-pdf/src), with sample documents drawn as HTML. Editing, signing, forms and page
 * tools work on the samples; anything that would open, save or print a real file only shows a note.
 */

type Tab = "home" | "editor" | "tools" | "signatures" | "settings" | "license";

const NAV: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "editor", label: "Editor" },
  { id: "tools", label: "Tools" },
  { id: "signatures", label: "Signatures" },
  { id: "settings", label: "Settings" },
  { id: "license", label: "License" },
];

const PRODUCT = getProduct("pdf");

/** The documents open when the preview loads (fixed keys, so the page renders the same on the server). */
function seedDocs(): Doc[] {
  return ["agreement", "invoice", "proposal"].map((id) => {
    const sm = sample(id);
    const pages: PageRef[] = sm.kinds.map((kind, i) => ({ ...pageOf(kind), key: `seed-${id}-${i}` }));
    return { ...makeDoc(sm.title, pages, sm.outline), id: `seed-doc-${id}` };
  });
}

function PdfApp() {
  const { notify } = useDemo();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<Tab>("editor");
  const [docs, setDocs] = useState<Doc[]>(seedDocs);
  const [activeId, setActiveId] = useState<string | null>("seed-doc-agreement");
  const [toolPanel, setToolPanel] = useState<QuickTool>("merge");
  const [licensedKey, setLicensedKey] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<{ feature: Feature | null } | null>(null);
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [activeSig, setActiveSig] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentFile[]>(RECENT);
  const [newBlank, setNewBlank] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [author, setAuthor] = useState("");
  const keyRef = useRef<((e: React.KeyboardEvent) => void) | null>(null);
  const flags = useRef({ editNotice: false });
  const pro = !!licensedKey;

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const openPaywall = useCallback((feature: Feature | null) => setPaywall({ feature }), []);
  const updateDoc = useCallback((id: string, fn: (d: Doc) => Doc) => setDocs((list) => list.map((d) => (d.id === id ? fn(d) : d))), []);

  const addDoc = (d: Doc) => {
    setDocs((list) => [...list, d]);
    setActiveId(d.id);
    setTab("editor");
  };

  const openSample = (id: string) => {
    const sm = sample(id);
    const open = docs.find((d) => d.title === sm.title);
    setRecent((list) => [{ ...list.find((r) => r.sample === id)!, agoMin: 0 }, ...list.filter((r) => r.sample !== id)]);
    if (open) {
      setActiveId(open.id);
      setTab("editor");
    } else addDoc(makeDoc(sm.title, sm.kinds.map((k) => pageOf(k)), sm.outline));
  };

  const openSamples = (title: string, ids: string[]) => {
    const pages = ids.flatMap((id) => sample(id).kinds.map((k) => pageOf(k)));
    addDoc(makeDoc(title, pages));
  };

  const closeDoc = (id: string) =>
    setDocs((list) => {
      const i = list.findIndex((d) => d.id === id);
      const next = list.filter((d) => d.id !== id);
      if (id === activeId) setActiveId(next[Math.min(i, next.length - 1)]?.id ?? null);
      return next;
    });

  const pickFiles = () => notify("In the app, this opens PDFs or pictures from your PC. Try a file under Recent files on Home.");

  const addSig = (sig: { url: string; ratio: number }) => {
    if (sigs.length >= 1 && !pro) {
      openPaywall("signatures");
      return false;
    }
    const id = `sig-${Date.now()}`;
    setSigs((l) => [...l, { id, ...sig }]);
    setActiveSig(id);
    showToast("Signature saved");
    return true;
  };

  return (
    <div
      ref={setRoot}
      className={c("root")}
      tabIndex={-1}
      onKeyDown={(e) => {
        const k = e.key.toLowerCase();
        const t = e.target as HTMLElement;
        const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
        if (e.ctrlKey && k === "n" && !typing) {
          e.preventDefault();
          setNewBlank(true);
        } else if (e.ctrlKey && k === "o") {
          e.preventDefault();
          pickFiles();
        } else if (tab === "editor" && !paywall && !newBlank) keyRef.current?.(e);
      }}
    >
      <div className={c("shell")}>
        <nav className={c("sidebar")}>
          <div className={c("sidebar-brand rgb-chase")}>RevinHi PDF</div>
          {NAV.map((n) => (
            <button key={n.id} className={c("nav-item", tab === n.id && "active")} onClick={() => setTab(n.id)}>
              {n.label}
              {n.id === "editor" && docs.length > 0 && <span className={c("nav-count")}>{docs.length}</span>}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <div className={c("sidebar-tier")}>
            {pro ? (
              <span className={c("pill")}>
                <span className={c("pill-dot dot-success")} />
                Pro
              </span>
            ) : (
              <>
                <span className={c("pill")}>
                  <span className={c("pill-dot dot-warning")} />
                  Free
                </span>
                <button className={c("btn btn-buy btn-small")} onClick={() => openPaywall(null)}>
                  Upgrade
                </button>
              </>
            )}
          </div>
        </nav>

        <main className={c("content")}>
          {toast && (
            <div key={toast.id} className={c("card toast toast-info")} role="status">
              <span>{toast.text}</span>
              <button className={c("btn btn-secondary btn-small")} onClick={() => setToast(null)}>
                Dismiss
              </button>
            </div>
          )}

          {tab === "home" && (
            <HomeView
              recent={recent}
              onOpen={pickFiles}
              onNew={() => setNewBlank(true)}
              onTool={(t) => {
                setToolPanel(t);
                setTab("tools");
              }}
              onOpenRecent={(r) => openSample(r.sample)}
              onForget={(r) => setRecent((l) => l.filter((x) => x.path !== r.path))}
            />
          )}
          {tab === "editor" && (
            <EditorView
              docs={docs}
              activeId={activeId}
              setActive={setActiveId}
              updateDoc={updateDoc}
              closeDoc={closeDoc}
              pro={pro}
              paywall={openPaywall}
              sigs={sigs}
              activeSig={activeSig}
              setActiveSig={setActiveSig}
              toast={showToast}
              onOpen={pickFiles}
              onNew={() => setNewBlank(true)}
              root={root}
              keyRef={keyRef}
              flags={flags}
            />
          )}
          {tab === "tools" && <ToolsView panel={toolPanel} onPanel={setToolPanel} api={{ pro, paywall: openPaywall, toast: showToast, openSamples }} />}
          {tab === "signatures" && (
            <SignaturesView
              sigs={sigs}
              activeId={activeSig}
              setActiveId={setActiveSig}
              onAdd={addSig}
              onRemove={(id) => {
                setSigs((l) => l.filter((x) => x.id !== id));
                if (activeSig === id) setActiveSig(sigs.find((x) => x.id !== id)?.id ?? null);
              }}
            />
          )}
          {tab === "settings" && <SettingsView author={author} setAuthor={setAuthor} />}
          {tab === "license" && <LicenseView licensedKey={licensedKey} onActivate={setLicensedKey} onRemove={() => setLicensedKey(null)} onWhatsIn={() => openPaywall(null)} />}
        </main>
      </div>

      {paywall && !pro && <UpgradeModal key={String(paywall.feature)} feature={paywall.feature} onClose={() => setPaywall(null)} onActivate={setLicensedKey} />}
      {newBlank && (
        <NewBlankDialog
          onClose={() => setNewBlank(false)}
          onCreate={(w, h, n) => {
            const titles = new Set(docs.map((d) => d.title));
            let title = "Untitled.pdf";
            for (let i = 2; titles.has(title); i++) title = `Untitled ${i}.pdf`;
            const d = makeDoc(title, Array.from({ length: n }, () => pageOf("blank", w, h)));
            addDoc({ ...d, path: title });
            setNewBlank(false);
          }}
        />
      )}
    </div>
  );
}

export default function PdfDemo() {
  return (
    <AppWindow title={PRODUCT.name} icon={PRODUCT.icon} accent={PRODUCT.accent} width={1200} height={836}>
      <PdfApp />
    </AppWindow>
  );
}
