#!/usr/bin/env node
// Prévia da estampa no mockup da YouDraw (frente | costas lado a lado) e o placement que vai para a API.
// Uso:
//   node preview.js --front arte-frente.png --back arte-costas.png --base 40 --color Off-White --out previa.jpg
//   opções: --front-offset 10 (cm; 0 = centro)  --center  --front-top 7.8  --back-top 8  --back-offset 0  --zoom (recortes da estampa)
const fs = require("fs");
const M = require("./mockup.js");
const { sharp } = require("./lib.js");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

(async () => {
  const base = opt("base", "40");
  const colors = opt("color", "Off-White").split(",");
  const front = opt("front"), back = opt("back");
  if (!front && !back) throw new Error("passe --front e/ou --back");
  const out = opt("out", "previa.jpg");
  const o = {
    frontOffset: opt("front-offset") != null ? +opt("front-offset") : undefined,
    center: flag("center"),
    frontTop: opt("front-top") != null ? +opt("front-top") : undefined,
    backTop: opt("back-top") != null ? +opt("back-top") : undefined,
    backOffset: opt("back-offset") != null ? +opt("back-offset") : undefined,
  };
  const rows = [];
  const placements = {};
  for (const color of colors) {
    const tiles = [];
    for (const [side, file] of [["front", front], ["back", back]]) {
      if (!file) continue;
      const art = await M.artCm(file);
      const pl = M.placement(base, color, side, art, o);
      placements[`${color}/${side}`] = { ...pl, cm: [+art.w.toFixed(1), +art.h.toFixed(1)] };
      tiles.push(await M.previewOn(base, color, side, file, pl));
      if (flag("zoom")) {
        // recorte da região da estampa no mockup, para ver escala e leitura de perto
        const pad = 40;
        const x = Math.max(0, Math.round(pl.x * 1000) - pad), y = Math.max(0, Math.round(pl.y * 1000) - pad);
        const w = Math.min(1000 - x, Math.round(pl.width * 1000) + pad * 2), h = Math.min(1000 - y, Math.round(pl.height * 1000) + pad * 2);
        const crop = await sharp(tiles[tiles.length - 1]).extract({ left: x, top: y, width: w, height: h }).resize({ width: 1000, height: 1000, fit: "contain", background: "#E9E7E1" }).png().toBuffer();
        tiles.push(crop);
      }
    }
    rows.push(tiles);
  }
  const cols = Math.max(...rows.map((r) => r.length));
  const comp = [];
  rows.forEach((r, ri) => r.forEach((t, ci) => comp.push({ input: t, left: ci * 1000, top: ri * 1000 })));
  await sharp({ create: { width: cols * 1000, height: rows.length * 1000, channels: 3, background: "#E9E7E1" } })
    .composite(comp)
    .jpeg({ quality: 88 })
    .toFile(out);
  console.log(JSON.stringify({ out, base, placements }, null, 1));
  if (!fs.existsSync(out)) process.exit(1);
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
