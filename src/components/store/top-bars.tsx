"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Faixa vermelha de promoção com contagem regressiva (dias : horas : min : seg). */
export function PromoBar({ text, href, endsAt }: { text: string; href: string; endsAt: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    if (!Number.isFinite(end)) return;
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const parts =
    left == null
      ? null
      : [
          Math.floor(left / 86_400_000),
          Math.floor((left % 86_400_000) / 3_600_000),
          Math.floor((left % 3_600_000) / 60_000),
          Math.floor((left % 60_000) / 1000),
        ];

  return (
    <Link href={href} className="block bg-brand text-white">
      <div className="mx-auto flex h-7 max-w-[1600px] items-center justify-center gap-3 px-3 text-[12px] font-bold sm:text-[14px]">
        <span className="truncate">{text}</span>
        {parts && left! > 0 && (
          <span className="flex shrink-0 items-center gap-1 tabular-nums text-black/85 sm:text-[15px]" aria-label="Tempo restante">
            {parts.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-white/90">:</span>}
                {pad(p)}
              </span>
            ))}
          </span>
        )}
      </div>
    </Link>
  );
}

/** Faixa preta com mensagens que se alternam. */
export function MessageBar({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % messages.length), 4000);
    return () => window.clearInterval(id);
  }, [messages.length]);
  if (!messages.length) return null;
  return (
    <div className="flex h-8 items-center justify-center bg-black px-3 text-center text-[11px] font-bold text-white">
      <span key={i} className="animate-fade-in truncate">
        {messages[i]}
      </span>
    </div>
  );
}
