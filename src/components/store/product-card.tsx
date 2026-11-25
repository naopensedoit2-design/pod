import Link from "next/link";
import type { ProductCard as Card } from "@/lib/catalog";
import { discountPercent, formatBRL } from "@/lib/format";
import { priceLines, type PricingConfig } from "./pricing";
import { ProductImage } from "./product-image";

/** Grades de produto: 2 colunas no celular, 4 a partir de 1024px. */
const CARD_SIZES = "(min-width: 1024px) 25vw, 50vw";

export function Badge({ children, tone = "black" }: { children: React.ReactNode; tone?: "black" | "brand" | "white" }) {
  const tones = {
    black: "bg-black text-white",
    brand: "bg-brand text-white ring-1 ring-white",
    white: "bg-white text-black ring-1 ring-black",
  };
  return (
    <span className={`inline-flex h-[22px] items-center rounded-full px-3 text-[10px] leading-none font-extrabold tracking-[0.04em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ProductBadges({ product, size = "card" }: { product: Pick<Card, "priceCents" | "compareAtCents" | "tags" | "isNew" | "soldOut">; size?: "card" | "pdp" }) {
  const off = discountPercent(product.priceCents, product.compareAtCents);
  return (
    <div className={size === "card" ? "flex flex-col items-start gap-1.5" : "flex flex-wrap items-center gap-2"}>
      {product.soldOut && <Badge tone="white">Esgotado</Badge>}
      {off > 0 && size === "card" && <Badge>{off}% off</Badge>}
      {product.tags.map((t) => (
        <Badge key={t} tone="brand">
          {t}
        </Badge>
      ))}
      {product.isNew && <Badge>Lançamento</Badge>}
      {off > 0 && size === "pdp" && <Badge>{off}% off</Badge>}
    </div>
  );
}

export function ProductCard({ product, pricing, priority = false }: { product: Card; pricing: PricingConfig; priority?: boolean }) {
  const p = priceLines(product.priceCents, pricing);
  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#ECE9E4]">
        {product.image && (
          <ProductImage
            src={product.image}
            alt={product.title}
            sizes={CARD_SIZES}
            eager={priority}
            className="transition duration-500 group-hover:scale-[1.02]"
          />
        )}
        {product.image2 && (
          <ProductImage
            src={product.image2}
            alt=""
            decorative
            sizes={CARD_SIZES}
            className="bg-[#ECE9E4] opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute top-3 left-3">
          <ProductBadges product={product} />
        </div>
      </div>
      <div className="px-2 pt-3 pb-6 text-center">
        <h3 className="text-[14px] font-medium sm:text-[15px]">{product.title}</h3>
        <p className="mt-0.5 text-[13px] sm:text-[14px]">
          {product.compareAtCents && product.compareAtCents > product.priceCents && (
            <s className="mr-1.5 text-neutral-500">{formatBRL(product.compareAtCents)}</s>
          )}
          <strong>
            {formatBRL(p.hasPix ? p.pix : product.priceCents)}
            {p.hasPix && " no pix"}
          </strong>
        </p>
        <p className="text-[12px] text-neutral-500">{p.installmentLabel}</p>
        {product.colors.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5" aria-label={`${product.colors.length} cores`}>
            {product.colors.slice(0, 5).map((c) => (
              <span key={c.name} title={c.name} className="h-3 w-3 rounded-full ring-1 ring-black/15" style={{ background: c.hex ?? "#ddd" }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  pricing,
  priorityCount = 0,
  center = false,
}: {
  products: Card[];
  pricing: PricingConfig;
  priorityCount?: number;
  center?: boolean;
}) {
  if (center) {
    // Seções da home: centraliza quando há menos itens que colunas.
    return (
      <div className="flex flex-wrap justify-center">
        {products.map((p, i) => (
          <div key={p.id} className="w-1/2 px-[1.5px] lg:w-1/4">
            <ProductCard product={p} pricing={pricing} priority={i < priorityCount} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-[3px] lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} pricing={pricing} priority={i < priorityCount} />
      ))}
    </div>
  );
}
