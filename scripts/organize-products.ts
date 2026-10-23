/**
 * Groups the client's products into the categories she asked for, applies her product names,
 * and adds the products she listed that were missing. Safe to re-run: it matches by slug
 * (old or new) and never touches price, stock or published status.
 *   npm run organize-products
 */
import "./env";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../lib/db/connect";
import { Category, Product, StoredUpload } from "../models";

const CATEGORIES = [
  { slug: "body-serum", name: "Body Serum", description: "Face and body serums." },
  { slug: "body-whitening-lotion", name: "Body Whitening Lotion", description: "Brightening body lotions." },
  { slug: "body-booster", name: "Body Booster", description: "Body booster creams." },
  { slug: "sunscreen-lotion", name: "Sunscreen Lotion", description: "Body sunscreen lotions." },
  { slug: "whitening-soap", name: "Whitening Soap", description: "Bar soaps for your daily routine." },
  { slug: "coffee", name: "Coffee & Cocoa", description: "Coffee, cocoa and C9 favourites." },
  { slug: "collagen-drink", name: "Collagen Drink", description: "Collagen and wellness drinks." },
];

type Entry = {
  slug: string; // final slug
  from?: string; // previous slug, if renamed
  name?: string; // final name (omit to keep)
  category: string;
  poster?: string; // only used when creating a missing product
  short?: string;
};

const ENTRIES: Entry[] = [
  // Body Serum
  { slug: "precious-gold-24k-serum", category: "body-serum" },
  { slug: "precious-gold-24k-body-serum", category: "body-serum" },
  { slug: "precious-miracle-serum", category: "body-serum" },
  { slug: "minako-retinol-booster-serum", name: "Minako Retinol Booster Serum 50X", category: "body-serum" },
  { slug: "gold-eye-roller-serum", category: "body-serum" },
  { slug: "the-elf-nano-white-dose", category: "body-serum" },
  // Body Whitening Lotion
  { slug: "deli-skin-nano-white-gluta-20x", from: "gluta-20x-body-lotion", name: "Deli Skin Nano White Gluta 20X", category: "body-whitening-lotion" },
  { slug: "minako-tomato-black-10x", from: "minako-gluta-vitamin-b3-lotion", name: "Minako Tomato Black 10X", category: "body-whitening-lotion" },
  { slug: "minako-tomato-lotion", category: "body-whitening-lotion" },
  { slug: "minako-vitamin-e-99x-lotion", name: "Minako Vitamin E 99X Lotion", category: "body-whitening-lotion", short: "Vitamin E body lotion by Minako." },
  { slug: "arbutin-3c3-extra-lotion", category: "body-whitening-lotion" },
  { slug: "alpha-arbutin-collagen-lotion", category: "body-whitening-lotion" },
  { slug: "the-elf-nano-white-booster", category: "body-whitening-lotion" },
  // Body Booster
  { slug: "jennie-moon-40x-body-booster", from: "40x-pro-derm-plus-body-booster", name: "Jennie Moon 40X Body Booster (Red)", category: "body-booster" },
  { slug: "jennie-moon-50x-body-booster", name: "Jennie Moon 50X Body Booster (Black)", category: "body-booster", short: "Body booster cream by Jennie Moon." },
  // Sunscreen Lotion
  { slug: "cc-walnut-sunscreen-green", from: "cc-body-sunscreen-spf50", name: "CC Walnut Body Sunscreen SPF 50 (Green)", category: "sunscreen-lotion" },
  { slug: "cc-walnut-sunscreen-pink", name: "CC Walnut Body Sunscreen SPF 50 (Pink)", category: "sunscreen-lotion", poster: "cc-body-sunscreen-pink", short: "CC body sunscreen lotion, SPF 50." },
  // Whitening Soap
  { slug: "minako-tomato-soap", name: "Minako Tomato Soap", category: "whitening-soap" },
  { slug: "alada-soap", category: "whitening-soap" },
  { slug: "extra-pure-gluta-soap", name: "Gluta White Soap", category: "whitening-soap" },
  { slug: "rice-milk-soap", name: "Rice Milk Soap", category: "whitening-soap", poster: "rice-milk-soap", short: "Premium Thai rice milk bar soap." },
  // Coffee & Cocoa
  { slug: "c9-coffee-thin-gold", name: "C9 Coffee", category: "coffee" },
  { slug: "chong-du-cocoa-shake", name: "Cocoa Shake", category: "coffee" },
  { slug: "c9-capsule", category: "coffee" },
  // Collagen Drink
  { slug: "gluta-collagen-dtx", name: "DTX Gluta Collagen", category: "collagen-drink" },
  { slug: "minako-apple-cider-vinegar", name: "Minako Apple Cider Vinegar", category: "collagen-drink", short: "Apple cider vinegar drink by Minako." },
  { slug: "merry-collagen-peptide-plus", category: "collagen-drink" },
  // Combos
  { slug: "c9-coffee-capsule-combo", category: "combos" },
];

async function storePoster(poster: string) {
  const file = join(process.cwd(), "public/media/gallery", `${poster}.webp`);
  if (!existsSync(file)) return null;
  const data = readFileSync(file);
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.webp`;
  await StoredUpload.create({ folder: "products", filename, mimeType: "image/webp", size: data.length, data, originalName: `${poster}.webp` });
  return `/api/uploads/products/${filename}`;
}

async function main() {
  await connectDB();

  const catIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: { name: c.name, sortOrder: i + 1 }, $setOnInsert: { slug: c.slug, description: c.description } },
      { upsert: true, new: true }
    );
    catIds[c.slug] = doc._id as mongoose.Types.ObjectId;
  }
  // Keep combos and the original demo categories after the client's groups.
  await Category.updateOne({ slug: "combos" }, { $set: { sortOrder: 8 } });
  await Category.updateOne({ slug: "skincare" }, { $set: { sortOrder: 9 } });
  await Category.updateOne({ slug: "apparel" }, { $set: { sortOrder: 10 } });
  const combos = await Category.findOne({ slug: "combos" }).lean();
  if (combos) catIds.combos = combos._id as mongoose.Types.ObjectId;

  let updated = 0;
  let created = 0;
  for (const [i, e] of ENTRIES.entries()) {
    const category = catIds[e.category];
    if (!category) throw new Error(`Category "${e.category}" is missing. Run npm run seed first.`);
    const existing = (await Product.findOne({ slug: e.slug })) ?? (e.from ? await Product.findOne({ slug: e.from }) : null);
    if (existing) {
      existing.set({ slug: e.slug, category, sortOrder: 100 + i, ...(e.name ? { name: e.name } : {}) });
      await existing.save();
      updated++;
      continue;
    }
    const url = e.poster ? await storePoster(e.poster) : null;
    const short = e.short ?? "";
    await Product.create({
      name: e.name ?? e.slug,
      slug: e.slug,
      shortDescription: short,
      description: `${short}\n\nPlease read the product label for full ingredients and directions before use.`.trim(),
      priceCents: 0,
      images: url ? [url] : [],
      imageRefs: url ? [url] : [],
      category,
      stock: 0,
      published: false,
      sortOrder: 100 + i,
      isDemo: false,
    });
    created++;
    console.log(`draft ${e.slug}${url ? "" : "  (no photo yet)"}`);
  }

  // The interim "Wellness" group is replaced by Coffee & Cocoa and Collagen Drink.
  const wellness = await Category.findOne({ slug: "wellness" }).lean();
  if (wellness && !(await Product.exists({ category: wellness._id }))) {
    await Category.deleteOne({ _id: wellness._id });
    console.log("removed empty Wellness category");
  }

  console.log(`\n${updated} product(s) organised, ${created} new draft(s) created.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
