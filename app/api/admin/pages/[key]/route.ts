import { NextResponse } from "next/server";
import { z } from "zod";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { getPageDef } from "@/lib/content/pages";
import { connectDB } from "@/lib/db/connect";
import { jsonError, withAdmin } from "@/lib/http";
import { cleanupReplacedUploads, collectUploadUrls } from "@/lib/uploads/store";
import { PageContent } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

export const GET = withAdmin<Ctx>(async (_req, ctx) => {
  const { key } = await ctx.params;
  const def = getPageDef(key);
  if (!def) return jsonError(404, "Unknown page");
  await connectDB();
  const doc = await PageContent.findOne({ key }).lean();
  return NextResponse.json({
    success: true,
    data: { ...def.defaults, ...((doc?.data as Record<string, string>) ?? {}) },
    seoTitle: doc?.seoTitle ?? "",
    seoDescription: doc?.seoDescription ?? "",
  });
});

export const PUT = withAdmin<Ctx>(async (req, ctx) => {
  const { key } = await ctx.params;
  const def = getPageDef(key);
  if (!def) return jsonError(404, "Unknown page");

  const fields = def.sections.flatMap((s) => s.fields);
  // Only fields declared for this page are accepted.
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    shape[f.name] =
      f.type === "image"
        ? z
            .string()
            .trim()
            .max(500)
            .refine(
              (v) => v === "" || v.startsWith("/api/uploads/") || (v.startsWith("https://images.unsplash.com/") || v.startsWith("/images/sienna/")),
              `${f.label}: upload the image through the image field`
            )
        : z.string().max(f.type === "textarea" ? 5000 : 300);
  }
  const body = z
    .object({
      data: z.object(shape).partial(),
      seoTitle: z.string().trim().max(120).default(""),
      seoDescription: z.string().trim().max(300).default(""),
    })
    .parse(await req.json());

  await connectDB();
  const existing = await PageContent.findOne({ key }).lean();
  const previousRefs = existing?.imageRefs ?? [];
  const imageRefs = collectUploadUrls(body.data);
  await PageContent.updateOne(
    { key },
    { $set: { data: body.data, seoTitle: body.seoTitle, seoDescription: body.seoDescription, imageRefs } },
    { upsert: true }
  );
  await cleanupReplacedUploads(previousRefs, imageRefs);
  refreshStorefront();
  return NextResponse.json({ success: true });
});
