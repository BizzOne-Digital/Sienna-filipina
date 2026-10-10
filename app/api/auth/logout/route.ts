import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { handleError, isSameOrigin, jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return jsonError(403, "Cross-origin request rejected");
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
