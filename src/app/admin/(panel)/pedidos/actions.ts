"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  addEvent,
  createProductionPix,
  markOrderPaid,
  processPaidOrder,
  setOrderShipped,
  setOrderStatus,
  submitOrderToYouDraw,
  syncOrderFromYouDraw,
  getOrderWithItems,
} from "@/lib/fulfillment";
import { sendEmail } from "@/lib/email";
import { orderPaidEmail } from "@/lib/email-templates";
import { getSettingsFresh } from "@/lib/settings";
import { getBaseUrl } from "@/lib/site-url";

export type ActionResult = { ok: boolean; message: string } | null;

export async function submitToYouDrawAction(orderId: number): Promise<ActionResult> {
  await requireAdmin();
  const res = await submitOrderToYouDraw(orderId, await getBaseUrl(), { notify: false });
  refresh();
  return res.ok ? { ok: true, message: `Pedido criado na YouDraw (${res.publicCode}).` } : { ok: false, message: res.error };
}

export async function generatePixAction(orderId: number): Promise<ActionResult> {
  await requireAdmin();
  const res = await createProductionPix(orderId, await getBaseUrl());
  refresh();
  return res.ok ? { ok: true, message: "Pix da produção gerado." } : { ok: false, message: res.error ?? "Falha ao gerar Pix." };
}

export async function syncYouDrawAction(orderId: number): Promise<ActionResult> {
  await requireAdmin();
  const res = await syncOrderFromYouDraw(orderId, await getBaseUrl());
  refresh();
  return res.ok ? { ok: true, message: "Status atualizado com a YouDraw." } : { ok: false, message: res.error ?? "Falha ao sincronizar." };
}

export async function markShippedAction(orderId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  await setOrderShipped(
    orderId,
    {
      trackingCode: String(formData.get("trackingCode") ?? "").trim(),
      trackingUrl: String(formData.get("trackingUrl") ?? "").trim(),
      carrier: String(formData.get("carrier") ?? "").trim(),
    },
    await getBaseUrl(),
    formData.get("notify") === "on",
  );
  refresh();
  return { ok: true, message: "Pedido marcado como enviado." };
}

export async function setStatusAction(orderId: number, status: string, notify: boolean): Promise<ActionResult> {
  await requireAdmin();
  const allowed = ["in_production", "delivered", "canceled", "refunded", "paid"];
  if (!allowed.includes(status)) return { ok: false, message: "Status inválido." };
  await setOrderStatus(orderId, status, await getBaseUrl(), notify);
  refresh();
  return { ok: true, message: "Status atualizado." };
}

export async function markPaidManuallyAction(orderId: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  const first = await markOrderPaid(orderId, { source: `confirmação manual (${admin.email})` });
  if (first) {
    const base = await getBaseUrl();
    after(() => processPaidOrder(orderId, base));
  }
  refresh();
  return { ok: true, message: first ? "Pedido marcado como pago." : "Pedido já estava pago." };
}

export async function saveNoteAction(orderId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  await db
    .update(orders)
    .set({ adminNote: String(formData.get("adminNote") ?? "").slice(0, 4000), updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  refresh();
  return { ok: true, message: "Anotação salva." };
}

export async function resendConfirmationAction(orderId: number): Promise<ActionResult> {
  await requireAdmin();
  const order = await getOrderWithItems(orderId);
  if (!order) return { ok: false, message: "Pedido não encontrado." };
  const settings = await getSettingsFresh();
  const r = await sendEmail({ to: order.email, ...orderPaidEmail(settings, await getBaseUrl(), order, order.items) });
  await addEvent(orderId, "email", r.ok ? "Confirmação reenviada ao cliente." : `Falha ao reenviar: ${r.error}`);
  refresh();
  return r.ok ? { ok: true, message: "E-mail reenviado." } : { ok: false, message: r.error ?? "Falha no envio." };
}
