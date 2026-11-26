// Vaga 3 — "Sossega." sentada onde estaria o cavaleiro de *Whistlejacket* (George Stubbs, 1762, domínio público).
// Letra de placa pintada com sombreado, como nos letreiros de bar. Estampa de FRENTE, malha Verde Militar.
// Uso: [PXMM=4] node src/sossega.js A|B|C
const path = require("path");
const C = require("./common.js");
const { mm } = C;

const HORSE = path.join(C.ROOT, "work/wj-hardfull.png"); // 3494 x 3227 px, borda dura em toda a volta
const CREAM = "#F1E6CF";
const SHADE = "#24140F"; // sombreado em bloco, marrom quase preto (lê sobre o alazão)
const variant = process.argv[2] || "A";

(async () => {
  const cfg = {
    A: { font: "mr-dafoe", hw: 260, word: 0.50, cx: 0.37, base: 0.352, rot: -5, shade: 0.09, mane: [[118, 50], [150, 50], [150, 68], [118, 67]] },
    B: { font: "ultra", hw: 260, word: 0.40, cx: 0.36, base: 0.345, rot: -3, shade: 0.09, mane: [[138, 38], [162, 38], [162, 88], [138, 88]] },
    C: { font: "mr-dafoe", hw: 280, word: 0.66, cx: 0.45, base: 0.35, rot: -6, shade: 0.09, mane: [[18, 101], [44, 98], [60, 96], [64, 116], [18, 120]] },
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
  // sombra em bloco (extrusão): várias cópias ao longo da diagonal, como o letreiro pintado
  let block = "";
  const steps = Math.max(6, Math.round(mm(off) / 2));
  for (let i = steps; i >= 1; i--) block += `<path d="${t.d}" transform="translate(${mm((off * i) / steps)} ${mm((off * i) / steps)})"/>`;
  body += `<g transform="${rot}"><g fill="${SHADE}">${block}</g><path d="${t.d}" fill="${CREAM}"/></g>`;
  // a cauda passa por cima da laçada do "S": o cavalo toca a palavra (região em mm da arte)
  const mane = C.poly(cfg.mane); // em mm da arte
  body += `<defs><clipPath id="crina"><polygon points="${mane}"/></clipPath></defs>` + (await C.imageEl(HORSE, hx, hy, cfg.hw, 'clip-path="url(#crina)"')).svg;
  if (process.env.DEBUG) {
    body += `<polygon points="${mane}" fill="none" stroke="#ff0" stroke-width="${mm(0.8)}"/>`;
    t.glyphs.forEach((g) => { if (g.bbox) body += `<g transform="${rot}"><rect x="${g.bbox.x1}" y="${g.bbox.y1}" width="${g.bbox.x2 - g.bbox.x1}" height="${g.bbox.y2 - g.bbox.y1}" fill="none" stroke="#f0f" stroke-width="${mm(0.5)}"/></g>`; });
  }
  const cr = C.richMM("im-fell-english", 400, [["Whistlejacket, George Stubbs, 1762", "normal"]], { x: W - 6, y: H - 4, size: 5.4, anchor: "end" });
  body += `<path d="${cr.d}" fill="${CREAM}"/>`;
  const r = await C.render(C.svgDoc(W, H, body), C.out(`sossega-${variant}.png`));
  console.log(variant, "palavra", ww.toFixed(0), "mm; altura", capH.toFixed(0), "mm", r.file);
})().catch((e) => { console.error(e); process.exit(1); });
