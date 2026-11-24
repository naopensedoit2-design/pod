import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { StoreSettings } from "./settings-schema";

type Mail = { to: string; subject: string; html: string; replyTo?: string };

let transporter: Transporter | null = null;

/**
 * Envia e-mail por Resend (RESEND_API_KEY) ou SMTP (SMTP_URL).
 * Sem nenhum dos dois, apenas registra no log (modo desenvolvimento).
 */
export async function sendEmail(mail: Mail): Promise<{ ok: boolean; provider: string; error?: string }> {
  const from = process.env.EMAIL_FROM ?? "LENTO <onboarding@resend.dev>";
  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, reply_to: mail.replyTo }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return { ok: true, provider: "resend" };
    }
    if (process.env.SMTP_URL) {
      transporter ??= nodemailer.createTransport(process.env.SMTP_URL);
      await transporter.sendMail({ from, to: mail.to, subject: mail.subject, html: mail.html, replyTo: mail.replyTo });
      return { ok: true, provider: "smtp" };
    }
    console.info(`[email:dev] para=${mail.to} assunto="${mail.subject}" (configure RESEND_API_KEY ou SMTP_URL para enviar de verdade)`);
    return { ok: true, provider: "log" };
  } catch (err) {
    console.error("[email] falha ao enviar", mail.subject, err);
    return { ok: false, provider: "error", error: (err as Error).message };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL);
}

export function adminNotifyEmail(settings: StoreSettings): string | null {
  return process.env.ADMIN_NOTIFY_EMAIL || settings.company.email || process.env.ADMIN_EMAIL || null;
}
