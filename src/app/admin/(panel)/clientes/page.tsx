import type { Metadata } from "next";
import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { Card, LinkButton, PageHeader } from "@/components/admin/ui";
import { formatBRL, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Clientes e leads" };

export default async function CustomersPage() {
  const [customers, leads] = await Promise.all([
    db.execute<{ email: string; name: string; phone: string; orders: number; spent: number; last: string }>(sql`
      select lower(email) as email, max(name) as name, max(phone) as phone,
        count(*) filter (where payment_status = 'paid')::int as orders,
        coalesce(sum(coalesce(paid_amount_cents, total_cents)) filter (where payment_status = 'paid'), 0)::int as spent,
        max(created_at) as last
      from orders group by lower(email) order by spent desc, last desc limit 300`),
    db.query.subscribers.findMany({ orderBy: [desc(subscribers.createdAt)], limit: 300 }),
  ]);
  const buyers = [...customers];
  const repeat = buyers.filter((c) => c.orders > 1).length;
  const abandoned = buyers.filter((c) => c.orders === 0).length;

  return (
    <>
      <PageHeader
        title="Clientes e leads"
        description={`${buyers.length} cliente(s) · ${repeat} recompraram · ${abandoned} só iniciaram o checkout · ${leads.length} lead(s) da newsletter`}
        actions={
          <>
            <LinkButton href="/admin/clientes/exportar?tipo=clientes" variant="secondary" size="sm" external>
              Exportar clientes (CSV)
            </LinkButton>
            <LinkButton href="/admin/clientes/exportar?tipo=leads" variant="secondary" size="sm" external>
              Exportar leads (CSV)
            </LinkButton>
          </>
        }
      />
      <p className="mb-4 text-sm text-neutral-500">
        Dica de retenção: quem iniciou o checkout e não pagou aparece com 0 pedidos. Chame no WhatsApp pelo detalhe do pedido em{" "}
        <Link href="/admin/pedidos?status=pending_payment" className="underline">
          Aguardando pagamento
        </Link>
        . Exporte os CSVs para criar públicos no Meta/TikTok Ads.
      </p>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Clientes">
          <div className="-m-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Cliente</th>
                  <th className="px-2 py-2 font-medium">Pedidos pagos</th>
                  <th className="px-2 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Último</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {buyers.map((c) => (
                  <tr key={c.email}>
                    <td className="px-5 py-2">
                      <Link href={`/admin/pedidos?q=${encodeURIComponent(c.email)}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-neutral-500">{c.email}</p>
                    </td>
                    <td className="px-2 py-2 tabular-nums">{c.orders}</td>
                    <td className="px-2 py-2 tabular-nums">{formatBRL(c.spent)}</td>
                    <td className="px-5 py-2 text-xs text-neutral-500">{formatDate(c.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Leads (newsletter)">
          <ul className="-my-2 divide-y text-sm">
            {leads.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 py-2">
                <span className="truncate">{l.email}</span>
                <span className="shrink-0 text-xs text-neutral-400">{formatDate(l.createdAt)}</span>
              </li>
            ))}
            {leads.length === 0 && <li className="py-2 text-neutral-500">Nenhum lead ainda.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
