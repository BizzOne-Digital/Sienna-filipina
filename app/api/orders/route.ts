import { NextResponse, type NextRequest } from "next/server";
import { randomInt } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { hmac, randomToken } from "@/lib/auth/crypto";
import { CONTENT_TAG } from "@/lib/content/queries";
import { connectDB } from "@/lib/db/connect";
import { handleError, isSameOrigin, jsonError } from "@/lib/http";
import { CartInput, quoteCart, type PricedLine } from "@/lib/orders/pricing";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { Order, Product } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (max: number) => z.string().trim().max(max);
const CheckoutSchema = z.object({
  items: CartInput,
  customer: z.object({
    name: str(120).min(2, "Please enter your name"),
    email: z.string().trim().email("Please enter a valid email").max(200),
    phone: str(40).optional().default(""),
  }),
  shippingAddress: z.object({
    line1: str(200).min(3, "Please enter your address"),
    line2: str(200).optional().default(""),
    city: str(100).min(2, "Please enter your city"),
    state: str(100).optional().default(""),
    postalCode: str(20).min(3, "Please enter your postal code"),
    country: str(100).min(2, "Please enter your country"),
  }),
  notes: str(1000).optional().default(""),
  // Client-displayed total; if it no longer matches, we ask the visitor to review.
  expectedTotalCents: z.number().int().nonnegative(),
});

/** Atomically reserves stock for one line; returns false when not enough is left. */
async function reserve(line: PricedLine) {
  if (line.variantId) {
    const r = await Product.updateOne(
      { _id: line.productId, variants: { $elemMatch: { _id: line.variantId, stock: { $gte: line.quantity } } } },
      { $inc: { "variants.$.stock": -line.quantity } }
    );
    return r.modifiedCount === 1;
  }
  const r = await Product.updateOne(
    { _id: line.productId, stock: { $gte: line.quantity } },
    { $inc: { stock: -line.quantity } }
  );
  return r.modifiedCount === 1;
}

async function release(line: PricedLine) {
  if (line.variantId) {
    await Product.updateOne(
      { _id: line.productId, "variants._id": line.variantId },
      { $inc: { "variants.$.stock": line.quantity } }
    );
  } else {
    await Product.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity } });
  }
}

/** Creates a manual-payment order. No payment is taken or simulated here. */
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return jsonError(403, "Cross-origin request rejected");
    const ipKey = hashIp(await clientIp());
    if (!(await rateLimit(`order:${ipKey}`, 10, 3600))) {
      return jsonError(429, "Too many orders from this connection. Please try again later.");
    }

    const body = CheckoutSchema.parse(await req.json());
    const quote = await quoteCart(body.items);
    if (quote.issues.length || quote.lines.length === 0) {
      return jsonError(409, "Your bag changed. Please review it before placing the order.", { issues: quote.issues });
    }
    const shippingCents = 0; // Delivery cost is confirmed with the customer in the manual workflow.
    const totalCents = quote.subtotalCents + shippingCents;
    if (totalCents !== body.expectedTotalCents) {
      return jsonError(409, "Prices have changed. Please review your bag before placing the order.");
    }

    await connectDB();
    const reserved: PricedLine[] = [];
    for (const line of quote.lines) {
      if (!(await reserve(line))) {
        await Promise.all(reserved.map(release));
        return jsonError(409, `${line.name} just sold out. Please review your bag.`);
      }
      reserved.push(line);
    }
    const lines = [...quote.lines];
    if (quote.gift && (await reserve(quote.gift))) {
      reserved.push(quote.gift);
      lines.push(quote.gift);
    }

    const token = randomToken(24);
    const orderNumber = `SF-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomInt(100000, 999999)}`;
    try {
      const order = await Order.create({
        orderNumber,
        accessTokenHash: hmac(token, "order"),
        items: lines.map((l) => ({
          product: l.productId,
          variantId: l.variantId,
          name: l.name,
          variantName: l.variantName,
          image: l.image,
          unitCents: l.unitCents,
          quantity: l.quantity,
          lineCents: l.lineCents,
          isGift: !!l.isGift,
        })),
        subtotalCents: quote.subtotalCents,
        shippingCents,
        totalCents,
        customer: body.customer,
        shippingAddress: body.shippingAddress,
        notes: body.notes,
        paymentMethod: "manual",
        paymentStatus: "unpaid",
        status: "pending_payment",
      });
      revalidateTag(CONTENT_TAG); // stock changed
      return NextResponse.json(
        { success: true, orderId: String(order._id), token, orderNumber },
        { status: 201 }
      );
    } catch (e) {
      await Promise.all(reserved.map(release));
      throw e;
    }
  } catch (e) {
    return handleError(e);
  }
}
