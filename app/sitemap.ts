import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/content/queries";

export const dynamic = "force-dynamic";

const STATIC = ["", "/shop", "/pricing", "/services", "/about-us", "/our-team", "/testimonials", "/blogs", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = STATIC.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
  try {
    const { products, blogs } = await getSitemapEntries();
    for (const p of products) entries.push({ url: `${base}/shop/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 });
    for (const b of blogs) entries.push({ url: `${base}/blogs/${b.slug}`, lastModified: b.updatedAt, priority: 0.6 });
  } catch (e) {
    console.error("Sitemap: database unavailable", e);
  }
  return entries;
}
