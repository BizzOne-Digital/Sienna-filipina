import type { Metadata } from "next";
import { CartView } from "@/components/storefront/CartView";

export const metadata: Metadata = { title: "Shopping Bag", robots: { index: false } };

export default function CartPage() {
  return (
    <section className="container-site py-12 sm:py-16">
      <h1 className="text-[2.6rem] sm:text-5xl">Your bag</h1>
      <CartView />
    </section>
  );
}
