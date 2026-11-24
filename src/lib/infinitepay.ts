import "server-only";
import type { StoreSettings } from "./settings-schema";

/**
 * Checkout Integrado da InfinitePay (https://www.infinitepay.io/checkout-documentacao).
 * - Handle (InfiniteTag sem "$") identifica a conta; pode ficar no painel.
 * - API Key (inchk_...) é opcional e fica só no servidor (INFINITEPAY_API_KEY). Com ela dá para
 *   aplicar desconto no Pix, parcelas sem juros, link de pagamento único e validade.
 */
const API_URL = "https://api.checkout.infinitepay.io";

export type InfinitePayConfig = { handle: string; apiKey: string };

export function getInfinitePayConfig(settings: StoreSettings): InfinitePayConfig {
  return {
    handle: (settings.integrations.infinitepayHandle || process.env.INFINITEPAY_HANDLE || "").replace(/^\$/, "").trim(),
    apiKey: process.env.INFINITEPAY_API_KEY ?? "",
  };
}

export function isInfinitePayConfigured(settings: StoreSettings): boolean {
  const c = getInfinitePayConfig(settings);
  return Boolean(c.handle || c.apiKey);
}

/** Modo de teste: permite simular pagamentos quando a InfinitePay ainda não está configurada. */
export function isPaymentTestMode(settings: StoreSettings): boolean {
  if (isInfinitePayConfigured(settings)) return false;
  return process.env.PAYMENTS_TEST_MODE === "true" || process.env.NODE_ENV === "development";
}

/** Desconto no Pix só é exibido quando pode ser aplicado de verdade (API Key) ou em modo de teste. */
export function effectivePixDiscount(settings: StoreSettings): number {
  const c = getInfinitePayConfig(settings);
  if (c.apiKey || isPaymentTestMode(settings)) return settings.sales.pixDiscountPercent;
  return 0;
}

export type CheckoutLinkInput = {
  orderNsu: string;
  items: { description: string; quantity: number; priceCents: number }[];
  redirectUrl: string;
  webhookUrl: string;
  customer: { name: string; email: string; phone: string };
  address: { cep: string; street: string; number: string; neighborhood: string; city: string; state: string; complement?: string };
  pixDiscountPercent: number;
  installmentsNoInterest: number;
  validHours?: number;
};

export async function createCheckoutLink(
  config: InfinitePayConfig,
  input: CheckoutLinkInput,
): Promise<{ url: string; raw: unknown }> {
  const body: Record<string, unknown> = {
    items: input.items.map((i) => ({ description: i.description.slice(0, 120), quantity: i.quantity, price: i.priceCents })),
    order_nsu: input.orderNsu,
    redirect_url: input.redirectUrl,
    webhook_url: input.webhookUrl,
    customer: { name: input.customer.name, email: input.customer.email, phone_number: input.customer.phone },
    address: {
      cep: input.address.cep,
      street: input.address.street,
      number: input.address.number,
      neighborhood: input.address.neighborhood,
      city: input.address.city,
      state: input.address.state,
      complement: input.address.complement || undefined,
    },
  };
  if (config.handle) body.handle = config.handle;

  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (config.apiKey) {
    headers["X-Api-Key"] = config.apiKey;
    const options: Record<string, unknown> = {
      single_payment: true,
      require_delivery_address: false,
      payment_methods_enabled: ["credit_card", "pix"],
      assured_installments: input.installmentsNoInterest,
      valid_until: new Date(Date.now() + (input.validHours ?? 48) * 3600_000).toISOString(),
    };
    if (input.pixDiscountPercent > 0) options.discounts = { pix: input.pixDiscountPercent };
    body.options = options;
  }

  const res = await fetch(`${API_URL}/links`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = (json?.message as string) || (json?.error as string) || text.slice(0, 300) || `HTTP ${res.status}`;
    throw new Error(`InfinitePay recusou o link: ${msg}`);
  }
  const data = (json?.data as Record<string, unknown> | undefined) ?? undefined;
  const url = [json?.url, json?.link, json?.checkout_url, json?.payment_url, data?.url, data?.link].find(
    (v): v is string => typeof v === "string" && v.startsWith("http"),
  );
  if (!url) throw new Error(`Resposta da InfinitePay sem URL: ${text.slice(0, 300)}`);
  return { url, raw: json };
}

export type PaymentCheckResult = {
  success: boolean;
  paid: boolean;
  amount?: number;
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
};

export async function paymentCheck(
  config: InfinitePayConfig,
  input: { orderNsu: string; transactionNsu: string; slug: string },
): Promise<PaymentCheckResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (config.apiKey) headers["X-Api-Key"] = config.apiKey;
  const res = await fetch(`${API_URL}/payment_check`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      handle: config.handle || undefined,
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`payment_check HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as PaymentCheckResult;
}
