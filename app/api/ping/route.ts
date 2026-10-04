import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Anonymous "this copy is running" ping from the apps (at launch and every 12 hours).
 * Body: { install_id: uuid, product: "desktop", version: "0.1.9", tier: "free" | "pro" }.
 * The install ID is random, made by the app on first run - no names, emails, keys or hardware IDs.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRODUCTS = new Set(["desktop", "performance"]);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const installId = String(body.install_id ?? "");
  const product = String(body.product ?? "");
  if (!UUID.test(installId) || !PRODUCTS.has(product)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const version = String(body.version ?? "").slice(0, 20);
  const tier = body.tier === "pro" ? "pro" : "free";

  try {
    const { error } = await getSupabaseAdmin().rpc("record_ping", {
      p_install_id: installId,
      p_product: product,
      p_version: version,
      p_tier: tier,
      p_country: request.headers.get("x-vercel-ip-country"),
    });
    if (error) throw error;
  } catch (e) {
    console.error("ping failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
