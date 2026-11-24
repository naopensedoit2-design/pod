"use client";

import { useRef, useState } from "react";
import { uploadImageAction } from "@/app/admin/upload-action";
import { buttonClass, inputClass } from "./ui";

const MAX_DIRECT = 3.5 * 1024 * 1024;

/** Reduz fotos grandes no navegador antes de enviar (limite de upload da hospedagem). */
async function shrink(file: File): Promise<File> {
  if (file.type === "image/svg+xml" || file.size <= MAX_DIRECT) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao processar imagem"))), "image/webp", 0.9),
  );
  return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: blob.type || "image/webp" });
}

export async function uploadFiles(files: File[]): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];
  for (const f of files) {
    try {
      const small = await shrink(f);
      const fd = new FormData();
      fd.set("file", small);
      const res = await uploadImageAction(fd);
      if (res.ok) urls.push(res.url);
      else errors.push(`${f.name}: ${res.error}`);
    } catch (err) {
      errors.push(`${f.name}: ${(err as Error).message}`);
    }
  }
  return { urls, errors };
}

export function UploadButton({
  onUploaded,
  multiple = false,
  label = "Enviar imagem",
  accept = "image/*",
}: {
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
  accept?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col">
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={buttonClass("secondary", "sm")}>
        {busy ? "Enviando…" : label}
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          setError("");
          const { urls, errors } = await uploadFiles(files);
          setBusy(false);
          if (errors.length) setError(errors.join(" · "));
          if (urls.length) onUploaded(urls);
        }}
      />
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}

/** Campo de uma imagem: prévia + enviar + colar URL + remover. */
export function ImageField({ value, onChange, label, hint, previewClass = "h-24" }: { value: string | null; onChange: (url: string | null) => void; label: string; hint?: string; previewClass?: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-neutral-700">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        <div className={`flex min-w-24 items-center justify-center overflow-hidden rounded border border-dashed border-neutral-300 bg-neutral-50 ${previewClass}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-auto max-w-[240px] object-contain" />
          ) : (
            <span className="px-3 text-xs text-neutral-400">sem imagem</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <UploadButton onUploaded={(urls) => onChange(urls[0])} />
            {value && (
              <button type="button" onClick={() => onChange(null)} className={buttonClass("danger", "sm")}>
                Remover
              </button>
            )}
          </div>
          <input value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder="ou cole a URL da imagem" className={inputClass} />
          {hint && <p className="text-xs text-neutral-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
