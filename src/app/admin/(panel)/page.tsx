import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { Card, PageHeader, Pill, STATUS_TONE } from "@/components/admin/ui";
import { getDailySales, getDashboardStats, getSetupStatus, getTopProducts } from "@/lib/admin-data";
import { formatBRL, formatDateTime, ORDER_STATUS_LABEL } from "@/lib/format";
import { getSettingsFresh } from "@/lib/settings";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, daily, top, recent, settings] = await Promise.all([
    getDashboardStats(),
    getDailySales(),
    getTopProducts(),
    db.query.orders.findMany({ orderBy: [desc(orders.createdAt)], limit: 8 }),
    getSettingsFresh(),
  ]);
  const setup = getSetupStatus(settings);
  const max = Math.max(1, ...daily.map((d) => d.total));

  return (
    <>
      <PageHeader title="Painel" description="Resumo das vendas e do que precisa da sua atenção." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Vendas hoje" value={formatBRL(stats.revenueToday)} />
        <Stat label="Últimos 7 dias" value={formatBRL(stats.revenue7)} />
        <Stat label="Últimos 30 dias" value={formatBRL(stats.revenue30)} hint={`${stats.orders30} ${stats.orders30 === 1 ? "pedido pago" : "pedidos pagos"}`} />
        <Stat label="Ticket médio (30d)" value={formatBRL(stats.avgTicket)} />
        <Stat label="Leads cadastrados" value={String(stats.leads)} hint={`${stats.pendingPayments} pedidos sem pagamento (7d)`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Vendas dos últimos 14 dias">
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Gráfico de vendas por dia">
            {daily.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="rounded-t bg-neutral-900 transition group-hover:bg-brand" style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} />
                <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-black px-2 py-1 text-[10px] whitespace-nowrap text-white group-hover:block">
                  {d.day}: {formatBRL(d.total)} · {d.orders} ped.
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
            <span>{daily[0]?.day}</span>
            <span>{daily[daily.length - 1]?.day}</span>
          </div>
        </Card>

        <Card title="Precisa de atenção">
          {stats.attention.length === 0 ? (
            <p className="text-sm text-neutral-500">Tudo em dia ✦</p>
          ) : (
            <ul className="divide-y text-sm">
              {stats.attention.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/pedidos/${a.id}`} className="font-medium hover:underline">
                    #{a.number} · {a.name}
                  </Link>
                  <span className="text-right text-xs text-amber-700">{a.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Pedidos recentes" actions={<Link href="/admin/pedidos" className="text-xs text-neutral-500 hover:underline">Ver todos</Link>}>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum pedido ainda.</p>
          ) : (
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {recent.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-2.5">
                        <Link href={`/admin/pedidos/${o.id}`} className="font-medium hover:underline">
                          #{o.number}
                        </Link>
                        <p className="text-xs text-neutral-500">{formatDateTime(o.createdAt)}</p>
                      </td>
                      <td className="px-2 py-2.5">{o.name}</td>
                      <td className="px-2 py-2.5 tabular-nums">{formatBRL(o.totalCents)}</td>
                      <td className="px-5 py-2.5 text-right">
                        <Pill tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Mais vendidos (30 dias)">
            {top.length === 0 ? (
              <p className="text-sm text-neutral-500">Sem vendas no período.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {top.map((t) => (
                  <li key={t.title} className="flex justify-between gap-3">
                    <span className="truncate">{t.title}</span>
                    <span className="shrink-0 tabular-nums text-neutral-500">
                      {t.qty} un · {formatBRL(t.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Configuração da loja">
            <ul className="space-y-2.5 text-sm">
              {setup.map((s) => (
                <li key={s.label} className="flex items-start gap-2.5">
                  <span className={s.ok ? "text-emerald-600" : "text-amber-500"}>{s.ok ? "●" : "○"}</span>
                  <div>
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-neutral-500">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
