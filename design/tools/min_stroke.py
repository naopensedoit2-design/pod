#!/usr/bin/env python3
"""Engrossa SÓ os traços mais finos que o mínimo do DTF, preservando o contraste da caligrafia.

Engrossar tudo por igual (contorno em volta do texto) mata o desenho da letra: as hastes grossas incham e o
contraste fino/grosso some — foi o que deixou o "Members Only" do Drop 001 pesado. Aqui, apenas os trechos com
largura menor que --mm ganham espessura até o mínimo.

Uso: python3 design/tools/min_stroke.py entrada.png saida.png [--mm 0.4]
"""
import os, sys, argparse
_lib = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.pylib')
if os.path.isdir(_lib):
    sys.path.insert(0, _lib)
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--mm', type=float, default=0.4)
a = ap.parse_args()

img = Image.open(a.src)
dpi = round(img.info.get('dpi', (300, 300))[0] or 300)
im = np.asarray(img.convert('RGBA')).copy()
op = im[..., 3] >= 128
W = a.mm / 25.4 * dpi                    # largura mínima em px
dist = ndi.distance_transform_edt(op)
# eixo central aproximado: máximos locais da distância à borda; ali, 2*dist ≈ largura local do traço
ridge = op & (dist >= ndi.maximum_filter(dist, size=3)) & (dist > 0)
thin_ridge = ridge & (2 * dist < W)
grow = ndi.distance_transform_edt(~thin_ridge) <= W / 2
add = grow & ~op
# a tinta nova herda a cor do pixel mais próximo da arte original
idx = ndi.distance_transform_edt(~op, return_distances=False, return_indices=True)
im[add, :3] = im[idx[0][add], idx[1][add], :3]
im[..., 3] = np.where(op | grow, 255, 0)
Image.fromarray(im, 'RGBA').save(a.dst, dpi=(dpi, dpi), optimize=True)
print(f'{os.path.basename(a.src)}: +{int(add.sum())} px em {int(thin_ridge.sum())} pontos finos (mínimo {a.mm} mm = {W:.1f} px)')
