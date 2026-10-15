"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Poster } from "@/lib/content/media";

/** Masonry grid of product posters with a keyboard-friendly lightbox. */
export function PosterGallery({ posters }: { posters: Poster[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + posters.length) % posters.length)),
    [posters.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!dialog.current?.open) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const current = index === null ? null : posters[index];

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
        {posters.map((p, i) => (
          <li key={p.src} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => open(i)}
              className="group block w-full overflow-hidden border border-line bg-[#fffdfa]"
              aria-label={`View ${p.name}`}
            >
              <Image
                src={p.src}
                alt={p.name}
                width={p.width}
                height={p.height}
                sizes="(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-auto max-h-[92vh] w-[min(94vw,640px)] bg-transparent p-0 backdrop:bg-espresso/80"
        aria-label={current?.name ?? "Product poster"}
      >
        {current && (
          <div className="relative">
            <Image
              src={current.src}
              alt={current.name}
              width={current.width}
              height={current.height}
              sizes="640px"
              className="mx-auto max-h-[86vh] w-auto object-contain"
            />
            <p className="mt-2 text-center text-sm text-ivory">
              {current.name} · {index! + 1} / {posters.length}
            </p>
            <button type="button" onClick={close} aria-label="Close" className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-ivory/90 text-espresso">
              <X className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => step(-1)} aria-label="Previous poster" className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-espresso">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next poster" className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-espresso">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
