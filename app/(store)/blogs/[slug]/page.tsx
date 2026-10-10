import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RichText } from "@/components/storefront/PageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import { getBlogBySlug, getBlogs } from "@/lib/content/queries";
import { formatDate } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getBlogBySlug((await params).slug);
  if (!post) return { title: "Article not found" };
  const description = post.seoDescription || post.excerpt || undefined;
  return {
    title: post.seoTitle || post.title,
    description,
    alternates: { canonical: `/blogs/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.publishedAt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const post = await getBlogBySlug((await params).slug);
  if (!post) notFound();
  const more = (await getBlogs({ limit: 4 })).filter((p) => p._id !== post._id).slice(0, 2);

  return (
    <article>
      <header className="container-site max-w-3xl pt-10 text-center sm:pt-14">
        <Link href="/blogs" className="inline-flex min-h-11 items-center gap-2 text-sm text-copper hover:text-copper-dark">
          <ArrowLeft className="h-4 w-4" aria-hidden /> The Sienna Journal
        </Link>
        <p className="eyebrow mt-4">
          {post.category}
          {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""}
        </p>
        <h1 className="mt-3 text-[2.6rem] sm:text-[3.6rem]">{post.title}</h1>
        {post.excerpt && <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cocoa">{post.excerpt}</p>}
      </header>
      <div className="container-site mt-10 max-w-5xl">
        <div className="relative aspect-[16/9] overflow-hidden bg-cream">
          <SafeImage src={post.coverImage} alt="" fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover" />
        </div>
      </div>
      <div className="container-site max-w-2xl py-12 text-[1.05rem]">
        <RichText text={post.content} />
      </div>
      {more.length > 0 && (
        <aside className="border-t border-line bg-cream/40">
          <div className="container-site py-14">
            <h2 className="text-[2rem]">Keep reading</h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2">
              {more.map((p) => (
                <li key={p._id} className="group relative flex gap-4">
                  <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-cream">
                    <SafeImage src={p.coverImage} alt="" fill sizes="112px" className="object-cover" />
                  </div>
                  <div>
                    <p className="eyebrow text-[0.62rem]">{p.category}</p>
                    <Link href={`/blogs/${p.slug}`} className="mt-1 block font-serif text-xl leading-tight after:absolute after:inset-0 group-hover:text-copper">
                      {p.title}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </article>
  );
}
