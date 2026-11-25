"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cartSubtotal, useCart } from "@/components/store/cart-store";
import { priceLines, type PricingConfig } from "@/components/store/pricing";
import { readUtm, track } from "@/components/store/tracking";
import { cn, formatBRL, formatCep, formatCpf, formatPhone, onlyDigits } from "@/lib/format";
import { checkCouponAction, createOrderAction } from "../actions";

type Form = {
  email: string;
  name: string;
  phone: string;
  document: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const EMPTY: Form = { email: "", name: "", phone: "", document: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

type Quote = { name: string; priceCents: number; days: number | null; free: boolean };
type AppliedCoupon = { code: string; label: string; discountCents: number; freeShipping: boolean };

export function CheckoutForm({ pricing, testMode }: { pricing: PricingConfig; testMode: boolean }) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteState, setQuoteState] = useState<{ loading: boolean; error: string }>({ loading: false, error: "" });
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const loaded = useRef(false);

  const subtotal = cartSubtotal(lines);
  const discount = coupon && !coupon.freeShipping ? coupon.discountCents : 0;
  const shipping = coupon?.freeShipping ? 0 : (quote?.priceCents ?? 0);
  const total = Math.max(0, subtotal - discount + shipping);
  const p = priceLines(total, pricing);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("loja-checkout");
      if (saved) setForm((f) => ({ ...f, ...JSON.parse(saved) }));
    } catch {
      // ignore
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem("loja-checkout", JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "cep") v = formatCep(v);
    if (k === "document") v = formatCpf(v);
    if (k === "phone") v = formatPhone(v);
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: "" }));
  };

  const fetchQuote = useCallback(
    async (cep: string) => {
      if (onlyDigits(cep).length !== 8 || !lines.length) return;
      setQuoteState({ loading: true, error: "" });
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cep: onlyDigits(cep), items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) }),
        });
        const data = await res.json();
        if (data.ok) {
          setQuote(data.quote);
          setQuoteState({ loading: false, error: "" });
        } else {
          setQuote(null);
          setQuoteState({ loading: false, error: data.error ?? "Não foi possível calcular o frete." });
        }
      } catch {
        setQuoteState({ loading: false, error: "Não foi possível calcular o frete." });
      }
    },
    [lines],
  );

  // CEP completo: busca endereço (ViaCEP) e calcula o frete.
  const cepDigits = onlyDigits(form.cep);
  useEffect(() => {
    if (cepDigits.length !== 8) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const d = await r.json();
        if (!cancelled && !d.erro) {
          setForm((f) => ({
            ...f,
            street: d.logradouro || f.street,
            neighborhood: d.bairro || f.neighborhood,
            city: d.localidade || f.city,
            state: d.uf || f.state,
          }));
        }
      } catch {
        // ViaCEP fora do ar: o cliente preenche manualmente
      }
    })();
    void fetchQuote(cepDigits);
    return () => {
      cancelled = true;
    };
  }, [cepDigits, fetchQuote]);

  // Recalcula o cupom quando o carrinho muda.
  useEffect(() => {
    if (!coupon) return;
    let cancelled = false;
    void checkCouponAction(coupon.code, subtotal).then((r) => {
      if (cancelled) return;
      if (r.ok) setCoupon({ code: r.code, label: r.label, discountCents: r.discountCents, freeShipping: r.freeShipping });
      else {
        setCoupon(null);
        setCouponError(r.error);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  async function applyCoupon() {
    setCouponError("");
    if (!couponInput.trim()) return;
    const r = await checkCouponAction(couponInput, subtotal);
    if (r.ok) {
      setCoupon({ code: r.code, label: r.label, discountCents: r.discountCents, freeShipping: r.freeShipping });
      setCouponInput("");
    } else setCouponError(r.error);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length) return;
    setSubmitting(true);
    setFormError("");
    setErrors({});
    track("InitiateCheckout", { value: total, contentIds: lines.map((l) => l.productId) });
    try {
      const res = await createOrderAction({
        ...form,
        couponCode: coupon?.code ?? "",
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        utm: readUtm(),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      try {
        localStorage.setItem("loja-ultimo-pedido", res.token);
      } catch {
        // ignore
      }
      if (res.external) window.location.href = res.redirectUrl;
      else router.push(res.redirectUrl);
    } catch {
      setFormError("Algo deu errado. Tente novamente.");
      setSubmitting(false);
    }
  }

  if (hydrated && lines.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-wide text-xl font-extrabold tracking-[0.12em] uppercase">Seu carrinho está vazio</h1>
        <Link href="/produtos" className="font-wide mt-6 inline-flex h-12 items-center bg-btn px-8 text-xs font-bold tracking-[0.2em] text-btn-ink uppercase">
          Ver produtos
        </Link>
      </div>
    );
  }

  const input = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={props.className}>
      <label htmlFor={k} className="label">
        {label}
      </label>
      <input id={k} name={k} value={form[k]} onChange={set(k)} {...props} className={cn("field", errors[k] && "field-error")} aria-invalid={Boolean(errors[k])} />
      {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-8 lg:grid lg:grid-cols-[1fr_400px] lg:gap-12 lg:py-12" noValidate>
      <div className="space-y-10">
        <div>
          <h1 className="font-wide text-2xl font-extrabold tracking-[0.1em] uppercase">Finalizar compra</h1>
          <p className="mt-1 text-sm text-neutral-500">Compra 100% segura. Você paga no ambiente protegido da InfinitePay.</p>
        </div>

        {formError && (
          <div className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {formError}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="font-wide mb-4 text-sm font-bold tracking-[0.16em] uppercase">1. Seus dados</legend>
          {input("email", "E-mail", { type: "email", autoComplete: "email", required: true, inputMode: "email" })}
          {input("name", "Nome completo", { autoComplete: "name", required: true })}
          <div className="grid gap-4 sm:grid-cols-2">
            {input("document", "CPF", { inputMode: "numeric", required: true, placeholder: "000.000.000-00" })}
            {input("phone", "Celular / WhatsApp", { type: "tel", autoComplete: "tel", inputMode: "tel", required: true, placeholder: "(11) 99999-9999" })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-wide mb-4 text-sm font-bold tracking-[0.16em] uppercase">2. Entrega</legend>
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            {input("cep", "CEP", { inputMode: "numeric", autoComplete: "postal-code", required: true, placeholder: "00000-000" })}
            <div className="hidden sm:block" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            {input("street", "Rua", { autoComplete: "address-line1", required: true })}
            {input("number", "Número", { required: true })}
          </div>
          {input("complement", "Complemento (opcional)", { autoComplete: "address-line2" })}
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_110px]">
            {input("neighborhood", "Bairro", { required: true })}
            {input("city", "Cidade", { autoComplete: "address-level2", required: true })}
            <div>
              <label htmlFor="state" className="label">
                UF
              </label>
              <select id="state" value={form.state} onChange={set("state")} className={cn("field", errors.state && "field-error")}>
                <option value="">—</option>
                {UFS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-wide mb-4 text-sm font-bold tracking-[0.16em] uppercase">3. Frete</legend>
          {cepDigits.length !== 8 ? (
            <p className="text-sm text-neutral-500">Informe o CEP para calcular o frete e o prazo.</p>
          ) : quoteState.loading ? (
            <p className="text-sm text-neutral-500">Calculando frete…</p>
          ) : quoteState.error ? (
            <p className="text-sm text-red-600">{quoteState.error}</p>
          ) : quote ? (
            <div className="flex items-center justify-between border-2 border-black px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{quote.name}</p>
                {quote.days && <p className="text-xs text-neutral-500">Produção + entrega: até {quote.days} dias úteis</p>}
              </div>
              <p className="text-sm font-bold">{quote.free || coupon?.freeShipping ? "Grátis" : formatBRL(quote.priceCents)}</p>
            </div>
          ) : null}
        </fieldset>

        <fieldset>
          <legend className="font-wide mb-4 text-sm font-bold tracking-[0.16em] uppercase">4. Pagamento</legend>
          <div className="space-y-2 bg-neutral-50 p-4 text-sm">
            {pricing.pixDiscountPercent > 0 && (
              <p>
                <strong>Pix com {pricing.pixDiscountPercent}% OFF</strong> — aprovação na hora.
              </p>
            )}
            <p>
              <strong>Cartão de crédito</strong> em até {pricing.maxInstallments}x ({pricing.installmentsNoInterest}x sem juros).
            </p>
            <p className="text-neutral-500">Ao continuar, você vai para o checkout seguro da InfinitePay e volta para cá depois do pagamento.</p>
            {testMode && (
              <p className="mt-2 border border-amber-300 bg-amber-50 p-2 text-amber-900">
                Modo de teste: a InfinitePay ainda não está configurada. O pagamento será simulado.
              </p>
            )}
          </div>
        </fieldset>
      </div>

      <aside className="mt-10 lg:mt-0">
        <div className="border border-neutral-200 p-5 lg:sticky lg:top-24">
          <h2 className="font-wide mb-4 text-sm font-bold tracking-[0.16em] uppercase">Resumo</h2>
          <ul className="divide-y">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 py-3">
                <div className="relative w-14 shrink-0 bg-neutral-100">
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" className="aspect-[3/4] w-full bg-[#ECE9E4] object-contain" />
                  )}
                  <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                    {l.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="text-xs text-neutral-500">{l.variantLabel}</p>
                </div>
                <p className="text-sm font-medium">{formatBRL(l.unitPriceCents * l.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t pt-4">
            {coupon ? (
              <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 text-sm">
                <span>
                  Cupom <strong>{coupon.code}</strong> ({coupon.label})
                </span>
                <button type="button" onClick={() => setCoupon(null)} className="text-xs underline">
                  Remover
                </button>
              </div>
            ) : (
              <div>
                <div className="flex">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    placeholder="Cupom de desconto"
                    aria-label="Cupom de desconto"
                    className="min-w-0 flex-1 border border-neutral-300 px-3 py-2 text-sm uppercase outline-none focus:border-black"
                  />
                  <button type="button" onClick={applyCoupon} className="bg-neutral-900 px-4 text-xs font-bold tracking-wider text-white uppercase">
                    Aplicar
                  </button>
                </div>
                {couponError && <p className="mt-1 text-xs text-red-600">{couponError}</p>}
              </div>
            )}
          </div>

          <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Desconto</dt>
                <dd>− {formatBRL(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-600">Frete</dt>
              <dd>{cepDigits.length !== 8 || !quote ? "—" : shipping === 0 ? "Grátis" : formatBRL(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatBRL(total)}</dd>
            </div>
            {p.hasPix && (
              <p className="text-right text-sm">
                ou <strong>{formatBRL(p.pix)}</strong> no Pix
              </p>
            )}
            <p className="text-right text-xs text-neutral-500">{p.installmentLabel}</p>
          </dl>

          <button
            type="submit"
            disabled={submitting || !hydrated || !lines.length}
            className="font-wide mt-5 flex h-[52px] w-full items-center justify-center bg-btn text-sm font-bold tracking-[0.2em] text-btn-ink uppercase transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Abrindo pagamento…" : "Ir para o pagamento"}
          </button>
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Ao finalizar você concorda com nossos{" "}
            <Link href="/p/termos-de-uso" className="underline">
              termos
            </Link>{" "}
            e a{" "}
            <Link href="/p/trocas-e-devolucoes" className="underline">
              política de trocas
            </Link>
            .
          </p>
        </div>
      </aside>
    </form>
  );
}
