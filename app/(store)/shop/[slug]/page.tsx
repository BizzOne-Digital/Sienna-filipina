import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Gift } from "lucide-react";
import { AddToCart } from "@/components/storefront/AddToCart";
import { RichText } from "@/components/storefront/PageHeader";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { getProductBySlug, getRelatedProducts, getSettings } from "@/lib/content/queries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  const description = product.seoDescription || product.shortDescription || undefined;
  const image = product.images[0];
  return {
    title: product.seoTitle || product.name,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: { title: product.name, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [related, settings] = await Promise.all([
    getRelatedProducts(product._id, product.category?._id),
    getSettings(),
  ]);
  const comboText = product.comboOffer || (product.category?.isCombo ? settings.comboOfferText : "");

  return (
    <>
      <div className="container-site pt-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-cocoa">
            <li><Link href="/" className="hover:text-copper">Home</Link></li>
            <li aria-hidden><ChevronRight className="h-3 w-3" /></li>
            <li><Link href="/shop" className="hover:text-copper">Shop</Link></li>
            {product.category && (
              <>
                <li aria-hidden><ChevronRight className="h-3 w-3" /></li>
                <li><Link href={`/shop?category=${product.category.slug}`} className="hover:text-copper">{product.category.name}</Link></li>
              </>
            )}
            <li aria-hidden><ChevronRight className="h-3 w-3" /></li>
            <li aria-current="page" className="text-espresso">{product.name}</li>
          </ol>
        </nav>
      </div>

      <section className="container-site grid gap-10 py-8 lg:grid-cols-2 lg:gap-16 lg:py-12">
        <ProductGallery images={product.images} name={product.name} />
        <div className="lg:pt-4">
          {product.category && <p className="eyebrow">{product.category.name}</p>}
          <h1 className="mt-3 text-[2.6rem] sm:text-5xl">{product.name}</h1>
          {product.shortDescription && <p className="mt-4 text-lg leading-relaxed text-cocoa">{product.shortDescription}</p>}
          <div className="mt-6 border-t border-line pt-6">
            <AddToCart product={product} />
          </div>
          {comboText && (
            <div className="mt-6 flex gap-3 border border-line bg-blush-soft/60 p-4 text-sm text-espresso">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-copper" aria-hidden />
              <p>{comboText}</p>
            </div>
          )}
          {product.description && (
            <div className="mt-8 border-t border-line pt-8">
              <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-espresso">Details</h2>
              <RichText text={product.description} />
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-site pb-20 pt-6">
          <h2 className="text-[2.2rem]">You may also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} sizes="(min-width: 1024px) 23vw, (min-width: 480px) 48vw, 100vw" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
