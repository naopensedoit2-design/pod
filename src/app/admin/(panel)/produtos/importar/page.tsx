import type { Metadata } from "next";
import Link from "next/link";
import { isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { EmptyState, LinkButton, Notice, PageHeader, Pill, inputClass } from "@/components/admin/ui";
import { formatBRL } from "@/lib/format";
import { isYouDrawConfigured, youdraw, YouDrawError, type YdProduct } from "@/lib/youdraw";
import { ImportButton } from "./import-button";

export const metadata: Metadata = { title: "Importar da YouDraw" };

export default async function ImportPage({ searchParams }: PageProps<"/admin/produtos/importar">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.pagina) || 1);

  if (!isYouDrawConfigured()) {
    return (
      <>
        <PageHeader title="Importar da YouDraw" actions={<LinkButton href="/admin/produtos" variant="secondary" size="sm">← Produtos</LinkButton>} />
        <Notice tone="yellow">
          <p className="font-medium">A chave da API da YouDraw ainda não está configurada.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>No painel da YouDraw: Menu da conta → API → Chaves → Nova chave.</li>
            <li>Marque: Catálogo, Artes, Criar produtos, Frete, Criar pedidos e Consultar pedidos (e Gerar Pix / Consultar pagamentos, se liberado).</li>
            <li>Na hospedagem, crie a variável de ambiente <code>YOUDRAW_API_KEY</code> com a chave (yd_live_…) e publique de novo.</li>
          </ol>
        </Notice>
      </>
    );
  }

  let list: { data: YdProduct[]; meta?: { current_page: number; last_page: number; total: number } } = { data: [] };
  let error = "";
  try {
    list = await youdraw.listProducts({ search: q || undefined, page, perPage: 24 });
  } catch (err) {
    error = err instanceof YouDrawError ? err.describe() : (err as Error).message;
  }
  const imported = await db.select({ id: products.id, yd: products.ydProductId }).from(products).where(isNotNull(products.ydProductId));
  const importedMap = new Map(imported.map((r) => [r.yd, r.id]));

  return (
    <>
      <PageHeader
        title="Importar da YouDraw"
        description="Produtos que você já criou na sua conta YouDraw. A importação traz variações, SKUs, custos e mockups."
        actions={<LinkButton href="/admin/produtos" variant="secondary" size="sm">← Produtos</LinkButton>}
      />
      <form className="mb-4 max-w-sm">
        <input name="q" defaultValue={q} placeholder="Buscar na YouDraw…" className={inputClass} />
      </form>
      {error && (
        <div className="mb-4">
          <Notice tone="red">{error}</Notice>
        </div>
      )}
      {!error && list.data.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado na YouDraw">Crie produtos no painel da YouDraw e volte aqui para importar.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((p) => {
            const localId = importedMap.get(p.id);
            return (
              <div key={p.id} className="flex gap-3 rounded-lg border bg-white p-3">
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {p.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col text-sm">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-neutral-500">
                    {[p.base_product, p.technique].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Pill tone={p.status?.toLowerCase() === "ativo" ? "green" : "gray"}>{p.status}</Pill>
                    {p.media && p.media.status !== "ready" && <Pill tone="yellow">mockup: {p.media.status}</Pill>}
                  </div>
                  {p.production_cost && (
                    <p className="mt-1 text-xs text-neutral-500">
                      Custo: {formatBRL(p.production_cost.min_amount_cents)}
                      {p.production_cost.max_amount_cents !== p.production_cost.min_amount_cents && ` – ${formatBRL(p.production_cost.max_amount_cents)}`}
                    </p>
                  )}
                  <div className="mt-auto pt-2">
                    {localId ? (
                      <Link href={`/admin/produtos/${localId}`} className="text-xs font-medium underline">
                        Já importado — editar
                      </Link>
                    ) : (
                      <ImportButton ydId={p.id} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {list.meta && list.meta.last_page > 1 && (
        <div className="mt-6 flex items-center gap-3 text-sm">
          {page > 1 && <Link href={`?q=${encodeURIComponent(q)}&pagina=${page - 1}`} className="rounded border bg-white px-3 py-1.5">Anterior</Link>}
          <span className="text-neutral-500">
            Página {list.meta.current_page} de {list.meta.last_page}
          </span>
          {page < list.meta.last_page && <Link href={`?q=${encodeURIComponent(q)}&pagina=${page + 1}`} className="rounded border bg-white px-3 py-1.5">Próxima</Link>}
        </div>
      )}
    </>
  );
}
