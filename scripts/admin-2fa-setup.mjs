// Sets up the admin login's authenticator-app code (ADMIN_TOTP_SECRET).
//
//   node scripts/admin-2fa-setup.mjs <folder-for-the-qr-image>
//
// 1. Makes a new random secret and writes ADMIN_TOTP_SECRET=... into .env.local (replacing any old one).
// 2. Saves admin-2fa-qr.png in the given folder: scan it with Google Authenticator / Microsoft
//    Authenticator / Authy, then DELETE the picture.
// 3. Copy the ADMIN_TOTP_SECRET line from .env.local into Vercel (Settings > Environment Variables)
//    and redeploy. Running this again makes a new secret: the old phone entry stops working.
//
// The secret is never printed.
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const outDir = process.argv[2];
if (!outDir || !fs.existsSync(outDir)) {
  console.error("Usage: node scripts/admin-2fa-setup.mjs <existing folder for the QR picture>");
  process.exit(1);
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const bytes = randomBytes(20); // 160 bits, the usual size for authenticator apps
let bits = "";
for (const b of bytes) bits += b.toString(2).padStart(8, "0");
let secret = "";
for (let i = 0; i + 5 <= bits.length; i += 5) secret += B32[parseInt(bits.slice(i, i + 5), 2)];

const envPath = path.join(process.cwd(), ".env.local");
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const eol = env.includes("\r\n") ? "\r\n" : "\n";
const line = `ADMIN_TOTP_SECRET=${secret}`;
env = /^ADMIN_TOTP_SECRET=.*$/m.test(env)
  ? env.replace(/^ADMIN_TOTP_SECRET=.*$/m, line)
  : env + (env === "" || env.endsWith("\n") ? "" : eol) + line + eol;
fs.writeFileSync(envPath, env);

const uri = `otpauth://totp/${encodeURIComponent("RevinHi:Admin")}?secret=${secret}&issuer=RevinHi&algorithm=SHA1&digits=6&period=30`;
const qrPath = path.join(outDir, "admin-2fa-qr.png");
await QRCode.toFile(qrPath, uri, { width: 360, margin: 2 });

console.log("Wrote ADMIN_TOTP_SECRET to .env.local");
console.log(`QR picture: ${qrPath}`);
console.log("Scan it with your authenticator app, then delete the picture.");
