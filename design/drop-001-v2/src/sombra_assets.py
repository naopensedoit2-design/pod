#!/usr/bin/env python3
"""Vaga 1 — coco de Köhler (1897, domínio público) e a sombra comprida de fim de tarde.

1. Recorta o coco inteiro (com casca) da prancha 187 de Köhler's Medizinal-Pflanzen.
2. Projeta a sombra a partir da própria silhueta: vira de ponta-cabeça, estica na direção da luz (sol baixo)
   e gira para a diagonal; densidade forte junto à base e mais leve na ponta.
3. Salva work/coco.png (o coco, 300 DPI no tamanho final), work/sombra.png (densidade em alfa, para o halftone)
   e work/sombra-geo.json (posições em mm para a composição).

Uso: python3 src/sombra_assets.py [comprimento_mm] [angulo_graus] [largura_coco_mm]
"""
import os, sys, json, math, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../tools/.pylib'))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
W = os.path.join(HERE, '../work/')
F = os.path.join(HERE, '../fontes/')
L_MM = float(sys.argv[1]) if len(sys.argv) > 1 else 300      # comprimento da sombra
ANG = float(sys.argv[2]) if len(sys.argv) > 2 else 32        # graus abaixo da horizontal, para a esquerda
COCO_MM = float(sys.argv[3]) if len(sys.argv) > 3 else 62    # largura do coco
PX = 300 / 25.4

# 1) recorte do coco inteiro (canto inferior esquerdo da prancha 1280 x 1916)
plate = Image.open(F + 'Cocos_nucifera_-_Köhler_s_Medizinal-Pflanzen-187.jpg').convert('RGB')
crop = plate.crop((20, 1120, 560, 1830))
crop.save(W + 'coco-crop.png')
subprocess.run([sys.executable, os.path.join(HERE, '../../tools/cutout.py'), W + 'coco-crop.png', W + 'coco-cut.png',
                '--sides', 'top,left,right,bottom', '--band', '0.04', '--threshold', '5'], check=True)
coco = Image.open(W + 'coco-cut.png').transpose(Image.FLIP_LEFT_RIGHT)   # espelhado: a luz da prancha passa a vir da direita
s = COCO_MM * PX / coco.width
coco = coco.convert('RGBa').resize((round(coco.width * s), round(coco.height * s)), Image.LANCZOS).convert('RGBA')
a = np.asarray(coco).copy()
a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
Image.fromarray(a, 'RGBA').save(W + 'coco.png', dpi=(300, 300))
cw, ch = coco.size
print('coco', cw, 'x', ch, 'px', round(cw / PX), 'x', round(ch / PX), 'mm')

# 2) sombra como projeção do coco: largura constante (a do coco), início arredondado no ponto de contato,
#    fim arredondado com uma pontinha (o bico do coco, <= 4 cm)
from PIL import ImageDraw
SS = 3                                         # supersampling para borda limpa
r = COCO_MM / 2
tip = 9.0                                       # bico do coco: discreto, para não virar "balão de fala"
L = L_MM - tip
A = math.radians(ANG)
d = (-math.cos(A), math.sin(A))                 # direção da sombra (baixo-esquerda)
n = (math.sin(A), math.cos(A))                  # perpendicular
e = 1.9 * r                                     # o fim é meia elipse alongada (sombra de fruta redonda)
u0, u1 = 0.7 * r, L - e
pts = []
for th in np.linspace(90, 270, 40):            # início, sob o coco
    pts.append((u0 + r * math.cos(math.radians(th)), r * math.sin(math.radians(th))))
for th in np.linspace(-90, 90, 81):            # fim: meia elipse; perto do eixo ganha o bico suave
    c, sn = math.cos(math.radians(th)), math.sin(math.radians(th))
    bump = tip * max(0.0, 1 - abs(sn) / 0.35) ** 2
    pts.append((u1 + (e + bump) * c, r * sn))
def P(u, v):
    return (u * d[0] + v * n[0], u * d[1] + v * n[1])
xy = [P(u, v) for u, v in pts]
minx = min(p[0] for p in xy) - 4; miny = min(p[1] for p in xy) - 4
maxx = max(p[0] for p in xy) + 4; maxy = max(p[1] for p in xy) + 4
Wd, Hd = math.ceil((maxx - minx) * PX), math.ceil((maxy - miny) * PX)
mask = Image.new('L', (Wd * SS, Hd * SS), 0)
ImageDraw.Draw(mask).polygon([((x - minx) * PX * SS, (y - miny) * PX * SS) for x, y in xy], fill=255)
mask = np.asarray(mask.resize((Wd, Hd), Image.LANCZOS)).astype(np.float32) / 255
# densidade ao longo do eixo: 74% na base -> 47% na ponta
yy, xx = np.mgrid[0:Hd, 0:Wd].astype(np.float32)
X = xx / PX + minx; Y = yy / PX + miny
u = X * d[0] + Y * d[1]
t = np.clip(u / (L + tip), 0, 1)
dens = mask * (0.74 - 0.27 * t)
rgba = np.zeros((Hd, Wd, 4), np.uint8)
rgba[..., :3] = (34, 46, 40)                   # verde-sombra
rgba[..., 3] = (np.clip(dens, 0, 1) * 255).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(W + 'sombra.png', dpi=(300, 300))
geo = {'coco_mm': [cw / PX, ch / PX], 'sombra_mm': [Wd / PX, Hd / PX], 'base_na_sombra_mm': [-minx, -miny],
       'angulo': ANG, 'comprimento_mm': L + tip, 'largura_mm': COCO_MM}
json.dump(geo, open(W + 'sombra-geo.json', 'w'), indent=1)
print(json.dumps(geo))
