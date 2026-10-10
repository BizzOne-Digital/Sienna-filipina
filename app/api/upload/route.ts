import { NextResponse } from "next/server";
import { jsonError, withAdmin } from "@/lib/http";
import { ALLOWED_MIME, DIRECT_UPLOAD_MAX_BYTES, isUploadFolder } from "@/lib/uploads/constants";
import { UploadError, saveImage } from "@/lib/uploads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Multipart boundaries and headers add a little on top of the file itself.
const MULTIPART_OVERHEAD = 64 * 1024;

/** Direct upload for small images (<= 3.5 MB). Larger files use /api/upload/chunked. */
export const POST = withAdmin(async (req, _ctx, admin) => {
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > DIRECT_UPLOAD_MAX_BYTES + MULTIPART_OVERHEAD) {
    return jsonError(413, "File too large for direct upload; use the chunked upload flow");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "Expected multipart form data");
  }
  const file = form.get("file");
  const folder = form.get("folder");
  if (!isUploadFolder(folder)) return jsonError(400, "Invalid folder");
  if (!(file instanceof File)) return jsonError(400, "Missing file");
  if (file.size === 0) return jsonError(400, "The file is empty");
  if (file.size > DIRECT_UPLOAD_MAX_BYTES) {
    return jsonError(413, "File too large for direct upload; use the chunked upload flow");
  }
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return jsonError(415, "Only PNG, JPEG, WebP and GIF images are allowed");
  }

  try {
    const data = Buffer.from(await file.arrayBuffer());
    const result = await saveImage({ data, folder, adminId: admin.id, originalName: file.name });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return jsonError(e.status, e.message);
    throw e;
  }
});
