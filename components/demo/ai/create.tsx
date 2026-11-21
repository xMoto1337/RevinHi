"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "../AppWindow";
import { EXAMPLES, MODELS, SEED_CREATIONS, type Creation, type Project } from "./data";
import { Icon, Pic, RLogo, c, leftText, type PicId } from "./ui";

type Mode = "photo" | "edit" | "video" | "remix";
type Tool = Mode | "ad" | "people" | "tryon";

const TOOLS: { id: Tool; label: string; sub: string; icon: string }[] = [
  { id: "photo", label: "Photo", sub: "from words", icon: "image" },
  { id: "edit", label: "Edit", sub: "change a photo", icon: "brush" },
  { id: "video", label: "Video", sub: "bring it to life", icon: "video" },
  { id: "remix", label: "Remix", sub: "copy a video", icon: "clip" },
  { id: "tryon", label: "Try on", sub: "clothes on a person", icon: "shirt" },
  { id: "ad", label: "Ad", sub: "from a link", icon: "megaphone" },
  { id: "people", label: "People", sub: "your cast", icon: "users" },
];
const SHAPES: [string, string, number][] = [
  ["portrait", "9:16", 9 / 16],
  ["square", "1:1", 1],
  ["wide", "16:9", 16 / 9],
];
const FRAMING: [string, string][] = [
  ["any", "Any"],
  ["closeup", "Close-up"],
  ["half", "Half body"],
  ["full", "Full body"],
];
const CAMERA: [string, string][] = [
  ["static", "Still"],
  ["push", "Push in"],
  ["pull", "Pull back"],
  ["orbit", "Orbit"],
  ["pan", "Pan"],
  ["handheld", "Handheld"],
];
const MODE_LABEL: Record<Mode, string> = { photo: "Photo", edit: "Edit", video: "Video", remix: "Remix" };

type Filter = "all" | "image" | "video" | "ad" | "person";
type JobState = { title: string; pct: number; text: string; expect: number; t0: number };

/** Which sample picture a description "makes". */
function picFor(prompt: string, mode: Mode, from: PicId | null): PicId {
  const t = prompt.toLowerCase();
  if (mode === "edit") return from === "street" ? "ramen" : "street";
  if (mode === "video" || mode === "remix") return from === "mug" ? "mug" : /mug|teal/.test(t) ? "mug" : "cup";
  if (/ramen|tokyo|noodle|open late/.test(t)) return "ramen";
  if (/neon|sign|alley|night/.test(t)) return "neon";
  if (/mug|teal/.test(t)) return "mug";
  if (/cup|coffee|tea|kitchen|tin|morning|woman|table/.test(t)) return "cup";
  return "street";
}

function JobOverlay({ job, onStop }: { job: JobState; onStop: () => void }) {
  const secsLeft = Math.max(0, (1 - job.pct) * job.expect);
  return (
    <div className={c("overlay")}>
      <div className={c("card overlay-card")}>
        <div className={c("section-title")}>{job.title}</div>
        <div className={c("progress")}>
          <div style={{ width: `${Math.round(Math.max(0.03, job.pct) * 100)}%` }} />
        </div>
        <div className={c("hint")}>
          {job.text}
          <b className={c("eta")}> · {leftText(secsLeft)}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className={c("btn btn-danger")} onClick={onStop}>
            <Icon name="stop" size="sm" /> Stop
          </button>
        </div>
      </div>
    </div>
  );
}

/** One place to make things: photos, edits, videos, remixes, ads and people, with one gallery. */
export function CreateView({ roles, onOpenModels }: { roles: Record<string, string>; onOpenModels: (category?: string) => void }) {
  const { notify } = useDemo();
  const [tool, setTool] = useState<Tool>("photo");
  const mode: Mode = tool === "ad" || tool === "people" || tool === "tryon" ? "photo" : tool;
  const [prompt, setPrompt] = useState("A white coffee cup on a sunny wooden table by the window, soft morning light, photorealistic");
  const [neg, setNeg] = useState("");
  const [aspect, setAspect] = useState("portrait");
  const [framing, setFraming] = useState("any");
  const [camera, setCamera] = useState("push");
  const [secs, setSecs] = useState(5);
  const [image, setImage] = useState<PicId | null>(null);
  const [video, setVideo] = useState(false);
  const [remixKind, setRemixKind] = useState<"move" | "replace">("move");
  const [rights, setRights] = useState(false);
  const [checkpoint, setCheckpoint] = useState("");
  const [creations, setCreations] = useState<Creation[]>(SEED_CREATIONS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selKey, setSelKey] = useState<string | null>("k4");
  const [job, setJob] = useState<JobState | null>(null);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [presenter, setPresenter] = useState("");
  const jobToken = useRef(0);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 5000);
    return () => clearTimeout(t);
  }, [note]);
  useEffect(() => () => void jobToken.current++, []);

  const imageModel = MODELS.find((m) => m.id === (checkpoint || roles.image));
  const items = [
    ...projects.map((p) => ({ key: p.id, kind: "ad" as const, p })),
    ...creations.map((k) => ({ key: k.id, kind: k.kind, k })),
  ];
  const shown = filter === "all" ? items : filter === "person" ? [] : items.filter((i) => i.kind === filter);
  const counts: Record<Filter, number> = { all: items.length, image: creations.filter((k) => k.kind === "image").length, video: creations.filter((k) => k.kind === "video").length, ad: projects.length, person: 0 };
  const sel = items.find((i) => i.key === selKey) ?? null;

  const needs = (mode === "edit" || mode === "video" || mode === "remix") && !image;
  const blocked = needs
    ? mode === "edit"
      ? "Pick a person or add a photo first."
      : "Pick a person or add a start photo first."
    : mode === "remix" && !video
      ? "Add the video to copy."
      : mode === "remix" && !rights
        ? "Confirm you have the rights to use the video."
        : !prompt.trim() && mode !== "remix"
          ? mode === "video"
            ? "Describe what happens in the video."
            : "Describe what you want to see."
          : "";
  const est = mode === "photo" ? 25 : mode === "edit" ? 20 : 360;

  /** Runs a pretend job: a progress card that moves, then `done`. */
  function runJob(title: string, steps: string[], expect: number, ms: number, done: () => void) {
    const token = ++jobToken.current;
    const t0 = Date.now();
    setJob({ title, pct: 0.01, text: steps[0], expect, t0 });
    const tick = () => {
      if (jobToken.current !== token) return;
      const pct = Math.min(1, (Date.now() - t0) / ms);
      if (pct >= 1) {
        setJob(null);
        done();
        return;
      }
      setJob((j) => j && { ...j, pct, text: steps[Math.min(steps.length - 1, Math.floor(pct * steps.length))] });
      setTimeout(tick, 120);
    };
    setTimeout(tick, 120);
  }

  function generate() {
    if (blocked || job) return;
    const maker = mode === "photo" ? imageModel?.name ?? "Z-Image Turbo" : mode === "edit" ? MODELS.find((m) => m.id === roles.edit)?.name ?? "" : mode === "video" ? MODELS.find((m) => m.id === roles.video)?.name ?? "" : "Wan 2.2 Animate";
    const steps =
      mode === "photo" || mode === "edit"
        ? ["Starting the AI engine…", `Loading ${maker}…`, "Step 2 of 8", "Step 4 of 8", "Step 6 of 8", "Step 8 of 8", "Saving…"]
        : ["Starting the AI engine…", `Loading ${maker}…`, "Making frames 1-24", "Making frames 25-56", "Making frames 57-81", "Putting the video together…"];
    runJob(`Making: ${MODE_LABEL[mode]}`, steps, est, mode === "photo" || mode === "edit" ? 4500 : 7000, () => {
      const k: Creation = {
        id: `n${Date.now()}`,
        kind: mode === "photo" || mode === "edit" ? "image" : "video",
        pic: picFor(prompt, mode, image),
        prompt: prompt.trim() || "Copy the moves from the video",
        model: maker,
        when: "just now",
      };
      setCreations((list) => [k, ...list]);
      setSelKey(k.id);
      if (filter !== "all" && filter !== k.kind) setFilter("all");
    });
  }

  function makeAd() {
    const link = url.trim();
    if (!link || job) return;
    let host = "your store";
    try {
      host = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`).hostname.replace(/^www\./, "");
    } catch {
      notify("That doesn't look like a web link.");
      return;
    }
    notify("In the app the AI opens the page to read the product. Here it's a sample.");
    runJob("Reading the page", ["Opening the page…", "Finding the product photos…", "Reading the description…", "Planning the ad…", "The AI is writing your script…"], 60, 6000, () => {
      const p: Project = { id: `ad${Date.now()}`, name: host.split(".")[0].replace(/^\w/, (x) => x.toUpperCase()) + " ad", when: "just now" };
      setProjects((list) => [p, ...list]);
      setSelKey(p.id);
      setFilter("ad");
      setNote("Your ad is planned. In the app the ad editor opens here.");
    });
  }

  const choose = (t: Tool) => {
    setTool(t);
    if (t === "ad") setFilter("ad");
    else if (t === "people") setFilter("person");
    else if (filter === "ad" || filter === "person") setFilter("all");
  };
  const reuse = (pic: PicId, t: Mode) => {
    setImage(pic);
    setTool(t);
    if (t === "video") setPrompt("The camera slowly pushes in while steam rises and the light shifts");
    if (t === "edit") setPrompt("Make it daytime, keep everything else the same");
  };

  const slot = (label: string, empty: string) => (
    <div
      className={c("slot", "tall")}
      role="button"
      tabIndex={0}
      onClick={() => (image ? undefined : setImage("ramen"))}
      onKeyDown={(e) => e.key === "Enter" && setImage("ramen")}
      title={image ? "" : "Pick a photo (in the preview this uses a sample from Your work)"}
      style={image ? { padding: 0, borderStyle: "solid", borderColor: "var(--glass-border)" } : undefined}
    >
      {image ? (
        <>
          <Pic id={image} className={c("slot-pic")} />
          <span style={{ position: "absolute", left: 8, bottom: 8, padding: "3px 9px", borderRadius: 10, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 11, fontWeight: 600 }}>{label}</span>
          <button
            title="Remove"
            onClick={(e) => {
              e.stopPropagation();
              setImage(null);
            }}
            style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.65)", color: "#fff" }}
          >
            <Icon name="x" size="sm" />
          </button>
        </>
      ) : (
        <>
          <Icon name="image" />
          <span className={c("slot-label")}>{label}</span>
          <span className={c("slot-sub")}>{empty}</span>
        </>
      )}
    </div>
  );

  return (
    <div className={c("studio")}>
      <div className={c("card studio-panel")}>
        <div className={c("studio-tools")}>
          {TOOLS.map((t) => (
            <button key={t.id} className={c("studio-tool", tool === t.id && "on")} onClick={() => choose(t.id)}>
              <Icon name={t.icon} />
              <b>{t.label}</b>
              <small>{t.sub}</small>
            </button>
          ))}
        </div>

        {tool === "ad" ? (
          <>
            <div className={c("studio-body scroll")}>
              <div className={c("studio-step")}>
                <span className={c("step-num")}>1</span>
                <div className={c("step-main")}>
                  <div className={c("step-title")}>What are you selling?</div>
                  <div className={c("link-box")}>
                    <Icon name="link" size="sm" />
                    <input className={c("link-input")} placeholder="Paste a product link: Amazon, AliExpress, any store" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && makeAd()} />
                  </div>
                  <button className={c("text-btn")} onClick={() => notify("In the app this opens your files to pick product photos.")}>
                    <Icon name="upload" size="sm" /> No link? Start from your own photos
                  </button>
                </div>
              </div>
              <div className={c("studio-step")}>
                <span className={c("step-num")}>2</span>
                <div className={c("step-main")}>
                  <div className={c("step-title")}>Who presents it?</div>
                  <div className={c("people-row")}>
                    <button className={c("person-pick", presenter === "" && "on")} onClick={() => setPresenter("")}>
                      <span className={c("person-face auto")}>
                        <Icon name="wand" size="sm" />
                      </span>
                      <span>AI picks</span>
                    </button>
                  </div>
                  <div className={c("hint-sm")}>Add people with the People tool above to have the same person star in every ad.</div>
                </div>
              </div>
              <div className={c("studio-step")}>
                <span className={c("step-num")}>3</span>
                <div className={c("step-main")}>
                  <div className={c("step-title")}>
                    Directions <span className={c("step-opt")}>optional</span>
                  </div>
                  <textarea className={c("text-input")} rows={3} placeholder="e.g. aim at gym guys, film it in a car, funny tone, mention free shipping" value={brief} onChange={(e) => setBrief(e.target.value)} />
                </div>
              </div>
            </div>
            <div className={c("studio-foot")}>
              <button className={c("btn btn-ai studio-go")} disabled={!url.trim() || !!job} onClick={makeAd}>
                <Icon name="megaphone" size="sm" /> Make the ad
              </button>
              <div className={c("hint-sm")}>The AI reads the page, writes a script and plans talking and product scenes. You can change everything after.</div>
            </div>
          </>
        ) : tool === "tryon" ? (
          <>
            <div className={c("studio-body scroll")}>
              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>Who wears it</div>
                <div className={c("hint-sm")}>Pick one or several people (each gets their own picture), or use a photo of anyone who agreed. A full-body photo works best.</div>
                <button className={c("slot tall")} onClick={() => notify("In the app this opens your files to pick a photo.")}>
                  <Icon name="image" />
                  <span className={c("slot-label")}>Their photo</span>
                  <span className={c("slot-sub")}>Add a full-body photo</span>
                </button>
              </div>
              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>The clothes</div>
                <div className={c("slot-row")}>
                  <button className={c("slot")} onClick={() => notify("In the app this opens your files to pick the clothes.")}>
                    <Icon name="image" />
                    <span className={c("slot-label")}>Top</span>
                    <span className={c("slot-sub")}>Product photo, or worn by someone</span>
                  </button>
                  <button className={c("slot")} onClick={() => notify("In the app this opens your files to pick the clothes.")}>
                    <Icon name="image" />
                    <span className={c("slot-label")}>Bottoms</span>
                    <span className={c("slot-sub")}>Optional: keeps their own if empty</span>
                  </button>
                </div>
                <div className={c("hint-sm")}>Clear, well-lit photos of the clothes work best: laid flat, on a hanger, or a store&apos;s product photo.</div>
              </div>
            </div>
            <div className={c("studio-foot")}>
              <div className={c("studio-blocked")}>
                This needs its AI model.{" "}
                <a style={{ color: "var(--brand)", cursor: "pointer" }} onClick={() => onOpenModels("tryon")}>
                  Get it in Models
                </a>
                .
              </div>
              <button className={c("btn btn-ai studio-go")} disabled>
                <Icon name="shirt" size="sm" /> Try it on
              </button>
              <div className={c("hint-sm")}>Keeps the face, hair and pose; swaps in the exact clothes. Runs on this PC.</div>
            </div>
          </>
        ) : tool === "people" ? (
          <>
            <div className={c("studio-body scroll")}>
              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>New person</div>
                <div className={c("hint-sm")}>Save a person once and they keep the same face in every photo, video and ad.</div>
              </div>
              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>Name</div>
                <input className={c("text-input")} placeholder="e.g. Mia" />
              </div>
              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>Look</div>
                <input className={c("text-input")} placeholder="e.g. 25, long dark hair, casual cream sweater" />
              </div>
              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>Reference pictures</div>
                <button className={c("slot")} style={{ width: 96 }} onClick={() => notify("In the app this opens your files to add photos of the person.")}>
                  <Icon name="plus" />
                  <span className={c("slot-label")}>Add</span>
                </button>
              </div>
            </div>
            <div className={c("studio-foot")}>
              <button className={c("btn btn-ai studio-go")} disabled>
                <Icon name="check" size="sm" /> Save person
              </button>
              <div className={c("hint-sm")}>Build or add a reference first.</div>
            </div>
          </>
        ) : (
          <>
            <div className={c("studio-body scroll")}>
              {mode === "photo" && (
                <div className={c("studio-sec")}>
                  <div className={c("sec-label")}>Image model</div>
                  <select className={c("select studio-select")} value={checkpoint} onChange={(e) => setCheckpoint(e.target.value)}>
                    <option value="">{MODELS.find((m) => m.id === roles.image)?.name ?? "Default image model"} (default)</option>
                    {MODELS.filter((m) => m.id !== roles.image && m.roles.includes("image") && ["flux2-klein-4b"].includes(m.id)).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode !== "photo" && (
                <div className={c("studio-sec")}>
                  <div className={c("sec-label")}>{mode === "edit" ? "Who or what to change" : mode === "remix" ? "Who's in your version" : "Who's in it"}</div>
                  {mode === "remix" && <div className={c("hint-sm")}>Pick a saved person to star in your version of the video, or use a photo of anyone who agreed.</div>}
                  <div className={c("people-row")}>
                    <button className={c("person-pick")} onClick={() => choose("people")} title="Make a saved person in People">
                      <span className={c("person-face auto")}>
                        <Icon name="plus" size="sm" />
                      </span>
                      <span>Add a person</span>
                    </button>
                  </div>
                  {slot(mode === "edit" ? "Your photo" : "Start photo", "Add a photo")}
                </div>
              )}

              {mode === "remix" && (
                <>
                  <button className={c("slot")} onClick={() => setVideo(true)} style={video ? { borderStyle: "solid", borderColor: "rgba(var(--brand-rgb),0.5)" } : undefined}>
                    <Icon name="video" />
                    <span className={c("slot-label")}>Video to copy</span>
                    <span className={c("slot-sub")}>{video ? "dance-clip.mp4" : "Choose a video"}</span>
                  </button>
                  <div className={c("studio-sec")}>
                    <div className={c("sec-label")}>How to use it</div>
                    <div className={c("choice-row")}>
                      <button className={c("choice", remixKind === "move" && "on")} onClick={() => setRemixKind("move")}>
                        <b>Copy the moves</b>
                        <small>Your person does the same motion, in your photo&apos;s setting</small>
                      </button>
                      <button className={c("choice", remixKind === "replace" && "on")} onClick={() => setRemixKind("replace")}>
                        <b>Swap them in</b>
                        <small>Your person takes the place of the one in the video</small>
                      </button>
                    </div>
                    <label className={c("consent")}>
                      <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} />
                      I own this video or have permission to use it, and the person I&apos;m swapping in is AI-made, me, or has agreed.
                    </label>
                  </div>
                </>
              )}

              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>
                  {mode === "video" ? "What happens" : mode === "remix" ? "Extra directions (optional)" : mode === "edit" ? "What to change" : "Describe it"}
                  {EXAMPLES[mode] && (
                    <button className={c("text-btn small")} onClick={() => setPrompt(EXAMPLES[mode])}>
                      Example
                    </button>
                  )}
                </div>
                <textarea
                  className={c("text-input studio-prompt")}
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && generate()}
                  placeholder={mode === "video" ? "The action and the movement, e.g. she opens the box and smiles" : mode === "edit" ? "e.g. put her in a cozy bedroom holding the product" : "A person, a place, a product… the more detail, the better"}
                />
                <input className={c("text-input studio-avoid")} value={neg} onChange={(e) => setNeg(e.target.value)} placeholder="Leave out (optional): e.g. text, extra fingers, cartoon" />
              </div>

              <div className={c("studio-sec")}>
                <div className={c("sec-label")}>Shape</div>
                <div className={c("shape-row")}>
                  {SHAPES.map(([a, l, r]) => (
                    <button key={a} className={c("shape", aspect === a && "on")} onClick={() => setAspect(a)}>
                      <span className={c("shape-box")} style={{ width: r >= 1 ? 26 : 26 * r, height: r >= 1 ? 26 / r : 26 }} />
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {(mode === "photo" || mode === "edit") && (
                <div className={c("studio-sec")}>
                  <div className={c("sec-label")}>Framing</div>
                  <div className={c("seg")}>
                    {FRAMING.map(([f, l]) => (
                      <button key={f} className={c("chip", framing === f && "active")} onClick={() => setFraming(f)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mode === "video" && (
                <div className={c("studio-sec")}>
                  <div className={c("sec-label")}>Camera</div>
                  <div className={c("seg")}>
                    {CAMERA.map(([k, l]) => (
                      <button key={k} className={c("chip", camera === k && "active")} onClick={() => setCamera(k)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(mode === "video" || mode === "remix") && (
                <div className={c("studio-sec")}>
                  <div className={c("sec-label")}>Length</div>
                  <div className={c("seg")}>
                    {(mode === "remix" ? [3, 5, 10, 15] : [3, 5]).map((n) => (
                      <button key={n} className={c("chip", secs === n && "active")} onClick={() => setSecs(n)}>
                        {n} seconds
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={c("studio-foot")}>
              {blocked && <div className={c("studio-blocked")}>{blocked}</div>}
              <button className={c("btn btn-ai studio-go")} onClick={generate} disabled={!!blocked || !!job}>
                <Icon name="spark" size="sm" /> Make it
                {!blocked && mode !== "remix" && <span className={c("go-time")}>about {est < 90 ? `${est} s` : `${Math.round(est / 60)} min`}</span>}
              </button>
              <div className={c("hint-sm")}>{mode === "remix" ? "About 6 minutes of work per 5 seconds of video." : "Runs on this PC. Ctrl+Enter to start."}</div>
            </div>
          </>
        )}
      </div>

      <div className={c("studio-gallery")}>
        <div className={c("gallery-bar")}>
          <div className={c("gallery-title")}>Your work</div>
          <div className={c("seg")}>
            {(
              [
                ["all", "Everything"],
                ["image", "Photos"],
                ["video", "Videos"],
                ["ad", "Ads"],
                ["person", "People"],
              ] as [Filter, string][]
            ).map(([f, l]) => (
              <button key={f} className={c("chip", filter === f && "active")} onClick={() => setFilter(f)}>
                {l} <span className={c("chip-count")}>{counts[f]}</span>
              </button>
            ))}
          </div>
          {note && <span className={c("gallery-note")}>{note}</span>}
        </div>

        {sel && (
          <div className={c("card viewer")}>
            <div className={c("viewer-media")}>{sel.kind === "ad" ? <Icon name="megaphone" size="lg" /> : <Pic id={sel.k.pic === "ramen" ? "ramenBig" : sel.k.pic} moving={sel.kind === "video"} />}</div>
            <div className={c("viewer-side")}>
              <div className={c("viewer-head")}>
                <span className={c("kind-tag", sel.kind === "ad" && "ad")}>{sel.kind === "image" ? "Photo" : sel.kind === "video" ? "Video" : "Ad"}</span>
                <span className={c("hint-sm")}>{sel.kind === "ad" ? sel.p.when : sel.k.when}</span>
                <button className={c("mini viewer-close")} title="Close" onClick={() => setSelKey(null)}>
                  <Icon name="x" size="sm" />
                </button>
              </div>
              {sel.kind === "ad" ? (
                <>
                  <div className={c("viewer-title")}>{sel.p.name}</div>
                  <div className={c("hint")}>Not exported yet</div>
                  <div className={c("viewer-actions")}>
                    <button className={c("btn btn-primary")} onClick={() => notify("In the app this opens the ad editor: scenes, script, voice and export.")}>
                      <Icon name="pen" size="sm" /> Open the ad
                    </button>
                    <button
                      className={c("mini danger")}
                      title="Delete this ad"
                      onClick={() => {
                        setProjects((l) => l.filter((x) => x.id !== sel.key));
                        setSelKey(null);
                      }}
                    >
                      <Icon name="trash" size="sm" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={c("viewer-prompt")}>{sel.k.prompt}</div>
                  <div className={c("viewer-facts")}>
                    <span>
                      <Icon name="cpu" size="sm" /> {sel.k.model}
                    </span>
                  </div>
                  <div className={c("viewer-actions")}>
                    {sel.kind === "image" && (
                      <>
                        <button className={c("chip")} onClick={() => reuse(sel.k.pic, "video")}>
                          <Icon name="video" size="sm" /> Animate it
                        </button>
                        <button className={c("chip")} onClick={() => reuse(sel.k.pic, "edit")}>
                          <Icon name="brush" size="sm" /> Edit it
                        </button>
                        <button className={c("chip")} onClick={() => choose("people")}>
                          <Icon name="person" size="sm" /> Save as a person
                        </button>
                      </>
                    )}
                    <button
                      className={c("chip")}
                      onClick={() => {
                        setPrompt(sel.k.prompt);
                        setTool(sel.kind === "video" ? "video" : "photo");
                      }}
                    >
                      <Icon name="redo" size="sm" /> Use the description
                    </button>
                    <button className={c("mini")} title="Show the file" onClick={() => notify("In the app this shows the file in its folder on the drive.")}>
                      <Icon name="folder" size="sm" />
                    </button>
                    <button
                      className={c("mini danger")}
                      title="Delete"
                      onClick={() => {
                        setCreations((l) => l.filter((x) => x.id !== sel.key));
                        setSelKey(null);
                      }}
                    >
                      <Icon name="trash" size="sm" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className={c("scroll gallery-scroll")}>
          {shown.length ? (
            <div className={c("gallery-grid")}>
              {shown.map((i) => (
                <button key={i.key} className={c("tile", selKey === i.key && "on")} onClick={() => setSelKey(i.key)} title={i.kind === "ad" ? i.p.name : i.k.prompt}>
                  {i.kind === "ad" ? (
                    <span className={c("tile-empty")}>
                      <Icon name="megaphone" size="lg" />
                    </span>
                  ) : (
                    <Pic id={i.k.pic} />
                  )}
                  {(i.kind === "video" || i.kind === "ad") && (
                    <span className={c("tile-tag")}>
                      <Icon name={i.kind === "video" ? "play" : "megaphone"} size="sm" />
                      {i.kind === "video" ? "Video" : "Ad"}
                    </span>
                  )}
                  {i.kind === "ad" && <span className={c("tile-name")}>{i.p.name}</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className={c("gallery-empty")}>
              <RLogo className={c("logo")} />
              <b>{filter === "person" ? "No people yet" : filter === "ad" ? "No ads yet" : filter === "video" ? "No videos yet" : filter === "image" ? "No photos yet" : "Nothing here yet"}</b>
              <span>
                {filter === "person"
                  ? "Save a person on the left from a photo or an AI reference sheet, and they keep the same face in every photo, video and ad."
                  : filter === "ad"
                    ? "Paste a product link on the left and the AI makes the ad."
                    : "Pick what to make on the left, describe it and press Make it."}
              </span>
            </div>
          )}
        </div>
      </div>

      {job && (
        <JobOverlay
          job={job}
          onStop={() => {
            jobToken.current++;
            setJob(null);
          }}
        />
      )}
    </div>
  );
}
