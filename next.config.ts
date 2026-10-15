import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional isolated output for production checks alongside the running dev server.
  distDir: process.env.SIENNA_BUILD_DIR || ".next",
  poweredByHeader: false,
  images: {
    // Uploaded images are served from MongoDB through /api/uploads/** (see lib/uploads).
    localPatterns: [
      { pathname: "/api/uploads/**" },
      { pathname: "/brand/**" },
      { pathname: "/images/sienna/**" },
      { pathname: "/media/gallery/**" },
      { pathname: "/placeholder.svg" },
    ],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
