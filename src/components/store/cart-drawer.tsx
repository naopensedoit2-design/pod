"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn, formatBRL } from "@/lib/format";
import { cartCount, cartSubtotal, useCart } from "./cart-store";
import { priceLines, type PricingConfig } from "./pricing";

export function CartDrawer({ pricing }: { pricing: PricingConfig }) {
  const { lines, open, setOpen, setQuantity, remove, hydrated } = useCart();

  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);
  const threshold = pricing.freeShippingThresholdCents;
  const missing = Math.max(0, threshold - subtotal);
  const progress = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 0;
  const p = priceLines(subtotal, pricing);

  return (
    <div className={cn("fixed inset-0 z-[70]", open ? "visible" : "invisible")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-black/40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-label="Carrinho"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <h2 className="font-wide text-sm font-bold tracking-[0.18em] uppercase">Carrinho ({hydrated ? count : 0})</h2>
          <button type="button" onClick={() => setOpen(false)} className="p-1 text-3xl leading-none" aria-label="Fechar carrinho">
            ×
          </button>
        </div>

        {threshold > 0 && lines.length > 0 && (
          <div className="shrink-0 border-b bg-neutral-50 px-5 py-3">
            <p className="text-[13px]">
              {missing > 0 ? (
                <>
                  Faltam <strong>{formatBRL(missing)}</strong> para <strong>FRETE GRÁTIS</strong>
                </>
              ) : (
                <>
                  Você ganhou <strong>FRETE GRÁTIS</strong> ✦
                </>
              )}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="font-wide text-sm tracking-[0.14em] uppercase">Seu carrinho está vazio</p>
            <Link
              href="/produtos?novidades=1"
              onClick={() => setOpen(false)}
              className="font-wide bg-btn px-7 py-3 text-xs font-bold tracking-[0.2em] text-btn-ink uppercase"
            >
              Ver lançamentos
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y overflow-y-auto px-5">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-4 py-4">
                <Link href={`/produto/${l.slug}`} onClick={() => setOpen(false)} className="w-[84px] shrink-0 bg-neutral-100">
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt={l.title} className="aspect-[3/4] w-full object-cover" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{l.title}</p>
                      <p className="text-xs text-neutral-500">{l.variantLabel}</p>
                    </div>
                    <button type="button" onClick={() => remove(l.variantId)} className="h-fit text-xs text-neutral-400 underline hover:text-black">
                      Remover
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border">
                      <button type="button" className="h-8 w-8 text-lg" onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label="Diminuir">
                        −
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">{l.quantity}</span>
                      <button
                        type="button"
                        className="h-8 w-8 text-lg disabled:opacity-30"
                        disabled={l.maxQuantity != null && l.quantity >= l.maxQuantity}
                        onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold">{formatBRL(l.unitPriceCents * l.quantity)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="shrink-0 border-t px-5 pt-4 pb-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-neutral-600">Subtotal</span>
              <span className="text-lg font-bold">{formatBRL(subtotal)}</span>
            </div>
            {p.hasPix && (
              <p className="text-right text-sm">
                <strong>{formatBRL(p.pix)}</strong> no Pix ({pricing.pixDiscountPercent}% off)
              </p>
            )}
            <p className="text-right text-xs text-neutral-500">{p.installmentLabel}</p>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="font-wide mt-4 flex h-12 items-center justify-center bg-btn text-sm font-bold tracking-[0.22em] text-btn-ink uppercase transition hover:opacity-90"
            >
              Finalizar compra
            </Link>
            <button type="button" onClick={() => setOpen(false)} className="mt-3 w-full text-center text-xs tracking-wide text-neutral-500 underline">
              Continuar comprando
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
