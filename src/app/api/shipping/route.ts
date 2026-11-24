import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { variants } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { quoteShipping } from "@/lib/shipping";

const bodySchema = z.object({
  cep: z.string().min(8).max(9),
  items: z
    .array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  const { cep, items } = parsed.data;

  const rows = await db.query.variants.findMany({
    where: inArray(variants.id, items.map((i) => i.variantId)),
    with: { product: { columns: { priceCents: true } } },
  });
  let subtotal = 0;
  for (const it of items) {
    const v = rows.find((r) => r.id === it.variantId);
    if (!v) return Response.json({ ok: false, error: "Produto indisponível." }, { status: 400 });
    subtotal += (v.priceCents ?? v.product.priceCents) * it.quantity;
  }

  const settings = await getSettings();
  const res = await quoteShipping({ cep, items, subtotalCents: subtotal, settings });
  if (!res.ok) return Response.json(res, { status: 200 });
  return Response.json({
    ok: true,
    quote: { name: res.quote.name, priceCents: res.quote.priceCents, days: res.quote.days, free: res.quote.free },
    freeShippingThresholdCents: settings.sales.freeShippingThresholdCents,
    subtotalCents: subtotal,
  });
}
