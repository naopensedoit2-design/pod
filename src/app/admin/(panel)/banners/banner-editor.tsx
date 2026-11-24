"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { ImageField } from "@/components/admin/image-upload";
import { Field, buttonClass, inputClass } from "@/components/admin/ui";
import { deleteBannerAction, saveBannerAction, type BannerInput } from "../content-actions";

export function BannerEditor({ initial }: { initial: BannerInput }) {
  const [b, setB] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const set = <K extends keyof BannerInput>(k: K, v: BannerInput[K]) => setB((x) => ({ ...x, [k]: v }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Chamada pequena (opcional)">
            <input value={b.eyebrow ?? ""} onChange={(e) => set("eyebrow", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Título">
            <input value={b.title ?? ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Subtítulo" className="sm:col-span-2">
            <input value={b.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Texto do link">
            <input value={b.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="acesse" className={inputClass} />
          </Field>
          <Field label="Link (para onde vai)">
            <input value={b.href ?? ""} onChange={(e) => set("href", e.target.value)} placeholder="/produtos?ofertas=1" className={inputClass} />
          </Field>
          <Field label="Cor de fundo">
            <input type="color" value={b.bgColor ?? "#C4252F"} onChange={(e) => set("bgColor", e.target.value)} className="h-10 w-full cursor-pointer rounded border" />
          </Field>
          <Field label="Cor do texto">
            <input type="color" value={b.textColor ?? "#FFFFFF"} onChange={(e) => set("textColor", e.target.value)} className="h-10 w-full cursor-pointer rounded border" />
          </Field>
        </div>
        <ImageField
          label="Imagem para computador (opcional)"
          hint="Proporção 16:6, ex.: 1920×720. Com imagem, o texto acima não aparece (coloque-o na arte)."
          value={b.imageDesktop ?? null}
          onChange={(v) => set("imageDesktop", v)}
        />
        <ImageField label="Imagem para celular (opcional)" hint="Proporção 4:5, ex.: 1080×1350." value={b.imageMobile ?? null} onChange={(v) => set("imageMobile", v)} />
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={b.isActive ?? true} onChange={(e) => set("isActive", e.target.checked)} /> Ativo
          </label>
          <label className="flex items-center gap-2 text-sm">
            Ordem
            <input type="number" value={b.sortOrder ?? 0} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} className={`${inputClass} w-20`} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            className={buttonClass("primary", "sm")}
            onClick={() =>
              start(async () => {
                const r = await saveBannerAction(b);
                setMsg(r);
                if (r?.ok && !b.id) setB(initial);
              })
            }
          >
            {pending ? "Salvando…" : b.id ? "Salvar banner" : "Criar banner"}
          </button>
          {b.id && (
            <ActionButton action={deleteBannerAction.bind(null, b.id)} variant="danger" confirm="Excluir este banner?">
              Excluir
            </ActionButton>
          )}
          {msg && <span className={`text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.message}</span>}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-neutral-700">Prévia</p>
        <div className="flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded px-5 text-center" style={{ background: b.bgColor, color: b.textColor }}>
          {b.imageMobile || b.imageDesktop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(b.imageMobile || b.imageDesktop)!} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              {b.eyebrow && <p className="text-[9px] tracking-[0.3em] uppercase opacity-70">{b.eyebrow}</p>}
              <p className="mt-2 text-xl leading-tight font-bold">{b.title || "Título"}</p>
              {b.subtitle && <p className="mt-2 text-xs opacity-85">{b.subtitle}</p>}
              {b.ctaLabel && <p className="mt-3 text-sm underline">{b.ctaLabel}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
