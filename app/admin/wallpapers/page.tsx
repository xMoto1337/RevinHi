"use client";

import { useEffect, useState, FormEvent } from "react";

type WallpaperItem = {
  id: string;
  title: string;
  type: "video" | "image";
  tags: string[];
  source: string;
  sourceAttribution: string | null;
  status: string;
  createdAt: string;
  url: string | null;
};

// Simple shared-secret gate, not a real auth system - matches the scale of everything else here
// (a solo seller moderating their own marketplace), same spirit as the Gumroad webhook's
// account-id check. The secret is only ever sent as a header, never stored anywhere but
// sessionStorage (cleared when the tab closes).
export default function AdminWallpapersPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("revinhi-admin-secret");
    if (stored) {
      setSecret(stored);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      void loadPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function loadPending() {
    setLoading(true);
    const res = await fetch("/api/wallpapers?status=pending", { headers: { "x-admin-secret": secret } });
    if (res.status === 401) {
      setAuthed(false);
      sessionStorage.removeItem("revinhi-admin-secret");
      setMessage("Wrong secret.");
      setLoading(false);
      return;
    }
    const json = await res.json();
    setItems(json.items ?? []);
    setLoading(false);
  }

  function handleUnlock() {
    sessionStorage.setItem("revinhi-admin-secret", secret);
    setAuthed(true);
  }

  async function handleModerate(id: string, action: "approve" | "reject") {
    await fetch(`/api/wallpapers/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ action }),
    });
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setMessage("Uploading...");

    const res = await fetch("/api/wallpapers/upload", { method: "POST", body: formData });
    const json = await res.json();

    if (json.ok) {
      setMessage("Uploaded - now pending review below.");
      form.reset();
      void loadPending();
    } else {
      setMessage(`Upload failed: ${json.error}`);
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-6 text-white">
        <h1 className="text-xl font-semibold">Admin</h1>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white outline-none focus:border-neon-cyan"
        />
        <button onClick={handleUnlock} className="w-full rounded-lg bg-neon-cyan px-4 py-2 font-semibold text-black">
          Unlock
        </button>
        {message && <p className="text-sm text-white/60">{message}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-white">
      <h1 className="text-2xl font-bold">Wallpaper marketplace admin</h1>

      <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Upload a wallpaper</h2>
        <form onSubmit={handleUpload} className="mt-4 flex flex-col gap-3">
          <input name="title" required placeholder="Title" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 outline-none focus:border-neon-cyan" />
          <input name="tags" placeholder="Tags (comma separated)" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 outline-none focus:border-neon-cyan" />
          <input name="sourceAttribution" placeholder="Attribution (e.g. 'Video by Jane Doe on Pexels'), if not your own footage" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 outline-none focus:border-neon-cyan" />
          <input name="file" type="file" accept="video/mp4,video/webm,image/jpeg,image/png" required className="text-sm text-white/70" />
          <button type="submit" className="self-start rounded-lg bg-neon-cyan px-5 py-2 font-semibold text-black">
            Upload
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-white/60">{message}</p>}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Pending review ({items.length})</h2>
        {loading && <p className="mt-3 text-white/60">Loading...</p>}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              {item.url && item.type === "video" ? (
                <video src={item.url} controls muted className="aspect-video w-full rounded-lg bg-black object-cover" />
              ) : item.url ? (
                <img src={item.url} alt={item.title} className="aspect-video w-full rounded-lg bg-black object-cover" />
              ) : null}
              <p className="mt-2 font-medium">{item.title}</p>
              <p className="text-xs text-white/50">{item.tags.join(", ")}</p>
              {item.sourceAttribution && <p className="text-xs text-white/40">{item.sourceAttribution}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleModerate(item.id, "approve")} className="rounded-lg bg-neon-success px-4 py-1.5 text-sm font-semibold text-black">
                  Approve
                </button>
                <button onClick={() => handleModerate(item.id, "reject")} className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-semibold text-white">
                  Reject
                </button>
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && <p className="text-white/50">Nothing pending.</p>}
        </div>
      </section>
    </main>
  );
}
