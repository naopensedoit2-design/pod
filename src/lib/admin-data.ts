import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isEmailConfigured } from "./email";
import { getInfinitePayConfig } from "./infinitepay";
import type { StoreSettings } from "./settings-schema";
import { isYouDrawConfigured } from "./youdraw";

type Num = { v: number | string | null };
const n = (rows: Num[]) => Number(rows[0]?.v ?? 0);

export async function getDashboardStats() {
  const paidValue = sql`coalesce(paid_amount_cents, total_cents)`;
  const [today, week, month, monthCount, pending, leads, attention] = await Promise.all([
    db.execute<Num>(sql`select coalesce(sum(${paidValue}),0) as v from orders where payment_status = 'paid' and paid_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'`),
    db.execute<Num>(sql`select coalesce(sum(${paidValue}),0) as v from orders where payment_status = 'paid' and paid_at >= now() - interval '7 days'`),
    db.execute<Num>(sql`select coalesce(sum(${paidValue}),0) as v from orders where payment_status = 'paid' and paid_at >= now() - interval '30 days'`),
    db.execute<Num>(sql`select count(*) as v from orders where payment_status = 'paid' and paid_at >= now() - interval '30 days'`),
    db.execute<Num>(sql`select count(*) as v from orders where payment_status = 'pending' and status = 'pending_payment' and created_at >= now() - interval '7 days'`),
    db.execute<Num>(sql`select count(*) as v from subscribers`),
    db.execute<{ id: number; number: number; name: string; reason: string }>(sql`
      select id, number, name,
        case
          when yd_error is not null and yd_order_id is null then 'Falha ao enviar para a YouDraw'
          when yd_status = 'pending_payment' then 'Produção aguardando seu pagamento'
          when yd_order_id is null and exists (select 1 from order_items i where i.order_id = orders.id and i.yd_sku is not null) then 'Pago — enviar para produção'
          when yd_order_id is null then 'Pago — produção/envio manual'
          else 'Verificar'
        end as reason
      from orders
      where payment_status = 'paid' and status in ('paid')
        and (yd_order_id is null or yd_status = 'pending_payment' or yd_error is not null)
      order by created_at desc limit 20`),
  ]);
  const revenue30 = n(month);
  const count30 = n(monthCount);
  return {
    revenueToday: n(today),
    revenue7: n(week),
    revenue30,
    orders30: count30,
    avgTicket: count30 ? Math.round(revenue30 / count30) : 0,
    pendingPayments: n(pending),
    leads: n(leads),
    attention: [...attention],
  };
}

export async function getTopProducts() {
  const rows = await db.execute<{ title: string; qty: number; revenue: number }>(sql`
    select i.title, sum(i.quantity)::int as qty, sum(i.total_cents)::int as revenue
    from order_items i join orders o on o.id = i.order_id
    where o.payment_status = 'paid' and o.paid_at >= now() - interval '30 days'
    group by i.title order by qty desc limit 5`);
  return [...rows];
}

export async function getDailySales() {
  const rows = await db.execute<{ day: string; total: number; orders: number }>(sql`
    select to_char(d.day, 'DD/MM') as day,
      coalesce(sum(coalesce(o.paid_amount_cents, o.total_cents)),0)::int as total,
      count(o.id)::int as orders
    from generate_series((now() at time zone 'America/Sao_Paulo')::date - 13, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') as d(day)
    left join orders o on o.payment_status = 'paid' and (o.paid_at at time zone 'America/Sao_Paulo')::date = d.day::date
    group by d.day order by d.day`);
  return [...rows];
}

export function getSetupStatus(settings: StoreSettings) {
  const ip = getInfinitePayConfig(settings);
  return [
    { label: "Pagamentos (InfinitePay)", ok: Boolean(ip.handle || ip.apiKey), detail: ip.apiKey ? "Handle + API Key (Pix com desconto e parcelas sem juros)" : ip.handle ? "Só handle (sem desconto no Pix)" : "Defina a InfiniteTag em Configurações" },
    { label: "Produção (YouDraw API)", ok: isYouDrawConfigured(), detail: isYouDrawConfigured() ? "Chave configurada" : "Defina YOUDRAW_API_KEY" },
    { label: "Webhook da YouDraw", ok: Boolean(process.env.YOUDRAW_WEBHOOK_SECRET), detail: process.env.YOUDRAW_WEBHOOK_SECRET ? "Segredo configurado" : "Defina YOUDRAW_WEBHOOK_SECRET" },
    { label: "E-mails transacionais", ok: isEmailConfigured(), detail: isEmailConfigured() ? "Envio ativo" : "Defina RESEND_API_KEY ou SMTP_URL" },
    { label: "Dados da empresa no rodapé", ok: Boolean(settings.company.legalName && settings.company.document), detail: "Razão social e CNPJ/CPF (obrigatório por lei)" },
    { label: "WhatsApp de atendimento", ok: Boolean(settings.company.whatsapp), detail: "Ativa o botão Ajuda" },
  ];
}
