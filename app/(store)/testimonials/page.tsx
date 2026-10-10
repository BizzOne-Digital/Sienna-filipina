import type { Metadata } from "next";
import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/storefront/PageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import { getPage, getTestimonials } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("testimonials");
  return {
    title: seoTitle || "Testimonials",
    description: seoDescription || "What customers say about Sienna Filipina.",
    alternates: { canonical: "/testimonials" },
  };
}

export default async function TestimonialsPage() {
  const [{ data: c }, items] = await Promise.all([getPage("testimonials"), getTestimonials()]);
  return (
    <>
      <PageHeader eyebrow={c.eyebrow} heading={c.heading} intro={items.length ? c.intro : undefined} />
      <section className="container-site pb-20">
        {items.length === 0 ? (
          <EmptyState
            title="No testimonials yet"
            text="We are a new boutique and will share genuine customer feedback here as it arrives. Ordered from us? We would love to hear from you."
            action={
              <Link href="/contact" className="btn btn-outline">
                Share your experience
              </Link>
            }
          />
        ) : (
          <ul className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {items.map((t) => (
              <li key={t._id} className="mb-6 break-inside-avoid border border-line bg-[#fffdfa] p-7">
                <Quote className="h-6 w-6 text-rose" aria-hidden />
                {t.rating ? (
                  <p className="mt-3 flex gap-0.5" aria-label={`Rated ${t.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < t.rating! ? "fill-rose text-rose" : "text-line"}`} aria-hidden />
                    ))}
                  </p>
                ) : null}
                <blockquote className="mt-4 font-serif text-xl leading-snug text-espresso">“{t.quote}”</blockquote>
                <div className="mt-5 flex items-center gap-3">
                  {t.photo && (
                    <div className="relative h-11 w-11 overflow-hidden rounded-full bg-cream">
                      <SafeImage src={t.photo} alt="" fill sizes="44px" className="object-cover" />
                    </div>
                  )}
                  <p className="text-sm">
                    <span className="font-medium text-espresso">{t.name}</span>
                    {t.location && <span className="text-cocoa"> · {t.location}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
