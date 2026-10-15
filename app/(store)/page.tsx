import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PosterGallery } from "@/components/storefront/PosterGallery";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ReelsStrip } from "@/components/storefront/ReelsStrip";
import { POSTERS, REELS } from "@/lib/content/media";
import { SafeImage } from "@/components/ui/SafeImage";
import { getBlogs, getFeaturedProducts, getPage } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("home");
  return {
    title: seoTitle ? { absolute: seoTitle } : undefined,
    description: seoDescription || undefined,
    alternates: { canonical: "/" },
  };
}

function Arrow() {
  return <ArrowRight className="arrow h-4 w-4" strokeWidth={1.6} aria-hidden />;
}

function HeroHeading({ text }: { text: string }) {
  // "Your glow. Your style." -> two lines, matching the reference.
  const parts = text.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  return (
    <h1 className="text-[3.1rem] leading-[0.98] text-espresso sm:text-[4.4rem] lg:text-[5.4rem]">
      {parts.map((p, i) => (
        <span key={i} className="block">
          {p}
        </span>
      ))}
    </h1>
  );
}

export default async function HomePage() {
  const [{ data: c }, featured, posts] = await Promise.all([getPage("home"), getFeaturedProducts(3), getBlogs({ limit: 2 })]);

  return (
    <>
      {/* C. Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ivory via-ivory to-blush-soft">
        <div className="relative lg:min-h-[clamp(600px,45vw,820px)]">
          <div className="relative aspect-[4/3.4] w-full sm:aspect-[16/10] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[72%]">
            <SafeImage
              src={c.heroImage}
              alt={c.heroImageAlt || "Sienna Filipina skincare and beauty"}
              fill
              priority
              sizes="(min-width: 1024px) 72vw, 100vw"
              className="object-cover object-[68%_center] lg:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/10 to-transparent lg:bg-gradient-to-r lg:from-ivory/80 lg:via-ivory/10 lg:to-transparent" />
          </div>
          <div className="container-site relative -mt-20 pb-14 sm:-mt-28 lg:mt-0 lg:flex lg:min-h-[clamp(600px,45vw,820px)] lg:items-center lg:py-20">
            <div className="max-w-xl">
              <p className="eyebrow">{c.heroEyebrow}</p>
              <div className="mt-5">
                <HeroHeading text={c.heroHeading} />
              </div>
              <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-cocoa sm:text-lg">{c.heroDescription}</p>
              <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                <Link href="/shop?category=skincare" className="btn btn-primary">
                  {c.heroPrimaryLabel} <Arrow />
                </Link>
                <Link href="/shop?category=apparel" className="btn btn-outline bg-ivory/60">
                  {c.heroSecondaryLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. Collection tiles */}
      <section aria-label="Collections" className="container-site grid gap-4 py-4 md:grid-cols-2 md:gap-5 md:py-5">
        {[
          { title: c.tile1Title, text: c.tile1Text, button: c.tile1Button, image: c.tile1Image, href: "/shop?category=skincare" },
          { title: c.tile2Title, text: c.tile2Text, button: c.tile2Button, image: c.tile2Image, href: "/shop?category=apparel" },
        ].map((t) => (
          <article key={t.title} className="group relative min-h-[300px] overflow-hidden bg-cream sm:min-h-[340px]">
            <SafeImage
              src={t.image}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-[70%_center] transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ivory/95 via-ivory/55 to-transparent" />
            <div className="relative flex h-full max-w-[17rem] flex-col justify-center p-7 sm:p-10">
              <h2 className="text-[2.3rem] leading-[1.02] text-espresso sm:text-[2.6rem]">{t.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-cocoa">{t.text}</p>
              <Link href={t.href} className="btn btn-primary mt-6 self-start">
                {t.button} <Arrow />
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* E. Featured products */}
      <section className="container-site py-16 sm:py-20">
        <div className="text-center">
          <p className="eyebrow">{c.collectionEyebrow}</p>
          <h2 className="mt-3 text-[2.5rem] sm:text-[3.2rem]">{c.collectionHeading}</h2>
          <p className="mt-2 text-cocoa">{c.collectionSubheading}</p>
        </div>
        {featured.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-cocoa">New products are on the way.</p>
        )}
        <div className="mt-10 text-center">
          <Link href="/shop" className="btn btn-outline">
            View all products <Arrow />
          </Link>
        </div>
      </section>

      {/* E2. Reels */}
      <section className="bg-blush-soft/50">
        <div className="container-site py-16 sm:py-20">
          <div className="mb-8 text-center">
            <p className="eyebrow">As Seen on Reels</p>
            <h2 className="mt-3 text-[2.5rem] sm:text-[3.2rem]">Our favourites, in motion.</h2>
          </div>
          <ReelsStrip reels={REELS} />
        </div>
      </section>

      {/* E3. Product gallery preview */}
      <section className="container-site py-16 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Product Gallery</p>
            <h2 className="mt-3 text-[2.2rem] sm:text-[2.7rem]">What we carry.</h2>
          </div>
          <Link href="/gallery" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-copper hover:text-copper-dark">
            View full gallery <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <PosterGallery posters={POSTERS.slice(0, 8)} />
      </section>

      {/* F. Combo promotion */}
      <section className="relative overflow-hidden bg-blush-soft">
        <div className="absolute inset-0 hidden md:block">
          <SafeImage src={c.comboImage} alt="" fill sizes="100vw" className="object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-blush-soft/90 via-blush-soft/30 to-transparent" />
        </div>
        <div className="relative grid md:grid-cols-2">
          <div className="container-site flex flex-col justify-center py-12 md:mr-0 md:max-w-none md:py-16 md:pl-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))]">
            <h2 className="text-[2.2rem] leading-[1.05] sm:text-[2.7rem]">{c.comboHeading}</h2>
            <p className="mt-3 text-cocoa">{c.comboText}</p>
            <Link href="/shop?category=combos" className="btn btn-primary mt-7 self-start">
              {c.comboButton} <Arrow />
            </Link>
          </div>
          <div className="relative min-h-[260px] md:min-h-[320px] [&>img]:md:hidden">
            <SafeImage src={c.comboImage} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-blush-soft/15 to-transparent md:hidden" />
          </div>
        </div>
      </section>

      {/* G. Brand story */}
      <section className="container-site grid items-center gap-10 py-16 sm:py-20 md:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden bg-cream">
          <SafeImage src={c.storyImage} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <p className="eyebrow">{c.storyEyebrow}</p>
          <h2 className="mt-3 text-[2.4rem] sm:text-[2.9rem]">{c.storyHeading}</h2>
          <p className="mt-3 text-lg text-espresso">{c.storyLead}</p>
          <p className="mt-4 max-w-lg leading-relaxed text-cocoa">{c.storyBody}</p>
          <Link href="/about-us" className="btn btn-outline mt-7">
            {c.storyButton} <Arrow />
          </Link>
        </div>
      </section>

      {/* H. Journal preview */}
      <section className="container-site pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{c.journalEyebrow}</p>
            <h2 className="mt-3 text-[2.2rem] sm:text-[2.7rem]">{c.journalHeading}</h2>
          </div>
          <Link href="/blogs" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-copper hover:text-copper-dark">
            View All Blogs <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {posts.length ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {posts.map((post) => (
              <article key={post._id} className="group relative grid grid-cols-1 gap-5 sm:grid-cols-[1fr_1.1fr] sm:items-center">
                <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                  <SafeImage
                    src={post.coverImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div>
                  <p className="eyebrow text-[0.66rem]">{post.category}</p>
                  <h3 className="mt-2 text-[1.7rem] leading-tight">
                    <Link href={`/blogs/${post.slug}`} className="after:absolute after:inset-0">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cocoa">{post.excerpt}</p>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-copper">
                    Read More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-cocoa">Journal articles are coming soon.</p>
        )}
      </section>
    </>
  );
}
