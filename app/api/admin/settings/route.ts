import { NextResponse } from "next/server";
import { z } from "zod";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { DEFAULT_SETTINGS } from "@/lib/content/defaults";
import { connectDB } from "@/lib/db/connect";
import { withAdmin } from "@/lib/http";
import { cleanupReplacedUploads, collectUploadUrls } from "@/lib/uploads/store";
import { SiteSettings } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const optionalUrl = (host: RegExp) =>
  z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || (/^https:\/\//.test(v) && host.test(new URL(v).hostname)), "Enter a full https:// profile link");

const SettingsInput = z.object({
  siteName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(80),
  logo: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || v.startsWith("/api/uploads/"), "Upload the logo through the image field"),
  announcement: z.string().trim().max(160),
  announcementEnabled: z.boolean(),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]),
  phone: z.string().trim().max(40),
  showPhone: z.boolean(),
  businessHours: z.array(z.object({ label: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(60) })).max(10),
  facebookUrl: optionalUrl(/(^|\.)facebook\.com$|(^|\.)fb\.com$/),
  instagramUrl: optionalUrl(/(^|\.)instagram\.com$/),
  comboOfferText: z.string().trim().max(300),
  shippingNote: z.string().trim().max(500),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
});

export const GET = withAdmin(async () => {
  await connectDB();
  const doc = await SiteSettings.findOne({ key: "site" }).lean();
  return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...(doc ?? {}) } });
});

export const PUT = withAdmin(async (req) => {
  const data = SettingsInput.parse(await req.json());
  await connectDB();
  const existing = await SiteSettings.findOne({ key: "site" }).lean();
  const previousRefs = existing?.imageRefs ?? [];
  const imageRefs = collectUploadUrls(data);
  await SiteSettings.updateOne({ key: "site" }, { $set: { ...data, imageRefs } }, { upsert: true });
  await cleanupReplacedUploads(previousRefs, imageRefs);
  refreshStorefront();
  return NextResponse.json({ success: true });
});
