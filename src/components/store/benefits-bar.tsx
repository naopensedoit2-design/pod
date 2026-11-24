"use client";

import { useEffect, useRef, useState } from "react";
import type { StoreSettings } from "@/lib/settings-schema";

/**
 * Faixa de benefícios (borda preta em cima e embaixo). Fica parada quando cabe na tela
 * e vira um letreiro rolando quando não cabe (celular ou textos longos).
 */
export function BenefitsBar({ benefits }: { benefits: StoreSettings["bars"]["benefits"] }) {
  const box = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!box.current || !probe.current) return;
      setMarquee(probe.current.scrollWidth > box.current.clientWidth - 24);
    };
    check();
    const ro = new ResizeObserver(check);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [benefits]);

  if (!benefits.length) return null;
  const items = (key: string) =>
    benefits.map((b, i) => (
      <span key={`${key}-${i}`} className="font-wide shrink-0 text-[12px] tracking-[0.14em] whitespace-nowrap uppercase lg:text-[13px] 2xl:text-[15px]">
        <strong className="font-extrabold">{b.strong}</strong> {b.text}
      </span>
    ));

  return (
    <div className="border-y-2 border-black bg-white">
      <div ref={box} className="relative mx-auto flex h-10 max-w-[1600px] items-center overflow-hidden lg:h-[42px]">
        <div ref={probe} aria-hidden className="invisible absolute flex w-max gap-10 px-6">
          {items("probe")}
        </div>
        {marquee ? (
          <div className="animate-marquee flex w-max gap-10 pr-10" aria-hidden>
            {items("a")}
            {items("b")}
            {items("c")}
            {items("d")}
          </div>
        ) : (
          <div className="flex w-full items-center justify-center gap-10 px-6">{items("s")}</div>
        )}
      </div>
      <p className="sr-only">{benefits.map((b) => `${b.strong} ${b.text}`).join(" · ")}</p>
    </div>
  );
}
