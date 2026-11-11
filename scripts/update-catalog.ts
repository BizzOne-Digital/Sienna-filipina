/**
 * Applies the client's confirmed prices (publishing those products), adds new products,
 * and swaps photos the client asked to replace. Safe to re-run: prices/names are re-applied,
 * new products are created once, and a photo is only uploaded if it is not attached already.
 *   npm run update-catalog
 */
import "./env";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../lib/db/connect";
import { Category, Product, StoredUpload } from "../models";

// Client gave prices but no quantities yet; she can update stock in Admin → Products.
const DEFAULT_STOCK = 5;

type Update = {
  slug: string;
  priceCents: number;
  name?: string;
  priceLabel?: string;
  variants?: { name: string; priceCents: number; stock: number }[];
  /** Replace all existing photos with this one (client asked to remove the old picture). */
  replacePhoto?: string;
};

const PRICES: Update[] = [
  // Body Whitening Lotion
  { slug: "minako-tomato-lotion", priceCents: 2500 },
  { slug: "minako-vitamin-e-99x-lotion", priceCents: 2500 },
  { slug: "minako-tomato-black-10x", priceCents: 2500 },
  { slug: "arbutin-3c3-extra-lotion", name: "Arbutin Night Cream Lotion", priceCents: 1950, replacePhoto: "arbutin-night-cream-lotion" },
  // Whitening Soap
  { slug: "minako-tomato-soap", priceCents: 1000 },
  {
    slug: "rice-milk-soap",
    priceCents: 300,
    priceLabel: "From",
    variants: [
      { name: "1 piece", priceCents: 300, stock: 20 },
      { name: "4 pieces", priceCents: 1200, stock: 5 },
    ],
  },
  // Body Serum ("Minako Nano serum" = Minako Retinol Booster Serum, labelled Nano on the bottle)
  { slug: "minako-retinol-booster-serum", priceCents: 1600 },
  { slug: "precious-miracle-serum", priceCents: 1400 },
  // Sunscreen Lotion
  { slug: "cc-walnut-sunscreen-green", priceCents: 2100 },
  { slug: "cc-walnut-sunscreen-pink", priceCents: 2100 },
  // Collagen & Wellness / Coffee
  { slug: "minako-apple-cider-vinegar", priceCents: 2304 },
  { slug: "c9-capsule", priceCents: 2000 },
  { slug: "c9-coffee-thin-gold", priceCents: 2200 },
];

const NEW_PRODUCTS = [
  { slug: "minako-body-shape-coffee", name: "Minako Body Shape Coffee", category: "coffee", priceCents: 2200, photo: "minako-body-shape-coffee", short: "Minako coffee mix, 10 sachets (150 g)." },
  { slug: "minako-collagen-gluta-tomato-glow", name: "Minako Collagen Mix Gluta Tomato Glow", category: "collagen-drink", priceCents: 2500, photo: "minako-collagen-gluta-tomato-glow", short: "Minako collagen drink mix, 30 sachets (300 g)." },
  { slug: "minako-collagen-tripeptide", name: "Minako Collagen Tripeptide", category: "collagen-drink", priceCents: 2350, photo: "minako-collagen-tripeptide", short: "Minako collagen tripeptide drink mix, 20 sachets." },
  { slug: "minako-tomato-body-scrub", name: "Minako Tomato Herbal Body Scrub", category: "body-scrub", priceCents: 2400, photo: "minako-tomato-body-scrub", short: "Tomato herbal body scrub, 500 g." },
  { slug: "minako-duo-combo", name: "Minako Duo Combo: Apple Cider Vinegar + Body Shape Coffee", category: "combos", priceCents: 4400, photo: "minako-duo-combo", short: "Minako Apple Cider Vinegar capsules and Body Shape Coffee together." },
];

async function uploadPhoto(photo: string) {
  const original = `${photo}.webp`;
  const data = readFileSync(join(process.cwd(), "public/media/gallery", original));
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.webp`;
  await StoredUpload.create({ folder: "products", filename, mimeType: "image/webp", size: data.length, data, originalName: original });
  return `/api/uploads/products/${filename}`;
}

/** The URL of an upload from this source file, if the given images already include one. */
async function attached(photo: string, images: string[]) {
  const ups = await StoredUpload.find({ originalName: `${photo}.webp`, folder: "products" }).select("folder filename").lean();
  return ups.map((u) => `/api/uploads/${u.folder}/${u.filename}`).find((u) => images.includes(u));
}

/** Deletes uploads no product references any more (only ones we just detached). */
async function deleteIfUnused(urls: string[]) {
  for (const url of urls) {
    if (await Product.exists({ imageRefs: url })) continue;
    const filename = url.split("/").pop();
    await StoredUpload.deleteOne({ folder: "products", filename });
    console.log(`        removed old photo ${filename}`);
  }
}

async function main() {
  await connectDB();

  await Category.updateOne(
    { slug: "body-scrub" },
    { $setOnInsert: { slug: "body-scrub", name: "Body Scrub", description: "Exfoliating body scrubs.", sortOrder: 5 } },
    { upsert: true }
  );
  const cats = Object.fromEntries((await Category.find().lean()).map((c) => [c.slug, c._id]));

  for (const u of PRICES) {
    const p = await Product.findOne({ slug: u.slug });
    if (!p) {
      console.log(`MISSING ${u.slug}`);
      continue;
    }
    if (u.replacePhoto) {
      const current = await attached(u.replacePhoto, p.images);
      if (!current) {
        const url = await uploadPhoto(u.replacePhoto);
        const old = [...p.images];
        p.images = [url];
        p.imageRefs = [url];
        p.set({ priceCents: u.priceCents });
        await p.save();
        await deleteIfUnused(old);
      }
    }
    p.set({
      priceCents: u.priceCents,
      priceLabel: u.priceLabel ?? "",
      ...(u.name ? { name: u.name } : {}),
      ...(u.variants ? { variants: u.variants } : {}),
      stock: p.stock > 0 ? p.stock : DEFAULT_STOCK,
      published: true,
    });
    await p.save();
    console.log(`live    ${p.name} $${(u.priceCents / 100).toFixed(2)}`);
  }

  for (const [i, n] of NEW_PRODUCTS.entries()) {
    if (await Product.exists({ slug: n.slug })) {
      console.log(`exists  ${n.slug}`);
      continue;
    }
    if (!cats[n.category]) throw new Error(`Category "${n.category}" is missing.`);
    const url = await uploadPhoto(n.photo);
    await Product.create({
      name: n.name,
      slug: n.slug,
      shortDescription: n.short,
      description: `${n.short}\n\nPlease read the product label for full ingredients and directions before use.`,
      priceCents: n.priceCents,
      images: [url],
      imageRefs: [url],
      category: cats[n.category],
      stock: DEFAULT_STOCK,
      published: true,
      sortOrder: 200 + i,
      isDemo: false,
    });
    console.log(`new     ${n.name} $${(n.priceCents / 100).toFixed(2)}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
