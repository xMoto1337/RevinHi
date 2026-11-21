"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "../AppWindow";
import { MODELS, PC } from "./data";
import { Switch, c, contours, gb, heights, makeNoise, sized } from "./ui";

export const THEMES: { id: string; name: string; desc: string }[] = [
  { id: "green", name: "RevinHi green", desc: "The standard look" },
  { id: "purple", name: "RevinHi purple", desc: "The logo's other color" },
  { id: "night", name: "Night", desc: "Frosted glass over glowing blue terrain" },
  { id: "field", name: "Field", desc: "Graphite and safety orange" },
  { id: "terrain", name: "Terrain", desc: "Olive and coyote tan" },
  { id: "redlight", name: "Red light", desc: "Keeps your night vision in the dark" },
];

// Preview colors per look (the same as the app's LookPicker): background, lines, lead color.
const SWATCH: Record<string, [string, string, string]> = {
  green: ["#070707", "255, 255, 255", "46, 213, 115"],
  purple: ["#070707", "255, 255, 255", "181, 60, 240"],
  night: ["#050b13", "127, 212, 255", "127, 212, 255"],
  field: ["#0d0f10", "255, 255, 255", "255, 122, 26"],
  terrain: ["#0f110c", "210, 168, 97", "210, 168, 97"],
  redlight: ["#080000", "255, 59, 40", "255, 59, 40"],
};
const noise = makeNoise(11);

function Sample({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => {
      const w = cv.offsetWidth;
      const h = cv.offsetHeight;
      if (!w || !h) return;
      const [bg, line] = SWATCH[id];
      const ctx = sized(cv, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      contours(ctx, heights(noise, w, h, 5, 120, id.length * 1.3 * 120), 0.06, `rgba(${line},0.13)`, `rgba(${line},0.3)`, [0.7, 1]);
    };
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [id]);
  const accent = SWATCH[id][2];
  return (
    <div className={c("look-sample")}>
      <canvas ref={ref} />
      <span className={c("look-chip")} style={{ background: `rgba(${accent},0.18)`, border: `1px solid rgba(${accent},0.6)`, color: `rgb(${accent})` }}>
        {THEMES.find((t) => t.id === id)?.name}
      </span>
    </div>
  );
}

export type Look = { theme: string; topo: boolean; blur: boolean; autoRed: boolean };

/** Settings: the look, what this PC can do, the engines on the drive, storage and privacy. */
export function SettingsView({ look, setLook, roles, installed, online, onOpenModels }: { look: Look; setLook: (l: Partial<Look>) => void; roles: Record<string, string>; installed: string[]; online: boolean; onOpenModels: () => void }) {
  const { notify } = useDemo();
  const [upd, setUpd] = useState("");
  const role = (r: string) => MODELS.find((m) => m.id === roles[r] && installed.includes(m.id))?.name ?? "-";
  const used = MODELS.filter((m) => installed.includes(m.id)).reduce((s, m) => s + m.size, 0);

  return (
    <div className={c("scroll")} style={{ flex: 1 }}>
      <div className={c("settings")}>
        <div className={c("card")} style={{ gridColumn: "1 / -1" }}>
          <div className={c("section-title")}>Look</div>
          <div className={c("hint")} style={{ margin: "4px 0 12px" }}>
            Pick the colors for the whole app. Saved on this drive.
          </div>
          <div className={c("looks")}>
            {THEMES.map((t) => (
              <button key={t.id} className={c("look", look.theme === t.id && "active")} onClick={() => setLook({ theme: t.id })}>
                <Sample id={t.id} />
                <div className={c("look-meta")}>
                  <b>{t.name}</b>
                  <small>{t.desc}</small>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            <div className={c("opt-row")}>
              <div>
                Elevation lines in the background
                <small>The faint map lines behind the app</small>
              </div>
              <Switch on={look.topo} onClick={() => setLook({ topo: !look.topo })} />
            </div>
            <div className={c("opt-row")}>
              <div>
                Glass blur
                <small>Turn off if the app feels slow on this computer</small>
              </div>
              <Switch on={look.blur} onClick={() => setLook({ blur: !look.blur })} />
            </div>
            <div className={c("opt-row")}>
              <div>
                Red light at night
                <small>Switches to Red light from 7 pm to 7 am, to keep your night vision</small>
              </div>
              <Switch on={look.autoRed} onClick={() => setLook({ autoRed: !look.autoRed })} />
            </div>
          </div>
        </div>

        <div className={c("card")}>
          <div className={c("section-title")}>This PC</div>
          <div className={c("kv")}>
            <span className={c("k")}>Graphics card</span>
            <span className={c("v")}>{PC.gpu}</span>
            <span className={c("k")}>Graphics memory</span>
            <span className={c("v")}>{PC.vram.toFixed(1)} GB</span>
            <span className={c("k")}>System memory</span>
            <span className={c("v")}>{PC.ram} GB</span>
            <span className={c("k")}>Good for</span>
            <span className={c("v ok")}>Mid-size chat models, fast · Images and photo editing · Video (several minutes per clip)</span>
          </div>
        </div>

        <div className={c("card")}>
          <div className={c("section-title")}>AI engines</div>
          <div className={c("kv")}>
            <span className={c("k")}>Chat engine</span>
            <span className={c("v ok")}>Ready</span>
            <span className={c("k")}>Loaded right now</span>
            <span className={c("v")}>Nothing (loads when you chat)</span>
            <span className={c("k")}>Images, video, voice</span>
            <span className={c("v ok")}>Ready</span>
            <span className={c("k")}>Ad renderer</span>
            <span className={c("v ok")}>Ready</span>
          </div>
        </div>

        <div className={c("card")}>
          <div className={c("section-title")}>Default models</div>
          <div className={c("kv")}>
            <span className={c("k")}>Chat</span>
            <span className={c("v")}>{role("chat")}</span>
            <span className={c("k")}>Coding</span>
            <span className={c("v")}>{role("code")}</span>
            <span className={c("k")}>Images</span>
            <span className={c("v")}>{role("image")}</span>
            <span className={c("k")}>Photo editing</span>
            <span className={c("v")}>{role("edit")}</span>
            <span className={c("k")}>Video</span>
            <span className={c("v")}>{role("video")}</span>
            <span className={c("k")}>Voice</span>
            <span className={c("v")}>{role("voice")}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className={c("btn btn-secondary btn-small")} onClick={onOpenModels}>
              Change in Models
            </button>
          </div>
        </div>

        <div className={c("card")}>
          <div className={c("section-title")}>Storage</div>
          <div className={c("kv")}>
            <span className={c("k")}>AI models</span>
            <span className={c("v")}>{gb(used)}</span>
            <span className={c("k")}>Free on the drive</span>
            <span className={c("v")}>{gb(PC.free - used + 85e9)}</span>
            <span className={c("k")}>App folder</span>
            <span className={c("v")}>E:\RevinHi AI</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {["Open app folder", "Open my creations", "Open music folder"].map((l) => (
              <button key={l} className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app this opens the folder on the drive.")}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className={c("card")} style={{ gridColumn: "1 / -1" }}>
          <div className={c("section-title")}>Privacy</div>
          <div className={c("hint")}>
            Everything runs on this PC. Chats, pictures, videos and voices are saved on this drive and never uploaded. The internet is only used when you download a model or check for new ones, and when you turn Internet on in the top bar (then the AI can search the web and open pages; your chats still stay here).
          </div>
          <div className={c("hint-sm")} style={{ marginTop: 10 }}>
            RevinHi AI 0.2.10
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
            <button
              className={c("btn btn-secondary btn-small")}
              disabled={!online || upd === "checking"}
              title={online ? "" : "Turn Internet on (top right) to check"}
              onClick={() => {
                setUpd("checking");
                setTimeout(() => setUpd("You have the latest version."), 1200);
              }}
            >
              Check for updates
            </button>
            <span className={c("hint-sm")}>{!online ? "Internet is off: updates are checked only when it's on." : upd === "checking" ? "Checking…" : upd}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
