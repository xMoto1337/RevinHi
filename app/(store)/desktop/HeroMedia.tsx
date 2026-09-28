"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./desktop.module.css";

const HERO_VIDEO_SRC = "/desktop/hero.mp4";
const HERO_POSTER_SRC = "/desktop/hero-poster.jpg";

/**
 * Hero media slot. The CSS desktop mockup is always rendered underneath; the video fades in on top
 * only once it has actually loaded a frame. If /desktop/hero.mp4 is missing or fails (404, codec,
 * data-saver), the video simply stays invisible and visitors see the animated mockup instead.
 */
export function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // The video may have loaded (or errored) before React hydrated and attached handlers.
    if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setFailed(true);
    else if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true);
  }, []);

  return (
    <div className={styles.frame}>
      <DesktopMockup />
      {!failed && (
        <video
          ref={videoRef}
          className={`${styles.video} ${ready ? styles.videoReady : ""}`}
          src={HERO_VIDEO_SRC}
          poster={HERO_POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="RevinHi Desktop running on a Windows desktop"
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function DesktopMockup() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className={styles.wallpaper} />
      <div className={styles.stars} />
      <div className={styles.lightRay} />
      <div className={styles.wave} />
      <div className={`${styles.wave} ${styles.wave2}`} />
      <div className={styles.rain} />

      {/* Clock + date widget */}
      <div className={styles.widget} style={{ top: "7%", left: "5%", padding: "2% 3%" }}>
        <p className="text-[clamp(18px,6vw,44px)] font-extralight leading-none tracking-tight">9:41</p>
        <p className="mt-1 text-[clamp(7px,1.8vw,12px)] uppercase tracking-[0.2em] text-white/70">Saturday &middot; Oct 4</p>
      </div>

      {/* Weather widget */}
      <div className={styles.widget} style={{ top: "7%", right: "5%", padding: "2% 3%" }}>
        <p className="text-[clamp(7px,1.6vw,11px)] uppercase tracking-widest text-white/60">Rain</p>
        <p className="text-[clamp(14px,4vw,28px)] font-light leading-tight">58&deg;</p>
        <p className="text-[clamp(6px,1.4vw,10px)] text-white/60">H 64&deg; &middot; L 51&deg;</p>
      </div>

      {/* System stats widget */}
      <div
        className={styles.widget}
        style={{ bottom: "14%", left: "5%", width: "30%", padding: "2% 2.5%" }}
      >
        {[
          { label: "CPU", pct: "34%", color: "#00e5ff" },
          { label: "RAM", pct: "58%", color: "#8a5cff" },
          { label: "GPU", pct: "22%", color: "#2ed573" },
        ].map((s) => (
          <div key={s.label} className="mb-[5%] last:mb-0">
            <div className="flex justify-between text-[clamp(6px,1.4vw,10px)] text-white/70">
              <span>{s.label}</span>
              <span>{s.pct}</span>
            </div>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: s.pct, background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Mini radar widget */}
      <div className={styles.widget} style={{ bottom: "14%", right: "5%", padding: "1.5%" }}>
        <MiniRadar size="clamp(52px, 17vw, 120px)" />
      </div>

      {/* Custom text widget */}
      <p
        className="rgb-chase-text absolute left-1/2 top-[44%] -translate-x-1/2 text-[clamp(9px,2.6vw,18px)] font-semibold tracking-[0.3em]"
      >
        STAY FOCUSED
      </p>

      <div className={styles.taskbar}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={styles.taskIcon} />
        ))}
      </div>
    </div>
  );
}

export function MiniRadar({ size }: { size: string }) {
  return (
    <div className={styles.radar} style={{ width: size, height: size }}>
      <div className={styles.cell} style={{ top: "30%", left: "22%", width: "30%", height: "22%", background: "rgba(46,213,115,0.55)" }} />
      <div className={styles.cell} style={{ top: "36%", left: "32%", width: "16%", height: "12%", background: "rgba(255,238,0,0.7)" }} />
      <div className={styles.cell} style={{ top: "39%", left: "37%", width: "7%", height: "6%", background: "rgba(255,59,48,0.85)" }} />
      <div className={styles.cell} style={{ top: "58%", left: "55%", width: "24%", height: "14%", background: "rgba(46,213,115,0.45)" }} />
      <span className={styles.strike} style={{ top: "38%", left: "40%" }} />
      <span className={styles.strike} style={{ top: "62%", left: "64%", animationDelay: "1.1s" }} />
      <div className={styles.radarSweep} />
    </div>
  );
}
