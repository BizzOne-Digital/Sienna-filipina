import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/storefront/PageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import { getPage } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("services");
  return {
    title: seoTitle || "Services",
    description: seoDescription || "Shop Sienna Filipina skincare, apparel and combos online.",
    alternates: { canonical: "/services" },
  };
}

export default async function ServicesPage() {
  const { data: c } = await getPage("services");
  const offerings = [
    { title: c.skincareTitle, text: c.skincareText, image: c.skincareImage, href: "/shop?category=skincare" },
    { title: c.apparelTitle, text: c.apparelText, image: c.apparelImage, href: "/shop?category=apparel" },
    { title: c.comboTitle, text: c.comboText, image: c.comboImage, href: "/shop?category=combos" },
  ];
  const steps = (c.orderingText ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} heading={c.heading} intro={c.intro} />
      <section className="container-site grid gap-6 pb-16 md:grid-cols-3">
        {offerings.map((o) => (
          <article key={o.title} className="group relative flex flex-col border border-line bg-[#fffdfa]">
            <div className="relative aspect-[4/3] overflow-hidden bg-cream">
              <SafeImage src={o.image} alt="" fill sizes="(min-width: 768px) 32vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h2 className="text-[2rem]">{o.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-cocoa">{o.text}</p>
              <Link href={o.href} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-copper after:absolute after:inset-0">
                Shop {o.title} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </section>
      {steps.length > 0 && (
        <section className="bg-cream/60">
          <div className="container-site py-16">
            <h2 className="text-center text-[2.4rem]">How ordering works</h2>
            <ol className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={i} className="border border-line bg-ivory p-6">
                  <span className="font-serif text-4xl text-rose">{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-3 text-sm leading-relaxed text-espresso">{s}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 text-center">
              <Link href="/contact" className="btn btn-outline">
                Questions? Contact us <ArrowRight className="arrow h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
