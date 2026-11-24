const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos como "R$ 1.234,56". */
export function formatBRL(cents: number | null | undefined): string {
  return brl.format((cents ?? 0) / 100).replace(/ /g, " ");
}

/** Converte "R$ 1.234,56" / "1234,56" / "1234.56" em centavos. */
export function parseBRL(input: string | number | null | undefined): number {
  if (input == null || input === "") return 0;
  if (typeof input === "number") return Math.round(input * 100);
  let s = input.replace(/[^\d,.-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Centavos para string editável "1234,56". */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function pixPrice(cents: number, pixDiscountPercent: number): number {
  if (!pixDiscountPercent) return cents;
  return Math.round(cents * (1 - pixDiscountPercent / 100));
}

export function discountPercent(priceCents: number, compareAtCents: number | null | undefined): number {
  if (!compareAtCents || compareAtCents <= priceCents) return 0;
  return Math.round((1 - priceCents / compareAtCents) * 100);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function onlyDigits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

export function formatCep(cep: string): string {
  const d = onlyDigits(cep).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatCpf(cpf: string): string {
  const d = onlyDigits(cpf).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatPhone(phone: string): string {
  const d = onlyDigits(phone).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Valida CPF (dígitos verificadores). */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(d));
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(
    new Date(d),
  );
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function variantLabel(option1: string, option2: string): string {
  return [option1, option2].filter(Boolean).join(" / ");
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  in_production: "Em produção",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Estornado",
};

export const YD_STATUS_LABEL: Record<string, string> = {
  awaiting_art: "Aguardando arte",
  pending_payment: "Aguardando seu pagamento",
  paid: "Produção paga",
  in_production: "Em produção",
  shipped: "Enviado",
  delivered: "Entregue",
  returned: "Devolvido",
  canceled: "Cancelado",
  other: "Em processamento",
};
