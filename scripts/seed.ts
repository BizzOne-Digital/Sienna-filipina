/**
 * Idempotent demo seed. Only inserts records that do not exist yet (matched by slug/key);
 * it never overwrites content an admin has edited. No reviews, ratings or team members are seeded.
 *   npm run seed
 */
import "./env";
import mongoose from "mongoose";
import { STOCK } from "../lib/content/images";
import { DEFAULT_SETTINGS } from "../lib/content/defaults";
import { connectDB } from "../lib/db/connect";
import { BlogPost, Category, Product, SiteSettings } from "../models";

const categories = [
  { slug: "skincare", name: "Skincare", description: "Everyday skincare essentials.", sortOrder: 1, isCombo: false, image: STOCK.serumMarble },
  { slug: "apparel", name: "Apparel", description: "Elegant, versatile everyday pieces.", sortOrder: 2, isCombo: false, image: STOCK.apparelRack },
  { slug: "combos", name: "Combos", description: "Curated pairings — each includes a free rice soap.", sortOrder: 3, isCombo: true, image: STOCK.skincareSetPink },
];

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  priceLabel?: string;
  shortDescription: string;
  description: string;
  images: string[];
  stock?: number;
  variants?: { name: string; priceCents?: number; stock: number }[];
  badge?: string;
  featured?: boolean;
  sortOrder: number;
};

// Demo catalogue for layout and testing only. Confirm names, prices, stock and photos before launch.
const products: SeedProduct[] = [
  {
    slug: "rice-soap",
    name: "Rice Soap",
    category: "skincare",
    priceCents: 1100,
    shortDescription: "A gentle everyday bar for your cleansing routine.",
    description:
      "A simple bar soap for your daily routine.\n\n## How to use\n- Lather with water.\n- Smooth over damp skin.\n- Rinse well.\n\nPlease review the full ingredient list before use and patch test if you have sensitive skin.",
    images: [STOCK.soapBars, STOCK.soapStack],
    stock: 40,
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "daily-skincare-set",
    name: "Daily Skincare Set",
    category: "skincare",
    priceCents: 3500,
    priceLabel: "From",
    shortDescription: "Thoughtfully paired essentials for your morning and evening routine.",
    description: "A curated set of everyday skincare essentials, presented together for an easy routine.\n\nChoose the set size that suits you.",
    images: [STOCK.skincareSetPink, STOCK.bottlesWhite],
    variants: [
      { name: "Essentials", priceCents: 3500, stock: 12 },
      { name: "Complete", priceCents: 4500, stock: 8 },
    ],
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "skincare-combo",
    name: "Skincare Combo",
    category: "combos",
    priceCents: 6000,
    priceLabel: "Up to",
    shortDescription: "Skincare favourites paired together — with a free rice soap.",
    description: "A combo of skincare favourites at a combined price. Every combo purchase includes a free rice soap while stock lasts.",
    images: [STOCK.comboProduct, STOCK.skincareSetPink],
    variants: [
      { name: "Classic combo", priceCents: 4800, stock: 10 },
      { name: "Deluxe combo", priceCents: 6000, stock: 6 },
    ],
    badge: "Free rice soap",
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "glow-facial-serum",
    name: "Facial Serum",
    category: "skincare",
    priceCents: 2800,
    shortDescription: "A lightweight serum for your daily routine.",
    description: "A lightweight serum designed to layer easily under moisturiser.\n\nPlease review the full ingredient list before use.",
    images: [STOCK.facialSerum],
    stock: 15,
    sortOrder: 4,
  },
  {
    slug: "everyday-knit-top",
    name: "Everyday Knit Top",
    category: "apparel",
    priceCents: 4200,
    shortDescription: "A soft, relaxed knit in a warm neutral tone.",
    description: "An easy knit top that pairs with denim, linen and everything in between.",
    images: [STOCK.knitTop],
    variants: [
      { name: "S", stock: 4 },
      { name: "M", stock: 6 },
      { name: "L", stock: 4 },
    ],
    sortOrder: 5,
  },
  {
    slug: "classic-white-shirt",
    name: "Classic White Shirt",
    category: "apparel",
    priceCents: 3800,
    shortDescription: "A crisp, versatile shirt for everyday wear.",
    description: "A clean, classic shirt that layers easily for work, weekends and special days.",
    images: [STOCK.whiteShirt],
    variants: [
      { name: "S", stock: 5 },
      { name: "M", stock: 5 },
      { name: "L", stock: 3 },
    ],
    sortOrder: 6,
  },
];

const blogs = [
  {
    slug: "simple-everyday-skincare-rituals",
    title: "Simple Everyday Skincare Rituals",
    category: "Skincare",
    excerpt: "Easy, mindful steps you can fit into any morning or evening — at any age.",
    coverImage: STOCK.journalSkincare,
    content:
      "A skincare routine does not need to be complicated to feel good. A few consistent steps can turn an everyday task into a calm moment for yourself.\n\n## Start simple\nCleanse gently, follow with the products you enjoy, and keep the routine easy enough to repeat every day.\n\n## Make it a ritual\n- Choose a time that suits you, morning or evening.\n- Keep your products together in one place.\n- Take a slow breath and enjoy the moment.\n\n## Listen to your skin\nEveryone's skin is different. Patch test new products, and speak with a qualified professional about any skin concerns.",
  },
  {
    slug: "effortless-style-for-real-life",
    title: "Effortless Style for Real Life",
    category: "Lifestyle",
    excerpt: "Versatile pieces that move with you, from everyday moments to special days.",
    coverImage: STOCK.journalApparel,
    content:
      "Everyday style works best when it is easy. A few versatile pieces in soft, neutral tones can carry you from errands to dinner with very little thought.\n\n## Build around neutrals\nIvory, sand and warm browns pair naturally with each other, so most pieces work together.\n\n## Choose comfort\n- Relaxed knits for cooler days.\n- A crisp shirt that layers over almost anything.\n- One or two accessories you love.\n\nStyle is personal — wear what makes you feel like yourself.",
  },
];

async function main() {
  await connectDB();
  let created = 0;

  const catIds = new Map<string, mongoose.Types.ObjectId>();
  for (const c of categories) {
    const r = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: { ...c, isDemo: true } },
      { upsert: true, new: true, includeResultMetadata: true }
    );
    if (!r.lastErrorObject?.updatedExisting) created++;
    catIds.set(c.slug, r.value!._id as mongoose.Types.ObjectId);
  }

  for (const p of products) {
    const r = await Product.updateOne(
      { slug: p.slug },
      {
        $setOnInsert: {
          ...p,
          category: catIds.get(p.category),
          stock: p.stock ?? 0,
          variants: p.variants ?? [],
          badge: p.badge ?? "",
          priceLabel: p.priceLabel ?? "",
          featured: !!p.featured,
          published: true,
          isDemo: true,
          imageRefs: [],
        },
      },
      { upsert: true }
    );
    created += r.upsertedCount;
  }

  for (const b of blogs) {
    const r = await BlogPost.updateOne(
      { slug: b.slug },
      { $setOnInsert: { ...b, published: true, publishedAt: new Date(), isDemo: true, imageRefs: [] } },
      { upsert: true }
    );
    created += r.upsertedCount;
  }

  const s = await SiteSettings.updateOne(
    { key: "site" },
    { $setOnInsert: { key: "site", ...DEFAULT_SETTINGS, imageRefs: [] } },
    { upsert: true }
  );
  created += s.upsertedCount;

  // Make sure every index (unique slugs, TTLs) exists.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));

  console.log(created ? `Seed complete: ${created} new record(s) created.` : "Seed complete: nothing to add (existing content left untouched).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
