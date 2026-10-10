import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/storefront/PageHeader";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ShopControls } from "@/components/storefront/ShopControls";
import { getCategories, getPage, queryProducts } from "@/lib/content/queries";
import { cn } from "@/lib/format";

type SP = Promise<{ category?: string; q?: string; sort?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const [{ seoTitle, seoDescription }, sp, cats] = await Promise.all([getPage("shop"), searchParams, getCategories()]);
  const cat = cats.find((c) => c.slug === sp.category);
  return {
    title: cat ? `Shop ${cat.name}` : seoTitle || "Shop",
    description: cat?.description || seoDescription || "Shop skincare, apparel and combos from Sienna Filipina.",
    alternates: { canonical: cat ? `/shop?category=${cat.slug}` : "/shop" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ data: c }, categories, result] = await Promise.all([
    getPage("shop"),
    getCategories(),
    queryProducts({ category: sp.category, q: sp.q?.slice(0, 60), sort: sp.sort, page, pageSize: 9 }),
  ]);
  const active = categories.find((x) => x.slug === sp.category);

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { category: sp.category, q: sp.q, sort: sp.sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/shop${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} heading={active ? active.name : c.heading} intro={active?.description || c.intro} />
      <section className="container-site pb-20">
        <nav aria-label="Categories" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {[{ slug: "", name: "All" }, ...categories].map((cat) => {
            const on = (sp.category ?? "") === cat.slug;
            return (
              <Link
                key={cat.slug || "all"}
                href={href({ category: cat.slug || undefined, page: undefined })}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm transition-colors",
                  on ? "border-copper bg-copper text-white" : "border-line bg-[#fffdfa] text-espresso hover:border-copper"
                )}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          <Suspense>
            <ShopControls />
          </Suspense>
        </div>

        <p className="mt-6 text-sm text-cocoa" aria-live="polite">
          {result.total} {result.total === 1 ? "product" : "products"}
          {sp.q ? ` matching “${sp.q}”` : ""}
        </p>

        {result.items.length ? (
          <div className="mt-6 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {result.items.map((p, i) => (
              <ProductCard key={p._id} product={p} priority={i < 3} sizes="(min-width: 1024px) 30vw, (min-width: 480px) 48vw, 100vw" />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Nothing found"
              text="No products match your selection yet. Try another category or search term."
              action={
                <Link href="/shop" className="btn btn-outline">
                  View all products
                </Link>
              }
            />
          </div>
        )}

        {result.pages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
            {result.page > 1 ? (
              <Link href={href({ page: String(result.page - 1) })} className="btn btn-ghost btn-sm" aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : null}
            {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={href({ page: n === 1 ? undefined : String(n) })}
                aria-current={n === result.page ? "page" : undefined}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full text-sm",
                  n === result.page ? "bg-copper text-white" : "text-espresso hover:bg-cream"
                )}
              >
                {n}
              </Link>
            ))}
            {result.page < result.pages ? (
              <Link href={href({ page: String(result.page + 1) })} className="btn btn-ghost btn-sm" aria-label="Next page">
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </nav>
        )}
      </section>
    </>
  );
}
