// Vaga 3 — "Calma." com o Whistlejacket (George Stubbs, 1762, domínio público).
// Uso: [PXMM=4] node src/calma.js A|B|C
const path = require("path");
const C = require("./common.js");
const { mm } = C;

const HORSE = path.join(C.ROOT, "work/wj-ht.png"); // 3518 x 3256 px a 300 DPI (29,8 x 27,6 cm)
const CREAM = "#EFE6D2";
const variant = process.argv[2] || "A";

// pontos do cavalo em fração da imagem (medidos na prévia): usados para encaixar letra e laço
const HX = (fx, hx, hw) => hx + fx * hw;
const HY = (fy, hy, hh) => hy + fy * hh;

(async () => {
  let W, H, body = "", credit;
  const hw = 270; // largura do cavalo em mm
  if (variant === "A") {
    // A: "Calma." gigante cruzando a parte de baixo do corpo; a pata traseira passa na frente da letra
    W = 300; H = 262;
    const hx = 15, hy = 0;
    const horse = await C.imageEl(HORSE, hx, hy, hw);
    const hh = horse.h;
    const size = C.sizeFor("ballet", 400, "Calma.", 250);
    const t = C.textMM("ballet", 400, "Calma.", { x: 22, y: HY(0.86, hy, hh), size });
    const leg = C.poly([[HX(0.27, hx, hw), HY(0.55, hy, hh)], [HX(0.52, hx, hw), HY(0.55, hy, hh)], [HX(0.52, hx, hw), HY(1, hy, hh)], [HX(0.27, hx, hw), HY(1, hy, hh)]]);
    body += horse.svg + `<path d="${t.d}" fill="${CREAM}"/>`;
    body += `<defs><clipPath id="leg"><polygon points="${leg}"/></clipPath></defs>` + (await C.imageEl(HORSE, hx, hy, hw, 'clip-path="url(#leg)"')).svg;
    credit = { x: W - 4, y: H - 3, anchor: "end" };
  } else if (variant === "B") {
    // B: cavalo em cima; "Calma." embaixo; o ponto final vira um laço que sobe e envolve o pescoço
    W = 300; H = 330;
    const hx = 10, hy = 2;
    const horse = await C.imageEl(HORSE, hx, hy, hw);
    const hh = horse.h;
    const size = C.sizeFor("ballet", 400, "Calma.", 205);
    const base = hy + hh + 52;
    const t = C.textMM("ballet", 400, "Calma.", { x: 18, y: base, size });
    const end = [t.bbox.x2 + 2, base - 4];
    const P = (fx, fy) => [HX(fx, hx, hw), HY(fy, hy, hh)];
    const lasso = C.flourishMM(
      [end, [end[0] + 26, base - 34], P(0.99, 0.58), P(0.93, 0.40), P(0.86, 0.33), P(0.78, 0.36), P(0.64, 0.30), P(0.58, 0.14), P(0.70, 0.02), P(0.83, 0.10), P(0.84, 0.28), P(0.95, 0.47)],
      { min: 0.55, max: 2.6, taperIn: 0.04, taperOut: 0.12 }
    );
    // trecho do laço que passa por trás do pescoço (horse redesenhado por cima)
    const behind = C.poly([P(0.56, 0.05), P(0.80, 0.02), P(0.82, 0.30), P(0.60, 0.30)]);
    body += horse.svg + `<g fill="${CREAM}"><path d="${t.d}"/>${lasso.svg}</g>`;
    body += `<defs><clipPath id="nk"><polygon points="${behind}"/></clipPath></defs>` + (await C.imageEl(HORSE, hx, hy, hw, 'clip-path="url(#nk)"')).svg;
    credit = { x: W - 4, y: H - 3, anchor: "end" };
  } else {
    // C: "Calma." no alto à esquerda, acima do dorso; o cavalo embaixo, empinando em direção à palavra
    W = 300; H = 300;
    const hx = 22, hy = 50;
    const horse = await C.imageEl(HORSE, hx, hy, hw);
    const size = C.sizeFor("ballet", 400, "Calma.", 175);
    const t = C.textMM("ballet", 400, "Calma.", { x: 6, y: 72, size });
    body += `<path d="${t.d}" fill="${CREAM}"/>` + horse.svg;
    credit = { x: W - 4, y: H - 3, anchor: "end" };
  }
  const cr = C.textMM("im-fell-english", 400, "Whistlejacket, George Stubbs, 1762", { x: credit.x, y: credit.y, size: 4.2, anchor: credit.anchor, style: "italic" });
  body += `<path d="${cr.d}" fill="${CREAM}"/>`;
  const r = await C.render(C.svgDoc(W, H, body), C.out(`calma-${variant}.png`));
  console.log(variant, r.wcm, "x", r.hcm, "cm", r.file);
})().catch((e) => { console.error(e); process.exit(1); });
