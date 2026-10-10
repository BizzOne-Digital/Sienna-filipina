import { NextResponse } from "next/server";
import { toBuffer } from "@/lib/db/buffer";
import { jsonError, withAdmin } from "@/lib/http";
import { isUploadFolder } from "@/lib/uploads/constants";
import { discardSession, expectedChunkSize, loadOwnedSession } from "@/lib/uploads/session";
import { UploadError, saveImage } from "@/lib/uploads/store";
import { UploadChunk, UploadSession } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Reassembles chunks in memory, validates the image and saves one StoredUpload. */
export const POST = withAdmin<Ctx>(async (_req, ctx, admin) => {
  const { id } = await ctx.params;
  const session = await loadOwnedSession(id, admin.id);
  if (!session) return jsonError(404, "Upload session not found or expired");

  // Atomic open -> completing transition prevents double completion.
  const claimed = await UploadSession.findOneAndUpdate(
    { _id: session._id, status: "open" },
    { $set: { status: "completing" } },
    { new: true }
  );
  if (!claimed) return jsonError(409, "Upload is already completing");

  try {
    const chunks = await UploadChunk.find({ session: session._id }).sort({ index: 1 }).lean();
    if (chunks.length !== session.totalChunks) {
      await UploadSession.updateOne({ _id: session._id }, { $set: { status: "open" } });
      return jsonError(400, `Missing chunks: received ${chunks.length} of ${session.totalChunks}`);
    }
    const parts: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const expected = expectedChunkSize(session.totalSize, session.chunkSize, i, session.totalChunks);
      const buf = toBuffer(c.data);
      if (c.index !== i || buf.length !== expected) {
        await discardSession(id);
        return jsonError(400, "Upload chunks are inconsistent; please upload again");
      }
      parts.push(buf);
    }
    const data = Buffer.concat(parts);
    if (data.length !== session.totalSize) {
      await discardSession(id);
      return jsonError(400, "Final size does not match the declared size");
    }
    if (!isUploadFolder(session.folder)) return jsonError(400, "Invalid folder");

    const result = await saveImage({
      data,
      folder: session.folder,
      adminId: admin.id,
      originalName: session.originalName,
    });
    await discardSession(id);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    await discardSession(id);
    if (e instanceof UploadError) return jsonError(e.status, e.message);
    throw e;
  }
});
