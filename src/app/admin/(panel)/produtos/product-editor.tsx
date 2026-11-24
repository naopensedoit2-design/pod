"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { UploadButton } from "@/components/admin/image-upload";
import { Card, Field, Notice, buttonClass, inputClass } from "@/components/admin/ui";
import { centsToInput, cn, discountPercent, formatBRL, parseBRL, slugify } from "@/lib/format";
import { sortSizes } from "@/lib/sizes";
import {
  deleteProductAction,
  duplicateProductAction,
  saveProductAction,
  syncYouDrawProductAction,
  type ProductPayload,
} from "./actions";

type Img = { id?: number; url: string; alt: string; color: string; key: string };
type Var = {
  id?: number;
  key: string;
  option1: string;
  option1Hex: string | null;
  option2: string;
  sku: string;
  price: string;
  stock: string;
  ydSku: string;
  productionCostCents: number | null;
  isActive: boolean;
};

export type EditorInitial = Omit<ProductPayload, "images" | "variants"> & {
  images: { id?: number; url: string; alt: string; color: string }[];
  variants: {
    id?: number;
    option1: string;
    option1Hex: string | null;
    option2: string;
    sku: string;
    priceCents: number | null;
    stock: number | null;
    ydSku: string | null;
    productionCostCents: number | null;
    isActive: boolean;
  }[];
};

let seq = 0;
const k = () => `k${++seq}`;

export function ProductEditor({
  initial,
  categories,
  storeUrl,
}: {
  initial: EditorInitial;
  categories: { id: number; name: string }[];
  storeUrl?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [description, setDescription] = useState(initial.description ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId ?? null);
  const [status, setStatus] = useState(initial.status);
  const [price, setPrice] = useState(centsToInput(initial.priceCents));
  const [compareAt, setCompareAt] = useState(centsToInput(initial.compareAtCents ?? null));
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [isNew, setIsNew] = useState(Boolean(initial.isNew));
  const [isFeatured, setIsFeatured] = useState(Boolean(initial.isFeatured));
  const [sortOrder, setSortOrder] = useState(String(initial.sortOrder ?? 0));
  const [option1Name, setOption1Name] = useState(initial.option1Name ?? "Cor");
  const [option2Name, setOption2Name] = useState(initial.option2Name ?? "Tamanho");
  const [sizeChart, setSizeChart] = useState(initial.sizeChart ?? "");
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? "");
  const [images, setImages] = useState<Img[]>(initial.images.map((i) => ({ ...i, key: k() })));
  const [vars, setVars] = useState<Var[]>(
    initial.variants.map((v) => ({
      id: v.id,
      key: k(),
      option1: v.option1,
      option1Hex: v.option1Hex,
      option2: v.option2,
      sku: v.sku,
      price: centsToInput(v.priceCents),
      stock: v.stock == null ? "" : String(v.stock),
      ydSku: v.ydSku ?? "",
      productionCostCents: v.productionCostCents,
      isActive: v.isActive,
    })),
  );

  // Gerador de combinações
  const [genColors, setGenColors] = useState<{ name: string; hex: string }[]>([{ name: "", hex: "#111111" }]);
  const [genSizes, setGenSizes] = useState("P, M, G, GG, XG");

  const colorNames = useMemo(() => [...new Set(vars.map((v) => v.option1).filter(Boolean))], [vars]);
  const priceCents = parseBRL(price);
  const compareCents = parseBRL(compareAt);
  const off = discountPercent(priceCents, compareCents);
  const costs = vars.map((v) => v.productionCostCents).filter((c): c is number => c != null);
  const maxCost = costs.length ? Math.max(...costs) : null;

  function generate() {
    const colors = genColors.filter((c) => c.name.trim());
    const sizes = sortSizes(genSizes.split(",").map((s) => s.trim()).filter(Boolean));
    const cs = colors.length ? colors : [{ name: "", hex: "" }];
    const ss = sizes.length ? sizes : [""];
    const next = [...vars];
    for (const c of cs) {
      for (const s of ss) {
        if (next.some((v) => v.option1 === c.name.trim() && v.option2 === s)) continue;
        next.push({
          key: k(),
          option1: c.name.trim(),
          option1Hex: c.hex || null,
          option2: s,
          sku: "",
          price: "",
          stock: "",
          ydSku: "",
          productionCostCents: null,
          isActive: true,
        });
      }
    }
    setVars(next);
  }

  function updateVar(key: string, patch: Partial<Var>) {
    setVars((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function moveImage(index: number, dir: -1 | 1) {
    setImages((imgs) => {
      const next = [...imgs];
      const j = index + dir;
      if (j < 0 || j >= next.length) return imgs;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function save() {
    setMsg(null);
    const payload: ProductPayload = {
      id: initial.id,
      title,
      slug: slugTouched ? slug : slugify(title),
      description,
      categoryId,
      status,
      priceCents,
      compareAtCents: compareCents || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      isNew,
      isFeatured,
      option1Name,
      option2Name,
      sizeChart,
      seoTitle,
      seoDescription,
      ydProductId: initial.ydProductId ?? null,
      sortOrder: Number(sortOrder) || 0,
      images: images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, color: i.color })),
      variants: vars.map((v) => ({
        id: v.id,
        option1: v.option1,
        option1Hex: v.option1Hex,
        option2: v.option2,
        sku: v.sku,
        priceCents: v.price.trim() ? parseBRL(v.price) : null,
        stock: v.stock.trim() === "" ? null : Math.max(0, Number.parseInt(v.stock, 10) || 0),
        ydSku: v.ydSku.trim() || null,
        productionCostCents: v.productionCostCents,
        isActive: v.isActive,
      })),
    };
    start(async () => {
      const res = await saveProductAction(payload);
      if (!res.ok) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      setMsg({ ok: true, text: "Produto salvo." });
      if (!initial.id) router.replace(`/admin/produtos/${res.id}`);
    });
  }

  return (
    <div className="space-y-6 pb-24">
      {initial.ydProductId && (
        <Notice tone="blue">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Vinculado ao produto <strong>{initial.ydProductId}</strong> da YouDraw. SKUs e custos vêm de lá.
            </span>
            {initial.id && (
              <ActionButton action={syncYouDrawProductAction.bind(null, initial.id)} size="sm">
                Atualizar da YouDraw
              </ActionButton>
            )}
          </div>
        </Notice>
      )}

      <Card title="Informações">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do produto" className="sm:col-span-2">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Endereço (slug)" hint={`/produto/${slug || slugify(title) || "..."}`}>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Categoria">
            <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)} className={inputClass}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descrição" className="sm:col-span-2" hint="Deixe uma linha em branco para separar parágrafos.">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Preço">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Preço de venda (R$)">
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="149,90" className={inputClass} />
          </Field>
          <Field label="Preço “de” (riscado, opcional)" hint={off > 0 ? `Mostra o selo ${off}% OFF` : "Para mostrar desconto"}>
            <input value={compareAt} onChange={(e) => setCompareAt(e.target.value)} inputMode="decimal" placeholder="199,90" className={inputClass} />
          </Field>
          <div className="rounded-md bg-neutral-50 p-3 text-sm">
            <p className="text-xs text-neutral-500">Custo de produção (YouDraw)</p>
            <p className="font-medium">{maxCost != null ? `até ${formatBRL(maxCost)}` : "—"}</p>
            {maxCost != null && priceCents > 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                Margem bruta: <strong className="text-neutral-900">{formatBRL(priceCents - maxCost)}</strong> ({Math.round(((priceCents - maxCost) / priceCents) * 100)}%) antes de frete e
                taxas
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card
        title={`Imagens (${images.length})`}
        actions={
          <UploadButton
            multiple
            label="+ Enviar imagens"
            onUploaded={(urls) => setImages((imgs) => [...imgs, ...urls.map((url) => ({ url, alt: title, color: "", key: k() }))])}
          />
        }
      >
        {images.length === 0 ? (
          <p className="text-sm text-neutral-500">Envie fotos do produto (a primeira é a capa). Proporção ideal: 3:4 (ex.: 1200×1600).</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {images.map((img, i) => (
              <div key={img.key} className="rounded-md border p-2">
                <div className="relative aspect-[3/4] overflow-hidden rounded bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 rounded bg-black px-1.5 py-0.5 text-[10px] text-white">Capa</span>}
                </div>
                <select
                  value={img.color}
                  onChange={(e) => setImages((imgs) => imgs.map((x) => (x.key === img.key ? { ...x, color: e.target.value } : x)))}
                  className="mt-2 w-full rounded border border-neutral-300 px-1 py-1 text-xs"
                  title={`Mostrar quando a ${option1Name.toLowerCase()} for…`}
                >
                  <option value="">Todas as {option1Name.toLowerCase()}s</option>
                  {colorNames.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 flex justify-between">
                  <button type="button" onClick={() => moveImage(i, -1)} className="px-1 text-sm text-neutral-500 hover:text-black" aria-label="Mover para a esquerda">
                    ←
                  </button>
                  <button type="button" onClick={() => setImages((imgs) => imgs.filter((x) => x.key !== img.key))} className="text-xs text-red-600 hover:underline">
                    Remover
                  </button>
                  <button type="button" onClick={() => moveImage(i, 1)} className="px-1 text-sm text-neutral-500 hover:text-black" aria-label="Mover para a direita">
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Variações (${vars.length})`}>
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nome da opção 1">
            <input value={option1Name} onChange={(e) => setOption1Name(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Nome da opção 2">
            <input value={option2Name} onChange={(e) => setOption2Name(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <details className="mb-5 rounded-md border bg-neutral-50 p-4" open={vars.length === 0}>
          <summary className="cursor-pointer text-sm font-medium">Gerar combinações ({option1Name} × {option2Name})</summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-700">{option1Name}s</p>
              <div className="space-y-2">
                {genColors.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="color"
                      value={c.hex || "#111111"}
                      onChange={(e) => setGenColors((cs) => cs.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                      className="h-9 w-11 cursor-pointer rounded border"
                    />
                    <input
                      value={c.name}
                      onChange={(e) => setGenColors((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      placeholder="ex.: Preta"
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setGenColors((cs) => cs.filter((_, j) => j !== i))} className="px-2 text-neutral-400 hover:text-red-600">
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setGenColors((cs) => [...cs, { name: "", hex: "#ffffff" }])} className="text-xs underline">
                  + adicionar {option1Name.toLowerCase()}
                </button>
              </div>
            </div>
            <div>
              <Field label={`${option2Name}s (separados por vírgula)`}>
                <input value={genSizes} onChange={(e) => setGenSizes(e.target.value)} className={inputClass} />
              </Field>
              <button type="button" onClick={generate} className={cn(buttonClass("primary", "sm"), "mt-3")}>
                Gerar variações
              </button>
              <p className="mt-2 text-xs text-neutral-500">Combinações que já existem não são duplicadas.</p>
            </div>
          </div>
        </details>

        {vars.length > 0 && (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-y bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-2 font-medium">{option1Name}</th>
                  <th className="px-2 py-2 font-medium">{option2Name}</th>
                  <th className="px-2 py-2 font-medium">SKU</th>
                  <th className="px-2 py-2 font-medium">SKU YouDraw</th>
                  <th className="px-2 py-2 font-medium">Preço próprio</th>
                  <th className="px-2 py-2 font-medium" title="Deixe vazio para ilimitado (sob demanda)">
                    Estoque
                  </th>
                  <th className="px-2 py-2 font-medium">Ativa</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {vars.map((v) => (
                  <tr key={v.key} className={cn(!v.isActive && "opacity-50")}>
                    <td className="px-5 py-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={v.option1Hex || "#dddddd"}
                          onChange={(e) => updateVar(v.key, { option1Hex: e.target.value })}
                          className="h-7 w-8 shrink-0 cursor-pointer rounded border"
                          title="Cor da bolinha"
                        />
                        <input value={v.option1} onChange={(e) => updateVar(v.key, { option1: e.target.value })} className={cn(inputClass, "py-1.5")} />
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={v.option2} onChange={(e) => updateVar(v.key, { option2: e.target.value })} className={cn(inputClass, "w-20 py-1.5")} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={v.sku} onChange={(e) => updateVar(v.key, { sku: e.target.value })} className={cn(inputClass, "w-32 py-1.5")} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={v.ydSku}
                        onChange={(e) => updateVar(v.key, { ydSku: e.target.value })}
                        placeholder="—"
                        className={cn(inputClass, "w-36 py-1.5")}
                        title={v.productionCostCents != null ? `Custo: ${formatBRL(v.productionCostCents)}` : undefined}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={v.price} onChange={(e) => updateVar(v.key, { price: e.target.value })} placeholder="padrão" className={cn(inputClass, "w-24 py-1.5")} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={v.stock} onChange={(e) => updateVar(v.key, { stock: e.target.value.replace(/\D/g, "") })} placeholder="∞" className={cn(inputClass, "w-16 py-1.5")} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="checkbox" checked={v.isActive} onChange={(e) => updateVar(v.key, { isActive: e.target.checked })} />
                    </td>
                    <td className="px-5 py-1.5 text-right">
                      <button type="button" onClick={() => setVars((vs) => vs.filter((x) => x.key !== v.key))} className="text-xs text-red-600 hover:underline">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-neutral-500">
          O <strong>SKU YouDraw</strong> liga a variação à produção: com ele, o frete é cotado na YouDraw e o pedido é enviado automaticamente. Sem ele, a produção/envio é manual.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Vitrine">
          <div className="space-y-4">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputClass}>
                <option value="active">Ativo (aparece na loja)</option>
                <option value="draft">Rascunho (escondido)</option>
                <option value="archived">Arquivado</option>
              </select>
            </Field>
            <Field label="Selos (separados por vírgula)" hint="Aparecem em vermelho no card. Ex.: BLACK LENTO, EDIÇÃO LIMITADA">
              <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} /> Lançamento (selo + seção “Lançamentos”)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Destaque (aparece primeiro)
            </label>
            <Field label="Ordem na vitrine" hint="Menor aparece antes">
              <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^\d-]/g, ""))} className={cn(inputClass, "w-24")} />
            </Field>
          </div>
        </Card>
        <Card title="Tabela de medidas">
          <Field label="Uma linha por tamanho, colunas separadas por |" hint="Deixe vazio para usar a tabela padrão (Configurações).">
            <textarea
              value={sizeChart}
              onChange={(e) => setSizeChart(e.target.value)}
              rows={7}
              placeholder={"Tamanho | Largura | Comprimento\nP | 52 | 70\nM | 55 | 72"}
              className={cn(inputClass, "font-mono text-xs")}
            />
          </Field>
        </Card>
      </div>

      <Card title="SEO (Google e redes sociais)">
        <div className="grid gap-4">
          <Field label="Título" hint="Se vazio, usa o nome do produto.">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Descrição" hint="Até ~160 caracteres.">
            <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} className={inputClass} />
          </Field>
        </div>
      </Card>

      {initial.id && (
        <div className="flex flex-wrap gap-2">
          <ActionButton action={duplicateProductAction.bind(null, initial.id)}>Duplicar produto</ActionButton>
          <ActionButton action={deleteProductAction.bind(null, initial.id)} variant="danger" confirm="Excluir este produto? Pedidos antigos continuam preservados.">
            Excluir produto
          </ActionButton>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="text-sm">
            {msg ? <span className={msg.ok ? "text-emerald-700" : "text-red-600"}>{msg.text}</span> : <span className="text-neutral-500">Alterações não salvas são perdidas ao sair.</span>}
          </div>
          <div className="flex gap-2">
            {storeUrl && status === "active" && (
              <a href={storeUrl} target="_blank" className={buttonClass("secondary")}>
                Ver na loja
              </a>
            )}
            <button type="button" onClick={save} disabled={pending} className={buttonClass("primary")}>
              {pending ? "Salvando…" : "Salvar produto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
