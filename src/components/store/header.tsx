import Link from "next/link";
import type { StoreSettings } from "@/lib/settings-schema";
import { cn } from "@/lib/format";
import { CartButton, MobileMenu, SearchButton } from "./header-client";
import { MessageBar, PromoBar } from "./top-bars";

export function StoreHeader({ settings }: { settings: StoreSettings }) {
  const { bars, brand, menu } = settings;
  return (
    <>
      {bars.utilityLinks.length > 0 && (
        <div className="hidden bg-white lg:block">
          <div className="mx-auto flex h-[22px] max-w-[1600px] items-center gap-5 px-12 text-[12px] text-neutral-800">
            {bars.utilityLinks.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="hover:underline">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      {bars.promoEnabled && <PromoBar text={bars.promoText} href={bars.promoHref} endsAt={bars.promoEndsAt} />}
      <MessageBar messages={bars.messages} />

      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90">
        <div className="mx-auto grid h-[68px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 lg:flex lg:h-[82px] lg:px-12">
          <div className="lg:hidden">
            <MobileMenu menu={menu} utilityLinks={bars.utilityLinks} />
          </div>
          <Link href="/" className="justify-self-center lg:mr-10 lg:shrink-0" aria-label={`${brand.name} — página inicial`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logoUrl} alt={brand.name} style={{ height: brand.logoHeight }} className="w-auto max-w-[180px] object-contain" />
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-7" aria-label="Menu principal">
            {menu.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  "font-wide whitespace-nowrap text-[11.5px] tracking-[0.14em] uppercase transition-opacity hover:opacity-60",
                  item.highlight ? "font-bold" : "font-normal",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-3 sm:gap-5 lg:ml-6">
            <SearchButton />
            <Link href="/rastreio" aria-label="Meus pedidos" className="hidden p-1 transition-opacity hover:opacity-60 sm:block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
              </svg>
            </Link>
            <CartButton />
          </div>
        </div>
      </header>
    </>
  );
}
