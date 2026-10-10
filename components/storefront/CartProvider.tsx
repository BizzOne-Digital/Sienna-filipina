"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  variantName?: string;
  image: string;
  /** Display hint only; the server recalculates every price. */
  priceCents: number;
  quantity: number;
  maxQuantity: number;
};

type CartCtx = {
  items: CartItem[];
  ready: boolean;
  count: number;
  add: (item: CartItem) => void;
  setQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  remove: (productId: string, variantId: string | undefined) => void;
  replaceAll: (items: CartItem[]) => void;
  clear: () => void;
};

const STORAGE_KEY = "sf_cart_v1";
const Ctx = createContext<CartCtx | null>(null);
const same = (a: CartItem, id: string, v?: string) => a.productId === id && (a.variantId ?? "") === (v ?? "");

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i && typeof i.productId === "string"));
      }
    } catch {
      // Storage unavailable (private mode); the cart still works for this visit.
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setItems(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => same(p, item.productId, item.variantId));
      if (existing) {
        return prev.map((p) =>
          same(p, item.productId, item.variantId)
            ? { ...p, ...item, quantity: Math.min(p.quantity + item.quantity, item.maxQuantity, 20) }
            : p
        );
      }
      return [...prev, { ...item, quantity: Math.min(item.quantity, item.maxQuantity, 20) }];
    });
  }, []);

  const setQuantity = useCallback((id: string, v: string | undefined, quantity: number) => {
    setItems((prev) =>
      prev.map((p) => (same(p, id, v) ? { ...p, quantity: Math.max(1, Math.min(quantity, p.maxQuantity, 20)) } : p))
    );
  }, []);

  const remove = useCallback((id: string, v: string | undefined) => {
    setItems((prev) => prev.filter((p) => !same(p, id, v)));
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      add,
      setQuantity,
      remove,
      replaceAll: setItems,
      clear: () => setItems([]),
    }),
    [items, ready, add, setQuantity, remove]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
