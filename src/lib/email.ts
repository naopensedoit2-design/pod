import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { StoreSettings } from "./settings-schema";

type Mail = { to: string; subject: string; html: string; replyTo?: string };

let transporter: Transporter | null = null;

/**
 * Envia e-mail por Resend (RESEND_API_KEY) ou SMTP (SMTP_URL, ou SMTP_USER + SMTP_PASS).
 * Sem nenhum deles, apenas registra no log (modo desenvolvimento).
 */
export async function sendEmail(mail: Mail): Promise<{ ok: boolean; provider: string; error?: string }> {
  const from =
    process.env.EMAIL_FROM ??
    (process.env.SMTP_USER ? `${process.env.EMAIL_FROM_NAME ?? "LENTO"} <${process.env.SMTP_USER}>` : "LENTO <onboarding@resend.dev>");
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
    const smtp = smtpTransport();
    if (smtp) {
      await smtp.sendMail({ from, to: mail.to, subject: mail.subject, html: mail.html, replyTo: mail.replyTo });
      return { ok: true, provider: "smtp" };
    }
    console.info(`[email:dev] para=${mail.to} assunto="${mail.subject}" (configure SMTP_USER + SMTP_PASS ou RESEND_API_KEY para enviar de verdade)`);
    return { ok: true, provider: "log" };
  } catch (err) {
    console.error("[email] falha ao enviar", mail.subject, err);
    return { ok: false, provider: "error", error: (err as Error).message };
  }
}

/**
 * SMTP por URL (SMTP_URL) ou por usuário/senha (SMTP_USER + SMTP_PASS).
 * Sem domínio próprio, use um Gmail da loja com "senha de app": SMTP_USER=loja@gmail.com, SMTP_PASS=senha de app.
 */
function smtpTransport(): Transporter | null {
  if (transporter) return transporter;
  if (process.env.SMTP_URL) {
    transporter = nodemailer.createTransport(process.env.SMTP_URL);
  } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS.replace(/\s+/g, "") },
    });
  }
  return transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL || (process.env.SMTP_USER && process.env.SMTP_PASS));
}

export function adminNotifyEmail(settings: StoreSettings): string | null {
  return process.env.ADMIN_NOTIFY_EMAIL || settings.company.email || process.env.ADMIN_EMAIL || null;
}
