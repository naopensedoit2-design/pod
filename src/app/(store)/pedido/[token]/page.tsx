import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isEmailConfigured } from "@/lib/email";
import { isPaymentTestMode } from "@/lib/infinitepay";
import { getSettings } from "@/lib/settings";
import { cn, formatBRL, formatCep, formatDateTime } from "@/lib/format";
import { simulatePaymentAction } from "../../actions";
import { OrderClientEffects } from "./order-effects";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

const STEPS = [
  { key: "pending_payment", label: "Pedido recebido" },
  { key: "paid", label: "Pagamento aprovado" },
  { key: "in_production", label: "Em produção" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregue" },
];

async function OrderContent({ params }: { params: PageProps<"/pedido/[token]">["params"] }) {
  const { token } = await params;
  const order = await db.query.orders.findFirst({ where: eq(orders.token, token), with: { items: true } });
  if (!order) notFound();
  const settings = await getSettings();
  const testMode = isPaymentTestMode(settings);
  const paid = order.paymentStatus === "paid";
  const canceled = order.status === "canceled" || order.status === "refunded";
  const current = Math.max(0, STEPS.findIndex((s) => s.key === order.status));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
      <OrderClientEffects token={order.token} paid={paid} totalCents={order.paidAmountCents ?? order.totalCents} />
      <p className="font-wide text-[11px] tracking-[0.24em] text-neutral-500 uppercase">Pedido #{order.number}</p>
      <h1 className="font-wide mt-2 text-2xl font-extrabold tracking-[0.08em] uppercase lg:text-3xl">
        {canceled ? "Pedido cancelado" : paid ? `Valeu, ${order.name.split(" ")[0]}!` : "Aguardando pagamento"}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {canceled
          ? "Este pedido foi cancelado. Se tiver dúvidas, fale com a gente."
          : paid
            ? isEmailConfigured()
              ? `Pagamento aprovado. Enviamos a confirmação para ${order.email}. Sua peça é produzida sob demanda e você recebe o rastreio por e-mail assim que ela for enviada.`
              : `Pagamento aprovado. Sua peça é produzida sob demanda. Guarde o número do pedido (#${order.number}): com ele e seu e-mail você acompanha tudo em “Rastreie seu pedido”.`
            : "Assim que o pagamento for aprovado, esta página é atualizada automaticamente."}
      </p>

      {!paid && !canceled && (
        <div className="mt-6 space-y-3">
          {order.checkoutUrl && (
            <a href={order.checkoutUrl} className="font-wide inline-flex h-12 items-center bg-btn px-8 text-xs font-bold tracking-[0.2em] text-btn-ink uppercase">
              Pagar agora
            </a>
          )}
          {testMode && (
            <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Modo de teste</p>
              <p className="mt-1">A InfinitePay ainda não está configurada. Simule a aprovação para testar o fluxo completo (e-mails, painel e produção).</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={simulatePaymentAction.bind(null, order.token, "pix")}>
                  <button className="bg-black px-4 py-2 text-xs font-bold tracking-wider text-white uppercase">Simular Pix aprovado</button>
                </form>
                <form action={simulatePaymentAction.bind(null, order.token, "credit_card")}>
                  <button className="border border-black px-4 py-2 text-xs font-bold tracking-wider uppercase">Simular cartão aprovado</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {!canceled && (
        <ol className="mt-10 grid grid-cols-5 gap-1">
          {STEPS.map((s, i) => (
            <li key={s.key} className="text-center">
              <div className={cn("h-1.5", i <= current ? "bg-brand" : "bg-neutral-200")} />
              <p className={cn("mt-2 text-[10px] leading-tight tracking-wide uppercase sm:text-[11px]", i <= current ? "font-bold text-black" : "text-neutral-400")}>
                {s.label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {order.trackingCode && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-2 border-black p-4">
          <div>
            <p className="text-xs tracking-wider text-neutral-500 uppercase">Código de rastreio{order.carrier ? ` · ${order.carrier}` : ""}</p>
            <p className="mt-1 text-lg font-bold tracking-wider">{order.trackingCode}</p>
          </div>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="font-wide bg-black px-5 py-3 text-xs font-bold tracking-[0.18em] text-white uppercase">
              Rastrear
            </a>
          )}
        </div>
      )}

      <section className="mt-10 border-t pt-6">
        <h2 className="font-wide mb-4 text-sm font-bold tracking-[0.16em] uppercase">Itens</h2>
        <ul className="divide-y">
          {order.items.map((it) => (
            <li key={it.id} className="flex gap-4 py-3">
              <div className="w-16 shrink-0 bg-neutral-100">
                {it.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="aspect-[3/4] w-full bg-[#ECE9E4] object-contain" />
                )}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{it.title}</p>
                <p className="text-neutral-500">
                  {it.variantLabel} · {it.quantity}x
                </p>
              </div>
              <p className="text-sm font-medium">{formatBRL(it.totalCents)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Subtotal</dt>
            <dd>{formatBRL(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-neutral-600">Desconto {order.couponCode && `(${order.couponCode})`}</dt>
              <dd>− {formatBRL(order.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-neutral-600">Frete</dt>
            <dd>{order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total{paid && order.paidAmountCents && order.paidAmountCents !== order.totalCents ? " pago" : ""}</dt>
            <dd>{formatBRL(paid ? (order.paidAmountCents ?? order.totalCents) : order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8 grid gap-6 border-t pt-6 text-sm sm:grid-cols-2">
        <div>
          <h2 className="font-wide mb-2 text-xs font-bold tracking-[0.16em] uppercase">Entrega</h2>
          <p className="text-neutral-700">
            {order.name}
            <br />
            {order.street}, {order.streetNumber}
            {order.complement && ` — ${order.complement}`}
            <br />
            {order.neighborhood} · {order.city}/{order.state}
            <br />
            CEP {formatCep(order.cep)}
          </p>
          {order.shippingDays && <p className="mt-2 text-neutral-500">Prazo estimado: até {order.shippingDays} dias úteis após a aprovação.</p>}
        </div>
        <div>
          <h2 className="font-wide mb-2 text-xs font-bold tracking-[0.16em] uppercase">Pagamento</h2>
          <p className="text-neutral-700">
            {paid ? (
              <>
                {order.captureMethod === "pix" ? "Pix" : order.captureMethod === "credit_card" ? "Cartão de crédito" : "Aprovado"}
                {order.installments && order.installments > 1 ? ` em ${order.installments}x` : ""}
                <br />
                Aprovado em {formatDateTime(order.paidAt)}
              </>
            ) : (
              "Pendente"
            )}
          </p>
          {order.receiptUrl && (
            <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block underline">
              Ver comprovante
            </a>
          )}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-4 border-t pt-6">
        <Link href="/produtos" className="font-wide inline-flex h-12 items-center bg-btn px-8 text-xs font-bold tracking-[0.2em] text-btn-ink uppercase">
          Continuar comprando
        </Link>
        <Link href="/p/trocas-e-devolucoes" className="inline-flex h-12 items-center text-sm underline">
          Trocas e devoluções
        </Link>
      </div>
    </div>
  );
}

export default function OrderPage(props: PageProps<"/pedido/[token]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-14">
          <div className="h-8 w-1/2 animate-pulse bg-neutral-100" />
          <div className="mt-4 h-4 w-3/4 animate-pulse bg-neutral-100" />
        </div>
      }
    >
      <OrderContent params={props.params} />
    </Suspense>
  );
}
