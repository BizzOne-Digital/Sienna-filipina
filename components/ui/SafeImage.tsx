"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { PLACEHOLDER_IMAGE } from "@/lib/format";
import { resolveStockImage } from "@/lib/content/images";

const UNOPTIMIZED_UPLOADS = process.env.NEXT_PUBLIC_UNOPTIMIZED_UPLOADS === "true";

/** Legacy "/uploads/..." paths came from disk storage that no longer exists. */
export function resolveImageSrc(src?: string | null) {
  if (!src || typeof src !== "string") return PLACEHOLDER_IMAGE;
  if (src.startsWith("/uploads/")) return PLACEHOLDER_IMAGE;
  if (src.startsWith("/") || src.startsWith("https://images.unsplash.com/")) return resolveStockImage(src);
  return PLACEHOLDER_IMAGE;
}

type Props = Omit<ImageProps, "src"> & { src?: string | null };

/**
 * next/image wrapper that falls back to the placeholder for missing, legacy, removed or failing images.
 * The fallback is applied once only, so a failing placeholder cannot loop.
 */
export function SafeImage({ src, alt, ...rest }: Props) {
  const resolved = resolveImageSrc(src);
  const [current, setCurrent] = useState(resolved);
  useEffect(() => setCurrent(resolved), [resolved]);

  const isPlaceholder = current === PLACEHOLDER_IMAGE;
  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      // The SVG placeholder never needs optimizing. Uploads are optimized unless the host
      // cannot process them (set NEXT_PUBLIC_UNOPTIMIZED_UPLOADS=true; see README: image delivery).
      unoptimized={
        isPlaceholder ||
        (UNOPTIMIZED_UPLOADS && current.startsWith("/api/uploads/")) ||
        rest.unoptimized
      }
      onError={() => {
        if (!isPlaceholder) setCurrent(PLACEHOLDER_IMAGE);
      }}
    />
  );
}
