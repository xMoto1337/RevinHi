"use client";

// Tools tab (tools/ToolsView.tsx, ConvertPanels.tsx, ExportPanels.tsx, OcrPanel.tsx, BatchPanel.tsx).
// Choosing files picks from the sample files; the work itself is simulated.

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDemo } from "../AppWindow";
import { DOCS_DIR, FREE, SAMPLES, sample, type Feature, type SampleFile } from "./data";
import type { QuickTool } from "./home";
import { IconClose, IconDown, IconUp, LockIcon, ProgressBar, Segmented, SettingRow, Toggle, c } from "./ui";

export interface ToolsApi {
  pro: boolean;
  paywall(f: Feature | null): void;
  toast(text: string): void;
  openSamples(title: string, ids: string[]): void;
}

const Ctx = createContext<ToolsApi>({ pro: false, paywall: () => {}, toast: () => {}, openSamples: () => {} });

export const TOOL_PANELS: { id: QuickTool; label: string }[] = [
  { id: "merge", label: "Merge" },
  { id: "split", label: "Split" },
  { id: "img2pdf", label: "Images → PDF" },
  { id: "pdf2img", label: "PDF → Images" },
  { id: "compress", label: "Compress" },
  { id: "protect", label: "Protect" },
  { id: "unlock", label: "Unlock" },
  { id: "ocr", label: "OCR" },
  { id: "totext", label: "PDF → Text" },
  { id: "toword", label: "PDF → Word" },
  { id: "extract", label: "Extract images" },
  { id: "grayscale", label: "Grayscale" },
  { id: "batch", label: "Batch" },
];

export function ToolsView({ panel, onPanel, api }: { panel: QuickTool; onPanel(p: QuickTool): void; api: ToolsApi }) {
  return (
    <Ctx.Provider value={api}>
      <div className={c("pane scroll tools")}>
        <div className={c("tool-tabs")}>
          {TOOL_PANELS.map((p) => (
            <button key={p.id} type="button" className={c("chip", panel === p.id && "on")} onClick={() => onPanel(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {panel === "merge" && <MergePanel />}
        {panel === "split" && <SplitPanel />}
        {panel === "img2pdf" && <ImagesToPdfPanel />}
        {panel === "pdf2img" && <PdfToImagesPanel />}
        {panel === "compress" && <CompressPanel />}
        {panel === "protect" && <ProtectPanel />}
        {panel === "unlock" && <UnlockPanel />}
        {panel === "ocr" && <OcrPanel />}
        {panel === "totext" && <ConvertTextPanel key="txt" word={false} />}
        {panel === "toword" && <ConvertTextPanel key="docx" word />}
        {panel === "extract" && <ExtractImagesPanel />}
        {panel === "grayscale" && <GrayscalePanel />}
        {panel === "batch" && <BatchPanel />}
      </div>
    </Ctx.Provider>
  );
}

// ------------------------------------------------------------------ shared bits

const stem = (name: string) => name.replace(/\.[^.]+$/, "");

function ProChip({ feature }: { feature: Feature }) {
  const { pro, paywall } = useContext(Ctx);
  if (pro) return null;
  return (
    <button
      type="button"
      className={c("pro-chip")}
      title="This is a Pro feature"
      onClick={(e) => {
        e.stopPropagation();
        paywall(feature);
      }}
    >
      <LockIcon size={9} />
      PRO
    </button>
  );
}

/** Fake work: runs for `ms`, reporting progress, unless the feature is Pro-only on Free. */
function useRunner(feature?: Feature) {
  const { pro, paywall } = useContext(Ctx);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current && window.clearInterval(timer.current)), []);
  const run = (ms: number, done: () => void) => {
    if (feature && !pro) {
      paywall(feature);
      return;
    }
    setRunning(true);
    setProgress(0);
    const t0 = Date.now();
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(timer.current!);
        timer.current = null;
        setRunning(false);
        done();
      }
    }, 80);
  };
  const cancel = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };
  return { running, progress, run, cancel };
}

/** "Choose PDF": picks the next sample file (in the app, a file picker opens). */
function usePick(first: string) {
  const { notify } = useDemo();
  const [file, setFile] = useState<SampleFile | null>(null);
  const pick = () => {
    const order = [first, ...SAMPLES.map((s) => s.id).filter((id) => id !== first)];
    const next = file ? order[(order.indexOf(file.id) + 1) % order.length] : first;
    notify("In the app, this opens a PDF from your PC. Here's a sample file.");
    const f = sample(next);
    setFile(f);
    return f;
  };
  return { file, pick };
}

function FilePickRow({ file, running, onPick, pages = true }: { file: SampleFile | null; running: boolean; onPick(): void; pages?: boolean }) {
  return (
    <div className={c("toolbar")}>
      <button className={c("btn btn-secondary")} disabled={running} onClick={onPick}>
        {file ? "Choose another PDF" : "Choose PDF"}
      </button>
      {file && (
        <span className={c("tool-file")} title={`${DOCS_DIR}\\${file.title}`}>
          {file.title}
          {pages && <span className={c("text-muted")}> · {file.kinds.length} pages</span>}
        </span>
      )}
    </div>
  );
}

function OutputLine({ name, extra, onOpen }: { name: string; extra?: string; onOpen?: () => void }) {
  return (
    <div className={c("toolbar tool-result")}>
      <span className={c("text-success")}>Saved {name}</span>
      {extra && <span className={c("text-muted")}>{extra}</span>}
      <span style={{ flex: 1 }} />
      {onOpen && (
        <button className={c("btn btn-secondary btn-small")} onClick={onOpen}>
          Open
        </button>
      )}
    </div>
  );
}

function FileList({ files, onChange, empty }: { files: string[]; onChange(f: string[]): void; empty: string }) {
  const moveBy = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= files.length) return;
    const next = [...files];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className={c("file-list")}>
      {files.length === 0 && <div className={c("text-muted file-empty")}>{empty}</div>}
      {files.map((f, i) => (
        <div key={`${f}-${i}`} className={c("result-item file-row")}>
          <span className={c("file-idx")}>{i + 1}</span>
          <span className={c("file-name")} title={`${DOCS_DIR}\\${f}`}>
            {f}
          </span>
          <span className={c("file-actions")}>
            <button className={c("mini-btn")} disabled={i === 0} onClick={() => moveBy(i, -1)} aria-label="Move up">
              <IconUp size={9} />
            </button>
            <button className={c("mini-btn")} disabled={i === files.length - 1} onClick={() => moveBy(i, 1)} aria-label="Move down">
              <IconDown size={9} />
            </button>
            <button className={c("mini-btn")} onClick={() => onChange(files.filter((_, k) => k !== i))} aria-label="Remove">
              <IconClose size={8} />
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

const fmtMB = (b: number) => (b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);

// ------------------------------------------------------------------ merge

function MergePanel() {
  const { notify } = useDemo();
  const { pro, paywall, toast, openSamples } = useContext(Ctx);
  const [files, setFiles] = useState<string[]>([]);
  const [lastOut, setLastOut] = useState<{ name: string; ids: string[] } | null>(null);
  const { running, run } = useRunner();
  const idOf = (title: string) => SAMPLES.find((s) => s.title === title)?.id ?? "agreement";

  const add = () => {
    notify("In the app, this picks PDFs or images from your PC. Here are sample files.");
    const unused = SAMPLES.map((s) => s.title).filter((t) => !files.includes(t));
    setFiles([...files, ...(files.length ? unused.slice(0, 1) : unused.slice(0, 2))]);
  };

  const merge = () => {
    if (files.length > FREE.mergeFiles && !pro) {
      paywall("merge");
      return;
    }
    notify("In the app, you choose where to save the merged PDF.");
    const name = `${stem(files[0])}_merged.pdf`;
    run(1400, () => {
      setLastOut({ name, ids: files.map(idOf) });
      toast(`Merged ${files.length} files into ${name}`);
    });
  };

  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>Merge files {files.length > 2 && <ProChip feature="merge" />}</div>
      <p className={c("tool-copy text-muted")}>Combine PDFs (and images) into one PDF, in the order listed.</p>
      <FileList files={files} onChange={setFiles} empty="No files yet." />
      <div className={c("toolbar")}>
        <button className={c("btn btn-secondary")} onClick={add} disabled={running || files.length >= SAMPLES.length}>
          Add files
        </button>
        {files.length > 0 && (
          <button className={c("btn btn-secondary")} onClick={() => setFiles([])} disabled={running}>
            Clear
          </button>
        )}
        <span style={{ flex: 1 }} />
        {lastOut && !running && (
          <button className={c("btn btn-secondary")} onClick={() => openSamples(lastOut.name, lastOut.ids)}>
            Open result
          </button>
        )}
        <button className={c("btn btn-primary")} onClick={merge} disabled={running || files.length < 2}>
          {running ? "Merging…" : "Merge"}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ split

type SplitMode = "every" | "ranges" | "each";

function SplitPanel() {
  const { notify } = useDemo();
  const { file, pick } = usePick("proposal");
  const [mode, setMode] = useState<SplitMode>("every");
  const [n, setN] = useState("2");
  const [ranges, setRanges] = useState("1-3,5,7-9");
  const { running, run } = useRunner();

  const pages = file?.kinds.length ?? 0;
  let plan: { count: number } | { error: string } | null = null;
  if (file) {
    if (mode === "each") plan = { count: pages };
    else if (mode === "every") {
      const k = parseInt(n, 10);
      plan = k > 0 ? { count: Math.ceil(pages / k) } : { error: "Enter how many pages go in each file." };
    } else {
      const parts = ranges.split(",").map((s) => s.trim()).filter(Boolean);
      const bad = parts.find((p) => {
        const m = /^(\d+)?-?(\d+)?$/.exec(p);
        if (!m) return true;
        const a = parseInt(m[1] ?? "1", 10);
        return a < 1 || a > pages;
      });
      plan = !parts.length ? { error: "Enter at least one range." } : bad ? { error: `“${bad}” is outside the ${pages} pages of this file.` } : { count: parts.length };
    }
  }

  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted")}>Split a PDF</div>
      <FilePickRow file={file} running={running} onPick={pick} />
      {file && plan && (
        <>
          <SettingRow label="Mode">
            <Segmented<SplitMode>
              value={mode}
              onChange={setMode}
              options={[
                { value: "every", label: "Every N pages" },
                { value: "ranges", label: "Custom ranges" },
                { value: "each", label: "One file per page" },
              ]}
            />
          </SettingRow>
          {mode === "every" && (
            <SettingRow label="Pages per file">
              <input className={c("text-input num-input")} value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, ""))} />
            </SettingRow>
          )}
          {mode === "ranges" && (
            <SettingRow label="Ranges" hint="One file per range, e.g. 1-3,5,7-9 (open ends like 8- work).">
              <input className={c("text-input range-input")} value={ranges} onChange={(e) => setRanges(e.target.value)} />
            </SettingRow>
          )}
          <SettingRow label="Output folder" hint={DOCS_DIR}>
            <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this lets you pick a folder on your PC.")}>
              Change
            </button>
          </SettingRow>
          <div className={c("toolbar")}>
            <span className={c("error" in plan ? "text-danger tool-copy" : "text-muted tool-copy")}>
              {"error" in plan ? plan.error : `Creates ${plan.count} file${plan.count > 1 ? "s" : ""}: ${stem(file.title)}_part1.pdf…`}
            </span>
            <span style={{ flex: 1 }} />
            <button
              className={c("btn btn-primary")}
              disabled={running || "error" in plan}
              onClick={() => {
                const count = "count" in plan! ? plan.count : 0;
                run(1100, () => notify(`In the app, this saves ${count} files into your folder: ${stem(file.title)}_part1.pdf and on.`));
              }}
            >
              {running ? "Splitting…" : "Split"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ images -> pdf

const SAMPLE_IMAGES = ["IMG_2041.jpg", "IMG_2042.jpg", "Receipt scan.png", "Whiteboard notes.jpg", "Floor plan.png"];

function ImagesToPdfPanel() {
  const { notify } = useDemo();
  const { pro, paywall } = useContext(Ctx);
  const [files, setFiles] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState("a4");
  const [margin, setMargin] = useState(18);
  const [out, setOut] = useState<string | null>(null);
  const { running, run } = useRunner();
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>Images → PDF {files.length > 3 && <ProChip feature="imagesToPdf" />}</div>
      <p className={c("tool-copy text-muted")}>One page per image, in this order. JPG, PNG, WebP, BMP and GIF.</p>
      <FileList files={files} onChange={setFiles} empty="No images yet." />
      <SettingRow label="Page size">
        <Segmented
          value={pageSize}
          onChange={setPageSize}
          options={[
            { value: "fit", label: "Fit image" },
            { value: "a4", label: "A4" },
            { value: "letter", label: "Letter" },
          ]}
        />
      </SettingRow>
      <SettingRow label="Margin" hint="Orientation follows each image.">
        <Segmented<number>
          value={margin}
          onChange={setMargin}
          options={[
            { value: 0, label: "None" },
            { value: 18, label: "Small" },
            { value: 36, label: "Large" },
          ]}
        />
      </SettingRow>
      <div className={c("toolbar")}>
        <button
          className={c("btn btn-secondary")}
          disabled={running || files.length >= SAMPLE_IMAGES.length}
          onClick={() => {
            notify("In the app, this picks pictures from your PC. Here are sample photos.");
            const unused = SAMPLE_IMAGES.filter((f) => !files.includes(f));
            setFiles([...files, ...unused.slice(0, files.length ? 1 : 2)]);
          }}
        >
          Add images
        </button>
        <span style={{ flex: 1 }} />
        <button
          className={c("btn btn-primary")}
          disabled={running || !files.length}
          onClick={() => {
            if (files.length > FREE.imagesToPdf && !pro) return paywall("imagesToPdf");
            notify("In the app, you choose where to save the new PDF.");
            run(1000, () => setOut(`${stem(files[0])}.pdf`));
          }}
        >
          {running ? "Creating…" : "Create PDF"}
        </button>
      </div>
      {out && !running && <OutputLine name={out} onOpen={() => notify("In the app, this opens the new PDF in the editor.")} />}
    </div>
  );
}

// ------------------------------------------------------------------ pdf -> images

function PdfToImagesPanel() {
  const { notify } = useDemo();
  const { file, pick } = usePick("proposal");
  const [dpi, setDpi] = useState(150);
  const [format, setFormat] = useState("png");
  const [pages, setPages] = useState("");
  const { running, progress, run } = useRunner("pdfToImages");
  const total = file?.kinds.length ?? 0;
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        PDF → Images <ProChip feature="pdfToImages" />
      </div>
      <FilePickRow file={file} running={running} onPick={pick} pages={false} />
      {file && (
        <>
          <SettingRow label="Resolution">
            <Segmented<number>
              value={dpi}
              onChange={setDpi}
              options={[
                { value: 72, label: "72 dpi" },
                { value: 150, label: "150 dpi" },
                { value: 300, label: "300 dpi" },
              ]}
            />
          </SettingRow>
          <SettingRow label="Format">
            <Segmented
              value={format}
              onChange={setFormat}
              options={[
                { value: "png", label: "PNG" },
                { value: "jpg", label: "JPG" },
              ]}
            />
          </SettingRow>
          <SettingRow label="Pages" hint="Blank = all pages, or e.g. 1-3,5">
            <input className={c("text-input range-input")} value={pages} placeholder="All pages" onChange={(e) => setPages(e.target.value)} />
          </SettingRow>
          <SettingRow label="Output folder" hint={DOCS_DIR}>
            <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this lets you pick a folder on your PC.")}>
              Change
            </button>
          </SettingRow>
          <div className={c("toolbar")}>
            <span className={c("text-muted tool-copy")}>{running ? `Page ${Math.min(total, Math.floor(progress * total) + 1)} of ${total}…` : `Files are named ${stem(file.title)}_p001.${format}…`}</span>
            <span style={{ flex: 1 }} />
            <button className={c("btn btn-primary")} disabled={running} onClick={() => run(1600, () => notify(`In the app, this saves ${total} ${format.toUpperCase()} images into your folder.`))}>
              {running ? "Converting…" : "Convert"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ compress

const COMPRESSED = { low: 0.31, medium: 0.128, high: 0.066 };

function CompressPanel() {
  const { notify } = useDemo();
  const { openSamples } = useContext(Ctx);
  const { file, pick } = usePick("catalog");
  const [preset, setPreset] = useState<keyof typeof COMPRESSED>("medium");
  const [result, setResult] = useState<{ name: string; before: number; after: number; id: string } | null>(null);
  const { running, run } = useRunner("compress");
  const saved = result ? Math.max(0, Math.round((1 - result.after / result.before) * 100)) : 0;
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        Compress <ProChip feature="compress" />
      </div>
      <p className={c("tool-copy text-muted")}>Shrinks oversized images and repacks the file. Text stays sharp.</p>
      <div className={c("toolbar")}>
        <button
          className={c("btn btn-secondary")}
          disabled={running}
          onClick={() => {
            pick();
            setResult(null);
          }}
        >
          {file ? "Choose another PDF" : "Choose PDF"}
        </button>
        {file && <span className={c("tool-file")}>{file.title}</span>}
      </div>
      <SettingRow label="Strength" hint={preset === "low" ? "150 dpi images, high quality" : preset === "medium" ? "110 dpi images, good for screens" : "72 dpi images, smallest file"}>
        <Segmented
          value={preset}
          onChange={setPreset}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
        />
      </SettingRow>
      <div className={c("toolbar")}>
        <span style={{ flex: 1 }} />
        <button
          className={c("btn btn-primary")}
          disabled={running || !file}
          onClick={() => {
            if (!file) return;
            run(1800, () => {
              notify("In the app, you choose where to save the smaller copy.");
              setResult({ name: `${stem(file.title)}_compressed.pdf`, before: file.bytes, after: Math.round(file.bytes * COMPRESSED[preset]), id: file.id });
            });
          }}
        >
          {running ? "Compressing…" : "Compress"}
        </button>
      </div>
      {result && !running && <OutputLine name={result.name} extra={`${fmtMB(result.before)} → ${fmtMB(result.after)} (${saved}% smaller)`} onOpen={() => openSamples(result.name, [result.id])} />}
    </div>
  );
}

// ------------------------------------------------------------------ protect / unlock

function ProtectPanel() {
  const { notify } = useDemo();
  const { file, pick } = usePick("agreement");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [owner, setOwner] = useState("");
  const [perms, setPerms] = useState({ print: true, copy: true, modify: false });
  const [out, setOut] = useState<string | null>(null);
  const { running, run } = useRunner("protect");
  const mismatch = pw2.length > 0 && pw !== pw2;
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        Protect with a password <ProChip feature="protect" />
      </div>
      <p className={c("tool-copy text-muted")}>AES-256 encryption. Anyone opening the file needs the password.</p>
      <div className={c("toolbar")}>
        <button className={c("btn btn-secondary")} disabled={running} onClick={pick}>
          {file ? "Choose another PDF" : "Choose PDF"}
        </button>
        {file && <span className={c("tool-file")}>{file.title}</span>}
      </div>
      <input className={c("text-input")} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
      <input className={c("text-input")} type="password" placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      {mismatch && <span className={c("text-danger tool-copy")}>The passwords don&apos;t match.</span>}
      <SettingRow label="Allow printing">
        <Toggle checked={perms.print} onChange={(print) => setPerms({ ...perms, print })} />
      </SettingRow>
      <SettingRow label="Allow copying text">
        <Toggle checked={perms.copy} onChange={(copy) => setPerms({ ...perms, copy })} />
      </SettingRow>
      <SettingRow label="Allow editing" hint="Restrictions are honoured by PDF apps, but aren't enforced by the encryption itself.">
        <Toggle checked={perms.modify} onChange={(modify) => setPerms({ ...perms, modify })} />
      </SettingRow>
      <SettingRow label="Owner password" hint="Optional: lets you change the restrictions later. Defaults to the password above.">
        <input className={c("text-input range-input")} type="password" value={owner} onChange={(e) => setOwner(e.target.value)} />
      </SettingRow>
      <div className={c("toolbar")}>
        <span style={{ flex: 1 }} />
        <button
          className={c("btn btn-primary")}
          disabled={running || !file || !pw || pw !== pw2}
          onClick={() =>
            file &&
            run(1000, () => {
              notify("In the app, you choose where to save the locked copy.");
              setOut(`${stem(file.title)}_protected.pdf`);
              setPw("");
              setPw2("");
            })
          }
        >
          {running ? "Protecting…" : "Protect"}
        </button>
      </div>
      {out && !running && <OutputLine name={out} onOpen={() => notify("In the app, this opens the PDF, asking for its password first.")} />}
    </div>
  );
}

function UnlockPanel() {
  const { notify } = useDemo();
  const { file, pick } = usePick("agreement");
  const [pw, setPw] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const { running, run } = useRunner("unlock");
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        Unlock <ProChip feature="unlock" />
      </div>
      <p className={c("tool-copy text-muted")}>Removes the password from a PDF you have the password for.</p>
      <div className={c("toolbar")}>
        <button className={c("btn btn-secondary")} disabled={running} onClick={pick}>
          {file ? "Choose another PDF" : "Choose PDF"}
        </button>
        {file && <span className={c("tool-file")}>{file.title}</span>}
      </div>
      <input className={c("text-input")} type="password" placeholder="Password (leave blank if it only has editing restrictions)" value={pw} onChange={(e) => setPw(e.target.value)} />
      <div className={c("toolbar")}>
        <span style={{ flex: 1 }} />
        <button
          className={c("btn btn-primary")}
          disabled={running || !file}
          onClick={() =>
            file &&
            run(900, () => {
              notify("In the app, you choose where to save the unlocked copy.");
              setOut(`${stem(file.title)}_unlocked.pdf`);
              setPw("");
            })
          }
        >
          {running ? "Unlocking…" : "Unlock"}
        </button>
      </div>
      {out && !running && <OutputLine name={out} onOpen={() => notify("In the app, this opens the unlocked PDF in the editor.")} />}
    </div>
  );
}

// ------------------------------------------------------------------ OCR

function OcrPanel() {
  const { notify } = useDemo();
  const { openSamples } = useContext(Ctx);
  const { file, pick } = usePick("proposal");
  const [pages, setPages] = useState("");
  const [skipText, setSkipText] = useState(true);
  const [dpi, setDpi] = useState(300);
  const [out, setOut] = useState<{ name: string; id: string } | null>(null);
  const { running, progress, run, cancel } = useRunner("ocr");
  const total = file?.kinds.length ?? 0;
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        OCR <ProChip feature="ocr" />
      </div>
      <p className={c("tool-copy text-muted")}>Recognizes the text in scanned pages and adds it as an invisible layer, so you can search, select and copy it. Runs on this PC; nothing is uploaded.</p>
      <FilePickRow
        file={file}
        running={running}
        onPick={() => {
          pick();
          setOut(null);
        }}
      />
      {file && (
        <>
          <SettingRow label="Language">
            <Segmented value="eng" onChange={() => {}} options={[{ value: "eng", label: "English" }]} />
          </SettingRow>
          <SettingRow label="Pages" hint="Blank = all pages, or e.g. 1-3,5">
            <input className={c("text-input range-input")} value={pages} placeholder="All pages" disabled={running} onChange={(e) => setPages(e.target.value)} />
          </SettingRow>
          <SettingRow label="Skip pages that already have text" hint="Leaves digital pages untouched (and is much faster).">
            <Toggle checked={skipText} onChange={setSkipText} disabled={running} />
          </SettingRow>
          <SettingRow label="Accuracy" hint={dpi >= 300 ? "Reads small print reliably" : "About twice as fast"}>
            <Segmented<number>
              value={dpi}
              onChange={setDpi}
              options={[
                { value: 200, label: "Fast" },
                { value: 300, label: "Best" },
              ]}
            />
          </SettingRow>
          {running && <ProgressBar value={progress} label={`Page ${Math.min(total, Math.floor(progress * total) + 1)} of ${total}`} />}
          <div className={c("toolbar")}>
            <span className={c("text-muted tool-copy")}>Saves a copy named {stem(file.title)} (OCR).pdf</span>
            <span style={{ flex: 1 }} />
            {running && (
              <button className={c("btn btn-secondary")} onClick={cancel}>
                Cancel
              </button>
            )}
            <button
              className={c("btn btn-primary")}
              disabled={running}
              onClick={() =>
                run(dpi >= 300 ? 3200 : 1800, () => {
                  notify("In the app, the searchable copy is saved next to the original.");
                  setOut({ name: `${stem(file.title)} (OCR).pdf`, id: file.id });
                })
              }
            >
              {running ? "Recognizing…" : "Make searchable"}
            </button>
          </div>
        </>
      )}
      {out && !running && <OutputLine name={out.name} extra={`${total} pages`} onOpen={() => openSamples(out.name, [out.id])} />}
    </div>
  );
}

// ------------------------------------------------------------------ export panels

function ConvertTextPanel({ word }: { word: boolean }) {
  const { notify } = useDemo();
  const { file, pick } = usePick("proposal");
  const [pages, setPages] = useState("");
  const [images, setImages] = useState(true);
  const [out, setOut] = useState<string | null>(null);
  const { running, progress, run, cancel } = useRunner("exportFormats");
  const total = file?.kinds.length ?? 0;
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        {word ? "PDF → Word" : "PDF → Text"} <ProChip feature="exportFormats" />
      </div>
      <p className={c("tool-copy text-muted")}>
        {word ? "Rebuilds paragraphs, headings (by size), bold and italic, page breaks and the page images as an editable .docx." : "Plain text in reading order, one section per page. Scanned pages need OCR first."}
      </p>
      <FilePickRow
        file={file}
        running={running}
        onPick={() => {
          pick();
          setOut(null);
        }}
      />
      {file && (
        <>
          <SettingRow label="Pages" hint="Blank = all pages, or e.g. 1-3,5">
            <input className={c("text-input range-input")} value={pages} placeholder="All pages" disabled={running} onChange={(e) => setPages(e.target.value)} />
          </SettingRow>
          {word && (
            <SettingRow label="Include images">
              <Toggle checked={images} onChange={setImages} disabled={running} />
            </SettingRow>
          )}
          {running && <ProgressBar value={progress} label={`Page ${Math.min(total, Math.floor(progress * total) + 1)} of ${total}`} />}
          <div className={c("toolbar")}>
            <span style={{ flex: 1 }} />
            {running && (
              <button className={c("btn btn-secondary")} onClick={cancel}>
                Cancel
              </button>
            )}
            <button
              className={c("btn btn-primary")}
              disabled={running}
              onClick={() => {
                run(1800, () => {
                  notify(`In the app, you choose where to save the ${word ? "Word document" : "text file"}.`);
                  setOut(`${stem(file.title)}.${word ? "docx" : "txt"}`);
                });
              }}
            >
              {running ? "Converting…" : word ? "Convert to Word" : "Convert to text"}
            </button>
          </div>
        </>
      )}
      {out && !running && <OutputLine name={out} />}
    </div>
  );
}

function GrayscalePanel() {
  const { notify } = useDemo();
  const { openSamples } = useContext(Ctx);
  const { file, pick } = usePick("catalog");
  const [out, setOut] = useState<{ name: string; id: string } | null>(null);
  const { running, run } = useRunner("cleanup");
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        Grayscale <ProChip feature="cleanup" />
      </div>
      <p className={c("tool-copy text-muted")}>Turns text, drawings and photos into shades of gray, for cheaper printing. Text stays text.</p>
      <FilePickRow
        file={file}
        running={running}
        onPick={() => {
          pick();
          setOut(null);
        }}
      />
      {file && (
        <div className={c("toolbar")}>
          <span style={{ flex: 1 }} />
          <button
            className={c("btn btn-primary")}
            disabled={running}
            onClick={() =>
              run(1200, () => {
                notify("In the app, you choose where to save the gray copy.");
                setOut({ name: `${stem(file.title)}_gray.pdf`, id: file.id });
              })
            }
          >
            {running ? "Converting…" : "Convert to grayscale"}
          </button>
        </div>
      )}
      {out && !running && <OutputLine name={out.name} onOpen={() => openSamples(out.name, [out.id])} />}
    </div>
  );
}

function ExtractImagesPanel() {
  const { notify } = useDemo();
  const { file, pick } = usePick("catalog");
  const [result, setResult] = useState<string | null>(null);
  const { running, run } = useRunner("exportFormats");
  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        Extract images <ProChip feature="exportFormats" />
      </div>
      <p className={c("tool-copy text-muted")}>Saves every embedded image at its original quality: photos stay .jpg, the rest become .png. Duplicates are saved once.</p>
      <FilePickRow
        file={file}
        running={running}
        onPick={() => {
          pick();
          setResult(null);
        }}
      />
      {file && (
        <>
          <SettingRow label="Output folder" hint={DOCS_DIR}>
            <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this lets you pick a folder on your PC.")}>
              Change
            </button>
          </SettingRow>
          <div className={c("toolbar")}>
            <span className={c("text-muted tool-copy")}>Files are named {stem(file.title)}_p001_01.jpg…</span>
            <span style={{ flex: 1 }} />
            <button
              className={c("btn btn-primary")}
              disabled={running}
              onClick={() =>
                run(1300, () => {
                  const n = file.id === "catalog" ? 10 : file.id === "invoice" ? 1 : 3;
                  notify("In the app, the images are saved into your folder.");
                  setResult(`Saved ${n} image${n > 1 ? "s" : ""} to ${DOCS_DIR}`);
                })
              }
            >
              {running ? "Extracting…" : "Extract"}
            </button>
          </div>
        </>
      )}
      {result && !running && <div className={c("toolbar tool-result text-success")}>{result}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ batch

type StepId = "unlock" | "compress" | "grayscale" | "rotate" | "flatten" | "ocr" | "toImages" | "toText" | "protect";
const ACTIONS: Record<StepId, { label: string; suffix: string; hint: string }> = {
  unlock: { label: "Unlock", suffix: "_unlocked", hint: "Opens protected files with this password" },
  compress: { label: "Compress", suffix: "_compressed", hint: "Shrinks images" },
  grayscale: { label: "Grayscale", suffix: "_gray", hint: "Colors and photos to shades of gray" },
  rotate: { label: "Rotate all pages", suffix: "_rotated", hint: "Clockwise" },
  flatten: { label: "Flatten forms", suffix: "_flat", hint: "Bakes form fields into the page" },
  ocr: { label: "OCR", suffix: "_ocr", hint: "Adds searchable text to scanned pages" },
  toImages: { label: "To images", suffix: "", hint: "One image per page" },
  toText: { label: "To text", suffix: "", hint: "A .txt next to each output" },
  protect: { label: "Protect", suffix: "_protected", hint: "AES-256 password" },
};
const ORDER: StepId[] = ["unlock", "compress", "grayscale", "rotate", "flatten", "ocr", "toImages", "toText", "protect"];

function BatchPanel() {
  const { notify } = useDemo();
  const { pro, paywall, toast } = useContext(Ctx);
  const [files, setFiles] = useState<string[]>([]);
  const [sub, setSub] = useState(false);
  const [steps, setSteps] = useState<{ id: StepId; opt?: string }[]>([{ id: "compress", opt: "medium" }]);
  const [pattern, setPattern] = useState("{name}{suffix}");
  const [overwrite, setOverwrite] = useState("rename");
  const [status, setStatus] = useState<Record<string, "queued" | "running" | "done">>({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const suffix = steps.map((s) => ACTIONS[s.id].suffix).join("");
  const example = files[0] ? `${pattern.replace("{name}", stem(files[0])).replace("{suffix}", suffix)}.pdf` : "";
  const problem = !files.length ? "Add some PDFs." : !steps.length ? "Add at least one step." : steps.some((s) => (s.id === "protect" || s.id === "unlock") && !s.opt) ? "Enter the password for the password step." : null;
  const moveStep = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  const start = () => {
    if (!pro) return paywall("batch");
    if (problem) return;
    setRunning(true);
    setDone(0);
    setStatus(Object.fromEntries(files.map((f) => [f, "queued"])));
    files.forEach((f, i) => {
      timers.current.push(window.setTimeout(() => setStatus((s) => ({ ...s, [f]: "running" })), i * 900));
      timers.current.push(
        window.setTimeout(() => {
          setStatus((s) => ({ ...s, [f]: "done" }));
          setDone(i + 1);
          if (i === files.length - 1) {
            setRunning(false);
            toast(`Batch finished: ${files.length} done.`);
          }
        }, i * 900 + 850),
      );
    });
  };

  return (
    <div className={c("card tool-panel")}>
      <div className={c("section-title text-muted toolbar")}>
        Batch <ProChip feature="batch" />
      </div>
      <p className={c("tool-copy text-muted")}>Run the same steps on many PDFs. Files are processed one at a time; originals are never changed.</p>
      <div className={c("file-list")} style={{ maxHeight: 300 }}>
        {files.length === 0 && <div className={c("text-muted file-empty")}>No files yet.</div>}
        {files.map((f) => {
          const st = status[f];
          return (
            <div key={f} className={c("result-item file-row")}>
              <span className={c("file-name")}>{f}</span>
              <span className={c("file-status")}>
                {st && (
                  <span className={c("pill")}>
                    <span className={c("pill-dot", st === "done" ? "dot-success" : st === "running" ? "dot-warning" : "dot-muted")} />
                    <span>{st === "done" ? "Done" : st === "running" ? `${ACTIONS[steps[0].id].label}` : "Queued"}</span>
                  </span>
                )}
              </span>
              {!running && (
                <span className={c("file-actions")}>
                  <button className={c("mini-btn")} onClick={() => setFiles(files.filter((x) => x !== f))} aria-label="Remove">
                    <IconClose size={8} />
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className={c("toolbar")}>
        <button
          className={c("btn btn-secondary")}
          disabled={running}
          onClick={() => {
            notify("In the app, this picks PDFs from your PC. Here are sample files.");
            setFiles([...new Set([...files, ...SAMPLES.map((s) => s.title)])]);
          }}
        >
          Add files
        </button>
        <button className={c("btn btn-secondary")} disabled={running} onClick={() => notify("In the app, this adds every PDF in a folder you pick.")}>
          Add folder
        </button>
        <label className={c("check-row")}>
          <input type="checkbox" checked={sub} onChange={(e) => setSub(e.target.checked)} />
          <span>Include subfolders</span>
        </label>
        <span style={{ flex: 1 }} />
        {files.length > 0 && !running && (
          <button
            className={c("btn btn-secondary")}
            onClick={() => {
              setFiles([]);
              setStatus({});
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className={c("section-title text-muted")}>Steps, in order</div>
      <div className={c("batch-steps")}>
        {steps.map((s, i) => (
          <div key={s.id} className={c("result-item batch-step")}>
            <span className={c("step-label")}>
              {i + 1}. {ACTIONS[s.id].label}
            </span>
            <span className={c("step-opts")}>
              {s.id === "compress" ? (
                <Segmented
                  value={s.opt ?? "medium"}
                  onChange={(opt) => setSteps(steps.map((x, j) => (j === i ? { ...x, opt } : x)))}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ]}
                />
              ) : s.id === "rotate" ? (
                <Segmented
                  value={s.opt ?? "90"}
                  onChange={(opt) => setSteps(steps.map((x, j) => (j === i ? { ...x, opt } : x)))}
                  options={[
                    { value: "90", label: "90°" },
                    { value: "180", label: "180°" },
                    { value: "270", label: "270°" },
                  ]}
                />
              ) : s.id === "protect" || s.id === "unlock" ? (
                <input
                  className={c("text-input")}
                  type="password"
                  placeholder={s.id === "unlock" ? "Password of the files" : "New password"}
                  value={s.opt ?? ""}
                  onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, opt: e.target.value } : x)))}
                />
              ) : (
                <span className={c("text-muted tool-copy")}>{ACTIONS[s.id].hint}</span>
              )}
            </span>
            {!running && (
              <span className={c("file-actions")}>
                <button className={c("mini-btn")} disabled={i === 0} onClick={() => moveStep(i, -1)} aria-label="Move up">
                  <IconUp size={9} />
                </button>
                <button className={c("mini-btn")} disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)} aria-label="Move down">
                  <IconDown size={9} />
                </button>
                <button className={c("mini-btn")} onClick={() => setSteps(steps.filter((_, j) => j !== i))} aria-label="Remove step">
                  <IconClose size={8} />
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
      {!running && (
        <div className={c("batch-add")}>
          {ORDER.filter((id) => !steps.some((s) => s.id === id)).map((id) => (
            <button key={id} type="button" className={c("chip")} title={ACTIONS[id].hint} onClick={() => setSteps([...steps, { id }])}>
              + {ACTIONS[id].label}
            </button>
          ))}
        </div>
      )}
      <SettingRow label="Output folder" hint={files.length ? DOCS_DIR : "Not chosen"}>
        <button className={c("btn btn-secondary btn-small")} disabled={running} onClick={() => notify("In the app, this lets you pick a folder on your PC.")}>
          Change
        </button>
      </SettingRow>
      <SettingRow label="File names" hint={example ? `e.g. ${example}` : "{name} = original name, {suffix} = the steps' suffixes"}>
        <input className={c("text-input pattern-input")} value={pattern} disabled={running} onChange={(e) => setPattern(e.target.value)} />
      </SettingRow>
      <SettingRow label="If a file already exists">
        <Segmented
          value={overwrite}
          onChange={setOverwrite}
          options={[
            { value: "rename", label: "Add (2)" },
            { value: "overwrite", label: "Replace" },
            { value: "skip", label: "Skip" },
          ]}
        />
      </SettingRow>
      {running && <ProgressBar value={files.length ? done / files.length : 0} label={`${done} of ${files.length}`} />}
      <div className={c("toolbar")}>
        <span className={c(problem && files.length ? "text-danger tool-copy" : "text-muted tool-copy")}>{problem ?? `${files.length} file${files.length > 1 ? "s" : ""} ready`}</span>
        <span style={{ flex: 1 }} />
        {running ? (
          <button
            className={c("btn btn-secondary")}
            onClick={() => {
              timers.current.forEach((t) => window.clearTimeout(t));
              timers.current = [];
              setRunning(false);
            }}
          >
            Cancel
          </button>
        ) : (
          <button className={c("btn btn-primary")} disabled={!!problem} onClick={start}>
            Run batch
          </button>
        )}
      </div>
    </div>
  );
}
