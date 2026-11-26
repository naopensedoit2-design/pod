// Utilidades da prova: medidas em mm, escala por variável de ambiente (PXMM) para esboço rápido ou arte final.
//   PXMM=4  node src/calma.js A   -> esboço (~100 DPI)
//   node src/calma.js A           -> arte final a 300 DPI
const path = require("path");
const fs = require("fs");
const L = require("../../tools/lib.js");
const F = require("../../tools/flourish.js");

const PXMM = +(process.env.PXMM || 300 / 25.4);
const mm = (v) => v * PXMM;
const ROOT = path.join(__dirname, "..");
const out = (name) => path.join(ROOT, PXMM < 10 ? "sketch" : "final", name);
fs.mkdirSync(path.join(ROOT, "sketch"), { recursive: true });
fs.mkdirSync(path.join(ROOT, "final"), { recursive: true });

/** Imagem raster posicionada em mm (largura em mm; altura pela proporção). */
async function imageEl(file, x, y, w, extra = "") {
  const { w: iw, h: ih } = await L.imgInfo(file);
  const h = (w * ih) / iw;
  return { svg: `<image href="${L.b64(file)}" x="${mm(x)}" y="${mm(y)}" width="${mm(w)}" height="${mm(h)}" preserveAspectRatio="none" ${extra}/>`, w, h };
}

/** Texto em mm: devolve o path já posicionado e as medidas em mm. */
function textMM(font, weight, str, { x = 0, y = 0, size = 10, tracking = 0, anchor = "start", style = "normal" } = {}) {
  const f = L.T.font(font, weight, style);
  const t = L.T.text(f, str, { x: mm(x), y: mm(y), size: mm(size), tracking, anchor });
  const miss = L.T.missingGlyphs(f, str);
  if (miss.length) console.warn(`ATENÇÃO: ${font} não tem ${miss.join(" ")}`);
  return { d: t.d, width: t.width / PXMM, bbox: { x1: t.bbox.x1 / PXMM, y1: t.bbox.y1 / PXMM, x2: t.bbox.x2 / PXMM, y2: t.bbox.y2 / PXMM }, glyphs: t.glyphs };
}

/** Tamanho (mm) para o texto ocupar a largura desejada (mm). */
function sizeFor(font, weight, str, widthMM, tracking = 0) {
  return L.fitSize(font, weight, str, mm(widthMM), tracking) / PXMM;
}

function svgDoc(wmm, hmm, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${Math.round(mm(wmm))}" height="${Math.round(mm(hmm))}">${body}</svg>`;
}

/** Floreio com pontos em mm e larguras em mm. */
function flourishMM(points, opts = {}) {
  const o = { ...opts };
  for (const k of ["min", "max"]) if (o[k] != null) o[k] = mm(o[k]);
  return F.flourish(points.map(([x, y]) => [mm(x), mm(y)]), { step: Math.max(1, mm(0.15)), ...o });
}

const poly = (pts) => pts.map(([x, y]) => `${mm(x).toFixed(1)},${mm(y).toFixed(1)}`).join(" ");

/** Linha com trechos em estilos diferentes: parts = [[texto, "normal"|"italic"], ...]. anchor "start" ou "end". */
function richMM(font, weight, parts, { x = 0, y = 0, size = 5, anchor = "start" } = {}) {
  const widths = parts.map(([t, st]) => textMM(font, weight, t, { size, style: st }).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = anchor === "end" ? x - total : anchor === "middle" ? x - total / 2 : x;
  let d = "";
  parts.forEach(([t, st], i) => { d += textMM(font, weight, t, { x: cx, y, size, style: st }).d; cx += widths[i]; });
  return { d, width: total };
}

// render com a resolução certa gravada no PNG (o esboço não é 300 DPI)
const render = (svg, file, opts = {}) => L.render(svg, file, { dpi: PXMM * 25.4, ...opts });
module.exports = { L, F, PXMM, mm, out, imageEl, textMM, richMM, sizeFor, svgDoc, flourishMM, poly, ROOT, render };
