import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/storefront/PageHeader";
import { PosterGallery } from "@/components/storefront/PosterGallery";
import { POSTER_GROUPS } from "@/lib/content/media";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Explore the Sienna Filipina product gallery — body serums, lotions, sunscreen, soaps, coffee and collagen drinks.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader eyebrow="Gallery" heading="Our product gallery" intro="A closer look at the skincare, body care and wellness favourites we carry." />

      <nav aria-label="Gallery sections" className="container-site -mt-4 mb-10 flex flex-wrap justify-center gap-2">
        {POSTER_GROUPS.map((grp) => (
          <a
            key={grp.category}
            href={`#${grp.category}`}
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-[#fffdfa] px-5 text-sm text-espresso hover:border-copper"
          >
            {grp.title}
          </a>
        ))}
      </nav>

      <div className="container-site space-y-14 pb-16">
        {POSTER_GROUPS.map((grp) => (
          <section key={grp.category} id={grp.category} aria-labelledby={`${grp.category}-title`} className="scroll-mt-32">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <h2 id={`${grp.category}-title`} className="text-[2rem]">
                {grp.title}
              </h2>
              <Link href={`/shop?category=${grp.category}`} className="inline-flex min-h-11 items-center gap-1 text-sm text-copper hover:text-copper-dark">
                Shop {grp.title} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <PosterGallery posters={grp.posters} />
          </section>
        ))}
        <div className="text-center">
          <Link href="/contact" className="btn btn-primary">
            Ask about a product <ArrowRight className="arrow h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </>
  );
}
