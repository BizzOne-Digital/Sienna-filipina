"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Reel } from "@/lib/content/media";

/**
 * Muted, looping vertical Reels. Each video plays only while on screen, and stays
 * paused for visitors who prefer reduced motion (they can press play).
 */
function ReelCard({ reel }: { reel: Reel }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !userPaused) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.4 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [userPaused]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      setUserPaused(false);
      v.play().catch(() => {});
    } else {
      setUserPaused(true);
      v.pause();
    }
  };

  return (
    <li className="w-[62vw] max-w-[220px] shrink-0 snap-start sm:w-[200px] lg:w-auto lg:min-w-0 lg:max-w-none lg:flex-1">
      <div className="group relative aspect-[9/16] overflow-hidden rounded-sm bg-cream">
        <video
          ref={ref}
          src={reel.src}
          poster={reel.poster}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={`${reel.label} reel`}
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${reel.label} reel` : `Play ${reel.label} reel`}
          className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-ivory/85 text-espresso shadow-sm transition hover:bg-ivory"
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4 translate-x-px" aria-hidden />}
        </button>
      </div>
      <p className="mt-2 text-sm text-espresso">{reel.label}</p>
    </li>
  );
}

export function ReelsStrip({ reels }: { reels: Reel[] }) {
  return (
    <ul
      className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:scroll-px-0 sm:px-0 lg:overflow-visible"
      aria-label="Product reels"
    >
      {reels.map((r) => (
        <ReelCard key={r.src} reel={r} />
      ))}
    </ul>
  );
}
