"use client";

import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/admin/ui";
import { markShippedAction, saveNoteAction } from "../actions";

export function ShipForm({ orderId, defaults }: { orderId: number; defaults: { trackingCode: string; trackingUrl: string; carrier: string } }) {
  const [state, action, pending] = useActionState(markShippedAction.bind(null, orderId), null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="trackingCode" defaultValue={defaults.trackingCode} placeholder="Código de rastreio" className={inputClass} />
        <input name="carrier" defaultValue={defaults.carrier} placeholder="Transportadora (ex.: Correios)" className={inputClass} />
      </div>
      <input name="trackingUrl" defaultValue={defaults.trackingUrl} placeholder="Link de rastreio (opcional)" className={inputClass} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="notify" defaultChecked /> Avisar o cliente por e-mail
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Salvando…" : "Marcar como enviado"}
        </button>
        {state && <span className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}

export function NoteForm({ orderId, note }: { orderId: number; note: string }) {
  const [state, action, pending] = useActionState(saveNoteAction.bind(null, orderId), null);
  return (
    <form action={action} className="space-y-2">
      <textarea name="adminNote" defaultValue={note} rows={3} placeholder="Anotações internas (o cliente não vê)" className={inputClass} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className={buttonClass("secondary", "sm")}>
          Salvar anotação
        </button>
        {state && <span className="text-xs text-emerald-700">{state.message}</span>}
      </div>
    </form>
  );
}
