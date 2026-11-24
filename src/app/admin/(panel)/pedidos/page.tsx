import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { EmptyState, PageHeader, Pill, STATUS_TONE, inputClass } from "@/components/admin/ui";
import { cn, formatBRL, formatDateTime, ORDER_STATUS_LABEL, YD_STATUS_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "Pedidos" };

const TABS = [
  { key: "", label: "Todos" },
  { key: "acao", label: "Precisa de ação" },
  { key: "pending_payment", label: "Aguardando pagamento" },
  { key: "paid", label: "Pagos" },
  { key: "in_production", label: "Em produção" },
  { key: "shipped", label: "Enviados" },
  { key: "delivered", label: "Entregues" },
  { key: "canceled", label: "Cancelados" },
];

const PER_PAGE = 40;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.pagina) || 1);

  const where: SQL[] = [];
  if (status === "acao") {
    where.push(
      sql`${orders.paymentStatus} = 'paid' and ${orders.status} = 'paid' and (${orders.ydOrderId} is null or ${orders.ydStatus} = 'pending_payment' or ${orders.ydError} is not null)`,
    );
  } else if (status) where.push(eq(orders.status, status));
  if (q) {
    const num = Number(q.replace(/\D/g, ""));
    const term = `%${q}%`;
    where.push(or(ilike(orders.name, term), ilike(orders.email, term), ilike(orders.phone, term), ...(num ? [eq(orders.number, num)] : []))!);
  }
  const filter = where.length ? and(...where) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.orders.findMany({ where: filter, orderBy: [desc(orders.createdAt)], limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    db.select({ total: count() }).from(orders).where(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return `?${p}`;
  };

  return (
    <>
      <PageHeader title="Pedidos" description={`${total} pedido(s)`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/pedidos?status=${t.key}` : "/admin/pedidos"}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              status === t.key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:border-neutral-900",
            )}
          >
            {t.label}
          </Link>
        ))}
        <form className="ml-auto w-full sm:w-64">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Buscar nº, nome, e-mail…" className={inputClass} />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum pedido encontrado">Quando alguém comprar, os pedidos aparecem aqui.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Pedido</th>
                <th className="px-3 py-2.5 font-medium">Cliente</th>
                <th className="px-3 py-2.5 font-medium">Total</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Produção</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${o.id}`} className="font-semibold hover:underline">
                      #{o.number}
                    </Link>
                    <p className="text-xs text-neutral-500">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{o.name}</p>
                    <p className="text-xs text-neutral-500">{o.email}</p>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatBRL(o.paidAmountCents ?? o.totalCents)}
                    {o.captureMethod && <p className="text-xs text-neutral-500">{o.captureMethod === "pix" ? "Pix" : `Cartão ${o.installments ?? 1}x`}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</Pill>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.ydError && !o.ydOrderId ? (
                      <span className="text-red-600">Erro ao enviar</span>
                    ) : o.ydStatus ? (
                      <span className={o.ydStatus === "pending_payment" ? "font-medium text-amber-700" : "text-neutral-600"}>
                        {YD_STATUS_LABEL[o.ydStatus] ?? o.ydStatus}
                      </span>
                    ) : o.paymentStatus === "paid" ? (
                      <span className="text-amber-700">Não enviado</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ pagina: page - 1 })} className="rounded border bg-white px-3 py-1.5">
                Anterior
              </Link>
            )}
            {page < pages && (
              <Link href={qs({ pagina: page + 1 })} className="rounded border bg-white px-3 py-1.5">
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
