#!/usr/bin/env python3
"""Retícula (halftone) para DTF: transforma transparência suave ou tons de cinza em pontos sólidos.

O DTF não imprime semitransparência: vinheta, degradê, sombra suave e foto em tom contínuo precisam virar
pontos. Usada com intenção, a retícula também é linguagem (serigrafia, jornal, pôster antigo).

Modos:
  alpha      (padrão) mantém as cores; só a transparência parcial vira pontos. Áreas quase opacas ficam sólidas.
  luminance  imagem -> uma tinta (--ink). Escuro = mais tinta. Bom para foto/pintura em 1 cor.

Exemplos:
  python3 design/tools/halftone.py vinheta.png saida.png --lpi 28
  python3 design/tools/halftone.py pintura.png saida.png --mode luminance --ink "#1E1A17" --lpi 35 --angle 45
LPI típico para camiseta: 20–35 (pontos visíveis, estética de serigrafia) ou 40–55 (mais fino; confira o ponto mínimo).
"""
import os, sys, math, argparse
_lib = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.pylib')
if os.path.isdir(_lib):
    sys.path.insert(0, _lib)
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--mode', choices=['alpha', 'luminance'], default='alpha')
ap.add_argument('--lpi', type=float, default=30)
ap.add_argument('--angle', type=float, default=22.5)
ap.add_argument('--ink', default='#1E1A17', help='cor da tinta no modo luminance')
ap.add_argument('--invert', action='store_true', help='no modo luminance, claro = mais tinta (tinta clara em camiseta escura)')
ap.add_argument('--min-dot-mm', type=float, default=0.65, help='menor ponto de tinta (abaixo disso some); 0,65 mm passa com folga no qa.py')
ap.add_argument('--min-hole-mm', type=float, default=0.55, help='menor furo nas áreas escuras (abaixo disso vira sólido)')
ap.add_argument('--gamma', type=float, default=1.0, help='>1 clareia os meios-tons, <1 escurece')
a = ap.parse_args()

img = Image.open(a.src)
dpi = img.info.get('dpi', (300, 300))[0] or 300
src = np.asarray(img.convert('RGBA'))
H, W = src.shape[:2]
cell = dpi / a.lpi
ang = math.radians(a.angle)
ca, sa = math.cos(ang), math.sin(ang)
min_r = (a.min_dot_mm / 25.4 * dpi) / 2 / cell
min_h = (a.min_hole_mm / 25.4 * dpi) / 2 / cell
ink = np.array([int(a.ink.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)], np.uint8)

# Densidade (0–1) numa grade reduzida e suavizada: cada célula usa a densidade média do seu centro, então cada
# ponto sai inteiro e redondo (sem fragmentos que viram "ilhas" no DTF).
down = max(1, int(cell / 3))
small = Image.fromarray(src).resize((max(1, W // down), max(1, H // down)), Image.BOX)
sm = np.asarray(small).astype(np.float32)
if a.mode == 'luminance':
    L = (sm[..., :3] @ np.array([0.2126, 0.7152, 0.0722], np.float32)) / 255.0
    dens_map = (L if a.invert else 1 - L) * (sm[..., 3] / 255.0)
else:
    dens_map = sm[..., 3] / 255.0
dens_map = ndi.gaussian_filter(np.clip(dens_map, 0, 1) ** a.gamma, sigma=cell / (2.5 * down))

out = np.zeros((H, W, 4), np.uint8)
xx = np.arange(W, dtype=np.float32)[None, :]
covered = 0
for y0 in range(0, H, 1024):                       # em faixas, para caber na memória com artes grandes
    h = min(1024, H - y0)
    yy = np.arange(y0, y0 + h, dtype=np.float32)[:, None]
    u = (xx * ca + yy * sa) / cell
    v = (-xx * sa + yy * ca) / cell
    def sample(pu, pv):  # densidade num ponto da grade (em unidades de célula)
        px, py = (pu * ca - pv * sa) * cell, (pu * sa + pv * ca) * cell
        return ndi.map_coordinates(dens_map, [np.clip(py / down, 0, dens_map.shape[0] - 1), np.clip(px / down, 0, dens_map.shape[1] - 1)], order=1)
    # até 50%: pontos de tinta no centro da célula (densidade do centro);
    # acima: furos (papel) nos cantos, com a densidade do próprio canto — assim cada furo sai inteiro.
    dens_c = sample(np.floor(u) + 0.5, np.floor(v) + 0.5)
    dens_k = sample(np.round(u), np.round(v))
    inside = src[y0:y0 + h, :, 3] > 0                 # nada de tinta fora da figura original
    du, dv = u - np.floor(u) - 0.5, v - np.floor(v) - 0.5
    d_center = np.sqrt(du * du + dv * dv)
    d_corner = np.sqrt((0.5 - np.abs(du)) ** 2 + (0.5 - np.abs(dv)) ** 2)
    r_dot = np.sqrt(np.minimum(dens_c, 0.785) / math.pi)
    r_hole = np.sqrt((1 - dens_k) / math.pi)
    high = dens_k > 0.5
    on_low = (d_center <= r_dot) & (r_dot >= min_r) & (dens_c > 0.02)   # some com pontos pequenos demais para o DTF
    on_high = (d_corner >= r_hole) | (r_hole < min_h)                    # furo pequeno demais fecharia: vira sólido
    on = np.where(high, on_high, on_low) & inside
    out[y0:y0 + h, :, :3] = ink if a.mode == 'luminance' else src[y0:y0 + h, :, :3]
    out[y0:y0 + h, :, 3] = np.where(on, 255, 0)
    covered += int(on.sum())
Image.fromarray(out, 'RGBA').save(a.dst, dpi=(dpi, dpi), optimize=True)
print(f'{os.path.basename(a.dst)}: {a.lpi:g} LPI a {a.angle:g}°, célula {cell:.1f} px, ponto mínimo {a.min_dot_mm} mm, tinta em {100 * covered / (H * W):.1f}% da área')
