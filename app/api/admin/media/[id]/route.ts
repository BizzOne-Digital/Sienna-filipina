import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { jsonError, withAdmin } from "@/lib/http";
import { findUploadUsage } from "@/lib/uploads/store";
import { StoredUpload } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Deletes an upload from the library, refusing while any content still references it. */
export const DELETE = withAdmin<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return jsonError(404, "Not found");
  await connectDB();
  const doc = await StoredUpload.findById(id).select("folder filename").lean();
  if (!doc) return jsonError(404, "Not found");
  const url = `/api/uploads/${doc.folder}/${doc.filename}`;
  const usage = await findUploadUsage(url);
  if (usage.length) return jsonError(409, `This image is still in use: ${usage.join(", ")}. Replace it there first.`);
  await StoredUpload.deleteOne({ _id: id });
  return NextResponse.json({ success: true });
});
