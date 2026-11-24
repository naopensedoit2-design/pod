"use client";

import { useActionState } from "react";
import { trackOrderAction } from "../actions";

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrderAction, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="number" className="label">
          Número do pedido
        </label>
        <input id="number" name="number" inputMode="numeric" required placeholder="1001" className="field" />
      </div>
      <div>
        <label htmlFor="email" className="label">
          E-mail
        </label>
        <input id="email" name="email" type="email" required className="field" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="font-wide flex h-12 w-full items-center justify-center bg-btn text-xs font-bold tracking-[0.2em] text-btn-ink uppercase disabled:opacity-60"
      >
        {pending ? "Buscando…" : "Ver pedido"}
      </button>
    </form>
  );
}
