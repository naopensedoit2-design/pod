import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products, variants } from "@/db/schema";
import { LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { ProductEditor } from "../product-editor";

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/produtos/[id]">) {
  const { id: raw } = await params;
  const sp = await searchParams;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();
  const [p, cats] = await Promise.all([
    db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)] },
        variants: { orderBy: [asc(variants.sortOrder), asc(variants.id)] },
      },
    }),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
  ]);
  if (!p) notFound();

  return (
    <>
      <PageHeader title={p.title} actions={<LinkButton href="/admin/produtos" variant="secondary" size="sm">← Produtos</LinkButton>} />
      {sp.importado === "1" && (
        <div className="mb-6">
          <Notice tone="green">
            Produto importado da YouDraw como <strong>rascunho</strong>. Revise o preço sugerido, as fotos e a descrição, mude o status para “Ativo” e salve.
          </Notice>
        </div>
      )}
      <ProductEditor
        key={p.id}
        categories={cats}
        storeUrl={`/produto/${p.slug}`}
        initial={{
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          categoryId: p.categoryId,
          status: p.status as "draft" | "active" | "archived",
          priceCents: p.priceCents,
          compareAtCents: p.compareAtCents,
          tags: p.tags,
          isNew: p.isNew,
          isFeatured: p.isFeatured,
          option1Name: p.option1Name,
          option2Name: p.option2Name,
          sizeChart: p.sizeChart,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          ydProductId: p.ydProductId,
          sortOrder: p.sortOrder,
          images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, color: i.color })),
          variants: p.variants.map((v) => ({
            id: v.id,
            option1: v.option1,
            option1Hex: v.option1Hex,
            option2: v.option2,
            sku: v.sku,
            priceCents: v.priceCents,
            stock: v.stock,
            ydSku: v.ydSku,
            productionCostCents: v.productionCostCents,
            isActive: v.isActive,
          })),
        }}
      />
    </>
  );
}
