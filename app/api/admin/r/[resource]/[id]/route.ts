import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { getResource } from "@/lib/admin/resources";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { connectDB } from "@/lib/db/connect";
import { jsonError, withAdmin } from "@/lib/http";
import { cleanupReplacedUploads, collectUploadUrls } from "@/lib/uploads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string; id: string }> };

type Loaded = { ok: false; res: Response } | { ok: true; cfg: NonNullable<ReturnType<typeof getResource>>; id: string };

async function load(ctx: Ctx): Promise<Loaded> {
  const { resource, id } = await ctx.params;
  const cfg = getResource(resource);
  if (!cfg) return { ok: false, res: jsonError(404, "Unknown resource") };
  if (!isValidObjectId(id)) return { ok: false, res: jsonError(404, "Not found") };
  await connectDB();
  return { ok: true, cfg, id };
}

export const GET = withAdmin<Ctx>(async (_req, ctx) => {
  const r = await load(ctx);
  if (!r.ok) return r.res;
  const q = r.cfg.model.findById(r.id);
  if (r.cfg.populate) q.populate(r.cfg.populate);
  const item = await q.lean();
  if (!item) return jsonError(404, "Not found");
  return NextResponse.json({ success: true, item });
});

/**
 * Safe image ordering: the new URLs are saved first; only after a successful save are
 * previously referenced uploads deleted, and only if nothing else still uses them.
 */
export const PUT = withAdmin<Ctx>(async (req, ctx) => {
  const r = await load(ctx);
  if (!r.ok) return r.res;
  const existing = await r.cfg.model.findById(r.id);
  if (!existing) return jsonError(404, "Not found");

  const parsed = r.cfg.updateSchema.parse(await req.json());
  const data = r.cfg.prepare ? r.cfg.prepare(parsed, existing.toObject()) : parsed;
  const previousRefs: string[] = existing.get("imageRefs") ?? [];
  const isContent = existing.schema.path("imageRefs") !== undefined;
  if (isContent) data.imageRefs = collectUploadUrls({ ...existing.toObject(), ...data });

  existing.set(data);
  await existing.save();
  if (isContent) await cleanupReplacedUploads(previousRefs, data.imageRefs);
  if (r.cfg.touchesStorefront) refreshStorefront();
  return NextResponse.json({ success: true, item: existing.toObject() });
});

export const DELETE = withAdmin<Ctx>(async (_req, ctx) => {
  const r = await load(ctx);
  if (!r.ok) return r.res;
  if (!r.cfg.canDelete) return jsonError(405, "Deleting this item is not allowed");
  const block = r.cfg.beforeDelete ? await r.cfg.beforeDelete(r.id) : null;
  if (block) return jsonError(409, block);

  const existing = await r.cfg.model.findById(r.id);
  if (!existing) return jsonError(404, "Not found");
  const previousRefs: string[] = existing.get("imageRefs") ?? [];
  await existing.deleteOne();
  await cleanupReplacedUploads(previousRefs, []);
  if (r.cfg.touchesStorefront) refreshStorefront();
  return NextResponse.json({ success: true });
});
