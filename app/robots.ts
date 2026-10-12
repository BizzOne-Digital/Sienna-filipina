import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: ["/", "/api/uploads/"], disallow: ["/admin", "/api/", "/cart", "/checkout", "/order-confirmation"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
