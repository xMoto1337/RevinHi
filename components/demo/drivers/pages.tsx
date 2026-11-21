"use client";

import { useMemo, useState, type ReactNode } from "react";
import { GROUP_LABEL, OUTCOME_LABEL, STATE_LABEL, canRollBack, isFinished, type Component, type ComponentGroup, type HistoryEntry } from "./data";
import { useDrv, type Feature } from "./store";
import {
  DeviceIcon,
  IconBox,
  IconChevron,
  IconDownload,
  IconGamepad,
  IconHistory,
  IconInfo,
  IconRefresh,
  IconShield,
  InstallBanner,
  LockIcon,
  Modal,
  RestartCard,
  Section,
  SettingRow,
  StepBadge,
  Toggle,
  ago,
  c,
  dateTime,
  plural,
  rowFill,
  vars,
} from "./ui";

export const PRICE = "$14.99";

// ------------------------------------------------------------------ Free vs Pro (license/features.ts)

const FEATURES: Record<Feature, { title: string; pro: string; free: string; icon: ReactNode; highlight: boolean }> = {
  install: {
    title: "Install driver updates",
    pro: "Install the updates a scan finds, with a restore point and a backup of the old driver first",
    free: "Scan and see every update",
    icon: <IconDownload size={22} />,
    highlight: true,
  },
  updateAll: { title: "Update all at once", pro: "Install every update in one go, one after another", free: "Not included", icon: <IconRefresh size={22} />, highlight: true },
  components: {
    title: "Install game components",
    pro: "Install or repair DirectX, Visual C++, .NET and the other runtimes games need",
    free: "See what's installed and what's missing",
    icon: <IconGamepad size={22} />,
    highlight: true,
  },
  offline: {
    title: "Offline driver packs",
    pro: "Build and install driver packs for a PC without internet (the network rescue pack is free)",
    free: "Not included",
    icon: <IconBox size={22} />,
    highlight: true,
  },
  restore: { title: "Restore from a backup", pro: "Put back drivers from a backup you made", free: "Making backups is free, and so is rolling back any update", icon: <IconHistory size={22} />, highlight: false },
  cleanup: { title: "Remove old drivers", pro: "Remove old driver packages and unplugged devices Windows still remembers", free: "See what could be removed", icon: <IconShield size={22} />, highlight: false },
};

const FREE_INCLUDED = [
  "Scan drivers and game components",
  "Details for every device",
  "Back up drivers",
  "Roll back any change",
  "Crash driver finder and one-click fixes",
  "Network rescue pack and hardware info",
  "Scheduled scan",
];

function ActivateForm({ onActivated }: { onActivated: () => void }) {
  const { setPro, notify } = useDrv();
  const [key, setKey] = useState("");
  return (
    <div className={c("license-form")}>
      <input className={c("text-input license-input")} placeholder="XXXX-XXXX-XXXX-XXXX" value={key} spellCheck={false} onChange={(e) => setKey(e.target.value.toUpperCase())} />
      <button
        className={c("btn btn-primary")}
        onClick={() => {
          setPro(true);
          onActivated();
          notify("Pro is turned on for this preview. In the app, the key from your email does this.");
        }}
      >
        Activate
      </button>
    </div>
  );
}

/** The upgrade window, only while it's open (it only opens on a click; no reminders). */
export function UpgradeHost() {
  const { paywall } = useDrv();
  return paywall ? <UpgradeModal feature={paywall.feature} /> : null;
}

function UpgradeModal({ feature }: { feature: Feature | null }) {
  const { closePaywall, notify } = useDrv();
  const [enterKey, setEnterKey] = useState(false);
  const focus = feature ? FEATURES[feature] : null;
  const list = (Object.keys(FEATURES) as Feature[]).filter((f) => FEATURES[f].highlight && f !== feature);
  const shown = (feature ? [feature, ...list] : list).slice(0, 4);
  return (
    <div className={c("modal-backdrop")} onPointerDown={closePaywall}>
      <div className={c("card modal-card upgrade-card")} onPointerDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Upgrade to Pro">
        <div className={c("upgrade-head")}>
          <span className={c("pro-chip pro-chip-static pro-chip-lg")}>
            <LockIcon size={10} />
            PRO
          </span>
          <div className={c("license-title")}>{focus ? `${focus.title} is a Pro feature` : "You're on RevinHi Drivers Free"}</div>
          <div className={c("text-secondary license-copy")}>
            {focus ? `${focus.pro}. Free version: ${focus.free.toLowerCase()}.` : "Everything below is one purchase away. The free version keeps working either way."}
          </div>
        </div>
        <div className={c("upgrade-grid")}>
          {shown.map((f) => (
            <div key={f} className={c("upgrade-item", f === feature && "on")}>
              <div className={c("fa fa-app")}>
                <span className={c("glyph")}>{FEATURES[f].icon}</span>
              </div>
              <div className={c("upgrade-text")}>
                <div className={c("upgrade-title")}>{FEATURES[f].title}</div>
                <div className={c("upgrade-sub")}>{FEATURES[f].pro}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={c("upgrade-price text-muted")}>One-time {PRICE} · free updates forever · scans and device details stay free</div>
        {enterKey && <ActivateForm onActivated={closePaywall} />}
        <div className={c("toolbar modal-actions")}>
          <button className={c("btn btn-buy btn-buy-big")} onClick={() => notify(`In the app, this opens the page to buy Pro (${PRICE}, one time).`)}>
            Buy Pro — {PRICE}
          </button>
          {!enterKey && (
            <button className={c("btn btn-secondary")} onClick={() => setEnterKey(true)}>
              Enter key
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary btn-small")} onClick={closePaywall}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export function LicenseView() {
  const { pro, setPro, openPaywall, notify } = useDrv();
  const [confirmRemove, setConfirmRemove] = useState(false);
  return (
    <div className={c("pane scroll")}>
      <div className={c("card license-card")}>
        <div className={c("license-head")}>
          <div>
            <div className={c("section-title text-muted")}>LICENSE</div>
            <div className={c("license-title")}>RevinHi Drivers {pro ? "Pro" : "Free"}</div>
          </div>
          <span className={c("pill")}>
            <span className={c("pill-dot", pro ? "dot-success" : "dot-warning")} />
            {pro ? "Pro · activated" : "Free version"}
          </span>
        </div>
        {pro ? (
          <>
            <div className={c("license-row")}>
              <span className={c("text-muted")}>Key</span>
              <span className={c("license-mono")}>••••-••••-••••-7Q2K</span>
            </div>
            <p className={c("text-secondary license-copy")}>Thanks for supporting RevinHi. Your key covers every future update of RevinHi Drivers.</p>
            {confirmRemove ? (
              <div className={c("toolbar")}>
                <span className={c("text-muted")} style={{ fontSize: 12 }}>
                  Remove the key from this PC?
                </span>
                <button
                  className={c("btn btn-danger btn-small")}
                  onClick={() => {
                    setPro(false);
                    setConfirmRemove(false);
                  }}
                >
                  Remove
                </button>
                <button className={c("btn btn-secondary btn-small")} onClick={() => setConfirmRemove(false)}>
                  Keep
                </button>
              </div>
            ) : (
              <button className={c("btn btn-secondary btn-small")} style={{ alignSelf: "flex-start" }} onClick={() => setConfirmRemove(true)}>
                Remove license from this PC
              </button>
            )}
          </>
        ) : (
          <>
            <p className={c("text-secondary license-copy")}>Pro is a one-time {PRICE} with free updates forever. Your key arrives by email right after checkout.</p>
            <ActivateForm onActivated={() => {}} />
            <div className={c("toolbar")} style={{ marginTop: 4 }}>
              <button className={c("btn btn-buy")} onClick={() => notify(`In the app, this opens the page to buy Pro (${PRICE}, one time).`)}>
                Buy Pro — {PRICE}
              </button>
              <button className={c("btn btn-secondary btn-small")} onClick={() => openPaywall(null)}>
                What&apos;s in Pro?
              </button>
            </div>
          </>
        )}
      </div>
      <div className={c("card license-card")}>
        <div className={c("section-title text-muted")}>FREE VS PRO</div>
        <div className={c("tier-table")}>
          <div className={c("tier-row tier-headrow")}>
            <span />
            <span>Free</span>
            <span>Pro</span>
          </div>
          {FREE_INCLUDED.map((t) => (
            <div key={t} className={c("tier-row")}>
              <span>{t}</span>
              <span>Included</span>
              <span>Included</span>
            </div>
          ))}
          {(Object.keys(FEATURES) as Feature[]).map((f) => (
            <div key={f} className={c("tier-row")}>
              <span>{FEATURES[f].title}</span>
              <span className={c("text-muted")}>{FEATURES[f].free}</span>
              <span className={c("text-success")}>Included</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Game components (views/ComponentsView.tsx)

const ORDER: ComponentGroup[] = ["directX", "visualCpp", "dotNet", "other"];
const ACTION: Record<Component["state"], string | null> = { installed: null, missing: "Install", partial: "Repair", outdated: "Update" };

function CompCard({ comp }: { comp: Component }) {
  const { pro, install, itemFor, installParts } = useDrv();
  const step = install?.batch === "components" ? itemFor(comp.id) : null;
  const action = comp.canInstall ? ACTION[comp.state] : null;
  const running = !!install?.running;
  const busy = !!step && running && !isFinished(step.step);
  const landed = !!step && (step.step === "done" || step.step === "needsRestart");
  return (
    <div className={c("card comp-card", `state-${comp.state}`, busy && "installing", landed && "installed")}>
      {step && (busy || landed) && <span className={c("row-fill")} style={vars({ "--f": rowFill(step) })} aria-hidden="true" />}
      <div className={c("comp-head")}>
        <span className={c("comp-name")}>{comp.name}</span>
        {comp.arch && <span className={c("tag")}>{comp.arch === "x64" ? "64-bit" : "32-bit"}</span>}
        <span style={{ flex: 1 }} />
        <span className={c("pill comp-state", `state-${comp.state}`)}>
          <span className={c("pill-dot")} />
          {STATE_LABEL[comp.state]}
        </span>
      </div>
      <div className={c("comp-version")}>
        {comp.version ? `Version ${comp.version}` : comp.state === "missing" ? "Not on this PC" : comp.state === "partial" ? "Partly installed" : "Version unknown"}
        {comp.recommended && <span className={c("text-muted")}> · {comp.recommended} recommended</span>}
      </div>
      <div className={c("comp-note text-muted")}>{comp.note}</div>
      {comp.missingFiles.length > 0 && (
        <details className={c("comp-files")}>
          <summary>{plural(comp.missingFiles.length, "file")} not found</summary>
          <div className={c("mono")}>{comp.missingFiles.join(", ")}</div>
        </details>
      )}
      {step && (running || !action || step.step !== "done") ? (
        <div className={c("comp-actions")}>
          <StepBadge item={step} />
        </div>
      ) : (
        action && (
          <div className={c("comp-actions")}>
            <button className={c("btn btn-secondary btn-small")} onClick={() => installParts(comp)} disabled={running}>
              {!pro && <LockIcon size={9} />}
              {action}
            </button>
          </div>
        )
      )}
    </div>
  );
}

export function ComponentsView({ onDrivers }: { onDrivers: () => void }) {
  const { scan, now, components, busy, banner, closeBanner, restartNeeded, dismissRestart, notify } = useDrv();
  const groups = useMemo(() => ORDER.map((g) => ({ g, list: components.filter((x) => x.group === g) })).filter((x) => x.list.length > 0), [components]);
  const count = (st: Component["state"]) => components.filter((x) => x.state === st).length;
  const result = !!scan.scannedAt;
  return (
    <div className={c("pane scroll comps-page")}>
      <div className={c("page-head")}>
        <div>
          <div className={c("page-title")}>Game components</div>
          <div className={c("page-sub")}>The runtimes games need besides drivers: DirectX, Visual C++, .NET and more.</div>
        </div>
        {result && (
          <button className={c("btn btn-secondary")} onClick={scan.start} disabled={scan.running || busy}>
            <IconRefresh size={14} /> {scan.running ? `Scanning… ${Math.floor((scan.progress?.fraction ?? 0) * 100)}%` : "Scan again"}
          </button>
        )}
      </div>
      <RestartCard needed={restartNeeded} busy={busy} onLater={dismissRestart} onRestart={() => notify("In the app, this restarts the PC so the new driver is used.")} />
      <InstallBanner progress={banner} batches={["components"]} onClose={closeBanner} />
      {!result ? (
        <div className={c("card empty-card comps-empty")}>
          <span className={c("empty-icon")}>
            <IconBox size={30} />
          </span>
          <div className={c("empty-title")}>{scan.running ? "Scanning…" : "Scan to check your game components"}</div>
          <div className={c("text-muted")}>
            {scan.running
              ? "The scan checks drivers and game components together. The results show here and on the Drivers tab."
              : "One scan checks drivers and game components together. Nothing is installed or changed."}
          </div>
          {scan.running ? (
            <button className={c("btn btn-secondary")} onClick={onDrivers}>
              See the scan
            </button>
          ) : (
            <button
              className={c("btn btn-primary")}
              onClick={() => {
                scan.start();
                onDrivers();
              }}
            >
              Scan
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={c("comps-summary")}>
            <span>
              <b>{count("installed")}</b> installed
            </span>
            {count("outdated") > 0 && (
              <span>
                <b>{count("outdated")}</b> with a newer release
              </span>
            )}
            {count("partial") > 0 && (
              <span>
                <b>{count("partial")}</b> with files missing
              </span>
            )}
            {count("missing") > 0 && (
              <span>
                <b>{count("missing")}</b> not installed
              </span>
            )}
            <span className={c("text-muted")}>Checked {ago(scan.scannedAt!, now)}</span>
          </div>
          {groups.map(({ g, list }) => (
            <section key={g} className={c("comp-group")}>
              <div className={c("dg-head")}>
                <span className={c("dg-title")}>{GROUP_LABEL[g]}</span>
                <span className={c("dg-count")}>{list.length}</span>
                <span className={c("dg-rule")} />
              </div>
              <div className={c("comp-grid")}>
                {list.map((x) => (
                  <CompCard key={x.id} comp={x} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ History (views/HistoryView.tsx)

const changed = (e: HistoryEntry) => e.outcome === "installed" || e.outcome === "needsRestart";

function HistRow({ e, onRollBack }: { e: HistoryEntry; onRollBack: () => void }) {
  const { install, itemFor, notify } = useDrv();
  const step = install?.batch === "rollback" ? itemFor(`rollback-${e.id}`) : null;
  const rolledBack = e.rolledBackBy != null;
  return (
    <div className={c("hist-row", `outcome-${e.outcome}`)}>
      <span className={c("drv-icon", e.kind === "rollback" ? "status-missing" : changed(e) ? "status-outdated" : "")}>
        {e.kind === "component" ? <IconBox size={17} /> : e.kind === "rollback" ? <IconHistory size={17} /> : <DeviceIcon cls="" size={17} />}
      </span>
      <div className={c("hist-main")}>
        <div className={c("hist-name")}>
          {e.kind === "rollback" && <span className={c("text-muted")}>Rolled back: </span>}
          {e.name}
        </div>
        <div className={c("hist-v")}>
          {e.oldVersion || e.newVersion ? (
            <>
              <span className={c("v-old")}>{e.oldVersion ?? (e.kind === "component" ? "Not installed" : "No driver")}</span>
              <IconChevron size={11} />
              <span className={c("v-new")}>{e.newVersion ?? "Latest"}</span>
            </>
          ) : null}
          <span className={c("hist-meta text-muted")}>
            {dateTime(e.at)} · {e.source}
          </span>
        </div>
        <div className={c("hist-safety text-muted")}>
          {e.restorePoint ? (
            <span>
              <IconShield size={11} /> Restore point made
            </span>
          ) : null}
          {e.backup && (
            <span>
              <IconShield size={11} /> Old driver backed up
            </span>
          )}
        </div>
        {e.detail && e.outcome !== "needsRestart" && <div className={c("hist-detail")}>{e.detail}</div>}
      </div>
      <div className={c("hist-side")}>
        <span className={c("pill hist-pill", `outcome-${rolledBack ? "rolledBack" : e.outcome}`)}>
          <span className={c("pill-dot")} />
          {rolledBack ? OUTCOME_LABEL.rolledBack : OUTCOME_LABEL[e.outcome]}
        </span>
        {step ? (
          <StepBadge item={step} />
        ) : canRollBack(e) ? (
          <button className={c("btn btn-secondary btn-small")} onClick={onRollBack} disabled={!!install?.running}>
            <IconRefresh size={12} /> Roll back
          </button>
        ) : changed(e) && !rolledBack && e.restorePoint && e.kind !== "rollback" ? (
          <button className={c("link-btn")} onClick={() => notify("In the app, this opens Windows' System Restore at the restore point made first.")}>
            Open System Restore
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function HistoryView() {
  const { history, rollBack, banner, closeBanner, restartNeeded, dismissRestart, busy, notify } = useDrv();
  const [confirm, setConfirm] = useState<HistoryEntry | null>(null);
  const list = [...history].sort((x, y) => y.at - x.at || y.id - x.id);
  return (
    <div className={c("pane scroll fade-in history-page")}>
      <div className={c("page-head")}>
        <div>
          <div className={c("page-title")}>History</div>
          <div className={c("page-sub")}>Every driver change RevinHi Drivers makes, and how to undo it.</div>
        </div>
      </div>
      <RestartCard needed={restartNeeded} busy={busy} onLater={dismissRestart} onRestart={() => notify("In the app, this restarts the PC so the new driver is used.")} />
      <InstallBanner progress={banner} batches={["rollback"]} onClose={closeBanner} />
      <div className={c("card hist-list")}>
        {list.map((e) => (
          <HistRow key={e.id} e={e} onRollBack={() => setConfirm(e)} />
        ))}
      </div>
      {confirm && (
        <Modal
          title={`Roll back ${confirm.name}?`}
          onCancel={() => setConfirm(null)}
          actions={
            <>
              <button className={c("btn btn-secondary")} onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className={c("btn btn-primary")}
                onClick={() => {
                  const e = confirm;
                  setConfirm(null);
                  rollBack(e);
                }}
              >
                Roll back
              </button>
            </>
          }
        >
          <p className={c("modal-copy")}>
            This puts back {confirm.oldVersion ? `version ${confirm.oldVersion}` : "the earlier driver"} from the backup made before the update. A restore point is made first, and the driver there
            now is backed up too, so this can be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Settings (views/SettingsView.tsx)

const CREDITS: { name: string; license: string; what: string }[] = [
  { name: "Tauri and its plugins", license: "MIT / Apache-2.0", what: "App framework, dialogs, updates" },
  { name: "windows-rs", license: "MIT / Apache-2.0", what: "Devices, drivers and Windows Update" },
  { name: "reqwest", license: "MIT / Apache-2.0", what: "Downloads" },
  { name: "tokio", license: "MIT", what: "Background work" },
  { name: "SQLite (rusqlite)", license: "Public domain / MIT", what: "History" },
  { name: "RustCrypto sha2, sha1, hmac", license: "MIT / Apache-2.0", what: "Checking downloads and keys" },
  { name: "ed25519-dalek", license: "BSD-3-Clause", what: "Checking RevinHi's signed driver list" },
  { name: "cab", license: "MIT", what: "Reading Microsoft driver packages" },
  { name: "zip", license: "MIT", what: "Backups and offline packs" },
  { name: "serde", license: "MIT / Apache-2.0", what: "Saving scans and settings" },
  { name: "chrono, uuid", license: "MIT / Apache-2.0", what: "Dates and install ID" },
  { name: "React", license: "MIT", what: "Interface" },
];

export function SettingsView({ onLicense }: { onLicense: () => void }) {
  const { pro, ignored, setIgnored, allowGeneric, setAllowGeneric, notify } = useDrv();
  const [stats, setStats] = useState(true);
  const [coverage, setCoverage] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className={c("pane scroll settings")}>
      <div className={c("page-head")}>
        <div>
          <div className={c("page-title")}>Settings</div>
        </div>
      </div>
      <Section title="SCAN">
        <SettingRow
          label="Allow general drivers over your PC maker's own"
          hint="Some PCs (Dell, HP, Lenovo...) come with drivers tuned by their maker. They're kept unless you turn this on; then a general driver from the chip maker can be offered when it's newer."
        >
          <Toggle checked={allowGeneric} onChange={setAllowGeneric} label="Allow general drivers over your PC maker's own" />
        </SettingRow>
        <SettingRow label="Ignored devices" hint={ignored.length ? `${plural(ignored.length, "device")} whose updates aren't offered.` : "None. Ignore a device from its details on the Drivers tab."}>
          <button
            className={c("btn btn-secondary")}
            disabled={!ignored.length}
            onClick={() => {
              setIgnored([]);
              notify("Updates are offered for every device again.");
            }}
          >
            Show all again
          </button>
        </SettingRow>
      </Section>
      <Section title="LICENSE">
        <SettingRow
          label={pro ? "RevinHi Drivers Pro" : "RevinHi Drivers Free"}
          hint={pro ? "Installing updates and game components is unlocked." : "Scans and every detail are free. Pro installs driver updates and game components."}
        >
          <button className={c("btn btn-secondary")} onClick={onLicense}>
            {pro ? "Manage" : "Enter key or upgrade"}
          </button>
        </SettingRow>
      </Section>
      <Section title="PRIVACY">
        <SettingRow label="Send anonymous usage stats" hint="A random install ID, the app version and Free/Pro, twice a day. No device names, files, emails or keys. Helps decide what to build next.">
          <Toggle checked={stats} onChange={setStats} label="Send anonymous usage stats" />
        </SettingRow>
        <SettingRow
          label="Report devices with no driver"
          hint="When a scan finds a device that no source has a driver for, send only its chip's maker and model numbers (like 8086:02F0), at most once a month. No device names, serial numbers or anything that points to this PC. It shows which drivers to add to RevinHi's list next."
        >
          <Toggle checked={coverage} onChange={setCoverage} label="Report devices with no driver" />
        </SettingRow>
      </Section>
      <Section title="UPDATES">
        <SettingRow
          label="RevinHi Drivers is up to date"
          hint="You have version 1.0.0. Updates are free forever and are checked for automatically; installing takes a few seconds and reopens the app."
        >
          <button
            className={c("btn btn-secondary")}
            disabled={checking}
            onClick={() => {
              setChecking(true);
              setMessage(null);
              window.setTimeout(() => {
                setChecking(false);
                setMessage("You're on the latest version.");
              }, 900);
            }}
          >
            {checking ? "Checking..." : "Check for updates"}
          </button>
        </SettingRow>
        {message && (
          <div className={c("text-muted")} style={{ fontSize: 11 }}>
            {message}
          </div>
        )}
      </Section>
      <Section title="ABOUT">
        <SettingRow label="RevinHi Drivers v1.0.0" hint="Made by RevinHi · revinhi.com">
          <span />
        </SettingRow>
        <div className={c("credits")}>
          {CREDITS.map((x) => (
            <div key={x.name} className={c("credit-row")}>
              <span className={c("credit-name")}>{x.name}</span>
              <span className={c("text-muted")}>{x.what}</span>
              <span className={c("credit-license")}>{x.license}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ------------------------------------------------------------------ Help (views/HelpView.tsx)

const STEPS: { title: string; text: string; tip?: string }[] = [
  {
    title: "Press Scan",
    text: "On the Drivers tab, press Scan. RevinHi Drivers reads every device's current driver and asks Windows Update, the Microsoft Update Catalog, NVIDIA, Intel, RevinHi's own list and your PC maker's list (HP's business PCs) for newer ones. Nothing on the PC changes while it looks.",
    tip: "A scan takes a minute or two. You can look at other tabs meanwhile; the pill in the title bar brings you back.",
  },
  {
    title: "Look through what was found",
    text: "Devices are grouped: Updates available, Missing drivers, Devices with a problem, and Up to date. Click a device to see its current driver, the newer one and where it comes from.",
    tip: "Only signed drivers made for your exact device and newer than yours are offered. Drivers your PC maker tuned for your PC are kept unless you allow general ones in Settings.",
  },
  {
    title: "Update one, some or all",
    text: "Press Update on a device, or tick several and press Update selected. Before anything is installed, a restore point is made and the current driver is backed up.",
    tip: "Don't want updates for a device? Open its details and press Ignore updates for this device. Settings can show them all again.",
  },
  {
    title: "Restart if asked",
    text: "Some drivers are only used after a restart. The card at the top says when; until then the old driver keeps working. Save your work in other apps before you press Restart now.",
  },
  {
    title: "Roll back if something isn't right",
    text: "The History tab lists every change with its restore point. Press Roll back to put the device's previous driver back. If Windows won't start normally, use the restore point from Windows' recovery options.",
  },
  {
    title: "Game components",
    text: "The Game components tab checks the runtimes games need besides drivers: DirectX, Visual C++, .NET, XNA and more. Most missing or old ones can be installed with one click, straight from Microsoft's own downloads.",
  },
];

const HELP_TOOLS: { name: string; text: string }[] = [
  { name: "Offline updater", text: "For a PC without internet: save its hardware list to a USB stick, build an update pack for it on a PC that's online, then install the pack on the first PC." },
  { name: "Network rescue", text: "Puts network and Wi-Fi drivers on a USB stick, for a PC that can't get online at all." },
  { name: "Back up drivers", text: "Saves this PC's drivers to a folder or a .zip file, to put back any time, for example after reinstalling Windows." },
  { name: "Restore drivers", text: "Puts back drivers from a backup. To undo a single update, Roll back in the History tab is quicker." },
  { name: "Old driver cleanup", text: "Lists older copies of drivers that Windows keeps after updates and nothing uses any more, with their size. Removing them frees space; the drivers in use are never touched." },
  { name: "Unplugged devices", text: "Devices Windows still remembers that aren't plugged in, like old mice, phones and USB sticks. Removing one only clears the memory; plug it in again and Windows sets it up again." },
  { name: "Problem devices", text: "Devices with a yellow mark in Device Manager, with what the problem means in plain words and a fix to try." },
  { name: "Crash driver finder", text: "Reads Windows' crash reports after a blue screen and names the driver most likely behind it, with how sure it is." },
  { name: "One-click fixes", text: "No sound, no internet, wrong screen resolution, USB not recognized and Bluetooth. Each fix lists its steps first and says how to undo them." },
  { name: "Keep drivers as they are", text: "The devices whose updates you ignore, and a switch that stops Windows Update from replacing your drivers. It can be turned back any time." },
  { name: "Scheduled scan", text: "Scans when you sign in or once a week and shows one quiet note if updates are found. It's off until you turn it on." },
  { name: "Hardware info", text: "What's inside this PC: processor, graphics, memory, drives, network and more." },
];

export function HelpView() {
  return (
    <div className={c("pane scroll settings help")}>
      <div className={c("page-head")}>
        <div>
          <div className={c("page-title")}>How to update drivers</div>
          <div className={c("page-sub text-muted")}>Scanning is free and changes nothing. Every update comes after a restore point and a backup, so it can be undone.</div>
        </div>
      </div>
      <ol className={c("help-steps")}>
        {STEPS.map((st, i) => (
          <li key={st.title} className={c("card help-step")}>
            <span className={c("help-num")}>{i + 1}</span>
            <div className={c("help-body")}>
              <div className={c("help-title")}>{st.title}</div>
              <div className={c("help-text")}>{st.text}</div>
              {st.tip && (
                <div className={c("tip")}>
                  <span className={c("tip-icon")}>
                    <IconInfo size={14} />
                  </span>
                  <span>{st.tip}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className={c("card")}>
        <div className={c("section-title text-muted")}>THE TOOLS TAB</div>
        {HELP_TOOLS.map((t) => (
          <div key={t.name} className={c("help-tool")}>
            <div className={c("help-title")}>{t.name}</div>
            <div className={c("help-text")}>{t.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
