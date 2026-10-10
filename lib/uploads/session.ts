import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { UploadChunk, UploadSession } from "@/models";

/** Loads an unexpired upload session owned by this admin, or null. */
export async function loadOwnedSession(id: string, adminId: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  return UploadSession.findOne({ _id: id, admin: adminId, expiresAt: { $gt: new Date() } });
}

export async function discardSession(id: string) {
  await connectDB();
  await UploadChunk.deleteMany({ session: id });
  await UploadSession.deleteOne({ _id: id });
}

export function expectedChunkSize(totalSize: number, chunkSize: number, index: number, totalChunks: number) {
  return index === totalChunks - 1 ? totalSize - chunkSize * (totalChunks - 1) : chunkSize;
}
