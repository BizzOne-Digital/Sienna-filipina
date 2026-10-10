import "server-only";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { Category, Product } from "@/models";

export const CartLineInput = z.object({
  productId: z.string().refine(isValidObjectId, "Invalid product"),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).max(20),
});
export const CartInput = z.array(CartLineInput).min(1, "Your bag is empty").max(30);
export type CartLine = z.infer<typeof CartLineInput>;

export const GIFT_SLUG = "rice-soap";

export type PricedLine = {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  variantName?: string;
  image: string;
  unitCents: number;
  quantity: number;
  lineCents: number;
  available: number;
  isGift?: boolean;
};

export type Quote = {
  lines: PricedLine[];
  gift: PricedLine | null;
  subtotalCents: number;
  issues: string[];
  hasCombo: boolean;
};

/**
 * Prices a cart from the database only. Client-supplied prices are never trusted.
 * `issues` lists lines that were removed or reduced because of availability.
 */
export async function quoteCart(input: CartLine[]): Promise<Quote> {
  await connectDB();
  const ids = [...new Set(input.map((l) => l.productId))];
  const products = await Product.find({ _id: { $in: ids }, published: true }).lean();
  const comboCats = new Set((await Category.find({ isCombo: true }).select("_id").lean()).map((c) => String(c._id)));
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const merged = new Map<string, CartLine>();
  for (const l of input) {
    const key = `${l.productId}:${l.variantId ?? ""}`;
    const prev = merged.get(key);
    merged.set(key, { ...l, quantity: Math.min(20, (prev?.quantity ?? 0) + l.quantity) });
  }

  const lines: PricedLine[] = [];
  const issues: string[] = [];
  let hasCombo = false;

  for (const l of merged.values()) {
    const p = byId.get(l.productId);
    if (!p) {
      issues.push("An item in your bag is no longer available and was removed.");
      continue;
    }
    let unit = p.priceCents;
    let available = p.stock;
    let variantName: string | undefined;
    let variantId: string | undefined;
    if (p.variants?.length) {
      const v = p.variants.find((x) => String(x._id) === l.variantId);
      if (!v) {
        issues.push(`Please choose an option for ${p.name}.`);
        continue;
      }
      unit = v.priceCents ?? p.priceCents;
      available = v.stock;
      variantName = v.name;
      variantId = String(v._id);
    }
    if (available <= 0) {
      issues.push(`${p.name}${variantName ? ` (${variantName})` : ""} is sold out and was removed.`);
      continue;
    }
    const quantity = Math.min(l.quantity, available);
    if (quantity < l.quantity) issues.push(`Only ${available} of ${p.name} available; quantity updated.`);
    if (p.category && comboCats.has(String(p.category))) hasCombo = true;
    lines.push({
      productId: String(p._id),
      variantId,
      slug: p.slug,
      name: p.name,
      variantName,
      image: p.images?.[0] ?? "",
      unitCents: unit,
      quantity,
      lineCents: unit * quantity,
      available,
    });
  }

  let gift: PricedLine | null = null;
  if (hasCombo) {
    const soap = await Product.findOne({ slug: GIFT_SLUG, published: true }).lean();
    if (soap && soap.stock > 0) {
      gift = {
        productId: String(soap._id),
        slug: soap.slug,
        name: `${soap.name} — free with your combo`,
        image: soap.images?.[0] ?? "",
        unitCents: 0,
        quantity: 1,
        lineCents: 0,
        available: soap.stock,
        isGift: true,
      };
    }
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  return { lines, gift, subtotalCents, issues, hasCombo };
}
