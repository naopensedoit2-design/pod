import type { Metadata } from "next";
import { Suspense } from "react";
import { BenefitsBar } from "@/components/store/benefits-bar";
import { Breadcrumb, GridSkeleton, ListingGrid, ListingHeader } from "@/components/store/listing";
import { getCategories, listProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getPricing } from "@/lib/pricing-server";

export const metadata: Metadata = { title: "Produtos" };

async function Results({ searchParams }: { searchParams: PageProps<"/produtos">["searchParams"] }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = get("q")?.slice(0, 80);
  const ofertas = get("ofertas") === "1";
  const novidades = get("novidades") === "1";
  const categoria = get("categoria");
  const sort = get("ordem") ?? (novidades ? "novidades" : undefined);

  const [settings, products, categories] = await Promise.all([
    getSettings(),
    listProducts({ q, ofertas, novidades, sort, category: categoria }),
    getCategories(),
  ]);
  const title = q ? `Busca: “${q}”` : ofertas ? settings.home.saleTitle : novidades ? settings.home.newArrivalsTitle : "Ver tudo";
  const chips = [
    { label: "Tudo", href: "/produtos", active: !ofertas && !novidades && !categoria && !q },
    { label: "Lançamentos", href: "/produtos?novidades=1", active: novidades },
    { label: "Ofertas", href: "/produtos?ofertas=1", active: ofertas },
    ...categories.map((c) => ({ label: c.name, href: `/colecao/${c.slug}`, active: categoria === c.slug })),
  ];
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />
      <ListingHeader title={title} count={products.length} chips={chips} />
      <ListingGrid products={products} pricing={getPricing(settings)} />
    </>
  );
}

export default async function ProductsPage(props: PageProps<"/produtos">) {
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
        <Results searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
