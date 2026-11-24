import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Cor inválida");

export const menuItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  highlight: z.boolean().default(false),
});

export const benefitSchema = z.object({
  strong: z.string().default(""),
  text: z.string().default(""),
});

export const settingsSchema = z.object({
  brand: z
    .object({
      name: z.string().default("LENTO"),
      tagline: z.string().default("Social Club · Est. 2026 · Brasil"),
      logoUrl: z.string().default("/brand/lento-logo.svg"),
      logoDarkUrl: z.string().default("/brand/lento-logo-cream.svg"),
      emblemUrl: z.string().default("/brand/lento-emblem.png"),
      faviconUrl: z.string().default("/brand/favicon.svg"),
      logoHeight: z.number().int().min(20).max(120).default(46),
    })
    .prefault({}),
  theme: z
    .object({
      primary: hex.default("#C4252F"),
      secondary: hex.default("#1F3D9C"),
      accent: hex.default("#F1E9D8"),
      background: hex.default("#FFFFFF"),
      surface: hex.default("#F4EFE6"),
      text: hex.default("#111111"),
      button: hex.default("#111111"),
      buttonText: hex.default("#FFFFFF"),
    })
    .prefault({}),
  menu: z
    .array(menuItemSchema)
    .default([
      { label: "Black até 40% off", href: "/produtos?ofertas=1", highlight: true },
      { label: "Mais vendidos", href: "/produtos?ordem=mais-vendidos", highlight: false },
      { label: "Camisetas", href: "/colecao/camisetas", highlight: false },
      { label: "Acessórios", href: "/colecao/acessorios", highlight: false },
      { label: "Ver tudo", href: "/produtos", highlight: false },
      { label: "Lançamentos", href: "/produtos?novidades=1", highlight: true },
    ]),
  bars: z
    .object({
      utilityLinks: z
        .array(z.object({ label: z.string(), href: z.string() }))
        .default([
          { label: "Rastreie seu pedido", href: "/rastreio" },
          { label: "Seja membro", href: "/#membros" },
        ]),
      promoEnabled: z.boolean().default(true),
      promoText: z.string().default("BLACK LENTO COM ATÉ 40% OFF > Últimos dias"),
      promoHref: z.string().default("/produtos?ofertas=1"),
      promoEndsAt: z.string().default("2026-11-30T23:59:00-03:00"),
      messages: z
        .array(z.string())
        .default([
          "Trocas grátis: compra garantida",
          "Frete grátis acima de R$ 299",
          "Parcele em até 3x sem juros",
        ]),
      benefits: z
        .array(benefitSchema)
        .default([
          { strong: "5% OFF", text: "no Pix" },
          { strong: "Parcele em até 3x", text: "sem juros" },
          { strong: "Produzido sob demanda", text: "& troca grátis" },
          { strong: "Frete grátis", text: "acima de R$ 299" },
        ]),
    })
    .prefault({}),
  home: z
    .object({
      showClubRules: z.boolean().default(true),
      clubRules: z
        .array(z.string())
        .default(["Dress code: none.", "Membership: for life.", "Arrive late, leave later."]),
      newArrivalsTitle: z.string().default("Lançamentos"),
      bestSellersTitle: z.string().default("Mais vendidos"),
      saleTitle: z.string().default("Black Lento"),
      newsletterTitle: z.string().default("Seja membro do clube"),
      newsletterText: z
        .string()
        .default("Cadastre seu e-mail e ganhe 10% OFF na primeira compra, além de acesso antecipado aos drops."),
    })
    .prefault({}),
  sales: z
    .object({
      pixDiscountPercent: z.number().min(0).max(50).default(5),
      installmentsNoInterest: z.number().int().min(1).max(12).default(3),
      maxInstallments: z.number().int().min(1).max(12).default(12),
      freeShippingThresholdCents: z.number().int().min(0).default(29900),
      flatShippingCents: z.number().int().min(0).default(1990),
      flatShippingDays: z.number().int().min(1).default(10),
      extraProductionDays: z.number().int().min(0).default(3),
      welcomeCouponCode: z.string().default("MEMBRO10"),
      thankYouCouponCode: z.string().default("VOLTA10"),
    })
    .prefault({}),
  integrations: z
    .object({
      infinitepayHandle: z.string().default(""),
      youdrawAutoSubmit: z.boolean().default(true),
      youdrawAutoPix: z.boolean().default(false),
      defaultMarkup: z.number().min(1).max(10).default(2.4),
    })
    .prefault({}),
  company: z
    .object({
      legalName: z.string().default(""),
      document: z.string().default(""),
      address: z.string().default(""),
      email: z.string().default(""),
      whatsapp: z.string().default(""),
      instagram: z.string().default(""),
      tiktok: z.string().default(""),
      supportHours: z.string().default("Seg. a sex., das 9h às 18h"),
    })
    .prefault({}),
  seo: z
    .object({
      title: z.string().default("LENTO Social Club"),
      description: z
        .string()
        .default("Streetwear do LENTO Social Club. Members only. Est. 2026, Brasil."),
      ogImageUrl: z.string().default(""),
    })
    .prefault({}),
  tracking: z
    .object({
      metaPixelId: z.string().default(""),
      ga4Id: z.string().default(""),
      tiktokPixelId: z.string().default(""),
    })
    .prefault({}),
  sizeChartDefault: z
    .string()
    .default(
      [
        "Tamanho | Largura (cm) | Comprimento (cm)",
        "P | 52 | 70",
        "M | 55 | 72",
        "G | 58 | 74",
        "GG | 61 | 76",
        "XG | 64 | 78",
      ].join("\n"),
    ),
});

export type StoreSettings = z.infer<typeof settingsSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;

export function parseSettings(data: unknown): StoreSettings {
  const result = settingsSchema.safeParse(data ?? {});
  if (result.success) return result.data;
  // Dados inválidos não podem derrubar a loja: volta aos padrões.
  console.error("[settings] dados inválidos, usando padrões", result.error.issues);
  return settingsSchema.parse({});
}

export const defaultSettings: StoreSettings = settingsSchema.parse({});
