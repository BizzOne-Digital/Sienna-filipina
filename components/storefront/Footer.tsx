import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/BrandIcons";
import type { SettingsDTO } from "@/lib/types";
import { Logo } from "./Logo";

const QUICK = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about-us", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/our-team", label: "Our Team" },
];
const MORE = [
  { href: "/pricing", label: "Pricing" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
  { href: "/cart", label: "Shopping Bag" },
];

function FloralAccent({ className }: { className: string }) {
  // Simple line-art sprig; purely decorative.
  return (
    <svg viewBox="0 0 120 160" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M60 158C58 120 62 80 78 40" />
      <path d="M62 120c-14-6-26-4-34 4 10 6 22 6 34-4Z" />
      <path d="M66 92c12-8 24-8 34-2-10 8-22 8-34 2Z" />
      <path d="M72 62c-10-8-22-10-32-6 8 8 20 10 32 6Z" />
      <circle cx="80" cy="34" r="9" />
      <path d="M80 25c3-8 9-10 14-8-2 6-8 9-14 8ZM80 25c-3-8-9-10-14-8 2 6 8 9 14 8Z" />
    </svg>
  );
}

export function Footer({ settings }: { settings: SettingsDTO }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ivory">
      <FloralAccent className="pointer-events-none absolute -left-4 bottom-0 hidden h-44 w-32 text-blush lg:block" />
      <FloralAccent className="pointer-events-none absolute -right-2 bottom-2 hidden h-44 w-32 -scale-x-100 text-blush lg:block" />
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr] lg:gap-8">
        <div className="flex flex-col items-start">
          <div className="h-[130px]">
            <Logo src={settings.logo} />
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cocoa">
            {settings.tagline}. Thoughtfully selected for your everyday glow.
          </p>
        </div>

        <nav aria-label="Quick links">
          <h2 className="font-sans text-sm font-semibold tracking-wide text-espresso">Quick Links</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {QUICK.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cocoa hover:text-copper">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="More">
          <h2 className="font-sans text-sm font-semibold tracking-wide text-espresso">More</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {MORE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cocoa hover:text-copper">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:border-l lg:border-line lg:pl-8">
          <h2 className="font-sans text-sm font-semibold tracking-wide text-espresso">Let&rsquo;s Connect</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 break-all text-cocoa hover:text-copper">
                  <Mail className="h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden /> {settings.email}
                </a>
              </li>
            )}
            {settings.showPhone && settings.phone && (
              <li>
                <a href={`tel:${settings.phone}`} className="flex items-center gap-3 text-cocoa hover:text-copper">
                  <Phone className="h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden /> {settings.phone}
                </a>
              </li>
            )}
            {settings.facebookUrl && (
              <li>
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cocoa hover:text-copper">
                  <FacebookIcon /> Facebook
                </a>
              </li>
            )}
            {settings.instagramUrl && (
              <li>
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cocoa hover:text-copper">
                  <InstagramIcon /> Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container-site py-5 text-center text-xs text-cocoa/80">
          &copy; {year} {settings.siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
