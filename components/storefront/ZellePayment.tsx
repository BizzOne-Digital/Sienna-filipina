import { formatMoney } from "@/lib/format";

/** Zelle is the store's only payment method. Shown at checkout and on the order confirmation page. */
export function ZellePayment({
  name,
  phone,
  orderNumber,
  totalCents,
}: {
  name: string;
  phone: string;
  orderNumber?: string;
  totalCents?: number;
}) {
  if (!phone) return null;
  return (
    <div className="border border-line bg-blush-soft/60 p-5 text-sm leading-relaxed text-espresso">
      <p className="eyebrow">Payment</p>
      <h2 className="mt-2 font-serif text-[1.6rem] leading-tight">Pay with Zelle</h2>
      <p className="mt-2 text-cocoa">We accept Zelle only. No payment is taken on this website.</p>
      <dl className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="text-cocoa">Send to</dt>
        <dd>
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-semibold tabular-nums text-espresso hover:text-copper">
            {phone}
          </a>
        </dd>
        {name && (
          <>
            <dt className="text-cocoa">Name</dt>
            <dd className="font-semibold">{name}</dd>
          </>
        )}
        {totalCents != null && (
          <>
            <dt className="text-cocoa">Amount</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(totalCents)}</dd>
          </>
        )}
        {orderNumber && (
          <>
            <dt className="text-cocoa">Memo / note</dt>
            <dd className="font-semibold">{orderNumber}</dd>
          </>
        )}
      </dl>
      <p className="mt-4 text-xs text-cocoa">
        {orderNumber
          ? "Please add your order number in the Zelle memo. Your order is prepared once payment is received."
          : "After you place your order, send the total by Zelle with your order number in the memo. Your order is prepared once payment is received."}
      </p>
    </div>
  );
}
