"use client";

import { usePathname } from "next/navigation";
import { PRODUCTS } from "@/lib/products";

const TABS = [{ label: "Home", href: "/" }, ...PRODUCTS.map((p) => ({ label: p.tabLabel, href: p.route }))];

/*
 * Shared storefront tab bar. Tabs are plain <a> (full page loads). gumroad.js also watches for links
 * added later (MutationObserver), so next/link would work too - full loads just keep it simplest.
 *
 * No backdrop-blur on this sticky bar - same reasoning as the original home nav (scroll smoothness).
 */
export function SiteNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 pb-2.5 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-3.5">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-[0.18em]">
          <span className="rgb-chase-text">REVINHI</span>
          <span className="hidden text-[11px] font-medium tracking-[0.2em] text-white/40 sm:inline">APPS</span>
        </a>

        <nav
          aria-label="Apps"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <a
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
                  active
                    ? "border-white/25 bg-white/10 font-semibold text-white"
                    : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="rgb-chase-border absolute inset-x-4 -bottom-px h-0 border-b-2" aria-hidden="true" />
                )}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
