"use client";

// Home tab (home/HomeView.tsx) and the "New blank PDF" dialog (home/NewBlankDialog.tsx).

import { useState, type ReactNode } from "react";
import { ago, type RecentFile } from "./data";
import {
  IconBatch,
  IconClose,
  IconCompress,
  IconLockLine,
  IconMerge,
  IconOpenFile,
  IconPictures,
  IconScan,
  IconSplit,
  IconTextDoc,
  IconUnlockLine,
  IconWord,
  IconImage,
  Modal,
  Segmented,
  SettingRow,
  c,
} from "./ui";

export type QuickTool = "merge" | "split" | "img2pdf" | "pdf2img" | "compress" | "protect" | "unlock" | "ocr" | "totext" | "toword" | "extract" | "grayscale" | "batch";

const TOOLS: { id: QuickTool; title: string; sub: string; icon: ReactNode }[] = [
  { id: "merge", title: "Merge", sub: "Combine PDFs into one", icon: <IconMerge size={18} /> },
  { id: "split", title: "Split", sub: "By ranges or every N pages", icon: <IconSplit size={18} /> },
  { id: "img2pdf", title: "Images → PDF", sub: "JPG, PNG, WebP to PDF", icon: <IconPictures size={18} /> },
  { id: "pdf2img", title: "PDF → Images", sub: "Export pages as PNG/JPG", icon: <IconImage size={18} /> },
  { id: "compress", title: "Compress", sub: "Shrink file size", icon: <IconCompress size={18} /> },
  { id: "protect", title: "Protect", sub: "Add a password", icon: <IconLockLine size={18} /> },
  { id: "unlock", title: "Unlock", sub: "Remove a password", icon: <IconUnlockLine size={18} /> },
  { id: "ocr", title: "OCR", sub: "Make scans searchable", icon: <IconScan size={18} /> },
  { id: "toword", title: "PDF → Word", sub: "Editable .docx", icon: <IconWord size={18} /> },
  { id: "totext", title: "PDF → Text", sub: "Plain .txt", icon: <IconTextDoc size={18} /> },
  { id: "extract", title: "Extract images", sub: "Every embedded image", icon: <IconPictures size={18} /> },
  { id: "batch", title: "Batch", sub: "Many files, many steps", icon: <IconBatch size={18} /> },
];

export function HomeView({
  recent,
  onOpen,
  onNew,
  onTool,
  onOpenRecent,
  onForget,
}: {
  recent: RecentFile[];
  onOpen(): void;
  onNew(): void;
  onTool(t: QuickTool): void;
  onOpenRecent(r: RecentFile): void;
  onForget(r: RecentFile): void;
}) {
  return (
    <div className={c("pane scroll home")}>
      <div className={c("card drop-zone")} onClick={onOpen} role="button" tabIndex={0}>
        <div className={c("drop-glyph")}>
          <IconOpenFile size={34} />
        </div>
        <div className={c("drop-title")}>Drop PDFs or images here</div>
        <div className={c("drop-sub text-muted")}>or</div>
        <div className={c("drop-actions")}>
          <button
            className={c("btn btn-primary")}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            Open PDF
          </button>
          <button
            className={c("btn btn-secondary")}
            title="New blank PDF (Ctrl+N)"
            onClick={(e) => {
              e.stopPropagation();
              onNew();
            }}
          >
            New blank PDF
          </button>
        </div>
      </div>

      <div>
        <div className={c("section-title rgb-chase")}>Quick tools</div>
        <div className={c("tool-grid")}>
          {TOOLS.map((t) => (
            <button key={t.id} type="button" className={c("card tool-card")} onClick={() => onTool(t.id)}>
              <span className={c("tool-glyph")}>{t.icon}</span>
              <span className={c("tool-title")}>{t.title}</span>
              <span className={c("tool-sub text-muted")}>{t.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={c("card")}>
        <div className={c("section-title text-muted")}>Recent files</div>
        {recent.length === 0 ? (
          <p className={c("text-muted recent-empty")}>Files you open show up here.</p>
        ) : (
          <div className={c("recent-list")}>
            {recent.map((r) => (
              <div key={r.path} className={c("result-item recent-item")} onClick={() => onOpenRecent(r)} title={r.path}>
                <span className={c("recent-icon")}>PDF</span>
                <span className={c("recent-text")}>
                  <span className={c("recent-name")}>{r.name}</span>
                  <span className={c("recent-path text-muted")}>{r.path}</span>
                </span>
                <span className={c("recent-meta text-muted")}>
                  {r.size} · {ago(r.agoMin)}
                </span>
                <button
                  type="button"
                  className={c("recent-remove")}
                  aria-label="Remove from recent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onForget(r);
                  }}
                >
                  <IconClose size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SIZES = {
  letter: { label: "Letter", w: 612, h: 792 },
  a4: { label: "A4", w: 595.28, h: 841.89 },
  legal: { label: "Legal", w: 612, h: 1008 },
} as const;
type SizeId = keyof typeof SIZES;

export function NewBlankDialog({ onCreate, onClose }: { onCreate(w: number, h: number, n: number): void; onClose(): void }) {
  const [size, setSize] = useState<SizeId>("letter");
  const [landscape, setLandscape] = useState(false);
  const [count, setCount] = useState("1");
  const create = () => {
    const n = Math.min(50, Math.max(1, parseInt(count || "1", 10) || 1));
    const s = SIZES[size];
    const [w, h] = landscape ? [s.h, s.w] : [s.w, s.h];
    onCreate(w, h, n);
  };
  return (
    <Modal
      title="New blank PDF"
      onCancel={onClose}
      actions={
        <>
          <button className={c("btn btn-secondary")} onClick={onClose}>
            Cancel
          </button>
          <button className={c("btn btn-primary")} onClick={create}>
            Create
          </button>
        </>
      }
    >
      <SettingRow label="Page size">
        <Segmented value={size} options={(Object.keys(SIZES) as SizeId[]).map((id) => ({ value: id, label: SIZES[id].label }))} onChange={setSize} />
      </SettingRow>
      <SettingRow label="Orientation">
        <Segmented
          value={landscape ? "landscape" : "portrait"}
          options={[
            { value: "portrait", label: "Portrait" },
            { value: "landscape", label: "Landscape" },
          ]}
          onChange={(v) => setLandscape(v === "landscape")}
        />
      </SettingRow>
      <SettingRow label="Pages">
        <input
          className={c("text-input")}
          style={{ width: 80 }}
          inputMode="numeric"
          value={count}
          onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") create();
          }}
        />
      </SettingRow>
    </Modal>
  );
}
