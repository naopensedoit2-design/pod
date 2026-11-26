"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Pill, buttonClass, inputClass } from "@/components/admin/ui";
import { applyPriceChange, type CompareAtChange, type PriceChange } from "@/lib/bulk-price";
import { cn, formatBRL, parseBRL } from "@/lib/format";
import { bulkDeleteProductsAction, bulkEditProductsAction, bulkSetProductStatusAction, type BulkEditInput, type BulkResult } from "./actions";

export type ProductRow = {
  id: number;
  title: string;
  category: string | null;
  tags: string[];
  imageUrl: string | null;
  priceCents: number;
  compareAtCents: number | null;
  variantsCount: number;
  linkedCount: number;
  salesCount: number;
  status: string;
};

type Category = { id: number; name: string };

const STATUS: Record<string, { label: string; tone: "green" | "gray" | "yellow" }> = {
  active: { label: "Ativo", tone: "green" },
  draft: { label: "Rascunho", tone: "yellow" },
  archived: { label: "Arquivado", tone: "gray" },
};

export function ProductsTable({ rows, categories }: { rows: ProductRow[]; categories: Category[] }) {
  const [picked, setPicked] = useState<Set<number>>(() => new Set());
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<BulkResult | null>(null);
  const [pending, start] = useTransition();

  // Só conta o que está visível (a lista muda ao filtrar ou buscar).
  const selected = useMemo(() => rows.filter((r) => picked.has(r.id)), [rows, picked]);
  const ids = selected.map((r) => r.id);
  const allOn = rows.length > 0 && selected.length === rows.length;

  function toggle(id: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(action: () => Promise<BulkResult>, onOk?: () => void) {
    start(async () => {
      try {
        const r = await action();
        setNotice(r);
        if (r.ok) {
          setPicked(new Set());
          onOk?.();
        }
      } catch (err) {
        setNotice({
          ok: false,
          message: (err as Error).message || "Erro inesperado.",
        });
      }
    });
  }

  function remove() {
    const withSales = selected.filter((r) => r.salesCount > 0).length;
    const msg = [
      `Excluir ${selected.length === 1 ? "1 produto" : `${selected.length} produtos`}? Isso não pode ser desfeito.`,
      "Os pedidos antigos continuam preservados e nada muda na YouDraw.",
      withSales ? `${withSales} deles já têm vendas: se a ideia é só tirar da loja, use “Arquivar”.` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!window.confirm(msg)) return;
    run(() => bulkDeleteProductsAction(ids));
  }

  return (
    <>
      {notice && (
        <div
          role="status"
          className={cn(
            "mb-3 flex items-start justify-between gap-3 rounded-md border px-4 py-2.5 text-sm",
            notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline">
            Fechar
          </button>
        </div>
      )}

      <div className={cn("overflow-x-auto rounded-lg border border-neutral-200 bg-white", selected.length > 0 && "mb-24")}>
        <table className="w-full text-sm">
          <thead className="border-b bg-neutral-50 text-left text-xs text-neutral-500">
            <tr>
              <th className="w-10 py-2.5 pl-4">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  className="size-4 accent-neutral-900"
                  checked={allOn}
                  ref={(el) => {
                    if (el) el.indeterminate = selected.length > 0 && !allOn;
                  }}
                  onChange={() => setPicked(allOn ? new Set() : new Set(rows.map((r) => r.id)))}
                />
              </th>
              <th className="px-3 py-2.5 font-medium">Produto</th>
              <th className="px-3 py-2.5 font-medium">Preço</th>
              <th className="px-3 py-2.5 font-medium">Variações</th>
              <th className="px-3 py-2.5 font-medium">Vendas</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => {
              const on = picked.has(p.id);
              const linkedAll = p.linkedCount === p.variantsCount;
              return (
                <tr key={p.id} className={on ? "bg-neutral-50" : "hover:bg-neutral-50"}>
                  <td className="py-2.5 pl-4">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${p.title}`}
                      className="size-4 accent-neutral-900"
                      checked={on}
                      onChange={() => toggle(p.id)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3">
                      <span className="h-14 w-11 shrink-0 overflow-hidden rounded bg-neutral-100">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
                        )}
                      </span>
                      <span>
                        <span className="font-medium hover:underline">{p.title}</span>
                        <span className="block text-xs text-neutral-500">
                          {p.category ?? "Sem categoria"}
                          {p.tags.length > 0 && ` · ${p.tags.join(", ")}`}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                    {formatBRL(p.priceCents)}
                    {p.compareAtCents && <span className="block text-xs text-neutral-400 line-through">{formatBRL(p.compareAtCents)}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {p.variantsCount}
                    <span className={cn("block", linkedAll ? "text-emerald-700" : p.linkedCount ? "text-amber-700" : "text-neutral-400")}>
                      {linkedAll ? "YouDraw ✓" : p.linkedCount ? `${p.linkedCount} com YouDraw` : "sem YouDraw"}
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

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:left-60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 lg:px-8">
            <span className="mr-1 text-sm font-medium">
              {selected.length} selecionado{selected.length > 1 ? "s" : ""}
            </span>
            <button type="button" disabled={pending} className={buttonClass("primary", "sm")} onClick={() => setEditing(true)}>
              Editar em massa
            </button>
            <select
              aria-label="Mudar status"
              disabled={pending}
              value=""
              className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs font-medium"
              onChange={(e) => {
                const v = e.target.value as "active" | "draft" | "archived";
                if (v) run(() => bulkSetProductStatusAction(ids, v));
              }}
            >
              <option value="">Mudar status…</option>
              <option value="active">Ativar</option>
              <option value="draft">Mover para rascunho</option>
              <option value="archived">Arquivar</option>
            </select>
            <button type="button" disabled={pending} className={buttonClass("danger", "sm")} onClick={remove}>
              Excluir
            </button>
            <button type="button" disabled={pending} className="ml-auto text-xs text-neutral-600 underline" onClick={() => setPicked(new Set())}>
              {pending ? "Aguarde…" : "Limpar seleção"}
            </button>
          </div>
        </div>
      )}

      {editing && selected.length > 0 && (
        <BulkEditDialog
          products={selected}
          categories={categories}
          pending={pending}
          onClose={() => setEditing(false)}
          onSubmit={(input) =>
            run(
              () => bulkEditProductsAction(ids, input),
              () => setEditing(false),
            )
          }
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------------- Janela de edição em massa

type PriceMode = PriceChange["mode"];
type CompareMode = CompareAtChange["mode"];
type Tri = "keep" | "yes" | "no";

function BulkEditDialog({
  products,
  categories,
  pending,
  onClose,
  onSubmit,
}: {
  products: ProductRow[];
  categories: Category[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: BulkEditInput) => void;
}) {
  const [priceMode, setPriceMode] = useState<PriceMode>("keep");
  const [priceValue, setPriceValue] = useState("");
  const [round90, setRound90] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>("keep");
  const [compareValue, setCompareValue] = useState("");
  const [category, setCategory] = useState("keep");
  const [addTags, setAddTags] = useState("");
  const [removeTags, setRemoveTags] = useState("");
  const [isNew, setIsNew] = useState<Tri>("keep");
  const [isFeatured, setIsFeatured] = useState<Tri>("keep");
  const [status, setStatus] = useState("keep");
  const [error, setError] = useState("");

  const isPct = priceMode === "increase_pct" || priceMode === "decrease_pct";
  const lowers = priceMode === "decrease_pct" || priceMode === "decrease_abs" || priceMode === "set";

  function priceChange(): PriceChange | null {
    if (priceMode === "keep") return { mode: "keep" };
    if (isPct) {
      const value = Number.parseFloat(priceValue.replace(",", "."));
      return Number.isFinite(value) && value > 0 ? { mode: priceMode as "increase_pct" | "decrease_pct", value } : null;
    }
    const cents = parseBRL(priceValue);
    return cents > 0 ? { mode: priceMode as "set" | "increase_abs" | "decrease_abs", cents } : null;
  }

  const change = priceChange();
  const sample = products[0];
  const preview = change && change.mode !== "keep" && sample ? applyPriceChange(sample.priceCents, change, round90 && change.mode !== "set") : null;
  const tagList = (s: string) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!change) return setError(isPct ? "Informe a porcentagem." : "Informe o valor do preço.");
    let compareAt: CompareAtChange = { mode: "keep" };
    if (compareMode === "previous") {
      if (change.mode === "keep") return setError("Para mostrar o preço atual riscado, escolha também uma mudança de preço.");
      compareAt = { mode: "previous" };
    } else if (compareMode === "set") {
      const cents = parseBRL(compareValue);
      if (!cents) return setError("Informe o valor do preço riscado.");
      compareAt = { mode: "set", cents };
    } else if (compareMode === "clear") compareAt = { mode: "clear" };

    onSubmit({
      price: change,
      roundTo90: round90 && change.mode !== "set" && change.mode !== "keep",
      compareAt,
      categoryId: category === "keep" ? "keep" : category === "none" ? null : Number(category),
      addTags: tagList(addTags),
      removeTags: tagList(removeTags),
      isNew,
      isFeatured,
      status: status as BulkEditInput["status"],
    });
  }

  const select = cn(inputClass, "min-w-0 flex-1 py-1.5");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl"
        aria-label="Editar produtos em massa"
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Editar em massa</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {products.length === 1 ? "1 produto selecionado" : `${products.length} produtos selecionados`}. Só o que você mudar aqui é alterado.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl leading-none text-neutral-500" aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">Preço</h3>
            <div className="flex gap-2">
              <select
                className={select}
                value={priceMode}
                onChange={(e) => {
                  const mode = e.target.value as PriceMode;
                  setPriceMode(mode);
                  if (compareMode === "previous" && !["set", "decrease_pct", "decrease_abs"].includes(mode)) setCompareMode("keep");
                }}
              >
                <option value="keep">Não alterar</option>
                <option value="set">Definir preço</option>
                <option value="increase_pct">Aumentar %</option>
                <option value="decrease_pct">Diminuir %</option>
                <option value="increase_abs">Aumentar R$</option>
                <option value="decrease_abs">Diminuir R$</option>
              </select>
              {priceMode !== "keep" && (
                <div className="w-32 shrink-0">
                  <input
                    className={cn(inputClass, "py-1.5")}
                    inputMode="decimal"
                    placeholder={isPct ? "10" : "159,90"}
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    aria-label={isPct ? "Porcentagem" : "Valor em reais"}
                  />
                </div>
              )}
            </div>
            {priceMode !== "keep" && priceMode !== "set" && (
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-neutral-900" checked={round90} onChange={(e) => setRound90(e.target.checked)} />
                Arredondar para terminar em ,90
              </label>
            )}
            {preview != null && sample && (
              <p className="mt-2 text-xs text-neutral-600">
                Ex.: {sample.title}: {formatBRL(sample.priceCents)} → <strong>{formatBRL(preview)}</strong>
              </p>
            )}
            {priceMode !== "keep" && <p className="mt-1 text-xs text-neutral-500">Variações com preço próprio (ex.: G1/G2) acompanham a mudança.</p>}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">Preço riscado (“de”)</h3>
            <div className="flex gap-2">
              <select className={select} value={compareMode} onChange={(e) => setCompareMode(e.target.value as CompareMode)}>
                <option value="keep">Não alterar</option>
                {lowers && <option value="previous">Preço atual vira o riscado (promoção)</option>}
                <option value="set">Definir valor</option>
                <option value="clear">Remover</option>
              </select>
              {compareMode === "set" && (
                <div className="w-32 shrink-0">
                  <input
                    className={cn(inputClass, "py-1.5")}
                    inputMode="decimal"
                    placeholder="199,90"
                    value={compareValue}
                    onChange={(e) => setCompareValue(e.target.value)}
                    aria-label="Preço riscado em reais"
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-neutral-500">Só aparece quando é maior que o preço de venda.</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Categoria</span>
              <select className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="keep">Não alterar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="none">Sem categoria</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Status</span>
              <select className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="keep">Não alterar</option>
                <option value="active">Ativo</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Adicionar tags</span>
              <input className={cn(inputClass, "py-1.5")} placeholder="BLACK LENTO" value={addTags} onChange={(e) => setAddTags(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Remover tags</span>
              <input className={cn(inputClass, "py-1.5")} placeholder="Separe por vírgula" value={removeTags} onChange={(e) => setRemoveTags(e.target.value)} />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <TriSelect label="Selo “Lançamento”" value={isNew} onChange={setIsNew} />
            <TriSelect label="Destaque (aparece primeiro)" value={isFeatured} onChange={setIsFeatured} />
          </section>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t bg-neutral-50 px-5 py-3">
          <button type="button" className={buttonClass("secondary")} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "Aplicando…" : `Aplicar a ${products.length} produto${products.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function TriSelect({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500 uppercase">{label}</span>
      <select className={cn(inputClass, "py-1.5")} value={value} onChange={(e) => onChange(e.target.value as Tri)}>
        <option value="keep">Não alterar</option>
        <option value="yes">Sim</option>
        <option value="no">Não</option>
      </select>
    </label>
  );
}
