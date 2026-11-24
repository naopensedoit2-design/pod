import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cliente da API Comercial da YouDraw (https://docs.youdraw.com.br).
 * A chave (yd_live_...) fica só no servidor, na variável YOUDRAW_API_KEY.
 */
const API_URL = (process.env.YOUDRAW_API_URL ?? "https://api.youdraw.com.br/api/v1").replace(/\/$/, "");

export class YouDrawError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown,
    public requestId?: string,
  ) {
    super(message);
    this.name = "YouDrawError";
  }

  /** Texto amigável para o painel. */
  describe(): string {
    const detail =
      this.details && typeof this.details === "object"
        ? Object.entries(this.details as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
            .join("; ")
        : "";
    return [`${this.message} (${this.code}${this.status ? ` · HTTP ${this.status}` : ""})`, detail, this.requestId ? `request_id ${this.requestId}` : ""]
      .filter(Boolean)
      .join(" — ");
  }
}

export function isYouDrawConfigured(): boolean {
  return Boolean(process.env.YOUDRAW_API_KEY);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type RequestInit = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  idempotencyKey?: string;
  query?: Record<string, string | number | undefined>;
};

async function request<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const key = process.env.YOUDRAW_API_KEY;
  if (!key) throw new YouDrawError("YouDraw não configurada (defina YOUDRAW_API_KEY).", 0, "not_configured");

  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));

  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    // Timeout não significa falha: repetir com a MESMA Idempotency-Key é seguro.
    if (attempt < 2) {
      await sleep(800 * 2 ** attempt + Math.random() * 300);
      return request<T>(path, init, attempt + 1);
    }
    throw new YouDrawError(`Falha de conexão com a YouDraw: ${(err as Error).message}`, 0, "network_error");
  }

  const requestId = res.headers.get("x-request-id") ?? undefined;
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    if ((res.status === 429 || res.status >= 500 || res.status === 408) && attempt < 2) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt + Math.random() * 400);
      return request<T>(path, init, attempt + 1);
    }
    const err = (json as { error?: { code?: string; message?: string; details?: unknown; request_id?: string } } | null)?.error;
    throw new YouDrawError(
      err?.message ?? `Erro HTTP ${res.status} na YouDraw`,
      res.status,
      err?.code ?? "http_error",
      err?.details,
      err?.request_id ?? requestId,
    );
  }
  return json as T;
}

// ----------------------------------------------------------------------------- tipos

export type YdShipment = {
  tracking_code: string;
  carrier: string | null;
  provider: string;
  tracking_url: string | null;
};

export type YdOrder = {
  id: string;
  number: number;
  public_code: string;
  channel: string;
  external_reference: string | null;
  status: string;
  amounts?: { subtotal_cents: number; shipping_cents: number; total_cents: number; currency: string };
  shipments?: YdShipment[];
  created_at?: string;
  paid_at?: string | null;
  items?: { sku: string; quantity: number; unit_cost_cents?: number; total_cents?: number }[];
};

export type YdVariant = {
  id: string;
  sku: string | null;
  color?: { name: string | null; hex: string | null };
  size?: string | null;
  production_cost?: { amount_cents: number | null; currency: string };
  weight_grams?: number;
  images?: string[];
};

export type YdProduct = {
  id: string;
  external_reference: string | null;
  name: string;
  status: string;
  base_product?: string | null;
  technique?: string | null;
  media?: { status: string; error_code: string | null };
  images?: string[];
  production_cost?: { min_amount_cents: number; max_amount_cents: number; currency: string };
  description?: string | null;
  variants?: YdVariant[];
};

export type YdPayment = {
  id: string;
  order_id: string;
  method: "pix";
  status: "processing" | "pending" | "paid" | "expired" | "canceled" | "failed";
  amount_cents: number;
  paid_at: string | null;
  pix: { copy_paste: string | null; qr_code_url: string | null; expires_at: string | null } | null;
};

type Envelope<T> = { data: T };
type Paginated<T> = { data: T[]; meta?: { current_page: number; last_page: number; per_page: number; total: number } };

export type YdOrderInput = {
  external_reference: string;
  customer: {
    name: string;
    document: string;
    email?: string | null;
    phone?: string | null;
    address: {
      postal_code: string;
      street: string;
      number: string;
      complement?: string | null;
      neighborhood: string;
      city: string;
      state: string;
    };
  };
  items: { sku: string; quantity: number }[];
  notes?: string | null;
};

// ----------------------------------------------------------------------------- operações

export const youdraw = {
  account: () =>
    request<Envelope<{ id: string; name: string; email: string; environment: string; livemode: boolean }>>("/account").then(
      (r) => r.data,
    ),

  listProducts: (opts: { search?: string; page?: number; perPage?: number } = {}) =>
    request<Paginated<YdProduct>>("/products", {
      query: { search: opts.search, page: opts.page ?? 1, per_page: opts.perPage ?? 24 },
    }),

  getProduct: (id: string) => request<Envelope<YdProduct>>(`/products/${encodeURIComponent(id)}`).then((r) => r.data),

  quoteShipping: (postalCode: string, items: { sku: string; quantity: number }[]) =>
    request<Envelope<{ amount_cents: number; delivery_days: number; service?: { name: string } }>>("/shipping/quotes", {
      method: "POST",
      body: { postal_code: postalCode, items },
    }).then((r) => r.data),

  createOrder: (input: YdOrderInput, idempotencyKey: string) =>
    request<Envelope<YdOrder>>("/orders", { method: "POST", body: input, idempotencyKey }).then((r) => r.data),

  getOrder: (id: string) => request<Envelope<YdOrder>>(`/orders/${encodeURIComponent(id)}`).then((r) => r.data),

  cancelOrder: (id: string) => request<unknown>(`/orders/${encodeURIComponent(id)}/cancel`, { method: "POST", body: {} }),

  createPixPayment: (orderId: string, idempotencyKey: string) =>
    request<Envelope<YdPayment>>(`/orders/${encodeURIComponent(orderId)}/payments`, {
      method: "POST",
      body: { method: "pix" },
      idempotencyKey,
    }).then((r) => r.data),

  getPayment: (id: string) => request<Envelope<YdPayment>>(`/payments/${encodeURIComponent(id)}`).then((r) => r.data),
};

/** Valida a assinatura HMAC dos webhooks da YouDraw (v1=hex(hmac_sha256(timestamp + "." + corpo))). */
export function verifyYouDrawSignature(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  const secret = process.env.YOUDRAW_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = "v1=" + createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
