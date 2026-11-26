#!/usr/bin/env python3
"""Recorta a figura de uma pintura, gravura ou foto com fundo relativamente uniforme.

Modela a cor do fundo a partir das bordas escolhidas (espaço Lab, distância de Mahalanobis), separa a figura,
limpa a máscara, fica com os maiores componentes e refina a borda em resolução cheia.
Usado no Drop 001 para o cavalo de "Whistlejacket" (Stubbs, 1762).

Uso:
  python3 design/tools/cutout.py pintura.jpg recorte.png [--threshold 6] [--sides top,left,right] [--keep 1]
         [--feather 0] [--no-fill] [--band 0.08]
--feather N (px) deixa a borda suave (transparência parcial) — depois passe por halftone.py para virar pontos no DTF.
Confira sempre o resultado ampliado: cabelo, crina, folhas e dedos costumam precisar de retoque manual.
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
ap.add_argument('--threshold', type=float, default=6.0, help='distância mínima ao fundo para virar figura (maior = recorte mais justo)')
ap.add_argument('--sides', default='top,left,right', help='bordas usadas para amostrar o fundo: top,bottom,left,right')
ap.add_argument('--band', type=float, default=0.08, help='espessura da faixa de amostra, fração da imagem')
ap.add_argument('--keep', type=int, default=1, help='quantos componentes (os maiores) manter')
ap.add_argument('--feather', type=float, default=0.0)
ap.add_argument('--no-fill', action='store_true', help='não preencher buracos internos (ex.: vão entre as pernas)')
ap.add_argument('--scale', type=int, default=4, help='redução para a primeira passada')
a = ap.parse_args()


def to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], np.float32)
    xyz = c @ M.T / np.array([0.9505, 1.0, 1.089], np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1).astype(np.float32)


im = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
small = im[::a.scale, ::a.scale]
lab = to_lab(small)
h, w = lab.shape[:2]
bh, bw = max(2, int(h * a.band)), max(2, int(w * a.band))
strips = {'top': lab[:bh], 'bottom': lab[-bh:], 'left': lab[:, :bw], 'right': lab[:, -bw:]}
bg = np.concatenate([strips[s].reshape(-1, 3) for s in a.sides.split(',')])
mu = bg.mean(0); inv = np.linalg.inv(np.cov(bg.T) + np.eye(3))


def dist(L):
    d = L - mu
    return np.sqrt(np.einsum('...i,ij,...j->...', d, inv, d))


def clean(fg, open_it, close_it):
    fg = ndi.binary_opening(fg, iterations=open_it)
    fg = ndi.binary_closing(fg, iterations=close_it)
    lab_, n = ndi.label(fg)
    if n == 0:
        raise SystemExit('nenhuma figura encontrada: baixe --threshold ou troque --sides')
    sizes = ndi.sum(fg, lab_, range(1, n + 1))
    keep = np.isin(lab_, np.argsort(sizes)[::-1][:a.keep] + 1)
    return keep if a.no_fill else ndi.binary_fill_holes(keep)


main = clean(dist(lab) > a.threshold, 2, 3)
# resolução cheia: refina a borda dentro de uma faixa em volta da máscara reduzida
big = np.asarray(Image.fromarray((main * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)) > 127
m = int(6 * a.scale)
band = ndi.binary_dilation(big, iterations=m)
core = ndi.binary_erosion(big, iterations=m)
fg = ((dist(to_lab(im)) > a.threshold) & band) | core
fg = clean(fg, 2, 4)
if a.feather > 0:
    alpha = np.clip(ndi.gaussian_filter(fg.astype(np.float32), a.feather), 0, 1)
else:
    alpha = (ndi.gaussian_filter(fg.astype(np.float32), 2.0) > 0.5).astype(np.float32)
ys, xs = np.nonzero(alpha > 0.01)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
rgba = np.dstack([im, alpha * 255]).astype(np.uint8)[y0:y1, x0:x1]
Image.fromarray(rgba, 'RGBA').save(a.dst, dpi=(300, 300), optimize=True)
print(f'{os.path.basename(a.dst)}: {rgba.shape[1]}x{rgba.shape[0]} px ({rgba.shape[1] / 118.11:.1f} x {rgba.shape[0] / 118.11:.1f} cm a 300 DPI)')
