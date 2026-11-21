"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Frame for the "try the app" previews on each app page: a look-alike of the real app window
 * (frameless dark glass, custom title bar) drawn at a fixed design size and scaled down to fit the
 * page, so the inside can be laid out exactly like the real app at desktop size.
 *
 * Everything inside is visual only. Buttons that would really do something call `useDemo().notify()`,
 * which shows a small note inside the window instead (e.g. "In the app this starts the scan").
 */

type DemoApi = { notify: (text: string) => void };
const DemoContext = createContext<DemoApi>({ notify: () => {} });
export const useDemo = () => useContext(DemoContext);

export function AppWindow({
  title,
  icon,
  accent,
  width = 1120,
  height = 700,
  children,
}: {
  title: string;
  icon: string;
  accent: string;
  /** Design size in px - lay the inside out for this size; it is scaled to fit the page. */
  width?: number;
  height?: number;
  children: React.ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);

  return (
    <div ref={outer} className="w-full" style={{ height: height * scale }}>
      <div
        className="relative origin-top-left overflow-hidden rounded-[14px] border border-white/10 text-left text-[13px] text-white shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          background: "linear-gradient(160deg, rgba(22,22,22,0.97), rgba(8,8,8,0.98))",
          fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* Title bar, like the real frameless window */}
        <div className="flex h-9 items-center justify-between border-b border-white/[0.06] px-3 select-none">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/75">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt="" width={18} height={18} className="h-[18px] w-[18px] rounded" />
            {title}
          </div>
          <div className="flex items-center gap-1 text-white/45">
            <button type="button" aria-label="Minimize (preview)" onClick={() => notify("This is a preview of the app.")} className="grid h-7 w-9 place-items-center rounded hover:bg-white/10">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 5h8" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
            <button type="button" aria-label="Close (preview)" onClick={() => notify("This is a preview of the app.")} className="grid h-7 w-9 place-items-center rounded hover:bg-[#ff3b3b]/80 hover:text-white">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
          </div>
        </div>

        <DemoContext.Provider value={{ notify }}>
          <div className="relative" style={{ height: height - 36 }}>
            {children}
          </div>
        </DemoContext.Provider>

        {toast && (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-none absolute bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-black/85 px-4 py-2 text-xs font-medium text-white/90 shadow-lg"
            style={{ borderColor: `${accent}66`, boxShadow: `0 0 24px ${accent}33` }}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}

/** Page section wrapping a demo: heading + the window + a small "nothing here is real" note. */
export function TryTheApp({
  title = "Click around the app",
  subtitle = "A working preview of the real app. Nothing you do here changes anything.",
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id="preview" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">Try it here</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-3 text-white/60">{subtitle}</p>
        </div>
        {children}
        <p className="mt-4 text-center text-xs text-white/40 md:hidden">Best on a bigger screen.</p>
      </div>
    </section>
  );
}
