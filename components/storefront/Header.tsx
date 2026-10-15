"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/format";
import { useCart } from "./CartProvider";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about-us", label: "About Us" },
  { href: "/contact", label: "Contact" },
];
const MORE = [
  { href: "/gallery", label: "Gallery" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blogs", label: "Journal" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/our-team", label: "Our Team" },
];

export function Header({ logo }: { logo: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setSearchOpen(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled ? "border-line bg-ivory/95 shadow-[0_6px_24px_-18px_rgba(73,35,23,0.45)] backdrop-blur" : "border-transparent bg-ivory"
      )}
    >
      <div className="container-site flex h-[88px] items-center justify-between gap-4 lg:h-[112px]">
        <div className="h-[74px] lg:h-[98px]">{logo}</div>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[0.92rem] text-espresso transition-colors hover:text-copper",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:bg-copper after:transition-transform",
                    isActive(n.href) ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                  )}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((s) => !s)}
            className="grid h-11 w-11 place-items-center rounded-full text-espresso transition-colors hover:bg-cream"
            aria-label="Search products"
            aria-expanded={searchOpen}
          >
            <Search className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <Link
            href="/cart"
            className="relative grid h-11 w-11 place-items-center rounded-full text-espresso transition-colors hover:bg-cream"
            aria-label={`Shopping bag${ready && count ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
            {ready && count > 0 && (
              <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-copper px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full text-espresso hover:bg-cream md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line bg-ivory">
          <form
            role="search"
            className="container-site flex items-center gap-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
              router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
            }}
          >
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <Search className="h-4 w-4 shrink-0 text-copper" aria-hidden />
            <input
              ref={searchRef}
              id="site-search"
              name="q"
              type="search"
              placeholder="Search skincare, apparel, combos…"
              className="h-11 w-full bg-transparent text-[0.95rem] placeholder:text-cocoa/60 focus:outline-none"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>
        </div>
      )}

    </header>

      {/* Mobile drawer: rendered outside <header> so the header's backdrop blur cannot become its containing block. */}
      <div
        className={cn("fixed inset-0 z-50 overflow-hidden md:hidden", open ? "pointer-events-auto visible" : "pointer-events-none invisible delay-300")}
        aria-hidden={!open}
      >
        <div
          className={cn("absolute inset-0 bg-espresso/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-ivory shadow-xl transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-serif text-2xl">Menu</span>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-cream"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              tabIndex={open ? 0 : -1}
            >
              <X className="h-6 w-6" strokeWidth={1.6} />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="space-y-1">
              {[...NAV, ...MORE].map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    tabIndex={open ? 0 : -1}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center border-b border-line/70 font-serif text-2xl",
                      isActive(n.href) ? "text-copper" : "text-espresso"
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line p-5">
            <Link href="/cart" tabIndex={open ? 0 : -1} className="btn btn-primary w-full">
              <ShoppingBag className="h-4 w-4" /> View bag {ready && count ? `(${count})` : ""}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
