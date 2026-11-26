// Vaga 4 — "Home office desde 1893." com o *Caipira picando fumo* (Almeida Júnior, 1893, domínio público).
// Costas, na barra: a figura com os pés no "chão" (a arte termina ~5 cm acima da bainha). Malha Chocolate.
// Uso: [PXMM=4] node src/homeoffice.js A|B|C
const path = require("path");
const C = require("./common.js");
const { mm } = C;

const FIG = path.join(C.ROOT, "work/caipira-sil-ht.png"); // silhueta com o banco, retícula na borda
const CREAM = "#F1E6CF";
const variant = process.argv[2] || "A";

(async () => {
  let body = "", W, H;
  const fh = 280; // altura da figura em mm
  const info = await C.L.imgInfo(FIG);
  const figW = (fh * info.w) / info.h;
  const line1 = "Home office", line2 = "desde 1893.";
  const credit = "Almeida Júnior, Caipira picando fumo";
  if (variant === "A" || variant === "B") {
    // figura de um lado, frase do outro, alinhada à altura da cabeça
    W = Math.max(330, figW + 150); H = fh;
    const left = variant === "A";
    const fx = left ? 0 : W - figW;
    body += (await C.imageEl(FIG, fx, 0, figW)).svg;
    const tx = left ? figW + 14 : 0, tw = W - figW - 14;
    const size = C.sizeFor("im-fell-english", 400, line1, tw);
    const y1 = 0.30 * H;
    const a = C.textMM("im-fell-english", 400, line1, { x: tx, y: y1, size });
    const b = C.textMM("im-fell-english", 400, line2, { x: tx, y: y1 + size * 0.95, size });
    const c = C.richMM("im-fell-english", 400, [["Almeida Júnior, ", "normal"], ["Caipira picando fumo", "italic"]], { x: tx, y: y1 + size * 0.95 + 14, size: 5.4 });
    body += `<g fill="${CREAM}"><path d="${a.d}"/><path d="${b.d}"/><path d="${c.d}"/></g>`;
  } else {
    // C: frase numa linha só, pequena, na mesma linha do chão, ao lado dos pés
    W = 330; H = fh;
    const fx = 10;
    body += (await C.imageEl(FIG, fx, 0, figW)).svg;
    const tx = fx + figW + 10;
    const size = C.sizeFor("im-fell-english", 400, `${line1} ${line2}`, W - tx);
    const a = C.textMM("im-fell-english", 400, `${line1} ${line2}`, { x: tx, y: H - 12, size });
    const c = C.richMM("im-fell-english", 400, [["Almeida Júnior, ", "normal"], ["Caipira picando fumo", "italic"]], { x: tx, y: H - 3, size: 5.4 });
    body += `<g fill="${CREAM}"><path d="${a.d}"/><path d="${c.d}"/></g>`;
  }
  const r = await C.render(C.svgDoc(W, H + 2, body), C.out(`homeoffice-${variant}.png`));
  console.log(variant, r.file);
})().catch((e) => { console.error(e); process.exit(1); });
