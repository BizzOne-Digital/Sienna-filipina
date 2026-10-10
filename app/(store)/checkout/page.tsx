import type { Metadata } from "next";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { getSettings } from "@/lib/content/queries";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <section className="container-site py-12 sm:py-16">
      <h1 className="text-[2.6rem] sm:text-5xl">Checkout</h1>
      <CheckoutForm shippingNote={settings.shippingNote} />
    </section>
  );
}
