// Vaga 2 — A bula do maracujá. Formato real da bula do paciente (RDC 47/2009, perguntas numeradas),
// com a fórmula estrutural verdadeira da crisina (C15H10O4), flavonoide das passifloras.
// Costas: o folheto. Frente: "Ao persistirem os sintomas, a rede deverá ser consultada."
// Uso: [PXMM=4] node src/bula.js A|B|C|frente
const C = require("./common.js");
const { mm } = C;

const variant = process.argv[2] || "A";
const INK = variant === "B" ? "#1F3D9C" : "#1E1A17";

// ---------- texto ----------
const QA = [
  ["1. Para que este medicamento é indicado?", "Pressa, segunda-feira, fila de banco e e-mail com “urgente” no assunto."],
  ["2. Como este medicamento funciona?", "Ninguém sabe ao certo. A avó garante que funciona, e isso basta."],
  ["3. Quando não devo usar este medicamento?", "Antes de dirigir, de assinar contrato ou de responder o grupo da família."],
  ["4. O que devo saber antes de usar este medicamento?", "Pode causar sono, vontade de rede e adiamento de compromissos."],
  ["5. Onde, como e por quanto tempo posso guardar este medicamento?", "Na fruteira, à sombra. Está no ponto quando enruga."],
  ["6. Como devo usar este medicamento?", "Um copo ao fim da tarde, devagar. Sentado. Se não for possível, deitado."],
  ["7. O que devo fazer quando eu me esquecer de usar este medicamento?", "Nada. Esquecer já é sinal de que está funcionando."],
  ["8. Quais os males que este medicamento pode me causar?", "Cochilo no sofá com a TV ligada, bocejo contagioso e atraso de 15 minutos."],
  ["9. O que fazer se alguém usar uma quantidade maior do que a indicada deste medicamento?", "Deixe dormir."],
];

/** Quebra de linha por largura (mm) com as métricas reais da fonte. */
function wrap(font, weight, str, size, width, style = "normal") {
  // palavra de uma letra (e, o, a, à, é) não fica sozinha no fim da linha: gruda na seguinte
  const words = str.replace(/(^|\s)([eoaàéEOAÀÉ]) /g, "$1$2\u00A0").split(" ").map((w) => w);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (C.textMM(font, weight, test.replace(/\u00A0/g, " "), { size, style }).width > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Bloco de linhas; devolve svg e altura usada. */
function block(font, weight, str, { x, y, size, width, lead = 1.32, style = "normal" }) {
  let svg = "";
  const lines = wrap(font, weight, str, size, width, style);
  lines.forEach((l, i) => {
    const t = C.textMM(font, weight, l.replace(/\u00A0/g, " "), { x, y: y + i * size * lead, size, style });
    svg += `<path d="${t.d}"/>`;
  });
  return { svg, h: lines.length * size * lead };
}

// ---------- molécula (crisina: 5,7-di-hidroxi-flavona) ----------
function chrysin(ox, oy, s, lw) {
  const k = Math.sqrt(3) / 2;
  const P = {
    C5: [0, 1], C4a: [k, 0.5], C8a: [k, -0.5], C8: [0, -1], C7: [-k, -0.5], C6: [-k, 0.5],
    C4: [2 * k, 1], C3: [3 * k, 0.5], C2: [3 * k, -0.5], O1: [2 * k, -1],
    C1p: [4 * k, -1], C2p: [5 * k, -0.5], C3p: [6 * k, -1], C4p: [6 * k, -2], C5p: [5 * k, -2.5], C6p: [4 * k, -2],
    O4: [2 * k, 2], O5: [0, 2], O7: [-2 * k, -1],
  };
  const X = (p) => ox + P[p][0] * s, Y = (p) => oy - P[p][1] * s;
  const ringCenter = { A: [0, 0], Cr: [2 * k, 0], B: [5 * k, -1.5] };
  const labels = { O1: "O", O4: "O", O5: "OH", O7: "HO" };
  const gap = (p) => (labels[p] ? 0.3 * s : 0);
  let d = "";
  const line = (a, b, shrinkA = gap(a), shrinkB = gap(b), off = [0, 0]) => {
    let x1 = X(a), y1 = Y(a), x2 = X(b), y2 = Y(b);
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    x1 += ux * shrinkA + off[0]; y1 += uy * shrinkA + off[1]; x2 -= ux * shrinkB - off[0]; y2 -= uy * shrinkB - off[1];
    d += `M${mm(x1).toFixed(1)},${mm(y1).toFixed(1)}L${mm(x2).toFixed(1)},${mm(y2).toFixed(1)}`;
  };
  const inner = (a, b, ring) => {
    // segunda linha da ligação dupla, para dentro do anel e mais curta
    const [cx, cy] = ringCenter[ring];
    const mx = (P[a][0] + P[b][0]) / 2, my = (P[a][1] + P[b][1]) / 2;
    const vx = cx - mx, vy = cy - my, vl = Math.hypot(vx, vy);
    const off = [(vx / vl) * 0.2 * s, -(vy / vl) * 0.2 * s];
    line(a, b, 0.2 * s + gap(a), 0.2 * s + gap(b), off);
  };
  const bonds = [["C5", "C6"], ["C6", "C7"], ["C7", "C8"], ["C8", "C8a"], ["C8a", "C4a"], ["C4a", "C5"],
    ["C4a", "C4"], ["C4", "C3"], ["C3", "C2"], ["C2", "O1"], ["O1", "C8a"],
    ["C5", "O5"], ["C7", "O7"], ["C2", "C1p"],
    ["C1p", "C2p"], ["C2p", "C3p"], ["C3p", "C4p"], ["C4p", "C5p"], ["C5p", "C6p"], ["C6p", "C1p"]];
  bonds.forEach(([a, b]) => line(a, b));
  [["C5", "C6", "A"], ["C7", "C8", "A"], ["C8a", "C4a", "A"], ["C2", "C3", "Cr"], ["C1p", "C6p", "B"], ["C2p", "C3p", "B"], ["C4p", "C5p", "B"]].forEach(([a, b, r]) => inner(a, b, r));
  // C4=O: ligação dupla para fora do anel
  line("C4", "O4", 0, gap("O4"), [-0.09 * s, 0]);
  line("C4", "O4", 0, gap("O4"), [0.09 * s, 0]);
  let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${mm(lw)}" stroke-linecap="round"/>`;
  const ls = 0.42 * s;
  for (const [p, txt] of Object.entries(labels)) {
    const o = C.textMM("archivo", 500, "O", { size: ls });
    const ow = o.width;
    let x = X(p) - ow / 2; // o "O" fica centrado no átomo
    if (txt === "HO") x -= C.textMM("archivo", 500, "H", { size: ls }).width;
    const t = C.textMM("archivo", 500, txt, { x, y: Y(p) + ls * 0.36, size: ls });
    svg += `<path d="${t.d}" fill="${INK}"/>`;
  }
  return { svg, w: (6 * k + 2 * k) * s, h: 4.5 * s };
}

/** Fórmula com subscritos: C15H10O4. */
function formula(x, y, size) {
  let svg = "", cx = x;
  for (const part of ["C", "15", "H", "10", "O", "4"]) {
    const sub = /\d/.test(part);
    const t = C.textMM("archivo", 600, part, { x: cx, y: sub ? y + size * 0.22 : y, size: sub ? size * 0.62 : size });
    svg += `<path d="${t.d}"/>`;
    cx += t.width + (sub ? size * 0.06 : 0);
  }
  return { svg, w: cx - x };
}

(async () => {
  if (variant === "frente") {
    const W = 92, s = 5.8;
    let svg = `<g fill="#1E1A17">`;
    const l1 = C.textMM("archivo-narrow", 700, "AO PERSISTIREM OS SINTOMAS,", { x: 0, y: s * 1.0, size: s });
    const l2 = C.textMM("archivo-narrow", 700, "A REDE DEVERÁ SER CONSULTADA.", { x: 0, y: s * 2.25, size: s });
    svg += `<path d="${l1.d}"/><path d="${l2.d}"/></g>`;
    const r = await C.render(C.svgDoc(Math.max(l1.width, l2.width) + 4, s * 3, `<g transform="translate(${mm(1)} 0)">${svg}</g>`), C.out("bula-frente.png"));
    return console.log("frente", r.file);
  }
  const W = 270, pad = 2;
  const colW = (W - 12) / 2;
  let y = 0, svg = `<g fill="${INK}">`;
  // cabeçalho
  const hs = 40;
  const h1 = C.textMM("archivo-black", 400, "MARACUJÁ", { x: pad, y: y + hs * 0.74, size: hs });
  const fit = (W - 2 * pad) / h1.width; // título ocupa a largura toda
  const probe = C.textMM("archivo-black", 400, "MARACUJÁ", { x: pad, y: 0, size: hs * fit });
  const H1 = C.textMM("archivo-black", 400, "MARACUJÁ", { x: pad, y: y - probe.bbox.y1 + 1.5, size: hs * fit });
  svg += `<path d="${H1.d}"/>`;
  y = H1.bbox.y2 + 11;
  const sp = C.textMM("archivo", 400, "Passiflora edulis Sims", { x: pad, y, size: 9, style: "italic" });
  svg += `<path d="${sp.d}"/>`;
  const uso = C.textMM("archivo", 800, "USO ORAL", { x: W - pad, y: y + 3.6, size: 4.6, anchor: "end" });
  const uso2 = C.textMM("archivo", 800, "USO ADULTO E PEDIÁTRICO", { x: W - pad, y: y - 2.8, size: 4.6, anchor: "end" });
  svg += `<path d="${uso.d}"/><path d="${uso2.d}"/>`;
  y += 8;
  svg += `<rect x="${mm(pad)}" y="${mm(y)}" width="${mm(W - 2 * pad)}" height="${mm(0.7)}"/>`;
  y += 8;
  const comp = block("archivo", 600, "APRESENTAÇÃO: fruta com casca, cerca de 200 g. COMPOSIÇÃO: polpa e sementes q.s.p. 1 fim de tarde.", { x: pad, y: y + 4.6, size: 4.9, width: W - 2 * pad });
  svg += comp.svg;
  y += comp.h + 6;
  // molécula
  if (variant !== "C") {
    const s = variant === "A" || variant === "B" ? 20 : 13;
    const k = Math.sqrt(3) / 2;
    const mw = 8 * k * s;
    const ox = pad + (W - mw) / 2 + 2 * k * s;
    const mol = chrysin(ox, y + 2.3 * s, s, 0.75);
    svg += `</g>${mol.svg}<g fill="${INK}">`;
    y += 4.6 * s;
    const f = formula(pad, y + 6, 6);
    const lab = C.textMM("archivo", 600, "Crisina, flavonoide das passifloras.", { x: pad + f.w + 3, y: y + 6, size: 5, style: "italic" });
    svg += f.svg + `<path d="${lab.d}"/>`;
    y += 14;
  }
  svg += `<rect x="${mm(pad)}" y="${mm(y)}" width="${mm(W - 2 * pad)}" height="${mm(0.7)}"/>`;
  y += 9;
  const info = C.textMM("archivo", 800, "INFORMAÇÕES AO PACIENTE", { x: pad, y, size: 5 });
  svg += `<path d="${info.d}"/>`;
  y += 9;
  // duas colunas
  const cols = [QA.slice(0, 4), QA.slice(4)];
  let ymax = y;
  cols.forEach((items, ci) => {
    let yy = y;
    const x = pad + ci * (colW + 12);
    for (const [q, a] of items) {
      const qb = block("archivo", 800, q, { x, y: yy, size: 4.9, width: colW });
      svg += qb.svg; yy += qb.h + 0.6;
      const ab = block("archivo", 600, a, { x, y: yy, size: 4.9, width: colW });
      svg += ab.svg; yy += ab.h + 5;
    }
    ymax = Math.max(ymax, yy);
  });
  y = ymax + 2;
  svg += `<rect x="${mm(pad)}" y="${mm(y)}" width="${mm(W - 2 * pad)}" height="${mm(0.7)}"/>`;
  y += 8;
  const legal = C.textMM("archivo", 800, "Fabricado pela natureza. Embalado pela LENTO. Lote: verão.", { x: pad, y, size: 4.9 });
  svg += `<path d="${legal.d}"/></g>`;
  const Hh = y + 3;
  const r = await C.render(C.svgDoc(W + 2, Hh, svg), C.out(`bula-${variant}.png`));
  console.log(variant, "folheto", W, "x", Hh.toFixed(0), "mm", r.file);
})().catch((e) => { console.error(e); process.exit(1); });
