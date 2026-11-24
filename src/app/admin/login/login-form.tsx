"use client";

import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/admin/ui";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-5 space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-neutral-700">E-mail</span>
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-neutral-700">Senha</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className={buttonClass("primary") + " w-full"}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
