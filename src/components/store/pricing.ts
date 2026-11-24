import { formatBRL, pixPrice } from "@/lib/format";

export type PricingConfig = {
  pixDiscountPercent: number;
  installmentsNoInterest: number;
  maxInstallments: number;
  freeShippingThresholdCents: number;
};

/** Parcela mínima para exibir o parcelamento sem juros. */
const MIN_INSTALLMENT_CENTS = 3000;

export function installmentsFor(priceCents: number, cfg: PricingConfig): number {
  return Math.max(1, Math.min(cfg.installmentsNoInterest, Math.floor(priceCents / MIN_INSTALLMENT_CENTS)));
}

export function priceLines(priceCents: number, cfg: PricingConfig) {
  const n = installmentsFor(priceCents, cfg);
  return {
    pix: pixPrice(priceCents, cfg.pixDiscountPercent),
    hasPix: cfg.pixDiscountPercent > 0,
    installments: n,
    installmentLabel: n > 1 ? `ou ${n}x de ${formatBRL(Math.ceil(priceCents / n))} sem juros` : `ou ${formatBRL(priceCents)} no cartão`,
  };
}
