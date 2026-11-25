"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { and, eq, inArray, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dataPatches, productImages, products, variants } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
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

export async function setProductStatusAction(ids: number[], status: "active" | "draft" | "archived") {
  await requireAdmin();
  if (!ids.length) return;
  await db.update(products).set({ status, updatedAt: new Date() }).where(inArray(products.id, ids));
  updateTag("products");
  refresh();
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

export async function importYouDrawProductAction(ydId: string): Promise<{ ok: false; error: string } | void> {
  await requireAdmin();
  let yd: YdProduct;
  try {
    yd = await youdraw.getProduct(ydId);
  } catch (err) {
    return { ok: false, error: err instanceof YouDrawError ? err.describe() : (err as Error).message };
  }
  const existing = await db.query.products.findFirst({ where: eq(products.ydProductId, yd.id), columns: { id: true } });
  if (existing) redirect(`/admin/produtos/${existing.id}`);

  const settings = await getSettingsFresh();
  const vs = variantsFromYd(yd);
  if (!vs.length) return { ok: false, error: "Este produto ainda não tem variações com SKU na YouDraw (a composição pode estar em andamento)." };
  const maxCost = Math.max(...vs.map((v) => v.productionCostCents ?? 0));
  const price = maxCost > 0 ? roundPrice(maxCost * settings.integrations.defaultMarkup) : 9990;

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
    redirect(`/admin/produtos/${prod.id}?importado=1`);
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
  redirect(`/admin/produtos/${prod.id}?importado=1`);
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
