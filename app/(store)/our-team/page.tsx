import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/storefront/PageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import { getPage, getTeam } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { seoTitle, seoDescription } = await getPage("team");
  return {
    title: seoTitle || "Our Team",
    description: seoDescription || "Meet the people behind Sienna Filipina.",
    alternates: { canonical: "/our-team" },
  };
}

export default async function TeamPage() {
  const [{ data: c }, team] = await Promise.all([getPage("team"), getTeam()]);
  return (
    <>
      <PageHeader eyebrow={c.eyebrow} heading={c.heading} intro={team.length ? c.intro : undefined} />
      <section className="container-site pb-20">
        {team.length === 0 ? (
          <EmptyState
            title="Team profiles coming soon"
            text="We are putting together our team page. In the meantime, we are happy to help with any question."
            action={
              <Link href="/contact" className="btn btn-outline">
                Contact us
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-8 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m._id} className="text-center">
                <div className="relative mx-auto aspect-[4/5] overflow-hidden bg-cream">
                  <SafeImage src={m.photo} alt={`Portrait of ${m.name}`} fill sizes="(min-width: 1024px) 30vw, (min-width: 480px) 48vw, 100vw" className="object-cover" />
                </div>
                <h2 className="mt-5 text-[1.8rem]">{m.name}</h2>
                {m.role && <p className="eyebrow mt-1">{m.role}</p>}
                {m.bio && <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-cocoa">{m.bio}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
