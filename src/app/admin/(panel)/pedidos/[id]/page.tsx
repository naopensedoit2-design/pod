import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orders } from "@/db/schema";
import { ActionButton, CopyButton } from "@/components/admin/action-button";
import { Card, LinkButton, Notice, PageHeader, Pill, STATUS_TONE } from "@/components/admin/ui";
import { formatBRL, formatCep, formatCpf, formatDateTime, formatPhone, onlyDigits, ORDER_STATUS_LABEL, YD_STATUS_LABEL } from "@/lib/format";
import { isYouDrawConfigured } from "@/lib/youdraw";
import {
  generatePixAction,
  markPaidManuallyAction,
  resendConfirmationAction,
  setStatusAction,
  submitToYouDrawAction,
  syncYouDrawAction,
} from "../actions";
import { NoteForm, ShipForm } from "./forms";

export const metadata: Metadata = { title: "Pedido" };

export default async function OrderDetailPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) notFound();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: { orderBy: (i) => [asc(i.id)] }, events: { orderBy: [desc(orderEvents.createdAt), desc(orderEvents.id)] } },
  });
  if (!order) notFound();

  const paid = order.paymentStatus === "paid";
  const hasPod = order.items.some((i) => i.ydSku);
  const ydReady = isYouDrawConfigured();
  const phone = onlyDigits(order.phone);
  const wa = phone ? `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(`Olá ${order.name.split(" ")[0]}! Aqui é da loja, sobre o seu pedido #${order.number}.`)}` : null;
  const revenue = order.paidAmountCents ?? order.totalCents;
  const margin = order.ydCostCents != null ? revenue - order.ydCostCents : null;

  return (
    <>
      <PageHeader
        title={`Pedido #${order.number}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatDateTime(order.createdAt)} · <Pill tone={STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Pill>
            {order.utm?.utm_source && <Pill tone="blue">origem: {order.utm.utm_source}</Pill>}
          </span>
        }
        actions={
          <>
            <LinkButton href="/admin/pedidos" variant="secondary" size="sm">
              ← Voltar
            </LinkButton>
            <LinkButton href={`/pedido/${order.token}`} variant="secondary" size="sm" external>
              Página do cliente
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Itens">
            <ul className="-my-2 divide-y">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 py-3">
                  <div className="w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {it.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{it.title}</p>
                    <p className="text-xs text-neutral-500">
                      {it.variantLabel} · {it.quantity}x {formatBRL(it.unitPriceCents)}
                    </p>
                    <p className="text-xs text-neutral-400">
                      SKU {it.sku || "—"} · YouDraw: {it.ydSku ? <span className="text-neutral-600">{it.ydSku}</span> : <span className="text-amber-600">sem vínculo</span>}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatBRL(it.totalCents)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="tabular-nums">{formatBRL(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Desconto ({order.couponCode})</dt>
                  <dd className="tabular-nums">− {formatBRL(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">
                  Frete ({order.shippingService}
                  {order.shippingDays ? `, ${order.shippingDays} dias` : ""})
                </dt>
                <dd className="tabular-nums">{order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBRL(order.totalCents)}</dd>
              </div>
              {paid && order.paidAmountCents != null && order.paidAmountCents !== order.totalCents && (
                <div className="flex justify-between text-neutral-500">
                  <dt>Valor pago ({order.captureMethod === "pix" ? "com desconto Pix" : "com juros do parcelamento"})</dt>
                  <dd className="tabular-nums">{formatBRL(order.paidAmountCents)}</dd>
                </div>
              )}
              {margin != null && (
                <div className="flex justify-between border-t pt-2">
                  <dt className="text-neutral-500">Custo YouDraw (produção + frete) · margem bruta</dt>
                  <dd className="tabular-nums">
                    {formatBRL(order.ydCostCents)} · <strong className={margin >= 0 ? "text-emerald-700" : "text-red-600"}>{formatBRL(margin)}</strong>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Produção e envio">
            <div className="space-y-4 text-sm">
              {!paid && <Notice tone="yellow">O pedido só vai para a produção depois que o cliente pagar.</Notice>}

              {paid && hasPod && !order.ydOrderId && (
                <div className="space-y-3">
                  {order.ydError && <Notice tone="red">Última tentativa falhou: {order.ydError}</Notice>}
                  {!ydReady && <Notice tone="yellow">Configure a chave da YouDraw (YOUDRAW_API_KEY) para enviar automaticamente.</Notice>}
                  <ActionButton action={submitToYouDrawAction.bind(null, order.id)} variant="primary" size="md">
                    Enviar para produção (YouDraw)
                  </ActionButton>
                </div>
              )}

              {order.ydOrderId && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-neutral-500">YouDraw:</span>
                    <strong>{order.ydPublicCode}</strong>
                    <Pill tone={order.ydStatus === "pending_payment" ? "yellow" : "blue"}>{YD_STATUS_LABEL[order.ydStatus ?? ""] ?? order.ydStatus}</Pill>
                    {order.ydSyncedAt && <span className="text-xs text-neutral-400">atualizado {formatDateTime(order.ydSyncedAt)}</span>}
                  </div>
                  {order.ydStatus === "pending_payment" && (
                    <Notice tone="yellow">
                      A produção só começa depois que você pagar este pedido na YouDraw ({formatBRL(order.ydCostCents)}). Pague pelo Pix abaixo ou no
                      painel da YouDraw.
                    </Notice>
                  )}
                  {order.ydPixCopyPaste && order.ydStatus === "pending_payment" && (
                    <div className="flex flex-wrap items-start gap-4 rounded-md border p-3">
                      {order.ydPixQrUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.ydPixQrUrl} alt="QR Code Pix" className="h-36 w-36" />
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-xs font-medium">Pix copia e cola {order.ydPixExpiresAt && `(expira ${formatDateTime(order.ydPixExpiresAt)})`}</p>
                        <p className="max-h-20 overflow-auto rounded bg-neutral-50 p-2 font-mono text-[11px] break-all">{order.ydPixCopyPaste}</p>
                        <CopyButton text={order.ydPixCopyPaste} label="Copiar código Pix" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <ActionButton action={syncYouDrawAction.bind(null, order.id)}>Atualizar status</ActionButton>
                    {order.ydStatus === "pending_payment" && !order.ydPixCopyPaste && (
                      <ActionButton action={generatePixAction.bind(null, order.id)}>Gerar Pix da produção</ActionButton>
                    )}
                    <LinkButton href="https://app.youdraw.com.br" variant="secondary" size="sm" external>
                      Abrir YouDraw
                    </LinkButton>
                  </div>
                </div>
              )}

              {paid && !hasPod && <Notice tone="blue">Nenhum item está vinculado à YouDraw: produção e envio são manuais.</Notice>}

              {order.trackingCode && (
                <p>
                  Rastreio: <strong>{order.trackingCode}</strong>
                  {order.carrier && ` · ${order.carrier}`}{" "}
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="underline">
                      abrir
                    </a>
                  )}
                </p>
              )}

              {paid && order.status !== "canceled" && order.status !== "refunded" && (
                <details className="rounded-md border p-3" open={!order.ydOrderId && !hasPod}>
                  <summary className="cursor-pointer font-medium">Envio manual / rastreio</summary>
                  <div className="mt-3">
                    <ShipForm
                      orderId={order.id}
                      defaults={{ trackingCode: order.trackingCode ?? "", trackingUrl: order.trackingUrl ?? "", carrier: order.carrier ?? "" }}
                    />
                  </div>
                </details>
              )}
            </div>
          </Card>

          <Card title="Histórico">
            <ol className="space-y-3 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-300" />
                  <div>
                    <p>{e.message}</p>
                    <p className="text-xs text-neutral-400">{formatDateTime(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Cliente">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.name}</p>
              <p>
                <a href={`mailto:${order.email}`} className="underline">
                  {order.email}
                </a>
              </p>
              <p>{formatPhone(order.phone)}</p>
              <p className="text-neutral-500">CPF {formatCpf(order.document)}</p>
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">
                  Chamar no WhatsApp
                </a>
              )}
            </div>
            <div className="mt-4 border-t pt-4 text-sm text-neutral-700">
              <p className="mb-1 text-xs font-medium text-neutral-500">Endereço de entrega</p>
              {order.street}, {order.streetNumber}
              {order.complement && ` — ${order.complement}`}
              <br />
              {order.neighborhood} · {order.city}/{order.state}
              <br />
              CEP {formatCep(order.cep)}
            </div>
          </Card>

          <Card title="Pagamento">
            <div className="space-y-1 text-sm">
              <p>
                <Pill tone={paid ? "green" : order.paymentStatus === "refunded" ? "red" : "yellow"}>
                  {paid ? "Pago" : order.paymentStatus === "refunded" ? "Estornado" : "Pendente"}
                </Pill>
              </p>
              {paid && (
                <>
                  <p>
                    {order.captureMethod === "pix" ? "Pix" : order.captureMethod === "credit_card" ? "Cartão de crédito" : order.captureMethod ?? "—"}
                    {order.installments && order.installments > 1 ? ` · ${order.installments}x` : ""}
                  </p>
                  <p className="text-neutral-500">em {formatDateTime(order.paidAt)}</p>
                  {order.transactionNsu && <p className="text-xs text-neutral-400">NSU {order.transactionNsu}</p>}
                  {order.receiptUrl && (
                    <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                      Comprovante
                    </a>
                  )}
                </>
              )}
              {!paid && order.checkoutUrl && (
                <p className="text-xs">
                  Link de pagamento:{" "}
                  <a href={order.checkoutUrl} target="_blank" rel="noreferrer" className="underline">
                    abrir
                  </a>
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {!paid && order.status === "pending_payment" && (
                <ActionButton action={markPaidManuallyAction.bind(null, order.id)} confirm="Confirmar que este pedido foi pago (fora da InfinitePay)?">
                  Marcar como pago
                </ActionButton>
              )}
              {paid && <ActionButton action={resendConfirmationAction.bind(null, order.id)}>Reenviar confirmação</ActionButton>}
            </div>
          </Card>

          <Card title="Status">
            <div className="flex flex-wrap gap-2">
              {paid && order.status === "paid" && (
                <ActionButton action={setStatusAction.bind(null, order.id, "in_production", false)}>Em produção</ActionButton>
              )}
              {paid && order.status !== "delivered" && order.status !== "canceled" && (
                <ActionButton action={setStatusAction.bind(null, order.id, "delivered", true)}>Marcar entregue</ActionButton>
              )}
              {order.status !== "canceled" && order.status !== "delivered" && (
                <ActionButton
                  action={setStatusAction.bind(null, order.id, "canceled", false)}
                  variant="danger"
                  confirm={paid ? "Cancelar este pedido? O estorno do pagamento deve ser feito no app da InfinitePay." : "Cancelar este pedido?"}
                >
                  Cancelar
                </ActionButton>
              )}
              {paid && order.paymentStatus !== "refunded" && (
                <ActionButton
                  action={setStatusAction.bind(null, order.id, "refunded", false)}
                  variant="danger"
                  confirm="Marcar como estornado? (o estorno em si é feito no app/conta web da InfinitePay)"
                >
                  Marcar estornado
                </ActionButton>
              )}
            </div>
          </Card>

          <Card title="Anotações">
            <NoteForm orderId={order.id} note={order.adminNote} />
            {order.customerNote && <p className="mt-3 text-sm text-neutral-600">Cliente: {order.customerNote}</p>}
          </Card>

          <p className="text-center text-xs text-neutral-400">
            <Link href={`/admin/pedidos?q=${encodeURIComponent(order.email)}`} className="underline">
              Outros pedidos deste cliente
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
