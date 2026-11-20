"use client";

import { usePathname } from "next/navigation";
import { PRODUCTS } from "@/lib/products";

/**
 * Small "ideas or bugs?" line at the top of the footer. On an app page (or one of its guides) it names
 * that app and opens the feedback form with the app already picked.
 */
export function FeedbackPrompt() {
  const pathname = usePathname() ?? "/";
  const app = PRODUCTS.find((p) => pathname === p.route || pathname.startsWith(`${p.route}/`));
  if (pathname.startsWith("/feedback")) return null;

  return (
    <div className="glass-panel-flat mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm sm:flex-row">
      <p className="text-white/65">
        {app ? <>Have an idea for {app.name}, or found a bug?</> : <>Have an idea for RevinHi, or found a bug?</>}
      </p>
      <a
        href={app ? `/feedback?app=${app.slug}` : "/feedback"}
        className="shrink-0 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-4 py-1.5 font-semibold text-neon-cyan transition hover:bg-neon-cyan/25 hover:shadow-[0_0_18px_rgba(0,229,255,0.3)] active:scale-[0.97]"
      >
        Send feedback
      </a>
    </div>
  );
}
