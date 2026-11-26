// Vaga 3 — "Sossega." sentada onde estaria o cavaleiro de *Whistlejacket* (George Stubbs, 1762, domínio público).
// Letra de placa pintada com sombreado, como nos letreiros de bar. Estampa de FRENTE, malha Verde Militar.
// Uso: [PXMM=4] node src/sossega.js A|B|C
const path = require("path");
const C = require("./common.js");
const { mm } = C;

const HORSE = path.join(C.ROOT, "work/wj-ht.png"); // 3518 x 3256 px
const CREAM = "#F1E6CF";
const SHADE = "#6E2620"; // sombreado bordô, de letreiro
const variant = process.argv[2] || "A";

(async () => {
  const cfg = {
    A: { font: "mr-dafoe", hw: 260, word: 0.50, cx: 0.37, base: 0.352, rot: -5, shade: 0.06 },
    B: { font: "ultra", hw: 260, word: 0.40, cx: 0.36, base: 0.345, rot: -3, shade: 0.07 },
    C: { font: "mr-dafoe", hw: 280, word: 0.66, cx: 0.45, base: 0.35, rot: -6, shade: 0.06 },
  }[variant];
  const hx = 8, hy = 34; // margem de cima para a palavra que sobra acima do dorso
  const horse = await C.imageEl(HORSE, hx, hy, cfg.hw);
  const hh = horse.h;
  const W = cfg.hw + 16, H = hy + hh + 14;
  const ww = cfg.hw * cfg.word;
  const size = C.sizeFor(cfg.font, 400, "Sossega.", ww);
  const cx = hx + cfg.cx * cfg.hw, by = hy + cfg.base * hh;
  const t = C.textMM(cfg.font, 400, "Sossega.", { x: cx, y: by, size, anchor: "middle" });
  const capH = t.bbox.y2 - t.bbox.y1;
  const off = capH * cfg.shade; // sombreado para baixo e para a direita
  const rot = `rotate(${cfg.rot} ${mm(cx)} ${mm(by)})`;
  let body = horse.svg;
  body += `<g transform="${rot}"><path d="${t.d}" fill="${SHADE}" transform="translate(${mm(off)} ${mm(off)})"/><path d="${t.d}" fill="${CREAM}"/></g>`;
  const cr = C.richMM("im-fell-english", 400, [["Whistlejacket, George Stubbs, 1762", "normal"]], { x: W - 6, y: H - 4, size: 5.4, anchor: "end" });
  body += `<path d="${cr.d}" fill="${CREAM}"/>`;
  const r = await C.render(C.svgDoc(W, H, body), C.out(`sossega-${variant}.png`));
  console.log(variant, "palavra", ww.toFixed(0), "mm; altura", capH.toFixed(0), "mm", r.file);
})().catch((e) => { console.error(e); process.exit(1); });
