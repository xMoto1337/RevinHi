import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { FEEDBACK_APPS, FEEDBACK_KINDS, MAX_PER_HOUR, MESSAGE_MAX, MESSAGE_MIN, MIN_FILL_MS } from "@/lib/feedback";
import { SUPPORT_EMAIL } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Feedback box. Saves the message to Supabase (`feedback` table, listed in /admin/feedback) AND emails
 * an alert through Resend, so a failed or rate-limited email never loses a message.
 *
 * Spam protection, none of which the visitor sees:
 *  - a hidden "website" field only bots fill in (silently accepted and dropped),
 *  - forms sent less than MIN_FILL_MS after the page loaded (silently dropped),
 *  - MAX_PER_HOUR messages per visitor, keyed by a one-way daily IP code (the IP is never stored),
 *  - messages stuffed with links are refused.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  // Bots: pretend it worked so they don't adapt.
  const loadedAt = Number(body.t);
  if (str(body.website, 200) || !Number.isFinite(loadedAt) || Date.now() - loadedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  const app = str(body.app, 40);
  const kind = str(body.kind, 10);
  const message = str(body.message, MESSAGE_MAX + 1);
  const email = str(body.email, 200);
  const page = str(body.page, 300) || null;

  if (!FEEDBACK_APPS.some((a) => a.id === app)) return bad("Please pick which app this is about.");
  if (!FEEDBACK_KINDS.some((k) => k.id === kind)) return bad("Please pick idea, bug or other.");
  if (message.length < MESSAGE_MIN) return bad("Please write a little more.");
  if (message.length > MESSAGE_MAX) return bad(`Please keep it under ${MESSAGE_MAX} characters.`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("That email doesn't look right. You can leave it empty.");
  if ((message.match(/https?:\/\//gi) ?? []).length > 3) return bad("Please include fewer links.");

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const salt = process.env.ANALYTICS_SALT ?? process.env.ADMIN_SECRET ?? "revinhi";
  const day = new Date().toISOString().slice(0, 10);
  const ipHash = createHash("sha256").update(`${salt}|feedback|${day}|${ip}`).digest("hex").slice(0, 32);

  let saved = false;
  try {
    const db = getSupabaseAdmin();
    const { count, error: countError } = await db
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PER_HOUR) {
      return NextResponse.json({ error: "You've sent a lot of messages. Please try again in an hour." }, { status: 429 });
    }
    const { error } = await db.from("feedback").insert({
      app,
      kind,
      message,
      email: email || null,
      page,
      ip_hash: ipHash,
      user_agent: str(request.headers.get("user-agent"), 300) || null,
    });
    if (error) throw error;
    saved = true;
  } catch (err) {
    console.error("Feedback: database save failed", err);
  }

  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const appLabel = FEEDBACK_APPS.find((a) => a.id === app)?.label ?? app;
      const kindLabel = FEEDBACK_KINDS.find((k) => k.id === kind)?.label ?? kind;
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "RevinHi <onboarding@resend.dev>",
        to: process.env.FEEDBACK_EMAIL_TO?.trim() || SUPPORT_EMAIL,
        ...(email ? { replyTo: email } : {}),
        subject: `Feedback: ${kindLabel} for ${appLabel}`,
        text: [
          `${kindLabel} for ${appLabel}`,
          `From: ${email || "(no email given)"}`,
          ...(page ? [`Page: ${page}`] : []),
          ...(saved ? [] : ["NOTE: this one did NOT save to the database."]),
          "",
          message,
        ].join("\n"),
      });
      if (error) throw error;
      emailed = true;
    } catch (err) {
      console.error("Feedback: alert email failed", err);
    }
  }

  if (!saved && !emailed) {
    return NextResponse.json(
      { error: `Sorry, that didn't send. Please try again, or email us at ${SUPPORT_EMAIL}.` },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
