import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Every "Download" button goes through here: log one row in `downloads`, then redirect to the
 * installer in /public. Logging is best-effort - a stats outage must never block a download.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ product: string }> }) {
  const { product: slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug && p.downloadUrl && p.status === "available");
  if (!product?.downloadUrl) {
    return NextResponse.json({ error: "unknown_product" }, { status: 404 });
  }

  try {
    await getSupabaseAdmin()
      .from("downloads")
      .insert({
        product: product.slug,
        country: request.headers.get("x-vercel-ip-country"),
        referrer: request.headers.get("referer")?.slice(0, 300) ?? null,
      });
  } catch (e) {
    console.error("download log failed", e);
  }

  return NextResponse.redirect(new URL(product.downloadUrl, request.url), 302);
}
