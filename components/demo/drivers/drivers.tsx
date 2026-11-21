"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { COUNTS, SIGN_LABEL, SOURCES, SOURCE_LABEL, SYSTEM, isFinished, type Candidate, type DeviceRow, type Status } from "./data";
import { FINISH_MS, ScanStage, scaleOf, type StageMode } from "./scan";
import { useDrv } from "./store";
import {
  DeviceIcon,
  IconCheck,
  IconChevron,
  IconRefresh,
  IconShield,
  IconUpdate,
  IconX,
  InstallBanner,
  LockIcon,
  RestartCard,
  StepBadge,
  ago,
  c,
  driverDate,
  humanSize,
  kindName,
  plural,
  reducedMotion,
  rowFill,
  useCountUp,
  vars,
} from "./ui";

// The Drivers tab (views/DriversView.tsx): the Scan button and the scan, then the devices in calm
// groups (Updates available, Missing drivers, Devices with a problem, Up to date) and a details
// drawer for one device.

const GROUPS: { status: Status; title: string }[] = [
  { status: "outdated", title: "Updates available" },
  { status: "missing", title: "Missing drivers" },
  { status: "problem", title: "Devices with a problem" },
  { status: "upToDate", title: "Up to date" },
];

const shownVersion = (o: Candidate) => o.displayVersion ?? o.version;
const downloadSize = (list: DeviceRow[]) => list.reduce((s, r) => s + (r.offer?.size ?? 0), 0);

function Ring({ children, ringRef }: { children: ReactNode; ringRef: RefObject<HTMLDivElement | null> }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  return (
    <div className={c("ring drv-ring done")} ref={ringRef}>
      <svg viewBox="0 0 180 180" width="180" height="180" aria-hidden="true">
        <defs>
          <linearGradient id="rd-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5ff7a0" />
            <stop offset="1" stopColor="#ffd23f" />
          </linearGradient>
        </defs>
        <circle className={c("ring-track")} cx="90" cy="90" r={r} />
        <circle className={c("ring-fill")} cx="90" cy="90" r={r} strokeDasharray={circ} strokeDashoffset={0} transform="rotate(-90 90 90)" />
      </svg>
      <div className={c("ring-center")}>{children}</div>
    </div>
  );
}

/** What the last scan found, above the list. Straight after a scan its ring grows out of where the big button was. */
function Hero({ rows, from, onSettings }: { rows: DeviceRow[]; from: DOMRect | null; onSettings: () => void }) {
  const { scan, now, pro, busy, updateDrivers } = useDrv();
  const ring = useRef<HTMLDivElement>(null);
  const offers = rows.filter((r) => r.offer && !r.ignored);
  const missing = rows.filter((r) => r.status === "missing").length;
  const problems = rows.filter((r) => r.status === "problem").length;
  const updates = useCountUp(offers.length, 700, from ? 0 : undefined);

  useLayoutEffect(() => {
    const el = ring.current;
    if (!from || !el || reducedMotion()) return;
    const to = el.getBoundingClientRect();
    const k = scaleOf(el);
    const sc = from.width / ((to.width * 160) / 180);
    const dx = (from.left + from.width / 2 - (to.left + to.width / 2)) / k;
    const dy = (from.top + from.height / 2 - (to.top + to.height / 2)) / k;
    el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sc})` }, { transform: "none" }], { duration: 700, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
  }, [from]);

  if (!scan.scannedAt) return null;
  return (
    <div className={c("card drv-hero", from && "arrived")}>
      <Ring ringRef={ring}>
        {offers.length > 0 ? (
          <>
            <div className={c("ring-pct")}>{updates}</div>
            <div className={c("ring-sub")}>{offers.length === 1 ? "update" : "updates"}</div>
          </>
        ) : (
          <>
            <span className={c("ring-ok")}>
              <IconCheck size={34} />
            </span>
            <div className={c("ring-sub")}>Up to date</div>
          </>
        )}
      </Ring>
      <div className={c("drv-hero-body")}>
        <div className={c("hero-title")}>{offers.length > 0 ? `${plural(offers.length, "driver update")} found` : "Your drivers are up to date"}</div>
        <div className={c("hero-sub text-muted")}>
          Scanned {ago(scan.scannedAt, now)} · {plural(rows.length, "device")} checked
          {missing > 0 && ` · ${plural(missing, "device")} without a driver`}
          {problems > 0 && ` · ${plural(problems, "device")} with a problem`}
        </div>
        <div className={c("hero-sources")}>
          {SOURCES.map((s) => (
            <span key={s.label} className={c("source-line")} title={s.note}>
              <IconCheck size={12} />
              {`${s.label}: ${s.offers === 0 ? "nothing new" : plural(s.offers, "driver") + " found"}${s.note ? ` · ${s.note}` : ""}`}
            </span>
          ))}
        </div>
        <div className={c("toolbar hero-actions")}>
          {offers.length > 0 && (
            <button className={c("btn btn-primary")} onClick={() => updateDrivers(offers, offers.length > 1 ? "updateAll" : "install")} disabled={busy}>
              {!pro && <LockIcon size={10} />}
              <IconUpdate size={15} /> {busy ? "Installing…" : `Update all (${offers.length})`}
            </button>
          )}
          <button className={c("btn btn-secondary")} onClick={scan.start} disabled={busy}>
            <IconRefresh size={14} /> Scan again
          </button>
          <button className={c("link-btn hero-settings")} onClick={onSettings}>
            Scan settings
          </button>
        </div>
      </div>
    </div>
  );
}

function versionLine(row: DeviceRow): ReactNode {
  if (row.offer) {
    return (
      <>
        <span className={c("v-old")}>{row.driver?.version ?? "No driver"}</span>
        <IconChevron size={11} />
        <span className={c("v-new")}>{shownVersion(row.offer)}</span>
      </>
    );
  }
  return <span className={c("v-old")}>{row.driver?.version ?? "No driver installed"}</span>;
}

function Row({ row, checked, onCheck, onOpen, selected, index }: { row: DeviceRow; checked: boolean; onCheck: (v: boolean) => void; onOpen: () => void; selected: boolean; index: number }) {
  const { pro, install, itemFor, updateDrivers } = useDrv();
  const step = install?.batch !== "components" ? itemFor(row.instanceId) : null;
  const o = row.offer;
  const tickable = !!o && !row.ignored;
  const running = !!install?.running;
  const busy = !!step && running && !isFinished(step.step);
  const landed = !!step && (step.step === "done" || step.step === "needsRestart");
  return (
    <div
      className={c("drv-row", selected && "selected", busy && "installing", landed && "installed")}
      style={vars({ "--i": Math.min(index, 14) })}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      {step && (busy || landed) && <span className={c("row-fill")} style={vars({ "--f": rowFill(step) })} aria-hidden="true" />}
      <label className={c("chk-cell")} onClick={(e) => e.stopPropagation()}>
        {tickable && <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} aria-label={`Select ${row.name}`} />}
      </label>
      <span className={c("drv-icon", `status-${row.status}`)}>
        <DeviceIcon cls={row.class} size={18} />
      </span>
      <div className={c("drv-main")}>
        <div className={c("drv-name")}>{row.name}</div>
        <div className={c("drv-sub")}>
          {row.problem && row.status !== "upToDate"
            ? row.problem.title
            : [row.manufacturer, row.driver?.provider && row.driver.provider !== row.manufacturer ? row.driver.provider : null].filter(Boolean).join(" · ") || row.class}
          {row.ignored && <span className={c("tag")}>Ignored</span>}
        </div>
      </div>
      <div className={c("drv-version")}>
        <div className={c("drv-v")}>{versionLine(row)}</div>
        <div className={c("drv-date text-muted")}>{o ? driverDate(o.date) : row.driver?.date ? driverDate(row.driver.date) : ""}</div>
      </div>
      <div className={c("drv-pills")}>
        {o && (
          <>
            <span className={c("pill src-pill", `src-${o.source}`)} title={row.others.length > 0 ? `Also offered by ${plural(row.others.length, "other source")}` : undefined}>
              {SOURCE_LABEL[o.source]}
              {row.others.length > 0 && <span className={c("text-muted")}> +{row.others.length}</span>}
            </span>
            <span className={c("pill sign-pill")}>
              <IconShield size={11} /> {SIGN_LABEL.whql}
            </span>
          </>
        )}
      </div>
      <div className={c("drv-size num text-muted")}>{o?.size ? humanSize(o.size) : ""}</div>
      <div className={c("drv-act")} onClick={(e) => e.stopPropagation()}>
        {step && (running || !o || step.step !== "done") ? (
          <StepBadge item={step} short />
        ) : (
          o &&
          !row.ignored && (
            <button className={c("btn btn-secondary btn-small")} onClick={() => updateDrivers([row], "install")} disabled={running}>
              {!pro && <LockIcon size={9} />}
              {row.firstDriver ? "Install" : "Update"}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className={c("dfield")}>
      <span className={c("dfield-label")}>{label}</span>
      <span className={c("dfield-value")}>{children}</span>
    </div>
  );
}

function Drawer({ row, onClose, onIgnore }: { row: DeviceRow; onClose: () => void; onIgnore: (v: boolean) => void }) {
  const { pro, install, itemFor, updateDrivers, notify } = useDrv();
  const step = install?.batch !== "components" ? itemFor(row.instanceId) : null;
  const d = row.driver;
  const o = row.offer;
  const matched = d?.matchingId.toUpperCase();
  const offerId = o?.hardwareId.toUpperCase();
  const statusText: Record<Status, string> = {
    outdated: row.ignored ? "Update ignored" : "Update available",
    missing: "No driver",
    problem: "Has a problem",
    upToDate: row.ignored ? "Update ignored" : "Up to date",
  };
  return (
    <aside className={c("card drawer")} aria-label={`Details for ${row.name}`}>
      <div className={c("drawer-head")}>
        <span className={c("drv-icon big", `status-${row.status}`)}>
          <DeviceIcon cls={row.class} size={22} />
        </span>
        <div className={c("drawer-title")}>
          <div className={c("drawer-name")}>{row.name}</div>
          <div className={c("drawer-sub text-muted")}>
            {kindName(row.class) || "Unknown kind"}
            {row.manufacturer && ` · ${row.manufacturer}`}
          </div>
        </div>
        <button className={c("icon-btn")} onClick={onClose} aria-label="Close details">
          <IconX size={14} />
        </button>
      </div>
      <div className={c("drawer-body")}>
        <span className={c("pill status-pill", `status-${row.status}`)}>
          <span className={c("pill-dot")} />
          {statusText[row.status]}
        </span>

        {step && (
          <div className={c("drawer-section")}>
            <div className={c("section-title text-muted")}>{install?.running ? "INSTALLING" : "LAST INSTALL"}</div>
            <StepBadge item={step} />
          </div>
        )}

        {row.problem && (row.status === "problem" || row.status === "missing") && (
          <div className={c("drawer-section")}>
            <div className={c("section-title text-muted")}>WHAT WINDOWS SAYS</div>
            <div className={c("problem-title")}>{row.problem.title}</div>
            <div className={c("problem-advice text-secondary")}>{row.problem.advice}</div>
          </div>
        )}

        {o && (
          <div className={c("drawer-section offer")}>
            <div className={c("section-title text-muted")}>{row.firstDriver ? "DRIVER FOUND" : "NEWER DRIVER"}</div>
            <Field label="Version">{o.displayVersion ? `${o.displayVersion} (Windows shows ${o.version})` : o.version}</Field>
            <Field label="Date">{driverDate(o.date)}</Field>
            <Field label="From">
              <span className={c("pill src-pill", `src-${o.source}`)}>{SOURCE_LABEL[o.source]}</span>
            </Field>
            <Field label="Made by">{o.provider}</Field>
            <Field label="Signature">{SIGN_LABEL.whql}</Field>
            <Field label="Download">{humanSize(o.size)}</Field>
            <Field label="Name">{o.title}</Field>
            <div className={c("toolbar drawer-actions")}>
              {!row.ignored && (
                <button className={c("btn btn-primary btn-small")} onClick={() => updateDrivers([row], "install")} disabled={!!install?.running}>
                  {!pro && <LockIcon size={9} />}
                  <IconUpdate size={13} /> {row.firstDriver ? "Install this driver" : "Update this driver"}
                </button>
              )}
              {o.infoUrl && (
                <button className={c("btn btn-secondary btn-small")} onClick={() => notify(`In the app, this opens ${SOURCE_LABEL[o.source]}'s own page about this driver.`)}>
                  About this driver
                </button>
              )}
            </div>
          </div>
        )}

        <div className={c("drawer-section")}>
          <div className={c("section-title text-muted")}>CURRENT DRIVER</div>
          {d ? (
            <>
              <Field label="Version">{d.version}</Field>
              <Field label="Date">{driverDate(d.date)}</Field>
              <Field label="Made by">{d.provider}</Field>
              <Field label="Signature">{`${SIGN_LABEL[d.signer.kind]} (${d.signer.name})`}</Field>
              <Field label="Package">
                <span className={c("mono")}>{d.inf}</span>
              </Field>
            </>
          ) : (
            <div className={c("text-muted drawer-note")}>No driver is installed for this device.</div>
          )}
        </div>

        {row.others.length > 0 && (
          <div className={c("drawer-section")}>
            <div className={c("section-title text-muted")}>ALSO OFFERED</div>
            {row.others.map((x) => (
              <div key={`${x.source}-${x.version}`} className={c("aside-row")}>
                <div className={c("aside-title")}>
                  <span className={c("pill src-pill", `src-${x.source}`)}>{SOURCE_LABEL[x.source]}</span> {shownVersion(x)}
                  <span className={c("text-muted")}> · {driverDate(x.date)}</span>
                  <span className={c("text-muted")}> · {humanSize(x.size)}</span>
                </div>
                <div className={c("aside-why text-muted")}>Also passes every check. The newest one is used.</div>
              </div>
            ))}
          </div>
        )}

        {row.setAside.length > 0 && (
          <div className={c("drawer-section")}>
            <div className={c("section-title text-muted")}>SET ASIDE</div>
            {row.setAside.map((s, i) => (
              <div key={i} className={c("aside-row")}>
                <div className={c("aside-title")}>
                  {s.title} <span className={c("text-muted")}>· {SOURCE_LABEL[s.source]}</span>
                </div>
                <div className={c("aside-why text-muted")}>{s.why}</div>
              </div>
            ))}
          </div>
        )}

        <div className={c("drawer-section")}>
          <div className={c("section-title text-muted")}>DEVICE IDS</div>
          <div className={c("id-list mono")}>
            {[...row.hardwareIds, ...row.compatibleIds].map((id) => (
              <div key={id} className={c("id-row", id.toUpperCase() === matched && "matched", id.toUpperCase() === offerId && "offered")}>
                {id}
                {id.toUpperCase() === matched && <span className={c("tag")}>current driver</span>}
                {id.toUpperCase() === offerId && <span className={c("tag tag-live")}>update</span>}
              </div>
            ))}
          </div>
        </div>

        {o && (
          <div className={c("drawer-section")}>
            <button className={c("btn btn-secondary btn-small")} onClick={() => onIgnore(!row.ignored)}>
              {row.ignored ? "Show updates for this device again" : "Ignore updates for this device"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Group({ title, status, rows, folded, onFold, children, extra, index }: { index: number; title: string; status: Status; rows: DeviceRow[]; folded: boolean; onFold: () => void; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className={c("drv-group", `group-${status}`)} style={vars({ "--g": index })}>
      <div className={c("dg-head")}>
        <button className={c("dg-toggle", !folded && "open")} onClick={onFold} aria-expanded={!folded}>
          <IconChevron size={13} />
          <span className={c("dg-title")}>{title}</span>
          <span className={c("dg-count")}>{rows.length}</span>
        </button>
        <span className={c("dg-rule")} />
        {extra}
      </div>
      {!folded && <div className={c("card drv-list")}>{children}</div>}
    </section>
  );
}

export function DriversView({ visible, onSettings, focus }: { visible: boolean; onSettings: () => void; focus: { id: string; n: number } | null }) {
  const { rows, scan, now, busy, ignored, setIgnored, updateDrivers, banner, closeBanner, restartNeeded, dismissRestart, notify } = useDrv();
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [folded, setFolded] = useState<Set<Status>>(new Set(["upToDate"]));

  // A tool (crash finder, problem devices) asked to show this device.
  const [focusSeen, setFocusSeen] = useState(focus);
  if (focus !== focusSeen) {
    setFocusSeen(focus);
    if (focus) setOpen(focus.id);
  }

  const groups = useMemo(() => {
    const g: Record<Status, DeviceRow[]> = { outdated: [], missing: [], problem: [], upToDate: [] };
    for (const r of rows) g[r.status].push(r);
    return g;
  }, [rows]);

  // A new scan ticks every update; rows that just became offered are ticked too.
  const offeredKey = rows
    .filter((x) => x.offer && !x.ignored)
    .map((x) => x.instanceId)
    .join("|");
  const [tickedFor, setTickedFor] = useState<string | null>(null);
  const scanKey = `${scan.scannedAt}:${offeredKey}`;
  if (scanKey !== tickedFor) {
    const before = new Set((tickedFor?.split(":")[1] ?? "").split("|"));
    const sameScan = tickedFor?.split(":")[0] === String(scan.scannedAt);
    setTickedFor(scanKey);
    const offered = offeredKey ? offeredKey.split("|") : [];
    setTicked((cur) => (sameScan ? new Set(offered.filter((x) => cur.has(x) || !before.has(x))) : new Set(offered)));
  }

  const openRow = rows.find((r) => r.instanceId === open) ?? null;
  const tickedRows = rows.filter((r) => ticked.has(r.instanceId) && r.offer && !r.ignored);

  const setIgnoredFor = (row: DeviceRow, v: boolean) => {
    const id = row.instanceId.toUpperCase();
    const list = new Set(ignored.map((x) => x.toUpperCase()));
    if (v) list.add(id);
    else list.delete(id);
    setIgnored([...list]);
  };

  const tickAll = (list: DeviceRow[], v: boolean) =>
    setTicked((cur) => {
      const next = new Set(cur);
      for (const r of list) {
        if (!r.offer || r.ignored) continue;
        if (v) next.add(r.instanceId);
        else next.delete(r.instanceId);
      }
      return next;
    });
  const tickables = (list: DeviceRow[]) => list.filter((r) => r.offer && !r.ignored);

  // A scan that ends while this tab shows gets its finish, then the list; the ring grows out of the button.
  const [finishing, setFinishing] = useState(false);
  const [wasRunning, setWasRunning] = useState(false);
  const disc = useRef<DOMRect | null>(null);
  const [from, setFrom] = useState<DOMRect | null>(null);
  if (scan.running && !wasRunning) {
    setWasRunning(true);
    setFrom(null);
  }
  if (!scan.running && wasRunning) {
    setWasRunning(false);
    if (visible && !reducedMotion()) setFinishing(true);
  }
  const endFinish = useCallback(() => {
    setFrom(disc.current);
    disc.current = null;
    setFinishing(false);
  }, []);
  const updates = rows.filter((r) => r.offer && !r.ignored).length;
  useEffect(() => {
    if (!finishing) return;
    const t = window.setTimeout(endFinish, updates > 0 ? FINISH_MS.found : FINISH_MS.clean);
    return () => window.clearTimeout(t);
  }, [finishing, endFinish, updates]);
  const onDisc = useCallback((r: DOMRect) => {
    disc.current = r;
  }, []);

  const mode: StageMode | null = scan.running ? "scanning" : finishing ? "finishing" : !scan.scannedAt ? "idle" : null;
  const restart = <RestartCard needed={restartNeeded} busy={busy} onLater={dismissRestart} onRestart={() => notify("In the app, this restarts the PC so the new driver is used.")} />;

  if (mode) {
    return (
      <div className={c("drivers-page")}>
        <div className={c("pane scroll drivers-main stage-pane")}>
          {restart}
          <ScanStage mode={mode} progress={scan.progress} rows={rows} scannedAt={scan.scannedAt} now={now} onStart={scan.start} onSkip={endFinish} onDisc={onDisc} />
        </div>
      </div>
    );
  }

  return (
    <div className={c("drivers-page", openRow && "with-drawer")}>
      <div className={c("pane scroll drivers-main results", from && "arrived")}>
        <div className={c("page-head")}>
          <div>
            <div className={c("page-title")}>Drivers</div>
            <div className={c("page-sub")}>{SYSTEM}</div>
          </div>
        </div>

        <Hero rows={rows} from={from} onSettings={onSettings} />

        {restart}
        <InstallBanner progress={banner} batches={["drivers", "rollback"]} onClose={closeBanner} />

        {GROUPS.map((g, gi) => {
          const list = groups[g.status];
          if (list.length === 0) return null;
          const tk = tickables(list);
          const allTicked = tk.length > 0 && tk.every((r) => ticked.has(r.instanceId));
          return (
            <Group
              key={g.status}
              index={gi}
              title={g.title}
              status={g.status}
              rows={list}
              folded={folded.has(g.status)}
              onFold={() =>
                setFolded((f) => {
                  const next = new Set(f);
                  if (next.has(g.status)) next.delete(g.status);
                  else next.add(g.status);
                  return next;
                })
              }
              extra={
                tk.length > 0 && (
                  <div className={c("dg-actions")}>
                    <label className={c("toggle-check")}>
                      <input type="checkbox" checked={allTicked} onChange={(e) => tickAll(tk, e.target.checked)} />
                      Select all
                    </label>
                  </div>
                )
              }
            >
              {list.map((r, i) => (
                <Row key={r.instanceId} index={i} row={r} selected={r.instanceId === open} checked={ticked.has(r.instanceId)} onCheck={(v) => tickAll([r], v)} onOpen={() => setOpen(r.instanceId)} />
              ))}
            </Group>
          );
        })}

        <div className={c("drv-foot text-muted")}>
          {`${plural(COUNTS.systemParts, "built-in Windows part")} checked and not listed. `}
          {`${plural(COUNTS.notPluggedIn, "device")} Windows remembers aren't plugged in right now.`}
        </div>

        {tickedRows.length > 0 && (
          <div className={c("drv-bottom card")}>
            <span>
              {plural(tickedRows.length, "update")} selected · {humanSize(downloadSize(tickedRows))} to download
            </span>
            <span style={{ flex: 1 }} />
            <button className={c("btn btn-primary")} onClick={() => updateDrivers(tickedRows, tickedRows.length > 1 ? "updateAll" : "install")} disabled={busy}>
              <IconUpdate size={15} /> {busy ? "Installing…" : "Update selected"}
            </button>
          </div>
        )}
      </div>
      {openRow && <Drawer row={openRow} onClose={() => setOpen(null)} onIgnore={(v) => setIgnoredFor(openRow, v)} />}
    </div>
  );
}
