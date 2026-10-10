"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { cn, formatMoney } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";
import { useCart } from "./CartProvider";

export function AddToCart({ product }: { product: ProductDTO }) {
  const { add } = useCart();
  const hasVariants = product.variants.length > 0;
  const firstAvailable = product.variants.find((v) => v.stock > 0);
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable?._id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(() => product.variants.find((v) => v._id === variantId), [product.variants, variantId]);
  const stock = hasVariants ? variant?.stock ?? 0 : product.stock;
  const price = variant?.priceCents ?? product.priceCents;
  const max = Math.min(stock, 20);
  const soldOut = stock <= 0;

  return (
    <div>
      <p className="text-2xl text-espresso">
        {hasVariants && variant ? formatMoney(price) : `${product.priceLabel ? `${product.priceLabel} ` : ""}${formatMoney(price)}`}
      </p>

      {hasVariants && (
        <fieldset className="mt-6">
          <legend className="field-label">Option</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <label
                key={v._id}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-copper",
                  v._id === variantId ? "border-copper bg-copper text-white" : "border-line bg-[#fffdfa] hover:border-copper",
                  v.stock <= 0 && "cursor-not-allowed opacity-50 line-through"
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v._id}
                  className="sr-only"
                  checked={v._id === variantId}
                  disabled={v.stock <= 0}
                  onChange={() => {
                    setVariantId(v._id);
                    setQty(1);
                  }}
                />
                {v.name}
                {v.priceCents != null && v.priceCents !== product.priceCents ? ` · ${formatMoney(v.priceCents)}` : ""}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <span className="field-label" id="qty-label">
            Quantity
          </span>
          <div className="flex items-center border border-line bg-[#fffdfa]" role="group" aria-labelledby="qty-label">
            <button type="button" className="grid h-11 w-11 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || soldOut} aria-label="Decrease quantity">
              <Minus className="h-4 w-4" />
            </button>
            <output className="w-10 text-center tabular-nums" aria-live="polite">
              {soldOut ? 0 : qty}
            </output>
            <button type="button" className="grid h-11 w-11 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max || soldOut} aria-label="Increase quantity">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary flex-1 sm:flex-none sm:min-w-[14rem]"
          disabled={soldOut || (hasVariants && !variant)}
          onClick={() => {
            add({
              productId: product._id,
              variantId: variant?._id,
              variantName: variant?.name,
              slug: product.slug,
              name: product.name,
              image: product.images[0] ?? "",
              priceCents: price,
              quantity: qty,
              maxQuantity: stock,
            });
            setAdded(true);
          }}
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {soldOut ? "Sold out" : added ? "Added to bag" : "Add to bag"}
        </button>
      </div>
      <p className="mt-3 text-sm text-cocoa" aria-live="polite">
        {soldOut ? "Currently unavailable." : stock <= 5 ? `Only ${stock} left.` : "In stock."}
        {added && (
          <>
            {" "}
            <Link href="/cart" className="font-medium text-copper underline underline-offset-4">
              View bag
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
