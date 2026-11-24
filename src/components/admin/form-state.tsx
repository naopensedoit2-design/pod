"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { buttonClass } from "./ui";

type Result = { ok: boolean; message: string } | null;

/** Formulário simples ligado a uma server action (prev, formData) com mensagem de retorno. */
export function ActionForm({
  action,
  children,
  submitLabel = "Salvar",
  className,
  resetOnSuccess = false,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div className="mt-4 flex items-center gap-3">
        <button disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        {state && <span className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
