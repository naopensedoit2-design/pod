import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { LinkButton, PageHeader } from "@/components/admin/ui";
import { ProductEditor } from "../product-editor";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder));
  return (
    <>
      <PageHeader title="Novo produto" actions={<LinkButton href="/admin/produtos" variant="secondary" size="sm">← Produtos</LinkButton>} />
      <ProductEditor
        categories={cats}
        initial={{
          title: "",
          slug: "",
          description: "",
          categoryId: cats[0]?.id ?? null,
          status: "draft",
          priceCents: 0,
          compareAtCents: null,
          tags: [],
          isNew: true,
          isFeatured: false,
          option1Name: "Cor",
          option2Name: "Tamanho",
          sizeChart: "",
          seoTitle: "",
          seoDescription: "",
          ydProductId: null,
          sortOrder: 0,
          images: [],
          variants: [],
        }}
      />
    </>
  );
}
