import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/storefront/PageHeader";
import { PosterGallery } from "@/components/storefront/PosterGallery";
import { POSTERS } from "@/lib/content/media";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Explore the Sienna Filipina product gallery — skincare, body care, soaps and wellness favourites.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader eyebrow="Gallery" heading="Our product gallery" intro="A closer look at the skincare, body care and wellness favourites we carry." />
      <section className="container-site pb-16">
        <PosterGallery posters={POSTERS} />
        <div className="mt-10 text-center">
          <Link href="/contact" className="btn btn-primary">
            Ask about a product <ArrowRight className="arrow h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
