"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/format";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : [""];
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden bg-cream">
        <SafeImage
          src={list[active]}
          alt={`${name}${list.length > 1 ? ` — image ${active + 1} of ${list.length}` : ""}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {list.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5" aria-label="Product images">
          {list.map((src, i) => (
            <li key={`${src}-${i}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden border bg-cream transition",
                  i === active ? "border-copper ring-1 ring-copper" : "border-line opacity-80 hover:opacity-100"
                )}
              >
                <SafeImage src={src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
