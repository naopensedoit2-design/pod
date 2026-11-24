"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MenuItem } from "@/lib/settings-schema";
import { cn } from "@/lib/format";
import { cartCount, useCart } from "./cart-store";

export function CartButton() {
  const count = useCart((s) => cartCount(s.lines));
  const hydrated = useCart((s) => s.hydrated);
  const setOpen = useCart((s) => s.setOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative p-1 transition-opacity hover:opacity-60"
      aria-label={`Abrir carrinho (${hydrated ? count : 0} itens)`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M5 8h14l-1 13H6L5 8z" strokeLinejoin="round" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span className="absolute -top-1.5 -right-2 min-w-[22px] rounded-[3px] bg-brand px-1 text-center text-[11px] leading-[18px] font-bold text-white tabular-nums">
        {String(hydrated ? count : 0).padStart(2, "0")}
      </span>
    </button>
  );
}

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="p-1 transition-opacity hover:opacity-60" aria-label="Buscar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!q.trim()) return;
              setOpen(false);
              router.push(`/produtos?q=${encodeURIComponent(q.trim())}`);
            }}
            className="animate-fade-in bg-white px-4 py-6 shadow-xl sm:px-12"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3 border-b-2 border-black pb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" strokeLinecap="round" />
              </svg>
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você procura?"
                className="font-wide flex-1 bg-transparent text-lg tracking-wide outline-none placeholder:text-neutral-400"
                aria-label="Buscar produtos"
              />
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-neutral-500 hover:text-black">
                Fechar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function MobileMenu({ menu, utilityLinks }: { menu: MenuItem[]; utilityLinks: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="-ml-1 p-1" aria-label="Abrir menu">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
        </svg>
      </button>
      <div className={cn("fixed inset-0 z-[60] transition", open ? "visible" : "invisible")}>
        <div className={cn("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <nav
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Menu"
        >
          <div className="flex h-16 items-center justify-between border-b px-5">
            <span className="font-wide text-xs font-bold tracking-[0.2em] uppercase">Menu</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="p-1 text-2xl leading-none">
              ×
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto py-2">
            {menu.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "font-wide block border-b border-neutral-100 px-5 py-4 text-[13px] tracking-[0.14em] uppercase",
                    item.highlight && "font-bold",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t px-5 py-5 text-sm text-neutral-600">
            {utilityLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
