import "server-only";
import type { Order, OrderItem } from "@/db/schema";
import { formatBRL } from "./format";
import type { StoreSettings } from "./settings-schema";

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(settings: StoreSettings, baseUrl: string, title: string, body: string) {
  const t = settings.theme;
  const logo = settings.brand.logoUrl.startsWith("/brand/")
    ? `${baseUrl}/brand/lento-logo-email.png`
    : settings.brand.logoUrl.startsWith("http")
      ? settings.brand.logoUrl
      : `${baseUrl}${settings.brand.logoUrl}`;
  const c = settings.company;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f2ee;font-family:Helvetica,Arial,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px;overflow:hidden">
<tr><td style="background:${t.primary};height:6px"></td></tr>
<tr><td align="center" style="padding:28px 24px 8px"><a href="${baseUrl}"><img src="${logo}" alt="${esc(settings.brand.name)}" width="160" style="display:block;border:0;max-width:160px"></a></td></tr>
<tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.55">${body}</td></tr>
<tr><td style="background:#111;color:#bbb;font-size:12px;line-height:1.5;padding:20px 32px;text-align:center">
${esc(settings.brand.name)}${c.legalName ? ` · ${esc(c.legalName)}` : ""}${c.document ? ` · ${esc(c.document)}` : ""}<br>
${c.email ? `${esc(c.email)}` : ""}${c.whatsapp ? ` · WhatsApp ${esc(c.whatsapp)}` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string, color = "#111") {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 26px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;font-size:13px">${esc(label)}</a></p>`;
}

function itemsTable(items: OrderItem[], order: Order) {
  const rows = items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.title)}<br><span style="color:#777;font-size:13px">${esc(i.variantLabel)} · ${i.quantity}x</span></td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #eee;white-space:nowrap">${formatBRL(i.totalCents)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold" : "color:#555"}">${label}</td><td align="right" style="padding:4px 0;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">${rows}
${line("Subtotal", formatBRL(order.subtotalCents))}
${order.discountCents ? line(`Desconto${order.couponCode ? ` (${esc(order.couponCode)})` : ""}`, `− ${formatBRL(order.discountCents)}`) : ""}
${line("Frete", order.shippingCents ? formatBRL(order.shippingCents) : "Grátis")}
${line("Total", formatBRL(order.paidAmountCents ?? order.totalCents), true)}
</table>`;
}

function address(order: Order) {
  return `<p style="color:#555;font-size:14px;margin:0"><strong style="color:#111">Entrega</strong><br>${esc(order.name)}<br>${esc(order.street)}, ${esc(order.streetNumber)}${order.complement ? ` — ${esc(order.complement)}` : ""}<br>${esc(order.neighborhood)} · ${esc(order.city)}/${esc(order.state)} · CEP ${esc(order.cep)}</p>`;
}

export function orderPaidEmail(settings: StoreSettings, baseUrl: string, order: Order, items: OrderItem[]) {
  const first = order.name.split(" ")[0];
  const body = `<h1 style="font-size:22px;margin:8px 0 12px">Pagamento aprovado, ${esc(first)}!</h1>
<p>Seu pedido <strong>#${order.number}</strong> foi confirmado. Cada peça é produzida sob demanda, então ela entra em produção agora e você recebe o código de rastreio assim que for enviada.</p>
${itemsTable(items, order)}
${address(order)}
${button(`${baseUrl}/pedido/${order.token}`, "Acompanhar pedido", settings.theme.button)}
<p style="color:#777;font-size:13px">Dúvidas? Responda este e-mail${settings.company.whatsapp ? " ou chame no WhatsApp" : ""}.</p>`;
  return { subject: `Pedido #${order.number} confirmado ✦ ${settings.brand.name}`, html: layout(settings, baseUrl, "Pedido confirmado", body) };
}

export function orderShippedEmail(settings: StoreSettings, baseUrl: string, order: Order) {
  const track = order.trackingUrl || `${baseUrl}/pedido/${order.token}`;
  const body = `<h1 style="font-size:22px;margin:8px 0 12px">Seu pedido está a caminho</h1>
<p>O pedido <strong>#${order.number}</strong> foi enviado${order.carrier ? ` pela ${esc(order.carrier)}` : ""}.</p>
${order.trackingCode ? `<p style="font-size:18px;letter-spacing:.08em;background:#f4f2ee;padding:12px 16px;display:inline-block"><strong>${esc(order.trackingCode)}</strong></p>` : ""}
${button(track, "Rastrear entrega", settings.theme.button)}
${address(order)}`;
  return { subject: `Pedido #${order.number} enviado — acompanhe a entrega`, html: layout(settings, baseUrl, "Pedido enviado", body) };
}

export function orderDeliveredEmail(settings: StoreSettings, baseUrl: string, order: Order) {
  const coupon = settings.sales.thankYouCouponCode;
  const body = `<h1 style="font-size:22px;margin:8px 0 12px">Chegou! Bem-vindo ao clube.</h1>
<p>O pedido <strong>#${order.number}</strong> foi entregue. Esperamos que você curta muito.</p>
${coupon ? `<p>Como agradecimento, sua próxima compra tem desconto com o cupom:</p><p style="font-size:22px;letter-spacing:.15em;border:2px dashed ${settings.theme.primary};color:${settings.theme.primary};padding:12px 18px;display:inline-block"><strong>${esc(coupon)}</strong></p>` : ""}
${button(`${baseUrl}/produtos?novidades=1`, "Ver lançamentos", settings.theme.button)}
<p style="color:#777;font-size:13px">Algum problema com o pedido? Responda este e-mail que a gente resolve.</p>`;
  return { subject: `Chegou! Um presente para a próxima ✦ ${settings.brand.name}`, html: layout(settings, baseUrl, "Pedido entregue", body) };
}

export function welcomeEmail(settings: StoreSettings, baseUrl: string) {
  const coupon = settings.sales.welcomeCouponCode;
  const body = `<h1 style="font-size:22px;margin:8px 0 12px">Você agora é membro.</h1>
<p>Obrigado por entrar para o ${esc(settings.brand.name)}. Você vai receber os drops antes de todo mundo.</p>
${coupon ? `<p>Seu presente de boas-vindas:</p><p style="font-size:22px;letter-spacing:.15em;border:2px dashed ${settings.theme.primary};color:${settings.theme.primary};padding:12px 18px;display:inline-block"><strong>${esc(coupon)}</strong></p>` : ""}
${button(`${baseUrl}/produtos`, "Ir para a loja", settings.theme.button)}`;
  return { subject: `Bem-vindo ao clube ✦ ${settings.brand.name}`, html: layout(settings, baseUrl, "Bem-vindo", body) };
}

export function adminNewOrderEmail(settings: StoreSettings, baseUrl: string, order: Order, items: OrderItem[], extra = "") {
  const body = `<h1 style="font-size:20px;margin:8px 0 12px">Novo pedido pago: #${order.number}</h1>
<p><strong>${esc(order.name)}</strong> · ${esc(order.email)} · ${esc(order.phone)}<br>${formatBRL(order.paidAmountCents ?? order.totalCents)} via ${esc(order.captureMethod ?? "—")}${order.installments ? ` (${order.installments}x)` : ""}</p>
${itemsTable(items, order)}
${extra}
${button(`${baseUrl}/admin/pedidos/${order.id}`, "Abrir no painel", "#111")}`;
  return { subject: `💰 Pedido #${order.number} pago — ${formatBRL(order.paidAmountCents ?? order.totalCents)}`, html: layout(settings, baseUrl, "Novo pedido", body) };
}

export function adminProductionPixEmail(settings: StoreSettings, baseUrl: string, order: Order) {
  const body = `<h1 style="font-size:20px;margin:8px 0 12px">Pague a produção do pedido #${order.number}</h1>
<p>O pedido foi criado na YouDraw (${esc(order.ydPublicCode)}) e só entra em produção depois do pagamento. Custo: <strong>${formatBRL(order.ydCostCents)}</strong>.</p>
${order.ydPixQrUrl ? `<p><img src="${order.ydPixQrUrl}" alt="QR Code Pix" width="220" style="display:block"></p>` : ""}
${order.ydPixCopyPaste ? `<p style="font-size:12px;word-break:break-all;background:#f4f2ee;padding:12px">${esc(order.ydPixCopyPaste)}</p>` : ""}
${button(`${baseUrl}/admin/pedidos/${order.id}`, "Abrir no painel", "#111")}`;
  return { subject: `⚠️ Pague a produção do pedido #${order.number}`, html: layout(settings, baseUrl, "Pagar produção", body) };
}

export function adminAlertEmail(settings: StoreSettings, baseUrl: string, order: Order, title: string, message: string) {
  const body = `<h1 style="font-size:20px;margin:8px 0 12px">${esc(title)}</h1>
<p>${esc(message)}</p>
${button(`${baseUrl}/admin/pedidos/${order.id}`, "Abrir no painel", "#111")}`;
  return { subject: `⚠️ ${title} — pedido #${order.number}`, html: layout(settings, baseUrl, title, body) };
}
