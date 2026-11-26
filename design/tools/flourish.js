// Floreios caligráficos em vetor, com modulação de pena.
//
// Caligrafia de referência (copperplate/spenceriana) não é "fonte digitada": os laços e caudas são desenhados
// para abraçar a imagem e conectar as palavras. Este módulo desenha esses traços:
//   - pena pontuda ("pointed"): grosso nas descidas, fino nas subidas, pontas afinando — o padrão copperplate;
//   - pena chata ("broad"): largura pelo ângulo fixo da pena (itálico chancery, letreiro de pincel chato).
// A curva passa pelos pontos dados (Catmull-Rom centrípeta), então dá para "desenhar" com poucos pontos.
//
// Uso:
//   const F = require("./flourish.js");
//   const f = F.flourish([[100,400],[600,300],[900,520],[700,640],[560,470],[1400,420]], { min: 5, max: 26 });
//   svg += `<g fill="#C4252F">${f.svg}</g>`;
//   F.swash(x1, x2, y, { loop: "start" })  -> floreio horizontal pronto (sublinhado com laço)
// Medidas em px a 300 DPI (1 mm ≈ 11,8 px). Para o DTF, min >= 5 px (≈0,42 mm).

function catmullRom(points, perSeg = 40) {
  const P = points.map(([x, y]) => ({ x, y }));
  if (P.length < 2) throw new Error("passe pelo menos 2 pontos");
  const first = { x: 2 * P[0].x - P[1].x, y: 2 * P[0].y - P[1].y };
  const last = { x: 2 * P[P.length - 1].x - P[P.length - 2].x, y: 2 * P[P.length - 1].y - P[P.length - 2].y };
  const Q = [first, ...P, last];
  const out = [];
  const tj = (ti, a, b) => ti + Math.pow(Math.hypot(b.x - a.x, b.y - a.y), 0.5) || ti + 1e-6;
  for (let i = 0; i < Q.length - 3; i++) {
    const [p0, p1, p2, p3] = [Q[i], Q[i + 1], Q[i + 2], Q[i + 3]];
    const t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
    for (let k = 0; k < perSeg; k++) {
      const t = t1 + ((t2 - t1) * k) / perSeg;
      const A1 = lerp2(p0, p1, (t - t0) / (t1 - t0)), A2 = lerp2(p1, p2, (t - t1) / (t2 - t1)), A3 = lerp2(p2, p3, (t - t2) / (t3 - t2));
      const B1 = lerp2(A1, A2, (t - t0) / (t2 - t0)), B2 = lerp2(A2, A3, (t - t1) / (t3 - t1));
      out.push(lerp2(B1, B2, (t - t1) / (t2 - t1)));
    }
  }
  out.push(P[P.length - 1]);
  return out;
}
function lerp2(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Reamostra a polilinha em passos de comprimento iguais. */
function resample(pts, step) {
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    let seg = Math.hypot(b.x - a.x, b.y - a.y);
    while (acc + seg >= step) {
      const t = (step - acc) / seg;
      a = lerp2(a, b, t);
      out.push(a);
      seg = Math.hypot(b.x - a.x, b.y - a.y);
      acc = 0;
    }
    acc += seg;
  }
  if (Math.hypot(out[out.length - 1].x - pts[pts.length - 1].x, out[out.length - 1].y - pts[pts.length - 1].y) > step * 0.3) out.push(pts[pts.length - 1]);
  return out;
}

function smooth(arr, radius) {
  if (radius < 1) return arr;
  return arr.map((_, i) => {
    let s = 0, n = 0;
    for (let k = -radius; k <= radius; k++) {
      const j = Math.min(arr.length - 1, Math.max(0, i + k));
      s += arr[j]; n++;
    }
    return s / n;
  });
}

/**
 * Traço caligráfico pelos pontos dados.
 * opts: min (largura do fino, px), max (largura do grosso, px), pen ("pointed" | "broad"), angle (graus da pena chata),
 *       taperIn / taperOut (fração do comprimento que afina nas pontas), step (px entre amostras), shadeSoft (suavização).
 * Retorna { svg, length, bbox }: svg são elementos sem cor — envolva num <g fill="...">.
 */
function flourish(points, opts = {}) {
  const { min = 6, max = 26, pen = "pointed", angle = 40, taperIn = 0.1, taperOut = 0.22, step = 1.6, shadeSoft = 14 } = opts;
  const pts = resample(catmullRom(points), step);
  const n = pts.length;
  const tan = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
  });
  let w;
  if (pen === "broad") {
    const pa = (angle * Math.PI) / 180;
    w = tan.map((t) => min + (max - min) * Math.abs(Math.sin(Math.atan2(t.y, t.x) - pa)));
  } else {
    // pena pontuda: pressão nas descidas (t.y > 0 no SVG, que cresce para baixo)
    const shade = smooth(tan.map((t) => Math.max(0, t.y) ** 1.4), Math.round(shadeSoft / step));
    w = shade.map((s) => min + (max - min) * s);
  }
  const end = min * 0.45;
  w = w.map((v, i) => {
    const s = i / (n - 1);
    const tIn = taperIn > 0 ? Math.min(1, s / taperIn) : 1;
    const tOut = taperOut > 0 ? Math.min(1, (1 - s) / taperOut) : 1;
    const k = Math.sin((Math.min(tIn, tOut) * Math.PI) / 2);
    return end + (v - end) * k;
  });
  let svg = "";
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  const f = (v) => v.toFixed(2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], r = w[i] / 2;
    x1 = Math.min(x1, p.x - r); y1 = Math.min(y1, p.y - r); x2 = Math.max(x2, p.x + r); y2 = Math.max(y2, p.y + r);
    svg += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r)}"/>`;
    if (i < n - 1) {
      const q = pts[i + 1], rq = w[i + 1] / 2, t = tan[i], tq = tan[i + 1];
      svg += `<polygon points="${f(p.x - t.y * r)},${f(p.y + t.x * r)} ${f(q.x - tq.y * rq)},${f(q.y + tq.x * rq)} ${f(q.x + tq.y * rq)},${f(q.y - tq.x * rq)} ${f(p.x + t.y * r)},${f(p.y - t.x * r)}"/>`;
    }
  }
  let length = 0;
  for (let i = 1; i < n; i++) length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return { svg, length, bbox: { x1, y1, x2, y2 }, points: pts, widths: w };
}

/**
 * Floreio horizontal pronto: sublinhado ondulado com laço oval numa ponta (ou nas duas).
 * x1→x2 na altura y; opts: loop ("start" | "end" | "both" | "none"), loopSize (px), wave (px), min, max.
 */
function swash(x1, x2, y, opts = {}) {
  const { loop = "start", loopSize = 140, wave = 26 } = opts;
  const L = x2 - x1, s = loopSize;
  let pts = [];
  if (loop === "start" || loop === "both") {
    pts.push([x1 + s * 1.1, y - s * 0.05], [x1 + s * 0.55, y - s * 0.62], [x1, y - s * 0.3], [x1 + s * 0.35, y + s * 0.12]);
  } else pts.push([x1, y + wave * 0.5]);
  const seg = 5;
  for (let i = 1; i < seg; i++) pts.push([x1 + s * 0.6 + ((L - s * 1.2) * i) / seg, y + (i % 2 ? -wave : wave)]);
  if (loop === "end" || loop === "both") {
    pts.push([x2 - s * 0.35, y - s * 0.12], [x2, y + s * 0.3], [x2 - s * 0.55, y + s * 0.62], [x2 - s * 1.1, y + s * 0.05]);
  } else pts.push([x2, y - wave * 0.4]);
  return flourish(pts, { taperIn: 0.06, taperOut: 0.18, ...opts });
}

module.exports = { flourish, swash, catmullRom, resample };
