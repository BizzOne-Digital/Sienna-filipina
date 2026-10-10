import { NextResponse } from "next/server";
import { jsonError, withAdmin } from "@/lib/http";
import { discardSession, loadOwnedSession } from "@/lib/uploads/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Cancels an upload session and removes its chunks. */
export const DELETE = withAdmin<Ctx>(async (_req, ctx, admin) => {
  const { id } = await ctx.params;
  const session = await loadOwnedSession(id, admin.id);
  if (!session) return jsonError(404, "Upload session not found");
  await discardSession(id);
  return NextResponse.json({ success: true });
});
