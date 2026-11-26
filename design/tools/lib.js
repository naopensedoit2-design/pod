// Utilidades de composição: SVG em px a 300 DPI -> PNG transparente com alfa "duro" (o DTF não imprime semitransparência).
const path = require("path");
const fs = require("fs");
const sharp = require(require.resolve("sharp", { paths: [__dirname, path.join(__dirname, "../..")] }));
const T = require("./type.js");

const DPI = 300;
const MM = DPI / 25.4; // px por mm a 300 DPI
const cm = (v) => v * MM * 10; // cm -> px

// Cores da marca (E01). Paletas de cada projeto ficam no próprio projeto.
const C = { red: "#C4252F", blue: "#1F3D9C", cream: "#F1E9D8", ink: "#1E1A17" };

function b64(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return `data:${mime};base64,` + fs.readFileSync(file).toString("base64");
}
async function imgInfo(file) {
  const m = await sharp(file).metadata();
  return { w: m.width, h: m.height };
}

/** Estrela de 4 pontas desenhada em vetor (as fontes raramente têm o glifo ✦). */
function starPath(cx, cy, r, k = 0.3) {
  const p = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * k;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${p.join("L")}Z`;
}

/** Texto como <path>. thicken engrossa tudo por igual: para caligrafia prefira min_stroke.py, que só engrossa os traços finos. */
function textEl(fontName, weight, str, opts, fill, thicken = 0, style = "normal") {
  const f = T.font(fontName, weight, style);
  const t = T.text(f, str, opts);
  const st = thicken ? ` stroke="${fill}" stroke-width="${thicken}" stroke-linejoin="round"` : "";
  return { svg: `<path d="${t.d}" fill="${fill}"${st}/>`, ...t };
}

/** Tamanho de fonte para o texto ocupar a largura desejada. */
function fitSize(fontName, weight, str, width, tracking = 0, style = "normal") {
  const f = T.font(fontName, weight, style);
  const t = T.text(f, str, { size: 1000, tracking });
  return (width / t.width) * 1000;
}

/** Renderiza SVG (em px a 300 DPI) para PNG com alfa binário, recortado pelo conteúdo. Devolve o tamanho em cm. */
async function render(svg, out, { trim = true, alphaThreshold = 128 } = {}) {
  const img = sharp(Buffer.from(svg), { density: 72, limitInputPixels: false, unlimited: true }).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  let x1 = info.width, y1 = info.height, x2 = -1, y2 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4 + 3;
      data[i] = data[i] >= alphaThreshold ? 255 : 0;
      if (data[i] && trim) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
    }
  }
  // Conteúdo encostado na borda do canvas quase sempre é corte (no Drop 001, "CAFÉ … Nº 001" virou "AFÉ … Nº 00").
  if (x2 >= 0 && (x1 === 0 || y1 === 0 || x2 === info.width - 1 || y2 === info.height - 1)) {
    const lados = [x1 === 0 && "esquerda", y1 === 0 && "topo", x2 === info.width - 1 && "direita", y2 === info.height - 1 && "base"].filter(Boolean).join(", ");
    console.warn(`ATENÇÃO ${path.basename(out)}: a arte encosta na borda do canvas (${lados}). Algo pode ter sido cortado — aumente o canvas e confira.`);
  }
  let s = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  if (trim && x2 >= 0) {
    const buf = await s.png().toBuffer();
    s = sharp(buf).extract({ left: x1, top: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 });
  }
  const r = await s.withMetadata({ density: DPI }).png({ compressionLevel: 9 }).toFile(out);
  return { file: out, w: r.width, h: r.height, wcm: +(r.width / MM / 10).toFixed(2), hcm: +(r.height / MM / 10).toFixed(2) };
}

/** Prévia rápida da arte sobre uma cor de fundo (para olhar a arte isolada). */
async function preview(file, bg, out, width = 900) {
  const m = await sharp(file).metadata();
  const pad = Math.round(Math.max(m.width, m.height) * 0.06);
  const base = await sharp({ create: { width: m.width + pad * 2, height: m.height + pad * 2, channels: 3, background: bg } })
    .composite([{ input: file, left: pad, top: pad }])
    .png()
    .toBuffer();
  await sharp(base).resize({ width }).jpeg({ quality: 88 }).toFile(out);
}

module.exports = { sharp, T, DPI, MM, cm, C, b64, imgInfo, textEl, fitSize, render, preview, starPath };
