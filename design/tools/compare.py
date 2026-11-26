#!/usr/bin/env python3
"""Folha de comparação: imagens lado a lado na mesma altura (referência x nossa versão, versões A/B/C, drop inteiro).

Comparar lado a lado é o jeito mais rápido de enxergar o que está genérico. PNGs transparentes (arte de
impressão) são achatados sobre --art-bg.

Uso: python3 design/tools/compare.py --out folha.jpg [--height 640] [--cols 4] [--art-bg "#F1EEE6"] [--labels] a.png b.jpg ...
"""
import os, sys, argparse
_lib = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.pylib')
if os.path.isdir(_lib):
    sys.path.insert(0, _lib)
from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('images', nargs='+')
ap.add_argument('--out', required=True)
ap.add_argument('--height', type=int, default=640)
ap.add_argument('--cols', type=int, default=0, help='0 = tudo numa linha')
ap.add_argument('--gap', type=int, default=12)
ap.add_argument('--art-bg', default='#F1EEE6')
ap.add_argument('--labels', action='store_true', help='escreve o nome do arquivo sob cada imagem')
a = ap.parse_args()

bg = tuple(int(a.art_bg.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
cells = []
for f in a.images:
    im = Image.open(f)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); base = Image.new('RGBA', im.size, bg + (255,)); base.alpha_composite(im); im = base
    im = im.convert('RGB')
    w = round(im.width * a.height / im.height)
    im = im.resize((w, a.height), Image.LANCZOS)
    if a.labels:
        lab = Image.new('RGB', (w, a.height + 26), (255, 255, 255)); lab.paste(im, (0, 0))
        ImageDraw.Draw(lab).text((4, a.height + 6), os.path.basename(f)[:60], fill=(40, 40, 40)); im = lab
    cells.append(im)
cols = a.cols or len(cells)
rows = [cells[i:i + cols] for i in range(0, len(cells), cols)]
W = max(sum(c.width for c in r) + a.gap * (len(r) - 1) for r in rows)
Hc = cells[0].height
sheet = Image.new('RGB', (W, len(rows) * Hc + a.gap * (len(rows) - 1)), (255, 255, 255))
for ri, r in enumerate(rows):
    x = 0
    for c in r:
        sheet.paste(c, (x, ri * (Hc + a.gap))); x += c.width + a.gap
sheet.save(a.out, quality=88)
print(a.out, sheet.size)
