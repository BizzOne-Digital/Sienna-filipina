import { toBuffer } from "@/lib/db/buffer";
import { connectDB } from "@/lib/db/connect";
import { isUploadFolder } from "@/lib/uploads/constants";
import { isSafeFilename } from "@/lib/uploads/store";
import { StoredUpload } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ folder: string; filename: string }> };

const SLICE = 64 * 1024;

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" },
  });
}

/** Public, read-only delivery of uploaded images stored in MongoDB. */
export async function GET(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  let filename: string;
  try {
    filename = decodeURIComponent(params.filename);
  } catch {
    return notFound();
  }
  if (!isUploadFolder(params.folder) || !isSafeFilename(filename)) return notFound();

  await connectDB();
  const doc = await StoredUpload.findOne({ folder: params.folder, filename })
    .select("+data mimeType size")
    .lean();
  if (!doc) return notFound();

  const etag = `"${filename}"`;
  const headers = {
    "Content-Type": doc.mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    ETag: etag,
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

  const bytes = toBuffer(doc.data);

  // Pull-based stream: the next slice is enqueued only when the consumer asks for it,
  // so a slow client applies backpressure instead of buffering the whole image downstream.
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) return controller.close();
      const end = Math.min(offset + SLICE, bytes.length);
      controller.enqueue(new Uint8Array(bytes.buffer, bytes.byteOffset + offset, end - offset));
      offset = end;
    },
  });

  return new Response(stream, { status: 200, headers: { ...headers, "Content-Length": String(bytes.length) } });
}
