/**
 * Imports the client's product posters as DRAFT products (unpublished, no price yet).
 * Images are stored in MongoDB like any admin upload, so they can be replaced from the admin.
 * Idempotent: products whose slug already exists are skipped, never overwritten.
 *   npm run import-products
 * Then in Admin → Products: set the price and stock, tick "Published", save.
 */
import "./env";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../lib/db/connect";
import { Category, Product, StoredUpload } from "../models";

type Item = { slug: string; name: string; category: "skincare" | "wellness" | "combos"; poster: string; short: string };

const ITEMS: Item[] = [
  // Skincare & body care
  { slug: "precious-gold-24k-serum", name: "Precious Gold 24K Serum", category: "skincare", poster: "precious-gold-24k-serum", short: "Gold 24K facial serum." },
  { slug: "precious-gold-24k-body-serum", name: "Precious Gold 24K Body Serum", category: "skincare", poster: "precious-gold-24k-body-serum", short: "Gold 24K body serum." },
  { slug: "precious-miracle-serum", name: "Precious Miracle Serum", category: "skincare", poster: "precious-miracle-serum", short: "Facial serum by Precious." },
  { slug: "gold-eye-roller-serum", name: "Gold Eye Roller Serum", category: "skincare", poster: "gold-eye-roller-serum", short: "Roll-on eye serum." },
  { slug: "minako-retinol-booster-serum", name: "Minako Retinol Booster Serum", category: "skincare", poster: "minako-retinol-booster-serum", short: "Retinol booster serum by Minako." },
  { slug: "minako-gluta-vitamin-b3-lotion", name: "Minako Gluta Vitamin B3 Lotion", category: "skincare", poster: "minako-gluta-vitamin-b3-lotion", short: "Body lotion with vitamin B3 by Minako." },
  { slug: "minako-tomato-lotion", name: "Minako Tomato Lotion", category: "skincare", poster: "minako-tomato-lotion", short: "Tomato body lotion by Minako." },
  { slug: "minako-tomato-soap", name: "Minako Tomato Extra Soap", category: "skincare", poster: "minako-tomato-soap", short: "Tomato extra bar soap by Minako." },
  { slug: "arbutin-3c3-extra-lotion", name: "Arbutin 3C3 Extra Lotion", category: "skincare", poster: "arbutin-3c3-extra-lotion", short: "Arbutin body lotion." },
  { slug: "alpha-arbutin-collagen-lotion", name: "Alpha Arbutin Collagen Lotion", category: "skincare", poster: "alpha-arbutin-collagen-lotion", short: "Alpha arbutin collagen body lotion." },
  { slug: "gluta-20x-body-lotion", name: "Gluta 20X Body Lotion", category: "skincare", poster: "gluta-20x-body-lotion", short: "Gluta body lotion." },
  { slug: "40x-pro-derm-plus-body-booster", name: "40X Pro Derm-Plus Body Booster", category: "skincare", poster: "40x-pro-derm-plus-body-booster", short: "Body booster cream." },
  { slug: "the-elf-nano-white-booster", name: "The Elf Nano White Booster", category: "skincare", poster: "the-elf-nano-white-booster", short: "Nano white booster by The Elf." },
  { slug: "the-elf-nano-white-dose", name: "The Elf Nano White Dose", category: "skincare", poster: "the-elf-nano-white-dose", short: "Nano white dose by The Elf." },
  { slug: "cc-body-sunscreen-spf50", name: "CC Body Sunscreen SPF 50", category: "skincare", poster: "cc-body-sunscreen-spf50", short: "CC body sunscreen lotion, SPF 50." },
  { slug: "alada-soap", name: "Alada Soap", category: "skincare", poster: "alada-soap", short: "Alada bar soap." },
  { slug: "extra-pure-gluta-soap", name: "Extra Pure Gluta White Soap", category: "skincare", poster: "extra-pure-gluta-soap", short: "Gluta bar soap." },
  // Wellness
  { slug: "gluta-collagen-dtx", name: "Gluta Collagen DTX+", category: "wellness", poster: "gluta-collagen-dtx", short: "Collagen drink mix." },
  { slug: "merry-collagen-peptide-plus", name: "Merry Collagen Peptide Plus", category: "wellness", poster: "merry-collagen-peptide-plus", short: "Collagen peptide powder." },
  { slug: "c9-capsule", name: "C9 Capsule", category: "wellness", poster: "c9-capsule", short: "C9 dietary supplement capsules." },
  { slug: "c9-coffee-thin-gold", name: "C9 Coffee Thin Gold", category: "wellness", poster: "c9-coffee-thin-gold", short: "C9 instant coffee mix." },
  { slug: "chong-du-cocoa-shake", name: "Chong Du Cocoa Shake", category: "wellness", poster: "chong-du-cocoa-shake", short: "Cocoa drink mix." },
  // Combos (each combo also earns the free rice soap at checkout)
  { slug: "c9-coffee-capsule-combo", name: "C9 Coffee + C9 Capsule Combo", category: "combos", poster: "c9-coffee-and-capsule", short: "C9 Coffee Thin Gold and C9 Capsule together." },
];

const GALLERY = join(process.cwd(), "public/media/gallery");

async function storePoster(poster: string) {
  const data = readFileSync(join(GALLERY, `${poster}.webp`));
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.webp`;
  await StoredUpload.create({ folder: "products", filename, mimeType: "image/webp", size: data.length, data, originalName: `${poster}.webp` });
  return `/api/uploads/products/${filename}`;
}

async function main() {
  await connectDB();
  const wellness = await Category.findOneAndUpdate(
    { slug: "wellness" },
    { $setOnInsert: { slug: "wellness", name: "Wellness", description: "Collagen, coffee and cocoa drinks and supplements.", sortOrder: 4 } },
    { upsert: true, new: true }
  );
  const cats = Object.fromEntries((await Category.find().lean()).map((c) => [c.slug, c._id]));
  cats.wellness = wellness._id;

  let created = 0;
  for (const [i, it] of ITEMS.entries()) {
    if (!cats[it.category]) throw new Error(`Category "${it.category}" is missing. Run npm run seed first.`);
    if (await Product.exists({ slug: it.slug })) {
      console.log(`skip  ${it.slug} (already exists)`);
      continue;
    }
    const url = await storePoster(it.poster);
    await Product.create({
      name: it.name,
      slug: it.slug,
      shortDescription: it.short,
      description: `${it.short}\n\nPlease read the product label for full ingredients and directions before use.`,
      priceCents: 0,
      images: [url],
      category: cats[it.category],
      stock: 0,
      published: false, // set price + stock, then publish from the admin
      featured: false,
      sortOrder: 10 + i,
      isDemo: false,
      imageRefs: [url],
    });
    created++;
    console.log(`draft ${it.slug}`);
  }
  console.log(`\n${created} draft product(s) created. Add prices and stock in Admin → Products, then publish.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
