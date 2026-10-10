import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RichText } from "@/components/storefront/PageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import { getPage, getSettings } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("about");
  return {
    title: seoTitle || "About Us",
    description: seoDescription || "About Sienna Filipina — skincare and apparel for women of all ages.",
    alternates: { canonical: "/about-us" },
  };
}

export default async function AboutPage() {
  const [{ data: c }, settings] = await Promise.all([getPage("about"), getSettings()]);
  return (
    <>
      <section className="bg-gradient-to-b from-cream/70 to-ivory">
        <div className="container-site grid items-center gap-10 py-14 md:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <p className="eyebrow">{c.eyebrow}</p>
            <h1 className="mt-3 text-[2.8rem] sm:text-6xl">{c.heading}</h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-cocoa">{c.intro}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-cream">
            <SafeImage src={c.heroImage} alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="container-site grid items-center gap-10 py-16 md:grid-cols-2 lg:gap-16">
        <div className="relative order-last aspect-[4/3] overflow-hidden bg-cream md:order-first">
          <SafeImage src={c.storyImage} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 className="text-[2.4rem]">{c.storyHeading}</h2>
          <div className="mt-4">
            <RichText text={c.storyBody ?? ""} />
          </div>
        </div>
      </section>

      <section className="bg-blush-soft">
        <div className="container-site py-16 text-center">
          <h2 className="text-[2.4rem]">{c.offerHeading}</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-cocoa">{c.offerBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn btn-primary">
              Shop the collection <ArrowRight className="arrow h-4 w-4" aria-hidden />
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Get in touch
            </Link>
          </div>
          {settings.email && (
            <p className="mt-8 text-sm text-cocoa">
              Questions? Email{" "}
              <a href={`mailto:${settings.email}`} className="text-copper underline underline-offset-4">
                {settings.email}
              </a>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
