"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getProduct } from "@/lib/products";
import { AppWindow } from "./AppWindow";
import { ChatView } from "./ai/chat";
import { CreateView } from "./ai/create";
import { INSTALLED, MODELS, PC, ROLES, SEED_PINS, type ChatPin, type MapPin } from "./ai/data";
import { MapView } from "./ai/map";
import { ModelsView, type Downloads } from "./ai/models";
import { SettingsView, type Look } from "./ai/settings";
import { Icon, RLogo, c, contours, gb, heights, leftText, makeNoise, sized } from "./ai/ui";

/**
 * "Try the app" preview of RevinHi AI: the real app's screens rebuilt from its own components and
 * styles (revinhi-studio/src), with sample models, chats, pictures and map pins. Answers are canned
 * and "streamed"; downloads and picture-making are simulated; anything that would touch the PC
 * (files, folders, the microphone) only shows a note. No AI runs and nothing goes online.
 */

type Screen = "chat" | "map" | "create" | "models" | "settings";
const TABS: [Screen, string, string][] = [
  ["chat", "Chat", "chat"],
  ["map", "Map", "map"],
  ["create", "Create", "spark"],
  ["models", "Models", "box"],
  ["settings", "Settings", "gear"],
];

const PRODUCT = getProduct("ai");
const bgNoise = makeNoise(7);

/** Faint elevation lines behind the whole app, in the look's colors. */
function TopoBackground({ look }: { look: Look }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => {
      const w = cv.offsetWidth;
      const h = cv.offsetHeight;
      if (!w || !h) return;
      const ctx = sized(cv, w, h);
      ctx.clearRect(0, 0, w, h);
      if (!look.topo) return;
      const css = getComputedStyle(cv);
      contours(ctx, heights(bgNoise, w, h, 10, 430, 0.4 * 430), 0.05, css.getPropertyValue("--topo-minor").trim(), css.getPropertyValue("--topo-major").trim());
    };
    const raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [look.topo, look.theme]);
  return <canvas ref={ref} className={c("topo-bg")} />;
}

function AiApp() {
  const [screen, setScreen] = useState<Screen>("chat");
  const [visited, setVisited] = useState<Screen[]>(["chat"]);
  const [chatWaiting, setChatWaiting] = useState(false);
  const [online, setOnline] = useState(false);
  const [look, setLookState] = useState<Look>({ theme: "green", topo: true, blur: true, autoRed: false });
  const [installed, setInstalled] = useState<string[]>(INSTALLED);
  const [downloads, setDownloads] = useState<Downloads>({});
  const [finished, setFinished] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<string, string>>(ROLES);
  const [modelsAsk, setModelsAsk] = useState<{ cat?: string; n: number }>({ n: 0 });
  const [pins, setPinsState] = useState<MapPin[]>(SEED_PINS);
  const [selPin, setSelPin] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState(0);
  const onChat = useRef(true);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    onChat.current = s === "chat";
    if (s === "chat") setChatWaiting(false);
    setVisited((v) => (v.includes(s) ? v : [...v, s]));
  }, []);
  const openModels = useCallback(
    (cat?: string) => {
      setModelsAsk((a) => ({ cat: cat ?? a.cat, n: a.n + 1 }));
      go("models");
    },
    [go],
  );
  const setPins = useCallback((fn: (p: MapPin[]) => MapPin[]) => setPinsState(fn), []);

  // Simulated downloads: each one fills in 6-15 seconds, then counts as installed.
  const active = Object.keys(downloads).length > 0;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setDownloads((d) => {
        const next: Downloads = {};
        const done: string[] = [];
        for (const [k, v] of Object.entries(d)) {
          const size = MODELS.find((m) => m.id === k)?.size ?? 5e9;
          const ms = Math.min(15000, 6000 + (size / 1e9) * 300);
          const p = v + 150 / ms;
          if (p >= 1) done.push(k);
          else next[k] = p;
        }
        if (done.length) {
          setInstalled((list) => [...list, ...done.filter((x) => !list.includes(x))]);
          setFinished(done[done.length - 1]);
        }
        return next;
      });
    }, 150);
    return () => window.clearInterval(id);
  }, [active]);
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => setFinished(null), 8000);
    return () => clearTimeout(t);
  }, [finished]);

  const dl = Object.entries(downloads);
  const dlGot = dl.reduce((s, [k, p]) => s + (MODELS.find((m) => m.id === k)?.size ?? 0) * p, 0);
  const dlTotal = dl.reduce((s, [k]) => s + (MODELS.find((m) => m.id === k)?.size ?? 0), 0);
  const dlName = dl.length === 1 ? MODELS.find((m) => m.id === dl[0][0])?.name : `${dl.length} models`;

  const pane = (name: Screen, node: ReactNode) =>
    visited.includes(name) && (
      <div key={name} className={c("tab-pane")} hidden={screen !== name}>
        {node}
      </div>
    );

  return (
    <div className={c("root")} data-theme={look.theme} data-blur={look.blur ? "on" : "off"}>
      <TopoBackground look={look} />
      <div className={c("header")}>
        <div className={c("header-brand")}>
          <RLogo className={c("header-icon")} />
          <div className={c("header-title")}>
            REVINHI <span className={c("title-separator")}>|</span> <span className={c("title-app")}>AI</span>
          </div>
          <div className={c("tabs")}>
            {TABS.map(([name, label, icon]) => (
              <button key={name} className={c("tab", screen === name && "active")} onClick={() => go(name)}>
                <Icon name={icon} />
                {label}
                {name === "chat" && chatWaiting && <span className={c("tab-dot")} title="A reply is waiting" />}
              </button>
            ))}
          </div>
        </div>
        <div className={c("header-right")}>
          {dl.length > 0 ? (
            <button className={c("pill dl-pill")} onClick={() => openModels()} title={`Downloading ${dlName}: ${gb(dlGot)} of ${gb(dlTotal)} (click to see it)`}>
              <span className={c("dl-ring")} style={{ background: `conic-gradient(var(--success) ${(100 * dlGot) / Math.max(1, dlTotal)}%, rgba(255,255,255,0.12) 0)` }} />
              <span className={c("pill-text")}>
                <Icon name="download" size="sm" /> Downloading {Math.round((100 * dlGot) / Math.max(1, dlTotal))}% · {leftText((dlTotal - dlGot) / 92.4e6)}
              </span>
            </button>
          ) : (
            finished && (
              <button className={c("pill dl-pill")} onClick={() => openModels()}>
                <span className={c("pill-dot dot-success")} />
                <span className={c("pill-text")}>{MODELS.find((m) => m.id === finished)?.name ?? "Model"} downloaded</span>
              </button>
            )
          )}
          <div className={c("pill")} title={PC.gpu}>
            <span className={c("pill-dot dot-success")} />
            <span className={c("pill-text")}>
              {PC.short} · {PC.vram} GB
            </span>
          </div>
          <button
            className={c("net", online && "on")}
            onClick={() => setOnline((o) => !o)}
            title={online ? "The AI can search the web and read pages. Click to turn internet off." : "The AI works fully offline. Click to let it search the web."}
          >
            <span className={c("net-text")}>
              <b>Internet</b>
              <small>{online ? "On · can search the web" : "Off · works offline"}</small>
            </span>
            <span className={c("switch calm", online && "on")}>
              <span className={c("switch-knob")} />
            </span>
          </button>
        </div>
      </div>

      <div className={c("main-content")}>
        {pane(
          "chat",
          <ChatView
            installed={installed}
            online={online}
            onOpenModels={openModels}
            onDone={() => !onChat.current && setChatWaiting(true)}
            onOpenMap={(p: ChatPin) => {
              setPinsState((list) => (list.some((x) => x.id === p.id) ? list : [...list, { id: p.id, name: p.name, kind: p.kind, lng: p.lng, lat: p.lat }]));
              setSelPin(p.id);
              setMapFocus((n) => n + 1);
              go("map");
            }}
          />,
        )}
        {pane("map", <MapView pins={pins} setPins={setPins} sel={selPin} setSel={setSelPin} online={online} focus={mapFocus} />)}
        {pane("create", <CreateView roles={roles} onOpenModels={openModels} />)}
        {pane(
          "models",
          <ModelsView
            installed={installed}
            downloads={downloads}
            roles={roles}
            initialCategory={modelsAsk.cat}
            ask={modelsAsk.n}
            onDownload={(ids) => setDownloads((d) => ({ ...d, ...Object.fromEntries(ids.filter((id) => !(id in d)).map((id) => [id, 0])) }))}
            onPause={(id) =>
              setDownloads((d) => {
                const next = { ...d };
                delete next[id];
                return next;
              })
            }
            onDelete={(id) => {
              setInstalled((list) => list.filter((x) => x !== id));
              setRoles((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== id)));
            }}
            onRole={(role, id) => setRoles((r) => ({ ...r, [role]: id }))}
          />,
        )}
        {pane(
          "settings",
          <SettingsView look={look} setLook={(l) => setLookState((x) => ({ ...x, ...l }))} roles={roles} installed={installed} online={online} onOpenModels={() => openModels()} />,
        )}
      </div>
    </div>
  );
}

export default function AiDemo() {
  return (
    <AppWindow title={PRODUCT.name} icon={PRODUCT.icon} accent={PRODUCT.accent} width={1320} height={896}>
      <AiApp />
    </AppWindow>
  );
}
