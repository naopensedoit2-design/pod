/** Regras de preço da edição em massa (usadas no painel para a prévia e na server action). */

export type PriceChange =
  | { mode: "keep" }
  | { mode: "set"; cents: number }
  | { mode: "increase_pct" | "decrease_pct"; value: number }
  | { mode: "increase_abs" | "decrease_abs"; cents: number };

export type CompareAtChange = { mode: "keep" } | { mode: "previous" } | { mode: "set"; cents: number } | { mode: "clear" };

export const MIN_PRICE_CENTS = 100;

/** Arredonda para o valor mais próximo terminado em ,90 (ex.: 143,91 → 143,90; 144,50 → 144,90). */
export function roundTo90(cents: number): number {
  const reais = Math.round((cents - 90) / 100);
  return Math.max(0, reais) * 100 + 90;
}

/** Novo preço base do produto. */
export function applyPriceChange(cents: number, change: PriceChange, round90 = false): number {
  let v = cents;
  switch (change.mode) {
    case "keep":
      return cents;
    case "set":
      return Math.max(MIN_PRICE_CENTS, change.cents);
    case "increase_pct":
      v = Math.round(cents * (1 + change.value / 100));
      break;
    case "decrease_pct":
      v = Math.round(cents * (1 - change.value / 100));
      break;
    case "increase_abs":
      v = cents + change.cents;
      break;
    case "decrease_abs":
      v = cents - change.cents;
      break;
  }
  if (round90) v = roundTo90(v);
  return Math.max(MIN_PRICE_CENTS, v);
}

/**
 * Preço próprio de uma variação (ex.: G1/G2 mais caros). Acompanha a mudança do produto:
 * porcentagem e valor fixo valem igual; "definir preço" mantém a diferença para o preço base.
 */
export function applyVariantPriceChange(variantCents: number, oldBase: number, newBase: number, change: PriceChange, round90 = false): number {
  if (change.mode === "keep") return variantCents;
  if (change.mode === "set") return Math.max(MIN_PRICE_CENTS, variantCents + (newBase - oldBase));
  return applyPriceChange(variantCents, change, round90);
}

/** Preço "de" (riscado). Fica vazio quando não é maior que o novo preço. */
export function applyCompareAtChange(current: number | null, oldPrice: number, newPrice: number, change: CompareAtChange): number | null {
  let v: number | null;
  switch (change.mode) {
    case "keep":
      v = current;
      break;
    case "previous":
      v = oldPrice;
      break;
    case "set":
      v = change.cents;
      break;
    case "clear":
      v = null;
      break;
  }
  return v != null && v > newPrice ? v : null;
}
