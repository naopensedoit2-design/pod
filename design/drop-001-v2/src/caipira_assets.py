#!/usr/bin/env python3
"""Vaga 4 — prepara o recorte de "Caipira picando fumo" (Almeida Júnior, 1893, domínio público).

Gera em work/:
  caipira-vig.png  pintura com bordas que se dissolvem (topo e laterais), base reta -> passar no halftone
  caipira-rect.png recorte retangular simples
  caipira-sil.png  silhueta do homem (polígono desenhado na prévia 700x890, x4) com borda suave -> halftone
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../tools/.pylib'))
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../work/')
im = Image.open(W + 'caipira-crop.jpg').convert('RGB')
w, h = im.size
rgb = np.asarray(im)

def save(alpha, name, crop=True):
    a = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    out = np.dstack([rgb, a])
    if crop:
        ys, xs = np.nonzero(a > 2)
        out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(out, 'RGBA').save(W + name, dpi=(300, 300))
    print(name, out.shape[1], 'x', out.shape[0])

# 1) vinheta: topo e laterais somem; base reta
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
fx = np.minimum(xx, w - 1 - xx) / (0.24 * w)
fy = yy / (0.30 * h)
v = np.clip(np.minimum(fx, fy), 0, 1)
v = v * v * (3 - 2 * v)  # suave nas duas pontas
save(v, 'caipira-vig.png', crop=False)

# 2) retângulo
save(np.ones((h, w), np.float32), 'caipira-rect.png', crop=False)

# 3) silhueta (pontos na prévia 700x890)
pts = [(300,60),(318,32),(360,22),(400,35),(418,70),(428,108),(412,150),(420,180),(468,210),(500,262),(515,330),(528,400),
       (532,450),(548,490),(552,540),(535,600),(530,665),(505,700),(508,770),(505,835),(480,862),(445,858),(432,820),(436,760),
       (438,700),(445,660),(438,610),(415,580),(395,560),(330,566),(270,592),(236,640),(220,690),(218,760),(208,800),(188,815),
       (150,805),(135,780),(145,730),(160,690),(150,640),(128,600),(110,575),(105,520),(112,450),(128,400),(140,330),(165,260),
       (205,210),(255,185),(290,160),(298,120)]
m = Image.new('L', (w, h), 0)
ImageDraw.Draw(m).polygon([(x * 4, y * 4) for x, y in pts], fill=255)
bench = [(82,446),(110,436),(250,452),(560,428),(612,432),(616,526),(560,545),(450,556),(330,572),(250,598),(110,598),(84,588)]  # termina nas estacas
ImageDraw.Draw(m).polygon([(x * 4, y * 4) for x, y in bench], fill=255)
mask = np.asarray(m) > 0
# a borda suave fica para dentro do contorno: sem auréola da parede em volta do corpo
soft = ndi.gaussian_filter(ndi.binary_erosion(mask, iterations=26).astype(np.float32), 14)
save(soft, 'caipira-sil.png')
Image.fromarray((mask * 255).astype(np.uint8)).resize((w // 4, h // 4)).save('/tmp/claude-0/-home-user-pod/123336b1-2bac-5872-b958-31b970bc37b6/scratchpad/caipira-mask.png')
