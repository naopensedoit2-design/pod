import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BenefitsBar } from "@/components/store/benefits-bar";
import { Breadcrumb, GridSkeleton, ListingGrid, ListingHeader } from "@/components/store/listing";
import { getCategories, getCategoryBySlug, getCategorySlugs, listProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getPricing } from "@/lib/pricing-server";

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "camisetas" }];
}

export async function generateMetadata({ params }: PageProps<"/colecao/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return { title: cat?.name ?? "Coleção", description: cat?.description || undefined };
}

async function Collection({ params, searchParams }: PageProps<"/colecao/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = typeof sp.ordem === "string" ? sp.ordem : undefined;
  const [cat, settings, categories] = await Promise.all([getCategoryBySlug(slug), getSettings(), getCategories()]);
  if (!cat) notFound();
  const products = await listProducts({ category: slug, sort });
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: cat.name }]} />
      <ListingHeader
        title={cat.name}
        description={cat.description}
        count={products.length}
        chips={[
          { label: "Tudo", href: "/produtos", active: false },
          ...categories.map((c) => ({ label: c.name, href: `/colecao/${c.slug}`, active: c.slug === slug })),
        ]}
      />
      <ListingGrid products={products} pricing={getPricing(settings)} />
    </>
  );
}

export default async function CollectionPage(props: PageProps<"/colecao/[slug]">) {
  const settings = await getSettings();
  return (
    <>
      <BenefitsBar benefits={settings.bars.benefits} />
      <Suspense
        fallback={
          <div className="pt-24">
            <GridSkeleton />
          </div>
        }
      >
        <Collection {...props} />
      </Suspense>
    </>
  );
}
