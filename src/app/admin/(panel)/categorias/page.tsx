import type { Metadata } from "next";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/form-state";
import { Card, Field, PageHeader, inputClass } from "@/components/admin/ui";
import { deleteCategoryAction, saveCategoryAction } from "../content-actions";

export const metadata: Metadata = { title: "Categorias" };

function CategoryFields({ c }: { c?: typeof categories.$inferSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Nome">
        <input name="name" defaultValue={c?.name} required className={inputClass} />
      </Field>
      <Field label="Endereço (slug)" hint={c ? `/colecao/${c.slug}` : "Gerado a partir do nome"}>
        <input name="slug" defaultValue={c?.slug} className={inputClass} />
      </Field>
      <Field label="Ordem">
        <input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className={inputClass} />
      </Field>
      <Field label="Descrição (aparece no topo da coleção)" className="sm:col-span-3">
        <input name="description" defaultValue={c?.description} className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} /> Ativa
      </label>
    </div>
  );
}

export default async function CategoriesPage() {
  const rows = await db
    .select({ c: categories, total: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <>
      <PageHeader title="Categorias" description="Organize os produtos em coleções. Para aparecer no menu, adicione o link em Configurações → Menu." />
      <div className="space-y-4">
        {rows.map(({ c, total }) => (
          <Card
            key={c.id}
            title={`${c.name} · ${total} produto(s)`}
            actions={
              <ActionButton action={deleteCategoryAction.bind(null, c.id)} variant="danger" confirm="Excluir a categoria? Os produtos ficam sem categoria.">
                Excluir
              </ActionButton>
            }
          >
            <ActionForm action={saveCategoryAction}>
              <CategoryFields c={c} />
            </ActionForm>
          </Card>
        ))}
        <Card title="Nova categoria">
          <ActionForm action={saveCategoryAction} submitLabel="Criar categoria" resetOnSuccess>
            <CategoryFields />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
