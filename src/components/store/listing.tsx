import Link from "next/link";
import { Suspense } from "react";
import type { ProductCard } from "@/lib/catalog";
import { cn } from "@/lib/format";
import { ProductGrid } from "./product-card";
import type { PricingConfig } from "./pricing";
import { SortSelect } from "./sort-select";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Você está em" className="mx-auto max-w-[1600px] px-4 py-3 lg:px-12">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tracking-[0.14em] text-neutral-600 uppercase">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-3">
            {i > 0 && <span className="text-neutral-300">|</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-black">
                {it.label}
              </Link>
            ) : (
              <span className="text-neutral-800">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ListingHeader({
  title,
  description,
  count,
  chips,
}: {
  title: string;
  description?: string;
  count: number;
  chips?: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-6 pb-5 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-wide text-2xl font-extrabold tracking-[0.1em] uppercase lg:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-neutral-600">{description}</p>}
          <p className="mt-1 text-xs text-neutral-500">
            {count} {count === 1 ? "produto" : "produtos"}
          </p>
        </div>
        <Suspense fallback={null}>
          <SortSelect />
        </Suspense>
      </div>
      {chips && chips.length > 0 && (
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
          {chips.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn(
                "font-wide shrink-0 rounded-full border px-4 py-1.5 text-[11px] tracking-[0.12em] uppercase transition",
                c.active ? "border-black bg-black text-white" : "border-neutral-300 hover:border-black",
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListingGrid({ products, pricing }: { products: ProductCard[]; pricing: PricingConfig }) {
  if (!products.length) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-20 text-center lg:px-12">
        <p className="font-wide text-sm tracking-[0.14em] uppercase">Nenhum produto encontrado</p>
        <Link href="/produtos" className="mt-4 inline-block text-sm underline">
          Ver todos os produtos
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[1600px] lg:px-12">
      <ProductGrid products={products} pricing={pricing} priorityCount={4} />
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] lg:px-12">
      <div className="grid grid-cols-2 gap-[3px] lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="pb-6">
            <div className="aspect-[3/4] animate-pulse bg-neutral-100" />
            <div className="mx-auto mt-3 h-3 w-2/3 animate-pulse bg-neutral-100" />
            <div className="mx-auto mt-2 h-3 w-1/2 animate-pulse bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
