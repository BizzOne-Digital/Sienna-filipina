import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handleError } from "@/lib/http";
import { CartLineInput, quoteCart } from "@/lib/orders/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns server-calculated prices, availability and subtotal for the visitor's bag. */
export async function POST(req: NextRequest) {
  try {
    const body = z.object({ items: z.array(CartLineInput).max(30) }).parse(await req.json());
    if (body.items.length === 0) {
      return NextResponse.json({ success: true, lines: [], gift: null, subtotalCents: 0, issues: [], hasCombo: false });
    }
    const quote = await quoteCart(body.items);
    return NextResponse.json({ success: true, ...quote });
  } catch (e) {
    return handleError(e);
  }
}
