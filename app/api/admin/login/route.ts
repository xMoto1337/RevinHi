import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  ADMIN_COOKIE,
  adminLoginConfigured,
  createSessionToken,
  passwordMatches,
  sessionCookieOptions,
  totpStepFor,
} from "@/lib/admin-auth";
import { SUPPORT_EMAIL } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase";

const PER_IP_FAILS = 5; // per 15 minutes
const ALL_FAILS = 30; // per hour, from everywhere - stops guessing spread over many addresses

/**
 * Admin login: { password, code }. One combined "wrong password or code" answer so a guesser can't
 * tell which part was right. Every try is logged in admin_login_attempts (IP kept only as a one-way
 * code); too many wrong tries locks the login. A used code can't be used again. Emails an alert on
 * every good login and on every lock-out. Fails closed if the attempts table can't be read.
 */
export async function POST(request: NextRequest) {
  if (!adminLoginConfigured()) {
    return NextResponse.json({ error: "Admin login isn't set up yet." }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const code = typeof body.code === "string" ? body.code.replace(/\s+/g, "") : "";

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const salt = process.env.ANALYTICS_SALT ?? process.env.ADMIN_SECRET ?? "revinhi";
  const ipHash = createHash("sha256").update(`${salt}|admin-login|${ip}`).digest("hex").slice(0, 32);
  const country = request.headers.get("x-vercel-ip-country");
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300);

  const db = getSupabaseAdmin();
  const since = (ms: number) => new Date(Date.now() - ms).toISOString();
  let lastStep = -1;
  try {
    const [mine, all, last] = await Promise.all([
      db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).eq("ok", false).gte("created_at", since(15 * 60_000)),
      db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("ok", false).gte("created_at", since(3600_000)),
      db.from("admin_login_attempts").select("totp_step").eq("ok", true).order("totp_step", { ascending: false }).limit(1),
    ]);
    if (mine.error || all.error || last.error) throw mine.error ?? all.error ?? last.error;
    if ((mine.count ?? 0) >= PER_IP_FAILS) return tooMany("Too many wrong tries. Wait 15 minutes and try again.");
    if ((all.count ?? 0) >= ALL_FAILS) return tooMany("Login is paused for up to an hour after too many wrong tries.");
    lastStep = last.data?.[0]?.totp_step ?? -1;
  } catch (err) {
    console.error("Admin login: attempts check failed", err);
    return NextResponse.json({ error: "Can't check the login right now. Did you run the admin SQL in Supabase?" }, { status: 503 });
  }

  const passOk = passwordMatches(password);
  const step = totpStepFor(code);
  const ok = passOk && step !== null && step > lastStep;

  await db.from("admin_login_attempts").insert({ ip_hash: ipHash, ok, totp_step: ok ? step : null, country, user_agent: userAgent });

  if (!ok) {
    const { count } = await db
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("ok", false)
      .gte("created_at", since(15 * 60_000));
    if ((count ?? 0) === PER_IP_FAILS) {
      await alert("RevinHi admin: login locked after wrong tries", `${PER_IP_FAILS} wrong admin logins in a row.`, country, userAgent, passOk);
    }
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return NextResponse.json({ error: "Wrong password or code." }, { status: 401 });
  }

  await alert("RevinHi admin: new login", "Someone just logged in to the RevinHi admin.", country, userAgent);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
  return res;
}

function tooMany(error: string) {
  return NextResponse.json({ error }, { status: 429 });
}

async function alert(subject: string, line: string, country: string | null, userAgent: string, passwordWasRight?: boolean) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "RevinHi <onboarding@resend.dev>",
      to: process.env.ADMIN_ALERT_EMAIL?.trim() || process.env.FEEDBACK_EMAIL_TO?.trim() || SUPPORT_EMAIL,
      subject,
      text: [
        line,
        `Time: ${new Date().toUTCString()}`,
        `Country: ${country ?? "unknown"}`,
        `Browser: ${userAgent || "unknown"}`,
        ...(passwordWasRight ? ["", "The PASSWORD was right on the last try (the code was wrong). Change ADMIN_SECRET."] : []),
        "",
        "If this wasn't you, change ADMIN_SECRET and ADMIN_TOTP_SECRET in Vercel. That signs everyone out.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("Admin login: alert email failed", err);
  }
}
