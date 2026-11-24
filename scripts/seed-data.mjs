// Dados iniciais da loja (páginas, cupons, categorias e — opcionalmente — produtos de demonstração).

const SIZES = ["P", "M", "G", "GG", "XG"];

const DEMO_PRODUCTS = [
  {
    title: "Camiseta Lento Social Club",
    slug: "camiseta-lento-social-club",
    category: "camisetas",
    price: 14990,
    compareAt: 19990,
    tags: ["BLACK LENTO"],
    isNew: true,
    isFeatured: true,
    sales: 42,
    description:
      "A camiseta oficial do clube. Modelagem oversized, malha 100% algodão fio 30.1 penteado e estampa frontal com o logo Lento Social Club.\n\nProduzida sob demanda: sua peça é estampada depois da compra, com prazo de produção de até 5 dias úteis + entrega.",
    colors: [
      { name: "Off-White", hex: "#F1E9D8", images: ["lsc-offwhite-front", "lsc-offwhite-back"] },
      { name: "Preta", hex: "#1A1A1A", images: ["lsc-preta-front", "lsc-preta-back"] },
      { name: "Azul Royal", hex: "#1F3D9C", images: ["lsc-azul-front", "lsc-azul-back"] },
    ],
    sizes: SIZES,
  },
  {
    title: "Camiseta Club Rules",
    slug: "camiseta-club-rules",
    category: "camisetas",
    price: 16990,
    compareAt: 21990,
    tags: ["BLACK LENTO"],
    isNew: true,
    isFeatured: false,
    sales: 30,
    description:
      "Regras do clube estampadas nas costas: dress code: none. membership: for life. arrive late, leave later. Logo discreto na frente.\n\nMalha 100% algodão, modelagem oversized. Produzida sob demanda.",
    colors: [
      { name: "Branca", hex: "#FAFAF7", images: ["rules-branca-back", "rules-branca-front"] },
      { name: "Off-White", hex: "#F1E9D8", images: ["rules-offwhite-back", "rules-offwhite-front"] },
    ],
    sizes: SIZES,
  },
  {
    title: "Camiseta Members Only",
    slug: "camiseta-members-only",
    category: "camisetas",
    price: 13990,
    compareAt: null,
    tags: [],
    isNew: false,
    isFeatured: true,
    sales: 25,
    description:
      "O emblema oval do Lento Social Club no peito. Para quem já é membro — ou quer parecer.\n\nMalha 100% algodão, modelagem regular. Produzida sob demanda.",
    colors: [
      { name: "Cinza Mescla", hex: "#BDBCB8", images: ["members-mescla-front", "members-mescla-back"] },
      { name: "Branca", hex: "#FAFAF7", images: ["members-branca-front", "members-branca-back"] },
    ],
    sizes: SIZES,
  },
  {
    title: "Ecobag Members Only",
    slug: "ecobag-members-only",
    category: "acessorios",
    price: 7990,
    compareAt: 9990,
    tags: ["BLACK LENTO"],
    isNew: false,
    isFeatured: false,
    sales: 12,
    description: "Ecobag em lona de algodão cru, 38 x 42 cm, alças longas. Carrega tudo, menos pressa.",
    sizeChart: "Medida | Valor\nLargura | 38 cm\nAltura | 42 cm\nAlça | 60 cm",
    colors: [
      { name: "Natural", hex: "#E6DCC6", images: ["ecobag-natural"] },
      { name: "Preta", hex: "#1A1A1A", images: ["ecobag-preta"] },
    ],
    sizes: ["Único"],
  },
];

const PAGES = [
  {
    slug: "trocas-e-devolucoes",
    title: "Trocas e devoluções",
    body: `Direito de arrependimento
Você pode desistir da compra em até 7 dias corridos após o recebimento, conforme o art. 49 do Código de Defesa do Consumidor. O valor é devolvido integralmente, inclusive o frete.

Troca de tamanho
A primeira troca de tamanho é grátis em até 30 dias após o recebimento. A peça deve estar sem uso, sem lavagem e com etiqueta.

Defeito de fabricação
Se a peça chegar com defeito, fale com a gente em até 90 dias. Enviamos uma nova sem custo.

Como solicitar
Envie um e-mail ou WhatsApp com o número do pedido e o motivo. Respondemos em até 1 dia útil.

(Revise este texto com as regras da sua operação antes de publicar.)`,
  },
  {
    slug: "prazos-e-entregas",
    title: "Prazos e entregas",
    body: `Produção sob demanda
Cada peça é estampada depois da compra. Isso evita desperdício e garante peça nova para você. A produção leva até 5 dias úteis.

Entrega
O prazo de entrega aparece no carrinho ao informar o CEP e é somado ao prazo de produção. Assim que o pedido é enviado, você recebe o código de rastreio por e-mail.

Rastreio
Acompanhe seu pedido a qualquer momento na página Rastreie seu pedido.`,
  },
  {
    slug: "politica-de-privacidade",
    title: "Política de privacidade",
    body: `Coletamos apenas os dados necessários para processar seu pedido (nome, CPF, e-mail, telefone e endereço de entrega) e, se você se cadastrar, seu e-mail para novidades.

Seus dados são compartilhados somente com os parceiros que tornam a compra possível: o meio de pagamento, a empresa de produção e a transportadora.

Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento pelo nosso e-mail, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).

(Revise este texto antes de publicar.)`,
  },
  {
    slug: "termos-de-uso",
    title: "Termos de uso",
    body: `Ao comprar na loja você concorda com as condições de pagamento, produção, entrega, trocas e devoluções descritas neste site.

Os preços e promoções podem mudar sem aviso, mas o valor do seu pedido é o confirmado no momento do pagamento.

(Revise este texto antes de publicar.)`,
  },
  {
    slug: "sobre",
    title: "Sobre o clube",
    body: `Lento Social Club. Members only. Est. 2026, Brasil.

Club rules:
01. Dress code: none.
02. Membership: for life.
03. Arrive late, leave later.`,
  },
];

const BANNERS = [
  {
    eyebrow: "Última chance · Black Lento",
    title: "até 40% off no clube",
    subtitle: "Peças selecionadas com preço de membro.",
    ctaLabel: "acesse",
    href: "/produtos?ofertas=1",
    bg: "#C4252F",
    text: "#FFFFFF",
  },
  {
    eyebrow: "Members only",
    title: "Lento Social Club",
    subtitle: "Dress code: none. Membership: for life.",
    ctaLabel: "ver lançamentos",
    href: "/produtos?novidades=1",
    bg: "#1F3D9C",
    text: "#F1E9D8",
  },
  {
    eyebrow: "Novo drop",
    title: "Arrive late, leave later.",
    subtitle: "Camisetas oversized com estampa premium, feitas sob demanda.",
    ctaLabel: "comprar camisetas",
    href: "/colecao/camisetas",
    bg: "#F1E9D8",
    text: "#C4252F",
  },
];

export async function seedFreshDatabase(sql, { withDemo = true } = {}) {
  await sql.begin(async (tx) => {
    // Categorias
    const cats = [
      { name: "Camisetas", slug: "camisetas", sort: 1 },
      { name: "Acessórios", slug: "acessorios", sort: 2 },
    ];
    const catIds = {};
    for (const c of cats) {
      const [row] = await tx`
        insert into categories (name, slug, sort_order) values (${c.name}, ${c.slug}, ${c.sort})
        on conflict (slug) do update set name = excluded.name returning id`;
      catIds[c.slug] = row.id;
    }

    // Páginas
    let order = 0;
    for (const p of PAGES) {
      await tx`
        insert into pages (slug, title, body, sort_order) values (${p.slug}, ${p.title}, ${p.body}, ${order++})
        on conflict (slug) do nothing`;
    }

    // Cupons
    const coupons = [
      { code: "MEMBRO10", type: "percent", value: 10, min: 0, description: "Boas-vindas (cadastro de e-mail)" },
      { code: "VOLTA10", type: "percent", value: 10, min: 0, description: "Recompra (enviado após a entrega)" },
      { code: "FRETEGRATIS", type: "free_shipping", value: 0, min: 19900, description: "Frete grátis acima de R$ 199" },
    ];
    for (const c of coupons) {
      await tx`
        insert into coupons (code, type, value, min_subtotal_cents, description)
        values (${c.code}, ${c.type}, ${c.value}, ${c.min}, ${c.description})
        on conflict (code) do nothing`;
    }

    if (withDemo) {
      let sort = 0;
      for (const b of BANNERS) {
        await tx`
          insert into banners (eyebrow, title, subtitle, cta_label, href, bg_color, text_color, sort_order)
          values (${b.eyebrow}, ${b.title}, ${b.subtitle}, ${b.ctaLabel}, ${b.href}, ${b.bg}, ${b.text}, ${sort++})`;
      }

      let pSort = 0;
      for (const p of DEMO_PRODUCTS) {
        const [prod] = await tx`
          insert into products (title, slug, description, category_id, status, price_cents, compare_at_cents, tags,
            is_new, is_featured, size_chart, sort_order, sales_count)
          values (${p.title}, ${p.slug}, ${p.description}, ${catIds[p.category]}, 'active', ${p.price}, ${p.compareAt},
            ${p.tags}, ${p.isNew}, ${p.isFeatured}, ${p.sizeChart ?? ""}, ${pSort++}, ${p.sales})
          on conflict (slug) do nothing returning id`;
        if (!prod) continue;
        let imgSort = 0;
        let vSort = 0;
        for (const color of p.colors) {
          for (const img of color.images) {
            await tx`
              insert into product_images (product_id, url, alt, color, sort_order)
              values (${prod.id}, ${`/demo/${img}.webp`}, ${`${p.title} ${color.name}`}, ${color.name}, ${imgSort++})`;
          }
          for (const size of p.sizes) {
            const sku = `${p.slug.split("-").map((w) => w[0]).join("").toUpperCase()}-${color.name.slice(0, 3).toUpperCase()}-${size.toUpperCase()}`;
            await tx`
              insert into variants (product_id, option1, option1_hex, option2, sku, sort_order)
              values (${prod.id}, ${color.name}, ${color.hex}, ${size}, ${sku}, ${vSort++})`;
          }
        }
      }
    }

    await tx`insert into settings (id, data) values ('store', '{}'::jsonb) on conflict (id) do nothing`;
  });
}
