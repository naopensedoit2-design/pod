"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { and, eq, inArray, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, dataPatches, productImages, products, variants } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { applyCompareAtChange, applyPriceChange, applyVariantPriceChange, MIN_PRICE_CENTS } from "@/lib/bulk-price";
import { slugify } from "@/lib/format";
import { importRemoteImage } from "@/lib/media";
import { productPhotosFor } from "@/lib/product-photos";
import { getSettingsFresh } from "@/lib/settings";
import { youdraw, YouDrawError, type YdProduct } from "@/lib/youdraw";

const imageSchema = z.object({
  id: z.number().int().optional(),
  url: z.string().min(1),
  alt: z.string().default(""),
  color: z.string().default(""),
});

const variantSchema = z.object({
  id: z.number().int().optional(),
  option1: z.string().trim().default(""),
  option1Hex: z.string().trim().nullable().default(null),
  option2: z.string().trim().default(""),
  sku: z.string().trim().default(""),
  priceCents: z.number().int().min(0).nullable().default(null),
  stock: z.number().int().min(0).nullable().default(null),
  ydSku: z.string().trim().nullable().default(null),
  productionCostCents: z.number().int().nullable().default(null),
  isActive: z.boolean().default(true),
});

const productSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().trim().min(2, "Informe o nome do produto."),
  slug: z.string().trim().default(""),
  description: z.string().default(""),
  categoryId: z.number().int().nullable().default(null),
  status: z.enum(["draft", "active", "archived"]),
  priceCents: z.number().int().min(100, "Preço mínimo R$ 1,00."),
  compareAtCents: z.number().int().min(0).nullable().default(null),
  tags: z.array(z.string().trim().min(1)).default([]),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  option1Name: z.string().trim().default("Cor"),
  option2Name: z.string().trim().default("Tamanho"),
  sizeChart: z.string().default(""),
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
  ydProductId: z.string().nullable().default(null),
  sortOrder: z.number().int().default(0),
  images: z.array(imageSchema).default([]),
  variants: z.array(variantSchema).min(1, "Crie pelo menos uma variação."),
});

export type ProductPayload = z.input<typeof productSchema>;

async function uniqueSlug(base: string, exceptId?: number) {
  let slug = slugify(base) || "produto";
  for (let i = 2; i < 50; i++) {
    const clash = await db.query.products.findFirst({
      where: exceptId ? and(eq(products.slug, slug), ne(products.id, exceptId)) : eq(products.slug, slug),
      columns: { id: true },
    });
    if (!clash) return slug;
    slug = `${slugify(base)}-${i}`;
  }
  return `${slugify(base)}-${Date.now()}`;
}

export async function saveProductAction(payload: ProductPayload): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const p = parsed.data;

  const combos = new Set<string>();
  for (const v of p.variants) {
    const k = `${v.option1}|${v.option2}`;
    if (combos.has(k)) return { ok: false, error: `Variação repetida: ${[v.option1, v.option2].filter(Boolean).join(" / ") || "(sem opções)"}.` };
    combos.add(k);
  }

  const slug = await uniqueSlug(p.slug || p.title, p.id);
  const values = {
    title: p.title,
    slug,
    description: p.description,
    categoryId: p.categoryId,
    status: p.status,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents && p.compareAtCents > p.priceCents ? p.compareAtCents : null,
    tags: p.tags.map((t) => t.toUpperCase()),
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    option1Name: p.option1Name || "Cor",
    option2Name: p.option2Name || "Tamanho",
    sizeChart: p.sizeChart,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    ydProductId: p.ydProductId,
    sortOrder: p.sortOrder,
    updatedAt: new Date(),
  };

  const id = await db.transaction(async (tx) => {
    let productId = p.id;
    if (productId) {
      await tx.update(products).set(values).where(eq(products.id, productId));
    } else {
      const [row] = await tx.insert(products).values(values).returning({ id: products.id });
      productId = row.id;
    }

    // Imagens
    const keepImages = p.images.filter((i) => i.id).map((i) => i.id!);
    await tx
      .delete(productImages)
      .where(keepImages.length ? and(eq(productImages.productId, productId), notInArray(productImages.id, keepImages)) : eq(productImages.productId, productId));
    for (const [index, img] of p.images.entries()) {
      if (img.id) {
        await tx.update(productImages).set({ url: img.url, alt: img.alt, color: img.color, sortOrder: index }).where(eq(productImages.id, img.id));
      } else {
        await tx.insert(productImages).values({ productId, url: img.url, alt: img.alt, color: img.color, sortOrder: index });
      }
    }

    // Variações
    const keepVariants = p.variants.filter((v) => v.id).map((v) => v.id!);
    await tx
      .delete(variants)
      .where(keepVariants.length ? and(eq(variants.productId, productId), notInArray(variants.id, keepVariants)) : eq(variants.productId, productId));
    for (const [index, v] of p.variants.entries()) {
      const data = {
        option1: v.option1,
        option1Hex: v.option1Hex || null,
        option2: v.option2,
        sku: v.sku,
        priceCents: v.priceCents,
        stock: v.stock,
        ydSku: v.ydSku || null,
        productionCostCents: v.productionCostCents,
        isActive: v.isActive,
        sortOrder: index,
      };
      if (v.id) await tx.update(variants).set(data).where(and(eq(variants.id, v.id), eq(variants.productId, productId)));
      else await tx.insert(variants).values({ ...data, productId });
    }
    return productId;
  });

  updateTag("products");
  refresh();
  return { ok: true, id };
}

export async function deleteProductAction(id: number) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  updateTag("products");
  redirect("/admin/produtos");
}

export async function duplicateProductAction(id: number) {
  await requireAdmin();
  const p = await db.query.products.findFirst({ where: eq(products.id, id), with: { images: true, variants: true } });
  if (!p) return;
  const slug = await uniqueSlug(`${p.slug}-copia`);
  const [copy] = await db
    .insert(products)
    .values({
      ...p,
      id: undefined,
      title: `${p.title} (cópia)`,
      slug,
      status: "draft",
      salesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: products.id });
  if (p.images.length) await db.insert(productImages).values(p.images.map((i) => ({ ...i, id: undefined, productId: copy.id })));
  if (p.variants.length) await db.insert(variants).values(p.variants.map((v) => ({ ...v, id: undefined, productId: copy.id })));
  updateTag("products");
  redirect(`/admin/produtos/${copy.id}`);
}

// ----------------------------------------------------------------------------- Ações em massa

export type BulkResult = { ok: boolean; message: string };

const idsSchema = z.array(z.number().int().positive()).min(1, "Selecione pelo menos um produto.").max(1000);
const statusSchema = z.enum(["active", "draft", "archived"]);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export async function bulkSetProductStatusAction(ids: number[], status: "active" | "draft" | "archived"): Promise<BulkResult> {
  await requireAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedIds.success || !parsedStatus.success) return { ok: false, message: "Seleção inválida." };
  const rows = await db
    .update(products)
    .set({ status: parsedStatus.data, updatedAt: new Date() })
    .where(inArray(products.id, parsedIds.data))
    .returning({ id: products.id });
  updateTag("products");
  refresh();
  const verb = { active: ["ativado", "ativados"], draft: ["movido para rascunho", "movidos para rascunho"], archived: ["arquivado", "arquivados"] }[parsedStatus.data];
  return { ok: true, message: `${plural(rows.length, "produto", "produtos")} ${rows.length === 1 ? verb[0] : verb[1]}.` };
}

export async function bulkDeleteProductsAction(ids: number[]): Promise<BulkResult> {
  await requireAdmin();
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Seleção inválida." };
  // Pedidos antigos ficam preservados: os itens guardam nome, variação e preço, e o vínculo vira nulo.
  const rows = await db.delete(products).where(inArray(products.id, parsed.data)).returning({ id: products.id });
  updateTag("products");
  refresh();
  return { ok: true, message: `${plural(rows.length, "produto excluído", "produtos excluídos")}.` };
}

const centsSchema = z.number().int().min(1).max(100_000_00);
const bulkEditSchema = z.object({
  price: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("keep") }),
    z.object({ mode: z.literal("set"), cents: centsSchema.min(MIN_PRICE_CENTS, "Preço mínimo R$ 1,00.") }),
    z.object({ mode: z.enum(["increase_pct", "decrease_pct"]), value: z.number().gt(0, "Informe a porcentagem.").max(500) }),
    z.object({ mode: z.enum(["increase_abs", "decrease_abs"]), cents: centsSchema }),
  ]),
  roundTo90: z.boolean().default(false),
  compareAt: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("keep") }),
    z.object({ mode: z.literal("previous") }),
    z.object({ mode: z.literal("set"), cents: centsSchema }),
    z.object({ mode: z.literal("clear") }),
  ]),
  /** "keep" = não alterar; null = sem categoria. */
  categoryId: z.union([z.literal("keep"), z.null(), z.number().int().positive()]),
  addTags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  removeTags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  isNew: z.enum(["keep", "yes", "no"]).default("keep"),
  isFeatured: z.enum(["keep", "yes", "no"]).default("keep"),
  status: z.enum(["keep", "active", "draft", "archived"]).default("keep"),
});

export type BulkEditInput = z.input<typeof bulkEditSchema>;

export async function bulkEditProductsAction(ids: number[], input: BulkEditInput): Promise<BulkResult> {
  await requireAdmin();
  const parsedIds = idsSchema.safeParse(ids);
  if (!parsedIds.success) return { ok: false, message: "Selecione pelo menos um produto." };
  const parsed = bulkEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const c = parsed.data;
  const addTags = [...new Set(c.addTags.map((t) => t.toUpperCase()))];
  const removeTags = new Set(c.removeTags.map((t) => t.toUpperCase()));
  const touchesPrice = c.price.mode !== "keep";
  const nothing =
    !touchesPrice &&
    c.compareAt.mode === "keep" &&
    c.categoryId === "keep" &&
    !addTags.length &&
    !removeTags.size &&
    c.isNew === "keep" &&
    c.isFeatured === "keep" &&
    c.status === "keep";
  if (nothing) return { ok: false, message: "Escolha pelo menos uma alteração." };
  if (c.compareAt.mode === "previous" && !touchesPrice) return { ok: false, message: "“Preço atual vira o riscado” só vale junto com uma mudança de preço." };
  if (typeof c.categoryId === "number") {
    const cat = await db.query.categories.findFirst({ where: eq(categories.id, c.categoryId), columns: { id: true } });
    if (!cat) return { ok: false, message: "Categoria não encontrada." };
  }

  let compareDropped = 0;
  const count = await db.transaction(async (tx) => {
    const rows = await tx.query.products.findMany({
      where: inArray(products.id, parsedIds.data),
      columns: { id: true, priceCents: true, compareAtCents: true, tags: true },
      with: { variants: { columns: { id: true, priceCents: true } } },
    });
    for (const p of rows) {
      const newPrice = applyPriceChange(p.priceCents, c.price, c.roundTo90);
      const compareAt = touchesPrice || c.compareAt.mode !== "keep" ? applyCompareAtChange(p.compareAtCents, p.priceCents, newPrice, c.compareAt) : p.compareAtCents;
      if (c.compareAt.mode !== "clear" && p.compareAtCents != null && compareAt == null) compareDropped++;
      let tags = p.tags;
      if (addTags.length || removeTags.size) tags = [...new Set([...p.tags.filter((t) => !removeTags.has(t.toUpperCase())), ...addTags])];
      await tx
        .update(products)
        .set({
          priceCents: newPrice,
          compareAtCents: compareAt,
          tags,
          ...(c.categoryId !== "keep" && { categoryId: c.categoryId }),
          ...(c.isNew !== "keep" && { isNew: c.isNew === "yes" }),
          ...(c.isFeatured !== "keep" && { isFeatured: c.isFeatured === "yes" }),
          ...(c.status !== "keep" && { status: c.status }),
          updatedAt: new Date(),
        })
        .where(eq(products.id, p.id));
      if (touchesPrice) {
        for (const v of p.variants) {
          if (v.priceCents == null) continue;
          await tx
            .update(variants)
            .set({ priceCents: applyVariantPriceChange(v.priceCents, p.priceCents, newPrice, c.price, c.roundTo90) })
            .where(eq(variants.id, v.id));
        }
      }
    }
    return rows.length;
  });

  updateTag("products");
  refresh();
  const note = compareDropped ? ` O preço riscado saiu de ${plural(compareDropped, "produto", "produtos")} porque não seria maior que o novo preço.` : "";
  return { ok: true, message: `${plural(count, "produto atualizado", "produtos atualizados")}.${note}` };
}

// ----------------------------------------------------------------------------- YouDraw

function roundPrice(cents: number) {
  // Arredonda para cima terminando em ,90 (ex.: 137,12 → 139,90)
  const reais = Math.ceil(cents / 100);
  const base = Math.ceil((reais + 0.1) / 10) * 10;
  return base * 100 - 10;
}

function variantsFromYd(yd: YdProduct) {
  return (yd.variants ?? [])
    .filter((v) => v.sku)
    .map((v) => ({
      option1: v.color?.name ?? "",
      option1Hex: v.color?.hex ?? null,
      option2: v.size ?? "",
      sku: v.sku ?? "",
      ydSku: v.sku,
      productionCostCents: v.production_cost?.amount_cents ?? null,
      weightGrams: v.weight_grams ?? null,
      images: v.images ?? [],
    }));
}

type ImportResult = { ok: false; error: string } | { ok: true; id: number; existing: boolean };

/** Importa um produto da YouDraw (sem checar sessão nem redirecionar): usada pela importação individual e pela em massa. */
async function importOne(ydId: string, priceCentsOverride?: number): Promise<ImportResult> {
  let yd: YdProduct;
  try {
    yd = await youdraw.getProduct(ydId);
  } catch (err) {
    return { ok: false, error: err instanceof YouDrawError ? err.describe() : (err as Error).message };
  }
  const existing = await db.query.products.findFirst({ where: eq(products.ydProductId, yd.id), columns: { id: true } });
  if (existing) return { ok: true, id: existing.id, existing: true };

  const settings = await getSettingsFresh();
  const vs = variantsFromYd(yd);
  if (!vs.length) return { ok: false, error: "Este produto ainda não tem variações com SKU na YouDraw (a composição pode estar em andamento)." };
  const maxCost = Math.max(...vs.map((v) => v.productionCostCents ?? 0));
  const price = priceCentsOverride ?? (maxCost > 0 ? roundPrice(maxCost * settings.integrations.defaultMarkup) : 9990);

  const slug = await uniqueSlug(yd.name);
  const [prod] = await db
    .insert(products)
    .values({
      title: yd.name,
      slug,
      description: yd.description ?? "",
      status: "draft",
      priceCents: price,
      ydProductId: yd.id,
      ydSyncedAt: new Date(),
      option1Name: "Cor",
      option2Name: "Tamanho",
    })
    .returning({ id: products.id });

  // Fotos em alta (e cores das bolinhas) já preparadas para este produto: src/data/product-photos.json.
  const photos = productPhotosFor(yd.id);

  await db.insert(variants).values(
    vs.map((v, i) => ({
      productId: prod.id,
      option1: v.option1,
      option1Hex: photos?.colors?.[v.option1] ?? v.option1Hex,
      option2: v.option2,
      sku: v.sku,
      ydSku: v.ydSku,
      productionCostCents: v.productionCostCents,
      weightGrams: v.weightGrams,
      sortOrder: i,
    })),
  );

  if (photos) {
    await db.insert(productImages).values(
      photos.images.map((img, i) => ({ productId: prod.id, url: img.url, alt: img.alt, color: img.color, sortOrder: i })),
    );
    await db.insert(dataPatches).values({ id: photos.patchId }).onConflictDoNothing();
    updateTag("products");
    return { ok: true, id: prod.id, existing: false };
  }

  // Imagens: uma leva por cor (mockups da variante) + fotos gerais do produto.
  const queue: { url: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const v of vs) {
    for (const url of v.images.slice(0, 3)) {
      if (seen.has(url)) continue;
      seen.add(url);
      queue.push({ url, color: v.option1 });
    }
  }
  for (const url of yd.images ?? []) if (!seen.has(url)) queue.push({ url, color: "" });
  let sort = 0;
  for (const img of queue.slice(0, 12)) {
    try {
      const local = await importRemoteImage(img.url, yd.name);
      await db.insert(productImages).values({ productId: prod.id, url: local, alt: `${yd.name} ${img.color}`.trim(), color: img.color, sortOrder: sort++ });
    } catch {
      // Se não conseguir copiar, usa a URL original
      await db.insert(productImages).values({ productId: prod.id, url: img.url, alt: yd.name, color: img.color, sortOrder: sort++ });
    }
  }
  updateTag("products");
  return { ok: true, id: prod.id, existing: false };
}

export async function importYouDrawProductAction(ydId: string): Promise<{ ok: false; error: string } | void> {
  await requireAdmin();
  const r = await importOne(ydId);
  if (!r.ok) return r;
  redirect(r.existing ? `/admin/produtos/${r.id}` : `/admin/produtos/${r.id}?importado=1`);
}

export type ImportAllResult = { imported: string[]; skipped: string[]; failed: { name: string; error: string }[] };

/**
 * Importa de uma vez todos os produtos da YouDraw que ainda não estão na loja.
 * Pula os que já foram importados e os que ainda estão gerando mockup (sem foto), que ficam para a próxima rodada.
 * priceCents: preço único para todos (opcional; sem ele vale custo × multiplicador). publish: já deixa ativos (padrão: rascunho).
 */
export async function importAllYouDrawProductsAction(input: { priceCents?: number | null; publish?: boolean }): Promise<ImportAllResult> {
  await requireAdmin();
  const out: ImportAllResult = { imported: [], skipped: [], failed: [] };
  const price = input.priceCents && input.priceCents >= MIN_PRICE_CENTS ? Math.round(input.priceCents) : undefined;
  const have = await db.select({ yd: products.ydProductId }).from(products);
  const done = new Set(have.map((r) => r.yd).filter(Boolean));
  const all: YdProduct[] = [];
  try {
    for (let page = 1; page <= 20; page++) {
      const res = await youdraw.listProducts({ page, perPage: 100 });
      all.push(...res.data);
      if (!res.meta || page >= res.meta.last_page) break;
    }
  } catch (err) {
    out.failed.push({ name: "Lista da YouDraw", error: err instanceof YouDrawError ? err.describe() : (err as Error).message });
    return out;
  }
  for (const p of all) {
    if (done.has(p.id)) continue;
    if (p.status?.toLowerCase() !== "ativo") { out.skipped.push(`${p.name} (inativo na YouDraw)`); continue; }
    if (p.media && p.media.status !== "ready") { out.skipped.push(`${p.name} (mockup: ${p.media.status})`); continue; }
    const r = await importOne(p.id, price);
    if (!r.ok) { out.failed.push({ name: p.name, error: r.error }); continue; }
    if (input.publish) await db.update(products).set({ status: "active" }).where(eq(products.id, r.id));
    out.imported.push(p.name);
  }
  updateTag("products");
  refresh();
  return out;
}

export async function syncYouDrawProductAction(productId: number): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const prod = await db.query.products.findFirst({ where: eq(products.id, productId), with: { variants: true } });
  if (!prod?.ydProductId) return { ok: false, message: "Produto não está vinculado à YouDraw." };
  try {
    const yd = await youdraw.getProduct(prod.ydProductId);
    const vs = variantsFromYd(yd);
    let updated = 0;
    let added = 0;
    for (const v of vs) {
      const match = prod.variants.find((x) => x.ydSku === v.ydSku) ?? prod.variants.find((x) => x.option1 === v.option1 && x.option2 === v.option2);
      if (match) {
        await db.update(variants).set({ ydSku: v.ydSku, productionCostCents: v.productionCostCents, option1Hex: match.option1Hex ?? v.option1Hex }).where(eq(variants.id, match.id));
        updated++;
      } else {
        await db.insert(variants).values({ productId, option1: v.option1, option1Hex: v.option1Hex, option2: v.option2, sku: v.sku, ydSku: v.ydSku, productionCostCents: v.productionCostCents, sortOrder: 999 });
        added++;
      }
    }
    await db.update(products).set({ ydSyncedAt: new Date() }).where(eq(products.id, productId));
    updateTag("products");
    refresh();
    return { ok: true, message: `${updated} variação(ões) atualizada(s), ${added} nova(s). Status na YouDraw: ${yd.status}; mockups: ${yd.media?.status ?? "—"}.` };
  } catch (err) {
    return { ok: false, message: err instanceof YouDrawError ? err.describe() : (err as Error).message };
  }
}
