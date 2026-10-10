import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const VariantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true },
    priceCents: { type: Number, min: 0 }, // optional override of the base price
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    priceCents: { type: Number, required: true, min: 0 },
    compareAtCents: { type: Number, min: 0 },
    priceLabel: { type: String, default: "" }, // display prefix, e.g. "From" or "Up to"
    images: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    stock: { type: Number, default: 0, min: 0 },
    variants: { type: [VariantSchema], default: [] },
    badge: { type: String, default: "" },
    comboOffer: { type: String, default: "" },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    isDemo: { type: Boolean, default: false },
    imageRefs: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export const Product: Model<ProductDoc> = models.Product || model("Product", ProductSchema);
