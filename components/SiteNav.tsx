"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { APP_GROUPS, PRODUCTS } from "@/lib/products";

/*
 * Shared storefront top bar: logo (home), an "Apps" menu grouped like the home page, Guides and
 * Feedback. New apps show up in the menu automatically from lib/products.ts, so the bar never grows.
 * Links are plain <a> (full page loads) - simplest with gumroad.js.
 *
 * No backdrop-blur on this sticky bar - same reasoning as before (scroll smoothness).
 */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const under = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const onApp = PRODUCTS.some((p) => under(p.route));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const link = (active: boolean) =>
    `rounded-full px-2.5 py-1.5 text-sm transition sm:px-3.5 ${
      active ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-background/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-[0.18em]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/revinhi-brand-64.png" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="rgb-chase-text">REVINHI</span>
        </a>

        <nav aria-label="Main" className="flex items-center gap-1">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((o) => !o)}
              className={`flex items-center gap-1.5 ${link(onApp || open)}`}
            >
              Apps
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition ${open ? "rotate-180" : ""}`}>
                <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-[min(calc(100vw-2rem),340px)] rounded-2xl border border-white/15 bg-[#0b0b0c] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] sm:-right-24">
                {APP_GROUPS.map((g) => {
                  const apps = PRODUCTS.filter((p) => p.group === g.id);
                  if (apps.length === 0) return null;
                  return (
                    <div key={g.id} className="py-1">
                      <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35">{g.title}</p>
                      {apps.map((p) => (
                        <a
                          key={p.slug}
                          href={p.route}
                          aria-current={under(p.route) ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-white/5 ${under(p.route) ? "bg-white/5" : ""}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.icon} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-sm font-semibold text-white">
                              {p.tabLabel}
                              {p.status !== "available" && <span className="text-[10px] font-medium text-neon-amber">Soon</span>}
                            </span>
                            <span className="block truncate text-xs text-white/50">{p.oneLine}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <a href="/guides" className={link(under("/guides"))}>
            Guides
          </a>
          <a href="/feedback" className={link(under("/feedback"))}>
            Feedback
          </a>
        </nav>
      </div>
    </header>
  );
}
