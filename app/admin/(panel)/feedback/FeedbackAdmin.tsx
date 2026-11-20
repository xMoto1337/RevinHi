"use client";

import { useCallback, useEffect, useState } from "react";
import { FEEDBACK_APPS, FEEDBACK_KINDS } from "@/lib/feedback";

type Item = { id: string; app: string; kind: string; message: string; email: string | null; page: string | null; status: "new" | "done"; created_at: string };

const appLabel = (id: string) => FEEDBACK_APPS.find((a) => a.id === id)?.label ?? id;
const kindLabel = (id: string) => FEEDBACK_KINDS.find((k) => k.id === id)?.label ?? id;
const pill = (on: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm transition ${on ? "border-white/30 bg-white/10 font-semibold text-white" : "border-white/15 text-white/60 hover:text-white"}`;

// Login is checked by the (panel) layout and /api/admin/feedback (admin cookie).
export default function FeedbackAdmin() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [show, setShow] = useState<"new" | "done" | "all">("new");
  const [kind, setKind] = useState("");
  const [app, setApp] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/feedback")
      .then(async (res) => {
        if (res.status === 401) return void (window.location.href = "/admin/login?next=/admin/feedback");
        const data = await res.json();
        if (!res.ok) return setError(data.error ?? "Couldn't load.");
        setError("");
        setItems(data.items);
      })
      .catch(() => setError("Couldn't load."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: Item["status"]) {
    setItems((list) => list?.map((i) => (i.id === id ? { ...i, status } : i)) ?? null);
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  const all = items ?? [];
  const list = all.filter((i) => (show === "all" || i.status === show) && (!kind || i.kind === kind) && (!app || i.app === app));
  const count = (s: Item["status"]) => all.filter((i) => i.status === s).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="mt-1 text-sm text-white/50">
            {count("new")} new · {all.filter((i) => i.kind === "bug" && i.status === "new").length} new bugs · {all.length} total
          </p>
        </div>
        <button onClick={load} className={pill(false)}>
          Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["new", "done", "all"] as const).map((v) => (
          <button key={v} onClick={() => setShow(v)} className={pill(show === v)}>
            {v === "new" ? `New (${count("new")})` : v === "done" ? `Done (${count("done")})` : "All"}
          </button>
        ))}
        <span className="mx-1 hidden w-px bg-white/10 sm:block" />
        <button onClick={() => setKind("")} className={pill(kind === "")}>
          Every kind
        </button>
        {FEEDBACK_KINDS.map((k) => (
          <button key={k.id} onClick={() => setKind(k.id)} className={pill(kind === k.id)}>
            {k.label}
          </button>
        ))}
        <select
          value={app}
          onChange={(e) => setApp(e.target.value)}
          className="rounded-full border border-white/15 bg-transparent px-3.5 py-1.5 text-sm text-white/75 [&>option]:bg-[#111]"
        >
          <option value="">Every app</option>
          {FEEDBACK_APPS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-neon-danger">{error}</p>}
      {items === null && !error && <p className="mt-8 text-sm text-white/45">Loading...</p>}
      {items && list.length === 0 && <p className="glass-panel-flat mt-6 rounded-2xl p-10 text-center text-sm text-white/45">Nothing here.</p>}

      <ul className="mt-6 space-y-3">
        {list.map((i) => (
          <li key={i.id} className={`glass-panel-flat rounded-2xl p-4 transition hover:border-white/25 sm:p-5 ${i.status === "done" ? "opacity-55" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-2.5 py-0.5 font-semibold ${
                  i.kind === "bug"
                    ? "border-neon-danger/40 bg-neon-danger/10 text-neon-danger"
                    : i.kind === "idea"
                      ? "border-neon-success/40 bg-neon-success/10 text-neon-success"
                      : "border-white/20 text-white/65"
                }`}
              >
                {kindLabel(i.kind)}
              </span>
              <span className="font-semibold text-white/85">{appLabel(i.app)}</span>
              <span className="text-white/40">{new Date(i.created_at).toLocaleString()}</span>
              <span className="ml-auto flex gap-2">
                {i.email && (
                  <a
                    href={`mailto:${i.email}?subject=${encodeURIComponent(`Re: your ${kindLabel(i.kind).toLowerCase()} for ${appLabel(i.app)}`)}`}
                    className="rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 font-semibold text-neon-cyan transition hover:bg-neon-cyan/20"
                  >
                    Reply
                  </a>
                )}
                <button
                  onClick={() => setStatus(i.id, i.status === "new" ? "done" : "new")}
                  className="rounded-full border border-white/15 px-3 py-1 text-white/70 transition hover:border-white/30 hover:text-white active:scale-[0.97]"
                >
                  {i.status === "new" ? "Mark done" : "Mark new"}
                </button>
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/85">{i.message}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
              <span>{i.email ?? "No email"}</span>
              {i.page && <span className="truncate">Came from {i.page}</span>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
