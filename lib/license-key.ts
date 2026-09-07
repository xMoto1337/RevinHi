import { createHmac, randomBytes } from "crypto";

/**
 * Generates RevinHi Performance license keys. This MUST stay byte-for-byte identical to the
 * algorithm in the app's RevinHi.Core/Licensing/LicenseValidator.cs and the tools/RevinHi.KeyGen
 * console tool - same Base32 alphabet, same serial/checksum lengths, same HMAC-SHA256 construction.
 * A key is an 8-character random serial + an 8-character checksum (first 5 bytes of
 * HMAC-SHA256(secret, serial), Base32-encoded), displayed grouped in 4s, e.g. "7K2P-QX91-4F3D-M8HB".
 *
 * LICENSE_SECRET_HEX (a 64-character hex string = 32 bytes) must be the exact same value as the
 * `SharedSecret` constant in LicenseValidator.cs, or keys generated here won't validate in the app.
 */
const BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SERIAL_LENGTH = 8;
const CHECKSUM_BYTES = 5;

function encodeBase32(fiveBytes: Buffer): string {
  let buffer = BigInt(0);
  for (let i = 0; i < CHECKSUM_BYTES; i++) {
    buffer = (buffer << BigInt(8)) | BigInt(fiveBytes[i]);
  }

  let result = "";
  for (let i = 0; i < 8; i++) {
    const shift = BigInt(5 * (7 - i));
    const index = Number((buffer >> shift) & BigInt(0b11111));
    result += BASE32_ALPHABET[index];
  }

  return result;
}

function generateRandomSerial(): string {
  // 256 is an exact multiple of 32, so this modulo introduces no bias.
  const bytes = randomBytes(SERIAL_LENGTH);
  let serial = "";
  for (let i = 0; i < SERIAL_LENGTH; i++) {
    serial += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }

  return serial;
}

function computeChecksum(serial: string, secret: Buffer): string {
  const hash = createHmac("sha256", secret).update(Buffer.from(serial, "ascii")).digest();
  return encodeBase32(hash.subarray(0, CHECKSUM_BYTES));
}

export function generateLicenseKey(secretHex: string): string {
  const secret = Buffer.from(secretHex, "hex");
  const serial = generateRandomSerial();
  const checksum = computeChecksum(serial, secret);
  const raw = serial + checksum;
  return raw.match(/.{1,4}/g)!.join("-");
}
