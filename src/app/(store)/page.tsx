import Link from "next/link";
import { BenefitsBar } from "@/components/store/benefits-bar";
import { HeroCarousel } from "@/components/store/hero";
import { ProductGrid } from "@/components/store/product-card";
import type { PricingConfig } from "@/components/store/pricing";
import { getBanners, listProducts, type ProductCard } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getPricing } from "@/lib/pricing-server";

function Section({ title, href, products, pricing, priority = 0 }: { title: string; href: string; products: ProductCard[]; pricing: PricingConfig; priority?: number }) {
  if (!products.length) return null;
  return (
    <section className="mt-12 lg:mt-16">
      <div className="mx-auto mb-6 flex max-w-[1600px] items-end justify-between px-4 lg:px-12">
        <h2 className="font-wide text-lg font-extrabold tracking-[0.12em] uppercase lg:text-2xl">{title}</h2>
        <Link href={href} className="font-wide text-[11px] tracking-[0.18em] uppercase underline underline-offset-4">
          Ver tudo
        </Link>
      </div>
      <div className="mx-auto max-w-[1600px] lg:px-12">
        <ProductGrid products={products} pricing={pricing} priorityCount={priority} center />
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [settings, banners, flaggedNew, newest, ofertas, maisVendidos] = await Promise.all([
    getSettings(),
    getBanners(),
    listProducts({ novidades: true, limit: 8 }),
    listProducts({ sort: "novidades", limit: 8 }),
    listProducts({ ofertas: true, limit: 8 }),
    listProducts({ sort: "mais-vendidos", limit: 8 }),
  ]);
  // Lançamentos: os marcados como novidade primeiro, completando com os mais recentes.
  const novidades = [...flaggedNew, ...newest.filter((p) => !flaggedNew.some((f) => f.id === p.id))].slice(0, flaggedNew.length > 4 ? 8 : 4);
  const pricing = getPricing(settings);
  const { home, brand } = settings;

  return (
    <>
      <HeroCarousel slides={banners} />
      <BenefitsBar benefits={settings.bars.benefits} />

      <Section title={home.newArrivalsTitle} href="/produtos?novidades=1" products={novidades} pricing={pricing} priority={4} />

      {home.showClubRules && (
        <section className="mt-16 bg-cream">
          <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:px-12 lg:py-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.emblemUrl} alt={brand.name} loading="lazy" className="mx-auto w-full max-w-[520px]" />
            <div className="text-center lg:text-left">
              <p className="font-wide text-[11px] tracking-[0.3em] text-brand-2 uppercase">✦ Club rules ✦</p>
              <ol className="mt-6 space-y-4">
                {home.clubRules.map((rule, i) => (
                  <li key={i} className="font-wide text-xl font-extrabold tracking-[0.08em] text-brand-2 uppercase lg:text-[26px] 2xl:text-3xl">
                    <span className="mr-3 text-brand">{String(i + 1).padStart(2, "0")}</span>
                    {rule}
                  </li>
                ))}
              </ol>
              <Link
                href="/produtos"
                className="font-wide mt-8 inline-flex h-12 items-center bg-btn px-8 text-xs font-bold tracking-[0.22em] text-btn-ink uppercase"
              >
                Entrar no clube
              </Link>
            </div>
          </div>
        </section>
      )}

      <Section title={home.saleTitle} href="/produtos?ofertas=1" products={ofertas} pricing={pricing} />
      <Section title={home.bestSellersTitle} href="/produtos?ordem=mais-vendidos" products={maisVendidos} pricing={pricing} />
    </>
  );
}
