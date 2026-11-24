import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { variants } from "@/db/schema";
import { isYouDrawConfigured, youdraw, YouDrawError } from "./youdraw";
import type { StoreSettings } from "./settings-schema";
import { onlyDigits } from "./format";

export type ShippingQuote = {
  name: string;
  priceCents: number;
  /** Valor que a loja paga (antes do frete grátis). */
  costCents: number;
  days: number | null;
  free: boolean;
  source: "youdraw" | "flat";
};

export type ShippingResult = { ok: true; quote: ShippingQuote } | { ok: false; error: string };

/**
 * Calcula o frete: pela YouDraw quando todos os itens têm SKU de produção, senão pela tabela fixa do painel.
 * Aplica o frete grátis acima do valor configurado.
 */
export async function quoteShipping(params: {
  cep: string;
  items: { variantId: number; quantity: number }[];
  subtotalCents: number;
  settings: StoreSettings;
}): Promise<ShippingResult> {
  const cep = onlyDigits(params.cep);
  if (cep.length !== 8) return { ok: false, error: "CEP inválido." };
  if (params.items.length === 0) return { ok: false, error: "Carrinho vazio." };

  const { sales } = params.settings;
  const rows = await db
    .select({ id: variants.id, ydSku: variants.ydSku })
    .from(variants)
    .where(inArray(variants.id, params.items.map((i) => i.variantId)));

  const skuQty = new Map<string, number>();
  let allPod = rows.length === params.items.length;
  for (const item of params.items) {
    const v = rows.find((r) => r.id === item.variantId);
    if (!v?.ydSku) {
      allPod = false;
      break;
    }
    skuQty.set(v.ydSku, (skuQty.get(v.ydSku) ?? 0) + item.quantity);
  }

  let quote: ShippingQuote = {
    name: "Entrega padrão",
    priceCents: sales.flatShippingCents,
    costCents: sales.flatShippingCents,
    days: sales.flatShippingDays,
    free: false,
    source: "flat",
  };

  if (allPod && isYouDrawConfigured()) {
    try {
      const q = await youdraw.quoteShipping(
        cep,
        [...skuQty.entries()].map(([sku, quantity]) => ({ sku, quantity })),
      );
      quote = {
        name: "Entrega padrão",
        priceCents: q.amount_cents,
        costCents: q.amount_cents,
        days: (q.delivery_days ?? 0) + sales.extraProductionDays,
        free: false,
        source: "youdraw",
      };
    } catch (err) {
      if (err instanceof YouDrawError && (err.code === "unsupported_postal_code" || err.status === 422)) {
        if (err.code === "unsupported_postal_code") return { ok: false, error: "Ainda não entregamos neste CEP." };
      }
      console.error("[frete] YouDraw falhou, usando tabela fixa:", err instanceof YouDrawError ? err.describe() : err);
    }
  }

  if (sales.freeShippingThresholdCents > 0 && params.subtotalCents >= sales.freeShippingThresholdCents) {
    quote = { ...quote, priceCents: 0, free: true };
  }
  return { ok: true, quote };
}
