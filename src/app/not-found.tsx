import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-wide text-[11px] tracking-[0.3em] text-brand uppercase">✦ Erro 404 ✦</p>
      <h1 className="font-wide mt-3 text-3xl font-extrabold tracking-[0.08em] uppercase">Página não encontrada</h1>
      <p className="mt-2 text-sm text-neutral-600">Chegou atrasado? Faz parte. Mas esta página não existe.</p>
      <Link href="/" className="font-wide mt-8 inline-flex h-12 items-center bg-btn px-8 text-xs font-bold tracking-[0.2em] text-btn-ink uppercase">
        Voltar para a loja
      </Link>
    </div>
  );
}
