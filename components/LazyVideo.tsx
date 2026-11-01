"use client";

import { useEffect, useRef } from "react";

/**
 * Muted looping video that only starts downloading when it scrolls near the screen, so below-the-fold
 * clips don't compete with the page's first paint. The poster (if any) shows until then.
 */
export function LazyVideo({ src, poster, className, label }: { src: string; poster?: string; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const start = () => {
      if (v.getAttribute("src")) return;
      v.muted = true;
      v.src = src;
      v.play().catch(() => {});
    };
    if (!("IntersectionObserver" in window)) {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  return <video ref={ref} className={className} poster={poster} muted loop playsInline preload="none" aria-label={label} />;
}
