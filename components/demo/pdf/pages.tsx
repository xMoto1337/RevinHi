"use client";

// The sample PDFs, drawn as HTML at their size in points (Letter = 612 x 792). The same drawing is used
// for the big pages and (scaled down) for the thumbnails. Lines wrapped in <R> can be retyped with
// "Edit text"; <Field> / <Check> are the document's own form fields.

import { createContext, useContext, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { c } from "./ui";
import { fontCss, type PageKind, type PageRef, type TextEdit } from "./data";

export interface PageCtxValue {
  pageKey: string;
  live: boolean;
  editText: boolean;
  forms: boolean;
  edits: Record<string, TextEdit>;
  editing: string | null;
  fields: Record<string, string | boolean>;
  onRun?(key: string, original: string): void;
  onCommit?(key: string, original: string, text: string | null): void;
  onField?(key: string, v: string | boolean): void;
}

const PageCtx = createContext<PageCtxValue>({ pageKey: "", live: false, editText: false, forms: false, edits: {}, editing: null, fields: {} });

/** A line of text that is part of the PDF. */
function R({ id, children, style }: { id: string; children: string; style?: CSSProperties }) {
  const ctx = useContext(PageCtx);
  const key = `${ctx.pageKey}|${id}`;
  const e = ctx.edits[key];
  const text = e?.text ?? children;
  const st: CSSProperties | undefined = e
    ? {
        ...style,
        fontFamily: e.font ? fontCss(e.font) : style?.fontFamily,
        fontSize: e.size ?? style?.fontSize,
        color: e.color ?? style?.color,
        background: e.cover && e.cover !== "#ffffff" ? e.cover : style?.background,
      }
    : style;
  if (ctx.live && ctx.editing === key) return <EditingRun text={text} style={st} onDone={(t) => ctx.onCommit?.(key, e?.original ?? children, t)} />;
  return (
    <span
      className={c("te-run", e && "edited")}
      style={st}
      onClick={
        ctx.live && ctx.editText
          ? (ev) => {
              ev.stopPropagation();
              ctx.onRun?.(key, e?.original ?? children);
            }
          : undefined
      }
    >
      {text}
    </span>
  );
}

function EditingRun({ text, style, onDone }: { text: string; style?: CSSProperties; onDone(t: string | null): void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);
  const finish = (t: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(t);
  };
  return (
    <span
      ref={ref}
      className={c("te-edit")}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          finish(ref.current?.textContent ?? text);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(null);
        }
      }}
      onBlur={() => finish(ref.current?.textContent ?? text)}
    >
      {text}
    </span>
  );
}

/** A text form field. */
function Field({ id, w, placeholder, style }: { id: string; w: number; placeholder?: string; style?: CSSProperties }) {
  const ctx = useContext(PageCtx);
  const key = `${ctx.pageKey}|${id}`;
  const v = (ctx.fields[key] as string | undefined) ?? "";
  if (!ctx.live) {
    return <span className={c("pdf-field")} style={{ display: "inline-block", width: w, height: 16, lineHeight: "14px", verticalAlign: "bottom", ...style }}>{v}</span>;
  }
  return (
    <input
      className={c("pdf-field")}
      style={{ width: w, height: 16, fontSize: 10.5, verticalAlign: "bottom", ...style }}
      value={v}
      placeholder={placeholder}
      spellCheck={false}
      aria-label={placeholder ?? "Form field"}
      onPointerDown={(e) => e.stopPropagation()}
      onChange={(e) => ctx.onField?.(key, e.target.value)}
      onKeyDown={(e) => e.stopPropagation()}
    />
  );
}

/** A checkbox form field. */
function Check({ id, label }: { id: string; label: string }) {
  const ctx = useContext(PageCtx);
  const key = `${ctx.pageKey}|${id}`;
  const on = ctx.fields[key] === true;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span
        className={c("pdf-check")}
        role="checkbox"
        aria-checked={on}
        aria-label={label}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (ctx.live) ctx.onField?.(key, !on);
        }}
      >
        {on ? "✓" : ""}
      </span>
      <R id={`${id}-l`}>{label}</R>
    </span>
  );
}

// ------------------------------------------------------------------ page drawings

const INK = "#1d1d1f";
const BLUE = "#1f4e8c";
const GRAY = "#6b7280";
const TEAL = "#1f8a78";

const page: CSSProperties = { position: "absolute", inset: 0, fontFamily: "Helvetica, Arial, sans-serif", color: INK, lineHeight: 1.5 };
const abs = (x: number, y: number, w?: number): CSSProperties => ({ position: "absolute", left: x, top: y, width: w });
const P = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => <div style={{ fontSize: 10, lineHeight: 1.6, marginBottom: 9, ...style }}>{children}</div>;
const H = ({ children }: { children: ReactNode }) => <div style={{ fontSize: 11.5, fontWeight: 700, margin: "14px 0 5px" }}>{children}</div>;

function AgreementHeader({ n }: { n: number }) {
  return (
    <div style={{ ...abs(54, 34, 504), display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>
      <span style={{ color: BLUE, fontWeight: 700, fontSize: 8.5, letterSpacing: "0.04em" }}>BRIGHTWATER DESIGN CO.</span>
      <span style={{ color: GRAY, fontSize: 8 }}>Service Agreement&nbsp; | &nbsp;Page {n} of 2</span>
    </div>
  );
}

function Footer() {
  return (
    <div style={{ ...abs(54, 752, 504), textAlign: "center", fontSize: 7, color: "#9ca3af" }}>
      Brightwater Design Co. · 418 Harbor Street, Portland, OR 97209 · hello@brightwater.design
    </div>
  );
}

function Sa1() {
  const kv: [string, string, string][] = [
    ["Effective Date:", "date", "November 2, 2026"],
    ["Project:", "project", "Brand refresh and marketing website"],
    ["Total Fee:", "fee", "$5,250.00"],
    ["Term:", "term", "12 weeks from the Effective Date"],
  ];
  return (
    <div style={page}>
      <AgreementHeader n={1} />
      <div style={abs(54, 78, 504)}>
        <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "0.01em", marginBottom: 14 }}>
          <R id="title">SERVICE AGREEMENT</R>
        </div>
        <P>
          <R id="intro">
            This Service Agreement (the &quot;Agreement&quot;) is made between Brightwater Design Co. (&quot;Provider&quot;) and Oakridge Analytics LLC (&quot;Client&quot;), together the &quot;Parties&quot;.
          </R>
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "118px 1fr", rowGap: 3, fontSize: 10, margin: "12px 0 14px" }}>
          {kv.map(([k, id, v]) => (
            <div key={id} style={{ display: "contents" }}>
              <span style={{ fontWeight: 700 }}>{k}</span>
              <span>
                <R id={id}>{v}</R>
              </span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #e5e7eb", margin: "4px 0 6px" }} />
        <H>
          <R id="h1">1. Services</R>
        </H>
        <P>
          <R id="p1">
            Provider will deliver the services described in Schedule A, including a brand identity package, a responsive marketing website of up to eight pages, and two rounds of revisions for each deliverable. Additional work is quoted separately and agreed in writing.
          </R>
        </P>
        <H>
          <R id="h2">2. Fees and Payment</R>
        </H>
        <P>
          <R id="p2">
            Client will pay the Total Fee in two parts: a 30% deposit on signing and the balance on final delivery. Invoices are due within 30 days. Late balances may pause work until they are settled.
          </R>
        </P>
        <H>
          <R id="h3">3. Timeline</R>
        </H>
        <P>
          <R id="p3">
            Work begins on the Effective Date. Provider will share a schedule in the first week and keep Client updated at each milestone. Delays caused by late feedback or content extend the timeline by the same amount.
          </R>
        </P>
        <H>
          <R id="h4">4. Revisions</R>
        </H>
        <P>
          <R id="p4">
            Each deliverable includes two rounds of revisions. Feedback should be collected in one shared document so nothing is missed. Further rounds are billed at $95 per hour.
          </R>
        </P>
      </div>
      <Footer />
    </div>
  );
}

function SignColumn({ side, org, name, title, children }: { side: string; org: string; name: string; title: string; children: ReactNode }) {
  return (
    <div style={{ width: 230 }}>
      <div style={{ color: BLUE, fontWeight: 700, fontSize: 8.5, letterSpacing: "0.03em" }}>
        {side}&nbsp; - &nbsp;{org}
      </div>
      <div style={{ height: 44, borderBottom: "1px solid #333" }} />
      <div style={{ fontSize: 7.5, color: GRAY, marginTop: 3 }}>Signature</div>
      <div style={{ fontSize: 10, marginTop: 12 }}>
        <R id={`${side}-name`}>{name}</R>
      </div>
      <div style={{ fontSize: 7.5, color: GRAY }}>
        <R id={`${side}-title`}>{title}</R>
      </div>
      <div style={{ marginTop: 16, width: 150, borderBottom: "1px solid #333", fontSize: 10, minHeight: 18 }}>{children}</div>
      <div style={{ fontSize: 7.5, color: GRAY, marginTop: 3 }}>Date</div>
    </div>
  );
}

function Sa2() {
  return (
    <div style={page}>
      <AgreementHeader n={2} />
      <div style={abs(54, 70, 504)}>
        <H>
          <R id="h5">5. Ownership</R>
        </H>
        <P>
          <R id="p5">
            When the Total Fee is paid in full, Client owns the final logo, brand assets and website design. Provider may show the work in its portfolio unless Client asks in writing that it stays private.
          </R>
        </P>
        <H>
          <R id="h6">6. Confidentiality</R>
        </H>
        <P>
          <R id="p6">
            Each Party keeps the other&apos;s business information private and uses it only for this project. This duty continues for two years after the Agreement ends.
          </R>
        </P>
        <H>
          <R id="h7">7. Ending the Agreement</R>
        </H>
        <P>
          <R id="p7">
            Either Party may end this Agreement with 14 days&apos; written notice. Client pays for work completed up to that date, and Provider hands over all finished files.
          </R>
        </P>
        <div style={{ margin: "16px 0 8px", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 4, background: "#fafafa" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: BLUE, letterSpacing: "0.03em", marginBottom: 7 }}>SCHEDULE A - SCOPE APPROVED BY CLIENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 10 }}>
            <Check id="s-brand" label="Brand identity package (logo, colors, type, brand guide)" />
            <Check id="s-web" label="Marketing website, up to eight pages" />
            <Check id="s-support" label="Ongoing support plan, $350 per month (optional)" />
          </div>
          <div style={{ fontSize: 10, marginTop: 9 }}>
            Client initials: <Field id="initials" w={46} placeholder="Initials" />
          </div>
        </div>
        <div style={{ fontSize: 10, margin: "14px 0 18px" }}>
          <R id="witness">IN WITNESS WHEREOF, the Parties have signed this Agreement on the dates below.</R>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <SignColumn side="PROVIDER" org="BRIGHTWATER DESIGN CO." name="Morgan Reyes" title="Founder & Creative Director">
            <R id="pdate">November 2, 2026</R>
          </SignColumn>
          <SignColumn side="CLIENT" org="OAKRIDGE ANALYTICS LLC" name="Jordan Ellis" title="Head of Operations">
            <Field id="cdate" w={148} placeholder="Date" style={{ marginBottom: -1 }} />
          </SignColumn>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Invoice() {
  const rows: [string, string, string, string][] = [
    ["Brand identity package", "1", "$2,400.00", "$2,400.00"],
    ["Marketing website design, 8 pages", "1", "$2,250.00", "$2,250.00"],
    ["Copywriting and content setup", "6 h", "$100.00", "$600.00"],
  ];
  return (
    <div style={page}>
      <div style={{ ...abs(54, 48, 504), display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 7, background: BLUE, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18 }}>B</div>
          <div style={{ fontSize: 8.5, lineHeight: 1.5, color: GRAY }}>
            <div style={{ color: BLUE, fontWeight: 700, fontSize: 10, letterSpacing: "0.03em" }}>BRIGHTWATER DESIGN CO.</div>
            418 Harbor Street
            <br />
            Portland, OR 97209
            <br />
            hello@brightwater.design
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.04em", color: INK }}>
            <R id="title">INVOICE</R>
          </div>
          <div style={{ fontSize: 9, lineHeight: 1.7, color: GRAY }}>
            Invoice no. <R id="no" style={{ color: INK }}>BW-2026-0147</R>
            <br />
            Date: <R id="date" style={{ color: INK }}>November 9, 2026</R>
            <br />
            Due: <R id="due" style={{ color: INK }}>December 9, 2026</R>
          </div>
        </div>
      </div>
      <div style={{ ...abs(54, 150, 260), fontSize: 9.5, lineHeight: 1.6 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: GRAY, letterSpacing: "0.08em" }}>BILL TO</div>
        <div style={{ fontWeight: 700 }}>
          <R id="bill">Oakridge Analytics LLC</R>
        </div>
        <R id="attn">Attn: Jordan Ellis</R>
        <br />
        <R id="addr1">2200 Ridgeview Ave, Suite 400</R>
        <br />
        <R id="addr2">Denver, CO 80205</R>
      </div>
      <div style={{ ...abs(330, 150, 228), fontSize: 9.5, lineHeight: 1.6 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: GRAY, letterSpacing: "0.08em" }}>PROJECT</div>
        <R id="proj">Brand refresh and marketing website</R>
        <br />
        <R id="ref">Agreement of November 2, 2026</R>
      </div>
      <div style={{ ...abs(54, 250, 504), fontSize: 9.5 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 86px 86px", padding: "7px 10px", background: BLUE, color: "#fff", fontWeight: 700, fontSize: 8.5, letterSpacing: "0.05em" }}>
          <span>DESCRIPTION</span>
          <span style={{ textAlign: "right" }}>QTY</span>
          <span style={{ textAlign: "right" }}>RATE</span>
          <span style={{ textAlign: "right" }}>AMOUNT</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 50px 86px 86px", padding: "9px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 ? "#f8fafc" : "#fff" }}>
            <R id={`d${i}`}>{r[0]}</R>
            <span style={{ textAlign: "right" }}>
              <R id={`q${i}`}>{r[1]}</R>
            </span>
            <span style={{ textAlign: "right" }}>
              <R id={`r${i}`}>{r[2]}</R>
            </span>
            <span style={{ textAlign: "right" }}>
              <R id={`a${i}`}>{r[3]}</R>
            </span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", width: 230, marginTop: 14, fontSize: 10 }}>
          {[
            ["Subtotal", "sub", "$5,250.00"],
            ["Deposit received", "dep", "-$1,575.00"],
          ].map(([k, id, v]) => (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px" }}>
              <span style={{ color: GRAY }}>{k}</span>
              <R id={id}>{v}</R>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", marginTop: 6, background: "#eef3fb", border: `1px solid ${BLUE}`, borderRadius: 4, fontWeight: 700, color: BLUE }}>
            <span>Balance due</span>
            <R id="bal">$3,675.00</R>
          </div>
        </div>
      </div>
      <div style={{ ...abs(54, 560, 504), fontSize: 9, lineHeight: 1.7, color: GRAY, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em" }}>PAYMENT</div>
        <R id="pay1">Bank transfer to Brightwater Design Co., account ending 4821.</R>
        <br />
        <R id="pay2">Please include the invoice number with your payment.</R>
        <div style={{ marginTop: 26, color: INK, fontSize: 11, fontWeight: 700 }}>
          <R id="thanks">Thank you for your business!</R>
        </div>
      </div>
    </div>
  );
}

function ProposalHead({ title, n }: { title: string; n: number }) {
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 12, background: TEAL }} />
      <div style={{ ...abs(54, 30, 504), display: "flex", justifyContent: "space-between", fontSize: 7.5, color: GRAY }}>
        <span>Brand Refresh Proposal</span>
        <span>{n}</span>
      </div>
      <div style={{ ...abs(54, 70, 504), fontSize: 24, fontWeight: 700 }}>
        <R id="title">{title}</R>
      </div>
    </>
  );
}

function PCover() {
  return (
    <div style={{ ...page, background: "#0f1a2b", color: "#fff" }}>
      <div style={{ ...abs(60, 300, 480) }}>
        <div style={{ width: 46, height: 3, background: "#3aa6ff", marginBottom: 16 }} />
        <div style={{ fontSize: 30, fontWeight: 700 }}>
          <R id="title">Project Proposal</R>
        </div>
        <div style={{ fontSize: 12, color: "#9fb3cc", marginTop: 6 }}>
          <R id="sub">Brand Refresh for Oakridge Analytics</R>
        </div>
      </div>
      <div style={{ ...abs(60, 720, 480), fontSize: 8.5, color: "#6f829c" }}>
        <R id="by">Prepared by Brightwater Design Co. · November 2026</R>
      </div>
    </div>
  );
}

function PSummary() {
  const bars = [92, 128, 104, 160, 138, 186];
  return (
    <div style={page}>
      <ProposalHead title="Executive Summary" n={2} />
      <div style={abs(54, 116, 504)}>
        <P style={{ fontSize: 10.5 }}>
          <R id="p1">
            We help growing companies present themselves clearly. This section outlines how we will work together, what you can expect at each stage, and how we measure success along the way.
          </R>
        </P>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height: 210, margin: "18px 0 6px", padding: "0 10px", borderBottom: "1px solid #cbd5e1" }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: h, background: i === bars.length - 1 ? TEAL : "#d3dbea" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, padding: "0 10px", fontSize: 8, color: GRAY, marginBottom: 14 }}>
          {["2021", "2022", "2023", "2024", "2025", "2026"].map((y) => (
            <span key={y} style={{ flex: 1, textAlign: "center" }}>
              {y}
            </span>
          ))}
        </div>
        <P>
          <R id="p2">
            Each phase ends with a short review so decisions stay quick and nothing is a surprise. Feedback is collected in one shared document and every change is tracked.
          </R>
        </P>
        <P>
          <R id="p3">Website visits grew 38% after our last three brand refreshes, measured over the six months after launch.</R>
        </P>
      </div>
    </div>
  );
}

function PApproach() {
  const cards: [string, string, string][] = [
    ["Discover", "#7c5cff", "Interviews with your team and customers, a review of your current brand and a short list of what must change."],
    ["Design", "#1f8a78", "Two logo routes, a color and type system, and key website pages, refined over two rounds of feedback."],
    ["Deliver", "#e0884a", "A brand guide, every asset in the formats you need, and a launched website your team can update."],
  ];
  return (
    <div style={page}>
      <ProposalHead title="Our Approach" n={3} />
      <div style={abs(54, 116, 504)}>
        <P style={{ fontSize: 10.5 }}>
          <R id="p1">Three stages, each with a clear result you can see and approve before we move on.</R>
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "14px 0 18px" }}>
          {cards.map(([t, col, body], i) => (
            <div key={t} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 12, background: "#fafbfc" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: col, color: "#fff", fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", marginBottom: 8 }}>{i + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>
                <R id={`c${i}`}>{t}</R>
              </div>
              <div style={{ fontSize: 9, lineHeight: 1.55, color: "#4b5563" }}>
                <R id={`b${i}`}>{body}</R>
              </div>
            </div>
          ))}
        </div>
        <H>
          <R id="h2">What you get</R>
        </H>
        {["A brand guide your whole team can follow", "Logo files for print, web and social", "A fast website, built to grow with you", "Training so your team can make updates"].map((t, i) => (
          <div key={i} style={{ fontSize: 10, lineHeight: 1.9, display: "flex", gap: 8 }}>
            <span style={{ color: TEAL, fontWeight: 700 }}>•</span>
            <R id={`l${i}`}>{t}</R>
          </div>
        ))}
      </div>
    </div>
  );
}

function PTimeline() {
  const rows: [string, number, number][] = [
    ["Discovery workshops", 0, 2],
    ["Logo routes", 2, 3],
    ["Brand system", 4, 3],
    ["Website design", 5, 4],
    ["Website build", 8, 3],
    ["Launch and training", 11, 1],
  ];
  return (
    <div style={page}>
      <ProposalHead title="Timeline" n={4} />
      <div style={abs(54, 116, 504)}>
        <P style={{ fontSize: 10.5 }}>
          <R id="p1">Twelve weeks from kickoff to launch. The website build starts while the brand system is being finished.</R>
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "130px repeat(12, 1fr)", fontSize: 7.5, color: GRAY, marginTop: 14, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
          <span />
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ textAlign: "center" }}>
              W{i + 1}
            </span>
          ))}
        </div>
        {rows.map(([t, start, len], i) => (
          <div key={t} style={{ display: "grid", gridTemplateColumns: "130px repeat(12, 1fr)", alignItems: "center", height: 30, borderBottom: "1px solid #f1f5f9", fontSize: 9.5 }}>
            <R id={`t${i}`}>{t}</R>
            <div style={{ gridColumn: `${start + 2} / span ${len}`, height: 12, borderRadius: 3, background: i % 2 ? "#f0b07e" : "#e0884a" }} />
          </div>
        ))}
        <P style={{ marginTop: 16 }}>
          <R id="p2">Dates are confirmed in the first week, once your team&apos;s availability for the workshops is known.</R>
        </P>
      </div>
    </div>
  );
}

function PBudget() {
  const rows: [string, string, string][] = [
    ["Discovery", "2 weeks", "$600.00"],
    ["Brand identity", "5 weeks", "$1,800.00"],
    ["Website design", "4 weeks", "$1,350.00"],
    ["Website build and launch", "4 weeks", "$1,500.00"],
  ];
  return (
    <div style={page}>
      <ProposalHead title="Budget" n={5} />
      <div style={abs(54, 116, 504)}>
        <P style={{ fontSize: 10.5 }}>
          <R id="p1">One fixed price for the whole project, split by phase so you can see where the time goes.</R>
        </P>
        <div style={{ marginTop: 12, fontSize: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "7px 10px", background: "#f1f5f9", fontWeight: 700, fontSize: 8.5, color: GRAY, letterSpacing: "0.05em" }}>
            <span>PHASE</span>
            <span>LENGTH</span>
            <span style={{ textAlign: "right" }}>COST</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "9px 10px", borderBottom: "1px solid #e5e7eb" }}>
              <R id={`a${i}`}>{r[0]}</R>
              <R id={`b${i}`}>{r[1]}</R>
              <span style={{ textAlign: "right" }}>
                <R id={`c${i}`}>{r[2]}</R>
              </span>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "10px", fontWeight: 700, color: TEAL }}>
            <span>Total</span>
            <span style={{ textAlign: "right" }}>
              <R id="total">$5,250.00</R>
            </span>
          </div>
        </div>
        <P style={{ marginTop: 10 }}>
          <R id="p2">A 30% deposit starts the project. The balance is due when the website launches.</R>
        </P>
      </div>
    </div>
  );
}

function PNext() {
  return (
    <div style={page}>
      <ProposalHead title="Next Steps" n={6} />
      <div style={abs(54, 116, 504)}>
        {[
          "Review this proposal with your team.",
          "Sign the Service Agreement and pay the deposit.",
          "Book the discovery workshops for the first week.",
          "Share your current brand files and website access.",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, fontSize: 10.5 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", border: `1.5px solid ${TEAL}`, color: TEAL, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 10 }}>{i + 1}</span>
            <R id={`s${i}`}>{t}</R>
          </div>
        ))}
        <div style={{ marginTop: 30, padding: 16, borderRadius: 6, background: "#0f1a2b", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>
            <R id="q">Questions?</R>
          </div>
          <div style={{ fontSize: 10, color: "#9fb3cc", marginTop: 4 }}>
            <R id="contact">Morgan Reyes · morgan@brightwater.design · (503) 555-0142</R>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRODUCTS: [string, string, string][] = [
  ["Linen Throw Blanket", "$64", "linear-gradient(135deg,#d9c7a8,#b89b72)"],
  ["Stoneware Mug Set", "$38", "linear-gradient(135deg,#9fb8c8,#5d7f96)"],
  ["Oak Serving Board", "$45", "linear-gradient(135deg,#c89b6a,#8a5a32)"],
  ["Wool Floor Cushion", "$79", "linear-gradient(135deg,#a3b18a,#6b7d55)"],
  ["Glass Carafe", "$29", "linear-gradient(135deg,#cfe3e8,#8fb5c0)"],
  ["Cotton Napkins, set of 4", "$24", "linear-gradient(135deg,#e8b4a0,#c47a62)"],
];

function CCover() {
  return (
    <div style={{ ...page, background: "#f6f1ea" }}>
      <div style={{ ...abs(0, 0, 612), height: 470, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4 }}>
        {PRODUCTS.slice(0, 4).map((p) => (
          <div key={p[0]} style={{ background: p[2] }} />
        ))}
      </div>
      <div style={abs(54, 510, 504)}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8a5a32", fontWeight: 700 }}>
          <R id="brand">HARBOR &amp; PINE HOME GOODS</R>
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>
          <R id="title">Product Catalog 2026</R>
        </div>
        <div style={{ fontSize: 11, color: GRAY, marginTop: 6 }}>
          <R id="sub">Natural materials, made to last. Wholesale prices inside.</R>
        </div>
      </div>
    </div>
  );
}

function CGrid() {
  return (
    <div style={{ ...page, background: "#fff" }}>
      <div style={{ ...abs(54, 46, 504), fontSize: 22, fontWeight: 700 }}>
        <R id="title">Kitchen &amp; Living</R>
      </div>
      <div style={{ ...abs(54, 96, 504), display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {PRODUCTS.map((p, i) => (
          <div key={p[0]}>
            <div style={{ height: 150, borderRadius: 4, background: p[2] }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>
                <R id={`n${i}`}>{p[0]}</R>
              </span>
              <R id={`p${i}`}>{p[1]}</R>
            </div>
            <div style={{ fontSize: 8.5, color: GRAY }}>
              <R id={`s${i}`}>{`Item ${2601 + i} · Ships in 3 to 5 days`}</R>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CPrice() {
  return (
    <div style={page}>
      <div style={{ ...abs(54, 46, 504), fontSize: 22, fontWeight: 700 }}>
        <R id="title">Wholesale Price List</R>
      </div>
      <div style={{ ...abs(54, 96, 504), fontSize: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px", padding: "7px 10px", background: "#8a5a32", color: "#fff", fontWeight: 700, fontSize: 8.5 }}>
          <span>ITEM</span>
          <span>NAME</span>
          <span style={{ textAlign: "right" }}>RETAIL</span>
          <span style={{ textAlign: "right" }}>WHOLESALE</span>
        </div>
        {PRODUCTS.map((p, i) => (
          <div key={p[0]} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px", padding: "8px 10px", borderBottom: "1px solid #eee" }}>
            <span>{2601 + i}</span>
            <R id={`n${i}`}>{p[0]}</R>
            <span style={{ textAlign: "right" }}>{p[1]}</span>
            <span style={{ textAlign: "right" }}>
              <R id={`w${i}`}>{`$${Math.round(parseInt(p[1].slice(1), 10) * 0.55)}`}</R>
            </span>
          </div>
        ))}
        <P style={{ marginTop: 16, color: GRAY }}>
          <R id="terms">Minimum order $300. Prices valid until December 31, 2026.</R>
        </P>
      </div>
    </div>
  );
}

const DRAW: Record<PageKind, () => ReactNode> = {
  sa1: Sa1,
  sa2: Sa2,
  inv: Invoice,
  pcover: PCover,
  psum: PSummary,
  pappr: PApproach,
  ptime: PTimeline,
  pbudget: PBudget,
  pnext: PNext,
  ccover: CCover,
  cgrid: CGrid,
  cprice: CPrice,
  blank: () => null,
};

/** Display size of a page (points) after rotation. */
export function shown(p: PageRef) {
  const b = cropBox(p);
  return p.rot % 180 ? { w: b.h, h: b.w } : { w: b.w, h: b.h };
}

/** The part of the page that shows (the crop, or the whole page). */
export const cropBox = (p: PageRef) => p.crop ?? { x: 0, y: 0, w: p.w, h: p.h };

/**
 * One page at `k` screen pixels per point: the white sheet plus its drawing, rotated and cropped.
 * `children` are layers drawn in page points on top of the drawing (objects, find hits...).
 */
export function PageView({
  pageRef,
  k,
  ctx,
  gray,
  main,
  children,
  label,
}: {
  pageRef: PageRef;
  k: number;
  ctx: PageCtxValue;
  gray?: boolean;
  main?: boolean;
  children?: ReactNode;
  label?: string;
}) {
  const d = shown(pageRef);
  const Draw = DRAW[pageRef.kind];
  const b = cropBox(pageRef);
  const transform = `translate(${(d.w * k) / 2}px, ${(d.h * k) / 2}px) rotate(${pageRef.rot}deg) scale(${k}) translate(${-b.w / 2 - b.x}px, ${-b.h / 2 - b.y}px)`;
  return (
    <div className={c("page-box", main && "page-main")} style={{ width: d.w * k, height: d.h * k }} data-page={pageRef.key} aria-label={label}>
      <div className={c("page-inner")} style={{ width: pageRef.w, height: pageRef.h, transform }}>
        <PageCtx.Provider value={ctx}>
          <div
            className={c("page-content", ctx.editText && ctx.live && "te-on", !ctx.forms && "no-forms")}
            data-page-content={pageRef.key}
            style={{ position: "absolute", inset: 0, filter: gray ? "grayscale(1)" : undefined }}
          >
            <Draw />
          </div>
        </PageCtx.Provider>
        {children}
      </div>
    </div>
  );
}

/** Screen point -> page point, undoing the page's rotation. */
export function pagePoint(el: HTMLElement, p: PageRef, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  const d = shown(p);
  const b = cropBox(p);
  const s = r.width / d.w;
  const u = (clientX - r.left) / s;
  const v = (clientY - r.top) / s;
  let q: { x: number; y: number };
  switch (((p.rot % 360) + 360) % 360) {
    case 90:
      q = { x: v, y: b.h - u };
      break;
    case 180:
      q = { x: b.w - u, y: b.h - v };
      break;
    case 270:
      q = { x: b.w - v, y: u };
      break;
    default:
      q = { x: u, y: v };
  }
  return { x: q.x + b.x, y: q.y + b.y };
}
