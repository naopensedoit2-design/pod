import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const row = await db.query.media.findFirst({ where: eq(media.id, id) });
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.data.length),
      // O conteúdo de um id nunca muda: navegador e CDN da Vercel podem guardar por 1 ano.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(row.mime === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    },
  });
}
