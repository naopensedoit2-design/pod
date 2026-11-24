<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Projeto: loja (Next.js 16 + Cache Components)

- Loja em `src/app/(store)`, painel em `src/app/admin` (`instant = false`, sessão por cookie JWT em `src/lib/auth.ts`).
- Dados da vitrine vêm de funções `"use cache"` com `cacheTag` (`products`, `categories`, `banners`, `pages`, `settings`) em `src/lib/catalog.ts` e `src/lib/settings.ts`. Toda server action do painel que muda esses dados chama `updateTag(...)`; rotas de webhook usam `revalidateTag(tag, "max")`.
- Ciclo do pedido (pagamento → YouDraw → status/rastreio → e-mails) em `src/lib/fulfillment.ts`.
- Integrações: `src/lib/infinitepay.ts` (Checkout Integrado) e `src/lib/youdraw.ts` (API Comercial v1, idempotência obrigatória, webhooks HMAC).
- Banco: Drizzle (`src/db/schema.ts`). Após mudar o schema: `npm run db:generate` e `npm run db:migrate`.
- Toda server action do painel deve começar com `await requireAdmin()`.
