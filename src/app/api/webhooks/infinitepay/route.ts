import { after } from "next/server";
import { confirmInfinitePayPayment, processPaidOrder } from "@/lib/fulfillment";
import { getBaseUrlFromRequest } from "@/lib/site-url";

/**
 * Webhook da InfinitePay (pagamento aprovado). O aviso não é assinado, então cada um é
 * confirmado em /payment_check antes de marcar o pedido como pago.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const orderNsu = String(body.order_nsu ?? "");
  const transactionNsu = String(body.transaction_nsu ?? "");
  const slug = String(body.invoice_slug ?? body.slug ?? "");
  if (!orderNsu || !transactionNsu || !slug) return Response.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });

  const baseUrl = getBaseUrlFromRequest(req);
  try {
    const res = await confirmInfinitePayPayment({
      orderNsu,
      transactionNsu,
      slug,
      receiptUrl: typeof body.receipt_url === "string" ? body.receipt_url : null,
      captureMethod: typeof body.capture_method === "string" ? body.capture_method : null,
    });
    if (res.first && res.orderId) {
      const orderId = res.orderId;
      after(async () => {
        try {
          await processPaidOrder(orderId, baseUrl);
        } catch (err) {
          console.error("[infinitepay] pós-pagamento falhou", err);
        }
      });
    }
    if (!res.ok) {
      console.warn("[infinitepay] webhook não confirmado:", res.reason, orderNsu);
      // 400 faz a InfinitePay reenviar; pedido inexistente não adianta reenviar.
      return Response.json({ ok: false, reason: res.reason }, { status: res.reason === "pagamento não confirmado" ? 400 : 200 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[infinitepay] erro no webhook", err);
    return Response.json({ error: "erro ao processar" }, { status: 400 });
  }
}
