import type { PicId } from "./ui";

/*
 * Sample data for the RevinHi AI preview: a slice of the app's real model list (names, sizes and
 * descriptions from revinhi-studio/src-tauri/catalog.json), a sample PC, sample chats and the
 * canned answers the preview "streams". Nothing here talks to an AI or the internet.
 */

// ------------------------------------------------------------------ the sample PC

export const PC = { gpu: "NVIDIA GeForce RTX 4070", short: "RTX 4070", vram: 12, ram: 32, free: 168.4e9 };

// ------------------------------------------------------------------ models

export interface Model {
  id: string;
  name: string;
  category: string;
  chat?: boolean;
  params?: string;
  size: number; // bytes
  caps: string[];
  desc: string;
  released: string;
  rank: number;
  minVram: number;
  recVram: number;
  roles: string[];
}

const m = (id: string, name: string, category: string, chat: boolean, params: string, gbs: number, rank: number, caps: string, released: string, minVram: number, recVram: number, roles: string, desc: string): Model => ({
  id,
  name,
  category,
  chat,
  params: params || undefined,
  size: gbs * 1e9,
  rank,
  caps: caps ? caps.split(",") : [],
  released,
  minVram,
  recVram,
  roles: roles ? roles.split(",") : [],
  desc,
});

export const MODELS: Model[] = [
  m("qwen3.5-9b-u", "Qwen3.5 9B Uncensored", "chat", true, "9B", 6.5, 3, "vision,thinking,uncensored", "2026-03", 0, 8, "chat,vision,code", "The best all-rounder for 8 GB graphics cards, refusals removed. Sees images, can think step by step."),
  m("qwen3.5-4b-u", "Qwen3.5 4B Uncensored", "chat", true, "4B", 3.4, 5, "vision,thinking,uncensored", "2026-03", 0, 4, "chat,vision", "Small, fast and smart, refusals removed. Sees images. Good on laptops and PCs without a big graphics card."),
  m("qwen3.5-9b", "Qwen3.5 9B", "chat", true, "9B", 6.6, 12, "vision,thinking", "2026-02", 0, 8, "chat,vision,code", "Official Qwen3.5 9B (filtered). Sees images, can think step by step."),
  m("qwen3.5-2b", "Qwen3.5 2B", "chat", true, "2B", 1.9, 40, "vision,thinking,cpu", "2026-02", 0, 0, "chat,vision", "Tiny and quick: runs on any PC, even without a graphics card. Sees images."),
  m("gemma-4-12b-u", "Gemma 4 12B Uncensored", "chat", true, "12B", 7.5, 7, "vision,uncensored,writing", "2026-06", 0, 10, "chat,vision", "Google's Gemma 4 12B with refusals removed. Great writer, sees images. Best on 10 GB+ cards."),
  m("gemma-4-e4b", "Gemma 4 E4B", "chat", true, "8B (4B active)", 6.0, 20, "vision,audio", "2026-04", 0, 6, "chat,vision", "Google's efficient small Gemma 4. Sees images and understands audio."),
  m("qwen3.6-35b-u", "Qwen3.6 35B-A3B Uncensored", "chat", true, "35B (3B active)", 19.8, 6, "vision,thinking,uncensored,moe", "2026-04", 6, 16, "chat,vision,code", "Big-brain mixture-of-experts model, refusals removed. Much smarter than 9B and still quick, because only 3B is active at a time. Needs 32 GB of RAM."),
  m("gpt-oss-20b", "gpt-oss 20B", "chat", true, "21B (3.6B active)", 12.1, 18, "thinking,moe", "2025-08", 6, 16, "chat,code", "OpenAI's open model. Strong at reasoning and step-by-step problem solving."),
  m("qwen3.8-27b-u", "Qwen3.8 27B Uncensored", "chat", true, "27B", 15.3, 1, "vision,thinking,uncensored", "2026-08", 16, 24, "chat,vision,code", "The newest open flagship, refusals removed. Top quality for 24 GB graphics cards; slow on smaller ones."),
  m("qwen3-coder-30b", "Qwen3 Coder 30B-A3B", "code", true, "30B (3B active)", 16.4, 5, "code,moe", "2025-07", 6, 16, "code,chat", "The most popular local coding model. Writes whole apps, explains and fixes code. Fast mixture-of-experts; needs 32 GB of RAM."),
  m("ornith-1.5-9b", "Ornith 1.5 9B", "code", true, "9B", 6.7, 8, "code,thinking,vision", "2026-08", 0, 8, "code,chat,vision", "Small reasoning model that's very strong at code and math for its size. Fits 8 GB."),
  m("mellum2.1-12b", "Mellum 2.1 12B Thinking", "code", true, "12B (2.5B active)", 7.0, 6, "code,thinking,moe", "2026-10", 0, 8, "code,chat", "JetBrains' new coding model (October 2026). Small mixture-of-experts, so it's fast."),
  m("devstral-small-2", "Devstral Small 2 24B", "code", true, "24B", 15.4, 7, "code,vision", "2025-12", 12, 16, "code,chat,vision", "Mistral's coding agent model. Great at working through real projects. Best on 16 GB+ cards."),
  m("z-image-turbo", "Z-Image Turbo", "image", false, "6B", 11.5, 10, "photoreal", "2025-11", 6, 8, "image", "Photorealistic images in about 20 seconds. Great skin, light and text."),
  m("flux2-klein-4b", "FLUX.2 klein 4B", "image", false, "4B", 10.0, 12, "photoreal,multi-image,fast", "2026-01", 6, 8, "image,edit", "Black Forest Labs' small FLUX.2: sharp pictures in about 12 seconds, and it edits photos (change outfits, combine a person and a place) in 15-20 seconds on 8 GB."),
  m("qwen-image-2.1", "Qwen-Image 2.1 Turbo", "image", false, "20B", 14.2, 13, "photoreal,text-in-image,multi-image", "2026-10", 8, 8, "image,edit", "The current top open image model (September 2026): stunning realism and perfect text in pictures, plus photo editing. About 20 seconds a picture on 8 GB."),
  m("krea-2-turbo", "Krea-2 Turbo", "image", false, "12B", 19.0, 16, "photoreal", "2026-06", 8, 8, "image", "Krea's photoreal model: natural light, skin and film-like looks. About 30 seconds a picture on 8 GB."),
  m("flux2-dev", "FLUX.2 dev", "image", false, "32B", 56.6, 20, "photoreal,text-in-image", "2025-11", 8, 24, "image", "Black Forest Labs' full 32B FLUX.2 with the official 8-step Turbo boost: top detail and prompt following. About 2-3 minutes a picture on an 8 GB card (needs 64 GB of RAM); faster on bigger cards."),
  m("qwen-image-edit", "Qwen-Image-Edit 2511", "edit", false, "20B", 24.6, 10, "multi-image", "2025-12", 8, 12, "edit", "Edit photos by describing the change. Can combine a person and a product into one shot."),
  m("tryon-klein-9b", "Try On (FLUX.2 klein 9B)", "tryon", false, "9B", 16.1, 13, "photoreal,multi-image", "2026-02", 8, 8, "tryon", "Dress any person in clothes from photos: give it the person, a top and bottoms (or a dress) and it keeps their face, body and pose. About 30 seconds on 8 GB."),
  m("wan22-i2v", "Wan 2.2 Image-to-Video 14B", "video", false, "14B", 27.6, 10, "image-to-video", "2025-07", 8, 12, "video", "Brings a photo to life: people move, the camera moves. About 5 minutes per 5-second clip on 8 GB."),
  m("wan22-5b", "Wan 2.2 5B (fast video)", "video", false, "5B", 13.5, 12, "text-to-video,image-to-video,fast", "2025-07", 8, 8, "video", "Smaller Wan 2.2: video from a description or a photo. About 6 minutes per 5-second clip on an 8 GB card, 4x faster than the 14B."),
  m("infinitetalk", "InfiniteTalk", "talk", false, "14B", 21.9, 10, "", "2025-08", 8, 12, "talk", "Makes the person in a photo say anything, with natural head and body movement."),
  m("wan22-animate", "Wan 2.2 Animate 14B", "remix", false, "14B", 22.1, 10, "", "2025-09", 8, 12, "remix", "Copy the moves from any video onto your character, or swap the person in it."),
  m("chatterbox-turbo", "Chatterbox Turbo", "voice", false, "350M", 3.0, 10, "", "2025-12", 0, 4, "voice", "Natural English voices and voice cloning from a few seconds of audio. Fast."),
  m("kokoro", "Kokoro", "voice", false, "82M", 0.4, 30, "cpu", "2025-01", 0, 0, "voice", "Tiny and instant: 54 built-in voices, runs well even without a graphics card."),
  m("whisper-small", "Whisper Small", "stt", false, "244M", 0.5, 20, "", "2023-03", 0, 2, "stt", "Speech to text in 99 languages. Used for dictation and word-timed captions."),
  m("ace-step", "ACE-Step 1.5", "music", false, "3.5B", 10.0, 10, "songs,vocals", "2026-01", 6, 8, "music", "Makes full songs with vocals (or instrumentals) in any style from a description and lyrics. A 2-minute song takes about a minute."),
  m("lib-wiki", "Wikipedia: top 1 million (summaries)", "library", false, "", 3.0, 1, "", "2026-04", 0, 0, "", "The opening summary of the 1 million most-read English Wikipedia articles. The AI looks things up here when offline."),
  m("lib-wikimed", "Medical encyclopedia (WikiMed)", "library", false, "", 1.0, 2, "", "2026-10", 0, 0, "", "Every medical article on English Wikipedia: conditions, first aid, drugs, anatomy. Full text, no pictures."),
  m("lib-ifixit", "iFixit repair guides", "library", false, "", 3.6, 3, "", "2025-12", 0, 0, "", "Step-by-step repair guides for phones, computers, cars, appliances and gear."),
  m("birefnet", "BiRefNet background remover", "tools", false, "", 0.4, 10, "", "2024-08", 0, 2, "", "Cuts products and people out of their background, cleanly."),
  m("realesrgan", "Real-ESRGAN x4 upscaler", "tools", false, "", 0.1, 10, "", "2021-07", 0, 2, "", "Makes small images 4× bigger and sharper."),
];

export const INSTALLED = [
  "qwen3.5-9b-u",
  "qwen3.5-4b-u",
  "gemma-4-12b-u",
  "z-image-turbo",
  "flux2-klein-4b",
  "wan22-5b",
  "chatterbox-turbo",
  "kokoro",
  "whisper-small",
  "birefnet",
  "realesrgan",
  "lib-wiki",
  "lib-wikimed",
];

export const ROLES: Record<string, string> = {
  chat: "qwen3.5-9b-u",
  code: "qwen3.5-9b-u",
  vision: "qwen3.5-9b-u",
  image: "z-image-turbo",
  edit: "flux2-klein-4b",
  video: "wan22-5b",
  voice: "kokoro",
  stt: "whisper-small",
};

export const PACKS: { id: string; name: string; desc: string; models: string[] }[] = [
  { id: "core", name: "Core", desc: "Smart uncensored chat that sees images, photo generation, voices, dictation and cutouts. Runs on most PCs.", models: ["qwen3.5-9b-u", "qwen3.5-4b-u", "z-image-turbo", "chatterbox-turbo", "kokoro", "whisper-small", "birefnet", "realesrgan", "lib-wiki", "lib-wikimed"] },
  { id: "creator", name: "Creator", desc: "Photo editing, image-to-video, talking people and video remix (8 GB+ NVIDIA).", models: ["qwen-image-edit", "wan22-i2v", "infinitetalk", "wan22-animate", "flux2-klein-4b", "wan22-5b", "ace-step"] },
  { id: "power", name: "Power brains", desc: "Bigger, smarter chat and coding models for PCs with 32 GB+ RAM or 16 GB+ graphics cards.", models: ["qwen3.6-35b-u", "qwen3-coder-30b", "gpt-oss-20b", "gemma-4-12b-u", "mellum2.1-12b"] },
  { id: "flagship", name: "Flagship (24 GB)", desc: "The best open models for 24 GB graphics cards.", models: ["qwen3.8-27b-u", "devstral-small-2", "flux2-dev"] },
];

export const CATS: [string, string][] = [
  ["all", "All"],
  ["chat", "Chat"],
  ["code", "Coding"],
  ["image", "Images"],
  ["edit", "Photo editing"],
  ["tryon", "Try on clothes"],
  ["video", "Video"],
  ["talk", "Talking video"],
  ["remix", "Remix"],
  ["voice", "Voice"],
  ["music", "Music"],
  ["stt", "Speech to text"],
  ["library", "Library"],
  ["tools", "Tools"],
];

export const ROLE_LABELS: [string, string][] = [
  ["chat", "Chat (default brain, also writes ads)"],
  ["code", "Coding"],
  ["vision", "Looking at images"],
  ["image", "Making images"],
  ["edit", "Editing photos"],
  ["tryon", "Trying on clothes"],
  ["video", "Making videos"],
  ["talk", "Talking video"],
  ["remix", "Video remix"],
  ["voice", "Voice"],
  ["music", "Music"],
  ["stt", "Speech to text"],
];

export const CAP_BADGES: Record<string, [string, string]> = {
  vision: ["eye", "Sees images"],
  thinking: ["bulb", "Can think step by step"],
  uncensored: ["unlock", "Uncensored"],
  code: ["code", "Good at code"],
  moe: ["bolt", "Mixture of experts: big but fast"],
  audio: ["waves", "Understands audio"],
  writing: ["pen", "Strong writer"],
  cpu: ["cpu", "Fine without a graphics card"],
  photoreal: ["image", "Photoreal"],
  "multi-image": ["layers", "Combines several photos"],
  fast: ["bolt", "Fast"],
  "text-in-image": ["text", "Great text in pictures"],
  "text-to-video": ["pen", "Video from words"],
  "image-to-video": ["video", "Video from a photo"],
  songs: ["music", "Full songs"],
  vocals: ["mic", "Sings"],
};

export type Fit = { level: "great" | "ok" | "slow" | "no"; label: string };

/** How well a model runs on the sample PC (the app's own rules). */
export function fitOf(mo: Model): Fit {
  const { vram, ram } = PC;
  const size = mo.size / 1e9;
  if (mo.chat) {
    if (vram >= size + 1.2) return { level: "great", label: "Runs fast here" };
    if (mo.caps.includes("moe") && ram >= 30 && vram >= mo.minVram) return { level: "ok", label: "Runs well here" };
    if (vram + ram * 0.6 >= size) return { level: "slow", label: "Runs, but slowly" };
    return { level: "no", label: "Too big for this PC" };
  }
  if (mo.minVram === 0 && mo.recVram <= 4) return { level: "great", label: "Runs fast here" };
  if (vram >= mo.recVram - 0.5) return { level: "great", label: "Runs well here" };
  if (vram >= mo.minVram - 0.5) return { level: "slow", label: "Runs, but slowly" };
  return { level: "no", label: `Needs ${mo.minVram} GB+ graphics memory` };
}

/** Released in the last 100 days (counted from the preview's fixed "today"). */
export function isNew(mo: Model) {
  const [y, mm] = mo.released.split("-").map(Number);
  return Date.UTC(2026, 10, 20) - Date.UTC(y, mm - 1) < 100 * 864e5;
}

// ------------------------------------------------------------------ chat

export const ASSISTANTS: { id: string; name: string; icon: string; blurb: string }[] = [
  { id: "default", name: "RevinHi AI", icon: "spark", blurb: "Questions, writing, ideas, planning and everyday help." },
  { id: "coder", name: "Coder", icon: "code", blurb: "Writes, tests and fixes code with the coding model." },
  { id: "writer", name: "Writer", icon: "pen", blurb: "Writes and edits in the tone you want." },
  { id: "marketer", name: "Marketer", icon: "megaphone", blurb: "Hooks, ad scripts, product copy and captions." },
  { id: "prompter", name: "Prompt artist", icon: "palette", blurb: "Turns ideas into prompts for pictures and video." },
  { id: "tutor", name: "Tutor", icon: "cap", blurb: "Explains step by step and checks you understood." },
];

export const STARTERS: [string, string][] = [
  ["drop", "How do I make creek water safe to drink?"],
  ["code", "Build a single-file HTML to-do app with a dark glass look"],
  ["pen", "Rewrite this to sound more confident: "],
  ["bulb", "Give me 10 scroll-stopping hooks for a pocket knife ad"],
];

export const VOICES: [string, string][] = [
  ["kokoro:af_heart", "Heart (US, female) · instant"],
  ["kokoro:af_bella", "Bella (US, female) · instant"],
  ["kokoro:am_michael", "Michael (US, male) · instant"],
  ["kokoro:am_adam", "Adam (US, male) · instant"],
  ["kokoro:bf_emma", "Emma (UK, female) · instant"],
  ["kokoro:bm_george", "George (UK, male) · instant"],
  ["turbo", "Natural female · Chatterbox"],
  ["turbo:male", "Natural male · Chatterbox"],
];

export type Media = { kind: "image" | "video" | "audio"; pic?: PicId; prompt?: string; secs?: number };
export type Run = { math?: boolean; language: string; ok: boolean; output: string; secs?: number };
export type ChatPin = { id: string; name: string; lng: number; lat: number; from?: string; kind: string };

export interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  reasoning?: string;
  modelName?: string;
  tps?: number;
  status?: string;
  stopped?: boolean;
  media?: Media[];
  gen?: { label: string; pct: number; text: string; eta?: string };
  runs?: Run[];
  pins?: ChatPin[];
}
export interface Conv {
  id: string;
  title: string;
  group: string;
  messages: Msg[];
  model?: string;
  assistant?: string;
  think?: boolean;
  temperature?: number;
  system?: string;
}

export const SEED_CHATS: Conv[] = [
  {
    id: "c1",
    title: "Camping checklist for 3 nights",
    group: "Today",
    messages: [
      { id: "c1a", role: "user", text: "Make me a short camping checklist for 3 nights, 2 people, no car camping" },
      {
        id: "c1b",
        role: "assistant",
        modelName: "Qwen3.5 9B Uncensored",
        tps: 52,
        text: "### Shelter and sleep\n- Tent with stakes and rain fly\n- 2 sleeping bags rated 10°F below the coldest night\n- 2 sleeping pads\n\n### Water and food\n- Filter **and** backup tablets\n- 2 liters of bottles per person\n- Stove, fuel for 3 days, lighter and matches\n- 3 dinners, 3 breakfasts, lunches and snacks (about 2 lb of food per person per day)\n\n### Safety\n- Map, compass and a charged power bank\n- First aid kit, headlamps, spare batteries\n- Knife, rope, trash bags\n\nTell me the expected night temperature and I'll tune the sleeping gear.",
      },
    ],
  },
  {
    id: "c2",
    title: "Neon ramen shop at night",
    group: "Yesterday",
    messages: [
      { id: "c2a", role: "user", text: "Make a picture of a neon-lit ramen shop in Tokyo at night, rain on the window, a sign that reads OPEN LATE" },
      { id: "c2b", role: "assistant", modelName: "Z-Image Turbo", text: "", media: [{ kind: "image", pic: "ramenBig", prompt: "A neon-lit ramen shop in Tokyo at night, rain on the window, a sign that reads OPEN LATE" }] },
    ],
  },
  {
    id: "c3",
    title: "Explain compound interest simply",
    group: "Yesterday",
    messages: [
      { id: "c3a", role: "user", text: "Explain compound interest simply" },
      {
        id: "c3b",
        role: "assistant",
        modelName: "Qwen3.5 9B Uncensored",
        tps: 49,
        text: "Compound interest means you earn interest **on your interest**, not just on the money you put in.\n\nSay you save **$1,000** at 5% a year:\n\n1. After year 1 you have $1,050.\n2. In year 2 the 5% is worked out on $1,050, so you get $52.50 instead of $50.\n3. After 10 years you have about **$1,629**, not $1,500.\n\nThe longer you leave it, the faster it grows. That's why starting early matters more than starting big.",
      },
    ],
  },
  {
    id: "c4",
    title: "Birthday message for my brother",
    group: "This week",
    messages: [
      { id: "c4a", role: "user", text: "Short funny birthday message for my brother who just turned 30" },
      {
        id: "c4b",
        role: "assistant",
        modelName: "Gemma 4 12B Uncensored",
        tps: 38,
        text: "Happy 30th! Officially old enough to make a noise every time you sit down, but still young enough to pretend you didn't. Love you, see you at the party (bring your reading glasses).",
      },
    ],
  },
];

// ------------------------------------------------------------------ canned answers

export type Canned = {
  text: string;
  think?: string;
  runs?: Run[];
  pins?: ChatPin[];
  make?: { kind: "image" | "video" | "audio"; pic?: PicId };
};

const TODO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>To-do</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
         background: radial-gradient(circle at 20% 10%, #1c2b22, #050505 70%);
         font-family: "Segoe UI", system-ui, sans-serif; color: #fff; }
  .card { width: 340px; padding: 22px; border-radius: 18px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.15);
          backdrop-filter: blur(16px); box-shadow: 0 20px 60px rgba(0,0,0,.5); }
  h1 { margin: 0 0 14px; font-size: 20px; }
  input { width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.2); background: rgba(0,0,0,.3); color: #fff; outline: none; }
  ul { list-style: none; padding: 0; margin: 14px 0 0; }
  li { display: flex; align-items: center; gap: 10px; padding: 9px 4px;
       border-bottom: 1px solid rgba(255,255,255,.08); }
  li.done span { text-decoration: line-through; opacity: .45; }
  .tick { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #2ed573; cursor: pointer; }
  li.done .tick { background: #2ed573; }
  span { flex: 1; }
  button { border: 0; background: none; color: #ff6b6b; font-size: 18px; cursor: pointer; }
</style>
</head>
<body>
<div class="card">
  <h1>Today</h1>
  <input id="add" placeholder="Add a task and press Enter">
  <ul id="list"></ul>
</div>
<script>
  const tasks = [{ text: "Charge the drive", done: true }, { text: "Plan the weekend trip", done: false }];
  const list = document.getElementById("list");
  function draw() {
    list.innerHTML = "";
    tasks.forEach((t, i) => {
      const li = document.createElement("li");
      li.className = t.done ? "done" : "";
      li.innerHTML = '<div class="tick"></div><span></span><button title="Remove">×</button>';
      li.querySelector("span").textContent = t.text;
      li.querySelector(".tick").onclick = () => { t.done = !t.done; draw(); };
      li.querySelector("button").onclick = () => { tasks.splice(i, 1); draw(); };
      list.appendChild(li);
    });
  }
  document.getElementById("add").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      tasks.push({ text: e.target.value.trim(), done: false });
      e.target.value = "";
      draw();
    }
  });
  draw();
</script>
</body>
</html>`;

const HEDGES = [
  /\bI'?m not sure,? but\s*/gi,
  /\bI (just )?(think|feel like|guess|believe)( that)?\s*/gi,
  /\b(maybe|perhaps|hopefully|possibly)\s*/gi,
  /\b(just|kind of|sort of|a little bit|a bit|really)\s+/gi,
  /\bif that'?s (ok|okay|alright)\b[,.]?\s*/gi,
  /\bsorry,?\s*/gi,
  /\btry to\s+/gi,
  /\bcould (possibly )?/gi,
];

function confident(src: string) {
  let t = src;
  HEDGES.forEach((h) => (t = t.replace(h, "")));
  t = t.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  return t
    .split(/(?<=[.!?])\s+/)
    .map((x) => (x ? x[0].toUpperCase() + x.slice(1) : x))
    .join(" ");
}

/** Very small calculator: numbers, + - * / ( ), and "X% of Y". */
function calc(q: string): { expr: string; value: number } | null {
  const pct = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:tip\s*)?(?:of|on)\s*\$?(\d+(?:\.\d+)?)/i);
  if (pct) {
    const a = Number(pct[1]);
    const b = Number(pct[2]);
    return { expr: `${b} * ${a} / 100`, value: (b * a) / 100 };
  }
  const ex = q.replace(/[×x](?=\s*\d)/g, "*").replace(/÷/g, "/").match(/[\d.(][\d.\s+\-*/()]*[\d.)]/);
  if (!ex || !/[+\-*/]/.test(ex[0])) return null;
  const src = ex[0].replace(/\s+/g, "");
  let i = 0;
  const num = (): number => {
    if (src[i] === "(") {
      i++;
      const v = sum();
      i++;
      return v;
    }
    if (src[i] === "-") {
      i++;
      return -num();
    }
    const m2 = src.slice(i).match(/^\d+(\.\d+)?/);
    if (!m2) throw new Error("bad");
    i += m2[0].length;
    return Number(m2[0]);
  };
  const prod = (): number => {
    let v = num();
    while (src[i] === "*" || src[i] === "/") v = src[i++] === "*" ? v * num() : v / num();
    return v;
  };
  const sum = (): number => {
    let v = prod();
    while (src[i] === "+" || src[i] === "-") v = src[i++] === "+" ? v + prod() : v - prod();
    return v;
  };
  try {
    const value = sum();
    if (i !== src.length || !Number.isFinite(value)) return null;
    return { expr: src.replace(/([+\-*/])/g, " $1 "), value };
  } catch {
    return null;
  }
}

const nice = (v: number) => (Number.isInteger(v) ? v.toLocaleString("en-US") : v.toLocaleString("en-US", { maximumFractionDigits: 4 }));

function picFor(q: string): PicId {
  if (/ramen|noodle|tokyo|japan|open late/i.test(q)) return "ramenBig";
  if (/neon|sign|alley|night|city|light/i.test(q)) return "neon";
  if (/mug|teal|green/i.test(q)) return "mug";
  if (/cup|coffee|tea|kitchen|morning|breakfast/i.test(q)) return "cup";
  if (/shop|store|street|restaurant|cafe|window/i.test(q)) return "street";
  const all: PicId[] = ["street", "ramenBig", "cup", "neon", "mug"];
  return all[q.length % all.length];
}

/** The closest built-in answer to a message (the real app asks the model instead). */
export function cannedReply(q: string, model: string, assistant: string): Canned {
  const t = q.toLowerCase();
  const think = `The question: "${q.trim().slice(0, 90)}${q.trim().length > 90 ? "…" : ""}"\n\nWhat do they actually need? A clear, practical answer in plain words. Check the key facts, keep it short, and lay it out in steps or a list where that helps.`;

  // Making things: the chat hands the job to the right model.
  if (/\b(make|create|draw|generate|paint|show me|design)\b.*\b(video|clip|animation)\b|\banimate\b/.test(t)) return { text: "", make: { kind: "video", pic: picFor(t) === "mug" ? "mug" : "cup" }, think };
  if (/\b(make|create|draw|generate|paint|show me|design|render)\b.*\b(picture|image|photo|drawing|painting|poster|logo|wallpaper|portrait)\b|^draw\b/.test(t)) return { text: "", make: { kind: "image", pic: picFor(t) }, think };
  if (/\b(read|say|speak)\b.*\b(aloud|out loud)\b|\bin a voice\b/.test(t)) return { text: "", make: { kind: "audio" }, think };

  const rewrite = q.match(/rewrite this to sound more confident:\s*([\s\S]*)/i);
  if (rewrite) {
    const src = rewrite[1].trim() || "I just think maybe we could possibly try to launch next week, if that's okay with everyone.";
    const out = confident(src);
    return {
      think,
      text: `Here's a more confident version:\n\n**${out}**\n\nWhat changed: I took out the hedging words (like "just", "maybe" and "I think") and kept your meaning, so it reads like a decision instead of a request for permission.`,
    };
  }

  if (/creek|stream|river|lake|drink(ing)? water|water safe|purif|filter water|boil water/.test(t))
    return {
      think,
      text: "Boiling is the most reliable way. Here's the safe order:\n\n1. **Let it settle.** Fill a container and let the dirt sink for 30 minutes, or pour it through a clean cloth or coffee filter.\n2. **Boil it.** Bring it to a full rolling boil for **1 minute** (3 minutes above 6,500 ft / 2,000 m). Let it cool with a lid on.\n3. **No fire? Use tablets or bleach.** Chlorine dioxide tablets kill most germs; follow the packet's wait time. In a pinch, use plain unscented bleach: about **2 drops per quart or liter** of clear water, then wait 30 minutes. It should smell faintly of chlorine.\n4. **A filter helps, but isn't everything.** A hiking filter removes bacteria and parasites, but not viruses. Boil or treat as well if the water is near farms or towns.\n\nClear-looking water can still make you sick, so always treat it. Never drink water that smells of fuel or chemicals: boiling won't fix that.",
    };

  if (/to-?do|html|web ?page|website|single-file|javascript|\bcss\b|\bapp\b/.test(t))
    return {
      think,
      text: "Here's a single-file to-do app with a dark glass look. Save it as `todo.html` and open it in any browser, or press **Preview** to try it right here.\n\n```html\n" + TODO_HTML + "\n```\n\nPress Enter to add a task, click the circle to tick it off, and × to remove it. It's plain HTML, CSS and JavaScript, so it works offline.",
    };

  if (/hook|\bads?\b|caption|tiktok|\breels?\b|knife|product/.test(t))
    return {
      think,
      text: "1. **\"I've carried this knife for 3 years and it's still sharper than yours.\"**\n2. **\"Stop buying cheap knives that snap the first time you need them.\"**\n3. **\"This is the only tool I grab before I leave the house.\"**\n4. **\"Watch it cut through a zip tie, a rope and an apple in 5 seconds.\"**\n5. **\"Your keys are jealous of this.\"**\n6. **\"The $30 upgrade every toolbox is missing.\"**\n7. **\"One-handed open. Watch.\"**\n8. **\"I didn't think a pocket knife could be this light.\"**\n9. **\"Things you didn't know a pocket knife could do, part 1.\"**\n10. **\"POV: you're the friend who always has a knife.\"**\n\nOpen with the action shot (the blade flicking open) in the first second, and put the hook on screen as text too, since most people watch muted.",
    };

  const math = calc(q);
  if (math || /\bcalculat|\bhow much is\b|\bwhat'?s \d/.test(t)) {
    if (math) {
      const out = Math.round(math.value * 1e6) / 1e6;
      return {
        text: `**${nice(out)}**\n\nI worked it out exactly as \`${math.expr} = ${nice(out)}\`, instead of guessing, so you can trust the digits.`,
        runs: [{ math: true, language: "python", ok: true, secs: 0.1, output: `>>> ${math.expr}\n${out}` }],
      };
    }
  }

  if (/\bmap\b|\bpin\b|campsite|\bcamp\b|trail|hike|meeting point/.test(t))
    return {
      think,
      text: "Done. I put a pin for the campsite on the map, on the flat ground north-east of Camp, close to the creek but above it, in case it rains.",
      pins: [{ id: "chat-pin", name: "Campsite", kind: "camp", lng: -98.4712, lat: 30.3866, from: "1.25 km NE of Camp" }],
    };

  if (/^(hi|hello|hey|yo|howdy|good (morning|evening|afternoon))\b/.test(t))
    return { text: "Hi! I'm RevinHi AI, running right here on this PC. Ask me anything, have me write or fix something, or ask for a picture and I'll make it. What's on your mind?" };

  if (/who are you|what can you do|what are you|offline|private|privacy|internet/.test(t))
    return {
      think,
      text: "I'm **RevinHi AI**: an AI that runs entirely on this computer, from its own drive. Nothing you type is sent anywhere.\n\nI can:\n- Answer questions, write, plan and explain things\n- Write and test code\n- Make and edit pictures, short videos, songs and voices (just ask)\n- Put pins on the offline map\n\nTurn **Internet** on at the top right and I can also search the web and name my sources.",
    };

  if (assistant === "coder" || /\bcode\b|python|script|function|bug|error/.test(t))
    return {
      think,
      text: `Paste the code (or attach the file) and tell me what it should do. In the real app **${model}** writes the fix, runs it to test it, and only shows you code that passed.`,
    };

  return {
    think,
    text: `Good question. In the real app, **${model}** answers this right on your PC, offline, in a few seconds. This preview only has a few sample answers built in, so try one of these:\n\n- How do I make creek water safe to drink?\n- Make a picture of a neon ramen shop at night\n- What's 18% of 64.50?\n- Put a pin on the map for our campsite`,
  };
}

// ------------------------------------------------------------------ Create gallery

export type Creation = { id: string; kind: "image" | "video"; pic: PicId; prompt: string; model: string; when: string };
export type Project = { id: string; name: string; when: string };

export const SEED_CREATIONS: Creation[] = [
  { id: "k1", kind: "image", pic: "neon", prompt: "Neon tubes glowing on a wet alley wall at night, pink and red light, rain", model: "Z-Image Turbo", when: "2 h ago" },
  { id: "k2", kind: "video", pic: "cup", prompt: "Steam rising from a white coffee cup on a sunny wooden table, slow push in", model: "Wan 2.2 5B (fast video)", when: "3 h ago" },
  { id: "k3", kind: "video", pic: "mug", prompt: "A striped teal mug on a kitchen table, morning light moving across it", model: "Wan 2.2 5B (fast video)", when: "3 h ago" },
  { id: "k4", kind: "image", pic: "ramen", prompt: "A neon-lit ramen shop in Tokyo at night, rain on the window, a sign that reads OPEN LATE", model: "Z-Image Turbo", when: "3 h ago" },
  { id: "k5", kind: "image", pic: "street", prompt: "The front of a small ramen shop at night with an OPEN LATE neon sign, people eating inside", model: "Z-Image Turbo", when: "4 h ago" },
];

export const EXAMPLES: Record<string, string> = {
  photo: "A stylish young woman in a bright minimalist kitchen holding a small silver tin, smiling at the camera, natural window light, photorealistic",
  edit: "The woman from image 1 holding the product from image 2 up to the camera in a cozy bedroom, smiling",
  video: "The woman opens the lid of the small tin, puts a pair of earbuds inside, closes it and smiles at the camera",
  remix: "",
};

// ------------------------------------------------------------------ map

export const PIN_KINDS: [string, string, string, string][] = [
  ["camp", "Camp", "tent", "#6cb4ff"],
  ["meeting", "Meeting point", "flag", "#2ed573"],
  ["landing", "Landing spot", "heli", "#5ef0b0"],
  ["hazard", "Hazard", "alert", "#ff5a4f"],
  ["water", "Water", "drop", "#8cc8ff"],
  ["supplies", "Supplies", "box", "#d2a861"],
  ["lookout", "Lookout", "eye", "#c7a0ff"],
  ["point", "Point", "pin", "#e6e6e6"],
];
export const kindOf = (k: string) => PIN_KINDS.find((x) => x[0] === k) ?? PIN_KINDS[PIN_KINDS.length - 1];

export type MapPin = { id: string; name: string; kind: string; lng: number; lat: number; notes?: string };

export const SEED_PINS: MapPin[] = [
  { id: "p1", name: "Camp", kind: "camp", lng: -98.48, lat: 30.38 },
  { id: "p2", name: "Meeting point", kind: "meeting", lng: -98.475, lat: 30.398 },
  { id: "p3", name: "Creek water", kind: "water", lng: -98.505, lat: 30.372, notes: "Flows all year. Filter and boil." },
  { id: "p4", name: "Steep drop", kind: "hazard", lng: -98.46, lat: 30.371, notes: "Loose rock near the edge." },
];
