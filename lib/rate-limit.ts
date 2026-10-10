import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db/connect";
import { RateLimit } from "@/models";

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export function hashIp(ip: string) {
  return createHash("sha256").update(`sf-ip:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Fixed-window limiter stored in MongoDB so it holds across serverless instances.
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  await connectDB();
  const now = new Date();
  const doc = await RateLimit.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { new: true }
  ).lean();
  if (doc) return doc.count <= limit;
  try {
    await RateLimit.updateOne(
      { key },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) } },
      { upsert: true }
    );
  } catch {
    // Concurrent upsert race; the other request created the window.
  }
  return true;
}

export async function resetRateLimit(key: string) {
  await connectDB();
  await RateLimit.deleteOne({ key });
}
