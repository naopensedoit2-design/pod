// Tipografia em vetor: converte texto em caminhos SVG (fontes OFL do Fontsource via opentype.js).
// Fontes: as famílias de package.json (pasta node_modules/@fontsource) ou arquivos .ttf/.otf em ./fonts.
const opentype = require("opentype.js");
const path = require("path");
const fs = require("fs");

const cache = new Map();
const parse = (file) => {
  const buf = fs.readFileSync(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};

/** Carrega uma fonte. family = nome do pacote Fontsource (ex.: "pinyon-script") ou nome do arquivo em ./fonts sem extensão. */
function font(family, weight = 400, style = "normal") {
  const key = `${family}-${weight}-${style}`;
  if (cache.has(key)) return cache.get(key);
  const dir = path.join(__dirname, "node_modules/@fontsource", family, "files");
  const candidates = [
    path.join(dir, `${family}-latin-${weight}-${style}.woff`),
    path.join(dir, `${family}-latin-ext-${weight}-${style}.woff`),
    path.join(__dirname, "fonts", `${family}.ttf`),
    path.join(__dirname, "fonts", `${family}.otf`),
  ];
  const file = candidates.find((f) => fs.existsSync(f));
  if (!file) throw new Error(`fonte não encontrada: ${key} (rode "npm install" em design/tools ou confira o peso/estilo disponível)`);
  const f = parse(file);
  // glifos que faltam no subset "latin" (raro) vêm do latin-ext
  const extFile = path.join(dir, `${family}-latin-ext-${weight}-${style}.woff`);
  if (file !== extFile && fs.existsSync(extFile)) f._ext = parse(extFile);
  f._file = file;
  cache.set(key, f);
  return f;
}

/** Glifos que a fonte não tem (aparecem como .notdef). Use antes de escolher uma fonte para texto em português. */
function missingGlyphs(f, str) {
  return [...new Set([...str])].filter((ch) => ch.trim() && f.charToGlyphIndex(ch) === 0);
}

/**
 * Texto -> { d, width, x0, bbox, glyphs } com tracking (milésimos de em) e kerning.
 * anchor: "start" | "middle" | "end" em relação a x. y é a linha de base.
 * glyphs traz a posição de cada letra (útil para encaixar floreios e entrelaçar com imagens).
 */
function text(f, str, { x = 0, y = 0, size = 100, tracking = 0, anchor = "start", kerning = true, features } = {}) {
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(str, features ? { features } : undefined);
  let adv = 0;
  const pos = [];
  for (let i = 0; i < glyphs.length; i++) {
    pos.push(adv);
    adv += glyphs[i].advanceWidth * scale;
    if (i < glyphs.length - 1) {
      if (kerning) adv += f.getKerningValue(glyphs[i], glyphs[i + 1]) * scale;
      adv += (tracking / 1000) * size;
    }
  }
  const width = adv;
  const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  let d = "";
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const out = [];
  glyphs.forEach((g, i) => {
    const p = g.getPath(x0 + pos[i], y, size);
    const gd = p.commands.length ? p.toPathData(2) : "";
    let bb = null;
    if (p.commands.length) {
      bb = p.getBoundingBox();
      if (isFinite(bb.x1)) { minX = Math.min(minX, bb.x1); minY = Math.min(minY, bb.y1); maxX = Math.max(maxX, bb.x2); maxY = Math.max(maxY, bb.y2); }
    }
    d += gd;
    out.push({ char: str[i], x: x0 + pos[i], advance: g.advanceWidth * scale, d: gd, bbox: bb });
  });
  return { d, width, x0, bbox: { x1: minX, y1: minY, x2: maxX, y2: maxY }, glyphs: out };
}

/** Texto em arco (selos): centro (cx,cy), raio r, ângulo central em graus (0 = topo). Devolve elementos <path>. */
function arcText(f, str, { cx, cy, r, size, tracking = 0, center = 0, flip = false }) {
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(str);
  const advs = glyphs.map((g, i) => g.advanceWidth * scale + (i < glyphs.length - 1 ? (tracking / 1000) * size : 0));
  const total = advs.reduce((a, b) => a + b, 0);
  const totalAng = (total / r) * (180 / Math.PI);
  let ang = center - ((flip ? -1 : 1) * totalAng) / 2;
  let d = "";
  glyphs.forEach((g, i) => {
    const w = g.advanceWidth * scale;
    const a = ang + (flip ? -1 : 1) * (w / 2 / r) * (180 / Math.PI);
    const rad = ((a - 90) * Math.PI) / 180;
    const gx = cx + r * Math.cos(rad), gy = cy + r * Math.sin(rad);
    const p = g.getPath(-w / 2, flip ? size * 0.72 : 0, size);
    const rot = flip ? a + 180 : a;
    d += `<path transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) rotate(${rot.toFixed(2)})" d="${p.toPathData(2)}"/>`;
    ang += (flip ? -1 : 1) * (advs[i] / r) * (180 / Math.PI);
  });
  return d;
}

/** Comprimento (px) de um texto, para conferir se cabe num arco. */
function arcLength(f, str, size, tracking = 0) {
  const scale = size / f.unitsPerEm;
  return f.stringToGlyphs(str).reduce((a, g, i, arr) => a + g.advanceWidth * scale + (i < arr.length - 1 ? (tracking / 1000) * size : 0), 0);
}

module.exports = { font, text, arcText, arcLength, missingGlyphs };
