import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Admin login: password (ADMIN_SECRET) + a 6-digit code from an authenticator app (ADMIN_TOTP_SECRET,
 * base32, made by scripts/admin-2fa-setup.mjs). A good login sets an httpOnly, SameSite=Strict cookie
 * holding a signed expiry - the password itself never lives in the browser.
 *
 * Changing ADMIN_SECRET or ADMIN_TOTP_SECRET signs everyone out (the cookie key is made from both).
 * If either is missing, nobody can log in.
 */

export const ADMIN_COOKIE = "rh_admin";
export const SESSION_HOURS = 12;

function secrets() {
  const password = process.env.ADMIN_SECRET?.trim();
  const totp = process.env.ADMIN_TOTP_SECRET?.trim().replace(/\s+/g, "").toUpperCase();
  return password && totp ? { password, totp } : null;
}

export function adminLoginConfigured() {
  return secrets() !== null;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const b64url = (b: Buffer) => b.toString("base64url");

function sessionKey(s: { password: string; totp: string }) {
  return sha256(`rh-admin-session|${s.password}|${s.totp}`);
}

// ---------- password ----------

export function passwordMatches(given: string): boolean {
  const s = secrets();
  if (!s) return false;
  return timingSafeEqual(sha256(given), sha256(s.password));
}

// ---------- authenticator code (RFC 6238 TOTP: SHA-1, 30 s, 6 digits) ----------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input.replace(/=+$/, "")) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error("ADMIN_TOTP_SECRET is not valid base32");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function codeForStep(key: Buffer, step: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", key).update(msg).digest();
  const off = h[h.length - 1] & 0x0f;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 1_000_000).padStart(6, "0");
}

/** Returns the 30-second step the code belongs to (allowing one step of clock drift), or null. */
export function totpStepFor(code: string, now = Date.now()): number | null {
  const s = secrets();
  if (!s || !/^\d{6}$/.test(code)) return null;
  const key = base32Decode(s.totp);
  const current = Math.floor(now / 30_000);
  for (const step of [current - 1, current, current + 1]) {
    const expected = codeForStep(key, step);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(code))) return step;
  }
  return null;
}

// ---------- session cookie ----------

export function createSessionToken(): string {
  const s = secrets();
  if (!s) throw new Error("Admin login is not configured");
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = `${exp}.${b64url(randomBytes(12))}`;
  const sig = b64url(createHmac("sha256", sessionKey(s)).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const s = secrets();
  if (!s || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  const expected = createHmac("sha256", sessionKey(s)).update(`${exp}.${nonce}`).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return Number(exp) > Date.now();
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};

/** For API route handlers. */
export function isAdminRequest(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

/** For server components / layouts. */
export async function isAdminSession(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}
