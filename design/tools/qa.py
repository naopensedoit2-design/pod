#!/usr/bin/env python3
"""QA de impressão DTF: tamanho em cm, semitransparência, ilhas e furos minúsculos, traços finos, área de tinta.

Uso: python3 design/tools/qa.py arte1.png arte2.png ... [--fix] [--min-mm 0.4]
--fix remove ilhas minúsculas, preenche furinhos e binariza o alfa. Não engrossa traços: para isso use min_stroke.py.
"""
import os, sys, json, glob, argparse
_lib = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.pylib')
if os.path.isdir(_lib):
    sys.path.insert(0, _lib)
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('files', nargs='+')
ap.add_argument('--fix', action='store_true')
ap.add_argument('--min-mm', type=float, default=0.4)
a = ap.parse_args()
files = sorted({f for p in a.files for f in glob.glob(p)})

for f in files:
    img = Image.open(f)
    dpi = round(img.info.get('dpi', (300, 300))[0] or 300)
    px_mm = dpi / 25.4
    im = np.asarray(img.convert('RGBA')).copy()
    al = im[..., 3]
    op = al >= 128
    partial = int(((al > 0) & (al < 255)).sum())
    lab, n = ndi.label(op, structure=np.ones((3, 3)))
    sizes = ndi.sum(op, lab, range(1, n + 1)) if n else np.array([])
    island_px = 0.28 * px_mm ** 2          # ilhas < ~0,28 mm² somem ou soltam na transferência
    tiny = int((sizes < island_px).sum())
    holes = ndi.binary_fill_holes(op) & ~op
    hl, hn = ndi.label(holes)
    hsz = ndi.sum(holes, hl, range(1, hn + 1)) if hn else np.array([])
    hole_px = 0.18 * px_mm ** 2           # furos < ~0,18 mm² fecham com a tinta
    tinyh = int((hsz < hole_px).sum())
    r = a.min_mm / 2 * px_mm
    dist = ndi.distance_transform_edt(op)
    # pixel "fino": não cabe um disco do diâmetro mínimo em volta dele (abertura morfológica via distância)
    thin = op & ~(ndi.distance_transform_edt(~(dist >= r)) <= r)
    msg = {
        'arquivo': os.path.basename(f), 'dpi': dpi,
        'cm': [round(im.shape[1] / px_mm / 10, 2), round(im.shape[0] / px_mm / 10, 2)],
        'semitransparentes': partial, 'ilhas_minusculas': tiny, 'furos_minusculos': tinyh,
        f'pct_tracos_abaixo_{a.min_mm}mm': round(100 * thin.sum() / max(op.sum(), 1), 3),
        'pct_area_com_tinta': round(100 * op.sum() / op.size, 1),
    }
    if dpi < 290:
        msg['alerta'] = 'resolução abaixo de 300 DPI'
    if tiny:
        # lista as ilhas com posição em mm: pontos finais, pingos de "i" e acentos pequenos caem aqui
        objs = ndi.find_objects(lab)
        msg['ilhas_em_mm'] = [[round(objs[i][1].start / px_mm, 1), round(objs[i][0].start / px_mm, 1)] for i in np.nonzero(sizes < island_px)[0][:12]]
        msg['aviso'] = 'confira as ilhas a 100%: podem ser pontuação ou acento (o --fix apagaria). Prefira aumentar o texto.'
    if a.fix and (tiny or tinyh or partial):
        keep = np.isin(lab, np.nonzero(sizes >= island_px)[0] + 1)
        small_holes = np.isin(hl, np.nonzero(hsz < hole_px)[0] + 1)
        if small_holes.any():
            idx = ndi.distance_transform_edt(~keep, return_distances=False, return_indices=True)
            im[small_holes, :3] = im[idx[0][small_holes], idx[1][small_holes], :3]
        im[..., 3] = np.where(keep | small_holes, 255, 0)
        Image.fromarray(im, 'RGBA').save(f, dpi=(dpi, dpi), optimize=True)
        msg['corrigido'] = True
    print(json.dumps(msg, ensure_ascii=False))
