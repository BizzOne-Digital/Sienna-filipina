import type { Metadata } from "next";
import { CartProvider } from "@/components/storefront/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";
import { Logo } from "@/components/storefront/Logo";
import { getSettings } from "@/lib/content/queries";

// Content is read from MongoDB at request time (with tag-based caching), so builds never need the database.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.seoTitle || `${s.siteName} — ${s.tagline}`, template: `%s | ${s.siteName}` },
    description: s.seoDescription,
    openGraph: {
      siteName: s.siteName,
      type: "website",
      locale: "en_US",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${s.siteName} — ${s.tagline}` }],
    },
    twitter: { card: "summary_large_image", images: ["/og-image.jpg"] },
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-espresso focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      {settings.announcementEnabled && settings.announcement && (
        <div className="bg-rose text-center text-[0.78rem] tracking-wide text-[#fff7f1]">
          <p className="container-site py-2">{settings.announcement}</p>
        </div>
      )}
      <Header logo={<Logo src={settings.logo} priority />} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
