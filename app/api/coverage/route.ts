import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * RevinHi Drivers' missing-driver report: after a scan, the chips no driver source had anything for.
 * Body: { product: "drivers", version: "1.0.0", devices: ["pci:8086:02f0", "usb:0bda:b00c", "hdaudio:10ec:1220", "acpi:AMDI0010"] }.
 * Only the bus and the maker's vendor/device numbers - no install ID, names, serial numbers or board-maker
 * numbers - so nothing here points to a PC or a person. Counted per chip (supabase/stats.sql
 * record_coverage) and shown at /admin as "Missing coverage": the drivers to add to the catalog next.
 */
const PRODUCTS = new Set(["drivers"]);
const DEVICE = /^(pci|usb|hdaudio):[0-9a-f]{4}:[0-9a-f]{4}$|^acpi:[A-Z0-9]{3,4}[0-9A-F]{4}$/;
const MAX_DEVICES = 64;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const product = String(body.product ?? "");
  const list = Array.isArray(body.devices) ? body.devices : null;
  if (!PRODUCTS.has(product) || !list || list.length === 0 || list.length > MAX_DEVICES) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const devices = [...new Set(list.map(String))];
  if (!devices.every((d) => DEVICE.test(d))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const { error } = await getSupabaseAdmin().rpc("record_coverage", { p_product: product, p_devices: devices });
    if (error) throw error;
  } catch (e) {
    console.error("coverage failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
