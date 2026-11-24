"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/app/(store)/actions";
import { cn } from "@/lib/format";
import { track } from "./tracking";

export function NewsletterForm({ source = "newsletter", dark = false }: { source?: string; dark?: boolean }) {
  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await subscribeAction(prev, fd);
    if (res.ok) track("Lead");
    return res;
  }, null);

  if (state?.ok) {
    return (
      <div className={cn("animate-fade-in border-2 px-5 py-4 text-sm", dark ? "border-cream text-cream" : "border-black")}>
        {state.message}
      </div>
    );
  }
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="source" value={source} />
      <div className={cn("flex border-2", dark ? "border-cream" : "border-black")}>
        <input
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          aria-label="Seu e-mail"
          className={cn(
            "min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none",
            dark ? "text-cream placeholder:text-cream/60" : "placeholder:text-neutral-400",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "font-wide shrink-0 px-5 text-[11px] font-bold tracking-[0.2em] uppercase transition disabled:opacity-60",
            dark ? "bg-cream text-black" : "bg-black text-white",
          )}
        >
          {pending ? "..." : "Entrar"}
        </button>
      </div>
      {state && !state.ok && <p className="mt-2 text-xs text-red-500">{state.message}</p>}
    </form>
  );
}
