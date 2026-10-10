import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { withAdmin, jsonError } from "@/lib/http";
import { ALLOWED_MIME, CHUNK_SIZE, MAX_UPLOAD_BYTES, UPLOAD_FOLDERS } from "@/lib/uploads/constants";
import { UploadSession } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_OPEN_SESSIONS_PER_ADMIN = 3;
const SESSION_TTL_MS = 30 * 60 * 1000;

const InitSchema = z.object({
  folder: z.enum(UPLOAD_FOLDERS),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES, "Images must be 8 MB or smaller"),
  type: z.enum(ALLOWED_MIME, { message: "Only PNG, JPEG, WebP and GIF images are allowed" }),
  name: z.string().max(200).optional(),
});

/** Starts a chunked upload session bound to the signed-in admin. */
export const POST = withAdmin(async (req, _ctx, admin) => {
  const body = InitSchema.parse(await req.json());
  await connectDB();
  const open = await UploadSession.countDocuments({ admin: admin.id, expiresAt: { $gt: new Date() } });
  if (open >= MAX_OPEN_SESSIONS_PER_ADMIN) {
    return jsonError(429, "Too many uploads in progress. Finish or cancel one first.");
  }
  const totalChunks = Math.ceil(body.size / CHUNK_SIZE);
  const session = await UploadSession.create({
    admin: admin.id,
    folder: body.folder,
    originalName: body.name ?? "",
    declaredType: body.type,
    totalSize: body.size,
    chunkSize: CHUNK_SIZE,
    totalChunks,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return NextResponse.json(
    { success: true, uploadId: String(session._id), chunkSize: CHUNK_SIZE, totalChunks },
    { status: 201 }
  );
});
