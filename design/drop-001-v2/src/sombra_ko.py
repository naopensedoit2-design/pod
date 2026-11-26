#!/usr/bin/env python3
"""Vaga 1 — sombra em retícula no tamanho da arte, com a frase recortada.

Coloca a densidade da sombra (work/sombra.png) na posição do layout, passa pela retícula e apaga os pontos
INTEIROS que encostam na máscara da frase (nada de meio ponto, que viraria ilha no DTF).
Uso: python3 src/sombra_ko.py A
"""
import os, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../tools/.pylib'))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

v = sys.argv[1] if len(sys.argv) > 1 else 'A'
W = os.path.join(HERE, '../work/')
lay = json.load(open(W + f'sombra-layout-{v}.json'))
px = lay['pxmm']
ko = np.asarray(Image.open(W + f'sombra-ko-{v}.png').convert('L')) > 127
H, Wd = ko.shape
sh = Image.open(W + 'sombra.png')
scale = px / (300 / 25.4)
if abs(scale - 1) > 1e-3:
    sh = sh.resize((max(1, round(sh.width * scale)), max(1, round(sh.height * scale))), Image.LANCZOS)
canvas = Image.new('RGBA', (Wd, H), (0, 0, 0, 0))
canvas.paste(sh, (round(lay['shadow']['x'] * px), round(lay['shadow']['y'] * px)))
dpi = round(px * 25.4)
canvas.save(W + f'sombra-dens-{v}.png', dpi=(dpi, dpi))
lpi = 24
subprocess.run([sys.executable, os.path.join(HERE, '../../tools/halftone.py'), W + f'sombra-dens-{v}.png', W + f'sombra-ht-{v}.png',
                '--lpi', f'{lpi:.2f}', '--angle', '45'], check=True)
ht = np.asarray(Image.open(W + f'sombra-ht-{v}.png')).copy()
on = ht[..., 3] > 127
# nas áreas densas a tinta é uma malha contínua: corta no contorno da frase e depois tira só as
# lascas pequenas que o corte criou (menores que um ponto mínimo do DTF)
cut = on & ~ko
lab, n = ndi.label(cut)
sizes = ndi.sum(cut, lab, range(1, n + 1)) if n else np.array([])
min_px = 0.30 * (dpi / 25.4) ** 2
small = np.isin(lab, np.nonzero(sizes < min_px)[0] + 1)
cut &= ~small
ht[..., 3] = np.where(cut, 255, 0)
Image.fromarray(ht, 'RGBA').save(W + f'sombra-canvas-{v}.png', dpi=(dpi, dpi))
print(f'{v}: corte da frase; {int(small.sum())} px de lascas removidos')
