// Gera imagens de demonstração (mockups simples) para os produtos de exemplo.
// Uso: node scripts/make-demo-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "public/demo");
fs.mkdirSync(out, { recursive: true });

const logoColor = fs.readFileSync(path.join(root, "public/brand/lento-logo.svg"), "utf8");
const logoCream = fs.readFileSync(path.join(root, "public/brand/lento-logo-cream.svg"), "utf8");
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const LOGO_VB = "13.678 11.561 87.198 39.954";
const emblem = `data:image/png;base64,${fs.readFileSync(path.join(root, "public/brand/lento-emblem.png")).toString("base64")}`;
const emblemFull = `data:image/png;base64,${fs.readFileSync(path.join(root, "public/brand/lento-emblem-full.png")).toString("base64")}`;

const W = 900;
const H = 1200;
const BG = "#ECE9E4";

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Camiseta oversized (frente/costas), desenhada em 600x800 e escalada para o canvas.
function tee({ color, back = false, print = "" }) {
  const dark = shade(color, -28);
  const darker = shade(color, -45);
  const neckFront = back ? "M240,140 Q300,162 360,140" : "M240,140 Q300,198 360,140";
  return `
  <g transform="translate(${(W - 600 * 1.3) / 2}, 150) scale(1.3)">
    <ellipse cx="300" cy="735" rx="210" ry="14" fill="#000" opacity="0.08"/>
    <path d="M240,140 ${back ? "Q300,162 360,140" : "Q300,198 360,140"} L450,165 L545,330 L475,372 L452,342 L455,700 Q300,712 145,700 L148,342 L125,372 L55,330 L150,165 Z" fill="${color}"/>
    <path d="M240,140 Q300,158 360,140 Q300,${back ? 150 : 168} 240,140 Z" fill="${darker}" opacity="${back ? 0.0 : 0.9}"/>
    <path d="${neckFront}" fill="none" stroke="${dark}" stroke-width="11" stroke-linecap="round"/>
    <path d="M148,342 L150,165" stroke="${dark}" stroke-width="2" opacity="0.35"/>
    <path d="M452,342 L450,165" stroke="${dark}" stroke-width="2" opacity="0.35"/>
    <path d="M128,368 L58,328" stroke="${dark}" stroke-width="5" opacity="0.35"/>
    <path d="M472,368 L542,328" stroke="${dark}" stroke-width="5" opacity="0.35"/>
    <path d="M150,690 Q300,702 452,690" stroke="${dark}" stroke-width="4" fill="none" opacity="0.35"/>
    <path d="M200,420 Q215,560 190,680" stroke="${dark}" stroke-width="10" fill="none" opacity="0.10"/>
    <path d="M405,400 Q392,540 415,680" stroke="${dark}" stroke-width="12" fill="none" opacity="0.10"/>
    ${print}
  </g>`;
}

function tote({ color, print = "" }) {
  const dark = shade(color, -30);
  return `
  <g transform="translate(${(W - 600 * 1.3) / 2}, 120) scale(1.3)">
    <ellipse cx="300" cy="752" rx="200" ry="12" fill="#000" opacity="0.08"/>
    <path d="M215,300 C215,120 385,120 385,300" fill="none" stroke="${dark}" stroke-width="22"/>
    <path d="M215,300 C215,135 385,135 385,300" fill="none" stroke="${color}" stroke-width="14"/>
    <path d="M110,290 L490,290 L500,740 L100,740 Z" fill="${color}"/>
    <path d="M110,290 L490,290 L491,318 L109,318 Z" fill="${dark}" opacity="0.35"/>
    ${print}
  </g>`;
}

const logoPrint = (cream, x, y, w) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${w * (39.954 / 87.198)}" viewBox="${LOGO_VB}">${inner(cream ? logoCream : logoColor)}</svg>`;
const imagePrint = (href, x, y, w, ratio) =>
  `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${w * ratio}" preserveAspectRatio="xMidYMid meet"/>`;

function canvas(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#F4F2EE"/><stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${content}
</svg>`;
}

const images = {
  // 1. Camiseta Lento Social Club (logo grande no peito)
  "lsc-offwhite-front": canvas(tee({ color: "#F1E9D8", print: logoPrint(false, 185, 235, 230) })),
  "lsc-offwhite-back": canvas(tee({ color: "#F1E9D8", back: true, print: logoPrint(false, 255, 215, 90) })),
  "lsc-preta-front": canvas(tee({ color: "#1A1A1A", print: logoPrint(true, 185, 235, 230) })),
  "lsc-preta-back": canvas(tee({ color: "#1A1A1A", back: true, print: logoPrint(true, 255, 215, 90) })),
  "lsc-azul-front": canvas(tee({ color: "#1F3D9C", print: logoPrint(true, 185, 235, 230) })),
  "lsc-azul-back": canvas(tee({ color: "#1F3D9C", back: true, print: logoPrint(true, 255, 215, 90) })),
  // 2. Camiseta Club Rules (logo pequeno na frente, emblema com regras nas costas)
  "rules-branca-back": canvas(tee({ color: "#FAFAF7", back: true, print: imagePrint(emblemFull, 170, 225, 260, 893 / 1200) })),
  "rules-branca-front": canvas(tee({ color: "#FAFAF7", print: logoPrint(false, 330, 250, 95) })),
  "rules-offwhite-back": canvas(tee({ color: "#F1E9D8", back: true, print: imagePrint(emblemFull, 170, 225, 260, 893 / 1200) })),
  "rules-offwhite-front": canvas(tee({ color: "#F1E9D8", print: logoPrint(false, 330, 250, 95) })),
  // 3. Camiseta Members Only (emblema oval no peito)
  "members-mescla-front": canvas(tee({ color: "#BDBCB8", print: imagePrint(emblem, 200, 240, 200, 666 / 1200) })),
  "members-mescla-back": canvas(tee({ color: "#BDBCB8", back: true })),
  "members-branca-front": canvas(tee({ color: "#FAFAF7", print: imagePrint(emblem, 200, 240, 200, 666 / 1200) })),
  "members-branca-back": canvas(tee({ color: "#FAFAF7", back: true })),
  // 4. Ecobag Members Only
  "ecobag-natural": canvas(tote({ color: "#E6DCC6", print: imagePrint(emblem, 160, 420, 280, 666 / 1200) })),
  "ecobag-preta": canvas(tote({ color: "#1A1A1A", print: logoPrint(true, 170, 430, 260) })),
};

for (const [name, svg] of Object.entries(images)) {
  const file = path.join(out, `${name}.webp`);
  await sharp(Buffer.from(svg)).webp({ quality: 84 }).toFile(file);
  console.log("ok", path.relative(root, file));
}
