"use server";

import { requireAdmin } from "@/lib/auth";
import { storeImage } from "@/lib/media";

export async function uploadImageAction(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Nenhum arquivo enviado." };
  try {
    const url = await storeImage(Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream", file.name);
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
