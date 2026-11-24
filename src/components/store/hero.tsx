"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "@/db/schema";
import { cn } from "@/lib/format";

type Slide = Pick<Banner, "id" | "eyebrow" | "title" | "subtitle" | "ctaLabel" | "href" | "imageDesktop" | "imageMobile" | "bgColor" | "textColor">;

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const n = (i + slides.length) % slides.length;
      el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = window.setInterval(() => go(index + 1), 6000);
    return () => window.clearInterval(id);
  }, [index, paused, go, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      className="relative"
      aria-roledescription="carrossel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {slides.map((s, i) => (
          <Link
            key={s.id}
            href={s.href || "/produtos"}
            className="relative block w-full shrink-0 snap-start"
            style={{ background: s.bgColor, color: s.textColor }}
            aria-label={s.title || `Banner ${i + 1}`}
          >
            {s.imageDesktop || s.imageMobile ? (
              <picture>
                {s.imageMobile && <source media="(max-width: 767px)" srcSet={s.imageMobile} />}
                <img
                  src={s.imageDesktop ?? s.imageMobile ?? ""}
                  alt={s.title}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="block aspect-[4/5] w-full object-cover md:aspect-[16/6]"
                />
              </picture>
            ) : (
              <div className="relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden px-6 text-center md:aspect-[16/6]">
                <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
                {s.eyebrow && <p className="font-wide relative text-[11px] tracking-[0.3em] uppercase opacity-70 md:text-xs">{s.eyebrow}</p>}
                <h2 className="relative mt-4 text-[28px] leading-tight font-bold md:text-5xl">{s.title}</h2>
                {s.subtitle && <p className="relative mt-3 max-w-xl text-sm opacity-85 md:text-lg">{s.subtitle}</p>}
                {s.ctaLabel && <span className="relative mt-5 text-xl font-medium underline underline-offset-4 md:text-2xl">{s.ctaLabel}</span>}
              </div>
            )}
          </Link>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir para o banner ${i + 1}`}
              className={cn("h-2.5 w-2.5 border border-white/80 transition", i === index ? "bg-white" : "bg-white/30")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
