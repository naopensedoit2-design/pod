"use client";

import { useState, useTransition } from "react";
import { ActionButton, CopyButton } from "@/components/admin/action-button";
import { ImageField } from "@/components/admin/image-upload";
import { Card, Field, Notice, buttonClass, inputClass } from "@/components/admin/ui";
import { centsToInput, cn, parseBRL } from "@/lib/format";
import { defaultSettings, type StoreSettings } from "@/lib/settings-schema";
import { saveSettingsAction, testEmailAction, testYouDrawAction } from "./actions";

type Env = {
  infinitepayApiKey: boolean;
  infinitepayHandleEnv: string;
  youdraw: boolean;
  youdrawWebhook: boolean;
  email: boolean;
  cron: boolean;
  testMode: boolean;
};

const TABS = [
  { id: "marca", label: "Marca e cores" },
  { id: "menu", label: "Menu e faixas" },
  { id: "home", label: "Página inicial" },
  { id: "vendas", label: "Vendas e frete" },
  { id: "integracoes", label: "Integrações" },
  { id: "empresa", label: "Empresa" },
  { id: "seo", label: "SEO e pixels" },
] as const;

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return parts.replace(" ", "T");
}

function StringList({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} placeholder={placeholder} className={inputClass} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-2 text-neutral-400 hover:text-red-600" aria-label="Remover">
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ""])} className="text-xs underline">
        + adicionar
      </button>
    </div>
  );
}

export function SettingsForm({ initial, env, baseUrl }: { initial: StoreSettings; env: Env; baseUrl: string }) {
  const [s, setS] = useState<StoreSettings>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("marca");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  function patch<K extends keyof StoreSettings>(section: K, value: Partial<StoreSettings[K]>) {
    setS((prev) => ({ ...prev, [section]: { ...(prev[section] as object), ...(value as object) } }));
  }

  function save() {
    setMsg(null);
    start(async () => setMsg(await saveSettingsAction(s)));
  }

  const color = (key: keyof StoreSettings["theme"], label: string) => (
    <Field label={label}>
      <div className="flex gap-2">
        <input type="color" value={s.theme[key]} onChange={(e) => patch("theme", { [key]: e.target.value })} className="h-10 w-12 cursor-pointer rounded border" />
        <input value={s.theme[key]} onChange={(e) => patch("theme", { [key]: e.target.value })} className={inputClass} />
      </div>
    </Field>
  );

  return (
    <div className="pb-24">
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition",
              tab === t.id ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "marca" && (
        <div className="space-y-6">
          <Card title="Identidade">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da loja">
                <input value={s.brand.name} onChange={(e) => patch("brand", { name: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Frase da marca (rodapé)">
                <input value={s.brand.tagline} onChange={(e) => patch("brand", { tagline: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ImageField label="Logo principal (cabeçalho, fundo claro)" hint="SVG ou PNG transparente." value={s.brand.logoUrl} onChange={(v) => patch("brand", { logoUrl: v ?? defaultSettings.brand.logoUrl })} />
              <ImageField label="Logo para fundo escuro (rodapé)" value={s.brand.logoDarkUrl} onChange={(v) => patch("brand", { logoDarkUrl: v ?? defaultSettings.brand.logoDarkUrl })} previewClass="h-24 bg-black" />
              <ImageField label="Emblema (seção “regras do clube” e compartilhamento)" value={s.brand.emblemUrl} onChange={(v) => patch("brand", { emblemUrl: v ?? defaultSettings.brand.emblemUrl })} />
              <ImageField label="Ícone do site (favicon)" hint="Quadrado, 512×512." value={s.brand.faviconUrl} onChange={(v) => patch("brand", { faviconUrl: v ?? defaultSettings.brand.faviconUrl })} />
            </div>
            <Field label="Altura do logo no cabeçalho (px)" className="mt-4 w-48">
              <input type="number" min={20} max={120} value={s.brand.logoHeight} onChange={(e) => patch("brand", { logoHeight: Number(e.target.value) || 46 })} className={inputClass} />
            </Field>
          </Card>
          <Card title="Cores" actions={<button type="button" className="text-xs underline" onClick={() => setS((p) => ({ ...p, theme: defaultSettings.theme }))}>Restaurar padrão</button>}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {color("primary", "Principal (promo, selos)")}
              {color("secondary", "Secundária")}
              {color("accent", "Destaque / creme")}
              {color("surface", "Fundo do cabeçalho")}
              {color("background", "Fundo da página")}
              {color("text", "Texto")}
              {color("button", "Botão")}
              {color("buttonText", "Texto do botão")}
            </div>
          </Card>
        </div>
      )}

      {tab === "menu" && (
        <div className="space-y-6">
          <Card title="Menu principal">
            <div className="space-y-2">
              {s.menu.map((m, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <input value={m.label} onChange={(e) => setS((p) => ({ ...p, menu: p.menu.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} placeholder="Rótulo" className={inputClass} />
                  <input value={m.href} onChange={(e) => setS((p) => ({ ...p, menu: p.menu.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) }))} placeholder="/colecao/camisetas" className={inputClass} />
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={m.highlight} onChange={(e) => setS((p) => ({ ...p, menu: p.menu.map((x, j) => (j === i ? { ...x, highlight: e.target.checked } : x)) }))} /> negrito
                  </label>
                  <div className="flex gap-1">
                    <button type="button" className="px-2 text-neutral-500" onClick={() => setS((p) => { const menu = [...p.menu]; if (i > 0) [menu[i - 1], menu[i]] = [menu[i], menu[i - 1]]; return { ...p, menu }; })} aria-label="Subir">↑</button>
                    <button type="button" className="px-2 text-neutral-400 hover:text-red-600" onClick={() => setS((p) => ({ ...p, menu: p.menu.filter((_, j) => j !== i) }))} aria-label="Remover">×</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setS((p) => ({ ...p, menu: [...p.menu, { label: "", href: "/", highlight: false }] }))} className="text-xs underline">
                + adicionar item
              </button>
            </div>
            <p className="mt-3 text-xs text-neutral-500">Links úteis: /produtos · /produtos?novidades=1 · /produtos?ofertas=1 · /produtos?ordem=mais-vendidos · /colecao/slug-da-categoria · /p/slug-da-pagina</p>
          </Card>
          <Card title="Faixa de promoção (vermelha, com contagem regressiva)">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={s.bars.promoEnabled} onChange={(e) => patch("bars", { promoEnabled: e.target.checked })} /> Mostrar faixa
              </label>
              <Field label="Texto" className="sm:col-span-2">
                <input value={s.bars.promoText} onChange={(e) => patch("bars", { promoText: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Link">
                <input value={s.bars.promoHref} onChange={(e) => patch("bars", { promoHref: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Termina em (horário de Brasília)" hint="A contagem some quando o prazo acaba.">
                <input
                  type="datetime-local"
                  value={toLocalInput(s.bars.promoEndsAt)}
                  onChange={(e) => patch("bars", { promoEndsAt: e.target.value ? `${e.target.value}:00-03:00` : s.bars.promoEndsAt })}
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Mensagens da faixa preta (alternam)">
              <StringList value={s.bars.messages} onChange={(v) => patch("bars", { messages: v })} placeholder="Frete grátis acima de R$ 299" />
            </Card>
            <Card title="Links do topo (desktop)">
              <div className="space-y-2">
                {s.bars.utilityLinks.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={l.label} onChange={(e) => patch("bars", { utilityLinks: s.bars.utilityLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={inputClass} />
                    <input value={l.href} onChange={(e) => patch("bars", { utilityLinks: s.bars.utilityLinks.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) })} className={inputClass} />
                    <button type="button" className="px-2 text-neutral-400 hover:text-red-600" onClick={() => patch("bars", { utilityLinks: s.bars.utilityLinks.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="text-xs underline" onClick={() => patch("bars", { utilityLinks: [...s.bars.utilityLinks, { label: "", href: "/" }] })}>
                  + adicionar
                </button>
              </div>
            </Card>
          </div>
          <Card title="Faixa de benefícios (borda preta)">
            <div className="space-y-2">
              {s.bars.benefits.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input value={b.strong} onChange={(e) => patch("bars", { benefits: s.bars.benefits.map((x, j) => (j === i ? { ...x, strong: e.target.value } : x)) })} placeholder="Parte em negrito" className={inputClass} />
                  <input value={b.text} onChange={(e) => patch("bars", { benefits: s.bars.benefits.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} placeholder="complemento" className={inputClass} />
                  <button type="button" className="px-2 text-neutral-400 hover:text-red-600" onClick={() => patch("bars", { benefits: s.bars.benefits.filter((_, j) => j !== i) })}>×</button>
                </div>
              ))}
              <button type="button" className="text-xs underline" onClick={() => patch("bars", { benefits: [...s.bars.benefits, { strong: "", text: "" }] })}>
                + adicionar
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === "home" && (
        <div className="space-y-6">
          <Card title="Seções">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Título — lançamentos">
                <input value={s.home.newArrivalsTitle} onChange={(e) => patch("home", { newArrivalsTitle: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Título — ofertas">
                <input value={s.home.saleTitle} onChange={(e) => patch("home", { saleTitle: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Título — mais vendidos">
                <input value={s.home.bestSellersTitle} onChange={(e) => patch("home", { bestSellersTitle: e.target.value })} className={inputClass} />
              </Field>
            </div>
          </Card>
          <Card title="Bloco da marca (emblema + regras)">
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.home.showClubRules} onChange={(e) => patch("home", { showClubRules: e.target.checked })} /> Mostrar na página inicial
            </label>
            <StringList value={s.home.clubRules} onChange={(v) => patch("home", { clubRules: v })} placeholder="Dress code: none." />
          </Card>
          <Card title="Captura de e-mails (rodapé)">
            <div className="grid gap-4">
              <Field label="Título">
                <input value={s.home.newsletterTitle} onChange={(e) => patch("home", { newsletterTitle: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Texto" hint="Combine com o cupom de boas-vindas da aba Vendas.">
                <textarea value={s.home.newsletterText} onChange={(e) => patch("home", { newsletterText: e.target.value })} rows={2} className={inputClass} />
              </Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "vendas" && (
        <div className="space-y-6">
          <Card title="Pagamento">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Desconto no Pix (%)" hint={env.infinitepayApiKey ? "Aplicado no checkout da InfinitePay." : "Só é aplicado com a API Key da InfinitePay."}>
                <input type="number" min={0} max={50} step="0.5" value={s.sales.pixDiscountPercent} onChange={(e) => patch("sales", { pixDiscountPercent: Number(e.target.value) || 0 })} className={inputClass} />
              </Field>
              <Field label="Parcelas sem juros" hint="A loja absorve a taxa até aqui.">
                <input type="number" min={1} max={12} value={s.sales.installmentsNoInterest} onChange={(e) => patch("sales", { installmentsNoInterest: Number(e.target.value) || 1 })} className={inputClass} />
              </Field>
              <Field label="Máximo de parcelas">
                <input type="number" min={1} max={12} value={s.sales.maxInstallments} onChange={(e) => patch("sales", { maxInstallments: Number(e.target.value) || 1 })} className={inputClass} />
              </Field>
            </div>
          </Card>
          <Card title="Frete">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Frete grátis a partir de (R$)" hint="0 = desligado. A loja paga o frete da YouDraw nesses pedidos.">
                <input value={centsToInput(s.sales.freeShippingThresholdCents)} onChange={(e) => patch("sales", { freeShippingThresholdCents: parseBRL(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Dias de produção somados ao prazo" hint="Somado ao prazo de entrega da YouDraw.">
                <input type="number" min={0} value={s.sales.extraProductionDays} onChange={(e) => patch("sales", { extraProductionDays: Number(e.target.value) || 0 })} className={inputClass} />
              </Field>
              <Field label="Frete fixo (R$)" hint="Usado quando o produto não está ligado à YouDraw.">
                <input value={centsToInput(s.sales.flatShippingCents)} onChange={(e) => patch("sales", { flatShippingCents: parseBRL(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Prazo do frete fixo (dias úteis)">
                <input type="number" min={1} value={s.sales.flatShippingDays} onChange={(e) => patch("sales", { flatShippingDays: Number(e.target.value) || 1 })} className={inputClass} />
              </Field>
            </div>
          </Card>
          <Card title="Retenção (cupons automáticos)">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cupom de boas-vindas" hint="Mostrado e enviado por e-mail a quem se cadastra. Crie-o em Cupons.">
                <input value={s.sales.welcomeCouponCode} onChange={(e) => patch("sales", { welcomeCouponCode: e.target.value.toUpperCase() })} className={inputClass} />
              </Field>
              <Field label="Cupom de recompra" hint="Enviado no e-mail de pedido entregue.">
                <input value={s.sales.thankYouCouponCode} onChange={(e) => patch("sales", { thankYouCouponCode: e.target.value.toUpperCase() })} className={inputClass} />
              </Field>
            </div>
          </Card>
          <Card title="Tabela de medidas padrão">
            <textarea value={s.sizeChartDefault} onChange={(e) => setS((p) => ({ ...p, sizeChartDefault: e.target.value }))} rows={7} className={cn(inputClass, "font-mono text-xs")} />
          </Card>
        </div>
      )}

      {tab === "integracoes" && (
        <div className="space-y-6">
          <Card title="InfinitePay (pagamentos)">
            <div className="space-y-4">
              <Field label="InfiniteTag (handle, sem o $)" hint={env.infinitepayHandleEnv ? `Também definida por variável de ambiente: ${env.infinitepayHandleEnv}` : "Encontre no app InfinitePay. Ative “Checkout integrado” nas configurações do checkout."}>
                <input value={s.integrations.infinitepayHandle} onChange={(e) => patch("integrations", { infinitepayHandle: e.target.value.replace(/^\$/, "").trim() })} className={inputClass} />
              </Field>
              <ul className="space-y-1 text-sm">
                <li>{env.infinitepayApiKey ? "✅" : "⚪"} API Key (INFINITEPAY_API_KEY) — habilita desconto no Pix, parcelas sem juros e link de uso único.</li>
                {env.testMode && <li>🧪 Modo de teste ligado (PAYMENTS_TEST_MODE): sem InfinitePay configurada, os pagamentos são simulados.</li>}
              </ul>
              <p className="text-xs text-neutral-500">O webhook e o retorno do pagamento são enviados automaticamente em cada link — não é preciso cadastrar nada na InfinitePay.</p>
            </div>
          </Card>
          <Card title="YouDraw (produção e envio)">
            <div className="space-y-4 text-sm">
              <ul className="space-y-1">
                <li>{env.youdraw ? "✅" : "⚪"} Chave da API (YOUDRAW_API_KEY)</li>
                <li>{env.youdrawWebhook ? "✅" : "⚪"} Segredo do webhook (YOUDRAW_WEBHOOK_SECRET)</li>
                <li>{env.cron ? "✅" : "⚪"} Reconciliação diária (CRON_SECRET)</li>
              </ul>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-700">URL do webhook para cadastrar na YouDraw (Menu da conta → API → Webhooks)</p>
                <div className="flex gap-2">
                  <input readOnly value={`${baseUrl}/api/webhooks/youdraw`} className={inputClass} />
                  <CopyButton text={`${baseUrl}/api/webhooks/youdraw`} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">Eventos: order.status_changed, order.tracking_updated, payment.paid, payment.expired. Canal: api.</p>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.integrations.youdrawAutoSubmit} onChange={(e) => patch("integrations", { youdrawAutoSubmit: e.target.checked })} /> Enviar pedidos pagos para a YouDraw automaticamente
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.integrations.youdrawAutoPix} onChange={(e) => patch("integrations", { youdrawAutoPix: e.target.checked })} /> Gerar o Pix da produção automaticamente (exige liberação da YouDraw)
              </label>
              <Field label="Multiplicador de preço na importação" hint="Preço sugerido = custo × multiplicador, terminando em ,90." className="w-64">
                <input type="number" step="0.1" min={1} max={10} value={s.integrations.defaultMarkup} onChange={(e) => patch("integrations", { defaultMarkup: Number(e.target.value) || 2 })} className={inputClass} />
              </Field>
              <ActionButton action={testYouDrawAction}>Testar conexão com a YouDraw</ActionButton>
            </div>
          </Card>
          <Card title="E-mails">
            <p className="mb-3 text-sm">{env.email ? "✅ Envio configurado." : "⚪ Configure RESEND_API_KEY (recomendado) ou SMTP_URL, e EMAIL_FROM."}</p>
            <ActionButton action={testEmailAction}>Enviar e-mail de teste</ActionButton>
          </Card>
        </div>
      )}

      {tab === "empresa" && (
        <Card title="Dados da empresa e atendimento">
          <Notice tone="blue">Pelo Decreto 7.962/2013, a loja precisa exibir razão social/nome, CNPJ ou CPF, endereço e contato. Esses dados aparecem no rodapé e nos e-mails.</Notice>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Razão social / nome">
              <input value={s.company.legalName} onChange={(e) => patch("company", { legalName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="CNPJ ou CPF">
              <input value={s.company.document} onChange={(e) => patch("company", { document: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Endereço" className="sm:col-span-2">
              <input value={s.company.address} onChange={(e) => patch("company", { address: e.target.value })} className={inputClass} />
            </Field>
            <Field label="E-mail de atendimento" hint="Também recebe os avisos de novos pedidos (se ADMIN_NOTIFY_EMAIL não estiver definido).">
              <input type="email" value={s.company.email} onChange={(e) => patch("company", { email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="WhatsApp (com DDD)" hint="Ativa o botão “Ajuda”.">
              <input value={s.company.whatsapp} onChange={(e) => patch("company", { whatsapp: e.target.value })} placeholder="(11) 99999-9999" className={inputClass} />
            </Field>
            <Field label="Instagram (@)">
              <input value={s.company.instagram} onChange={(e) => patch("company", { instagram: e.target.value })} className={inputClass} />
            </Field>
            <Field label="TikTok (@)">
              <input value={s.company.tiktok} onChange={(e) => patch("company", { tiktok: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Horário de atendimento">
              <input value={s.company.supportHours} onChange={(e) => patch("company", { supportHours: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Card>
      )}

      {tab === "seo" && (
        <div className="space-y-6">
          <Card title="Google e compartilhamento">
            <div className="grid gap-4">
              <Field label="Título do site">
                <input value={s.seo.title} onChange={(e) => patch("seo", { title: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Descrição">
                <textarea value={s.seo.description} onChange={(e) => patch("seo", { description: e.target.value })} rows={2} className={inputClass} />
              </Field>
              <ImageField label="Imagem de compartilhamento (1200×630)" value={s.seo.ogImageUrl || null} onChange={(v) => patch("seo", { ogImageUrl: v ?? "" })} />
            </div>
          </Card>
          <Card title="Pixels de anúncios">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Meta (Facebook/Instagram) Pixel ID">
                <input value={s.tracking.metaPixelId} onChange={(e) => patch("tracking", { metaPixelId: e.target.value.trim() })} className={inputClass} />
              </Field>
              <Field label="Google Analytics 4 (G-XXXX)">
                <input value={s.tracking.ga4Id} onChange={(e) => patch("tracking", { ga4Id: e.target.value.trim() })} className={inputClass} />
              </Field>
              <Field label="TikTok Pixel ID">
                <input value={s.tracking.tiktokPixelId} onChange={(e) => patch("tracking", { tiktokPixelId: e.target.value.trim() })} className={inputClass} />
              </Field>
            </div>
            <p className="mt-3 text-xs text-neutral-500">Eventos enviados: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase e Lead.</p>
          </Card>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <span className={cn("text-sm", msg ? (msg.ok ? "text-emerald-700" : "text-red-600") : "text-neutral-500")}>{msg?.message ?? "As alterações valem para a loja inteira."}</span>
          <button type="button" onClick={save} disabled={pending} className={buttonClass("primary")}>
            {pending ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}
