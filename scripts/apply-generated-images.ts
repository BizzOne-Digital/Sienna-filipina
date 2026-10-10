import "./env";
import mongoose from "mongoose";
import { connectDB } from "../lib/db/connect";
import { BlogPost, Category, PageContent, Product } from "../models";
import { resolvePageImage, resolveProductImages, resolveStockImage } from "../lib/content/images";

// Only known original demo stock URLs are changed. Uploaded/custom images,
// copy, pricing, inventory and publication settings are never overwritten.
async function main() {
  await connectDB();
  let updated = 0;
  for (const doc of await Product.find().select("slug images").lean()) {
    const before = doc.images ?? [];
    const after = resolveProductImages(doc.slug, before);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      const r = await Product.updateOne({ _id: doc._id, images: before }, { $set: { images: after } });
      updated += r.modifiedCount;
    }
  }
  for (const doc of await Category.find().select("image").lean()) {
    const after = resolveStockImage(doc.image ?? "");
    if (after !== doc.image) {
      const r = await Category.updateOne({ _id: doc._id, image: doc.image }, { $set: { image: after } });
      updated += r.modifiedCount;
    }
  }
  for (const doc of await BlogPost.find().select("coverImage").lean()) {
    const after = resolveStockImage(doc.coverImage ?? "");
    if (after !== doc.coverImage) {
      const r = await BlogPost.updateOne({ _id: doc._id, coverImage: doc.coverImage }, { $set: { coverImage: after } });
      updated += r.modifiedCount;
    }
  }
  for (const doc of await PageContent.find().select("key data").lean()) {
    const data = (doc.data ?? {}) as Record<string, unknown>;
    for (const [field, before] of Object.entries(data)) {
      if (typeof before !== "string" || !field.toLowerCase().includes("image")) continue;
      const after = resolvePageImage(doc.key, field, before);
      if (after === before) continue;
      const path = `data.${field}`;
      const r = await PageContent.updateOne({ _id: doc._id, [path]: before }, { $set: { [path]: after } });
      updated += r.modifiedCount;
    }
  }
  console.log(`Generated image references applied: ${updated} update(s). Custom uploads preserved.`);
}

main().catch(() => {
  console.error("Image migration could not connect or complete. Check MongoDB configuration/network; credentials are not printed.");
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
