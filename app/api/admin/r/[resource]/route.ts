import { NextResponse } from "next/server";
import { getResource } from "@/lib/admin/resources";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { connectDB } from "@/lib/db/connect";
import { jsonError, withAdmin } from "@/lib/http";
import { collectUploadUrls } from "@/lib/uploads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string }> };

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Paginated, searchable list. */
export const GET = withAdmin<Ctx>(async (req, ctx) => {
  const { resource } = await ctx.params;
  const cfg = getResource(resource);
  if (!cfg) return jsonError(404, "Unknown resource");

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
  const q = (sp.get("q") ?? "").trim().slice(0, 80);

  const filter: Record<string, unknown> = {};
  if (q) {
    const rx = new RegExp(escapeRx(q), "i");
    filter.$or = cfg.searchFields.map((f) => ({ [f]: rx }));
  }
  for (const [key, build] of Object.entries(cfg.filters ?? {})) {
    const v = sp.get(key);
    if (v) Object.assign(filter, build(v) ?? {});
  }

  await connectDB();
  const query = cfg.model.find(filter).sort(cfg.defaultSort).skip((page - 1) * pageSize).limit(pageSize);
  if (cfg.populate) query.populate(cfg.populate);
  const [items, total] = await Promise.all([query.lean(), cfg.model.countDocuments(filter)]);
  return NextResponse.json({ success: true, items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
});

export const POST = withAdmin<Ctx>(async (req, ctx) => {
  const { resource } = await ctx.params;
  const cfg = getResource(resource);
  if (!cfg?.createSchema) return jsonError(405, "Creating this item is not supported");
  const parsed = cfg.createSchema.parse(await req.json());
  const data = cfg.prepare ? cfg.prepare(parsed, null) : parsed;
  data.imageRefs = collectUploadUrls(data);

  await connectDB();
  const doc = await cfg.model.create(data);
  if (cfg.touchesStorefront) refreshStorefront();
  return NextResponse.json({ success: true, item: doc.toObject() }, { status: 201 });
});
