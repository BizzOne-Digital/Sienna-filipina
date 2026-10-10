import { NextResponse } from "next/server";
import { jsonError, withAdmin } from "@/lib/http";
import { expectedChunkSize, loadOwnedSession } from "@/lib/uploads/session";
import { UploadChunk } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; index: string }> };

/** Stores one chunk (raw bytes). Re-sending the same index replaces it, so retries are idempotent. */
export const PUT = withAdmin<Ctx>(async (req, ctx, admin) => {
  const { id, index: rawIndex } = await ctx.params;
  if (!/^\d{1,3}$/.test(rawIndex)) return jsonError(400, "Invalid chunk index");
  const index = Number(rawIndex);

  const session = await loadOwnedSession(id, admin.id);
  if (!session) return jsonError(404, "Upload session not found or expired");
  if (session.status !== "open") return jsonError(409, "Upload is already completing");
  if (index >= session.totalChunks) return jsonError(400, "Chunk index out of range");

  const expected = expectedChunkSize(session.totalSize, session.chunkSize, index, session.totalChunks);
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared && declared !== expected) return jsonError(400, `Chunk ${index} must be exactly ${expected} bytes`);

  const data = Buffer.from(await req.arrayBuffer());
  if (data.length !== expected) return jsonError(400, `Chunk ${index} must be exactly ${expected} bytes`);

  await UploadChunk.updateOne(
    { session: session._id, index },
    { $set: { size: data.length, data, expiresAt: session.expiresAt } },
    { upsert: true }
  );
  return NextResponse.json({ success: true, index });
});
