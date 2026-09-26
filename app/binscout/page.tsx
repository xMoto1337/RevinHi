"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// This page has nothing to do with RevinHi's own products - it's the "anywhere" (not same-WiFi)
// phone UI for BinScout, a separate desktop app. It lives here only because that app's owner
// already had this Supabase-backed Next.js site running and reused it rather than standing up
// dedicated infrastructure. See app/api/binscout/* and supabase/schema.sql's binscout_jobs table.

type SoldComp = {
  item_id: string;
  title: string;
  price: number;
  sold_date: string | null;
  condition: string | null;
  thumbnail_url: string | null;
};

type CompsStats = { count: number; median: number; average: number; min: number; max: number };

type CompsResult = {
  sold_items: SoldComp[];
  active_count: number;
  sell_through_rate: number;
  stats: CompsStats | null;
  suggested_max_bid: number | null;
};

type ImageMatch = { title: string; price: number | null; thumbnail_url: string | null; item_url: string | null };

const POLL_INTERVAL_MS = 1200;
const POLL_TIMEOUT_MS = 30_000;

function money(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `$${v.toFixed(2)}`;
}

async function submitJob(token: string, kind: "search" | "image_search", payload: unknown) {
  const resp = await fetch("/api/binscout/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, kind, payload }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.ok) throw new Error(data.error === "payload_too_large" ? "That photo was too large." : "Could not reach the relay.");
  return data.id as string;
}

async function waitForResult(id: string, token: string): Promise<{ result: unknown; error: string | null }> {
  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const resp = await fetch(`/api/binscout/result?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`);
    const data = await resp.json();
    if (data.ok && data.status === "done") return { result: data.result, error: data.error };
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Timed out waiting for your computer. Make sure BinScout is open there.");
}

// Phone photos can be several MB - shrinking to a reasonable max dimension before base64-encoding
// keeps the request well under the relay's payload limit and makes the whole round trip faster.
function downscaleImage(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the photo."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Your browser doesn't support photo resizing."));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/25 p-3">
      <div className="text-[9px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

function PlatformLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-center rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white"
    >
      {label}
    </a>
  );
}

function BinScoutMobileInner() {
  const params = useSearchParams();
  const token = params.get("t") ?? "";

  const [keywords, setKeywords] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comps, setComps] = useState<CompsResult | null>(null);
  const [compsKeywords, setCompsKeywords] = useState<string | null>(null);
  const [matches, setMatches] = useState<ImageMatch[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runSearch = async (kw: string) => {
    if (!kw.trim() || !token) return;
    setError(null);
    setMatches(null);
    setComps(null);
    setStatus("Sending to your computer…");
    try {
      const id = await submitJob(token, "search", { keywords: kw });
      setStatus("Waiting for your computer to pick this up…");
      const { result, error: jobError } = await waitForResult(id, token);
      if (jobError) throw new Error(jobError);
      setComps(result as CompsResult);
      setCompsKeywords(kw);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatus(null);
    }
  };

  const runImageSearch = async (file: File) => {
    if (!token) return;
    setError(null);
    setMatches(null);
    setComps(null);
    setStatus("Preparing photo…");
    try {
      const dataUrl = await downscaleImage(file);
      setStatus("Sending to your computer…");
      const id = await submitJob(token, "image_search", { image_base64: dataUrl });
      setStatus("Waiting for your computer to pick this up…");
      const { result, error: jobError } = await waitForResult(id, token);
      if (jobError) throw new Error(jobError);
      const data = result as { matches: ImageMatch[]; top_guess: string | null };
      setMatches(data.matches ?? []);
      if (data.top_guess) setKeywords(data.top_guess);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatus(null);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center text-white bg-black">
        <p>This link is missing its access code — scan the QR code from BinScout&apos;s Settings screen again.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 pb-16">
      <h1 className="text-lg font-bold mb-4">🔎 BinScout Mobile</h1>
      <p className="text-white/40 text-xs mb-4">
        Works from anywhere — your computer must be on and BinScout open to answer.
      </p>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 mb-3">
        <div className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">Search by keywords</div>
        <input
          className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-base text-white mb-2"
          placeholder="e.g. carhartt jacket XL"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(keywords)}
        />
        <button
          type="button"
          className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-bold py-3"
          onClick={() => runSearch(keywords)}
        >
          Search Sold Comps
        </button>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 mb-3">
        <div className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">Or identify by photo</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) runImageSearch(file);
          }}
        />
        <button
          type="button"
          className="w-full rounded-xl border border-white/15 bg-white/5 text-white font-bold py-3"
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Take / Choose Photo
        </button>
      </div>

      {status && <div className="text-white/50 text-sm text-center py-4">{status}</div>}
      {error && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 text-white p-3 text-sm mb-3">{error}</div>
      )}

      {matches && (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 mb-3">
          <div className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">
            Which one looks right? Tap it to check its sold price.
          </div>
          {matches.length === 0 && <div className="text-white/50 text-sm">No visual matches found on eBay.</div>}
          {matches.slice(0, 10).map((m, i) => (
            <button
              key={i}
              type="button"
              className="w-full flex items-center gap-3 py-2 border-b border-white/5 text-left"
              onClick={() => runSearch(m.title)}
            >
              {m.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumbnail_url} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-black/30 flex-shrink-0" />
              )}
              <div className="text-xs flex-1">{m.title}</div>
              <div className="text-sm font-bold text-emerald-400 whitespace-nowrap">{money(m.price)}</div>
            </button>
          ))}
        </div>
      )}

      {comps && (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 mb-3">
          {compsKeywords && (
            <div className="text-white/50 text-xs mb-2">
              Sold comps for: <b className="text-white">{compsKeywords}</b>
            </div>
          )}
          {!comps.stats ? (
            <div className="text-white/50 text-sm">No sold comps found.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Median" value={money(comps.stats.median)} />
                <Stat label="Range" value={`${money(comps.stats.min)}-${money(comps.stats.max)}`} />
                <Stat label="Sold Comps" value={String(comps.stats.count)} />
                <Stat label="Sell-Through" value={`${comps.sell_through_rate.toFixed(0)}%`} />
              </div>
              {comps.suggested_max_bid !== null && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center py-3 mt-3">
                  <div className="text-[10px] font-bold tracking-wider text-white/50 uppercase">Suggested Max Bid</div>
                  <div className="text-2xl font-bold text-emerald-400">{money(comps.suggested_max_bid)}</div>
                </div>
              )}
              <div className="mt-3">
                {comps.sold_items.slice(0, 15).map((item) => (
                  <div key={item.item_id} className="flex items-center gap-3 py-2 border-b border-white/5">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail_url} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-black/30 flex-shrink-0" />
                    )}
                    <div className="text-xs flex-1">{item.title}</div>
                    <div className="text-sm font-bold text-emerald-400 whitespace-nowrap">{money(item.price)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {compsKeywords && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <PlatformLink href={`https://www.depop.com/search/?q=${encodeURIComponent(compsKeywords)}`} label="Depop" />
              <PlatformLink
                href={`https://www.vinted.com/catalog?search_text=${encodeURIComponent(compsKeywords)}`}
                label="Vinted"
              />
              <PlatformLink href={`https://poshmark.com/search?query=${encodeURIComponent(compsKeywords)}`} label="Poshmark" />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function BinScoutMobilePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <BinScoutMobileInner />
    </Suspense>
  );
}
