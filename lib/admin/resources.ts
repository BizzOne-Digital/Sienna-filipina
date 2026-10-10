import "server-only";
import type { Model } from "mongoose";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { slugify } from "@/lib/format";
import {
  BlogPost,
  Category,
  ContactMessage,
  ORDER_STATUSES,
  Order,
  Product,
  TeamMember,
  Testimonial,
} from "@/models";

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("/api/uploads/") || v.startsWith("https://images.unsplash.com/") || (v.startsWith("/brand/") || v.startsWith("/images/sienna/")),
    "Images must be uploaded through the image field"
  );
const text = (max: number) => z.string().trim().max(max).default("");
const cents = z.number().int().min(0).max(10_000_000);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and dashes only")
  .default("");

const ProductInput = z.object({
  name: z.string().trim().min(2).max(140),
  slug,
  shortDescription: text(300),
  description: text(8000),
  priceCents: cents,
  compareAtCents: cents.nullable().optional(),
  priceLabel: text(20),
  images: z.array(imageUrl).max(12).default([]),
  category: z.string().refine((v) => v === "" || isValidObjectId(v), "Invalid category").default(""),
  stock: z.number().int().min(0).max(100000).default(0),
  variants: z
    .array(
      z.object({
        _id: z.string().optional(),
        name: z.string().trim().min(1).max(80),
        sku: text(60),
        priceCents: cents.nullable().optional(),
        stock: z.number().int().min(0).max(100000),
      })
    )
    .max(30)
    .default([]),
  badge: text(40),
  comboOffer: text(300),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: text(120),
  seoDescription: text(300),
  isDemo: z.boolean().default(false),
});

const CategoryInput = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  description: text(500),
  image: imageUrl.default(""),
  sortOrder: z.number().int().default(0),
  isCombo: z.boolean().default(false),
  isDemo: z.boolean().default(false),
});

const BlogInput = z.object({
  title: z.string().trim().min(3).max(160),
  slug,
  category: text(60),
  excerpt: text(400),
  content: text(40000),
  coverImage: imageUrl.default(""),
  published: z.boolean().default(false),
  seoTitle: text(120),
  seoDescription: text(300),
  isDemo: z.boolean().default(false),
});

const TestimonialInput = z.object({
  name: z.string().trim().min(1).max(100),
  location: text(100),
  quote: z.string().trim().min(5).max(2000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  photo: imageUrl.default(""),
  approved: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const TeamInput = z.object({
  name: z.string().trim().min(1).max(100),
  role: text(100),
  bio: text(1500),
  photo: imageUrl.default(""),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const MessageUpdate = z.object({ status: z.enum(["new", "read", "replied", "archived"]) });

const OrderUpdate = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
  adminNotes: text(2000),
});

export type ResourceConfig = {
  model: Model<any>;
  createSchema?: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
  searchFields: string[];
  defaultSort: Record<string, 1 | -1>;
  populate?: string;
  /** Normalises validated input before saving (slug, nullable fields, dates). */
  prepare?: (data: Record<string, any>, existing?: Record<string, any> | null) => Record<string, any>;
  canDelete?: boolean;
  /** Returns an error message to block deletion (e.g. category still in use). */
  beforeDelete?: (id: string) => Promise<string | null>;
  filters?: Record<string, (v: string) => Record<string, unknown> | null>;
  touchesStorefront: boolean;
};

const withSlug = (from: string) => (d: Record<string, any>) => ({ ...d, slug: d.slug || slugify(d[from]) });
const boolFilter = (field: string) => (v: string) => (v === "true" ? { [field]: true } : v === "false" ? { [field]: false } : null);

export const RESOURCES: Record<string, ResourceConfig> = {
  products: {
    model: Product,
    createSchema: ProductInput,
    updateSchema: ProductInput,
    searchFields: ["name", "slug"],
    defaultSort: { sortOrder: 1, createdAt: -1 },
    populate: "category",
    prepare: (d) => ({
      ...withSlug("name")(d),
      category: d.category || null,
      compareAtCents: d.compareAtCents ?? undefined,
      variants: (d.variants ?? []).map((v: any) => ({ ...v, priceCents: v.priceCents ?? undefined })),
    }),
    canDelete: true,
    filters: {
      published: boolFilter("published"),
      category: (v) => (isValidObjectId(v) ? { category: v } : null),
    },
    touchesStorefront: true,
  },
  categories: {
    model: Category,
    createSchema: CategoryInput,
    updateSchema: CategoryInput,
    searchFields: ["name", "slug"],
    defaultSort: { sortOrder: 1, name: 1 },
    prepare: withSlug("name"),
    canDelete: true,
    beforeDelete: async (id) => {
      const n = await Product.countDocuments({ category: id });
      return n ? `This category is used by ${n} product(s). Move them first.` : null;
    },
    touchesStorefront: true,
  },
  blogs: {
    model: BlogPost,
    createSchema: BlogInput,
    updateSchema: BlogInput,
    searchFields: ["title", "slug", "category"],
    defaultSort: { createdAt: -1 },
    prepare: (d, existing) => ({
      ...withSlug("title")(d),
      publishedAt: d.published ? existing?.publishedAt ?? new Date() : existing?.publishedAt,
    }),
    canDelete: true,
    filters: { published: boolFilter("published") },
    touchesStorefront: true,
  },
  testimonials: {
    model: Testimonial,
    createSchema: TestimonialInput,
    updateSchema: TestimonialInput,
    searchFields: ["name", "quote"],
    defaultSort: { approved: 1, createdAt: -1 },
    prepare: (d) => ({ ...d, rating: d.rating ?? undefined }),
    canDelete: true,
    filters: { approved: boolFilter("approved") },
    touchesStorefront: true,
  },
  team: {
    model: TeamMember,
    createSchema: TeamInput,
    updateSchema: TeamInput,
    searchFields: ["name", "role"],
    defaultSort: { sortOrder: 1, createdAt: 1 },
    canDelete: true,
    touchesStorefront: true,
  },
  messages: {
    model: ContactMessage,
    updateSchema: MessageUpdate,
    searchFields: ["name", "email", "subject", "message"],
    defaultSort: { createdAt: -1 },
    canDelete: true,
    filters: { status: (v) => (["new", "read", "replied", "archived"].includes(v) ? { status: v } : null) },
    touchesStorefront: false,
  },
  orders: {
    model: Order,
    updateSchema: OrderUpdate,
    searchFields: ["orderNumber", "customer.name", "customer.email"],
    defaultSort: { createdAt: -1 },
    canDelete: false,
    filters: { status: (v) => ((ORDER_STATUSES as readonly string[]).includes(v) ? { status: v } : null) },
    touchesStorefront: false,
  },
};

export function getResource(name: string) {
  return Object.prototype.hasOwnProperty.call(RESOURCES, name) ? RESOURCES[name] : null;
}
