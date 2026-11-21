"use client";

// Upgrade window, License tab and Settings tab (license/ui.tsx, views/SettingsView.tsx).

import { useState, type ReactNode } from "react";
import { useDemo } from "../AppWindow";
import { FEATURES, type Feature } from "./data";
import {
  IconBatch,
  IconCompress,
  IconEraser,
  IconLockLine,
  IconMerge,
  IconPencil,
  IconPictures,
  IconScan,
  IconSign,
  IconStamp,
  IconTextDoc,
  IconUnlockLine,
  IconWord,
  IconGray,
  IconImage,
  LockIcon,
  PRICE,
  Section,
  Segmented,
  SettingRow,
  Toggle,
  c,
} from "./ui";

const ART: Record<Feature, ReactNode> = {
  editText: <IconPencil size={20} />,
  no_watermark: <IconEraser size={20} />,
  ocr: <IconScan size={20} />,
  exportFormats: <IconWord size={20} />,
  redact: <IconLockLine size={20} />,
  decorations: <IconTextDoc size={20} />,
  compress: <IconCompress size={20} />,
  protect: <IconLockLine size={20} />,
  pdfToImages: <IconImage size={20} />,
  merge: <IconMerge size={20} />,
  batch: <IconBatch size={20} />,
  cleanup: <IconGray size={20} />,
  unlock: <IconUnlockLine size={20} />,
  imagesToPdf: <IconPictures size={20} />,
  signatures: <IconSign size={20} />,
  customStamps: <IconStamp size={20} />,
};

export function ActivateForm({ onActivate, autoFocus }: { onActivate(key: string): void; autoFocus?: boolean }) {
  const { notify } = useDemo();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const activate = () => {
    if (!key.trim()) return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      notify("In the app, your key from the email unlocks Pro. Pro is now on for this preview.");
      onActivate(key.trim());
      setKey("");
    }, 900);
  };
  return (
    <div className={c("license-form")}>
      <input
        className={c("text-input license-input")}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        value={key}
        spellCheck={false}
        autoFocus={autoFocus}
        onChange={(e) => setKey(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") activate();
        }}
      />
      <button className={c("btn btn-primary")} onClick={activate} disabled={busy || !key.trim()}>
        {busy ? "Checking..." : "Activate"}
      </button>
    </div>
  );
}

function BuyButton({ big }: { big?: boolean }) {
  const { notify } = useDemo();
  return (
    <button className={c("btn btn-buy", big && "btn-buy-big")} onClick={() => notify(`In the app, this opens the RevinHi page to buy Pro (${PRICE}, one time).`)}>
      Buy Pro — {PRICE}
    </button>
  );
}

export function UpgradeModal({ feature, onClose, onActivate }: { feature: Feature | null; onClose(): void; onActivate(key: string): void }) {
  const [enterKey, setEnterKey] = useState(false);
  const focus = feature ? FEATURES[feature] : null;
  const list = (Object.keys(FEATURES) as Feature[]).filter((f) => FEATURES[f].highlight && f !== feature);
  const shown = (feature ? [feature, ...list] : list).slice(0, 6);
  return (
    <div className={c("modal-backdrop")} onPointerDown={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className={c("card modal-card upgrade-card")} role="dialog" aria-modal="true" aria-label="Upgrade to Pro" onPointerDown={(e) => e.stopPropagation()}>
        <div className={c("upgrade-head")}>
          <span className={c("pro-chip pro-chip-static pro-chip-lg")}>
            <LockIcon size={10} />
            PRO
          </span>
          <div className={c("license-title")}>{focus ? `${focus.title} is a Pro feature` : "You're on RevinHi PDF Free"}</div>
          <div className={c("text-secondary license-copy")}>
            {focus ? `${focus.pro}. Free version: ${focus.free.toLowerCase()}.` : "Everything below is one purchase away. The free version keeps working either way."}
          </div>
        </div>
        <div className={c("upgrade-grid")}>
          {shown.map((f) => (
            <div key={f} className={c("upgrade-item", f === feature && "on")}>
              <div className={c("fa")}>{ART[f]}</div>
              <div>
                <div className={c("upgrade-title")}>{FEATURES[f].title}</div>
                <div className={c("upgrade-sub")}>{FEATURES[f].pro}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={c("upgrade-price text-muted")}>One-time {PRICE} · free updates forever · viewing, annotating, signing and forms stay free</div>
        {enterKey && (
          <ActivateForm
            autoFocus
            onActivate={(k) => {
              onActivate(k);
              onClose();
            }}
          />
        )}
        <div className={c("toolbar modal-actions")}>
          <BuyButton big />
          {!enterKey && (
            <button className={c("btn btn-secondary")} onClick={() => setEnterKey(true)}>
              Enter key
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className={c("btn btn-secondary btn-small")} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export function LicenseView({ licensedKey, onActivate, onRemove, onWhatsIn }: { licensedKey: string | null; onActivate(k: string): void; onRemove(): void; onWhatsIn(): void }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const pro = !!licensedKey;
  return (
    <div className={c("pane scroll")}>
      <div className={c("card license-card")}>
        <div className={c("license-head")}>
          <div>
            <div className={c("section-title text-muted")}>LICENSE</div>
            <div className={c("license-title")}>RevinHi PDF {pro ? "Pro" : "Free"}</div>
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
              <span className={c("license-mono")}>••••-••••-••••-{licensedKey.replace(/[^A-Z0-9]/g, "").slice(-4).padStart(4, "X")}</span>
            </div>
            <div className={c("license-row")}>
              <span className={c("text-muted")}>Activated</span>
              <span>Just now</span>
            </div>
            <p className={c("text-secondary license-copy")}>Thanks for supporting RevinHi. Your key covers every future update of RevinHi PDF.</p>
            {confirmRemove ? (
              <div className={c("toolbar")}>
                <span className={c("text-muted")} style={{ fontSize: 12 }}>
                  Remove the key from this PC?
                </span>
                <button
                  className={c("btn btn-danger btn-small")}
                  onClick={() => {
                    onRemove();
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
            <ActivateForm onActivate={onActivate} />
            <div className={c("toolbar")} style={{ marginTop: 4 }}>
              <BuyButton />
              <button className={c("btn btn-secondary btn-small")} onClick={onWhatsIn}>
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
          {["View, page tools, split", "Annotate, sign, fill forms"].map((t) => (
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

export function SettingsView({ author, setAuthor }: { author: string; setAuthor(v: string): void }) {
  const { notify } = useDemo();
  const [reopen, setReopen] = useState(true);
  const [zoom, setZoom] = useState("width");
  const [layout, setLayout] = useState("single");
  const [night, setNight] = useState(false);
  const [autosave, setAutosave] = useState(true);
  const [every, setEvery] = useState(30);
  const [stats, setStats] = useState(true);
  const [checking, setChecking] = useState(false);
  return (
    <div className={c("pane scroll settings")}>
      <Section title="DOCUMENTS">
        <SettingRow label="Reopen last session's files on launch" hint="Files that were moved or deleted are skipped.">
          <Toggle checked={reopen} onChange={setReopen} />
        </SettingRow>
        <SettingRow label="Your name on comments" hint="Shown as the author of sticky notes and comments, in RevinHi PDF and other PDF readers.">
          <input className={c("text-input settings-input")} placeholder="Your name" maxLength={60} value={author} onChange={(e) => setAuthor(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
        </SettingRow>
        <SettingRow label="Open documents at" hint="Used the first time a file opens; after that each file remembers its own page, zoom and layout.">
          <Segmented
            value={zoom}
            onChange={setZoom}
            options={[
              { value: "width", label: "Fit width" },
              { value: "page", label: "Fit page" },
              { value: "actual", label: "100%" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Page layout">
          <Segmented
            value={layout}
            onChange={setLayout}
            options={[
              { value: "single", label: "Single" },
              { value: "spread", label: "Two pages" },
              { value: "cover", label: "Cover + two" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Night reading" hint="Dark pages for reading at night. Your edits and the saved file are not affected.">
          <Toggle checked={night} onChange={setNight} />
        </SettingRow>
      </Section>

      <Section title="AUTOSAVE">
        <SettingRow label="Autosave unsaved work" hint="Keeps a recovery copy of documents with unsaved changes, so a crash or power cut doesn't lose them. Saved files are never touched.">
          <Toggle checked={autosave} onChange={setAutosave} />
        </SettingRow>
        <SettingRow label="Every">
          <Segmented<number>
            value={every}
            onChange={setEvery}
            options={[
              { value: 15, label: "15 s" },
              { value: 30, label: "30 s" },
              { value: 60, label: "1 min" },
              { value: 300, label: "5 min" },
            ]}
          />
        </SettingRow>
      </Section>

      <Section title="PRIVACY">
        <SettingRow label="Send anonymous usage stats" hint="A random install ID, the app version and Free/Pro, twice a day. No files, names, emails or keys. Helps decide what to build next.">
          <Toggle checked={stats} onChange={setStats} />
        </SettingRow>
      </Section>

      <Section title="UPDATES">
        <SettingRow
          label="RevinHi PDF is up to date"
          hint="You have version 0.2.3. Updates are free forever and are checked for automatically; installing takes a few seconds and reopens the app."
        >
          <button
            className={c("btn btn-secondary btn-small")}
            disabled={checking}
            onClick={() => {
              setChecking(true);
              window.setTimeout(() => {
                setChecking(false);
                notify("In the app, this asks revinhi.com for a newer version. You're on the latest version.");
              }, 900);
            }}
          >
            {checking ? "Checking..." : "Check for updates"}
          </button>
        </SettingRow>
      </Section>

      <Section title="ABOUT">
        <SettingRow label="RevinHi PDF v0.2.3" hint="Made by RevinHi · revinhi.com">
          <span />
        </SettingRow>
      </Section>
    </div>
  );
}
