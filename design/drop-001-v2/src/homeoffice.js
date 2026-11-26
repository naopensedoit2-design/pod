// Vaga 4 — "Home office desde 1893." com o *Caipira picando fumo* (Almeida Júnior, 1893, domínio público).
// Costas, baixo. Recorte justo de borda dura (src/caipira_cut.py): o homem, a tábua do banco cortada reta nas estacas
// e uma faixa reta do chão da pintura sob os pés. Malha Chocolate.
// A frase continua o banco: a base de "desde 1893." fica na altura do assento; o crédito fica na linha da base do chão.
// Uso: [PXMM=4] node src/homeoffice.js A|B      (A: figura à esquerda, frase à direita; B: espelhado)
const fs = require("fs");
const path = require("path");
const C = require("./common.js");

const FIG = path.join(C.ROOT, "work/caipira-hard.png");
const GEO = JSON.parse(fs.readFileSync(path.join(C.ROOT, "work/caipira-geo.json"), "utf8"));
const CREAM = "#F1E6CF";
const PX_MM = 11.97; // escala da pintura na peça (~304 DPI): o homem fica com o mesmo tamanho da versão anterior
const variant = process.argv[2] || "A";

(async () => {
  const figW = GEO.w_px / PX_MM, figH = GEO.h_px / PX_MM;
  const gap = 14, W = Math.max(330, figW + 150), H = figH;
  const left = variant !== "B";
  const fx = left ? 0 : W - figW;
  let body = (await C.imageEl(FIG, fx, 0, figW)).svg;

  const tx = left ? figW + gap : 0, tw = W - figW - gap;
  const size = C.sizeFor("im-fell-english", 400, "Home office", tw);
  const base2 = GEO.assento * figH;             // base de "desde 1893." = topo do assento
  const base1 = base2 - size * 0.95;
  const a = C.textMM("im-fell-english", 400, "Home office", { x: tx, y: base1, size });
  const b = C.textMM("im-fell-english", 400, "desde 1893.", { x: tx, y: base2, size });
  const credit = C.richMM("im-fell-english", 400, [["Almeida Júnior, ", "normal"], ["Caipira picando fumo", "italic"]],
    { x: tx, y: H - 0.6, size: 5.4 });         // linha de base do crédito = base da faixa de chão
  body += `<g fill="${CREAM}"><path d="${a.d}"/><path d="${b.d}"/><path d="${credit.d}"/></g>`;

  // margem de 1,5 mm: a ponta do banco e o cabelo encostam na borda do recorte; o render corta a sobra depois
  const M = 1.5;
  const r = await C.render(C.svgDoc(W + 2 * M, H + 2 * M, `<g transform="translate(${M} ${M})">${body}</g>`),
    C.out(`homeoffice-${variant}.png`));
  console.log(variant, r.file, `${(W / 10).toFixed(1)} x ${(H / 10).toFixed(1)} cm`, `fonte ${size.toFixed(1)} mm`,
    `assento a ${base2.toFixed(1)} mm do topo`);
})().catch((e) => { console.error(e); process.exit(1); });
