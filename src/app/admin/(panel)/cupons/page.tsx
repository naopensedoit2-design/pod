import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons, type Coupon } from "@/db/schema";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/form-state";
import { Card, Field, PageHeader, Pill, inputClass } from "@/components/admin/ui";
import { centsToInput, formatBRL } from "@/lib/format";
import { deleteCouponAction, saveCouponAction } from "../content-actions";

export const metadata: Metadata = { title: "Cupons" };

const ymd = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d) : "";

function CouponFields({ c }: { c?: Coupon }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Código">
        <input name="code" defaultValue={c?.code} required className={`${inputClass} uppercase`} placeholder="BLACK40" />
      </Field>
      <Field label="Tipo">
        <select name="type" defaultValue={c?.type ?? "percent"} className={inputClass}>
          <option value="percent">% de desconto</option>
          <option value="fixed">Valor fixo (R$)</option>
          <option value="free_shipping">Frete grátis</option>
        </select>
      </Field>
      <Field label="Valor" hint="% ou R$ (ignorado no frete grátis)">
        <input name="value" defaultValue={c ? (c.type === "fixed" ? centsToInput(c.value) : String(c.value)) : ""} className={inputClass} />
      </Field>
      <Field label="Pedido mínimo (R$)">
        <input name="minSubtotal" defaultValue={c?.minSubtotalCents ? centsToInput(c.minSubtotalCents) : ""} placeholder="0,00" className={inputClass} />
      </Field>
      <Field label="Limite de usos" hint="Vazio = ilimitado">
        <input name="maxUses" type="number" min={1} defaultValue={c?.maxUses ?? ""} className={inputClass} />
      </Field>
      <Field label="Início">
        <input name="startsAt" type="date" defaultValue={ymd(c?.startsAt ?? null)} className={inputClass} />
      </Field>
      <Field label="Fim">
        <input name="endsAt" type="date" defaultValue={ymd(c?.endsAt ?? null)} className={inputClass} />
      </Field>
      <Field label="Descrição interna">
        <input name="description" defaultValue={c?.description} className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} /> Ativo
      </label>
    </div>
  );
}

export default async function CouponsPage() {
  const rows = await db.query.coupons.findMany({ orderBy: [desc(coupons.createdAt)] });
  return (
    <>
      <PageHeader
        title="Cupons"
        description="Use cupons em campanhas, influenciadores e na recompra. Os cupons de boas-vindas e de recompra enviados por e-mail ficam em Configurações → Vendas."
      />
      <div className="space-y-4">
        {rows.map((c) => (
          <Card
            key={c.id}
            title={
              <span className="flex flex-wrap items-center gap-2">
                {c.code}
                <Pill tone={c.isActive ? "green" : "gray"}>{c.isActive ? "ativo" : "inativo"}</Pill>
                <span className="text-xs font-normal text-neutral-500">
                  {c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `${formatBRL(c.value)} off` : "frete grátis"} · {c.usedCount} uso(s)
                  {c.maxUses ? ` de ${c.maxUses}` : ""}
                </span>
              </span>
            }
            actions={
              <ActionButton action={deleteCouponAction.bind(null, c.id)} variant="danger" confirm={`Excluir o cupom ${c.code}?`}>
                Excluir
              </ActionButton>
            }
          >
            <details>
              <summary className="cursor-pointer text-sm text-neutral-600">Editar</summary>
              <div className="mt-4">
                <ActionForm action={saveCouponAction}>
                  <CouponFields c={c} />
                </ActionForm>
              </div>
            </details>
          </Card>
        ))}
        <Card title="Novo cupom">
          <ActionForm action={saveCouponAction} submitLabel="Criar cupom" resetOnSuccess>
            <CouponFields />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
