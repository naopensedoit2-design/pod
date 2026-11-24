import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __lentoSql?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/lento";
  return postgres(url, {
    // Compatível com poolers (Neon/Supabase/pgbouncer).
    prepare: false,
    max: process.env.VERCEL ? 2 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

export const sqlClient = globalForDb.__lentoSql ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.__lentoSql = sqlClient;

export const db = drizzle(sqlClient, { schema });
export { schema };
