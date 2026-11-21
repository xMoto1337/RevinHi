"use client";

import { useEffect, useMemo, useState } from "react";
import { BOOST_APPS, TWEAKS, type BoostApp, type Tweak } from "./data";
import { CheckGlyph, CloseGlyph, Dialog, GlowButton, Toggle, c } from "./ui";

/** Eased count-up, like the app's CountUpAnimator (700 ms, cubic ease-out). */
function useCountUp(target: number, run: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);
  return value;
}

export type BoostState = {
  active: boolean;
  toggling: boolean;
  /** Knob position while a change is in flight (WPF flips the switch right away). */
  pending: boolean | null;
  status: string | null;
  stats: { ram: number; cpu: number; run: number } | null;
};

export function BoostTweaksView({
  advanced,
  onAdvanced,
  boost,
  onBoost,
  ignored,
  onUnignore,
  isApplied,
  busy,
  statusFor,
  onTweak,
  restoreStatus,
  onRestoreAll,
}: {
  advanced: boolean;
  onAdvanced: (v: boolean) => void;
  boost: BoostState;
  onBoost: (v: boolean) => void;
  ignored: BoostApp[];
  onUnignore: (id: string) => void;
  isApplied: (t: Tweak) => boolean;
  busy: Record<string, boolean | undefined>;
  statusFor: Record<string, string | undefined>;
  onTweak: (t: Tweak, next: boolean) => void;
  restoreStatus: string | null;
  onRestoreAll: () => void;
}) {
  const ram = useCountUp(boost.stats?.ram ?? 0, boost.stats?.run ?? 0);
  const cpu = useCountUp(boost.stats?.cpu ?? 0, boost.stats?.run ?? 0);
  const visible = TWEAKS.filter((t) => advanced || t.tier === "Safe");

  return (
    <div className={c("view")}>
      <div className={c("topGrid")}>
        <div className={c("card")}>
          <div className={c("toggleHead")}>
            <Toggle size="boost" label="Performance Boost" on={boost.pending ?? boost.active} disabled={boost.toggling} onChange={onBoost} />
            <span className={c("boostTitle")}>PERFORMANCE BOOST</span>
          </div>
          <div className={c("body cardBody")}>
            Suspends non-essential background apps (Discord, Spotify, cloud sync, RGB utilities, etc.) while gaming. Nothing is closed - just paused.
          </div>
          {boost.status && <div className={c("boostStatus")}>{boost.status}</div>}
        </div>

        <div className={c("card")}>
          <div className={c("toggleHead")}>
            <Toggle size="mode" label="Advanced mode" on={advanced} onChange={onAdvanced} />
            <span className={c("header")} style={{ fontSize: 15 }}>
              Mode: <b style={{ color: advanced ? "#ffa800" : "#2ed573" }}>{advanced ? "ADVANCED" : "SAFE"}</b>
            </span>
          </div>
          <div className={c("body cardBody")}>
            Advanced mode reveals deeper registry/network tweaks. Turning one on still requires a real Windows System Restore checkpoint - if that fails, you&apos;ll see exactly why right on that tweak.
          </div>
        </div>
      </div>

      {boost.stats && (
        <div className={c("card stats")}>
          <div>
            <div className={c("statValue")}>{ram.toFixed(0)} MB</div>
            <div className={c("meta dim7")} style={{ marginTop: 4 }}>
              RAM held by suspended apps
            </div>
          </div>
          <div>
            <div className={c("statValue")} style={{ color: "#2ed573" }}>
              {cpu.toFixed(1)}%
            </div>
            <div className={c("meta dim7")} style={{ marginTop: 4 }}>
              CPU freed for your game
            </div>
          </div>
        </div>
      )}

      {ignored.length > 0 && (
        <div className={c("ignored")}>
          <div className={c("sectionLabel")} style={{ display: "block", marginBottom: 10 }}>
            IGNORED APPS
          </div>
          <div>
            {ignored.map((app) => (
              <span key={app.id} className={c("chip")}>
                <span className={c("body")}>{app.name}</span>
                <button type="button" className={c("chipX")} title="Allow Boost to suggest this app again" aria-label={`Allow Boost to suggest ${app.name} again`} onClick={() => onUnignore(app.id)}>
                  <CloseGlyph size={8} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={c("sectionLabel")}>TWEAKS</div>

      <div className={c("scroll")}>
        <div className={c("wrap")}>
          {visible.map((t) => {
            const on = isApplied(t);
            return (
              <div
                key={t.id}
                className={c("card tweakCard")}
                style={{ ["--glow" as string]: t.tier === "Advanced" ? "#ffa800" : "#ffffff" }}
              >
                <div className={c("tweakText")}>
                  <div className={c("tweakTop")}>
                    <span className={c("header")}>{t.name}</span>
                    <span className={c("tierPill", t.tier === "Advanced" && "tierAdvanced")}>{t.tier}</span>
                  </div>
                  <div className={c("body tweakDesc")}>{t.description}</div>
                  <div className={c("meta dim7")}>{t.category}</div>
                  {statusFor[t.id] && <div className={c("statusError")}>{statusFor[t.id]}</div>}
                </div>
                <Toggle size="compact" label={t.name} on={busy[t.id] === undefined ? on : !!busy[t.id]} disabled={busy[t.id] !== undefined} onChange={(next) => onTweak(t, next)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className={c("bottomRow")}>
        <GlowButton onClick={onRestoreAll}>Restore All Defaults</GlowButton>
        {restoreStatus && <span className={c("body")}>{restoreStatus}</span>}
      </div>
    </div>
  );
}

/** BoostPreviewWindow: review which background apps get paused before Boost turns on. */
export function BoostPreviewDialog({
  ignoredIds,
  onIgnore,
  onCancel,
  onConfirm,
}: {
  ignoredIds: string[];
  onIgnore: (app: BoostApp) => void;
  onCancel: () => void;
  onConfirm: (apps: BoostApp[]) => void;
}) {
  // Only the well-known apps start checked; unfamiliar background apps need an explicit opt-in.
  const [list, setList] = useState(() => BOOST_APPS.filter((a) => !ignoredIds.includes(a.id)));
  const [picked, setPicked] = useState<Set<string>>(() => new Set(BOOST_APPS.filter((a) => a.known).map((a) => a.id)));

  const chosen = useMemo(() => list.filter((a) => picked.has(a.id)), [list, picked]);
  const totalMb = chosen.reduce((sum, a) => sum + a.mb, 0);

  const flip = (id: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog width={480} onClose={onCancel}>
      <div style={{ height: 542, display: "flex", flexDirection: "column" }}>
        <div style={{ margin: "12px 24px 0", flex: 1, minHeight: 0 }}>
          <div className={c("header")} style={{ fontSize: 16, marginBottom: 4 }}>
            Performance Boost will suspend these apps
          </div>
          <div className={c("body")} style={{ marginBottom: 4 }}>
            They aren&apos;t closed - just paused - and resume exactly where they left off when you turn Boost off. Well-known apps are pre-checked; unfamiliar background processes are found too but left unchecked - review and opt in to free even more RAM.
          </div>
          <div className={c("meta")} style={{ marginBottom: 10 }}>
            {chosen.length} of {list.length} selected - ~{totalMb} MB will be freed
          </div>
          <div style={{ display: "flex", marginBottom: 10 }}>
            <GlowButton onClick={() => setPicked(new Set(list.map((a) => a.id)))}>Select All</GlowButton>
            <GlowButton onClick={() => setPicked(new Set())}>Select None</GlowButton>
          </div>
          <div className={c("scroll")} style={{ height: 280, flex: "none", paddingRight: 4 }}>
            {list.map((app) => {
              const on = picked.has(app.id);
              return (
                <div key={app.id} className={c("candidate")}>
                  <button type="button" role="checkbox" aria-checked={on} aria-label={app.name} className={c("check", on && "checkOn")} onClick={() => flip(app.id)}>
                    {on && <CheckGlyph />}
                  </button>
                  <div className={c("grow")} onClick={() => flip(app.id)} style={{ cursor: "default" }}>
                    <div className={c("body candidateName")}>{app.name}</div>
                    <div className={c("meta dim6")} style={{ fontSize: 10 }}>
                      {app.known ? "Known app" : "Background app - unfamiliar, review before including"}
                    </div>
                  </div>
                  <span className={c("meta candidateMb")}>{app.mb} MB</span>
                  <GlowButton
                    small
                    title="Never suggest this app for Boost again"
                    onClick={() => {
                      onIgnore(app);
                      setList((l) => l.filter((a) => a.id !== app.id));
                    }}
                  >
                    Ignore
                  </GlowButton>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", margin: "14px 16px 20px 24px" }}>
          <GlowButton onClick={onCancel}>Cancel</GlowButton>
          <GlowButton onClick={() => onConfirm(chosen)}>Boost Now</GlowButton>
        </div>
      </div>
    </Dialog>
  );
}
