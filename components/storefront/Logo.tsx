import Image from "next/image";
import Link from "next/link";
import { DEFAULT_LOGO } from "@/lib/format";

/** Official logo. Admin-uploaded logos (Settings) replace the bundled file. */
export function Logo({ src, className = "", priority = false }: { src?: string; className?: string; priority?: boolean }) {
  const logo = src && src.startsWith("/api/uploads/") ? src : DEFAULT_LOGO;
  return (
    <Link href="/" aria-label="Sienna Filipina — home" className={`inline-block shrink-0 ${className}`}>
      <Image
        src={logo}
        alt="Sienna Filipina — Skincare & Apparel"
        width={175}
        height={130}
        priority={priority}
        className="h-full w-auto object-contain"
        sizes="(min-width: 1024px) 260px, 200px"
      />
    </Link>
  );
}
