"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, subscribers, variants } from "@/db/schema";
import { validateCoupon } from "@/lib/coupons";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { formatBRL, isValidCpf, onlyDigits, variantLabel } from "@/lib/format";
import { addEvent, markOrderPaid, processPaidOrder } from "@/lib/fulfillment";
import {
  createCheckoutLink,
  effectivePixDiscount,
  getInfinitePayConfig,
  isInfinitePayConfigured,
  isPaymentTestMode,
} from "@/lib/infinitepay";
import { getSettingsFresh } from "@/lib/settings";
import { quoteShipping } from "@/lib/shipping";
import { getBaseUrl } from "@/lib/site-url";

// ----------------------------------------------------------------------------- cupom

export async function checkCouponAction(code: string, subtotalCents: number) {
  const res = await validateCoupon(code, Math.max(0, Math.round(subtotalCents)));
  if (!res.ok) return { ok: false as const, error: res.error };
  return {
    ok: true as const,
    code: res.coupon.code,
    label: res.label,
    discountCents: res.discountCents,
    freeShipping: res.freeShipping,
  };
}

// ----------------------------------------------------------------------------- checkout

const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  name: z
    .string()
    .trim()
    .min(5, "Informe nome e sobrenome.")
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome."),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  document: z.string().transform(onlyDigits).refine(isValidCpf, "CPF inválido."),
  cep: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 8, "CEP inválido."),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().max(120).default(""),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => /^[A-Z]{2}$/.test(v), "UF inválida."),
  couponCode: z.string().trim().max(40).default(""),
  items: z
    .array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) }))
    .min(1, "Seu carrinho está vazio.")
    .max(30),
  utm: z.record(z.string(), z.string().max(200)).optional(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; redirectUrl: string; external: boolean; token: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Confira os dados destacados.", fieldErrors };
  }
  const data = parsed.data;
  const settings = await getSettingsFresh();

  // Itens: preço e disponibilidade sempre vêm do banco.
  const merged = new Map<number, number>();
  for (const it of data.items) merged.set(it.variantId, (merged.get(it.variantId) ?? 0) + it.quantity);
  const ids = [...merged.keys()];
  const rows = await db.query.variants.findMany({
    where: and(inArray(variants.id, ids), eq(variants.isActive, true)),
    with: { product: { with: { images: { columns: { url: true, color: true }, orderBy: (i, { asc }) => [asc(i.sortOrder), asc(i.id)] } } } },
  });

  const lines: (typeof orderItems.$inferInsert)[] = [];
  let subtotal = 0;
  for (const [variantId, quantity] of merged) {
    const v = rows.find((r) => r.id === variantId);
    if (!v || v.product.status !== "active") return { ok: false, error: "Um dos produtos do carrinho não está mais disponível. Atualize o carrinho." };
    if (v.stock !== null && v.stock < quantity)
      return { ok: false, error: `Só temos ${v.stock} unidade(s) de ${v.product.title} (${variantLabel(v.option1, v.option2)}).` };
    const unit = v.priceCents ?? v.product.priceCents;
    const image = v.product.images.find((i) => i.color && i.color === v.option1)?.url ?? v.product.images[0]?.url ?? null;
    subtotal += unit * quantity;
    lines.push({
      orderId: 0,
      productId: v.productId,
      variantId: v.id,
      title: v.product.title,
      variantLabel: variantLabel(v.option1, v.option2),
      sku: v.sku,
      ydSku: v.ydSku,
      imageUrl: image,
      unitPriceCents: unit,
      quantity,
      totalCents: unit * quantity,
    });
  }

  let discount = 0;
  let freeShippingCoupon = false;
  let couponCode: string | null = null;
  if (data.couponCode) {
    const c = await validateCoupon(data.couponCode, subtotal);
    if (!c.ok) return { ok: false, error: c.error, fieldErrors: { couponCode: c.error } };
    discount = c.discountCents;
    freeShippingCoupon = c.freeShipping;
    couponCode = c.coupon.code;
  }

  const ship = await quoteShipping({ cep: data.cep, items: [...merged].map(([variantId, quantity]) => ({ variantId, quantity })), subtotalCents: subtotal, settings });
  if (!ship.ok) return { ok: false, error: ship.error, fieldErrors: { cep: ship.error } };
  const shipping = freeShippingCoupon ? 0 : ship.quote.priceCents;
  const total = subtotal - discount + shipping;
  if (total < 100) return { ok: false, error: "O valor mínimo do pedido é R$ 1,00." };

  const testMode = isPaymentTestMode(settings);
  if (!isInfinitePayConfigured(settings) && !testMode) {
    return { ok: false, error: "Pagamentos ainda não estão configurados nesta loja. Fale com a gente pelo WhatsApp." };
  }

  const token = randomBytes(18).toString("base64url");
  const [order] = await db
    .insert(orders)
    .values({
      token,
      email: data.email,
      name: data.name,
      phone: data.phone,
      document: data.document,
      cep: data.cep,
      street: data.street,
      streetNumber: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      subtotalCents: subtotal,
      discountCents: discount,
      shippingCents: shipping,
      totalCents: total,
      couponCode,
      shippingService: ship.quote.name,
      shippingDays: ship.quote.days,
      paymentProvider: testMode ? "teste" : "infinitepay",
      utm: data.utm && Object.keys(data.utm).length ? data.utm : null,
    })
    .returning();
  await db.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
  await addEvent(order.id, "created", `Pedido criado — total ${formatBRL(total)} (${lines.length} item(ns)).`);

  const baseUrl = await getBaseUrl();
  if (testMode) {
    return { ok: true, redirectUrl: `/pedido/${token}?teste=1`, external: false, token };
  }

  try {
    const config = getInfinitePayConfig(settings);
    const itemsForLink =
      discount > 0
        ? [{ description: `Pedido #${order.number} — ${settings.brand.name}`, quantity: 1, priceCents: total }]
        : [
            ...lines.map((l) => ({ description: `${l.title} (${l.variantLabel})`, quantity: l.quantity, priceCents: l.unitPriceCents })),
            ...(shipping > 0 ? [{ description: "Frete", quantity: 1, priceCents: shipping }] : []),
          ];
    const link = await createCheckoutLink(config, {
      orderNsu: String(order.number),
      items: itemsForLink,
      redirectUrl: `${baseUrl}/api/pagamento/retorno?t=${token}`,
      webhookUrl: `${baseUrl}/api/webhooks/infinitepay`,
      customer: { name: data.name, email: data.email, phone: `+55${data.phone.replace(/^55(?=\d{10,11}$)/, "")}` },
      address: {
        cep: data.cep,
        street: data.street,
        number: data.number,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        complement: data.complement,
      },
      pixDiscountPercent: effectivePixDiscount(settings),
      installmentsNoInterest: settings.sales.installmentsNoInterest,
    });
    await db.update(orders).set({ checkoutUrl: link.url }).where(eq(orders.id, order.id));
    await addEvent(order.id, "checkout", "Link de pagamento InfinitePay criado.");
    return { ok: true, redirectUrl: link.url, external: true, token };
  } catch (err) {
    console.error("[checkout] InfinitePay", err);
    await addEvent(order.id, "checkout_error", `Falha ao criar link de pagamento: ${(err as Error).message}`);
    return { ok: false, error: "Não conseguimos abrir o pagamento agora. Tente novamente em instantes." };
  }
}

// ----------------------------------------------------------------------------- pagamento simulado (modo teste)

export async function simulatePaymentAction(token: string, method: "pix" | "credit_card"): Promise<void> {
  const settings = await getSettingsFresh();
  if (!isPaymentTestMode(settings)) return;
  const order = await db.query.orders.findFirst({ where: eq(orders.token, token) });
  if (!order) return;
  const pix = effectivePixDiscount(settings);
  const paid = method === "pix" ? Math.round(order.totalCents * (1 - pix / 100)) : order.totalCents;
  const first = await markOrderPaid(order.id, {
    captureMethod: method,
    installments: method === "pix" ? 1 : Math.min(3, settings.sales.installmentsNoInterest),
    paidAmountCents: paid,
    transactionNsu: `TESTE-${order.number}`,
    source: "modo de teste",
  });
  if (first) {
    const baseUrl = await getBaseUrl();
    after(async () => {
      try {
        await processPaidOrder(order.id, baseUrl);
      } catch (err) {
        console.error("[teste] pós-pagamento falhou", err);
      }
    });
  }
  redirect(`/pedido/${token}`);
}

// ----------------------------------------------------------------------------- rastreio

export async function trackOrderAction(_prev: unknown, formData: FormData) {
  const number = Number.parseInt(String(formData.get("number") ?? "").replace(/\D/g, ""), 10);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!number || !email) return { error: "Informe o número do pedido e o e-mail." };
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.number, number), eq(sql`lower(${orders.email})`, email)),
    columns: { token: true },
  });
  if (!order) return { error: "Não encontramos um pedido com esses dados." };
  redirect(`/pedido/${order.token}`);
}

// ----------------------------------------------------------------------------- newsletter

export async function subscribeAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ok = z.string().email().safeParse(email).success;
  if (!ok) return { ok: false, message: "Digite um e-mail válido." };
  const settings = await getSettingsFresh();
  const inserted = await db
    .insert(subscribers)
    .values({ email, source: String(formData.get("source") ?? "newsletter") })
    .onConflictDoNothing()
    .returning({ id: subscribers.id });
  if (inserted.length > 0) {
    const baseUrl = await getBaseUrl();
    after(() => sendEmail({ to: email, ...welcomeEmail(settings, baseUrl) }));
  }
  const coupon = settings.sales.welcomeCouponCode;
  return {
    ok: true,
    message: coupon ? `Bem-vindo ao clube! Use o cupom ${coupon} na sua primeira compra.` : "Bem-vindo ao clube!",
    coupon,
  };
}
