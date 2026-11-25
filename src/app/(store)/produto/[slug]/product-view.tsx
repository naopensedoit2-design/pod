"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/store/cart-store";
import { ProductBadges } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { installmentsFor, priceLines, type PricingConfig } from "@/components/store/pricing";
import { track } from "@/components/store/tracking";
import type { ProductDetail } from "@/lib/catalog";
import { cn, formatBRL, formatCep, variantLabel } from "@/lib/format";

type Props = {
  product: ProductDetail;
  colors: { name: string; hex: string | null }[];
  sizes: string[];
  pricing: PricingConfig;
  sizeChart: string;
};

export function ProductView({ product, colors, sizes, pricing, sizeChart }: Props) {
  const hasColor = colors.length > 0;
  const hasSize = sizes.length > 0;
  const isAvailable = (v?: ProductDetail["variants"][number]) => Boolean(v && (v.stock === null || v.stock > 0));
  const find = (c: string, s: string) =>
    product.variants.find((v) => (!hasColor || v.option1 === c) && (!hasSize || v.option2 === s));

  const firstColor = colors.find((c) => product.variants.some((v) => v.option1 === c.name && isAvailable(v)))?.name ?? colors[0]?.name ?? "";
  const [color, setColor] = useState(firstColor);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const [error, setError] = useState("");
  const [modal, setModal] = useState<null | "sizes" | "payments">(null);
  const add = useCart((s) => s.add);

  const selected = hasSize && !size ? undefined : find(color, size);
  const price = selected?.priceCents ?? product.priceCents;
  const p = priceLines(price, pricing);
  const soldOut = !product.variants.some(isAvailable);

  const images = useMemo(() => {
    const own = product.images.filter((i) => !i.color || i.color === color);
    return own.length ? own : product.images;
  }, [product.images, color]);

  useEffect(() => {
    track("ViewContent", { value: product.priceCents, contentIds: [product.id], contentName: product.title });
  }, [product.id, product.priceCents, product.title]);

  function buy() {
    if (hasSize && !size) {
      setError("Selecione um tamanho.");
      return;
    }
    const v = find(color, size);
    if (!v || !isAvailable(v)) {
      setError("Esta combinação está esgotada.");
      return;
    }
    setError("");
    add({
      variantId: v.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      variantLabel: variantLabel(v.option1, v.option2),
      image: images[0]?.url ?? null,
      unitPriceCents: v.priceCents,
      quantity: 1,
      maxQuantity: v.stock,
    });
    track("AddToCart", { value: v.priceCents, contentIds: [product.id], contentName: product.title });
  }

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6 pt-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)] lg:gap-8 lg:px-8">
      {/* Galeria */}
      <div>
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:hidden">
          {images.map((img, i) => (
            <div key={img.id} className="relative aspect-[3/4] w-full shrink-0 snap-start bg-[#ECE9E4]">
              <ProductImage src={img.url} alt={img.alt || product.title} sizes="100vw" quality={90} eager={i === 0} />
              <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium tabular-nums">
                {i + 1}/{images.length}
              </span>
            </div>
          ))}
        </div>
        <div className="hidden grid-cols-2 gap-1.5 lg:grid">
          {images.map((img, i) => (
            <div key={img.id} className="relative aspect-[3/4] w-full bg-[#ECE9E4]">
              <ProductImage src={img.url} alt={img.alt || product.title} sizes="(min-width: 1024px) 32vw, 100vw" quality={90} eager={i < 2} />
            </div>
          ))}
        </div>
      </div>

      {/* Informações */}
      <div className="px-4 lg:sticky lg:top-[96px] lg:self-start lg:px-0">
        <h1 className="font-wide text-[15px] leading-snug font-extrabold tracking-[0.14em] uppercase lg:text-[16px]">{product.title}</h1>
        <div className="mt-4">
          <ProductBadges size="pdp" product={{ ...product, soldOut }} />
        </div>

        <div className="mt-5 border-t pt-5">
          {product.compareAtCents && product.compareAtCents > price && (
            <s className="text-sm text-neutral-500">{formatBRL(product.compareAtCents)}</s>
          )}
          <p className="text-[24px] leading-tight font-medium">
            {formatBRL(p.hasPix ? p.pix : price)}
            {p.hasPix && <span> no pix</span>}
          </p>
          <p className="mt-1 text-[13px] text-neutral-500">{p.installmentLabel}</p>
        </div>

        <div className="mt-5 space-y-5 border-t pt-5">
          {hasColor && (
            <div>
              <p className="text-[13px] text-neutral-700">
                {product.option1Name}: <span className="font-semibold text-black">{color}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {colors.map((c) => {
                  const any = product.variants.some((v) => v.option1 === c.name && isAvailable(v));
                  return (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      aria-label={c.name}
                      aria-pressed={c.name === color}
                      onClick={() => {
                        setColor(c.name);
                        setError("");
                      }}
                      className={cn(
                        "relative h-9 w-9 rounded-full p-[3px] transition",
                        c.name === color ? "ring-2 ring-black" : "ring-1 ring-transparent hover:ring-neutral-300",
                        !any && "opacity-40",
                      )}
                    >
                      <span className="block h-full w-full rounded-full ring-1 ring-black/15" style={{ background: c.hex ?? "#ddd" }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSize && (
            <div>
              <p className="text-[13px] text-neutral-700">
                {product.option2Name}: {size && <span className="font-semibold text-black">{size}</span>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const v = find(color, s);
                  const ok = isAvailable(v);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!ok}
                      aria-pressed={s === size}
                      onClick={() => {
                        setSize(s);
                        setError("");
                      }}
                      className={cn(
                        "h-11 min-w-12 border px-3 text-sm font-medium transition",
                        s === size ? "border-black bg-black text-white" : "border-neutral-300 hover:border-black",
                        !ok && "cursor-not-allowed text-neutral-300 line-through hover:border-neutral-300",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizeChart.trim() && (
            <button
              type="button"
              onClick={() => setModal("sizes")}
              className="h-11 w-full border border-black text-[13px] font-medium tracking-wide uppercase transition hover:bg-black hover:text-white sm:w-[300px]"
            >
              Tabela de medidas
            </button>
          )}

          <div>
            <button
              type="button"
              onClick={buy}
              disabled={soldOut}
              className="font-wide h-[46px] w-full bg-btn text-[17px] tracking-[0.18em] text-btn-ink uppercase transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {soldOut ? "Esgotado" : "Comprar"}
            </button>
            {error && (
              <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <ul className="grid grid-cols-3 gap-2 py-1 text-center">
            {[
              { label: "Sob demanda", icon: <path d="M4 8l8-4 8 4v8l-8 4-8-4V8zm0 0l8 4 8-4M12 12v8" /> },
              { label: "Troca grátis", icon: <path d="M4 9h12l-3-3M20 15H8l3 3" /> },
              { label: "Compra segura", icon: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zm-3 9l2 2 4-4" /> },
            ].map((t) => (
              <li key={t.label} className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {t.icon}
                </svg>
                <span className="font-wide text-[10px] tracking-[0.12em] uppercase">{t.label}</span>
              </li>
            ))}
          </ul>

          <button type="button" onClick={() => setModal("payments")} className="text-[11px] tracking-[0.12em] uppercase underline underline-offset-4">
            Mais formas de pagamento
          </button>

          <ShippingCalculator variantId={selected?.id ?? product.variants[0]?.id} freeAbove={pricing.freeShippingThresholdCents} />

          {product.description && (
            <details open className="border-t pt-4">
              <summary className="font-wide cursor-pointer text-[12px] font-bold tracking-[0.14em] uppercase">Descrição</summary>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700">
                {product.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={modal === "sizes" ? "Tabela de medidas" : "Formas de pagamento"} onClose={() => setModal(null)}>
          {modal === "sizes" ? <SizeTable text={sizeChart} /> : <Payments price={price} pricing={pricing} />}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={title} className="animate-fade-in max-h-[85vh] w-full max-w-lg overflow-y-auto bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-wide text-sm font-bold tracking-[0.14em] uppercase">{title}</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none" aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SizeTable({ text }: { text: string }) {
  const rows = text
    .split("\n")
    .map((l) => l.split(/[|;\t]/).map((c) => c.trim()))
    .filter((r) => r.some(Boolean));
  if (!rows.length) return null;
  const [head, ...body] = rows;
  return (
    <div>
      <table className="w-full text-center text-sm">
        <thead>
          <tr className="bg-neutral-100">
            {head.map((h, i) => (
              <th key={i} className="px-2 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className="border-b">
              {r.map((c, j) => (
                <td key={j} className={cn("px-2 py-2", j === 0 && "font-semibold")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-neutral-500">Medidas aproximadas da peça, com variação de até 2 cm.</p>
    </div>
  );
}

function Payments({ price, pricing }: { price: number; pricing: PricingConfig }) {
  const n = installmentsFor(price, pricing);
  return (
    <div className="text-sm">
      {pricing.pixDiscountPercent > 0 && (
        <p className="mb-4 bg-neutral-50 p-3">
          <strong>Pix:</strong> {formatBRL(Math.round(price * (1 - pricing.pixDiscountPercent / 100)))} ({pricing.pixDiscountPercent}% de desconto)
        </p>
      )}
      <p className="mb-2 font-semibold">Cartão de crédito</p>
      <ul className="divide-y border">
        {Array.from({ length: pricing.maxInstallments }, (_, i) => i + 1).map((k) => (
          <li key={k} className="flex justify-between px-3 py-2">
            <span>{k}x</span>
            <span>{k <= n ? `${formatBRL(Math.ceil(price / k))} sem juros` : "com acréscimo da operadora"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-neutral-500">Pagamento processado com segurança pela InfinitePay.</p>
    </div>
  );
}

function ShippingCalculator({ variantId, freeAbove }: { variantId?: number; freeAbove: number }) {
  const [cep, setCep] = useState("");
  const [state, setState] = useState<{ loading: boolean; result?: string; error?: string }>({ loading: false });

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!variantId) return;
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setState({ loading: false, error: "Digite um CEP válido." });
      return;
    }
    setState({ loading: true });
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: digits, items: [{ variantId, quantity: 1 }] }),
      });
      const data = await res.json();
      if (!data.ok) setState({ loading: false, error: data.error ?? "Não foi possível calcular." });
      else
        setState({
          loading: false,
          result: `${data.quote.name}: ${data.quote.free ? "Grátis" : formatBRL(data.quote.priceCents)}${data.quote.days ? ` · até ${data.quote.days} dias úteis` : ""}`,
        });
    } catch {
      setState({ loading: false, error: "Não foi possível calcular agora." });
    }
  }

  return (
    <div className="border-t pt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] tracking-[0.12em] uppercase">Frete e prazo de entrega</p>
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] tracking-[0.1em] uppercase underline"
        >
          Não sei meu CEP
        </a>
      </div>
      <form onSubmit={calc} className="flex">
        <input
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          inputMode="numeric"
          placeholder="CEP DE ENTREGA"
          aria-label="CEP de entrega"
          className="min-w-0 flex-1 border border-neutral-300 px-3 py-2.5 text-sm tracking-wide outline-none focus:border-black"
        />
        <button type="submit" disabled={state.loading} className="bg-neutral-200 px-5 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-neutral-300">
          {state.loading ? "..." : "Calcular"}
        </button>
      </form>
      {state.result && <p className="mt-2 text-sm">{state.result}</p>}
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {freeAbove > 0 && (
        <p className="mt-2 inline-block bg-neutral-200 px-3 py-1 text-[12px] tracking-wide">Frete grátis acima de {formatBRL(freeAbove)}</p>
      )}
    </div>
  );
}
