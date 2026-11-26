// Vaga 1 — "Sombra e água fresca": o coco de Köhler (1887) pequeno no alto e a sombra comprida dele na diagonal.
// A frase é recortada de dentro da sombra (sem tinta), lida ao longo do eixo da sombra.
// Fluxo:  node src/sombra.js layout V  ->  python3 src/sombra_ko.py V  ->  node src/sombra.js compose V
//   (PXMM=4 para esboço; o layout e a composição precisam usar o mesmo PXMM)
const fs = require("fs");
const path = require("path");
const C = require("./common.js");
const { mm } = C;

const mode = process.argv[2] || "layout";
const variant = process.argv[3] || "A";
const geo = JSON.parse(fs.readFileSync(path.join(C.ROOT, "work/sombra-geo.json"), "utf8"));
const CFG = {
  // A: frase em script recortada da sombra; B: frase em serifa itálica; C: frase menor, só na metade densa
  A: { font: "pinyon-script", style: "normal", width: 0.52, at: 0.44, halo: 1.1 },
  B: { font: "im-fell-english", style: "italic", width: 0.56, at: 0.45, halo: 1.0 },
  C: { font: "ephesis", style: "normal", width: 0.54, at: 0.45, halo: 1.1 },
}[variant];
const PHRASE = "Sombra e água fresca";
const INK = "#22302A";

function layout() {
  const [cw, ch] = geo.coco_mm;
  const [sw, sh] = geo.sombra_mm;
  const [bxs, bys] = geo.base_na_sombra_mm;
  const margin = 6;
  // base do coco (centro da parte de baixo) coincide com a base da sombra
  const shadowX = margin, shadowY = 0; // provisório; ajusta depois
  let B = { x: shadowX + bxs, y: shadowY + bys };
  const coco = { x: B.x - cw / 2, y: B.y - ch + 1.5 };
  const dy = Math.max(0, margin - coco.y);
  B.y += dy; coco.y += dy;
  const shadow = { x: shadowX, y: shadowY + dy };
  const W = Math.max(shadow.x + sw, coco.x + cw) + margin;
  const H = Math.max(shadow.y + sh, coco.y + ch) + margin + 8;
  const ang = (geo.angulo * Math.PI) / 180;
  const dir = { x: -Math.cos(ang), y: Math.sin(ang) };
  const d = geo.comprimento_mm * CFG.at;
  const P = { x: B.x + dir.x * d, y: B.y + dir.y * d };
  return { W, H, B, coco, shadow, P, rot: -geo.angulo };
}

(async () => {
  const lay = layout();
  const size = C.sizeFor(CFG.font, 400, PHRASE, geo.comprimento_mm * CFG.width);
  const t = C.textMM(CFG.font, 400, PHRASE, { x: lay.P.x, y: lay.P.y, size, anchor: "middle", style: CFG.style });
  const mid = (t.bbox.y1 + t.bbox.y2) / 2; // centraliza a frase no eixo da sombra
  const tr = `rotate(${lay.rot} ${mm(lay.P.x)} ${mm(lay.P.y)}) translate(0 ${mm(lay.P.y - mid)})`;
  if (mode === "layout") {
    const ko = `<rect width="100%" height="100%" fill="#000"/><g transform="${tr}"><path d="${t.d}" fill="#fff" stroke="#fff" stroke-width="${mm(CFG.halo * 2)}" stroke-linejoin="round"/></g>`;
    await C.L.sharp(Buffer.from(C.svgDoc(lay.W, lay.H, ko))).png().toFile(path.join(C.ROOT, `work/sombra-ko-${variant}.png`));
    fs.writeFileSync(path.join(C.ROOT, `work/sombra-layout-${variant}.json`), JSON.stringify({ ...lay, pxmm: C.PXMM }, null, 1));
    console.log("layout", variant, lay.W.toFixed(0), "x", lay.H.toFixed(0), "mm; frase", size.toFixed(1), "mm");
    return;
  }
  let body = (await C.imageEl(path.join(C.ROOT, `work/sombra-canvas-${variant}.png`), 0, 0, lay.W)).svg;
  body += (await C.imageEl(path.join(C.ROOT, "work/coco.png"), lay.coco.x, lay.coco.y, geo.coco_mm[0])).svg;
  const cr = C.richMM("im-fell-english", 400, [["Cocos nucifera", "italic"], [" — Koehler, 1897", "normal"]], { x: lay.W - 6, y: lay.H - 4, size: 5.4, anchor: "end" });
  body += `<path d="${cr.d}" fill="${INK}"/>`;
  const r = await C.render(C.svgDoc(lay.W, lay.H, body), C.out(`sombra-${variant}.png`), { trim: true });
  console.log("compose", variant, r.file);
})().catch((e) => { console.error(e); process.exit(1); });
