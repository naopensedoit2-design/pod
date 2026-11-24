"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "./ui";

type Result = { ok: boolean; message: string } | null | void;

/** Botão que chama uma server action e mostra o resultado. */
export function ActionButton({
  action,
  children,
  variant = "secondary",
  size = "sm",
  confirm,
  className,
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "brand";
  size?: "sm" | "md";
  confirm?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <span className={className}>
      <button
        type="button"
        disabled={pending}
        className={buttonClass(variant, size)}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            try {
              const r = await action();
              setResult(r ?? null);
            } catch (err) {
              setResult({ ok: false, message: (err as Error).message || "Erro inesperado." });
            }
          });
        }}
      >
        {pending ? "Aguarde…" : children}
      </button>
      {result && <span className={`ml-2 text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.message}</span>}
    </span>
  );
}

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass("secondary", "sm")}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Copiado!" : label}
    </button>
  );
}
