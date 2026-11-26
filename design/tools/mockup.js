// Mockups da YouDraw: baixa sob demanda, calcula a posição (placement) da arte e monta prévias.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { sharp, MM } = require("./lib.js");

const BASES = JSON.parse(fs.readFileSync(path.join(__dirname, "mockups.json"), "utf8"));
const CACHE = path.join(__dirname, ".cache/mockups");
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

function geometry(base, color, side) {
  const b = BASES[base];
  if (!b) throw new Error(`base desconhecida: ${base} (veja mockups.json)`);
  const c = b.colors[color];
  if (!c) throw new Error(`cor desconhecida para a base ${base}: ${color}. Cores: ${Object.keys(b.colors).join(", ")}`);
  return c[side];
}

/** Caminho local do mockup liso (1000x1000). Baixa com curl, que já usa o proxy do ambiente. */
function mockupFile(base, color, side) {
  const g = geometry(base, color, side);
  const file = path.join(CACHE, `${base}-${slug(color)}-${side}.png`);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(CACHE, { recursive: true });
    execFileSync("curl", ["-sSfL", "--retry", "3", "-o", file, g.url]);
  }
  return file;
}

/** Tamanho da arte em cm (PNG a 300 DPI). */
async function artCm(file) {
  const m = await sharp(file).metadata();
  return { w: m.width / MM / 10, h: m.height / MM / 10, px: [m.width, m.height] };
}

const r4 = (v) => Math.round(v * 10000) / 10000;

/**
 * Placement normalizado (0–1, canto superior esquerdo) para a YouDraw.
 * Padrão: frente com o topo 7,8 cm abaixo da costura da gola e o centro deslocado front_offset_cm para o lado esquerdo do peito de quem veste
 * (direita de quem olha); costas centralizadas, topo 8 cm abaixo da gola.
 * opts: frontOffset (cm, 0 = centro), frontTop (cm), backTop (cm), backOffset (cm), center (true = ignora o deslocamento da frente).
 */
function placement(base, color, side, art, opts = {}) {
  const b = BASES[base];
  const g = geometry(base, color, side);
  const s = b.cm_per_px;
  const wpx = art.w / s, hpx = art.h / s;
  let left, top;
  if (side === "front") {
    const off = opts.center ? 0 : opts.frontOffset ?? b.front_offset_cm;
    left = g.cx + off / s - wpx / 2;
    top = g.seam + (opts.frontTop ?? 7.8) / s;
  } else {
    left = g.cx + (opts.backOffset ?? 0) / s - wpx / 2;
    top = g.seam + (opts.backTop ?? 8.0) / s;
  }
  const p = { x: r4(left / 1000), y: r4(top / 1000), width: r4(wpx / 1000), height: r4(hpx / 1000) };
  if (p.x < 0 || p.y < 0 || p.x + p.width > 1 || p.y + p.height > 1) throw new Error(`a arte sai do mockup: ${base}/${color}/${side} ${JSON.stringify(p)}`);
  return p;
}

/** Arte composta sobre o mockup (PNG 1000x1000 em buffer). */
async function previewOn(base, color, side, file, pl) {
  const W = Math.round(pl.width * 1000), H = Math.round(pl.height * 1000);
  const art = await sharp(file).resize(W, H, { kernel: "lanczos3" }).png().toBuffer();
  return sharp(mockupFile(base, color, side))
    .composite([{ input: art, left: Math.round(pl.x * 1000), top: Math.round(pl.y * 1000) }])
    .flatten({ background: "#E9E7E1" })
    .png()
    .toBuffer();
}

module.exports = { BASES, geometry, mockupFile, artCm, placement, previewOn, slug };
