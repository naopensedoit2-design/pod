#!/usr/bin/env python3
"""Folhas de apresentação: prévia no mockup (frente/costas) + detalhe da arte a 100% (300 DPI).
Uso: python3 src/folhas.py   (depois de build.sh). Saída: previas/folha-*.jpg
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../tools/.pylib'))
from PIL import Image

R = os.path.join(HERE, '..')
PX = 300 / 25.4
H = 1000

def detail(art, box_mm, bg):
    im = Image.open(os.path.join(R, 'final', art))
    x0, y0, x1, y1 = [int(v * PX) for v in box_mm]
    c = im.crop((x0, y0, x1, y1)).convert('RGBA')
    b = Image.new('RGBA', c.size, bg + (255,)); b.alpha_composite(c)
    b = b.convert('RGB')
    return b.resize((round(b.width * H / b.height), H), Image.LANCZOS)

def sheet(name, preview, art, box_mm, bg):
    p = Image.open(os.path.join(R, 'previas', preview)).convert('RGB')
    p = p.resize((round(p.width * H / p.height), H), Image.LANCZOS)
    d = detail(art, box_mm, bg)
    s = Image.new('RGB', (p.width + d.width + 16, H), (255, 255, 255))
    s.paste(p, (0, 0)); s.paste(d, (p.width + 16, 0))
    s.save(os.path.join(R, 'previas', f'folha-{name}.jpg'), quality=90)
    print(name, s.size)

sheet('sossega', 'final-sossega.jpg', 'sossega-C.png', (30, 30, 190, 130), (25, 77, 75))
sheet('homeoffice', 'final-homeoffice.jpg', 'homeoffice-A.png', (40, 0, 300, 120), (106, 81, 36))
sheet('sombra', 'final-sombra.jpg', 'sombra-B.png', (140, 0, 285, 105), (239, 239, 220))
sheet('bula', 'final-bula.jpg', 'bula-B.png', (0, 60, 200, 190), (255, 255, 255))
