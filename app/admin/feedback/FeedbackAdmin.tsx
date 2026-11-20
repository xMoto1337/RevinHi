"use client";

import { useCallback, useEffect, useState } from "react";
import { FEEDBACK_APPS, FEEDBACK_KINDS } from "@/lib/feedback";

type Item = { id: string; app: string; kind: string; message: string; email: string | null; page: string | null; status: "new" | "done"; created_at: string };

const KEY = "revinhi-admin-secret"; // same sessionStorage key as /admin
const appLabel = (id: string) => FEEDBACK_APPS.find((a) => a.id === id)?.label ?? id;
const kindLabel = (id: string) => FEEDBACK_KINDS.find((k) => k.id === id)?.label ?? id;

// Browser-only (loaded with ssr:false from page.tsx), so sessionStorage is safe to read up front.
export default function FeedbackAdmin() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem(KEY) ?? "");
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [show, setShow] = useState<"new" | "all">("new");
  const [app, setApp] = useState("");

  const load = useCallback((s: string) => {
    fetch("/api/admin/feedback", { headers: { "x-admin-secret": s } })
      .then(async (res) => {
        if (res.status === 401) {
          sessionStorage.removeItem(KEY);
          setSecret("");
          setError("Wrong password.");
          return;
        }
        const data = await res.json();
        if (!res.ok) return setError(data.error ?? "Couldn't load.");
        setError("");
        setItems(data.items);
      })
      .catch(() => setError("Couldn't load."));
  }, []);

  useEffect(() => {
    if (secret) load(secret);
  }, [secret, load]);

  async function setStatus(id: string, status: Item["status"]) {
    setItems((list) => list?.map((i) => (i.id === id ? { ...i, status } : i)) ?? null);
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ id, status }),
    });
  }

  if (!secret) {
    return (
      <main className="mx-auto w-full max-w-sm px-4 py-24">
        <h1 className="text-2xl font-bold">Feedback</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem(KEY, input);
            setSecret(input);
          }}
        >
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm outline-none focus:border-neon-cyan/60"
          />
          <button className="w-full rounded-full border border-neon-cyan/40 bg-neon-cyan/15 py-2.5 text-sm font-semibold text-neon-cyan">Open</button>
          {error && <p className="text-sm text-neon-danger">{error}</p>}
        </form>
      </main>
    );
  }

  const list = (items ?? []).filter((i) => (show === "all" || i.status === "new") && (!app || i.app === app));
  const newCount = (items ?? []).filter((i) => i.status === "new").length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Feedback <span className="text-base font-normal text-white/45">{newCount} new</span>
        </h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href="/admin" className="rounded-full border border-white/15 px-3.5 py-1.5 text-white/65 hover:text-white">Stats</a>
          {(["new", "all"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setShow(v)}
              className={`rounded-full border px-3.5 py-1.5 ${show === v ? "border-white/30 bg-white/10 text-white" : "border-white/15 text-white/60"}`}
            >
              {v === "new" ? "New" : "All"}
            </button>
          ))}
          <select value={app} onChange={(e) => setApp(e.target.value)} className="rounded-full border border-white/15 bg-transparent px-3 py-1.5 [&>option]:bg-[#111]">
            <option value="">Every app</option>
            {FEEDBACK_APPS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <button onClick={() => load(secret)} className="rounded-full border border-white/15 px-3.5 py-1.5 text-white/65 hover:text-white">Refresh</button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-neon-danger">{error}</p>}
      {items && list.length === 0 && <p className="mt-10 text-center text-white/45">Nothing here.</p>}

      <ul className="mt-6 space-y-3">
        {list.map((i) => (
          <li key={i.id} className={`glass-panel-flat rounded-2xl p-4 ${i.status === "done" ? "opacity-55" : ""}`}>
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
              <span className="font-semibold text-white/80">{appLabel(i.app)}</span>
              <span className="text-white/40">{new Date(i.created_at).toLocaleString()}</span>
              <span className="ml-auto">
                <button
                  onClick={() => setStatus(i.id, i.status === "new" ? "done" : "new")}
                  className="rounded-full border border-white/15 px-3 py-1 text-white/65 hover:border-white/30 hover:text-white"
                >
                  {i.status === "new" ? "Mark done" : "Mark new"}
                </button>
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/85">{i.message}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 text-xs text-white/45">
              {i.email ? <a href={`mailto:${i.email}`} className="text-neon-cyan hover:underline">{i.email}</a> : <span>No email</span>}
              {i.page && <span className="truncate">From {i.page}</span>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
