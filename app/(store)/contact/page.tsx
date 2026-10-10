import type { Metadata } from "next";
import { Clock, Mail, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/BrandIcons";
import { ContactForm } from "@/components/storefront/ContactForm";
import { PageHeader } from "@/components/storefront/PageHeader";
import { getPage, getSettings } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("contact");
  return {
    title: seoTitle || "Contact",
    description: seoDescription || "Contact Sienna Filipina about products, orders and combos.",
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const [{ data: c }, s] = await Promise.all([getPage("contact"), getSettings()]);
  return (
    <>
      <PageHeader eyebrow={c.eyebrow} heading={c.heading} intro={c.intro} />
      <section className="container-site grid gap-10 pb-20 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
        <div className="space-y-8">
          {s.email && (
            <div className="flex gap-4">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-copper" aria-hidden />
              <div>
                <h2 className="font-sans text-sm font-semibold tracking-normal">Email</h2>
                <a href={`mailto:${s.email}`} className="mt-1 block break-all text-cocoa hover:text-copper">
                  {s.email}
                </a>
              </div>
            </div>
          )}
          {s.showPhone && s.phone && (
            <div className="flex gap-4">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-copper" aria-hidden />
              <div>
                <h2 className="font-sans text-sm font-semibold tracking-normal">Phone</h2>
                <a href={`tel:${s.phone}`} className="mt-1 block text-cocoa hover:text-copper">
                  {s.phone}
                </a>
              </div>
            </div>
          )}
          {s.businessHours.length > 0 && (
            <div className="flex gap-4">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-copper" aria-hidden />
              <div className="flex-1">
                <h2 className="font-sans text-sm font-semibold tracking-normal">Hours</h2>
                <dl className="mt-1 space-y-1 text-sm text-cocoa">
                  {s.businessHours.map((h) => (
                    <div key={h.label} className="flex justify-between gap-6">
                      <dt>{h.label}</dt>
                      <dd>{h.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
          {(s.facebookUrl || s.instagramUrl) && (
            <div>
              <h2 className="font-sans text-sm font-semibold tracking-normal">Follow us</h2>
              <div className="mt-3 flex gap-2">
                {s.facebookUrl && (
                  <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center rounded-full border border-line text-espresso hover:border-copper hover:text-copper">
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                )}
                {s.instagramUrl && (
                  <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full border border-line text-espresso hover:border-copper hover:text-copper">
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        <ContactForm />
      </section>
    </>
  );
}
