"use client";

import { useMemo, useState } from "react";
import { useDemo } from "../AppWindow";
import { CAP_BADGES, CATS, MODELS, PACKS, PC, ROLE_LABELS, fitOf, isNew, type Model } from "./data";
import { Icon, c, gb, leftText } from "./ui";

export type Downloads = Record<string, number>; // model id -> 0..1

/** Fake download speed shown on the cards (the preview finishes much faster than it says). */
const MBPS = 92.4;

/** The model store: browse by category, "download", choose defaults, add a model from Hugging Face. */
export function ModelsView({
  installed,
  downloads,
  roles,
  initialCategory,
  ask,
  onDownload,
  onPause,
  onDelete,
  onRole,
}: {
  installed: string[];
  downloads: Downloads;
  roles: Record<string, string>;
  initialCategory?: string;
  ask: number;
  onDownload: (ids: string[]) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
  onRole: (role: string, id: string) => void;
}) {
  const { notify } = useDemo();
  const [cat, setCat] = useState(initialCategory ?? "all");
  const [onlyInstalled, setOnlyInstalled] = useState(false);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"store" | "hf" | "defaults">("store");
  const [confirm, setConfirm] = useState<Model | null>(null);

  // Opened from Chat ("Get more models", a greyed-out mode): jump to that category.
  const [seenAsk, setSeenAsk] = useState(ask);
  if (ask !== seenAsk) {
    setSeenAsk(ask);
    if (initialCategory) {
      setCat(initialCategory);
      setView("store");
      setQ("");
      setOnlyInstalled(false);
    }
  }

  const isIn = (m: Model) => installed.includes(m.id);
  const list = useMemo(
    () =>
      MODELS.filter((m) => cat === "all" || m.category === cat)
        .filter((m) => !onlyInstalled || installed.includes(m.id))
        .filter((m) => !q.trim() || `${m.name} ${m.desc} ${m.caps.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => Number(b.id in downloads) - Number(a.id in downloads) || Number(installed.includes(b.id)) - Number(installed.includes(a.id)) || a.rank - b.rank),
    [cat, onlyInstalled, q, installed, downloads],
  );
  const used = MODELS.filter(isIn).reduce((s, m) => s + m.size, 0);

  return (
    <div className={c("store")}>
      <div className={c("store-top")}>
        <div className={c("nav")}>
          <button className={c("chip", view === "store" && "active")} onClick={() => setView("store")}>
            Model store
          </button>
          <button className={c("chip", view === "hf" && "active")} onClick={() => setView("hf")}>
            <Icon name="plus" size="sm" /> Add from Hugging Face
          </button>
          <button className={c("chip", view === "defaults" && "active")} onClick={() => setView("defaults")}>
            Defaults
          </button>
        </div>
        <span className={c("hint-sm")} style={{ marginLeft: "auto" }}>
          {gb(used)} of models · {gb(PC.free - used + 85e9)} free on the drive · {PC.short} {PC.vram} GB · {PC.ram} GB RAM
        </span>
      </div>

      {view === "store" && (
        <>
          <div className={c("store-filters")}>
            {CATS.filter(([id]) => id === "all" || MODELS.some((m) => m.category === id)).map(([id, label]) => (
              <button key={id} className={c("chip", cat === id && "active")} onClick={() => setCat(id)}>
                {label}
              </button>
            ))}
            <label className={c("hint-sm")} style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 8 }}>
              <input type="checkbox" checked={onlyInstalled} onChange={(e) => setOnlyInstalled(e.target.checked)} /> Installed only
            </label>
            <input className={c("text-input")} style={{ height: 30, width: 200, marginLeft: "auto" }} placeholder="Search models" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className={c("scroll")} style={{ flex: 1 }}>
            {cat === "all" && !q && !onlyInstalled && (
              <div className={c("pack-row")}>
                {PACKS.map((p) => {
                  const ms = p.models.map((id) => MODELS.find((m) => m.id === id)).filter((m): m is Model => !!m);
                  const missing = ms.filter((m) => !isIn(m));
                  const size = missing.reduce((s, m) => s + m.size, 0);
                  return (
                    <div key={p.id} className={c("pack-card")}>
                      <b>{p.name}</b>
                      <span className={c("hint-sm")}>{p.desc}</span>
                      <span className={c("hint-sm")}>
                        {ms.length - missing.length}/{ms.length} installed
                      </span>
                      {missing.length ? (
                        <button className={c("btn btn-secondary btn-small")} onClick={() => onDownload(missing.filter((m) => !(m.id in downloads)).map((m) => m.id))}>
                          Get the rest · {gb(size)}
                        </button>
                      ) : (
                        <span className={c("tag ok")}>
                          <Icon name="check" size="sm" /> Complete
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className={c("model-grid")}>
              {list.map((m) => {
                const fit = fitOf(m);
                const prog = downloads[m.id];
                const mine = Object.entries(roles)
                  .filter(([, id]) => id === m.id)
                  .map(([r]) => r);
                return (
                  <div key={m.id} className={c("model-card", isIn(m) && "installed")}>
                    <div className={c("model-card-top")}>
                      <b>{m.name}</b>
                      {isNew(m) && <span className={c("tag new")}>NEW</span>}
                    </div>
                    {m.caps.some((x) => CAP_BADGES[x]) && (
                      <div className={c("model-caps")}>
                        {m.caps
                          .filter((x) => CAP_BADGES[x])
                          .map((x) => (
                            <span key={x} className={c("cap")}>
                              <Icon name={CAP_BADGES[x][0]} size="sm" /> {CAP_BADGES[x][1]}
                            </span>
                          ))}
                      </div>
                    )}
                    <div className={c("model-desc")}>{m.desc}</div>
                    <div className={c("hint-sm")}>{[m.params, gb(m.size), m.released].filter(Boolean).join(" · ")}</div>
                    <div className={c("fit", `fit-${fit.level}`)}>{fit.label}</div>
                    {mine.length > 0 && (
                      <div className={c("hint-sm")}>
                        <Icon name="star" size="sm" /> Default for {mine.join(", ")}
                      </div>
                    )}
                    <div className={c("model-card-actions")}>
                      {prog !== undefined ? (
                        <>
                          <div className={c("progress")}>
                            <div style={{ width: `${prog * 100}%` }} />
                          </div>
                          <span className={c("hint-sm")}>
                            {gb(m.size * prog)} / {gb(m.size)} · {MBPS} MB/s · {leftText((m.size * (1 - prog)) / (MBPS * 1e6))}
                          </span>
                          <button className={c("mini danger")} onClick={() => onPause(m.id)}>
                            Pause
                          </button>
                        </>
                      ) : isIn(m) ? (
                        <>
                          <span className={c("tag ok")}>
                            <Icon name="check" size="sm" /> Installed
                          </span>
                          <span style={{ flex: 1 }} />
                          <button className={c("mini danger")} onClick={() => setConfirm(m)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className={c("btn btn-primary btn-small")} onClick={() => onDownload([m.id])} disabled={fit.level === "no" && !m.chat} title={fit.level === "no" ? fit.label : ""}>
                          Download · {gb(m.size)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!list.length && (
              <div className={c("hint")} style={{ padding: 20 }}>
                No models match.
              </div>
            )}
          </div>
        </>
      )}

      {view === "defaults" && (
        <div className={c("scroll")} style={{ flex: 1 }}>
          <div className={c("card defaults")}>
            <div className={c("section-title")}>Default model for each job</div>
            <div className={c("hint")}>The app uses these everywhere (chat, ads, Create). You can still pick any model in a chat.</div>
            {ROLE_LABELS.map(([role, label]) => {
              const can = MODELS.filter((m) => installed.includes(m.id) && m.roles.includes(role));
              return (
                <label key={role} className={c("role-row")}>
                  <span>{label}</span>
                  <select className={c("select")} value={roles[role] ?? ""} disabled={!can.length} onChange={(e) => onRole(role, e.target.value)}>
                    {!can.length && <option value="">Nothing installed for this yet</option>}
                    {can.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
          <div className={c("card defaults")}>
            <div className={c("section-title")}>Store settings</div>
            <label className={c("role-row")}>
              <span>Model list version 42 (2026-11-14)</span>
              <span>
                <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app this checks for new models (Internet must be on).")}>
                  Check for new models
                </button>
              </span>
            </label>
          </div>
        </div>
      )}

      {view === "hf" && <HfAdd />}

      {confirm && (
        <div className={c("overlay")}>
          <div className={c("card overlay-card")}>
            <div className={c("section-title")}>Delete a model</div>
            <div className={c("hint")} style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Delete {confirm.name} from the drive? ({gb(confirm.size)}). You can download it again later.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className={c("btn btn-secondary")} onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className={c("btn btn-danger")}
                onClick={() => {
                  onDelete(confirm.id);
                  setConfirm(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const HITS = [
  { repo: "Qwen3.5 9B Instruct", downloads: 412318, likes: 1840, updated: "2026-03-02" },
  { repo: "Qwen3.5 14B Instruct", downloads: 198204, likes: 961, updated: "2026-03-09" },
  { repo: "Llama 4 Scout 17B", downloads: 152977, likes: 1203, updated: "2026-02-18" },
  { repo: "Mistral Small 3.2 24B", downloads: 98510, likes: 744, updated: "2026-01-27" },
];

function HfAdd() {
  const { notify } = useDemo();
  const [kind, setKind] = useState<"llm" | "checkpoint" | "lora">("llm");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<typeof HITS | null>(null);
  const search = () => {
    if (!q.trim()) return;
    notify("In the app this searches Hugging Face (Internet must be on). Here are sample results.");
    setHits(HITS);
  };
  return (
    <div className={c("scroll")} style={{ flex: 1 }}>
      <div className={c("card")} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className={c("section-title")}>Add any model from Hugging Face</div>
        <div className={c("nav")}>
          {(
            [
              ["llm", "Chat / coding model"],
              ["checkpoint", "Image model"],
              ["lora", "Style add-on"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={c("chip", kind === k && "active")}
              onClick={() => {
                setKind(k);
                setHits(null);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className={c("link-row")}>
          <input className={c("text-input")} placeholder={kind === "llm" ? "Search, e.g. qwen 9b, or paste a link" : "Search or paste a link"} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          <button className={c("btn btn-primary")} onClick={search} disabled={!q.trim()}>
            Search
          </button>
        </div>
        {hits && (
          <div className={c("hf-hits")}>
            {hits.map((h) => (
              <button key={h.repo} className={c("hf-hit")} onClick={() => notify(`In the app you pick a size of ${h.repo} that fits this PC and download it.`)}>
                <b>{h.repo}</b>
                <span className={c("hint-sm")}>
                  <Icon name="download" size="sm" /> {h.downloads.toLocaleString("en-US")} · <Icon name="star" size="sm" /> {h.likes} · {h.updated}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
