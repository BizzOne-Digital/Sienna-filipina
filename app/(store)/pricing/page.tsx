import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/storefront/PageHeader";
import { getAllPublishedPrices, getPage } from "@/lib/content/queries";
import { formatMoney } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("pricing");
  return {
    title: seoTitle || "Pricing",
    description: seoDescription || "Current Sienna Filipina prices for skincare, apparel and combos.",
    alternates: { canonical: "/pricing" },
  };
}

export default async function PricingPage() {
  const [{ data: c }, products] = await Promise.all([getPage("pricing"), getAllPublishedPrices()]);

  const groups = new Map<string, { name: string; slug: string; items: typeof products }>();
  for (const p of products) {
    const key = p.category?.slug ?? "other";
    if (!groups.has(key)) groups.set(key, { name: p.category?.name ?? "Other", slug: key, items: [] });
    groups.get(key)!.items.push(p);
  }
  const all = products.flatMap((p) => [p.priceCents, ...p.variants.map((v) => v.priceCents ?? p.priceCents)]);
  const min = all.length ? Math.min(...all) : null;
  const max = all.length ? Math.max(...all) : null;

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} heading={c.heading} intro={c.intro}>
        {min != null && max != null && (
          <p className="mt-8 inline-flex items-baseline gap-3 border border-line bg-[#fffdfa] px-6 py-4">
            <span className="text-sm text-cocoa">Current range</span>
            <span className="font-serif text-3xl text-espresso">
              {formatMoney(min)} – {formatMoney(max)}
            </span>
          </p>
        )}
      </PageHeader>
      <section className="container-site max-w-4xl pb-20">
        {groups.size === 0 ? (
          <EmptyState title="Prices coming soon" text="Products are being prepared. Please check back shortly." />
        ) : (
          <div className="space-y-12">
            {[...groups.values()].map((g) => (
              <div key={g.slug}>
                <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
                  <h2 className="text-[2rem]">{g.name}</h2>
                  {g.slug !== "other" && (
                    <Link href={`/shop?category=${g.slug}`} className="inline-flex min-h-11 items-center gap-1 text-sm text-copper hover:text-copper-dark">
                      Shop {g.name} <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  )}
                </div>
                <ul className="divide-y divide-line">
                  {g.items.map((p) => (
                    <li key={p._id} className="py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <Link href={`/shop/${p.slug}`} className="text-espresso hover:text-copper">
                          {p.name}
                        </Link>
                        <span className="shrink-0 tabular-nums text-espresso">
                          {p.priceLabel ? `${p.priceLabel} ` : ""}
                          {formatMoney(p.priceCents)}
                        </span>
                      </div>
                      {p.variants.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-4 text-sm text-cocoa">
                          {p.variants.map((v) => (
                            <li key={v._id} className="flex justify-between gap-4">
                              <span>{v.name}</span>
                              <span className="tabular-nums">{formatMoney(v.priceCents ?? p.priceCents)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {c.note && <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-cocoa">{c.note}</p>}
      </section>
    </>
  );
}
