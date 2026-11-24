import { and, desc, eq, gt, isNotNull, isNull, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { submitOrderToYouDraw, syncOrderFromYouDraw } from "@/lib/fulfillment";
import { getSettingsFresh } from "@/lib/settings";
import { getBaseUrlFromRequest } from "@/lib/site-url";
import { isYouDrawConfigured } from "@/lib/youdraw";

/**
 * Reconciliação periódica (Vercel Cron): atualiza status/rastreio dos pedidos na YouDraw
 * e reenvia pedidos pagos que falharam ao ir para a produção.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "não autorizado" }, { status: 401 });
  }
  if (!isYouDrawConfigured()) return Response.json({ ok: true, skipped: "YouDraw não configurada" });

  const baseUrl = getBaseUrlFromRequest(req);
  const since = new Date(Date.now() - 45 * 24 * 3600_000);
  const settings = await getSettingsFresh();

  const result = { synced: 0, submitted: 0, errors: [] as string[] };

  if (settings.integrations.youdrawAutoSubmit) {
    const pending = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), isNull(orders.ydOrderId), isNotNull(orders.ydError), gt(orders.createdAt, since)))
      .limit(10);
    for (const o of pending) {
      const r = await submitOrderToYouDraw(o.id, baseUrl);
      if (r.ok) result.submitted++;
      else result.errors.push(`#${o.id}: ${r.error}`);
    }
  }

  const open = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        isNotNull(orders.ydOrderId),
        notInArray(orders.status, ["delivered", "canceled", "refunded"]),
        gt(orders.createdAt, since),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(60);
  for (const o of open) {
    const r = await syncOrderFromYouDraw(o.id, baseUrl);
    if (r.ok) result.synced++;
    else if (r.error) result.errors.push(`#${o.id}: ${r.error}`);
  }
  return Response.json({ ok: true, ...result });
}
