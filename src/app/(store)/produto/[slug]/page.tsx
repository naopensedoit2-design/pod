import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BenefitsBar } from "@/components/store/benefits-bar";
import { Breadcrumb } from "@/components/store/listing";
import { ProductGrid } from "@/components/store/product-card";
import { getActiveProductSlugs, getProductBySlug, listProducts, sortSizes } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getPricing } from "@/lib/pricing-server";
import { ProductView } from "./product-view";

export async function generateStaticParams() {
  const slugs = await getActiveProductSlugs(40);
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "produto" }];
}

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Produto não encontrado" };
  const description = p.seoDescription || p.description.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: p.seoTitle || p.title,
    description,
    openGraph: { title: p.title, description, images: p.images[0] ? [p.images[0].url] : undefined },
  };
}

function PdpSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[1.6fr_1fr] lg:px-8">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="aspect-[3/4] animate-pulse bg-neutral-100" />
        <div className="aspect-[3/4] animate-pulse bg-neutral-100" />
      </div>
      <div className="space-y-4">
        <div className="h-5 w-2/3 animate-pulse bg-neutral-100" />
        <div className="h-8 w-1/3 animate-pulse bg-neutral-100" />
        <div className="h-12 w-full animate-pulse bg-neutral-100" />
      </div>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/produto/[slug]">["params"] }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();
  const pricing = getPricing(settings);

  let related = product.category ? await listProducts({ category: product.category.slug, excludeId: product.id, limit: 4 }) : [];
  if (related.length < 4) {
    const more = await listProducts({ sort: "mais-vendidos", excludeId: product.id, limit: 8 });
    related = [...related, ...more.filter((m) => !related.some((r) => r.id === m.id))].slice(0, 4);
  }

  const colors: { name: string; hex: string | null }[] = [];
  for (const v of product.variants) if (v.option1 && !colors.some((c) => c.name === v.option1)) colors.push({ name: v.option1, hex: v.option1Hex });
  const sizes = sortSizes([...new Set(product.variants.map((v) => v.option2).filter(Boolean))]);
  const available = product.variants.some((v) => v.stock === null || v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku || undefined,
    brand: { "@type": "Brand", name: settings.brand.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          ...(product.category ? [{ label: product.category.name, href: `/colecao/${product.category.slug}` }] : []),
          { label: product.title },
        ]}
      />
      <BenefitsBar benefits={settings.bars.benefits} />
      <ProductView
        product={product}
        colors={colors}
        sizes={sizes}
        pricing={pricing}
        sizeChart={product.sizeChart || settings.sizeChartDefault}
      />
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-wide mx-auto mb-6 max-w-[1600px] px-4 text-lg font-extrabold tracking-[0.12em] uppercase lg:px-12">
            Você também vai curtir
          </h2>
          <div className="mx-auto max-w-[1600px] lg:px-12">
            <ProductGrid products={related} pricing={pricing} />
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductPage(props: PageProps<"/produto/[slug]">) {
  return (
    <Suspense fallback={<PdpSkeleton />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}
