import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, gt, ilike, isNotNull, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { banners, categories, pages, productImages, products, variants } from "@/db/schema";

export type ProductCard = {
  id: number;
  slug: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  tags: string[];
  isNew: boolean;
  image: string | null;
  image2: string | null;
  colors: { name: string; hex: string | null }[];
  soldOut: boolean;
};

export type ListOptions = {
  category?: string;
  sort?: string;
  q?: string;
  ofertas?: boolean;
  novidades?: boolean;
  destaques?: boolean;
  limit?: number;
  excludeId?: number;
};

export { sortSizes } from "./sizes";

type CardRow = typeof products.$inferSelect & {
  images: { url: string }[];
  variants: { option1: string; option1Hex: string | null; stock: number | null }[];
};

function toCard(p: CardRow): ProductCard {
  const colors: ProductCard["colors"] = [];
  for (const v of p.variants) {
    if (v.option1 && !colors.some((c) => c.name === v.option1)) colors.push({ name: v.option1, hex: v.option1Hex });
  }
  const soldOut = p.variants.length > 0 && p.variants.every((v) => v.stock !== null && v.stock <= 0);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    tags: p.tags,
    isNew: p.isNew,
    image: p.images[0]?.url ?? null,
    image2: p.images[1]?.url ?? null,
    colors,
    soldOut,
  };
}

export async function listProducts(opts: ListOptions = {}): Promise<ProductCard[]> {
  "use cache";
  cacheTag("products");
  cacheLife("max");

  const where: SQL[] = [eq(products.status, "active")];
  if (opts.category) {
    const cat = await db.query.categories.findFirst({ where: eq(categories.slug, opts.category) });
    if (!cat) return [];
    where.push(eq(products.categoryId, cat.id));
  }
  if (opts.ofertas) where.push(and(isNotNull(products.compareAtCents), gt(products.compareAtCents, products.priceCents))!);
  if (opts.novidades) where.push(eq(products.isNew, true));
  if (opts.destaques) where.push(eq(products.isFeatured, true));
  if (opts.excludeId) where.push(ne(products.id, opts.excludeId));
  if (opts.q) {
    const term = `%${opts.q.trim()}%`;
    where.push(or(ilike(products.title, term), ilike(products.description, term), sql`array_to_string(${products.tags}, ' ') ilike ${term}`)!);
  }

  let orderBy;
  switch (opts.sort) {
    case "menor-preco":
      orderBy = [asc(products.priceCents)];
      break;
    case "maior-preco":
      orderBy = [desc(products.priceCents)];
      break;
    case "novidades":
      orderBy = [desc(products.createdAt)];
      break;
    case "mais-vendidos":
      orderBy = [desc(products.salesCount), desc(products.isFeatured), asc(products.sortOrder)];
      break;
    default:
      orderBy = [asc(products.sortOrder), desc(products.isFeatured), desc(products.createdAt)];
  }

  const rows = await db.query.products.findMany({
    where: and(...where),
    orderBy,
    limit: opts.limit ?? 120,
    with: {
      images: { columns: { url: true }, orderBy: [asc(productImages.sortOrder), asc(productImages.id)], limit: 2 },
      variants: {
        columns: { option1: true, option1Hex: true, stock: true },
        where: eq(variants.isActive, true),
        orderBy: [asc(variants.sortOrder), asc(variants.id)],
      },
    },
  });
  return rows.map(toCard);
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag("products");
  cacheLife("max");

  const p = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.status, "active")),
    with: {
      category: true,
      images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)] },
      variants: {
        where: eq(variants.isActive, true),
        orderBy: [asc(variants.sortOrder), asc(variants.id)],
      },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    tags: p.tags,
    isNew: p.isNew,
    option1Name: p.option1Name,
    option2Name: p.option2Name,
    sizeChart: p.sizeChart,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, color: i.color })),
    variants: p.variants.map((v) => ({
      id: v.id,
      option1: v.option1,
      option1Hex: v.option1Hex,
      option2: v.option2,
      priceCents: v.priceCents ?? p.priceCents,
      stock: v.stock,
      sku: v.sku,
    })),
  };
}

export async function getActiveProductSlugs(limit = 40): Promise<string[]> {
  "use cache";
  cacheTag("products");
  cacheLife("max");
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.status, "active"))
    .orderBy(desc(products.salesCount), asc(products.sortOrder))
    .limit(limit);
  return rows.map((r) => r.slug);
}

export async function getCategories() {
  "use cache";
  cacheTag("categories");
  cacheLife("max");
  return db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheTag("categories");
  cacheLife("max");
  const c = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });
  return c ?? null;
}

export async function getBanners() {
  "use cache";
  cacheTag("banners");
  cacheLife("max");
  return db.query.banners.findMany({
    where: eq(banners.isActive, true),
    orderBy: [asc(banners.sortOrder), asc(banners.id)],
  });
}

export async function getFooterPages() {
  "use cache";
  cacheTag("pages");
  cacheLife("max");
  return db
    .select({ slug: pages.slug, title: pages.title })
    .from(pages)
    .where(and(eq(pages.isPublished, true), eq(pages.showInFooter, true)))
    .orderBy(asc(pages.sortOrder), asc(pages.title));
}

export async function getPage(slug: string) {
  "use cache";
  cacheTag("pages");
  cacheLife("max");
  const p = await db.query.pages.findFirst({ where: and(eq(pages.slug, slug), eq(pages.isPublished, true)) });
  return p ?? null;
}

export async function getPageSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("pages");
  cacheLife("max");
  const rows = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.isPublished, true));
  return rows.map((r) => r.slug);
}

export async function getCategorySlugs(): Promise<string[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("max");
  const rows = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.isActive, true));
  return rows.map((r) => r.slug);
}
