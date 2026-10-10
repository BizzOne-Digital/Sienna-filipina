import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/http";
import { deleteUploadByUrl, isUploadReferenced, parseUploadUrl } from "@/lib/uploads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Removes an upload that was never saved into any content (e.g. the admin uploaded a
 * replacement and then cancelled). Referenced or external URLs are never deleted.
 */
export const POST = withAdmin(async (req) => {
  const { url } = z.object({ url: z.string().max(300) }).parse(await req.json());
  const parsed = parseUploadUrl(url);
  if (!parsed || parsed.folder === "gallery") return NextResponse.json({ success: true, deleted: false });
  if (await isUploadReferenced(url)) return NextResponse.json({ success: true, deleted: false });
  const deleted = await deleteUploadByUrl(url);
  return NextResponse.json({ success: true, deleted });
});
