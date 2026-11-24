import { onlyDigits } from "@/lib/format";

/** Botão flutuante "Ajuda" (WhatsApp), como na referência. */
export function HelpButton({ whatsapp, storeName }: { whatsapp: string; storeName: string }) {
  const digits = onlyDigits(whatsapp);
  if (!digits) return null;
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const text = encodeURIComponent(`Olá! Vim pelo site da ${storeName} e preciso de ajuda.`);
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-bold shadow-[0_4px_20px_rgba(0,0,0,0.18)] transition hover:scale-105"
    >
      Ajuda
    </a>
  );
}
