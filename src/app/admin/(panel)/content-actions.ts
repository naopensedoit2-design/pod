"use server";

import { refresh, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { banners, categories, coupons, pages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { parseBRL, slugify } from "@/lib/format";

type Result = { ok: boolean; message: string } | null;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

// ----------------------------------------------------------------------------- categorias

export async function saveCategoryAction(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const name = str(fd, "name");
  if (name.length < 2) return { ok: false, message: "Informe o nome." };
  const slug = slugify(str(fd, "slug") || name);
  const values = {
    name,
    slug,
    description: str(fd, "description"),
    sortOrder: Number(fd.get("sortOrder")) || 0,
    isActive: bool(fd, "isActive"),
  };
  try {
    if (id) await db.update(categories).set(values).where(eq(categories.id, id));
    else await db.insert(categories).values(values);
  } catch {
    return { ok: false, message: "Já existe uma categoria com esse endereço (slug)." };
  }
  updateTag("categories");
  updateTag("products");
  refresh();
  return { ok: true, message: "Categoria salva." };
}

export async function deleteCategoryAction(id: number) {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  updateTag("categories");
  updateTag("products");
  refresh();
  return { ok: true, message: "Categoria excluída." };
}

// ----------------------------------------------------------------------------- cupons

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, "Código: 3 a 30 letras/números, sem espaços."),
  type: z.enum(["percent", "fixed", "free_shipping"]),
});

export async function saveCouponAction(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const parsed = couponSchema.safeParse({ code: str(fd, "code"), type: str(fd, "type") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { code, type } = parsed.data;
  const rawValue = str(fd, "value");
  const value = type === "percent" ? Math.min(100, Math.max(0, Number.parseInt(rawValue, 10) || 0)) : type === "fixed" ? parseBRL(rawValue) : 0;
  if (type !== "free_shipping" && value <= 0) return { ok: false, message: "Informe o valor do desconto." };
  const date = (k: string) => {
    const v = str(fd, k);
    return v ? new Date(`${v}T${k === "endsAt" ? "23:59:59" : "00:00:00"}-03:00`) : null;
  };
  const maxUses = str(fd, "maxUses");
  const values = {
    code,
    type,
    value,
    minSubtotalCents: parseBRL(str(fd, "minSubtotal")),
    maxUses: maxUses ? Number.parseInt(maxUses, 10) : null,
    startsAt: date("startsAt"),
    endsAt: date("endsAt"),
    isActive: bool(fd, "isActive"),
    description: str(fd, "description"),
  };
  try {
    if (id) await db.update(coupons).set(values).where(eq(coupons.id, id));
    else await db.insert(coupons).values(values);
  } catch {
    return { ok: false, message: "Já existe um cupom com esse código." };
  }
  refresh();
  return { ok: true, message: "Cupom salvo." };
}

export async function deleteCouponAction(id: number) {
  await requireAdmin();
  await db.delete(coupons).where(eq(coupons.id, id));
  refresh();
  return { ok: true, message: "Cupom excluído." };
}

// ----------------------------------------------------------------------------- banners

const bannerSchema = z.object({
  id: z.number().int().optional(),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  ctaLabel: z.string().default(""),
  href: z.string().default(""),
  imageDesktop: z.string().nullable().default(null),
  imageMobile: z.string().nullable().default(null),
  bgColor: z.string().default("#C4252F"),
  textColor: z.string().default("#FFFFFF"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type BannerInput = z.input<typeof bannerSchema>;

export async function saveBannerAction(input: BannerInput): Promise<Result> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const { id, ...values } = parsed.data;
  if (!values.title && !values.imageDesktop && !values.imageMobile) return { ok: false, message: "Informe um título ou envie uma imagem." };
  if (id) await db.update(banners).set(values).where(eq(banners.id, id));
  else await db.insert(banners).values(values);
  updateTag("banners");
  refresh();
  return { ok: true, message: "Banner salvo." };
}

export async function deleteBannerAction(id: number) {
  await requireAdmin();
  await db.delete(banners).where(eq(banners.id, id));
  updateTag("banners");
  refresh();
  return { ok: true, message: "Banner excluído." };
}

// ----------------------------------------------------------------------------- páginas

export async function savePageAction(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const title = str(fd, "title");
  if (title.length < 2) return { ok: false, message: "Informe o título." };
  const values = {
    title,
    slug: slugify(str(fd, "slug") || title),
    body: String(fd.get("body") ?? ""),
    isPublished: bool(fd, "isPublished"),
    showInFooter: bool(fd, "showInFooter"),
    sortOrder: Number(fd.get("sortOrder")) || 0,
    updatedAt: new Date(),
  };
  try {
    if (id) await db.update(pages).set(values).where(eq(pages.id, id));
    else await db.insert(pages).values(values);
  } catch {
    return { ok: false, message: "Já existe uma página com esse endereço." };
  }
  updateTag("pages");
  refresh();
  return { ok: true, message: "Página salva." };
}

export async function deletePageAction(id: number) {
  await requireAdmin();
  await db.delete(pages).where(eq(pages.id, id));
  updateTag("pages");
  refresh();
  return { ok: true, message: "Página excluída." };
}
