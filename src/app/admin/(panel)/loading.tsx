export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando">
      <div className="h-7 w-48 rounded bg-neutral-200" />
      <div className="h-4 w-72 rounded bg-neutral-100" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-lg bg-white ring-1 ring-neutral-200" />
        <div className="h-24 rounded-lg bg-white ring-1 ring-neutral-200" />
        <div className="h-24 rounded-lg bg-white ring-1 ring-neutral-200" />
      </div>
      <div className="h-64 rounded-lg bg-white ring-1 ring-neutral-200" />
    </div>
  );
}
