import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { coupons, orderEvents, orderItems, orders, products, variants, type Order } from "@/db/schema";
import { getSettingsFresh } from "./settings";
import { adminNotifyEmail, sendEmail } from "./email";
import * as tpl from "./email-templates";
import { isYouDrawConfigured, youdraw, YouDrawError, type YdOrder, type YdOrderInput } from "./youdraw";
import { getInfinitePayConfig, paymentCheck } from "./infinitepay";
import { formatBRL, onlyDigits, YD_STATUS_LABEL, ORDER_STATUS_LABEL } from "./format";

/** Prefixo da referência externa enviada à YouDraw (ex.: LENTO-1001). */
const REF_PREFIX = (process.env.ORDER_REF_PREFIX ?? "LENTO").toUpperCase();

export async function addEvent(orderId: number, type: string, message: string, data?: unknown) {
  await db.insert(orderEvents).values({ orderId, type, message, data: (data ?? null) as never });
}

export async function getOrderWithItems(orderId: number) {
  return db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
}

function safeRevalidate(tag: string) {
  try {
    revalidateTag(tag, "max");
  } catch {
    // fora de um contexto de requisição (scripts) não há cache para invalidar
  }
}

// ----------------------------------------------------------------------------- pagamento

export type PaymentInfo = {
  transactionNsu?: string | null;
  invoiceSlug?: string | null;
  captureMethod?: string | null;
  installments?: number | null;
  paidAmountCents?: number | null;
  receiptUrl?: string | null;
  source: string;
};

/** Marca o pedido como pago (idempotente). Retorna true só na primeira vez. */
export async function markOrderPaid(orderId: number, info: PaymentInfo): Promise<boolean> {
  const now = new Date();
  const updated = await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      status: sql`case when ${orders.status} = 'pending_payment' then 'paid' else ${orders.status} end`,
      paidAt: now,
      transactionNsu: info.transactionNsu ?? undefined,
      invoiceSlug: info.invoiceSlug ?? undefined,
      captureMethod: info.captureMethod ?? undefined,
      installments: info.installments ?? undefined,
      paidAmountCents: info.paidAmountCents ?? undefined,
      receiptUrl: info.receiptUrl ?? undefined,
      updatedAt: now,
    })
    .where(and(eq(orders.id, orderId), ne(orders.paymentStatus, "paid")))
    .returning({ id: orders.id, couponCode: orders.couponCode });
  if (updated.length === 0) return false;

  if (updated[0].couponCode) {
    await db
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(eq(sql`upper(${coupons.code})`, updated[0].couponCode.toUpperCase()));
  }
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    if (it.variantId) {
      await db
        .update(variants)
        .set({ stock: sql`case when ${variants.stock} is null then null else greatest(${variants.stock} - ${it.quantity}, 0) end` })
        .where(eq(variants.id, it.variantId));
    }
    if (it.productId) {
      await db
        .update(products)
        .set({ salesCount: sql`${products.salesCount} + ${it.quantity}` })
        .where(eq(products.id, it.productId));
    }
  }
  const method = info.captureMethod === "pix" ? "Pix" : info.captureMethod === "credit_card" ? "cartão" : info.captureMethod ?? "—";
  await addEvent(
    orderId,
    "paid",
    `Pagamento aprovado via ${info.source} (${method}${info.installments && info.installments > 1 ? `, ${info.installments}x` : ""}${info.paidAmountCents ? `, ${formatBRL(info.paidAmountCents)}` : ""}).`,
    info,
  );
  safeRevalidate("products");
  return true;
}

/** Confirma um pagamento da InfinitePay consultando /payment_check (o webhook não é assinado). */
export async function confirmInfinitePayPayment(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
  receiptUrl?: string | null;
  captureMethod?: string | null;
}): Promise<{ ok: boolean; first: boolean; orderId?: number; reason?: string }> {
  const number = Number.parseInt(input.orderNsu, 10);
  if (!Number.isFinite(number)) return { ok: false, first: false, reason: "order_nsu inválido" };
  const order = await db.query.orders.findFirst({ where: eq(orders.number, number) });
  if (!order) return { ok: false, first: false, reason: "pedido não encontrado" };
  if (order.paymentStatus === "paid") return { ok: true, first: false, orderId: order.id };

  const settings = await getSettingsFresh();
  const check = await paymentCheck(getInfinitePayConfig(settings), {
    orderNsu: input.orderNsu,
    transactionNsu: input.transactionNsu,
    slug: input.slug,
  });
  if (!check.success || !check.paid) return { ok: false, first: false, orderId: order.id, reason: "pagamento não confirmado" };

  const first = await markOrderPaid(order.id, {
    transactionNsu: input.transactionNsu,
    invoiceSlug: input.slug,
    captureMethod: check.capture_method ?? input.captureMethod ?? null,
    installments: check.installments ?? null,
    paidAmountCents: check.paid_amount ?? check.amount ?? null,
    receiptUrl: input.receiptUrl ?? null,
    source: "InfinitePay",
  });
  if (first && check.amount && Math.abs(check.amount - order.totalCents) > 1) {
    await addEvent(
      order.id,
      "warning",
      `Atenção: valor do link (${formatBRL(check.amount)}) diferente do total do pedido (${formatBRL(order.totalCents)}). Confira antes de produzir.`,
    );
  }
  return { ok: true, first, orderId: order.id };
}

/** Tudo que acontece depois do pagamento: e-mails e envio para produção. Roda fora do caminho crítico (after()). */
export async function processPaidOrder(orderId: number, baseUrl: string) {
  const settings = await getSettingsFresh();
  const order = await getOrderWithItems(orderId);
  if (!order) return;

  const mail = tpl.orderPaidEmail(settings, baseUrl, order, order.items);
  const sent = await sendEmail({ to: order.email, ...mail, replyTo: settings.company.email || undefined });
  await addEvent(orderId, "email", sent.ok ? `E-mail de confirmação enviado (${sent.provider}).` : `Falha no e-mail de confirmação: ${sent.error}`);

  let extra = "";
  if (settings.integrations.youdrawAutoSubmit && isYouDrawConfigured()) {
    const res = await submitOrderToYouDraw(orderId, baseUrl, { notify: false });
    extra = res.ok
      ? `<p>Produção: pedido criado na YouDraw (<strong>${res.publicCode}</strong>). ${settings.integrations.youdrawAutoPix ? "O Pix da produção foi gerado no painel." : "Lembre de pagar a produção."}</p>`
      : `<p style="color:#c00">Produção: falha ao criar na YouDraw — ${res.error}. Reenvie pelo painel.</p>`;
  } else if (order.items.some((i) => i.ydSku)) {
    extra = `<p>Produção: envie o pedido para a YouDraw pelo painel.</p>`;
  }

  const admin = adminNotifyEmail(settings);
  if (admin) {
    const fresh = (await getOrderWithItems(orderId))!;
    const m = tpl.adminNewOrderEmail(settings, baseUrl, fresh, fresh.items, extra);
    await sendEmail({ to: admin, ...m });
  }
}

// ----------------------------------------------------------------------------- produção (YouDraw)

export async function submitOrderToYouDraw(
  orderId: number,
  baseUrl: string,
  opts: { notify?: boolean } = {},
): Promise<{ ok: true; publicCode: string | null } | { ok: false; error: string }> {
  const order = await getOrderWithItems(orderId);
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.ydOrderId) return { ok: true, publicCode: order.ydPublicCode };
  if (order.paymentStatus !== "paid") return { ok: false, error: "O pedido ainda não foi pago pelo cliente." };
  if (!isYouDrawConfigured()) return { ok: false, error: "YouDraw não configurada (YOUDRAW_API_KEY)." };

  const skuQty = new Map<string, number>();
  for (const it of order.items) if (it.ydSku) skuQty.set(it.ydSku, (skuQty.get(it.ydSku) ?? 0) + it.quantity);
  if (skuQty.size === 0) {
    await addEvent(orderId, "youdraw", "Nenhum item tem SKU da YouDraw: produção/envio manual.");
    return { ok: false, error: "Nenhum item deste pedido está vinculado a um SKU da YouDraw." };
  }

  let key = order.ydIdempotencyKey;
  if (!key) {
    key = randomUUID();
    await db.update(orders).set({ ydIdempotencyKey: key }).where(eq(orders.id, orderId));
  }

  const phone = onlyDigits(order.phone);
  const input: YdOrderInput = {
    external_reference: `${REF_PREFIX}-${order.number}`,
    customer: {
      name: order.name,
      document: onlyDigits(order.document),
      email: order.email,
      phone: phone ? `+55${phone.replace(/^55(?=\d{10,11}$)/, "")}` : null,
      address: {
        postal_code: onlyDigits(order.cep),
        street: order.street,
        number: order.streetNumber,
        complement: order.complement || null,
        neighborhood: order.neighborhood,
        city: order.city,
        state: order.state,
      },
    },
    items: [...skuQty.entries()].map(([sku, quantity]) => ({ sku, quantity })),
    notes: `Pedido ${REF_PREFIX} #${order.number}`,
  };

  try {
    const yd = await youdraw.createOrder(input, key);
    await db
      .update(orders)
      .set({
        ydOrderId: yd.id,
        ydPublicCode: yd.public_code,
        ydStatus: yd.status,
        ydCostCents: yd.amounts?.total_cents ?? null,
        ydSubmittedAt: new Date(),
        ydSyncedAt: new Date(),
        ydError: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    await addEvent(
      orderId,
      "youdraw",
      `Pedido criado na YouDraw (${yd.public_code}). Custo de produção + frete: ${formatBRL(yd.amounts?.total_cents)}. Status: ${YD_STATUS_LABEL[yd.status] ?? yd.status}.`,
    );
    const settings = await getSettingsFresh();
    if (settings.integrations.youdrawAutoPix) {
      await createProductionPix(orderId, baseUrl, { notify: true });
    }
    return { ok: true, publicCode: yd.public_code };
  } catch (err) {
    const msg = err instanceof YouDrawError ? err.describe() : (err as Error).message;
    await db.update(orders).set({ ydError: msg, updatedAt: new Date() }).where(eq(orders.id, orderId));
    await addEvent(orderId, "youdraw_error", `Falha ao criar pedido na YouDraw: ${msg}`);
    if (opts.notify) await notifyAdmin(orderId, baseUrl, "Falha ao enviar pedido para a YouDraw", msg);
    return { ok: false, error: msg };
  }
}

export async function createProductionPix(
  orderId: number,
  baseUrl: string,
  opts: { notify?: boolean } = {},
): Promise<{ ok: boolean; error?: string }> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order?.ydOrderId) return { ok: false, error: "Envie o pedido para a YouDraw primeiro." };
  let key = order.ydPaymentKey;
  if (!key) {
    key = randomUUID();
    await db.update(orders).set({ ydPaymentKey: key }).where(eq(orders.id, orderId));
  }
  try {
    const p = await youdraw.createPixPayment(order.ydOrderId, key);
    await db
      .update(orders)
      .set({
        ydPaymentId: p.id,
        ydPixCopyPaste: p.pix?.copy_paste ?? null,
        ydPixQrUrl: p.pix?.qr_code_url ?? null,
        ydPixExpiresAt: p.pix?.expires_at ? new Date(p.pix.expires_at) : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    await addEvent(orderId, "youdraw_pix", `Pix da produção gerado (${formatBRL(p.amount_cents)}, status ${p.status}).`);
    if (opts.notify) {
      const settings = await getSettingsFresh();
      const admin = adminNotifyEmail(settings);
      const fresh = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
      if (admin && fresh) await sendEmail({ to: admin, ...tpl.adminProductionPixEmail(settings, baseUrl, fresh) });
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof YouDrawError ? err.describe() : (err as Error).message;
    await addEvent(orderId, "youdraw_error", `Falha ao gerar Pix da produção: ${msg}`);
    return { ok: false, error: msg };
  }
}

const RANK: Record<string, number> = { pending_payment: 0, paid: 1, in_production: 2, shipped: 3, delivered: 4 };

/** Aplica o estado de um pedido da YouDraw ao pedido da loja (status, rastreio, e-mails). */
export async function applyYouDrawOrder(order: Order, yd: YdOrder, baseUrl: string) {
  const now = new Date();
  const shipment = yd.shipments?.find((s) => s.tracking_code) ?? null;
  const patch: Partial<Order> = {
    ydStatus: yd.status,
    ydSyncedAt: now,
    ydOrderId: order.ydOrderId ?? yd.id,
    ydPublicCode: yd.public_code ?? order.ydPublicCode,
    updatedAt: now,
  };
  if (yd.amounts?.total_cents) patch.ydCostCents = yd.amounts.total_cents;

  const trackingNew = Boolean(shipment && shipment.tracking_code !== order.trackingCode);
  if (shipment && trackingNew) {
    patch.trackingCode = shipment.tracking_code;
    patch.trackingUrl = shipment.tracking_url;
    patch.carrier = shipment.carrier;
  }

  const target =
    yd.status === "in_production" ? "in_production" : yd.status === "shipped" ? "shipped" : yd.status === "delivered" ? "delivered" : null;
  const terminal = order.status === "canceled" || order.status === "refunded";
  let becameShipped = false;
  let becameDelivered = false;
  if (target && !terminal && order.paymentStatus === "paid" && RANK[target] > (RANK[order.status] ?? 0)) {
    patch.status = target;
    if (target === "shipped" || target === "delivered") {
      if (!order.shippedAt) {
        patch.shippedAt = now;
        becameShipped = true;
      }
    }
    if (target === "delivered") {
      patch.deliveredAt = now;
      becameDelivered = true;
    }
  }

  await db.update(orders).set(patch).where(eq(orders.id, order.id));

  if (yd.status !== order.ydStatus) {
    await addEvent(
      order.id,
      "youdraw_status",
      `YouDraw: ${YD_STATUS_LABEL[order.ydStatus ?? ""] ?? order.ydStatus ?? "—"} → ${YD_STATUS_LABEL[yd.status] ?? yd.status}.`,
    );
  }
  if (trackingNew && shipment) {
    await addEvent(order.id, "tracking", `Código de rastreio: ${shipment.tracking_code}${shipment.carrier ? ` (${shipment.carrier})` : ""}.`);
  }

  const settings = await getSettingsFresh();
  const fresh = (await db.query.orders.findFirst({ where: eq(orders.id, order.id) }))!;
  const alreadyShipped = order.status === "shipped" && !order.trackingCode && trackingNew;
  if ((becameShipped && !becameDelivered) || alreadyShipped) {
    const r = await sendEmail({ to: fresh.email, ...tpl.orderShippedEmail(settings, baseUrl, fresh) });
    await addEvent(order.id, "email", r.ok ? "E-mail de envio (rastreio) enviado ao cliente." : `Falha no e-mail de envio: ${r.error}`);
  }
  if (becameDelivered) {
    const r = await sendEmail({ to: fresh.email, ...tpl.orderDeliveredEmail(settings, baseUrl, fresh) });
    await addEvent(order.id, "email", r.ok ? "E-mail de entrega (com cupom de recompra) enviado." : `Falha no e-mail de entrega: ${r.error}`);
  }
  if ((yd.status === "canceled" || yd.status === "returned") && yd.status !== order.ydStatus) {
    await notifyAdmin(order.id, baseUrl, `Pedido ${yd.status === "canceled" ? "cancelado" : "devolvido"} na YouDraw`, `O pedido ${yd.public_code} está como "${YD_STATUS_LABEL[yd.status]}" na YouDraw. Verifique o que aconteceu.`);
  }
}

export async function syncOrderFromYouDraw(orderId: number, baseUrl: string): Promise<{ ok: boolean; error?: string }> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order?.ydOrderId) return { ok: false, error: "Pedido não está na YouDraw." };
  try {
    const yd = await youdraw.getOrder(order.ydPublicCode ?? order.ydOrderId);
    await applyYouDrawOrder(order, yd, baseUrl);
    if (order.ydPaymentId && order.ydStatus === "pending_payment") {
      const p = await youdraw.getPayment(order.ydPaymentId).catch(() => null);
      if (p) {
        await db
          .update(orders)
          .set({ ydPixCopyPaste: p.pix?.copy_paste ?? order.ydPixCopyPaste, ydPixQrUrl: p.pix?.qr_code_url ?? order.ydPixQrUrl })
          .where(eq(orders.id, orderId));
      }
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof YouDrawError ? err.describe() : (err as Error).message;
    return { ok: false, error: msg };
  }
}

// ----------------------------------------------------------------------------- ações manuais

export async function setOrderShipped(
  orderId: number,
  data: { trackingCode: string; trackingUrl: string; carrier: string },
  baseUrl: string,
  notify: boolean,
) {
  const now = new Date();
  await db
    .update(orders)
    .set({
      status: "shipped",
      trackingCode: data.trackingCode || null,
      trackingUrl: data.trackingUrl || null,
      carrier: data.carrier || null,
      shippedAt: now,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));
  await addEvent(orderId, "status", `Marcado como enviado${data.trackingCode ? ` (rastreio ${data.trackingCode})` : ""}.`);
  if (notify) {
    const settings = await getSettingsFresh();
    const order = (await db.query.orders.findFirst({ where: eq(orders.id, orderId) }))!;
    const r = await sendEmail({ to: order.email, ...tpl.orderShippedEmail(settings, baseUrl, order) });
    await addEvent(orderId, "email", r.ok ? "E-mail de envio enviado ao cliente." : `Falha no e-mail: ${r.error}`);
  }
}

export async function setOrderStatus(orderId: number, status: string, baseUrl: string, notify: boolean) {
  const now = new Date();
  const patch: Partial<Order> = { status, updatedAt: now };
  if (status === "delivered") patch.deliveredAt = now;
  if (status === "canceled") {
    patch.canceledAt = now;
  }
  if (status === "refunded") patch.paymentStatus = "refunded";
  await db.update(orders).set(patch).where(eq(orders.id, orderId));
  await addEvent(orderId, "status", `Status alterado para "${ORDER_STATUS_LABEL[status] ?? status}".`);
  if (notify && status === "delivered") {
    const settings = await getSettingsFresh();
    const order = (await db.query.orders.findFirst({ where: eq(orders.id, orderId) }))!;
    const r = await sendEmail({ to: order.email, ...tpl.orderDeliveredEmail(settings, baseUrl, order) });
    await addEvent(orderId, "email", r.ok ? "E-mail de entrega enviado." : `Falha no e-mail: ${r.error}`);
  }
}

async function notifyAdmin(orderId: number, baseUrl: string, title: string, message: string) {
  const settings = await getSettingsFresh();
  const admin = adminNotifyEmail(settings);
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (admin && order) await sendEmail({ to: admin, ...tpl.adminAlertEmail(settings, baseUrl, order, title, message) });
}

/** Procura o pedido da loja a partir de um pedido da YouDraw. */
export async function findOrderForYouDraw(yd: Pick<YdOrder, "id" | "public_code" | "external_reference">) {
  const byId = await db.query.orders.findFirst({ where: eq(orders.ydOrderId, yd.id) });
  if (byId) return byId;
  if (yd.public_code) {
    const byCode = await db.query.orders.findFirst({ where: eq(orders.ydPublicCode, yd.public_code) });
    if (byCode) return byCode;
  }
  const m = yd.external_reference?.match(/-(\d+)$/);
  if (m) return (await db.query.orders.findFirst({ where: eq(orders.number, Number(m[1])) })) ?? null;
  return null;
}
