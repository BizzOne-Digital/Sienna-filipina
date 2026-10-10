import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { Clock } from "lucide-react";
import { hmac, safeEqual } from "@/lib/auth/crypto";
import { getSettings } from "@/lib/content/queries";
import { connectDB } from "@/lib/db/connect";
import { formatDate, formatMoney } from "@/lib/format";
import { Order } from "@/models";

export const metadata: Metadata = { title: "Order received", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> };

const STATUS_TEXT: Record<string, string> = {
  pending_payment: "Awaiting payment confirmation",
  paid: "Payment received",
  processing: "Being prepared",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const [{ id }, { token }] = await Promise.all([params, searchParams]);
  // The order ID alone is not enough: the secret token issued at checkout must match.
  if (!isValidObjectId(id) || !token || token.length > 100) notFound();
  await connectDB();
  const order = await Order.findById(id).select("+accessTokenHash").lean();
  if (!order || !safeEqual(order.accessTokenHash, hmac(token, "order"))) notFound();
  const settings = await getSettings();

  return (
    <section className="container-site max-w-3xl py-14 sm:py-20">
      <p className="eyebrow text-center">Order {order.orderNumber}</p>
      <h1 className="mt-3 text-center text-[2.6rem] sm:text-5xl">Thank you, {order.customer?.name?.split(" ")[0] ?? ""}</h1>
      <p className="mx-auto mt-4 max-w-xl text-center leading-relaxed text-cocoa">
        Your order has been received. <strong className="text-espresso">No payment has been taken.</strong> We will email{" "}
        {order.customer?.email} to confirm availability, delivery and payment details.
      </p>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-copper" aria-hidden />
        <span>Status: {STATUS_TEXT[order.status] ?? order.status}</span>
      </div>

      <div className="mt-10 border border-line bg-[#fffdfa] p-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm text-cocoa">
          <span>Placed {formatDate(order.createdAt)}</span>
          <span>Bookmark this page to check your order status.</span>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {it.name}
                {it.variantName ? ` (${it.variantName})` : ""} × {it.quantity}
              </span>
              <span className="tabular-nums">{it.isGift ? "Free" : formatMoney(it.lineCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-cocoa">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cocoa">Delivery</dt>
            <dd>{order.shippingCents ? formatMoney(order.shippingCents) : "To be confirmed"}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Payment</dt>
            <dd>{order.paymentStatus === "paid" ? "Received" : "Not yet paid"}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">
          Continue shopping
        </Link>
        {settings.email && (
          <a href={`mailto:${settings.email}?subject=${encodeURIComponent(`Order ${order.orderNumber}`)}`} className="btn btn-outline">
            Email us about this order
          </a>
        )}
      </div>
    </section>
  );
}
