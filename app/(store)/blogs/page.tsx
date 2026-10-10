import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/storefront/PageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import { getBlogCategories, getBlogs, getPage } from "@/lib/content/queries";
import { cn, formatDate } from "@/lib/format";

type SP = Promise<{ category?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("blogs");
  return {
    title: seoTitle || "The Sienna Journal",
    description: seoDescription || "Skincare rituals and everyday style notes from Sienna Filipina.",
    alternates: { canonical: "/blogs" },
  };
}

export default async function BlogsPage({ searchParams }: { searchParams: SP }) {
  const { category } = await searchParams;
  const [{ data: c }, categories, posts] = await Promise.all([
    getPage("blogs"),
    getBlogCategories(),
    getBlogs({ category: category?.slice(0, 60) }),
  ]);

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} heading={c.heading} intro={c.intro} />
      <section className="container-site pb-20">
        {categories.length > 1 && (
          <nav aria-label="Article categories" className="mb-10 flex flex-wrap justify-center gap-2">
            {["", ...categories].map((cat) => {
              const on = (category ?? "") === cat;
              return (
                <Link
                  key={cat || "all"}
                  href={cat ? `/blogs?category=${encodeURIComponent(cat)}` : "/blogs"}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border px-5 text-sm",
                    on ? "border-copper bg-copper text-white" : "border-line bg-[#fffdfa] hover:border-copper"
                  )}
                >
                  {cat || "All"}
                </Link>
              );
            })}
          </nav>
        )}
        {posts.length === 0 ? (
          <EmptyState title="No articles yet" text="New journal entries are on the way." />
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <article key={post._id} className="group relative flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                  <SafeImage
                    src={post.coverImage}
                    alt=""
                    fill
                    priority={i < 3}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="eyebrow mt-5 text-[0.66rem]">
                  {post.category}
                  {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""}
                </p>
                <h2 className="mt-2 text-[1.8rem] leading-tight">
                  <Link href={`/blogs/${post.slug}`} className="after:absolute after:inset-0">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cocoa">{post.excerpt}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-copper">
                  Read More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
