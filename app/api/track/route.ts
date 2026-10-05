import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * First-party analytics beacon (components/Analytics.tsx). No cookies; the visitor id is a
 * daily-rotating hash of IP + user agent + date + a server secret, so nothing identifies a person
 * and nobody is followed across days. Bots and /admin are ignored. Always 204, never blocks a page.
 */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|vercel/i;

function device(ua: string): string {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}
function browser(ua: string): string {
  if (/tiktok|musical_ly|bytedance/i.test(ua)) return "TikTok in-app";
  if (/instagram/i.test(ua)) return "Instagram in-app";
  if (/fban|fbav/i.test(ua)) return "Facebook in-app";
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}
function os(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/iphone|ipad|ios/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}
function refHost(ref: string | undefined, self: string): string | null {
  if (!ref) return null;
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    return h === self ? null : h.slice(0, 100);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const path = String(body.path ?? "/").slice(0, 200);
  if (path.startsWith("/admin")) return new NextResponse(null, { status: 204 });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.ANALYTICS_SALT ?? process.env.ADMIN_SECRET ?? "revinhi";
  const visitor = createHash("sha256").update(`${ip}|${ua}|${day}|${salt}`).digest("hex").slice(0, 20);
  const self = request.nextUrl.hostname.replace(/^www\./, "");

  try {
    const db = getSupabaseAdmin();
    if (body.type === "event") {
      await db.from("site_events").insert({
        name: String(body.name ?? "event").slice(0, 40),
        path,
        label: body.label ? String(body.label).slice(0, 200) : null,
        visitor,
      });
    } else {
      const utm = (k: string) => (body[k] ? String(body[k]).slice(0, 80) : null);
      await db.from("pageviews").insert({
        path,
        referrer_host: refHost(body.referrer ? String(body.referrer) : undefined, self),
        utm_source: utm("utm_source"),
        utm_medium: utm("utm_medium"),
        utm_campaign: utm("utm_campaign"),
        country: request.headers.get("x-vercel-ip-country"),
        device: device(ua),
        browser: browser(ua),
        os: os(ua),
        visitor,
      });
    }
  } catch (e) {
    console.error("track failed", e);
  }
  return new NextResponse(null, { status: 204 });
}
