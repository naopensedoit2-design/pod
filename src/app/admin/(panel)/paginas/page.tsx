import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { pages, type Page } from "@/db/schema";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/form-state";
import { Card, Field, PageHeader, Pill, inputClass } from "@/components/admin/ui";
import { deletePageAction, savePageAction } from "../content-actions";

export const metadata: Metadata = { title: "Páginas" };

function PageFields({ p }: { p?: Page }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Field label="Título">
        <input name="title" defaultValue={p?.title} required className={inputClass} />
      </Field>
      <Field label="Endereço (slug)" hint={p ? `/p/${p.slug}` : "Gerado a partir do título"}>
        <input name="slug" defaultValue={p?.slug} className={inputClass} />
      </Field>
      <Field label="Ordem">
        <input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className={inputClass} />
      </Field>
      <Field
        label="Conteúdo"
        className="sm:col-span-3"
        hint="Separe blocos com uma linha em branco. Uma linha curta no início do bloco (sem ponto final) vira subtítulo."
      >
        <textarea name="body" defaultValue={p?.body} rows={10} className={inputClass} />
      </Field>
      <div className="flex flex-wrap gap-5 sm:col-span-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" defaultChecked={p?.isPublished ?? true} /> Publicada
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="showInFooter" defaultChecked={p?.showInFooter ?? true} /> Link no rodapé
        </label>
      </div>
    </div>
  );
}

export default async function PagesAdmin() {
  const rows = await db.query.pages.findMany({ orderBy: [asc(pages.sortOrder), asc(pages.title)] });
  return (
    <>
      <PageHeader title="Páginas" description="Políticas, sobre, prazos… Revise os textos-modelo antes de publicar a loja." />
      <div className="space-y-4">
        {rows.map((p) => (
          <Card
            key={p.id}
            title={
              <span className="flex items-center gap-2">
                {p.title} {!p.isPublished && <Pill>rascunho</Pill>}
              </span>
            }
            actions={
              <span className="flex items-center gap-3">
                <a href={`/p/${p.slug}`} target="_blank" className="text-xs underline">
                  ver
                </a>
                <ActionButton action={deletePageAction.bind(null, p.id)} variant="danger" confirm={`Excluir a página ${p.title}?`}>
                  Excluir
                </ActionButton>
              </span>
            }
          >
            <details>
              <summary className="cursor-pointer text-sm text-neutral-600">Editar</summary>
              <div className="mt-4">
                <ActionForm action={savePageAction}>
                  <PageFields p={p} />
                </ActionForm>
              </div>
            </details>
          </Card>
        ))}
        <Card title="Nova página">
          <ActionForm action={savePageAction} submitLabel="Criar página" resetOnSuccess>
            <PageFields />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
