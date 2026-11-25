# pod

> Ideias que viram produtos.

## Loja LENTO — e-commerce para print on demand

Loja virtual completa no estilo da referência (faixas de promoção com contagem regressiva, selos de desconto, preço “no pix”, página de produto com cores/tamanhos/tabela de medidas, carrinho lateral), com **painel administrativo**, pagamento pela **InfinitePay** e produção/envio automáticos pela **YouDraw**.

A marca é toda configurável pelo painel (logo, cores, menu, faixas, textos, cupons, banners). Para testar outra ideia de loja, troque a marca e o catálogo sem mexer no código.

---

## O que já está pronto

**Loja**
- Home com banners (imagem ou só texto), faixa de benefícios, lançamentos, ofertas, mais vendidos e bloco da marca (“club rules”).
- Listagem com filtros (lançamentos, ofertas, categoria, busca) e ordenação.
- Página de produto: galeria por cor, seletor de cor/tamanho com esgotados, tabela de medidas, formas de pagamento, cálculo de frete por CEP, produtos relacionados, dados estruturados para o Google.
- Carrinho lateral com barra “faltam R$ X para frete grátis”.
- Checkout em uma página: CEP com preenchimento automático, frete, cupom, validação de CPF; pagamento no checkout seguro da InfinitePay (Pix com desconto ou cartão parcelado).
- Página do pedido com linha do tempo e rastreio; página “Rastreie seu pedido”.
- Páginas institucionais (trocas, prazos, privacidade, termos, sobre), botão “Ajuda” no WhatsApp, captura de e-mail com cupom de boas-vindas.
- Pixels de Meta, GA4 e TikTok com eventos de conversão e registro da origem (utm) de cada venda.

**Painel (/admin)**
- Painel com vendas (hoje, 7 e 30 dias), ticket médio, gráfico de 14 dias, mais vendidos, pendências e checklist de configuração.
- Pedidos: filtros, busca, detalhe com itens, custo e margem, cliente (com botão de WhatsApp), pagamento, produção YouDraw (enviar, gerar Pix da produção, atualizar status), envio manual com rastreio, cancelar/estornar, anotações e histórico completo.
- Produtos: editor com variações (gerador de combinações cor × tamanho), SKU da YouDraw, estoque opcional, preço por variação, fotos por cor, selos, SEO, duplicar e excluir.
- Importação da YouDraw: traz o produto com variações, SKUs, custos e mockups e sugere o preço (custo × multiplicador).
- Categorias, cupons (%, valor fixo, frete grátis, limite de uso, validade), banners, páginas, clientes e leads (com exportação CSV), configurações e administradores.

**Automação**
1. O cliente paga na InfinitePay. O webhook e o retorno do pagamento confirmam a venda em `/payment_check`.
2. A loja envia o e-mail de confirmação, avisa você e cria o pedido na YouDraw (com chave de idempotência, sem duplicar).
3. A YouDraw só produz depois que **você paga a produção**. Pela API isso é só por Pix (quando a YouDraw libera); sem isso, pague no painel dela. O painel mostra o Pix copia-e-cola e avisa por e-mail.
4. Os webhooks da YouDraw atualizam o status e o rastreio. O cliente recebe e-mail ao ser enviado e, na entrega, um cupom de recompra.
5. Uma rotina diária reconcilia pedidos e reenvia os que falharam.

---

## Rodar no seu computador

Requisitos: Node 20.9+ e um banco Postgres (local ou um banco grátis no [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate           # cria as tabelas e os dados iniciais (com produtos de demonstração)
npm run dev
```

- Loja: http://localhost:3000
- Painel: http://localhost:3000/admin (entre com `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

Sem InfinitePay configurada e com `PAYMENTS_TEST_MODE=true`, o checkout funciona em **modo de teste**: a página do pedido mostra os botões “Simular Pix/cartão aprovado”. Sem provedor de e-mail, as mensagens aparecem só no terminal.

---

## Publicar (Vercel + Neon)

1. Suba o código para um repositório no GitHub.
2. Na Vercel: **Add New → Project** e importe o repositório.
3. Em **Storage**, crie um banco **Neon** (Postgres) e conecte ao projeto. Ele cria a variável `DATABASE_URL`.
4. Em **Settings → Environment Variables**, cadastre as variáveis do `.env.example` (no mínimo `AUTH_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`; `NEXT_PUBLIC_SITE_URL` só quando tiver domínio próprio — sem ele a loja usa o endereço `.vercel.app`).
5. Faça o deploy. O comando de build (`npm run build`) aplica as migrações e, num banco vazio, cria os dados iniciais.
6. Em **Settings → Domains**, conecte o seu domínio e atualize `NEXT_PUBLIC_SITE_URL`.
7. Gere um `CRON_SECRET`. A rotina diária (`vercel.json`) usa esse valor; no plano Hobby ela roda uma vez por dia.

> Para começar com o banco vazio, sem os produtos de demonstração, defina `SEED_DEMO=false` antes do primeiro deploy. Ou apague os produtos e banners pelo painel.

---

## Configurar a InfinitePay

1. No app ou na conta web: **Configurações do Checkout → ligar “Checkout integrado”**.
2. Copie a sua **InfiniteTag** (sem o `$`) para o painel da loja: **Configurações → Integrações**.
3. (Recomendado) Crie uma **API Key** (`inchk_...`) e cadastre em `INFINITEPAY_API_KEY`. Com ela a loja aplica, em cada link:
   - o **desconto no Pix** definido no painel;
   - as **parcelas sem juros** que a loja assume;
   - link de **uso único** com validade de 48h.
   
   Sem a chave, o preço “no pix” fica escondido na loja, porque o desconto não seria aplicado.
4. Não é preciso cadastrar webhook: cada link já leva a URL de aviso e a de retorno.
5. Não há sandbox. Para testar, faça uma compra real de valor baixo e estorne no app.

## Configurar a YouDraw

1. No painel da YouDraw: **Menu da conta → API → Chaves → Nova chave**. Escopos: Catálogo, Artes, Criar produtos, Frete, Criar pedidos e Consultar pedidos. Marque também Gerar Pix e Consultar pagamentos, se a YouDraw liberar o Pix pela API.
2. Cadastre a chave em `YOUDRAW_API_KEY` e publique de novo. Teste em **Configurações → Integrações → Testar conexão**.
3. **Webhooks**: em **Menu da conta → API → Webhooks**, cadastre a URL `https://SEU-DOMINIO/api/webhooks/youdraw` com os eventos `order.status_changed`, `order.tracking_updated`, `payment.paid` e `payment.expired` (canal `api`). Copie o segredo `whsec_...` para `YOUDRAW_WEBHOOK_SECRET`.
4. Crie os produtos na YouDraw. Na loja, use **Produtos → Importar da YouDraw**, revise o preço e as fotos e mude o status para **Ativo**.

**Fotos em alta resolução:** os mockups da YouDraw têm só 1000 px, por isso a loja pode usar fotos próprias. Elas ficam em `public/products/` (formato 3:4, 1500×2000) e são ligadas ao produto da YouDraw pelo ID, em `src/data/product-photos.json`. Esse arquivo também pode corrigir a cor das bolinhas (swatches).
- Ao publicar, `scripts/migrate.mjs` aplica cada versão uma única vez aos produtos já importados. Depois disso, o que for editado no painel não é mais sobrescrito.
- A importação também já usa essas fotos.
- Para trocar as fotos, publique arquivos com outro nome, por exemplo numa pasta `v2`, e mude o `version` no JSON.

Pontos de atenção da YouDraw, pela documentação deles:
- Não há sandbox: todo pedido criado pela API é real, mas só entra em produção depois de pago.
- Pedidos da API contam no limite mensal do plano. O frete grátis de boas-vindas do painel deles não vale para a API.
- Pela API, a produção só é paga por Pix, e só quando liberado pela YouDraw. Saldo e cartão não estão disponíveis.

---

## E-mails sem domínio próprio (Gmail)

1. Crie um Gmail só para a loja e ative a **verificação em duas etapas**.
2. Em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crie uma **senha de app** (16 letras).
3. Na Vercel, cadastre `SMTP_USER` (o Gmail) e `SMTP_PASS` (a senha de app, marcada como *Sensitive*) e publique de novo.
4. Teste em **Configurações → Integrações → Enviar e-mail de teste**.

O Gmail envia até ~500 e-mails por dia — suficiente para validar a ideia. Com domínio próprio, troque para o Resend (`RESEND_API_KEY` + `EMAIL_FROM`), que entrega melhor e mostra o e-mail com o nome da loja.

## Trocar de marca / testar outra ideia

Tudo pelo painel, em **Configurações**:
- **Marca e cores**: nome, logos (claro/escuro), emblema, favicon e paleta.
- **Menu e faixas**: itens do menu, faixa de promoção com contagem regressiva, mensagens e benefícios.
- **Página inicial**: títulos das seções, bloco da marca e textos de captura de e-mail.
- **Vendas e frete**: desconto Pix, parcelas, frete grátis, frete fixo, cupons automáticos e tabela de medidas padrão.
- **Empresa** (obrigatório por lei no rodapé) e **SEO/pixels**.

Para uma loja totalmente separada: use outro banco (`DATABASE_URL`), outro projeto na Vercel e `ORDER_REF_PREFIX` diferente. Para gerar novas imagens de demonstração, use `npm run demo:images`.

---

## Estrutura

```
src/app/(store)        loja (home, produtos, produto, checkout, pedido, rastreio, páginas)
src/app/admin          painel (login + (panel)/...)
src/app/api            webhooks (InfinitePay, YouDraw), frete, retorno do pagamento, cron
src/lib                integrações (youdraw, infinitepay, email), pedidos (fulfillment), catálogo, configurações
src/db/schema.ts       tabelas (Drizzle ORM)
drizzle/               migrações SQL
scripts/               migração + dados iniciais, imagens de demonstração
```

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Drizzle ORM + Postgres, Zod.
Comandos úteis: `npm run typecheck`, `npm run lint`, `npm run db:generate` (após mudar o schema) e `npm run db:studio`.

## Próximos passos sugeridos (fase 2)

- Cashback em saldo e conta do cliente (login por link no e-mail).
- E-mail/WhatsApp automático de carrinho e pagamento abandonados.
- Avaliações com foto e “avise-me quando voltar”.
- Criar estampas direto do painel: enviar a arte, posicionar e gerar o produto na YouDraw pela API.
