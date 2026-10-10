"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export type QuoteLine = {
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
export type QuoteResult = { lines: QuoteLine[]; gift: QuoteLine | null; subtotalCents: number; issues: string[]; hasCombo: boolean };

/** Fetches server-calculated prices for the current bag and syncs stale cart data. */
export function useQuote() {
  const { items, ready, replaceAll } = useCart();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const signature = JSON.stringify(items.map((i) => [i.productId, i.variantId ?? "", i.quantity]));

  useEffect(() => {
    if (!ready) return;
    if (items.length === 0) {
      setQuote({ lines: [], gift: null, subtotalCents: 0, issues: [], hasCombo: false });
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })) }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load prices");
        setQuote(j);
        setError("");
        // Keep the stored bag in line with what the server accepted.
        const next = items
          .map((i) => {
            const line = (j.lines as QuoteLine[]).find((l) => l.productId === i.productId && (l.variantId ?? "") === (i.variantId ?? ""));
            return line ? { ...i, quantity: line.quantity, priceCents: line.unitCents, maxQuantity: line.available, name: line.name, image: line.image || i.image } : null;
          })
          .filter((x): x is NonNullable<typeof x> => !!x);
        if (JSON.stringify(next) !== JSON.stringify(items)) replaceAll(next);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, ready]);

  return { quote, loading, error };
}
