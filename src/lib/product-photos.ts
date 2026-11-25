import "server-only";
import manifest from "@/data/product-photos.json";

export type ProductPhoto = { url: string; color: string; alt: string };
type Entry = { version: string; images: ProductPhoto[]; colors?: Record<string, string> };

/**
 * Fotos em alta resolução (e cores das bolinhas) preparadas para um produto da YouDraw
 * (src/data/product-photos.json). `patchId` é o mesmo registrado por scripts/migrate.mjs,
 * para a versão não ser aplicada duas vezes.
 */
export function productPhotosFor(ydProductId: string): (Entry & { patchId: string }) | null {
  if (ydProductId.startsWith("_")) return null;
  const entry = (manifest as Record<string, unknown>)[ydProductId] as Entry | undefined;
  if (!entry?.images?.length) return null;
  return { ...entry, patchId: `product-photos:${ydProductId}:${entry.version}` };
}
