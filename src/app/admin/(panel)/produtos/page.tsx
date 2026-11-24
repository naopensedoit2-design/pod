import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { productImages, products, variants } from "@/db/schema";
import { EmptyState, LinkButton, PageHeader, Pill, inputClass } from "@/components/admin/ui";
import { cn, formatBRL } from "@/lib/format";
import { isYouDrawConfigured } from "@/lib/youdraw";

export const metadata: Metadata = { title: "Produtos" };

const STATUS: Record<string, { label: string; tone: "green" | "gray" | "yellow" }> = {
  active: { label: "Ativo", tone: "green" },
  draft: { label: "Rascunho", tone: "yellow" },
  archived: { label: "Arquivado", tone: "gray" },
};

export default async function ProductsAdminPage({ searchParams }: PageProps<"/admin/produtos">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const where: SQL[] = [];
  if (q) where.push(ilike(products.title, `%${q}%`));
  if (status) where.push(eq(products.status, status));

  const rows = await db.query.products.findMany({
    where: where.length ? and(...where) : undefined,
    orderBy: [asc(products.sortOrder), desc(products.createdAt)],
    with: {
      category: { columns: { name: true } },
      images: { columns: { url: true }, orderBy: [asc(productImages.sortOrder)], limit: 1 },
      variants: { columns: { id: true, ydSku: true, stock: true, isActive: true }, orderBy: [asc(variants.sortOrder)] },
    },
  });

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`${rows.length} produto(s)`}
        actions={
          <>
            <LinkButton href="/admin/produtos/importar" variant="secondary">
              Importar da YouDraw
            </LinkButton>
            <LinkButton href="/admin/produtos/novo">+ Novo produto</LinkButton>
          </>
        }
      />
      {!isYouDrawConfigured() && (
        <p className="mb-4 text-xs text-neutral-500">Dica: com a chave da YouDraw configurada você importa os produtos já com SKUs, custos e mockups.</p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { k: "", l: "Todos" },
          { k: "active", l: "Ativos" },
          { k: "draft", l: "Rascunhos" },
          { k: "archived", l: "Arquivados" },
        ].map((t) => (
          <Link
            key={t.k}
            href={t.k ? `/admin/produtos?status=${t.k}` : "/admin/produtos"}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              status === t.k ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:border-neutral-900",
            )}
          >
            {t.l}
          </Link>
        ))}
        <form className="ml-auto w-full sm:w-64">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Buscar produto…" className={inputClass} />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum produto">
          <Link href="/admin/produtos/novo" className="underline">
            Cadastre o primeiro produto
          </Link>{" "}
          ou importe da YouDraw.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Produto</th>
                <th className="px-3 py-2.5 font-medium">Preço</th>
                <th className="px-3 py-2.5 font-medium">Variações</th>
                <th className="px-3 py-2.5 font-medium">Vendas</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((p) => {
                const linked = p.variants.filter((v) => v.ydSku).length;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3">
                        <span className="h-14 w-11 shrink-0 overflow-hidden rounded bg-neutral-100">
                          {p.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span>
                          <span className="font-medium hover:underline">{p.title}</span>
                          <span className="block text-xs text-neutral-500">{p.category?.name ?? "Sem categoria"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatBRL(p.priceCents)}
                      {p.compareAtCents && <span className="block text-xs text-neutral-400 line-through">{formatBRL(p.compareAtCents)}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {p.variants.length}
                      <span className={cn("block", linked === p.variants.length ? "text-emerald-700" : linked ? "text-amber-700" : "text-neutral-400")}>
                        {linked === p.variants.length ? "YouDraw ✓" : linked ? `${linked} com YouDraw` : "sem YouDraw"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{p.salesCount}</td>
                    <td className="px-4 py-2.5">
                      <Pill tone={STATUS[p.status]?.tone ?? "gray"}>{STATUS[p.status]?.label ?? p.status}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
