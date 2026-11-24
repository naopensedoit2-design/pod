import { after, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { confirmInfinitePayPayment, processPaidOrder } from "@/lib/fulfillment";
import { getBaseUrlFromRequest } from "@/lib/site-url";

/**
 * Retorno do checkout da InfinitePay (redirect_url). Confirma o pagamento na hora,
 * sem depender só do webhook, e leva o cliente para a página do pedido.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = getBaseUrlFromRequest(req);
  const token = url.searchParams.get("t") ?? "";
  const order = token ? await db.query.orders.findFirst({ where: eq(orders.token, token) }) : null;
  if (!order) return NextResponse.redirect(new URL("/", base), 303);

  const transactionNsu = url.searchParams.get("transaction_nsu");
  const slug = url.searchParams.get("slug");
  if (order.paymentStatus !== "paid" && transactionNsu && slug) {
    try {
      const res = await confirmInfinitePayPayment({
        orderNsu: String(order.number),
        transactionNsu,
        slug,
        receiptUrl: url.searchParams.get("receipt_url"),
        captureMethod: url.searchParams.get("capture_method"),
      });
      if (res.first && res.orderId) {
        const id = res.orderId;
        after(async () => {
          try {
            await processPaidOrder(id, base);
          } catch (err) {
            console.error("[retorno] pós-pagamento falhou", err);
          }
        });
      }
    } catch (err) {
      console.error("[retorno] não foi possível confirmar o pagamento", err);
    }
  }
  return NextResponse.redirect(new URL(`/pedido/${order.token}`, base), 303);
}
