#!/usr/bin/env python3
"""Recortes de leitura para analisar referências com precisão.

Olhar só a miniatura engana: traço, textura, serifa, floreio e borda de recorte só aparecem perto. Para cada
imagem, gera: a peça inteira (até 1600 px), um índice com a grade numerada e recortes em resolução nativa
(com sobreposição). Leia a inteira, depois os recortes — e preencha a ficha de leitura.

Uso:
  python3 design/tools/ref_zoom.py img1.jpg img2.png ... --out design/<projeto>/refs/zoom [--tile 900]
  python3 design/tools/ref_zoom.py https://i.pinimg.com/736x/ab/cd/ef/arquivo.jpg --out ...   (baixa o original do Pinterest)
"""
import os, sys, re, argparse, subprocess
_lib = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.pylib')
if os.path.isdir(_lib):
    sys.path.insert(0, _lib)
from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('images', nargs='+')
ap.add_argument('--out', required=True)
ap.add_argument('--tile', type=int, default=900, help='lado máximo de cada recorte, em px da imagem original')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)


def fetch(url):
    """Baixa a imagem; no Pinterest tenta primeiro o arquivo original (maior resolução)."""
    name = os.path.basename(url.split('?')[0])
    dst = os.path.join(a.out, '_src', name)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tries = [url]
    m = re.match(r'https://i\.pinimg\.com/[^/]+/(.+)$', url)
    if m:
        base = m.group(1)
        tries = [f'https://i.pinimg.com/originals/{os.path.splitext(base)[0]}{ext}' for ext in ('.png', '.jpg', '.jpeg', '.webp')] + [url]
    for u in tries:
        if subprocess.run(['curl', '-sSfL', '-o', dst, u], capture_output=True).returncode == 0:
            return dst
    raise SystemExit(f'não consegui baixar {url}')


for src in a.images:
    path = fetch(src) if src.startswith('http') else src
    im = Image.open(path).convert('RGB')
    W, H = im.size
    stem = os.path.splitext(os.path.basename(path))[0]
    d = os.path.join(a.out, stem)
    os.makedirs(d, exist_ok=True)
    fit = im.copy(); fit.thumbnail((1600, 1600), Image.LANCZOS)
    fit.save(os.path.join(d, '0-inteira.jpg'), quality=90)
    # grade com sobreposição de ~15%
    t = min(a.tile, max(W, H))
    step = int(t * 0.85)
    cols = max(1, -(-(W - t) // step) + 1) if W > t else 1
    rows = max(1, -(-(H - t) // step) + 1) if H > t else 1
    idx = fit.copy(); dr = ImageDraw.Draw(idx); s = fit.width / W
    n = 0
    for r in range(rows):
        for c in range(cols):
            x0 = min(c * step, max(0, W - t)); y0 = min(r * step, max(0, H - t))
            box = (x0, y0, min(W, x0 + t), min(H, y0 + t))
            crop = im.crop(box)
            if max(crop.size) < 700:  # imagem pequena: amplia para enxergar melhor (não cria detalhe)
                k = 700 / max(crop.size); crop = crop.resize((round(crop.width * k), round(crop.height * k)), Image.LANCZOS)
            n += 1
            crop.save(os.path.join(d, f'recorte-{n:02d}-l{r + 1}c{c + 1}.jpg'), quality=92)
            dr.rectangle([box[0] * s, box[1] * s, box[2] * s - 1, box[3] * s - 1], outline=(220, 30, 40), width=2)
            dr.text((box[0] * s + 6, box[1] * s + 4), f'{n:02d}', fill=(220, 30, 40))
    idx.save(os.path.join(d, '0-indice.jpg'), quality=88)
    print(f'{stem}: {W}x{H} px -> {n} recortes em {d}')
