import { after } from "next/server";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { addEvent, applyYouDrawOrder, findOrderForYouDraw } from "@/lib/fulfillment";
import { getBaseUrlFromRequest } from "@/lib/site-url";
import { verifyYouDrawSignature, type YdOrder } from "@/lib/youdraw";

/** Webhook da YouDraw: order.created, order.status_changed, order.tracking_updated, payment.paid, payment.expired. */
export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyYouDrawSignature(raw, req.headers.get("x-youdraw-timestamp"), req.headers.get("x-youdraw-signature"));
  if (!ok) return Response.json({ error: "assinatura inválida" }, { status: 401 });

  let event: { id?: string; type?: string; data?: { order?: YdOrder; current_status?: string; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const delivery = req.headers.get("x-youdraw-delivery") ?? event.id;
  if (delivery) {
    const inserted = await db
      .insert(webhookEvents)
      .values({ id: `youdraw:${delivery}`, source: "youdraw" })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (inserted.length === 0) return Response.json({ ok: true, duplicate: true });
  }

  if (event.type === "webhook.test") return Response.json({ ok: true, test: true });

  const ydOrder = event.data?.order;
  if (ydOrder?.id) {
    const order = await findOrderForYouDraw(ydOrder);
    if (order) {
      const baseUrl = getBaseUrlFromRequest(req);
      const type = event.type ?? "";
      after(async () => {
        try {
          if (type.startsWith("payment.")) {
            await addEvent(order.id, "youdraw_payment", type === "payment.paid" ? "Pix da produção confirmado pela YouDraw." : "Pix da produção expirou ou falhou.");
          }
          await applyYouDrawOrder(order, ydOrder, baseUrl);
        } catch (err) {
          console.error("[youdraw] falha ao aplicar webhook", err);
        }
      });
    }
  }
  return Response.json({ ok: true });
}
