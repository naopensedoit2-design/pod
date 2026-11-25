import "server-only";
import sharp from "sharp";
import { db } from "@/db";
import { media } from "@/db/schema";

const MAX_BYTES = 8 * 1024 * 1024;

/** Otimiza (WebP, até 2400px, alta qualidade) e guarda a imagem no banco. Retorna a URL pública (/media/{id}). */
export async function storeImage(buffer: Buffer, mime: string, name?: string): Promise<string> {
  if (buffer.length > MAX_BYTES) throw new Error("Imagem muito grande (máx. 8 MB).");

  if (mime === "image/svg+xml") {
    const text = buffer.toString("utf8");
    if (/<script|on\w+\s*=|javascript:/i.test(text)) throw new Error("SVG com conteúdo não permitido.");
    const [row] = await db.insert(media).values({ mime, data: buffer, size: buffer.length, name }).returning({ id: media.id });
    return `/media/${row.id}`;
  }

  if (!mime.startsWith("image/")) throw new Error("Envie um arquivo de imagem.");
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const isIcon = (meta.width ?? 0) <= 256 && (meta.height ?? 0) <= 256;
  const output = await image
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: isIcon ? 95 : 90, alphaQuality: 95, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  const [row] = await db
    .insert(media)
    .values({
      mime: "image/webp",
      data: output.data,
      size: output.data.length,
      width: output.info.width,
      height: output.info.height,
      name,
    })
    .returning({ id: media.id });
  return `/media/${row.id}`;
}

/** Baixa uma imagem externa (ex.: mockup da YouDraw) e guarda uma cópia. */
export async function importRemoteImage(url: string, name?: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (!res.ok) throw new Error(`Não foi possível baixar a imagem (${res.status}).`);
  const mime = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return storeImage(buf, mime, name);
}
