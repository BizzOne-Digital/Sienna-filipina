import Image from "next/image";
import Link from "next/link";
import { DEFAULT_LOGO } from "@/lib/format";

/** Official logo. Admin-uploaded logos (Settings) replace the bundled file. */
export function Logo({ src, className = "", priority = false }: { src?: string; className?: string; priority?: boolean }) {
  const logo = src && src.startsWith("/api/uploads/") ? src : DEFAULT_LOGO;
  return (
    // The link fills its sized parent so the image's h-full resolves to a real height.
    <Link href="/" aria-label="Sienna Filipina — home" className={`block h-full shrink-0 ${className}`}>
      <Image
        src={logo}
        alt="Sienna Filipina — Skincare & Apparel"
        width={700}
        height={519}
        priority={priority}
        className="h-full w-auto object-contain"
        sizes="(min-width: 1024px) 180px, 140px"
      />
    </Link>
  );
}
