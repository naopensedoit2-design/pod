"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { adminNotifyEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { getSettingsFresh, saveSettings } from "@/lib/settings";
import { settingsSchema, type StoreSettings } from "@/lib/settings-schema";
import { isYouDrawConfigured, youdraw, YouDrawError } from "@/lib/youdraw";

export async function saveSettingsAction(data: StoreSettings): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, message: `Campo inválido (${issue.path.join(" › ")}): ${issue.message}` };
  }
  await saveSettings(parsed.data);
  updateTag("settings");
  refresh();
  return { ok: true, message: "Configurações salvas. A loja já está atualizada." };
}

export async function testYouDrawAction(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!isYouDrawConfigured()) return { ok: false, message: "YOUDRAW_API_KEY não definida." };
  try {
    const acc = await youdraw.account();
    return { ok: true, message: `Conectado: ${acc.name} (${acc.environment === "live" ? "produção" : "sandbox"}).` };
  } catch (err) {
    return { ok: false, message: err instanceof YouDrawError ? err.describe() : (err as Error).message };
  }
}

export async function testEmailAction(): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const settings = await getSettingsFresh();
  const to = adminNotifyEmail(settings) ?? admin.email;
  const r = await sendEmail({
    to,
    subject: `Teste de e-mail — ${settings.brand.name}`,
    html: `<p>Se você recebeu esta mensagem, os e-mails da loja estão funcionando. ✦</p>`,
  });
  if (!isEmailConfigured()) return { ok: false, message: "Nenhum provedor configurado (RESEND_API_KEY ou SMTP_URL): o e-mail só foi registrado no log." };
  return r.ok ? { ok: true, message: `E-mail de teste enviado para ${to}.` } : { ok: false, message: r.error ?? "Falha no envio." };
}
