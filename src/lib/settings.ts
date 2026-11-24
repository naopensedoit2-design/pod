import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { parseSettings, type StoreSettings } from "./settings-schema";

/** Configurações da loja (cacheadas; o painel invalida a tag "settings" ao salvar). */
export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("max");
  const row = await db.query.settings.findFirst({ where: eq(settings.id, "store") });
  return parseSettings(row?.data);
}

/** Leitura sem cache, para o painel e para fluxos de pagamento. */
export async function getSettingsFresh(): Promise<StoreSettings> {
  const row = await db.query.settings.findFirst({ where: eq(settings.id, "store") });
  return parseSettings(row?.data);
}

export async function saveSettings(data: StoreSettings) {
  await db
    .insert(settings)
    .values({ id: "store", data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.id, set: { data, updatedAt: new Date() } });
}
