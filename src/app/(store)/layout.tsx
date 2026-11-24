import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { HelpButton } from "@/components/store/help-button";
import { TrackingScripts } from "@/components/store/tracking";
import { getCategories, getFooterPages } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getPricing } from "@/lib/pricing-server";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, pages, categories] = await Promise.all([getSettings(), getFooterPages(), getCategories()]);
  const pricing = getPricing(settings);
  return (
    <>
      <StoreHeader settings={settings} />
      <main className="min-h-[50vh]">{children}</main>
      <StoreFooter settings={settings} pages={pages} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      <CartDrawer pricing={pricing} />
      <HelpButton whatsapp={settings.company.whatsapp} storeName={settings.brand.name} />
      <TrackingScripts {...settings.tracking} />
    </>
  );
}
