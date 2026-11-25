// Aplica as migrações do banco e, num banco novo, cria os dados iniciais.
// Roda automaticamente antes do `next build` (inclusive na Vercel).
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { seedFreshDatabase } from "./seed-data.mjs";

/**
 * Aplica as fotos (e cores das bolinhas) de src/data/product-photos.json aos produtos importados
 * da YouDraw. Cada versão é aplicada uma única vez por produto (tabela data_patches): depois disso,
 * o que for editado no painel nunca é sobrescrito.
 */
async function applyProductPhotos(sql) {
  const manifest = JSON.parse(readFileSync(new URL("../src/data/product-photos.json", import.meta.url), "utf8"));
  for (const [ydId, entry] of Object.entries(manifest)) {
    if (ydId.startsWith("_") || !entry?.images?.length) continue;
    const patchId = `product-photos:${ydId}:${entry.version}`;
    const [done] = await sql`select 1 from data_patches where id = ${patchId}`;
    if (done) continue;
    const prods = await sql`select id from products where yd_product_id = ${ydId}`;
    if (!prods.length) continue; // ainda não importado: a importação já usa estas fotos
    await sql.begin(async (tx) => {
      for (const { id } of prods) {
        await tx`delete from product_images where product_id = ${id}`;
        for (const [i, img] of entry.images.entries()) {
          await tx`insert into product_images (product_id, url, alt, color, sort_order)
                   values (${id}, ${img.url}, ${img.alt ?? ""}, ${img.color ?? ""}, ${i})`;
        }
        for (const [color, hex] of Object.entries(entry.colors ?? {})) {
          await tx`update variants set option1_hex = ${hex} where product_id = ${id} and option1 = ${color}`;
        }
        await tx`update products set updated_at = now() where id = ${id}`;
      }
      await tx`insert into data_patches (id) values (${patchId}) on conflict do nothing`;
    });
    console.log(`[migrate] fotos em alta aplicadas ao produto da YouDraw ${ydId} (${prods.length} na loja).`);
  }
}

config({ path: [".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  if (process.env.VERCEL) {
    console.error("[migrate] DATABASE_URL não definida. Conecte um banco Postgres (Vercel → Storage → Neon) e publique de novo.");
    process.exit(1);
  }
  console.warn("[migrate] DATABASE_URL não definida — pulando migrações.");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  console.log("[migrate] banco atualizado.");
  const [{ count }] = await sql`select count(*)::int as count from settings`;
  if (count === 0) {
    const withDemo = process.env.SEED_DEMO !== "false";
    await seedFreshDatabase(sql, { withDemo });
    console.log(`[migrate] banco novo: dados iniciais criados${withDemo ? " (com produtos de demonstração)" : ""}.`);
  }
  await applyProductPhotos(sql);
} catch (err) {
  console.error("[migrate] falhou:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
