"use client";

import { useState } from "react";
import { useDemo } from "../AppWindow";
import type { RecentScan } from "./data";
import { RecentRow } from "./home";
import { IconInfo, IconOpen, IconSave, IconUsb, IconWarn, ProChip, Section, SettingRow, Toggle, c } from "./ui";

const PRICE = "$19.99";

// ------------------------------------------------------------------ Recent scans

export function RecentView({ recent, onOpen, onRemove, onDrives }: { recent: RecentScan[]; onOpen: (r: RecentScan) => void; onRemove: (r: RecentScan) => void; onDrives: () => void }) {
  const { notify } = useDemo();
  return (
    <div className={c("pane scroll")}>
      <div className={c("page-head")} style={{ maxWidth: 860 }}>
        <div>
          <div className={c("page-title")}>Recent scans</div>
          <div className={c("page-sub")}>Open a scan again to look through its files without scanning the drive again.</div>
        </div>
        <span style={{ flex: 1 }} />
        <button className={c("btn btn-secondary btn-small")} onClick={() => notify("In the app, this opens a scan you saved as a file.")}>
          <IconOpen size={13} /> Open saved scan…
        </button>
      </div>
      {recent.length > 0 ? (
        <div className={c("card recent-list")}>
          {recent.map((r) => (
            <RecentRow key={r.id} r={r} onOpen={() => onOpen(r)} onRemove={() => onRemove(r)} />
          ))}
        </div>
      ) : (
        <div className={c("card")} style={{ maxWidth: 860, textAlign: "center", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No scans yet</div>
          <div className={c("text-muted")} style={{ fontSize: 12 }}>
            Scan a drive and it&apos;s kept here, so you can come back to its files later. The newest five are kept.
          </div>
          <button className={c("btn btn-primary btn-small")} onClick={onDrives}>
            Your drives
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Settings

const CREDITS: { name: string; license: string; what: string }[] = [
  { name: "Tauri", license: "MIT / Apache-2.0", what: "App framework" },
  { name: "windows-rs", license: "MIT / Apache-2.0", what: "Drive access" },
  { name: "RustCrypto sha2", license: "MIT / Apache-2.0", what: "Checking copies (SHA-256)" },
  { name: "SQLite (rusqlite)", license: "Public domain / MIT", what: "Saved scans and search" },
  { name: "miniz_oxide", license: "MIT / Apache-2.0", what: "Reading names inside Office files" },
  { name: "PDF.js", license: "Apache-2.0", what: "PDF previews" },
  { name: "React", license: "MIT", what: "Interface" },
];

export function SettingsView({
  advanced,
  setAdvanced,
  onLicense,
}: {
  advanced: boolean;
  setAdvanced: (v: boolean) => void;
  onLicense: () => void;
}) {
  const [stats, setStats] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  return (
    <div className={c("pane scroll settings")}>
      <div className={c("page-head")}>
        <div className={c("page-title")}>Settings</div>
      </div>
      <Section title="VIEW">
        <SettingRow
          label="Advanced mode"
          hint="Shows the Sector viewer (a drive's raw contents, with its structures labeled) and technical details such as every drive health value."
        >
          <Toggle checked={advanced} onChange={setAdvanced} label="Advanced mode" />
        </SettingRow>
      </Section>
      <Section title="LICENSE">
        <SettingRow label="RevinHi Recovery Free" hint="Scanning, previews and the drive tools are free. Pro saves recovered files and writes images to drives.">
          <button className={c("btn btn-secondary")} onClick={onLicense}>
            Enter key or upgrade
          </button>
        </SettingRow>
      </Section>
      <Section title="PRIVACY">
        <SettingRow
          label="Send anonymous usage stats"
          hint="A random install ID, the app version and Free/Pro, twice a day. No files, drive names, emails or keys. Helps decide what to build next."
        >
          <Toggle checked={stats} onChange={setStats} label="Send anonymous usage stats" />
        </SettingRow>
      </Section>
      <Section title="UPDATES">
        <SettingRow
          label="RevinHi Recovery is up to date"
          hint="You have version 1.0.3. Updates are free forever and are checked for automatically; installing takes a few seconds and reopens the app."
        >
          <button
            className={c("btn btn-secondary")}
            disabled={checking}
            onClick={() => {
              setChecking(true);
              window.setTimeout(() => {
                setChecking(false);
                setChecked(true);
              }, 1000);
            }}
          >
            {checking ? "Checking..." : "Check for updates"}
          </button>
        </SettingRow>
        {checked && (
          <div className={c("text-muted")} style={{ fontSize: 11 }}>
            You have the newest version.
          </div>
        )}
      </Section>
      <Section title="ABOUT">
        <SettingRow label="RevinHi Recovery v1.0.3" hint="Made by RevinHi · revinhi.com">
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

// ------------------------------------------------------------------ Help

const STEPS: { title: string; text: string; tip?: string; warn?: boolean }[] = [
  {
    title: "Stop using the drive",
    text: "Deleted files stay on the drive until something new is written over them. Don't save, install or download anything to it until you've got your files back.",
    tip: "Were the files on your Windows drive (C:)? Close other apps, skip downloads, and plan to save what you recover onto a different drive.",
    warn: true,
  },
  {
    title: "Pick the drive and press Scan",
    text: "On the Recover tab, find the drive, memory card or USB stick the files were on and press Scan.",
    tip: "Choose Quick scan for files deleted recently. Choose Full scan if the drive was formatted, shows as RAW, or Quick scan didn't find what you need. A full scan reads the whole drive, so it takes longer.",
  },
  {
    title: "Look through what was found",
    text: "Files are sorted by type (photos, videos, documents...). Search by name or type, for example .zip or >100mb, and click a file to preview it before you recover it.",
    tip: "The dot next to each file shows its chance of coming back whole. Green is good; red usually means part of it has been written over.",
  },
  {
    title: "Tick the files you want",
    text: "Tick files or whole folders. The bar at the bottom shows how many you've picked and their total size.",
    tip: "Some files only have a guessed name (from photo or music details) or a number like 'ZIP 1.zip' when the original name is gone. The contents are still the real file.",
  },
  {
    title: "Recover to a different drive",
    text: "Press Recover and choose a folder on another drive, such as a second disk or a USB stick. The app refuses to save onto the drive you scanned, because that could overwrite the very files you're trying to save.",
  },
  {
    title: "Check your files, then keep a copy",
    text: "Open a few of the recovered files to make sure they're good. Save the scan (Recent scans keeps the last few) so you can come back without scanning again.",
    tip: "Drive making clicking noises or showing errors? Make a Disk backup image of it first (Tools), then scan the image instead of the failing drive.",
  },
];

const HELP_TOOLS: { name: string; text: string }[] = [
  { name: "Write image to drive", text: "Copies a VHD, VHDX or disk image onto a USB drive byte for byte, then reads it back to check the copy. Everything on the USB drive is replaced." },
  { name: "Disk backup image", text: "Copies a whole drive into one image file, skipping past bad areas first and going back for them later. Scan the image instead of a failing drive." },
  { name: "Drive health", text: "Reads the drive's own health report and tells you in plain words if it's Good, worth watching, or failing." },
  { name: "Find lost partitions", text: "Searches a drive for partitions that were deleted or lost, so you can scan them." },
];

export function HelpView() {
  return (
    <div className={c("pane scroll settings")}>
      <div className={c("page-head")}>
        <div>
          <div className={c("page-title")}>How to recover files</div>
          <div className={c("page-sub")}>Six steps. RevinHi Recovery only reads the drive you scan; it never writes to it.</div>
        </div>
      </div>
      <ol className={c("help-steps")}>
        {STEPS.map((s, i) => (
          <li key={s.title} className={c("card help-step")}>
            <span className={c("help-num")}>{i + 1}</span>
            <div className={c("help-body")}>
              <div className={c("help-title")}>{s.title}</div>
              <div className={c("help-text")}>{s.text}</div>
              {s.tip && (
                <div className={c("tip", s.warn && "tip-windows")}>
                  <span className={c("tip-icon")}>{s.warn ? <IconWarn size={14} /> : <IconInfo size={14} />}</span>
                  <span>{s.tip}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className={c("card")}>
        <div className={c("section-title")}>THE TOOLS TAB</div>
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

// ------------------------------------------------------------------ Upgrade window (Free version)

export type ProFeature = "recover" | "writeImage" | null;

const FEATURES = {
  recover: { title: "Save recovered files", pro: "Save every file a scan finds, with its name and folder", free: "Scan and preview only", icon: <IconSave size={22} /> },
  writeImage: {
    title: "Write image to drive",
    pro: "Put a VHD, VHDX or disk image onto a USB drive byte for byte, then check the copy",
    free: "Not included",
    icon: <IconUsb size={22} />,
  },
};

export function UpgradeModal({ feature, onClose }: { feature: ProFeature; onClose: () => void }) {
  const { notify } = useDemo();
  const focus = feature ? FEATURES[feature] : null;
  return (
    <div className={c("modal-backdrop")} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={c("card modal-card upgrade-card")} role="dialog" aria-modal="true" aria-label="Upgrade to Pro">
        <div className={c("upgrade-head")}>
          <ProChip large />
          <div className={c("license-title")}>{focus ? `${focus.title} is a Pro feature` : "You're on RevinHi Recovery Free"}</div>
          <div className={c("text-secondary license-copy")}>
            {focus ? `${focus.pro}. Free version: ${focus.free.toLowerCase()}.` : "Everything below is one purchase away. The free version keeps working either way."}
          </div>
        </div>
        <div className={c("upgrade-grid")}>
          {(["recover", "writeImage"] as const).map((f) => (
            <div key={f} className={c("upgrade-item", f === feature && "on")}>
              <div className={c("fa")}>{FEATURES[f].icon}</div>
              <div>
                <div className={c("upgrade-title")}>{FEATURES[f].title}</div>
                <div className={c("upgrade-sub")}>{FEATURES[f].pro}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={c("upgrade-price text-muted")}>One-time {PRICE} · free updates forever · scanning, previews and drive tools stay free</div>
        <div className={c("toolbar modal-actions")}>
          <button className={c("btn btn-buy btn-buy-big")} onClick={() => notify(`In the app, this opens the page to buy Pro (${PRICE}, one time).`)}>
            Buy Pro — {PRICE}
          </button>
          <button className={c("btn btn-secondary")} onClick={() => notify("In the app, you paste your Pro key here to unlock it.")}>
            Enter key
          </button>
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary btn-small")} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
