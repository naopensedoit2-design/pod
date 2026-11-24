"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/store/cart-store";
import { track } from "@/components/store/tracking";

/** Limpa o carrinho do pedido recém-criado, dispara o evento de compra e atualiza a página enquanto o pagamento não chega. */
export function OrderClientEffects({ token, paid, totalCents }: { token: string; paid: boolean; totalCents: number }) {
  const router = useRouter();
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    try {
      if (localStorage.getItem("loja-ultimo-pedido") === token) {
        void useCart.persist.rehydrate();
        clear();
        localStorage.removeItem("loja-ultimo-pedido");
      }
    } catch {
      // ignore
    }
  }, [token, clear]);

  useEffect(() => {
    if (!paid) return;
    try {
      const key = `loja-compra-${token}`;
      if (!localStorage.getItem(key)) {
        track("Purchase", { value: totalCents });
        localStorage.setItem(key, "1");
      }
    } catch {
      // ignore
    }
  }, [paid, token, totalCents]);

  useEffect(() => {
    if (paid) return;
    const id = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(id);
  }, [paid, router]);

  return null;
}
