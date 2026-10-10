import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters)");
  return s;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** Keyed hash so a leaked database alone cannot be used to forge session/order tokens. */
export function hmac(value: string, purpose: string) {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
