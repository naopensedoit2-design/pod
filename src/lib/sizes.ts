const SIZE_ORDER = ["RN", "PP", "P", "M", "G", "GG", "XG", "XGG", "EXG", "G1", "G2", "G3", "U", "ÚNICO", "UNICO"];

/** Ordena tamanhos de forma natural (PP, P, M, G, GG... e numéricos). */
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    const na = Number.parseFloat(a);
    const nb = Number.parseFloat(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b, "pt-BR");
  });
}
