"use client";

import { useState } from "react";
import type { FileRec } from "./data";
import { IconPause, IconPlay, c } from "./ui";

// Stand-ins for the app's previews: drawn pictures instead of the real photos, a player bar for
// videos and music, a page for PDFs, text for text files and the first bytes for everything else.

const SCENES = [
  { sky: ["#e0705a", "#c95a4a"], sun: "#f8e3c2", hills: ["#3d6b5c", "#2a4c43", "#1f3a33"] },
  { sky: ["#7fb7e2", "#d6ebf6"], sun: "#ffffff", hills: ["#2d7fb0", "#e8d3a0", "#d9bf86"] },
  { sky: ["#a7d3c9", "#e6f2e9"], sun: "#fff6d8", hills: ["#3f7d58", "#2f6b48", "#24533a"] },
  { sky: ["#1b1840", "#3c2b6b"], sun: "#f1f0ff", hills: ["#2a2457", "#1d1945", "#15122c"] },
  { sky: ["#9bbbe0", "#dbe8f5"], sun: "#ffffff", hills: ["#7d8fae", "#5d6f8c", "#46566f"] },
  { sky: ["#f2a65a", "#7b4d8f"], sun: "#ffe2b0", hills: ["#4a3156", "#352240", "#24172c"] },
];

function Scene({ look, damaged, play }: { look: number; damaged?: boolean; play?: boolean }) {
  const s = SCENES[look % SCENES.length];
  const id = `sky${look}`;
  const night = look % SCENES.length === 3;
  return (
    <svg viewBox="0 0 320 220" className={c("preview-art")} role="img" aria-label="Preview">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.sky[0]} />
          <stop offset="1" stopColor={s.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="320" height="220" fill={`url(#${id})`} />
      {night &&
        [
          [40, 30],
          [90, 55],
          [150, 25],
          [210, 48],
          [270, 22],
          [300, 70],
          [120, 80],
        ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff" opacity="0.8" />)}
      <circle cx={look % 2 ? 90 : 230} cy={night ? 58 : 82} r={night ? 16 : 22} fill={s.sun} opacity="0.95" />
      <path d="M0 150 Q40 118 80 140 T160 132 T240 128 T320 140 V220 H0Z" fill={s.hills[0]} />
      <path d="M0 172 Q50 140 100 166 T200 158 T320 166 V220 H0Z" fill={s.hills[1]} />
      <path d="M0 196 Q60 176 130 192 T260 186 T320 194 V220 H0Z" fill={s.hills[2]} />
      {damaged && (
        <>
          <rect y="168" width="320" height="52" fill="#7d7d7d" />
          <rect y="168" width="320" height="3" fill="#9a9a9a" />
        </>
      )}
      {play && (
        <g>
          <circle cx="160" cy="110" r="26" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <path d="M152 97 L174 110 L152 123Z" fill="#fff" />
        </g>
      )}
    </svg>
  );
}

function ScreenshotArt({ look }: { look: number }) {
  return (
    <svg viewBox="0 0 320 200" className={c("preview-art")} role="img" aria-label="Preview">
      <rect width="320" height="200" fill={look % 2 ? "#1d2735" : "#f3f4f7"} />
      <rect width="320" height="18" fill={look % 2 ? "#141b25" : "#dfe2e8"} />
      <circle cx="10" cy="9" r="3" fill="#ff5f56" />
      <circle cx="20" cy="9" r="3" fill="#ffbd2e" />
      <circle cx="30" cy="9" r="3" fill="#27c93f" />
      <rect x="10" y="28" width="70" height="162" rx="4" fill={look % 2 ? "#243246" : "#e6e9ef"} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="18" y={40 + i * 16} width={44 - i * 4} height="6" rx="3" fill={look % 2 ? "#3a4d68" : "#c9ced8"} />
      ))}
      <rect x="92" y="28" width="218" height="70" rx="6" fill={look % 2 ? "#2d6cdf" : "#4f7cff"} />
      <rect x="92" y="108" width="104" height="82" rx="6" fill={look % 2 ? "#243246" : "#ffffff"} />
      <rect x="206" y="108" width="104" height="82" rx="6" fill={look % 2 ? "#243246" : "#ffffff"} />
    </svg>
  );
}

function MediaBar({ length }: { length: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={c("media-bar")}>
      <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
        {playing ? <IconPause size={13} /> : <IconPlay size={13} />}
      </button>
      <span>{playing ? "0:07" : "0:00"} / {length}</span>
      <span className={c("media-track")}>
        <span style={{ width: playing ? "6%" : "0%" }} />
      </span>
    </div>
  );
}

function AlbumArt({ look }: { look: number }) {
  const s = SCENES[(look + 3) % SCENES.length];
  return (
    <svg viewBox="0 0 320 170" className={c("preview-art")} role="img" aria-label="Song">
      <defs>
        <linearGradient id={`al${look}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={s.sky[0]} />
          <stop offset="1" stopColor={s.hills[2]} />
        </linearGradient>
      </defs>
      <rect width="320" height="170" fill="#121212" />
      <rect x="105" y="10" width="110" height="110" rx="8" fill={`url(#al${look})`} />
      <path d="M150 92V48l30-6v40" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="143" cy="92" r="8" fill="#fff" />
      <circle cx="173" cy="84" r="8" fill="#fff" />
      {Array.from({ length: 40 }, (_, i) => {
        const h = 6 + Math.abs(Math.sin(i * 1.7 + look)) * 22;
        return <rect key={i} x={20 + i * 7} y={150 - h / 2} width="4" height={h} rx="2" fill="rgba(255,255,255,0.35)" />;
      })}
    </svg>
  );
}

function PageArt({ f }: { f: FileRec }) {
  const title = f.name.replace(/\.[^.]+$/, "");
  return (
    <svg viewBox="0 0 230 300" className={c("preview-art")} style={{ maxWidth: 230, margin: "0 auto", background: "#fff" }} role="img" aria-label="First page">
      <rect width="230" height="300" fill="#fff" />
      <text x="20" y="38" fontSize="13" fontWeight="700" fill="#1b2330" fontFamily="Segoe UI, sans-serif">
        {title.length > 26 ? `${title.slice(0, 26)}…` : title}
      </text>
      <rect x="20" y="48" width="190" height="2" fill="#2d6cdf" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x="20" y={66 + i * 13} width={i % 5 === 4 ? 110 : 190 - ((i * 37) % 30)} height="5" rx="2" fill="#d5dae3" />
      ))}
      <rect x="20" y="280" width="60" height="4" rx="2" fill="#e4e7ee" />
      {f.chance === "poor" && <rect y="150" width="230" height="150" fill="#9a9a9a" />}
    </svg>
  );
}

const MAGIC: Record<string, number[]> = {
  docx: [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00],
  xlsx: [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00],
  pptx: [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00],
  zip: [0x50, 0x4b, 0x03, 0x04, 0x0a, 0x00, 0x00, 0x00],
  "7z": [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c, 0x00, 0x04],
  rar: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00],
};

function hexDump(f: FileRec) {
  let s = f.id * 2654435761;
  const next = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s >>> 16) & 0xff;
  };
  const head = MAGIC[f.ext] ?? [];
  const bytes = Array.from({ length: 96 }, (_, i) => (i < head.length ? head[i] : i < 30 && f.ext.endsWith("x") ? "[Content_Types].xml".charCodeAt(i - 8) || 0 : next()));
  const lines: string[] = [];
  for (let o = 0; o < bytes.length; o += 8) {
    const row = bytes.slice(o, o + 8);
    const hex = row.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
    const text = row.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${o.toString(16).padStart(8, "0").toUpperCase()}  ${hex}  ${text}`);
  }
  return lines.join("\n");
}

const TEXT: Record<string, string> = {
  "Notes.txt": "Groceries: milk, eggs, coffee, lemons\nCall the plumber on Thursday\nBook the dentist for March\n\nGift ideas:\n- a new phone case for Mom\n- concert tickets\n- the blue scarf from the market",
  "Contacts.vcf": "BEGIN:VCARD\nVERSION:3.0\nFN:Sam Rivera\nTEL;TYPE=CELL:555-0142\nEND:VCARD\nBEGIN:VCARD\nVERSION:3.0\nFN:Jordan Lee\nTEL;TYPE=CELL:555-0187\nEND:VCARD",
};

const MEDIA_LENGTH = (f: FileRec) => {
  const secs = f.kind === "videos" ? Math.round(f.size / 4.2e6) : Math.round(f.size / 32e3);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
};

export function PreviewBody({ f }: { f: FileRec }) {
  const damaged = f.chance !== "good";
  if (f.kind === "pictures") {
    if (f.ext === "png" && f.name.startsWith("Screenshot")) return <ScreenshotArt look={f.look} />;
    return <Scene look={f.look} damaged={f.chance === "poor" || (damaged && f.look % 2 === 0)} />;
  }
  if (f.kind === "videos")
    return (
      <>
        <Scene look={f.look + 1} play />
        <MediaBar length={MEDIA_LENGTH(f)} />
      </>
    );
  if (f.kind === "music")
    return (
      <>
        <AlbumArt look={f.look} />
        <MediaBar length={MEDIA_LENGTH(f)} />
      </>
    );
  if (f.ext === "pdf") return <PageArt f={f} />;
  if (TEXT[f.name] || f.ext === "txt") return <pre className={c("preview-text")}>{TEXT[f.name] ?? "This file is empty."}</pre>;
  return (
    <>
      <div className={c("text-muted preview-note")}>This kind of file can&apos;t be shown here. Its first bytes:</div>
      <pre className={c("preview-hex")}>{hexDump(f)}</pre>
    </>
  );
}
