"use client";

import Link from "next/link";
import { Gift, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatMoney } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useQuote } from "./useQuote";

export function CartView() {
  const { items, ready, setQuantity, remove } = useCart();
  const { quote, loading, error } = useQuote();

  if (!ready) return <p className="mt-8 text-cocoa">Loading your bag…</p>;
  if (items.length === 0) {
    return (
      <div className="mt-10 border border-dashed border-line bg-[#fffdfa] px-6 py-16 text-center">
        <h2 className="text-3xl">Your bag is empty</h2>
        <p className="mt-2 text-sm text-cocoa">Discover skincare and everyday pieces, thoughtfully selected for you.</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        {quote?.issues.length ? (
          <ul role="alert" className="mb-6 space-y-1 border border-[#e5c7a8] bg-[#fdf3e7] px-4 py-3 text-sm text-[#7a4a1d]">
            {quote.issues.map((i) => <li key={i}>{i}</li>)}
          </ul>
        ) : null}
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => {
            const line = quote?.lines.find((l) => l.productId === item.productId && (l.variantId ?? "") === (item.variantId ?? ""));
            const unit = line?.unitCents ?? item.priceCents;
            return (
              <li key={`${item.productId}-${item.variantId ?? ""}`} className="flex gap-4 py-5">
                <Link href={`/shop/${item.slug}`} className="relative aspect-square w-24 shrink-0 overflow-hidden bg-cream sm:w-28">
                  <SafeImage src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/shop/${item.slug}`} className="font-medium text-espresso hover:text-copper">
                        {item.name}
                      </Link>
                      {item.variantName && <p className="text-sm text-cocoa">{item.variantName}</p>}
                      <p className="mt-1 text-sm text-cocoa">{formatMoney(unit)} each</p>
                    </div>
                    <p className="shrink-0 font-medium tabular-nums">{formatMoney(unit * item.quantity)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center border border-line bg-[#fffdfa]" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" className="grid h-11 w-11 place-items-center disabled:opacity-40" disabled={item.quantity <= 1} onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)} aria-label="Decrease quantity">
                        <Minus className="h-4 w-4" />
                      </button>
                      <output className="w-8 text-center tabular-nums">{item.quantity}</output>
                      <button type="button" className="grid h-11 w-11 place-items-center disabled:opacity-40" disabled={item.quantity >= Math.min(item.maxQuantity, 20)} onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)} aria-label="Increase quantity">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button type="button" onClick={() => remove(item.productId, item.variantId)} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm text-cocoa hover:text-copper">
                      <Trash2 className="h-4 w-4" aria-hidden /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {quote?.gift && (
          <p className="mt-4 flex items-center gap-3 bg-blush-soft/70 px-4 py-3 text-sm">
            <Gift className="h-5 w-5 shrink-0 text-copper" aria-hidden /> {quote.gift.name} — included at no charge.
          </p>
        )}
      </div>

      <aside className="h-fit border border-line bg-[#fffdfa] p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="text-[1.9rem]">Summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-cocoa">Subtotal</dt>
            <dd className="font-medium tabular-nums" aria-live="polite">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Updating" /> : formatMoney(quote?.subtotalCents ?? 0)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cocoa">Delivery</dt>
            <dd className="text-cocoa">Confirmed after ordering</dd>
          </div>
        </dl>
        {error && <p role="alert" className="mt-4 text-sm text-[#8a2f1f]">{error}</p>}
        <Link
          href="/checkout"
          aria-disabled={loading || !!error || !quote?.lines.length}
          className={`btn btn-primary mt-6 w-full ${loading || error || !quote?.lines.length ? "pointer-events-none opacity-55" : ""}`}
        >
          Continue to checkout
        </Link>
        <Link href="/shop" className="btn btn-ghost mt-2 w-full">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
