// Aplica as migrações do banco e, num banco novo, cria os dados iniciais.
// Roda automaticamente antes do `next build` (inclusive na Vercel).
import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { seedFreshDatabase } from "./seed-data.mjs";

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
} catch (err) {
  console.error("[migrate] falhou:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
