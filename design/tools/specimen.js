#!/usr/bin/env node
// Mostruário: o seu texto em várias fontes, para escolher a letra vendo a frase real (acentos incluídos).
// Uso: node specimen.js "Ai, que preguiça!" [--cat caligrafia,pincel] [--fonts pinyon-script,ballet] [--size 150] [--out mostruario.jpg]
//      [--ink "#1E1A17"] [--bg "#F4F1E8"]
// Fontes sem algum glifo do texto aparecem marcadas em vermelho ("faltam: ã ç").
const fs = require("fs");
const path = require("path");
const T = require("./type.js");
const { sharp } = require("./lib.js");

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
const textArg = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!textArg) {
  console.error('uso: node specimen.js "texto" [--cat caligrafia] [--fonts a,b] [--size 150] [--out arquivo.jpg]');
  process.exit(1);
}
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "fonts.json"), "utf8"));
const cats = opt("cat") ? opt("cat").split(",") : null;
const only = opt("fonts") ? opt("fonts").split(",") : null;
const size = +opt("size", 150);
const ink = opt("ink", "#1E1A17"), bg = opt("bg", "#F4F1E8");
const out = opt("out", "mostruario.jpg");

function weights(family) {
  const dir = path.join(__dirname, "node_modules/@fontsource", family, "files");
  if (!fs.existsSync(dir)) return [];
  return [...new Set(fs.readdirSync(dir).map((n) => n.match(new RegExp(`^${family}-latin-(\\d+)-normal\\.woff$`))).filter(Boolean).map((m) => +m[1]))].sort((a, b) => a - b);
}

const label = T.font("work-sans", 500);
const families = Object.keys(catalog).filter((k) => !k.startsWith("_") && (!cats || cats.includes(catalog[k].cat)) && (!only || only.includes(k)));
const rows = [];
for (const fam of families) {
  const ws = weights(fam);
  if (!ws.length) continue;
  const wgt = ws.includes(400) ? 400 : ws[ws.length > 2 ? Math.floor(ws.length / 2) : 0];
  const f = T.font(fam, wgt);
  const t = T.text(f, textArg, { x: 60, y: 0, size });
  const miss = T.missingGlyphs(f, textArg);
  rows.push({ fam, wgt, t, miss, note: catalog[fam].nota, cat: catalog[fam].cat });
}
const rowH = size * 1.75;
const W = Math.min(4200, Math.max(1400, ...rows.map((r) => Math.max(r.t.bbox.x2, 60 + T.text(label, `${r.fam} ${r.wgt} · ${r.cat} — ${r.note}`, { size: 24 }).width + (r.miss.length ? 260 : 0)) + 80)));
let svg = "";
rows.forEach((r, i) => {
  const top = i * rowH;
  const base = top + rowH * 0.72;
  const lab = T.text(label, `${r.fam} ${r.wgt} · ${r.cat} — ${r.note}`, { x: 60, y: top + 34, size: 24 });
  svg += `<path d="${lab.d}" fill="#7a746b"/>`;
  if (r.miss.length) {
    const m = T.text(label, `faltam: ${r.miss.join(" ")}`, { x: W - 60, y: top + 34, size: 24, anchor: "end" });
    svg += `<path d="${m.d}" fill="#C4252F"/>`;
  }
  svg += `<path transform="translate(0 ${base.toFixed(1)})" d="${r.t.d}" fill="${ink}"/>`;
  svg += `<rect x="0" y="${(top + rowH - 1).toFixed(1)}" width="${W}" height="1" fill="#d9d3c7"/>`;
});
const H = Math.ceil(rows.length * rowH);
const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${bg}"/>${svg}</svg>`;
sharp(Buffer.from(doc), { limitInputPixels: false })
  .jpeg({ quality: 88 })
  .toFile(out)
  .then(() => console.log(`${out}: ${rows.length} fontes`))
  .catch((e) => {
    console.error("ERRO:", e.message);
    process.exit(1);
  });
