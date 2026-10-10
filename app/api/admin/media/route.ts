import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { withAdmin } from "@/lib/http";
import { isUploadFolder } from "@/lib/uploads/constants";
import { isUploadReferenced } from "@/lib/uploads/store";
import { StoredUpload } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Media library listing. Binary data is never selected here. */
export const GET = withAdmin(async (req) => {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = 24;
  const folder = sp.get("folder");
  const q = (sp.get("q") ?? "").trim().slice(0, 80);
  const filter: Record<string, unknown> = {};
  if (isUploadFolder(folder)) filter.folder = folder;
  if (q) filter.originalName = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  await connectDB();
  const [docs, total] = await Promise.all([
    StoredUpload.find(filter)
      .select("folder filename mimeType size originalName createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    StoredUpload.countDocuments(filter),
  ]);
  const items = await Promise.all(
    docs.map(async (d) => {
      const url = `/api/uploads/${d.folder}/${d.filename}`;
      return { ...d, _id: String(d._id), url, inUse: await isUploadReferenced(url) };
    })
  );
  return NextResponse.json({ success: true, items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
});
