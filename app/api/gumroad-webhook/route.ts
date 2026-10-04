import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateLicenseKey } from "@/lib/license-key";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Gumroad's "Ping" webhook: configured account-wide under Settings -> Advanced -> "Ping" URL, it
 * POSTs application/x-www-form-urlencoded data here on every sale (across ALL your products, not
 * just this one - hence the seller_id/product_name checks below). Confirmed field names (email,
 * price, product_name, seller_id, refunded) against a real production handler on GitHub, since
 * Gumroad's own docs pages are JS-rendered and didn't yield a plain-text field reference.
 *
 * Gumroad has no HMAC/signature verification for Ping - matching seller_id against your own
 * account is the only verification it offers, so that's what's checked here.
 *
 * Two apps are sold on the same account, each validating keys against its OWN secret: a sale of
 * RevinHi Desktop (product_name "RevinHi Desktop", or GUMROAD_PRODUCT_NAME_DESKTOP) is signed with
 * LICENSE_SECRET_HEX_DESKTOP; every other sale goes down the original RevinHi Performance path
 * (GUMROAD_PRODUCT_NAME filter + LICENSE_SECRET_HEX), unchanged.
 */
type Fulfillment = { app: string; secretEnv: "LICENSE_SECRET_HEX" | "LICENSE_SECRET_HEX_DESKTOP" };

const PERFORMANCE: Fulfillment = { app: "RevinHi Performance", secretEnv: "LICENSE_SECRET_HEX" };
const DESKTOP: Fulfillment = { app: "RevinHi Desktop", secretEnv: "LICENSE_SECRET_HEX_DESKTOP" };

function isDesktopProduct(productName: string | null): boolean {
  const desktopName = process.env.GUMROAD_PRODUCT_NAME_DESKTOP || DESKTOP.app;
  return !!productName && productName.trim().toLowerCase() === desktopName.trim().toLowerCase();
}

/** Sales count for /admin/stats. Best-effort: a stats outage must never stop a key email. */
async function logSale(row: { sale_id: string; product: string; price_cents?: number | null; refunded: boolean }) {
  try {
    const { error } = await getSupabaseAdmin().from("sales").upsert(row, { onConflict: "sale_id" });
    if (error) throw error;
  } catch (e) {
    console.error("sale log failed", e);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const params = new URLSearchParams(body);

  const sellerId = params.get("seller_id");
  const expectedSellerId = process.env.GUMROAD_SELLER_ID;
  if (!expectedSellerId || sellerId !== expectedSellerId) {
    // Not our account - either a misconfigured ping or a spoofed request. Reply 200 either way so
    // Gumroad doesn't treat this as a delivery failure and retry. Logged so that a first real test
    // purchase (before GUMROAD_SELLER_ID is even known/set) reveals the real seller_id in the Vercel
    // function logs - no separate Gumroad API/OAuth call needed just to find this value.
    console.log(`Ping seller_id mismatch - received "${sellerId}", expected "${expectedSellerId}"`);
    return NextResponse.json({ ok: true, skipped: "seller_id_mismatch" });
  }

  const productName = params.get("product_name");
  const product = isDesktopProduct(productName) ? DESKTOP : PERFORMANCE;

  const expectedProductName = process.env.GUMROAD_PRODUCT_NAME;
  if (product === PERFORMANCE && expectedProductName && productName !== expectedProductName) {
    // A different product on the same Gumroad account - not ours to fulfill.
    return NextResponse.json({ ok: true, skipped: "different_product" });
  }

  const slug = product === DESKTOP ? "desktop" : "performance";
  const saleId = params.get("sale_id");

  if (params.get("refunded") === "true") {
    if (saleId) await logSale({ sale_id: saleId, product: slug, refunded: true });
    return NextResponse.json({ ok: true, skipped: "refunded" });
  }

  const email = params.get("email");
  if (!email) {
    return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
  }

  const secretHex = process.env[product.secretEnv];
  if (!secretHex) {
    console.error(`${product.secretEnv} is not set - cannot generate a ${product.app} key.`);
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const key = generateLicenseKey(secretHex);

  // Logged so a lost-key support request can at least be cross-referenced against these logs until
  // there's a proper database recording issued keys per sale.
  console.log(`Issued ${product.app} key to ${email} for sale_id=${saleId}`);
  if (saleId) await logSale({ sale_id: saleId, product: slug, price_cents: Number(params.get("price")) || null, refunded: false });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "RevinHi Performance <onboarding@resend.dev>",
    to: email,
    subject: `Your ${product.app} license key`,
    html: `
      <div style="font-family: -apple-system, sans-serif; background:#020203; color:#f5f7fb; padding:32px; border-radius:12px;">
        <h1 style="font-size:20px; margin:0 0 16px;">Thanks for grabbing ${product.app}!</h1>
        <p style="font-size:14px; color:#b7bcc9; margin:0 0 20px;">Here's your activation key - paste it into the app on first launch:</p>
        <div style="font-family: monospace; font-size:20px; letter-spacing:2px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:10px; padding:16px; text-align:center;">
          ${key}
        </div>
        <p style="font-size:13px; color:#7d8290; margin:24px 0 0;">This key works on every current and future version of RevinHi - no need to buy again for updates.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend failed to send license key email:", error);
    return NextResponse.json({ ok: false, error: "email_send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
