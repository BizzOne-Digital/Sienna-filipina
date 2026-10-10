import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { connectDB } from "@/lib/db/connect";
import { AdminSession, AdminUser } from "@/models";
import { hmac, randomToken } from "./crypto";

const isProd = process.env.NODE_ENV === "production";
// "__Host-" prefix requires Secure + Path=/ and no Domain, which pins the cookie to this host.
export const SESSION_COOKIE = isProd ? "__Host-sf_admin" : "sf_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export type SessionAdmin = { id: string; email: string; name: string };

export async function createSession(adminId: string) {
  await connectDB();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const ua = (await headers()).get("user-agent")?.slice(0, 200) ?? "";
  await AdminSession.create({ tokenHash: hmac(token, "session"), admin: adminId, expiresAt, userAgent: ua });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await connectDB();
    await AdminSession.deleteOne({ tokenHash: hmac(token, "session") });
  }
  jar.delete(SESSION_COOKIE);
}

/** Validates the session cookie against the database. Cached per request. */
export const getAdmin = cache(async (): Promise<SessionAdmin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  await connectDB();
  const session = await AdminSession.findOne({
    tokenHash: hmac(token, "session"),
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) return null;
  const admin = await AdminUser.findOne({ _id: session.admin, active: true }).lean();
  if (!admin) return null;
  return { id: String(admin._id), email: admin.email, name: admin.name };
});

/** For admin server components: redirects to login when unauthenticated. */
export async function requireAdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
