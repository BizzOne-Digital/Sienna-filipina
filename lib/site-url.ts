/**
 * Public site address, no trailing slash.
 * 1. NEXT_PUBLIC_SITE_URL when set to a real domain (a custom domain should be set here).
 * 2. On Vercel, the project's production domain, which Vercel provides automatically.
 * 3. localhost for local development.
 * A localhost value is ignored on Vercel so a copied local .env cannot break share previews.
 */
export function getSiteUrl() {
  const onVercel = !!process.env.VERCEL;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured && !(onVercel && /\/\/(localhost|127\.0\.0\.1)/.test(configured))) return configured;

  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}
