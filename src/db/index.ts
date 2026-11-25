import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __lentoSql?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/lento";
  return postgres(url, {
    // Compatível com poolers (Neon/Supabase/pgbouncer).
    prepare: false,
    // Na Vercel a função congela entre requisições. Com mais de uma conexão, uma conexão aberta
    // "em segundo plano" pode ficar pela metade e estourar CONNECT_TIMEOUT no próximo acesso.
    // Uma única conexão (as consultas paralelas são enfileiradas nela) evita isso.
    max: process.env.VERCEL ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const sqlClient = globalForDb.__lentoSql ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.__lentoSql = sqlClient;

export const db = drizzle(sqlClient, { schema });
export { schema };
