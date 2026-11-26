#!/usr/bin/env python3
"""Vaga 1 — coco de Köhler (1887, domínio público) e a sombra comprida de fim de tarde.

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
coco = Image.open(W + 'coco-cut.png')
s = COCO_MM * PX / coco.width
coco = coco.convert('RGBa').resize((round(coco.width * s), round(coco.height * s)), Image.LANCZOS).convert('RGBA')
a = np.asarray(coco).copy()
a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
Image.fromarray(a, 'RGBA').save(W + 'coco.png', dpi=(300, 300))
cw, ch = coco.size
print('coco', cw, 'x', ch, 'px', round(cw / PX), 'x', round(ch / PX), 'mm')

# 2) sombra: silhueta de ponta-cabeça, esticada na direção da luz
m = (a[..., 3] > 0).astype(np.float32)
mf = m[::-1]                                  # a ponta do coco vai para longe
k = L_MM * PX / ch                            # alongamento
stretched = np.asarray(Image.fromarray((mf * 255).astype(np.uint8)).resize((cw, max(1, round(ch * k))), Image.BILINEAR)).astype(np.float32) / 255
# densidade: forte na base (topo da imagem esticada) e mais leve na ponta
hh = stretched.shape[0]
t = np.linspace(0, 1, hh)[:, None]
ramp = 0.74 - 0.32 * (t * t * (3 - 2 * t))     # 74% junto à base -> 42% na ponta: sem faixa chapada e sem perder a ponta
dens = stretched * ramp
# penumbra: borda mais suave longe da base
dens = ndi.gaussian_filter(dens, 4)
# gira: o eixo da sombra aponta para baixo-esquerda, ANG graus abaixo da horizontal
rot = 90 - ANG                                # de "para baixo" para a direção da sombra (sentido horário)
img = Image.fromarray((np.clip(dens, 0, 1) * 255).astype(np.uint8))
pad = Image.new('L', (img.width + 40, img.height + 40), 0); pad.paste(img, (20, 20))
r = pad.rotate(-rot, resample=Image.BICUBIC, expand=True)
# ponto da base (centro do topo da imagem esticada) depois da rotação
cx0, cy0 = pad.width / 2, pad.height / 2
bx, by = 20 + cw / 2, 20 + 0
th = math.radians(rot)
dx, dy = bx - cx0, by - cy0
# rotação de -rot no PIL (anti-horário = positivo): coordenadas de imagem
rx = dx * math.cos(th) - dy * math.sin(th) * -1
ry = dx * math.sin(th) * -1 * -1 + dy * math.cos(th)
# recalcula de forma explícita: PIL rotate(angle) gira no sentido anti-horário; usamos -rot (horário)
ang = math.radians(-rot)
rx = dx * math.cos(ang) + dy * math.sin(ang)
ry = -dx * math.sin(ang) + dy * math.cos(ang)
base_px = (r.width / 2 + rx, r.height / 2 + ry)
alpha = np.asarray(r)
rgba = np.zeros((r.height, r.width, 4), np.uint8)
rgba[..., :3] = (34, 46, 40)                   # verde-sombra
rgba[..., 3] = alpha
Image.fromarray(rgba, 'RGBA').save(W + 'sombra.png', dpi=(300, 300))
geo = {'coco_mm': [cw / PX, ch / PX], 'sombra_mm': [r.width / PX, r.height / PX], 'base_na_sombra_mm': [base_px[0] / PX, base_px[1] / PX],
       'angulo': ANG, 'comprimento_mm': L_MM}
json.dump(geo, open(W + 'sombra-geo.json', 'w'), indent=1)
print(json.dumps(geo))
