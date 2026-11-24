import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { coupons, type Coupon } from "@/db/schema";
import { formatBRL } from "./format";

export type CouponResult =
  | { ok: true; coupon: Coupon; discountCents: number; freeShipping: boolean; label: string }
  | { ok: false; error: string };

export async function validateCoupon(rawCode: string, subtotalCents: number): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Informe um cupom." };
  const coupon = await db.query.coupons.findFirst({ where: eq(sql`upper(${coupons.code})`, code) });
  if (!coupon || !coupon.isActive) return { ok: false, error: "Cupom inválido." };
  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now) return { ok: false, error: "Este cupom ainda não está valendo." };
  if (coupon.endsAt && coupon.endsAt.getTime() < now) return { ok: false, error: "Este cupom expirou." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { ok: false, error: "Este cupom esgotou." };
  if (subtotalCents < coupon.minSubtotalCents)
    return { ok: false, error: `Cupom válido para compras a partir de ${formatBRL(coupon.minSubtotalCents)}.` };

  if (coupon.type === "free_shipping") {
    return { ok: true, coupon, discountCents: 0, freeShipping: true, label: "Frete grátis" };
  }
  const discountCents =
    coupon.type === "percent"
      ? Math.round((subtotalCents * Math.min(coupon.value, 100)) / 100)
      : Math.min(coupon.value, subtotalCents);
  const label = coupon.type === "percent" ? `${coupon.value}% OFF` : `${formatBRL(coupon.value)} OFF`;
  return { ok: true, coupon, discountCents, freeShipping: false, label };
}
