import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getAdmin, type SessionAdmin } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/site-url";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

/**
 * CSRF defence for cookie-authenticated mutations: the request must come from this site.
 * Browsers always send Origin on cross-site POST/PUT/DELETE; Sec-Fetch-Site is the fallback.
 */
export function isSameOrigin(req: NextRequest | Request) {
  const origin = req.headers.get("origin");
  const allowed = new Set<string>();
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  if (host) allowed.add(`${proto}://${host}`);
  allowed.add(getSiteUrl());
  if (origin) return allowed.has(origin);
  return req.headers.get("sec-fetch-site") === "same-origin";
}

type Handler<C> = (req: NextRequest, ctx: C, admin: SessionAdmin) => Promise<Response>;

/** Wraps an admin API route: session check on every method, Origin check on mutations, error mapping. */
export function withAdmin<C>(handler: Handler<C>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) {
        return jsonError(403, "Cross-origin request rejected");
      }
      const admin = await getAdmin();
      if (!admin) return jsonError(401, "Authentication required");
      return await handler(req, ctx, admin);
    } catch (e) {
      return handleError(e);
    }
  };
}

export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    const first = e.issues[0];
    return jsonError(400, first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input", {
      issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const err = e as { code?: number; keyValue?: Record<string, unknown>; name?: string; message?: string };
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    return jsonError(409, `That ${field} is already in use`);
  }
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return jsonError(400, err.message ?? "Invalid input");
  }
  console.error(e);
  return jsonError(500, "Something went wrong. Please try again.");
}
