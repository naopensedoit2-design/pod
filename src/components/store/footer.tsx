import Link from "next/link";
import type { StoreSettings } from "@/lib/settings-schema";
import { onlyDigits } from "@/lib/format";
import { NewsletterForm } from "./newsletter-form";

export function StoreFooter({
  settings,
  pages,
  categories,
}: {
  settings: StoreSettings;
  pages: { slug: string; title: string }[];
  categories: { slug: string; name: string }[];
}) {
  const { brand, company, home } = settings;
  const wa = onlyDigits(company.whatsapp);
  return (
    <footer className="mt-16 bg-black text-neutral-300">
      <section id="membros" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1600px] items-center gap-6 px-5 py-12 lg:grid-cols-2 lg:px-12">
          <div>
            <p className="font-wide text-[11px] tracking-[0.3em] text-brand uppercase">✦ Members only ✦</p>
            <h2 className="font-wide mt-2 text-2xl font-extrabold tracking-wide text-white uppercase lg:text-3xl">{home.newsletterTitle}</h2>
            <p className="mt-2 max-w-md text-sm text-neutral-400">{home.newsletterText}</p>
          </div>
          <div className="lg:justify-self-end lg:w-[440px]">
            <NewsletterForm dark source="footer" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-12">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoDarkUrl} alt={brand.name} className="h-14 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-neutral-400">{brand.tagline}</p>
        </div>
        <div>
          <h3 className="font-wide mb-4 text-[11px] font-bold tracking-[0.2em] text-white uppercase">Loja</h3>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/colecao/${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/produtos?novidades=1" className="hover:text-white">
                Lançamentos
              </Link>
            </li>
            <li>
              <Link href="/produtos" className="hover:text-white">
                Ver tudo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-wide mb-4 text-[11px] font-bold tracking-[0.2em] text-white uppercase">Ajuda</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/rastreio" className="hover:text-white">
                Rastreie seu pedido
              </Link>
            </li>
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={`/p/${p.slug}`} className="hover:text-white">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-wide mb-4 text-[11px] font-bold tracking-[0.2em] text-white uppercase">Atendimento</h3>
          <ul className="space-y-2 text-sm">
            {wa && (
              <li>
                <a href={`https://wa.me/${wa.startsWith("55") ? wa : `55${wa}`}`} target="_blank" rel="noreferrer" className="hover:text-white">
                  WhatsApp
                </a>
              </li>
            )}
            {company.email && (
              <li>
                <a href={`mailto:${company.email}`} className="hover:text-white">
                  {company.email}
                </a>
              </li>
            )}
            {company.supportHours && <li className="text-neutral-500">{company.supportHours}</li>}
            {company.instagram && (
              <li>
                <a href={`https://instagram.com/${company.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="hover:text-white">
                  Instagram
                </a>
              </li>
            )}
            {company.tiktok && (
              <li>
                <a href={`https://tiktok.com/@${company.tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="hover:text-white">
                  TikTok
                </a>
              </li>
            )}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-bold tracking-wider uppercase">
            {["Pix", "Visa", "Master", "Elo", "Amex"].map((m) => (
              <span key={m} className="rounded border border-white/20 px-2 py-1 text-neutral-400">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1600px] px-5 py-5 text-[11px] leading-relaxed text-neutral-500 lg:px-12">
          {brand.name}
          {company.legalName && ` · ${company.legalName}`}
          {company.document && ` · CNPJ/CPF ${company.document}`}
          {company.address && ` · ${company.address}`}
          {company.email && ` · ${company.email}`}
          <span className="block sm:inline sm:before:content-['_·_']">Pagamentos processados com segurança pela InfinitePay.</span>
        </div>
      </div>
    </footer>
  );
}
