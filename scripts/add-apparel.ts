/**
 * Adds the client's on-hand apparel (prices confirmed by the client) as published products,
 * and unpublishes the demo products from the initial setup now that real stock is listed.
 * Safe to re-run: existing products (by slug) are left untouched; demo products stay in the database.
 *   npm run add-apparel
 */
import "./env";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../lib/db/connect";
import { Category, Product, StoredUpload } from "../models";

// "Limited stocks" — no counts given yet; the client can update stock in Admin → Products.
const DEFAULT_STOCK = 5;

const APPAREL = [
  {
    slug: "nike-original-t-shirt",
    name: "Nike Original T-Shirt",
    priceCents: 2500,
    short: "Original Nike logo T-shirt. Limited stock.",
    photos: ["nike-tshirt-black", "nike-tshirt-green", "nike-tshirt-stock"],
  },
  {
    slug: "adidas-original-t-shirt",
    name: "Adidas Original T-Shirt",
    priceCents: 2800,
    short: "Original Adidas logo T-shirt. Limited stock.",
    photos: ["adidas-tshirt-navy", "adidas-tshirt-white", "adidas-tshirt-stock"],
  },
  {
    slug: "adidas-original-sweatshirt-climate-control",
    name: "Adidas Original Sweatshirt (Climate Control)",
    priceCents: 3500,
    short: "Original Adidas zip-up sweatshirt with climate control fabric. Limited stock.",
    photos: ["adidas-sweatshirt-blue", "adidas-sweatshirt-navy"],
  },
  {
    slug: "thailand-finds-t-shirt-and-shorts-set",
    name: "Thailand Finds T-Shirt & Shorts Set",
    priceCents: 3000,
    short: "Matching T-shirt and shorts pair from Thailand. Limited stock.",
    photos: ["thailand-set-tan-black", "thailand-set-grey-tan", "thailand-set-grey"],
  },
];

async function upload(photo: string) {
  const original = `apparel-${photo}.webp`;
  const data = readFileSync(join(process.cwd(), "public/media/gallery", original));
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.webp`;
  await StoredUpload.create({ folder: "products", filename, mimeType: "image/webp", size: data.length, data, originalName: original });
  return `/api/uploads/products/${filename}`;
}

async function main() {
  await connectDB();
  const apparel = await Category.findOneAndUpdate(
    { slug: "apparel" },
    { $set: { sortOrder: 0, isDemo: false }, $setOnInsert: { slug: "apparel", name: "Apparel", description: "Original branded tees, sweatshirts and sets." } },
    { upsert: true, new: true }
  );

  for (const [i, item] of APPAREL.entries()) {
    if (await Product.exists({ slug: item.slug })) {
      console.log(`skip  ${item.slug} (already exists)`);
      continue;
    }
    const images: string[] = [];
    for (const ph of item.photos) images.push(await upload(ph));
    await Product.create({
      name: item.name,
      slug: item.slug,
      shortDescription: item.short,
      description: `${item.short}\n\nSizes and colours depend on available stock — message us to confirm before ordering.`,
      priceCents: item.priceCents,
      images,
      imageRefs: images,
      category: apparel._id,
      stock: DEFAULT_STOCK,
      published: true,
      featured: true,
      sortOrder: 10 + i,
      isDemo: false,
    });
    console.log(`live  ${item.slug} $${(item.priceCents / 100).toFixed(2)} (${images.length} photos)`);
  }

  const demo = await Product.updateMany({ isDemo: true, published: true }, { $set: { published: false, featured: false } });
  if (demo.modifiedCount) console.log(`\nUnpublished ${demo.modifiedCount} demo product(s) (still in the database).`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
