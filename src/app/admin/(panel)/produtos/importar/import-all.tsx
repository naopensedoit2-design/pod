"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, inputClass } from "@/components/admin/ui";
import { importAllYouDrawProductsAction, type ImportAllResult } from "../actions";

/** Importa de uma vez tudo o que está na YouDraw e ainda não está na loja. */
export function ImportAll() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [price, setPrice] = useState("");
  const [publish, setPublish] = useState(false);
  const [res, setRes] = useState<ImportAllResult | null>(null);
  const cents = Math.round(Number(price.replace(/\./g, "").replace(",", ".")) * 100);
  return (
    <div className="mb-6 rounded-lg border bg-white p-4">
      <p className="text-sm font-medium">Importar tudo de uma vez</p>
      <p className="mt-1 text-xs text-neutral-500">
        Traz todos os produtos ativos da YouDraw que ainda não estão na loja. Os que ainda estão gerando mockup ficam de fora e entram na próxima vez.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs">
          Preço único (R$, opcional)
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="129,90" inputMode="decimal" className={`${inputClass} mt-1 w-32`} />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Já publicar (senão entram como rascunho)
        </label>
        <button
          type="button"
          disabled={pending}
          className={buttonClass("primary", "md")}
          onClick={() =>
            start(async () => {
              setRes(await importAllYouDrawProductsAction({ priceCents: price && cents > 0 ? cents : null, publish }));
              router.refresh();
            })
          }
        >
          {pending ? "Importando… (pode levar alguns minutos)" : "Importar todos"}
        </button>
      </div>
      {res && (
        <div className="mt-3 space-y-1 text-xs">
          <p className="text-green-700">{res.imported.length} importado(s){res.imported.length ? `: ${res.imported.join(", ")}` : ""}</p>
          {res.skipped.length > 0 && <p className="text-amber-700">Ficaram de fora: {res.skipped.join("; ")}</p>}
          {res.failed.map((f) => (
            <p key={f.name} className="text-red-600">Falhou: {f.name} — {f.error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
