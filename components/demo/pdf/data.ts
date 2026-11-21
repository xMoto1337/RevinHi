// Sample documents, objects and Free/Pro table for the RevinHi PDF preview.

export type PageKind =
  | "sa1"
  | "sa2"
  | "inv"
  | "pcover"
  | "psum"
  | "pappr"
  | "ptime"
  | "pbudget"
  | "pnext"
  | "ccover"
  | "cgrid"
  | "cprice"
  | "blank";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageRef {
  key: string;
  kind: PageKind;
  /** Page size in points (unrotated). */
  w: number;
  h: number;
  rot: number;
  crop?: Rect | null;
}

export type MarkKind = "check" | "cross" | "dot" | "circle" | "line" | "checkbox";
export type ShapeKind = "rect" | "ellipse" | "line" | "arrow";
export type OvKind = "text" | "mark" | "sign" | "image" | "stamp" | "note" | "highlight" | "whiteout" | "redact" | "ink" | ShapeKind;

export interface CommentData {
  text: string;
  resolved?: boolean;
  time: number;
}

/** An object placed on a page (positions in points from the page's top-left). */
export interface Ov {
  id: string;
  kind: OvKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  color?: string;
  opacity?: number;
  width?: number;
  fill?: string | null;
  // text box
  text?: string;
  font?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  align?: "left" | "center" | "right";
  bg?: string | null;
  border?: string | null;
  // others
  mark?: MarkKind;
  src?: string;
  label?: string;
  sub?: string;
  comment?: CommentData;
  /** Ink: points as fractions of the box (x0, y0, x1, y1, ...). */
  pts?: number[];
  /** Line / arrow: start and end as fractions of the box. */
  dir?: [number, number, number, number];
  applied?: boolean;
}

/** A change to text that was already in the PDF ("Edit text"). */
export interface TextEdit {
  text: string;
  original: string;
  font?: string | null;
  size?: number | null;
  color?: string | null;
  cover?: string;
}

export interface Snap {
  pages: PageRef[];
  overlays: Record<string, Ov[]>;
  edits: Record<string, TextEdit>;
  fields: Record<string, string | boolean>;
  gray?: boolean;
  numbers?: boolean;
}

export interface OutlineNode {
  title: string;
  page: number;
  kids?: OutlineNode[];
}

export interface Doc {
  id: string;
  title: string;
  path: string;
  snap: Snap;
  undo: Snap[];
  redo: Snap[];
  dirty: boolean;
  outline?: OutlineNode[];
}

let keySeq = 0;
export const newKey = (p = "pg") => `${p}${++keySeq}${Math.random().toString(36).slice(2, 6)}`;

export const LETTER = { w: 612, h: 792 };

export function pageOf(kind: PageKind, w = LETTER.w, h = LETTER.h): PageRef {
  return { key: newKey(), kind, w, h, rot: 0 };
}

export const DOCS_DIR = "C:\\Users\\You\\Documents\\Clients";

export interface SampleFile {
  id: string;
  title: string;
  kinds: PageKind[];
  size: string;
  bytes: number;
  outline?: OutlineNode[];
  agoMin: number;
}

export const SAMPLES: SampleFile[] = [
  { id: "agreement", title: "Service Agreement - Brightwater.pdf", kinds: ["sa1", "sa2"], size: "184 KB", bytes: 188_416, agoMin: 12 },
  { id: "invoice", title: "Invoice BW-2026-0147.pdf", kinds: ["inv"], size: "96 KB", bytes: 98_304, agoMin: 75 },
  {
    id: "proposal",
    title: "Brand Refresh Proposal.pdf",
    kinds: ["pcover", "psum", "pappr", "ptime", "pbudget", "pnext"],
    size: "2.4 MB",
    bytes: 2_516_582,
    agoMin: 60 * 26,
    outline: [
      { title: "Project Proposal", page: 0 },
      {
        title: "Executive Summary",
        page: 1,
        kids: [
          { title: "Our Approach", page: 2 },
          { title: "Timeline", page: 3 },
        ],
      },
      { title: "Budget", page: 4 },
      { title: "Next Steps", page: 5 },
    ],
  },
  { id: "catalog", title: "Product Catalog 2026.pdf", kinds: ["ccover", "cgrid", "cprice"], size: "9.4 MB", bytes: 9_856_614, agoMin: 60 * 24 * 3 },
];

export const sample = (id: string) => SAMPLES.find((s) => s.id === id)!;

export function makeDoc(title: string, pages: PageRef[], outline?: OutlineNode[]): Doc {
  return {
    id: newKey("doc"),
    title,
    path: `${DOCS_DIR}\\${title}`,
    snap: { pages, overlays: {}, edits: {}, fields: {} },
    undo: [],
    redo: [],
    dirty: false,
    outline,
  };
}

export const docFromSample = (id: string) => {
  const s = sample(id);
  return makeDoc(s.title, s.kinds.map((k) => pageOf(k)), s.outline);
};

export interface RecentFile {
  sample: string;
  name: string;
  path: string;
  size: string;
  agoMin: number;
}

export const RECENT: RecentFile[] = SAMPLES.map((s) => ({ sample: s.id, name: s.title, path: `${DOCS_DIR}\\${s.title}`, size: s.size, agoMin: s.agoMin }));

export function ago(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} h ago`;
  const d = Math.floor(min / 60 / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

// ------------------------------------------------------------------ Free vs Pro (license/features.ts)

export type Feature =
  | "editText"
  | "no_watermark"
  | "ocr"
  | "exportFormats"
  | "redact"
  | "decorations"
  | "compress"
  | "protect"
  | "pdfToImages"
  | "merge"
  | "batch"
  | "cleanup"
  | "unlock"
  | "imagesToPdf"
  | "signatures"
  | "customStamps";

export const FEATURES: Record<Feature, { title: string; pro: string; free: string; highlight: boolean }> = {
  editText: { title: "Edit existing text", pro: "Click any line in a PDF and retype it, in a matching font", free: "Not included", highlight: true },
  no_watermark: { title: "No watermark", pro: "Clean exports", free: "RevinHi watermark on every page", highlight: true },
  ocr: { title: "OCR", pro: "Make scanned PDFs searchable and copyable, fully offline", free: "Not included", highlight: true },
  exportFormats: { title: "Export to Word & text", pro: "Convert PDFs to .docx or .txt and extract every embedded image", free: "Not included", highlight: true },
  redact: { title: "True redaction", pro: "Permanently remove text and images under black boxes", free: "Not included", highlight: true },
  decorations: { title: "Page numbers & watermarks", pro: "Page numbers, headers and footers, Bates numbers and your own watermark", free: "Not included", highlight: true },
  compress: { title: "Compress", pro: "Shrink image-heavy PDFs, often by 80% or more", free: "Not included", highlight: true },
  protect: { title: "Password protection", pro: "AES-256 passwords and print / copy / edit restrictions", free: "Not included", highlight: true },
  pdfToImages: { title: "PDF → Images", pro: "Export pages as PNG or JPG at up to 300 dpi", free: "Not included", highlight: true },
  merge: { title: "Unlimited merge", pro: "Combine any number of files", free: "2 files at a time", highlight: true },
  batch: { title: "Batch mode", pro: "Compress, OCR, protect and more on many files in one go", free: "Not included", highlight: false },
  cleanup: { title: "Clean-up tools", pro: "Grayscale, remove blank pages, flatten annotations", free: "Not included", highlight: false },
  unlock: { title: "Unlock", pro: "Remove a password you know from a PDF", free: "Not included", highlight: false },
  imagesToPdf: { title: "Images → PDF", pro: "Any number of images", free: "Up to 3 images", highlight: false },
  signatures: { title: "Unlimited signatures", pro: "Save as many signatures and initials as you like", free: "1 saved signature", highlight: false },
  customStamps: { title: "Custom stamps", pro: "Make your own stamps with any text and color", free: "Built-in stamps", highlight: false },
};

export const FREE = { mergeFiles: 2, signatures: 1, imagesToPdf: 3 };

// ------------------------------------------------------------------ editor constants

export const SWATCHES = ["#111111", "#ffffff", "#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa"];
export const HL_SWATCHES = ["#ffe600", "#7cff4f", "#4fd2ff", "#ff7ad9", "#ffa64f"];
export const NOTE_SWATCHES = ["#ffd54f", "#ffab91", "#a5d6a7", "#90caf9", "#ce93d8", "#e0e0e0"];

export const FONTS: { id: string; label: string; css: string }[] = [
  { id: "helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { id: "times", label: "Times", css: '"Times New Roman", Times, serif' },
  { id: "courier", label: "Courier", css: '"Courier New", Courier, monospace' },
  { id: "lato", label: "Lato", css: "Lato, 'Segoe UI', sans-serif" },
  { id: "roboto", label: "Roboto", css: "Roboto, 'Segoe UI', sans-serif" },
  { id: "opensans", label: "Open Sans", css: "'Open Sans', 'Segoe UI', sans-serif" },
  { id: "lora", label: "Lora", css: "Lora, Georgia, serif" },
  { id: "jetbrainsmono", label: "JetBrains Mono", css: "'JetBrains Mono', Consolas, monospace" },
  { id: "caveat", label: "Caveat", css: "Caveat, 'Segoe Print', 'Comic Sans MS', cursive" },
];
export const fontCss = (id?: string | null) => FONTS.find((f) => f.id === id)?.css ?? FONTS[0].css;

export const SCRIPT_FONTS = [
  { id: "greatvibes", label: "Great Vibes", css: "'Great Vibes', 'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive" },
  { id: "allura", label: "Allura", css: "Allura, 'Lucida Handwriting', 'Apple Chancery', 'Brush Script MT', cursive" },
  { id: "sacramento", label: "Sacramento", css: "Sacramento, 'Segoe Print', 'Bradley Hand', 'Brush Script MT', cursive" },
];

export const MARKS: { id: MarkKind; glyph: string; title: string; key: string }[] = [
  { id: "check", glyph: "✓", title: "Check mark", key: "k" },
  { id: "cross", glyph: "✗", title: "X mark", key: "x" },
  { id: "dot", glyph: "●", title: "Dot", key: "." },
  { id: "circle", glyph: "◯", title: "Circle (around a word or option)", key: "o" },
  { id: "line", glyph: "—", title: "Line / strike through a word", key: "l" },
  { id: "checkbox", glyph: "☑", title: "Box with check", key: "b" },
];

export interface StampSpec {
  label: string;
  sub?: string;
  color: string;
}

export const TODAY = "Nov 20, 2026";

export const PRESET_STAMPS: StampSpec[] = [
  { label: "APPROVED", color: "#2e7d32" },
  { label: "REJECTED", color: "#c62828" },
  { label: "DRAFT", color: "#546e7a" },
  { label: "CONFIDENTIAL", color: "#c62828" },
  { label: "FINAL", color: "#1565c0" },
  { label: "PAID", color: "#2e7d32" },
  { label: "RECEIVED", color: "#1565c0" },
  { label: "VOID", color: "#c62828" },
  { label: "SIGNED", sub: TODAY, color: "#1565c0" },
  { label: TODAY, color: "#1565c0" },
];
