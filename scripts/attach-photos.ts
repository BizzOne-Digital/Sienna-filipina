/**
 * Attaches client photos (public/media/gallery/<poster>.webp) to products as their main image,
 * creating the product as a draft if it does not exist yet. Existing images are kept after it.
 * Safe to re-run: a photo already attached (same source file) is not uploaded again.
 *   npm run attach-photos
 */
import "./env";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../lib/db/connect";
import { Category, Product, StoredUpload } from "../models";

type Photo = { slug: string; poster: string; create?: { name: string; category: string; short: string } };

const PHOTOS: Photo[] = [
  {
    slug: "alpha-arbutin-collagen-body-serum",
    poster: "alpha-arbutin-body-serum",
    create: { name: "Alpha Arbutin 3 Plus Collagen Body Serum", category: "body-serum", short: "Alpha arbutin collagen body serum, 45 ml." },
  },
  { slug: "minako-tomato-soap", poster: "minako-tomato-soap-x50" },
  { slug: "minako-apple-cider-vinegar", poster: "minako-apple-cider-vinegar" },
  { slug: "minako-vitamin-e-99x-lotion", poster: "minako-vitamin-e-99x" },
];

const urlOf = (u: { folder: string; filename: string }) => `/api/uploads/${u.folder}/${u.filename}`;

async function main() {
  await connectDB();
  for (const ph of PHOTOS) {
    const original = `${ph.poster}.webp`;
    let product = await Product.findOne({ slug: ph.slug });

    if (!product && ph.create) {
      const cat = await Category.findOne({ slug: ph.create.category }).lean();
      if (!cat) throw new Error(`Category "${ph.create.category}" is missing. Run npm run organize-products first.`);
      const last = await Product.findOne({ category: cat._id }).sort({ sortOrder: -1 }).lean();
      product = await Product.create({
        name: ph.create.name,
        slug: ph.slug,
        shortDescription: ph.create.short,
        description: `${ph.create.short}\n\nPlease read the product label for full ingredients and directions before use.`,
        priceCents: 0,
        category: cat._id,
        stock: 0,
        published: false,
        sortOrder: (last?.sortOrder ?? 100) + 1,
      });
      console.log(`draft ${ph.slug}`);
    }
    if (!product) {
      console.log(`skip  ${ph.slug} (product not found)`);
      continue;
    }

    // Already attached? (an upload from the same source file that this product uses)
    const previous = await StoredUpload.find({ originalName: original, folder: "products" }).select("folder filename").lean();
    if (previous.some((u) => product!.images.includes(urlOf(u)))) {
      console.log(`ok    ${ph.slug} (photo already attached)`);
      continue;
    }

    const data = readFileSync(join(process.cwd(), "public/media/gallery", original));
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.webp`;
    await StoredUpload.create({ folder: "products", filename, mimeType: "image/webp", size: data.length, data, originalName: original });
    const url = `/api/uploads/products/${filename}`;

    product.images = [url, ...product.images.filter((i) => i !== url)];
    product.imageRefs = [...new Set([url, ...(product.imageRefs ?? [])])];
    await product.save();
    console.log(`photo ${ph.slug} (${product.images.length} image${product.images.length === 1 ? "" : "s"})`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
