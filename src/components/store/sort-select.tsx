"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "", label: "Destaques" },
  { value: "mais-vendidos", label: "Mais vendidos" },
  { value: "novidades", label: "Novidades" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-xs tracking-wide text-neutral-600">
      <span className="font-wide hidden tracking-[0.14em] uppercase sm:inline">Ordenar</span>
      <select
        value={params.get("ordem") ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set("ordem", e.target.value);
          else next.delete("ordem");
          router.push(`${pathname}${next.size ? `?${next}` : ""}`);
        }}
        className="border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
