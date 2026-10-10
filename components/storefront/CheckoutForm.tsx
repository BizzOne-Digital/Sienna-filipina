"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatMoney } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useQuote } from "./useQuote";

function Field({ id, label, required, ...rest }: { id: string; label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span aria-hidden className="text-copper">*</span>}
      </label>
      <input id={id} name={id} required={required} className="field" {...rest} />
    </div>
  );
}

export function CheckoutForm({ shippingNote }: { shippingNote: string }) {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const { quote, loading, error } = useQuote();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; issues?: string[] } | null>(null);

  if (!ready) return <p className="mt-8 text-cocoa">Loading…</p>;
  if (items.length === 0) {
    return (
      <div className="mt-10 border border-dashed border-line bg-[#fffdfa] px-6 py-16 text-center">
        <h2 className="text-3xl">Your bag is empty</h2>
        <Link href="/shop" className="btn btn-primary mt-6">
          Browse the shop
        </Link>
      </div>
    );
  }

  const canSubmit = !loading && !error && !!quote?.lines.length && !quote.issues.length && !submitting;

  return (
    <form
      className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!quote) return;
        const fd = new FormData(e.currentTarget);
        const v = (k: string) => String(fd.get(k) ?? "").trim();
        setSubmitting(true);
        setSubmitError(null);
        try {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
              customer: { name: v("name"), email: v("email"), phone: v("phone") },
              shippingAddress: {
                line1: v("line1"),
                line2: v("line2"),
                city: v("city"),
                state: v("state"),
                postalCode: v("postalCode"),
                country: v("country"),
              },
              notes: v("notes"),
              expectedTotalCents: quote.subtotalCents,
            }),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) {
            setSubmitError({ message: j.error || "Your order could not be placed.", issues: j.issues });
            setSubmitting(false);
            return;
          }
          clear();
          router.replace(`/order-confirmation/${j.orderId}?token=${encodeURIComponent(j.token)}`);
        } catch {
          setSubmitError({ message: "Network error. Please check your connection and try again." });
          setSubmitting(false);
        }
      }}
    >
      <div className="space-y-10">
        <div className="flex gap-3 border border-line bg-blush-soft/60 p-4 text-sm leading-relaxed text-espresso">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-copper" aria-hidden />
          <p>
            <strong className="font-semibold">Manual payment order.</strong> No payment is taken on this website. After you
            place your order we will email you to confirm availability, delivery and how to pay. Your order is only
            processed once payment is confirmed.
          </p>
        </div>

        <fieldset className="space-y-5">
          <legend className="mb-2 font-serif text-[1.8rem]">Contact</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Full name" required autoComplete="name" minLength={2} maxLength={120} />
            <Field id="email" label="Email" required type="email" autoComplete="email" maxLength={200} />
            <Field id="phone" label="Phone (optional)" type="tel" autoComplete="tel" maxLength={40} />
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-2 font-serif text-[1.8rem]">Delivery address</legend>
          <Field id="line1" label="Address" required autoComplete="address-line1" maxLength={200} />
          <Field id="line2" label="Apartment, suite, etc. (optional)" autoComplete="address-line2" maxLength={200} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="city" label="City" required autoComplete="address-level2" maxLength={100} />
            <Field id="state" label="State / Province" autoComplete="address-level1" maxLength={100} />
            <Field id="postalCode" label="Postal code" required autoComplete="postal-code" maxLength={20} />
            <Field id="country" label="Country" required autoComplete="country-name" defaultValue="United States" maxLength={100} />
          </div>
          <div>
            <label htmlFor="notes" className="field-label">Order notes (optional)</label>
            <textarea id="notes" name="notes" maxLength={1000} rows={3} className="field" />
          </div>
        </fieldset>
      </div>

      <aside className="h-fit border border-line bg-[#fffdfa] p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="text-[1.9rem]">Your order</h2>
        {loading && !quote ? (
          <p className="mt-4 text-sm text-cocoa">Calculating…</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {[...(quote?.lines ?? []), ...(quote?.gift ? [quote.gift] : [])].map((l) => (
              <li key={`${l.productId}-${l.variantId ?? ""}-${l.isGift ? "g" : ""}`} className="flex gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-cream">
                  <SafeImage src={l.image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="text-espresso">{l.name}</p>
                  <p className="text-cocoa">
                    {l.variantName ? `${l.variantName} · ` : ""}Qty {l.quantity}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{l.isGift ? "Free" : formatMoney(l.lineCents)}</p>
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-cocoa">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(quote?.subtotalCents ?? 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cocoa">Delivery</dt>
            <dd className="text-cocoa">Confirmed by email</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total due now</dt>
            <dd>$0 — pay after confirmation</dd>
          </div>
        </dl>
        {shippingNote && <p className="mt-3 text-xs leading-relaxed text-cocoa">{shippingNote}</p>}
        {(quote?.issues.length || submitError || error) && (
          <div role="alert" className="mt-4 border border-[#e5b9ad] bg-[#fbeee9] px-4 py-3 text-sm text-[#8a2f1f]">
            {submitError?.message ?? error}
            {[...(quote?.issues ?? []), ...(submitError?.issues ?? [])].map((i) => (
              <p key={i}>{i}</p>
            ))}
            <Link href="/cart" className="mt-1 inline-block underline">
              Review bag
            </Link>
          </div>
        )}
        <button type="submit" className="btn btn-primary mt-6 w-full" disabled={!canSubmit}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {submitting ? "Placing order…" : "Place order (pay later)"}
        </button>
        <p className="mt-3 text-center text-xs text-cocoa">Subtotal of {formatMoney(quote?.subtotalCents ?? 0)} is payable once we confirm your order.</p>
      </aside>
    </form>
  );
}
