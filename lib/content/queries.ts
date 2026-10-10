import "server-only";
import { unstable_cache } from "next/cache";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { BlogPost, Category, PageContent, Product, SiteSettings, TeamMember, Testimonial } from "@/models";
import type {
  BlogDTO,
  CategoryDTO,
  ProductDTO,
  SettingsDTO,
  TeamMemberDTO,
  TestimonialDTO,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "./defaults";
import { getPageDef } from "./pages";
import { resolvePageImage, resolveProductImages } from "./images";

/** All storefront reads share this tag; admin mutations call revalidateTag(CONTENT_TAG). */
export const CONTENT_TAG = "content";

const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v));
const cached = <A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key + "-generated-images-v1"], { tags: [CONTENT_TAG], revalidate: 3600 });

export const getSettings = cached(async (): Promise<SettingsDTO> => {
  await connectDB();
  const doc = await SiteSettings.findOne({ key: "site" }).lean();
  if (!doc) return DEFAULT_SETTINGS;
  const merged = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof SettingsDTO)[]) {
    const v = (doc as Record<string, unknown>)[k];
    if (v !== undefined && v !== null) (merged as Record<string, unknown>)[k] = v;
  }
  return plain(merged);
}, "settings");

export const getPage = cached(async (key: string) => {
  const def = getPageDef(key);
  await connectDB();
  const doc = await PageContent.findOne({ key }).lean();
  const data: Record<string, string> = { ...(def?.defaults ?? {}) };
  for (const [k, v] of Object.entries((doc?.data as Record<string, unknown>) ?? {})) {
    if (typeof v === "string" && (v.trim() !== "" || k.toLowerCase().includes("image"))) {
      data[k] = k.toLowerCase().includes("image") ? resolvePageImage(key, k, v) : v;
    }
  }
  return { data, seoTitle: doc?.seoTitle ?? "", seoDescription: doc?.seoDescription ?? "" };
}, "page");

export const getCategories = cached(async (): Promise<CategoryDTO[]> => {
  await connectDB();
  const docs = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  return plain(docs);
}, "categories");

const productDTO = (doc: unknown): ProductDTO => {
  const product = plain<ProductDTO>(doc);
  return { ...product, images: resolveProductImages(product.slug, product.images ?? []) };
};

const PRODUCT_SORTS = {
  featured: { featured: -1, sortOrder: 1, createdAt: -1 },
  "price-asc": { priceCents: 1, name: 1 },
  "price-desc": { priceCents: -1, name: 1 },
  newest: { createdAt: -1 },
} as const;
export type ProductSort = keyof typeof PRODUCT_SORTS;

export const queryProducts = cached(
  async (opts: { category?: string; q?: string; sort?: string; page?: number; pageSize?: number }) => {
    await connectDB();
    const filter: Record<string, unknown> = { published: true };
    if (opts.category) {
      const cat = await Category.findOne({ slug: opts.category }).lean();
      if (!cat) return { items: [] as ProductDTO[], total: 0, page: 1, pages: 1 };
      filter.category = cat._id;
    }
    if (opts.q) {
      const rx = new RegExp(opts.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60), "i");
      filter.$or = [{ name: rx }, { shortDescription: rx }];
    }
    const sort = PRODUCT_SORTS[(opts.sort as ProductSort) in PRODUCT_SORTS ? (opts.sort as ProductSort) : "featured"];
    const pageSize = opts.pageSize ?? 9;
    const total = await Product.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, opts.page ?? 1), pages);
    const items = await Product.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("category")
      .lean();
    return { items: items.map(productDTO), total, page, pages };
  },
  "products"
);

export const getFeaturedProducts = cached(async (limit: number = 3): Promise<ProductDTO[]> => {
  await connectDB();
  let docs = await Product.find({ published: true, featured: true }).sort({ sortOrder: 1 }).limit(limit).populate("category").lean();
  if (docs.length === 0) docs = await Product.find({ published: true }).sort({ sortOrder: 1 }).limit(limit).populate("category").lean();
  return docs.map(productDTO);
}, "featured");

export const getProductBySlug = cached(async (slug: string): Promise<ProductDTO | null> => {
  await connectDB();
  const doc = await Product.findOne({ slug, published: true }).populate("category").lean();
  return doc ? productDTO(doc) : null;
}, "product");

export const getRelatedProducts = cached(async (productId: string, categoryId?: string): Promise<ProductDTO[]> => {
  await connectDB();
  if (!isValidObjectId(productId)) return [];
  const filter: Record<string, unknown> = { published: true, _id: { $ne: productId } };
  if (categoryId && isValidObjectId(categoryId)) filter.category = categoryId;
  let docs = await Product.find(filter).sort({ featured: -1, sortOrder: 1 }).limit(4).populate("category").lean();
  if (docs.length < 2) {
    docs = await Product.find({ published: true, _id: { $ne: productId } }).limit(4).populate("category").lean();
  }
  return docs.map(productDTO);
}, "related");

export const getAllPublishedPrices = cached(async () => {
  await connectDB();
  const docs = await Product.find({ published: true })
    .select("name slug priceCents priceLabel category variants")
    .sort({ priceCents: 1 })
    .populate("category", "name slug")
    .lean();
  return plain<Pick<ProductDTO, "_id" | "name" | "slug" | "priceCents" | "priceLabel" | "category" | "variants">[]>(docs);
}, "prices");

export const getBlogs = cached(async (opts: { category?: string; limit?: number } = {}): Promise<BlogDTO[]> => {
  await connectDB();
  const filter: Record<string, unknown> = { published: true };
  if (opts.category) filter.category = opts.category;
  const docs = await BlogPost.find(filter).sort({ publishedAt: -1, createdAt: -1 }).limit(opts.limit ?? 50).lean();
  return plain(docs);
}, "blogs");

export const getBlogCategories = cached(async (): Promise<string[]> => {
  await connectDB();
  return (await BlogPost.distinct("category", { published: true })).filter(Boolean).sort();
}, "blog-categories");

export const getBlogBySlug = cached(async (slug: string): Promise<BlogDTO | null> => {
  await connectDB();
  const doc = await BlogPost.findOne({ slug, published: true }).lean();
  return doc ? plain(doc) : null;
}, "blog");

export const getTestimonials = cached(async (): Promise<TestimonialDTO[]> => {
  await connectDB();
  return plain(await Testimonial.find({ approved: true }).sort({ sortOrder: 1, createdAt: -1 }).lean());
}, "testimonials");

export const getTeam = cached(async (): Promise<TeamMemberDTO[]> => {
  await connectDB();
  return plain(await TeamMember.find({ visible: true }).sort({ sortOrder: 1, createdAt: 1 }).lean());
}, "team");

export const getSitemapEntries = cached(async () => {
  await connectDB();
  const [products, blogs] = await Promise.all([
    Product.find({ published: true }).select("slug updatedAt").lean(),
    BlogPost.find({ published: true }).select("slug updatedAt").lean(),
  ]);
  return plain<{ products: { slug: string; updatedAt: string }[]; blogs: { slug: string; updatedAt: string }[] }>({
    products,
    blogs,
  });
}, "sitemap");
