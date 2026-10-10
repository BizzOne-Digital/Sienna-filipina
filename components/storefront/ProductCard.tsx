import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatMoney } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";
import { QuickAddButton } from "./QuickAddButton";

export function priceText(p: Pick<ProductDTO, "priceCents" | "priceLabel">) {
  return `${p.priceLabel ? `${p.priceLabel} ` : ""}${formatMoney(p.priceCents)}`;
}

export function ProductCard({ product, sizes, priority }: { product: ProductDTO; sizes?: string; priority?: boolean }) {
  const soldOut = product.variants.length ? product.variants.every((v) => v.stock <= 0) : product.stock <= 0;
  return (
    <article className="group relative flex flex-col border border-line bg-[#fffdfa] transition-shadow duration-300 hover:shadow-[0_18px_40px_-28px_rgba(73,35,23,0.55)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <SafeImage
          src={product.images[0]}
          alt={product.name}
          fill
          priority={priority}
          sizes={sizes ?? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="absolute right-3 top-3 rounded-full bg-copper px-3 py-1 text-xs font-medium text-white">
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/85 px-3 py-1 text-xs font-medium text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <h3 className="truncate font-sans text-[0.95rem] font-medium tracking-normal text-espresso">
            <Link href={`/shop/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-cocoa">{priceText(product)}</p>
        </div>
        <QuickAddButton product={product} />
      </div>
    </article>
  );
}
