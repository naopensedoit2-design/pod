#!/usr/bin/env node
// Produção na YouDraw: posições, prévias, upload das artes e criação dos produtos (API Comercial v1).
//
// Uso (a partir da raiz do repositório):
//   node design/tools/produce.js design/<projeto>/drop.json              -> só calcula posições e gera prévias
//   node design/tools/produce.js design/<projeto>/drop.json --create     -> sobe as artes e cria os produtos (só com aprovação do usuário)
//   node design/tools/produce.js design/<projeto>/drop.json --only=D01,D02
//   node design/tools/produce.js get <id-do-produto>                     -> JSON do produto (SKUs, custo, status do mockup)
//
// drop.json (caminhos relativos à pasta do arquivo):
// { "prefix": "LENTO 002", "ref_prefix": "lento-d002", "suffix": { "40": " Malha 100% algodão." },
//   "designs": [ { "id": "D01", "slug": "nome-curto", "name": "Camiseta Nome", "front": "D01-frente.png", "back": "D01-costas.png",
//                  "colors": { "40": ["Off-White"] }, "desc": "Descrição da loja.", "placement": { "frontOffset": 10, "backTop": 8 } } ] }
//
// A chave da YouDraw é injetada pelo proxy do ambiente: o cabeçalho usa um marcador ("proxy-injected"), nunca a chave real.
// A chave não tem permissão de pedidos/pagamentos — e este script nunca deve criar pedidos.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

// O fetch do Node só usa o proxy do ambiente com NODE_USE_ENV_PROXY=1: reinicia o processo com a variável, se faltar.
if (require.main === module && !process.env.NODE_USE_ENV_PROXY && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" } });
  process.exit(r.status ?? 1);
}

const M = require("./mockup.js");
const { sharp } = require("./lib.js");
const YD = "https://api.youdraw.com.br/api/v1";

async function yd(p, { method = "GET", body, headers = {} } = {}) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(YD + p, { method, body, headers: { Authorization: "Bearer proxy-injected", Accept: "application/json", ...headers } });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 4000 * (i + 1))); continue; }
    if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
    return json.data ?? json;
  }
  throw new Error(`${method} ${p}: falhou após novas tentativas`);
}

// Chaves de idempotência guardadas por projeto: repetir o comando nunca duplica arte nem produto.
function keyStore(dir) {
  const file = path.join(dir, "yd_keys.json");
  const keys = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return (name) => {
    if (!keys[name]) { keys[name] = crypto.randomUUID(); fs.writeFileSync(file, JSON.stringify(keys, null, 1)); }
    return keys[name];
  };
}

async function uploadArtwork(file, name, idem) {
  const fd = new FormData();
  fd.set("name", name);
  fd.set("file", new Blob([fs.readFileSync(file)], { type: "image/png" }), path.basename(file));
  return yd("/artworks", { method: "POST", body: fd, headers: { "Idempotency-Key": idem(`art:${path.basename(file)}:${fs.statSync(file).size}`) } });
}

async function createProduct(body, idem) {
  return yd("/products", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json", "Idempotency-Key": idem(`prod:${body.external_reference}`) } });
}

async function runDrop(dropFile, { create = false, only = null } = {}) {
  const dir = path.dirname(path.resolve(dropFile));
  const drop = JSON.parse(fs.readFileSync(dropFile, "utf8"));
  const idem = keyStore(dir);
  const resFile = path.join(dir, "yd_results.json");
  const results = fs.existsSync(resFile) ? JSON.parse(fs.readFileSync(resFile, "utf8")) : {};
  const save = () => fs.writeFileSync(resFile, JSON.stringify(results, null, 1));
  fs.mkdirSync(path.join(dir, "previews"), { recursive: true });
  for (const d of drop.designs) {
    if (only && !only.includes(d.id)) continue;
    const front = d.front && path.join(dir, d.front), back = d.back && path.join(dir, d.back);
    const fa = front && (await M.artCm(front)), ba = back && (await M.artCm(back));
    const out = (results[d.id] ??= { name: d.name, bases: {} });
    if (create && !out.artworks) {
      out.artworks = {};
      if (front) out.artworks.front = +(await uploadArtwork(front, `${drop.prefix} ${d.name} - frente`, idem)).id;
      if (back) out.artworks.back = +(await uploadArtwork(back, `${drop.prefix} ${d.name} - costas`, idem)).id;
      save();
    }
    for (const base of Object.keys(d.colors)) {
      const colors = d.colors[base];
      const pf = front && M.placement(base, colors[0], "front", fa, d.placement ?? {});
      const pb = back && M.placement(base, colors[0], "back", ba, d.placement ?? {});
      for (const c of colors) {
        const tiles = [];
        if (front) tiles.push(await M.previewOn(base, c, "front", front, pf));
        if (back) tiles.push(await M.previewOn(base, c, "back", back, pb));
        await sharp({ create: { width: 1000 * tiles.length, height: 1000, channels: 3, background: "#E9E7E1" } })
          .composite(tiles.map((t, i) => ({ input: t, left: i * 1000, top: 0 })))
          .jpeg({ quality: 88 })
          .toFile(path.join(dir, "previews", `${d.id}-${base}-${M.slug(c)}.jpg`));
      }
      const ob = (out.bases[base] ??= {});
      ob.placements = { ...(pf && { front: pf }), ...(pb && { back: pb }) };
      if (create && !ob.productId) {
        const label = M.BASES[base].label;
        const designs = [];
        if (front) designs.push({ side: "front", artwork_id: out.artworks.front, placement: pf });
        if (back) designs.push({ side: "back", artwork_id: out.artworks.back, placement: pb });
        const body = {
          external_reference: `${drop.ref_prefix}-${d.slug}-${base}`,
          catalog_product_id: +base,
          name: `${d.name} — ${label}`,
          description: d.desc + (drop.suffix?.[base] ?? ""),
          technique: "DTF",
          colors,
          sizes: M.BASES[base].sizes,
          designs,
        };
        ob.productId = (await createProduct(body, idem)).id;
        save();
        console.log("produto criado", d.id, base, ob.productId);
      }
    }
    save();
    console.log(d.id, "ok", JSON.stringify(out.bases));
  }
}

module.exports = { yd, uploadArtwork, createProduct, keyStore, runDrop };

if (require.main === module) {
  const a = process.argv.slice(2);
  (async () => {
    if (a[0] === "get") return console.log(JSON.stringify(await yd(`/products/${a[1]}`), null, 1));
    if (!a[0]) throw new Error("uso: node produce.js <drop.json> [--create] [--only=D01,D02] | get <id>");
    const onlyArg = a.find((x) => x.startsWith("--only="));
    await runDrop(a[0], { create: a.includes("--create"), only: onlyArg ? onlyArg.split("=")[1].split(",") : null });
  })().catch((e) => {
    console.error("ERRO:", e.message);
    process.exit(1);
  });
}
