"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party page-view + click beacon (see app/api/track). No cookies, no third parties.
 * Page views fire on every route change; clicks on download / Gumroad / outbound links fire events.
 */
function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch {
    /* fall through */
  }
  void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const q = new URLSearchParams(window.location.search);
    send({
      type: "pageview",
      path: pathname,
      referrer: document.referrer || undefined,
      utm_source: q.get("utm_source") ?? undefined,
      utm_medium: q.get("utm_medium") ?? undefined,
      utm_campaign: q.get("utm_campaign") ?? undefined,
    });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || window.location.pathname.startsWith("/admin")) return;
      const href = a.getAttribute("href") ?? "";
      let name: string | null = null;
      if (href.startsWith("/api/download")) name = "download_click";
      else if (/gumroad\.com\/l\//.test(href)) name = "buy_click";
      else if (/^https?:\/\//.test(href) && !href.includes(window.location.host)) name = "outbound";
      if (name) send({ type: "event", name, path: window.location.pathname, label: href });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
