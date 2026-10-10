"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import type { ProductDTO } from "@/lib/types";
import { useCart } from "./CartProvider";

/** Circular rose-gold cart button. Products with options open the product page instead. */
export function QuickAddButton({ product }: { product: ProductDTO }) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const soldOut = product.variants.length === 0 && product.stock <= 0;

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => {
        if (product.variants.length) return router.push(`/shop/${product.slug}`);
        add({
          productId: product._id,
          slug: product.slug,
          name: product.name,
          image: product.images[0] ?? "",
          priceCents: product.priceCents,
          quantity: 1,
          maxQuantity: product.stock,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
      aria-label={
        soldOut ? `${product.name} is sold out` : product.variants.length ? `Choose options for ${product.name}` : `Add ${product.name} to bag`
      }
      className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-copper text-white shadow-sm transition hover:bg-copper-dark disabled:cursor-not-allowed disabled:bg-blush"
    >
      {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.7} />}
      <span className="sr-only" aria-live="polite">
        {added ? "Added to bag" : ""}
      </span>
    </button>
  );
}
