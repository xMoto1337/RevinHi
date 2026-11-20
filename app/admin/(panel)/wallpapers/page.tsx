"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

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

const field =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-neon-cyan/60";

// Login is checked by the (panel) layout and the API routes (admin cookie), so no password here.
export default function AdminWallpapersPage() {
  const [items, setItems] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadPending = useCallback(() => {
    fetch("/api/wallpapers?status=pending")
      .then(async (res) => {
        if (res.status === 401) return void (window.location.href = "/admin/login");
        const json = await res.json();
        setItems(json.items ?? []);
      })
      .catch(() => setMessage("Couldn't load the review list."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function handleModerate(id: string, action: "approve" | "reject") {
    await fetch(`/api/wallpapers/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setMessage("Uploading...");
    const res = await fetch("/api/wallpapers/upload", { method: "POST", body: new FormData(form) });
    const json = await res.json().catch(() => ({}));
    if (json.ok) {
      setMessage("Uploaded. It's waiting for review below.");
      form.reset();
      loadPending();
    } else {
      setMessage(`Upload failed: ${json.error ?? res.status}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Wallpapers</h1>

      <section className="glass-panel-flat mt-6 rounded-2xl p-5 sm:p-6">
        <h2 className="font-semibold">Upload a wallpaper</h2>
        <form onSubmit={handleUpload} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="title" required placeholder="Title" className={field} />
          <input name="tags" placeholder="Tags (comma separated)" className={field} />
          <input
            name="sourceAttribution"
            placeholder="Credit, if not your own (e.g. Video by Jane Doe on Pexels)"
            className={`${field} sm:col-span-2`}
          />
          <input
            name="file"
            type="file"
            accept="video/mp4,video/webm,image/jpeg,image/png"
            required
            className="text-sm text-white/70 file:mr-3 file:rounded-full file:border file:border-white/15 file:bg-white/5 file:px-4 file:py-1.5 file:text-white/80"
          />
          <button
            type="submit"
            className="justify-self-start rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-5 py-2 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/25 active:scale-[0.97] sm:justify-self-end"
          >
            Upload
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-white/60">{message}</p>}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">
          Waiting for review <span className="text-white/45">({items.length})</span>
        </h2>
        {loading && <p className="mt-3 text-sm text-white/50">Loading...</p>}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="glass-panel-flat rounded-2xl p-3">
              {item.url && item.type === "video" ? (
                <video src={item.url} controls muted className="aspect-video w-full rounded-xl bg-black object-cover" />
              ) : item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.title} className="aspect-video w-full rounded-xl bg-black object-cover" />
              ) : null}
              <div className="px-1 pb-1">
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="text-xs text-white/50">{item.tags.join(", ")}</p>
                {item.sourceAttribution && <p className="text-xs text-white/40">{item.sourceAttribution}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleModerate(item.id, "approve")}
                    className="rounded-full border border-neon-success/40 bg-neon-success/15 px-4 py-1.5 text-sm font-semibold text-neon-success transition hover:bg-neon-success/25 active:scale-[0.97]"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleModerate(item.id, "reject")}
                    className="rounded-full border border-neon-danger/35 bg-neon-danger/10 px-4 py-1.5 text-sm font-semibold text-neon-danger transition hover:bg-neon-danger/20 active:scale-[0.97]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!loading && items.length === 0 && <p className="glass-panel-flat mt-4 rounded-2xl p-8 text-center text-sm text-white/45">Nothing waiting.</p>}
      </section>
    </main>
  );
}
