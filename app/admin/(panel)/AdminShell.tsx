"use client";

import { usePathname } from "next/navigation";

const TABS = [
  { label: "Stats", href: "/admin", match: ["/admin", "/admin/stats"] },
  { label: "Feedback", href: "/admin/feedback", match: ["/admin/feedback"] },
  { label: "Wallpapers", href: "/admin/wallpapers", match: ["/admin/wallpapers"] },
];

/** Shared top bar for every admin page: sections, new-feedback count, view site, log out. */
export function AdminShell({ newFeedback, children }: { newFeedback: number; children: React.ReactNode }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <a href="/admin" className="flex items-center gap-2 text-sm font-bold tracking-[0.18em]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/revinhi-brand-64.png" alt="" width={26} height={26} />
            <span className="rgb-chase-text">REVINHI</span>
            <span className="rounded-full border border-white/15 px-2 py-px text-[10px] font-semibold tracking-[0.2em] text-white/55">ADMIN</span>
          </a>

          <nav aria-label="Admin" className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 sm:order-none sm:mx-0 sm:w-auto sm:px-0">
            {TABS.map((t) => {
              const active = t.match.includes(pathname);
              return (
                <a
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition ${
                    active ? "bg-white/10 font-semibold text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {t.label}
                  {t.href === "/admin/feedback" && newFeedback > 0 && (
                    <span className="rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-1.5 text-[11px] font-semibold text-neon-cyan">
                      {newFeedback}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-full px-3 py-1.5 text-white/55 transition hover:text-white">
              View site
            </a>
            <button
              onClick={logout}
              className="rounded-full border border-neon-danger/35 bg-neon-danger/10 px-3.5 py-1.5 font-semibold text-neon-danger transition hover:bg-neon-danger/20 active:scale-[0.97]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
