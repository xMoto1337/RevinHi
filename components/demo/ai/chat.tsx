"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useDemo } from "../AppWindow";
import { ASSISTANTS, CAP_BADGES, MODELS, ROLES, SEED_CHATS, STARTERS, VOICES, cannedReply, fitOf, type ChatPin, type Conv, type Media, type Model, type Msg } from "./data";
import { Icon, Pic, RLogo, c, fmtLatLng, type PicId } from "./ui";

type Mode = "chat" | "image" | "edit" | "video" | "music" | "speak";
const MODES: [Mode, string, string][] = [
  ["chat", "text", "Chat"],
  ["image", "image", "Picture"],
  ["edit", "brush", "Edit photo"],
  ["video", "video", "Video"],
  ["music", "music", "Music"],
  ["speak", "waves", "Voice"],
];
const GEN_LABEL: Record<string, string> = { image: "Making the image", edit: "Editing the photo", video: "Making the video", speak: "Recording the voice", audio: "Recording the voice" };
const MAKER: Record<string, string> = { image: ROLES.image, edit: ROLES.edit, video: ROLES.video, speak: ROLES.voice, audio: ROLES.voice };
const EDIT_NEXT: Record<PicId, PicId> = { ramenBig: "street", ramen: "street", street: "ramen", neon: "ramenBig", cup: "mug", mug: "cup" };

type Attachment = { name: string; pic: PicId };

let uid = 0;
const mid = () => `m${++uid}`;
const modelName = (id: string) => MODELS.find((x) => x.id === id)?.name ?? "";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now();

// ------------------------------------------------------------------ a small Markdown renderer (what the canned answers use)

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function CodeBlock({ lang, code, onPreview }: { lang: string; code: string; onPreview?: (code: string) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={c("code-block")}>
      <div className={c("code-head")}>
        <span>{lang || "code"}</span>
        <span style={{ display: "flex", gap: 4 }}>
          {onPreview && lang === "html" && (
            <button className={c("mini")} onClick={() => onPreview(code)}>
              <Icon name="play" size="sm" /> Preview
            </button>
          )}
          <button
            className={c("mini")}
            onClick={() => {
              navigator.clipboard?.writeText(code).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Markdown({ text, onPreview }: { text: string; onPreview?: (code: string) => void }) {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++;
      out.push(<CodeBlock key={out.length} lang={lang} code={body.join("\n")} onPreview={onPreview} />);
    } else if (line.startsWith("### ")) {
      out.push(<h3 key={out.length}>{inline(line.slice(4))}</h3>);
      i++;
    } else if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+\. /.test(lines[i]) : lines[i].startsWith("- "))) items.push(lines[i++].replace(/^(- |\d+\. )/, ""));
      const kids = items.map((x, k) => <li key={k}>{inline(x)}</li>);
      out.push(ordered ? <ol key={out.length}>{kids}</ol> : <ul key={out.length}>{kids}</ul>);
    } else if (line.trim()) {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(- |\d+\. |### |```)/.test(lines[i])) para.push(lines[i++]);
      out.push(<p key={out.length}>{inline(para.join(" "))}</p>);
    } else i++;
  }
  return <div className={c("md")}>{out}</div>;
}

// ------------------------------------------------------------------ model picker

function ModelPicker({ value, installed, loaded, onChange, onMore }: { value: string; installed: string[]; loaded: string | null; onChange: (id: string) => void; onMore: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);
  const llms = MODELS.filter((m) => m.chat && installed.includes(m.id)).sort((a, b) => a.rank - b.rank);
  const cur = llms.find((m) => m.id === value) ?? llms[0];
  const groups: [string, Model[]][] = [
    ["Chat", llms.filter((m) => m.category !== "code")],
    ["Coding", llms.filter((m) => m.category === "code")],
  ];
  return (
    <div className={c("picker")} ref={ref}>
      <button className={c("picker-btn")} onClick={() => setOpen((o) => !o)} title="Choose the AI model for this chat">
        <span>{cur ? cur.name : "No model installed"}</span>
        {cur && loaded === cur.id && <span className={c("pill-dot dot-success")} title="Loaded and ready" />}
        <span className={c("picker-caret")}>
          <Icon name="chevron" size="sm" />
        </span>
      </button>
      {open && (
        <div className={c("picker-menu")}>
          {groups
            .filter(([, list]) => list.length)
            .map(([label, list]) => (
              <div key={label}>
                <div className={c("picker-group")}>{label}</div>
                {list.map((m) => {
                  const fit = fitOf(m);
                  return (
                    <button
                      key={m.id}
                      className={c("picker-item", m.id === cur?.id && "active")}
                      onClick={() => {
                        onChange(m.id);
                        setOpen(false);
                      }}
                    >
                      <div className={c("picker-item-top")}>
                        <span>{m.name}</span>
                        <span className={c("picker-caps")}>
                          {m.caps
                            .filter((x) => CAP_BADGES[x])
                            .map((x) => (
                              <span key={x} title={CAP_BADGES[x][1]}>
                                <Icon name={CAP_BADGES[x][0]} size="sm" />
                              </span>
                            ))}
                        </span>
                      </div>
                      <div className={c("picker-fit", `fit-${fit.level}`)}>
                        {m.params ? `${m.params} · ` : ""}
                        {fit.label}
                        {loaded === m.id ? " · loaded" : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          <div className={c("picker-note")}>Image, video and music models don&apos;t chat: use Picture, Video or Music under the message box (and pick the model there), or just ask &quot;draw me…&quot;.</div>
          <button
            className={c("picker-more")}
            onClick={() => {
              setOpen(false);
              onMore();
            }}
          >
            <Icon name="plus" size="sm" /> Get more models
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ the chat screen

export function ChatView({
  installed,
  online,
  onOpenModels,
  onOpenMap,
  onDone,
}: {
  installed: string[];
  online: boolean;
  onOpenModels: (category?: string) => void;
  onOpenMap: (pin: ChatPin) => void;
  onDone: () => void;
}) {
  const { notify } = useDemo();
  const [convs, setConvs] = useState<Conv[]>(SEED_CHATS);
  const [cur, setCurState] = useState<string | null>(null);
  const [draftModel, setDraftModel] = useState<string | null>(null);
  const [draftAssistant, setDraftAssistant] = useState("default");
  const [draftThink, setDraftThink] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [panel, setPanel] = useState<"settings" | "assistant" | null>(null);
  const [preview, setPreview] = useState<{ code: string; n: number } | null>(null);
  const [mode, setMode] = useState<Mode>("chat");
  const [aspect, setAspect] = useState("portrait");
  const [secs, setSecs] = useState(5);
  const [voice, setVoice] = useState("kokoro:af_heart");
  const [autoTools, setAutoTools] = useState(true);
  const [ctx, setCtx] = useState(16384);
  const [loaded, setLoaded] = useState<string | null>(null);
  const runToken = useRef(0);
  const current = useRef<{ cid: string; msgId: string } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);

  const setCur = (id: string | null) => {
    stick.current = true;
    setEditing(null);
    setCurState(id);
  };
  const conv = convs.find((x) => x.id === cur) ?? null;
  const assistant = ASSISTANTS.find((a) => a.id === (conv?.assistant ?? draftAssistant)) ?? ASSISTANTS[0];
  const llms = MODELS.filter((m) => m.chat && installed.includes(m.id));
  const modelId = conv?.model ?? draftModel ?? ROLES.chat;
  const model = llms.find((m) => m.id === modelId) ?? llms[0] ?? null;
  const think = conv?.think ?? draftThink;

  useEffect(() => {
    const el = logRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [convs, cur]);
  useEffect(() => () => void runToken.current++, []);

  const patchConv = (id: string, fn: (x: Conv) => Conv) => setConvs((cs) => cs.map((x) => (x.id === id ? fn(x) : x)));
  const patchMsg = (cid: string, msgId: string, fn: (m: Msg) => Msg) => patchConv(cid, (x) => ({ ...x, messages: x.messages.map((m) => (m.id === msgId ? fn(m) : m)) }));

  /** Writes `text` into a message a few words at a time, like a model streaming its answer. */
  async function stream(cid: string, msgId: string, key: "text" | "reasoning", text: string, live: () => boolean) {
    const words = text.match(/\S+\s*|\s+/g) ?? [];
    const per = words.length > 260 ? 14 : words.length > 120 ? 5 : 2;
    let shown = "";
    for (let i = 0; i < words.length; i += per) {
      if (!live()) return false;
      shown += words.slice(i, i + per).join("");
      const s = shown;
      patchMsg(cid, msgId, (m) => ({ ...m, [key]: s, status: undefined }));
      await wait(key === "reasoning" ? 18 : 38);
    }
    return live();
  }

  /** "Makes" a picture, video or voice into a message: a progress bar, then the result. */
  async function makeInto(cid: string, msgId: string, kind: "image" | "edit" | "video" | "speak", pic: PicId | undefined, prompt: string, live: () => boolean) {
    current.current = { cid, msgId };
    const maker = modelName(MAKER[kind]);
    const total = kind === "video" ? 7000 : kind === "speak" ? 2600 : 4200;
    const steps = kind === "video" ? 4 : 8;
    patchMsg(cid, msgId, (m) => ({ ...m, modelName: m.text ? m.modelName : maker, gen: { label: GEN_LABEL[kind], pct: 0, text: `Loading ${maker}…` } }));
    const t0 = now();
    while (now() - t0 < total) {
      await wait(120);
      if (!live()) return;
      const pct = Math.min(1, (now() - t0) / total);
      const left = Math.max(1, Math.round(((1 - pct) * total) / 1000 * (kind === "video" ? 50 : 5)));
      const text = pct < 0.18 ? `Loading ${maker}…` : kind === "speak" ? "Speaking…" : `Step ${Math.min(steps, 1 + Math.floor(((pct - 0.18) / 0.82) * steps))} of ${steps}`;
      patchMsg(cid, msgId, (m) => ({ ...m, gen: { label: GEN_LABEL[kind], pct, text, eta: left < 60 ? `about ${Math.max(5, Math.round(left / 5) * 5)} s left` : `about ${Math.round(left / 60)} min left` } }));
    }
    const media: Media = kind === "speak" ? { kind: "audio", prompt, secs: Math.max(3, Math.round(prompt.split(/\s+/).length / 2.6)) } : { kind: kind === "video" ? "video" : "image", pic, prompt };
    patchMsg(cid, msgId, (m) => ({ ...m, gen: undefined, media: [...(m.media ?? []), media] }));
  }

  function latestPic(msgs: Msg[]): PicId | undefined {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const p = msgs[i].media?.filter((x) => x.pic).pop()?.pic;
      if (p) return p;
    }
    return undefined;
  }

  async function run(cid: string, history: Msg[], cv: Conv | null) {
    const useModel = model;
    if (!useModel) return;
    const reply: Msg = { id: mid(), role: "assistant", text: "", reasoning: "", modelName: useModel.name };
    patchConv(cid, (x) => ({ ...x, messages: [...history, reply] }));
    setBusy(true);
    setNotice("");
    stick.current = true;
    const token = ++runToken.current;
    const live = () => runToken.current === token;
    current.current = { cid, msgId: reply.id };
    const last = history[history.length - 1]?.text ?? "";
    const a = cv?.assistant ?? draftAssistant;
    const ans = cannedReply(last, useModel.name, a);

    if (loaded !== useModel.id) {
      patchMsg(cid, reply.id, (m) => ({ ...m, status: "Loading the model · about 5 s left" }));
      await wait(1300);
      if (!live()) return;
      setLoaded(useModel.id);
      patchMsg(cid, reply.id, (m) => ({ ...m, status: undefined }));
    } else await wait(350);

    if (ans.make && autoTools && a !== "coder") {
      patchMsg(cid, reply.id, (m) => ({ ...m, status: "Choosing the right model…" }));
      await wait(900);
      if (!live()) return;
      patchMsg(cid, reply.id, (m) => ({ ...m, status: undefined }));
      await makeInto(cid, reply.id, ans.make.kind === "audio" ? "speak" : ans.make.kind, ans.make.pic, last, live);
      if (live()) finish();
      return;
    }

    const thinkNow = (cv?.think ?? draftThink) && !!ans.think;
    if (thinkNow && !(await stream(cid, reply.id, "reasoning", ans.think!, live))) return;
    const text = ans.make ? "Making pictures, videos and voices from chat is turned off in Chat settings (the sliders button). Turn it on, or use Picture, Video or Voice under the message box." : ans.text;
    if (!(await stream(cid, reply.id, "text", text, live))) return;
    patchMsg(cid, reply.id, (m) => ({ ...m, tps: 44 + (text.length % 11), runs: ans.runs, pins: ans.pins }));
    finish();
  }

  function finish() {
    setBusy(false);
    current.current = null;
    onDone();
  }

  function stop() {
    runToken.current++;
    const at = current.current;
    if (at) patchMsg(at.cid, at.msgId, (m) => ({ ...m, status: undefined, gen: undefined, stopped: true }));
    current.current = null;
    setBusy(false);
  }

  async function sendGen(cv: Conv, text: string, kind: "image" | "edit" | "video" | "speak") {
    const user: Msg = { id: mid(), role: "user", text };
    const reply: Msg = { id: mid(), role: "assistant", text: "", modelName: modelName(MAKER[kind]) };
    const lastPic = files[0]?.pic ?? latestPic(cv.messages);
    patchConv(cv.id, (x) => ({ ...x, messages: [...cv.messages, user, reply] }));
    setInput("");
    setFiles([]);
    setBusy(true);
    const token = ++runToken.current;
    const live = () => runToken.current === token;
    const pic: PicId | undefined = kind === "edit" ? EDIT_NEXT[lastPic ?? "ramen"] : kind === "video" ? (lastPic ?? "cup") : kind === "image" ? cannedReply(`draw ${text}`, "", "").make?.pic : undefined;
    await makeInto(cv.id, reply.id, kind, pic, text, live);
    if (live()) finish();
  }

  function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if ((!text && !files.length) || busy) return;
    if (mode === "music") {
      setNotice("No music model installed. Get one in Models.");
      return;
    }
    if (mode !== "chat" && !text) {
      setNotice(mode === "speak" ? "Type what to say." : "Describe what you want.");
      return;
    }
    if (mode === "edit" && !files.length && !latestPic(conv?.messages ?? [])) {
      setNotice("Attach a photo, or make a picture first: Edit photo changes the last picture in the chat.");
      return;
    }
    if (mode === "chat" && !model) {
      setNotice("No chat model is installed yet. Get one in Models.");
      return;
    }
    let cv = conv;
    if (!cv) {
      cv = { id: `c-${mid()}`, title: (text || "New chat").replace(/\s+/g, " ").slice(0, 60), group: "Today", messages: [], model: draftModel ?? undefined, assistant: draftAssistant, think: draftThink };
      const fresh = cv;
      setConvs((cs) => [fresh, ...cs]);
      setCur(fresh.id);
    }
    if (mode !== "chat") {
      sendGen(cv, text, mode);
      return;
    }
    const user: Msg = { id: mid(), role: "user", text };
    setInput("");
    setFiles([]);
    if (inputRef.current) inputRef.current.style.height = "";
    run(cv.id, [...cv.messages, user], cv);
  }

  function regenerate(msgId: string) {
    if (!conv || busy) return;
    const i = conv.messages.findIndex((m) => m.id === msgId);
    run(conv.id, conv.messages.slice(0, i), conv);
  }

  function saveEdit() {
    if (!conv || !editing || busy) return;
    const i = conv.messages.findIndex((m) => m.id === editing.id);
    const edited = { ...conv.messages[i], text: editing.text.trim() };
    setEditing(null);
    run(conv.id, [...conv.messages.slice(0, i), edited], conv);
  }

  const setConvField = (patch: Partial<Conv>) => conv && patchConv(conv.id, (x) => ({ ...x, ...patch }));
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    notify("Copied.");
  };

  const shown = convs.filter((x) => !search.trim() || x.title.toLowerCase().includes(search.toLowerCase()) || x.messages.some((m) => m.text.toLowerCase().includes(search.toLowerCase())));
  const groups: [string, Conv[]][] = [];
  for (const x of shown) {
    const g = groups.find(([label]) => label === x.group);
    if (g) g[1].push(x);
    else groups.push([x.group, [x]]);
  }
  const order = ["Today", "Yesterday", "This week"];
  groups.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  const lastAssistant = conv?.messages.filter((m) => m.role === "assistant").pop()?.id;
  const voiceName = VOICES.find(([id]) => id === voice)?.[1].split(" (")[0].split(" ·")[0] ?? "Heart";

  return (
    <div className={c("chat", preview && "with-preview")}>
      <div className={c("chat-side")}>
        <button
          className={c("btn btn-primary")}
          onClick={() => {
            setCur(null);
            setInput("");
            setFiles([]);
            inputRef.current?.focus();
          }}
        >
          <Icon name="plus" /> New chat
        </button>
        <input className={c("text-input chat-search")} placeholder="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className={c("scroll chat-list")}>
          {groups.map(([label, list]) => (
            <div key={label}>
              <div className={c("chat-group")}>{label}</div>
              {list.map((x) => (
                <div key={x.id} className={c("chat-item", x.id === cur && "active")} onClick={() => setCur(x.id)} onDoubleClick={() => setRenaming(x.id)}>
                  {renaming === x.id ? (
                    <input
                      className={c("chat-rename")}
                      autoFocus
                      defaultValue={x.title}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        patchConv(x.id, (y) => ({ ...y, title: v || y.title }));
                        setRenaming(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    />
                  ) : (
                    <span title={x.title}>{x.title}</span>
                  )}
                  <button
                    className={c("mini danger")}
                    title="Delete chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConvs((cs) => cs.filter((y) => y.id !== x.id));
                      if (cur === x.id) setCur(null);
                    }}
                  >
                    <Icon name="x" size="sm" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {!convs.length && (
            <div className={c("hint-sm")} style={{ padding: 8 }}>
              Your chats appear here.
            </div>
          )}
        </div>
        <div className={c("side-note")}>
          <Icon name={online ? "globe" : "shield"} />
          <span>{online ? "Internet is on: the AI can search the web. Your chats still stay on this PC." : "Everything runs on this PC. Nothing you type leaves it."}</span>
        </div>
      </div>

      <div className={c("chat-main")}>
        <div className={c("chat-bar")}>
          <ModelPicker value={modelId} installed={installed} loaded={loaded} onChange={(id) => (conv ? setConvField({ model: id }) : setDraftModel(id))} onMore={() => onOpenModels("chat")} />
          <button className={c("chip", panel === "assistant" && "active")} onClick={() => setPanel(panel === "assistant" ? null : "assistant")} title="Assistant: how the AI behaves">
            <Icon name={assistant.icon} /> {assistant.name}
          </button>
          {assistant.id === "coder" && (
            <button className={c("chip")} onClick={() => onOpenModels("code")} title="A model made for code writes and fixes code far better than the chat model">
              Get a coding model
            </button>
          )}
          {model?.caps.includes("thinking") && (
            <button className={c("chip", think && "active")} title="Let the model think step by step before answering (slower, smarter)" onClick={() => (conv ? setConvField({ think: !conv.think }) : setDraftThink((x) => !x))}>
              <Icon name="bulb" /> Think it through
              <span className={c("switch mini-switch", think && "on")}>
                <span className={c("switch-knob")} />
              </span>
            </button>
          )}
          <span style={{ flex: 1 }} />
          {conv && (
            <button className={c("mini")} onClick={() => notify("In the app this saves the chat as a file on your PC.")} title="Save this chat as a Markdown file">
              <Icon name="download" /> Export
            </button>
          )}
          <button className={c("mini", panel === "settings" && "active")} onClick={() => setPanel(panel === "settings" ? null : "settings")} title="Chat settings">
            <Icon name="sliders" />
          </button>
        </div>

        {panel === "assistant" && (
          <div className={c("chat-panel")}>
            <div className={c("assistant-grid")}>
              {ASSISTANTS.map((a) => (
                <button
                  key={a.id}
                  className={c("assistant-card", a.id === assistant.id && "active")}
                  onClick={() => {
                    if (conv) setConvField({ assistant: a.id, ...(a.id === "coder" ? { think: true } : {}) });
                    else {
                      setDraftAssistant(a.id);
                      if (a.id === "coder") setDraftThink(true);
                    }
                    setPanel(null);
                  }}
                >
                  <span className={c("assistant-icon")}>
                    <Icon name={a.icon} />
                  </span>
                  <b>{a.name}</b>
                  <span className={c("hint-sm")}>{a.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {panel === "settings" && (
          <div className={c("chat-panel settings-grid")}>
            <label>
              <span>Creativity</span>
              <input type="range" min={0} max={1.5} step={0.05} value={conv?.temperature ?? 0.7} disabled={!conv} onChange={(e) => setConvField({ temperature: +e.target.value })} />
              <span className={c("hint-sm")}>
                {(conv?.temperature ?? 0.7).toFixed(2)} {conv ? "" : "(start a chat first)"}
              </span>
            </label>
            <label>
              <span>Memory (context)</span>
              <select className={c("select")} value={ctx} onChange={(e) => setCtx(+e.target.value)}>
                {[4096, 8192, 16384, 32768, 65536, 131072].map((n) => (
                  <option key={n} value={n}>
                    {n / 1024}K tokens{n === 16384 ? " (default)" : n > 32768 ? " (needs lots of memory)" : ""}
                  </option>
                ))}
              </select>
              <span className={c("hint-sm")}>How much of the chat and attached files the model can keep in mind.</span>
            </label>
            <label className={c("check-row span2")}>
              <input type="checkbox" checked={autoTools} onChange={(e) => setAutoTools(e.target.checked)} />
              <span>Let the AI make pictures, videos and voice when you ask for them in chat</span>
            </label>
            <label className={c("span2")}>
              <span>Instructions for this chat</span>
              <textarea
                className={c("text-input")}
                rows={3}
                disabled={!conv}
                placeholder={conv ? "e.g. Answer in Spanish. Keep replies under 100 words." : "Start a chat first"}
                value={conv?.system ?? ""}
                onChange={(e) => setConvField({ system: e.target.value })}
              />
            </label>
          </div>
        )}

        <div
          className={c("chat-log scroll")}
          ref={logRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
        >
          {!conv?.messages.length ? (
            <div className={c("chat-empty")}>
              <RLogo className={c("chat-logo")} />
              <div className={c("hero-title")}>
                What can I help with<span>?</span>
              </div>
              <div className={c("hint")}>
                {model ? (
                  <>
                    Chatting with <b>{model.name}</b>
                    {model.caps.includes("vision") ? " · can see images" : ""}. {online ? "Internet is on, so it can look things up." : "Everything stays on this PC."}
                  </>
                ) : (
                  <>
                    No chat model yet. <a onClick={() => onOpenModels("chat")}>Get one in Models</a>.
                  </>
                )}
              </div>
              <div className={c("chat-starters")}>
                {STARTERS.map(([icon, s]) => (
                  <button
                    key={s}
                    className={c("starter")}
                    onClick={() => {
                      if (s.endsWith(": ")) {
                        setInput(s);
                        inputRef.current?.focus();
                      } else send(s);
                    }}
                  >
                    <Icon name={icon} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={c("msgs")}>
              {conv.messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className={c("msg user")}>
                    {editing?.id === m.id ? (
                      <div className={c("edit-box")}>
                        <textarea className={c("text-input")} autoFocus rows={Math.min(10, editing.text.split("\n").length + 1)} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
                        <div className={c("add-row")}>
                          <button className={c("btn btn-primary btn-small")} onClick={saveEdit} disabled={busy || !editing.text.trim()}>
                            Send
                          </button>
                          <button className={c("btn btn-secondary btn-small")} onClick={() => setEditing(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {m.text && <div className={c("bubble-user")}>{m.text}</div>}
                        <div className={c("msg-actions")}>
                          <button className={c("mini")} title="Edit and resend" disabled={busy} onClick={() => setEditing({ id: m.id, text: m.text })}>
                            <Icon name="pen" size="sm" />
                          </button>
                          <button className={c("mini")} title="Copy" onClick={() => copy(m.text)}>
                            <Icon name="copy" size="sm" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div key={m.id} className={c("msg assistant")}>
                    <div className={c("msg-avatar")}>
                      <RLogo />
                    </div>
                    <div className={c("msg-body")}>
                      {!!m.reasoning && (
                        <details className={c("think")} open={busy && m.id === lastAssistant && !m.text}>
                          <summary>{busy && m.id === lastAssistant && !m.text ? "Thinking…" : `Thought it through (${Math.round(m.reasoning.length / 4)} tokens)`}</summary>
                          <div className={c("think-text")}>{m.reasoning}</div>
                        </details>
                      )}
                      {m.text ? (
                        <Markdown text={m.text} onPreview={(code) => setPreview({ code, n: now() })} />
                      ) : m.status ? (
                        <div className={c("msg-status")}>
                          <span className={c("spinner")} /> {m.status}
                        </div>
                      ) : busy && m.id === lastAssistant && !m.reasoning && !m.gen && !m.media?.length ? (
                        <div className={c("typing")}>
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : null}
                      {!!m.pins?.length && (
                        <div className={c("chat-pins")}>
                          {m.pins.map((p) => (
                            <div key={p.id} className={c("chat-pin")}>
                              <Icon name="pin" />
                              <div>
                                <b>{p.name}</b>
                                <small>
                                  {p.from ? `${p.from} · ` : ""}
                                  {fmtLatLng([p.lng, p.lat])}
                                </small>
                              </div>
                              <button className={c("btn btn-secondary btn-small")} onClick={() => onOpenMap(p)}>
                                <Icon name="map" size="sm" /> Show on map
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {!!m.runs?.length && (
                        <details className={c("runs")}>
                          <summary>{m.runs.every((r) => r.math) ? "Worked out the numbers with Python · show the work" : `Tested the code once · last run passed`}</summary>
                          {m.runs.map((r, i) => (
                            <div key={i} className={c("run", r.ok ? "ok" : "fail")}>
                              <div className={c("run-head")}>
                                {r.language} · {r.ok ? "passed" : "failed"}
                                {r.secs !== undefined ? ` · ${r.secs} s` : ""}
                              </div>
                              <pre>{r.output}</pre>
                            </div>
                          ))}
                        </details>
                      )}
                      {!!m.media?.length && (
                        <div className={c("media-grid")}>
                          {m.media.map((x, i) =>
                            x.kind === "audio" ? (
                              <div key={i} className={c("media media-audio")}>
                                <div className={c("audio-bar")}>
                                  <button className={c("mini")} title="Play" onClick={() => notify(`In the app this plays the recording, in the ${voiceName} voice.`)}>
                                    <Icon name="play" size="sm" />
                                  </button>
                                  <span>0:00 / 0:{String(x.secs ?? 4).padStart(2, "0")}</span>
                                  <span className={c("audio-track")} />
                                  <Icon name="speaker" size="sm" />
                                </div>
                                <div className={c("media-actions")}>
                                  <button className={c("mini")} title="Show in folder" onClick={() => notify("In the app this shows the file in its folder.")}>
                                    <Icon name="folder" size="sm" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div key={i} className={c("media")}>
                                <div onClick={() => notify("In the app this shows the file in its folder.")} title="Show in folder" style={{ overflow: "hidden" }}>
                                  <Pic id={x.pic ?? "ramen"} className={c("media-pic")} moving={x.kind === "video"} />
                                </div>
                                {x.kind === "video" && (
                                  <span className={c("tile-tag")}>
                                    <Icon name="play" size="sm" />
                                    Video
                                  </span>
                                )}
                                <div className={c("media-actions")}>
                                  {x.kind === "image" && (
                                    <>
                                      <button
                                        className={c("mini")}
                                        title="Edit this picture"
                                        onClick={() => {
                                          setMode("edit");
                                          setFiles([{ name: "image.png", pic: x.pic ?? "ramen" }]);
                                          inputRef.current?.focus();
                                        }}
                                      >
                                        <Icon name="brush" size="sm" /> Edit
                                      </button>
                                      <button
                                        className={c("mini")}
                                        title="Turn this picture into a video"
                                        onClick={() => {
                                          setMode("video");
                                          setFiles([{ name: "image.png", pic: x.pic ?? "ramen" }]);
                                          inputRef.current?.focus();
                                        }}
                                      >
                                        <Icon name="video" size="sm" /> Animate
                                      </button>
                                    </>
                                  )}
                                  <button className={c("mini")} title="Show in folder" onClick={() => notify("In the app this shows the file in its folder.")}>
                                    <Icon name="folder" size="sm" />
                                  </button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                      {m.gen && (
                        <div className={c("gen-progress")}>
                          <div className={c("msg-status")}>
                            <span className={c("spinner")} /> {m.gen.label}… {m.gen.eta && <b className={c("eta")}>{m.gen.eta}</b>}
                          </div>
                          <div className={c("hint-sm")}>{m.gen.text}</div>
                          <div className={c("progress")}>
                            <div style={{ width: `${Math.round(m.gen.pct * 100)}%` }} />
                          </div>
                        </div>
                      )}
                      {m.stopped && (
                        <div className={c("msg-stopped")}>
                          <Icon name="stop" size="sm" /> Stopped
                        </div>
                      )}
                      {!(busy && m.id === lastAssistant) && (m.text || m.media?.length || m.stopped) && (
                        <div className={c("msg-actions")}>
                          <button className={c("mini")} title="Copy" onClick={() => copy(m.text)}>
                            <Icon name="copy" size="sm" />
                          </button>
                          {m.text && (
                            <button className={c("mini")} title="Read aloud" onClick={() => notify(`In the app this reads the answer aloud in the ${voiceName} voice, offline.`)}>
                              <Icon name="speaker" size="sm" />
                            </button>
                          )}
                          <button className={c("mini")} title="Answer again" onClick={() => regenerate(m.id)} disabled={busy}>
                            <Icon name="redo" size="sm" />
                          </button>
                          <span className={c("msg-meta")}>
                            {m.modelName}
                            {m.tps ? ` · ${m.tps.toFixed(0)} tokens/s` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {notice && (
          <div className={c("notice error chat-notice")} onClick={() => setNotice("")}>
            {notice}
          </div>
        )}
        <div className={c("composer")}>
          {files.length > 0 && (
            <div className={c("composer-files")} style={{ display: "flex", gap: 6 }}>
              {files.map((f, i) => (
                <span key={i} className={c("file-chip")}>
                  <span style={{ width: 22, height: 22, borderRadius: 5, overflow: "hidden", display: "inline-block" }}>
                    <Pic id={f.pic} />
                  </span>
                  {f.name}
                  <button className={c("mini")} style={{ width: 18, height: 18 }} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}>
                    <Icon name="x" size="sm" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className={c("composer-modes")}>
            {MODES.map(([id, icon, label]) => {
              const off = id === "music";
              return (
                <button key={id} className={c("mode-chip", mode === id && "active", off && "off")} title={off ? "No music model installed. Click to get one." : ""} onClick={() => (off ? onOpenModels("music") : setMode(id))}>
                  <Icon name={icon} /> {label}
                </button>
              );
            })}
            <span style={{ flex: 1 }} />
            {(mode === "image" || mode === "edit" || mode === "video") && (
              <select className={c("select mini-select")} title="Which model makes it" defaultValue={MAKER[mode]} key={mode}>
                {MODELS.filter((m) => installed.includes(m.id) && m.roles.includes(mode)).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            {(mode === "image" || mode === "video" || mode === "edit") && (
              <select className={c("select mini-select")} value={aspect} onChange={(e) => setAspect(e.target.value)} title="Shape">
                <option value="portrait">Tall 9:16</option>
                <option value="square">Square</option>
                <option value="wide">Wide 16:9</option>
              </select>
            )}
            {mode === "video" && (
              <select className={c("select mini-select")} value={secs} onChange={(e) => setSecs(+e.target.value)} title="Length">
                {[3, 5, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} seconds
                  </option>
                ))}
              </select>
            )}
            {(mode === "speak" || mode === "chat") && (
              <select className={c("select mini-select")} value={voice} title="Voice for Speak and read-aloud" onChange={(e) => setVoice(e.target.value)}>
                {VOICES.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className={c("composer-row")}>
            <button className={c("btn btn-secondary btn-icon")} title="Attach images, PDFs, documents or code (or drag them in)" onClick={() => notify("In the app this opens your files to attach pictures, PDFs or documents.")}>
              <Icon name="clip" />
            </button>
            <button className={c("btn btn-secondary btn-icon")} title="Talk instead of typing" onClick={() => notify("In the app you talk and it types what you said, offline.")}>
              <Icon name="mic" />
            </button>
            <textarea
              ref={inputRef}
              className={c("composer-input")}
              rows={1}
              placeholder={
                mode === "image"
                  ? "Describe the picture to make…"
                  : mode === "edit"
                    ? "Say what to change in the photo (attach one, or it edits the last picture)…"
                    : mode === "video"
                      ? "Describe what happens in the video (attach a photo to animate it)…"
                      : mode === "music"
                        ? "Style on the first line (e.g. upbeat synth-pop, female vocals); lyrics below, or leave them out for an instrumental"
                        : mode === "speak"
                          ? "Type what to say out loud…"
                          : `Message ${model?.name ?? "the AI"}…`
              }
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const t = e.target;
                t.style.height = "auto";
                t.style.height = `${Math.min(160, t.scrollHeight)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {busy ? (
              <button className={c("btn btn-danger")} onClick={stop}>
                <Icon name="stop" size="sm" /> Stop
              </button>
            ) : (
              <button className={c("btn btn-primary")} onClick={() => send()} disabled={!input.trim() && !files.length}>
                Send <Icon name="arrow" size="sm" />
              </button>
            )}
          </div>
          <div className={c("composer-hint")}>
            Enter to send · Shift+Enter for a new line · {mode === "chat" && autoTools ? "Ask for a picture, video, song or voice and it'll make it · " : ""}AI can be wrong: check important facts.
          </div>
        </div>
      </div>

      {preview && (
        <div className={c("preview-pane")}>
          <div className={c("chat-bar")}>
            <b>Preview</b>
            <span className={c("hint-sm")}>html · runs sandboxed, offline</span>
            <span style={{ flex: 1 }} />
            <button className={c("mini")} onClick={() => setPreview({ ...preview, n: preview.n + 1 })} title="Reload">
              <Icon name="redo" size="sm" />
            </button>
            <button className={c("mini")} onClick={() => setPreview(null)}>
              <Icon name="x" size="sm" />
            </button>
          </div>
          <iframe key={preview.n} title="preview" sandbox="allow-scripts" srcDoc={preview.code} />
        </div>
      )}
    </div>
  );
}
