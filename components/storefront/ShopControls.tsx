"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function ShopControls() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const go = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    next.delete("page");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: (new FormData(e.currentTarget).get("q") as string).trim() });
        }}
      >
        <label htmlFor="shop-q" className="sr-only">
          Search products
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-copper" aria-hidden />
        <input id="shop-q" name="q" type="search" defaultValue={sp.get("q") ?? ""} placeholder="Search products" className="field pl-9" />
      </form>
      <div className="flex items-center gap-2">
        <label htmlFor="shop-sort" className="text-sm text-cocoa">
          Sort
        </label>
        <select
          id="shop-sort"
          className="field w-auto min-w-[11rem]"
          value={sp.get("sort") ?? "featured"}
          onChange={(e) => go({ sort: e.target.value === "featured" ? "" : e.target.value })}
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </div>
  );
}
