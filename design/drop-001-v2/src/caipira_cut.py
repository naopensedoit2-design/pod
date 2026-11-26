#!/usr/bin/env python3
"""Vaga 4 — recorte justo, de borda dura, do "Caipira picando fumo" (Almeida Júnior, 1893, domínio público).

Pedido do diretor de arte (rodada dos esboços): recorte justo na figura e no banco, pontas do banco em corte reto,
sem o halo de parede no ombro e sem o chão da ponta esquerda; 1,5–2 cm de chão da pintura sob os pés, cortado reto.

Como:
1. GrabCut (OpenCV) parte do polígono antigo e acha o contorno do homem. Ele acerta a cabeça, o lado direito e as pernas.
2. Onde ele erra, forço fundo com polígonos traçados na pintura a 100% (com contraste esticado e mapa de textura:
   a parede de pau a pique mostra a trama da tela, a camisa pintada não):
   - parede à esquerda do rosto, do ombro e da manga (o halo de ~1 cm);
   - tronco e sombra entre as pernas, abaixo do assento.
3. O banco entra como peça geométrica: a tábua do assento, cortada reta nas duas estacas, com a cabeça da estaca esquerda.
4. Uma faixa reta de chão da pintura sob os pés.
Coordenadas dos polígonos: prévia 700 px de largura do recorte BOX (x4 = pixel da pintura).
Saída: work/caipira-hard.png (RGBA, ~304 DPI no tamanho da peça) e work/caipira-geo.json (assento e chão, para alinhar a frase).
Uso: python3 src/caipira_cut.py [estreita|larga]   (largura da faixa de chão; padrão: estreita)
"""
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../tools/.pylib'))
import numpy as np
import cv2
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
W = os.path.join(HERE, '../work/')
F = os.path.join(HERE, '../fontes/')
CHAO = sys.argv[1] if len(sys.argv) > 1 else 'estreita'
BOX = (620, 1300, 3420, 5100)  # recorte da pintura (3840 x 5465), mesma origem do recorte antigo
src = Image.open(F + 'Almeida_Júnior_-_Caipira_Cutting_Tobacco_-_Google_Art_Project.jpg').convert('RGB')
rgb = np.asarray(src.crop(BOX))
h, w = rgb.shape[:2]
S = 4  # prévia -> pintura
XX = np.arange(w)[None, :]

def poly_mask(*polys):
    m = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([(x * S, y * S) for x, y in p], fill=255)
    return np.asarray(m) > 0

# ---------- 1. GrabCut a partir do polígono antigo ----------
s = open(os.path.join(HERE, 'caipira_assets.py')).read()
pts = eval(re.search(r"pts = (\[.*?\])\n", s, re.S).group(1))
P = poly_mask(pts)
k = 2
small = cv2.resize(rgb[:, :, ::-1], (w // k, h // k), interpolation=cv2.INTER_AREA)
Ps = cv2.resize(P.astype(np.uint8), (w // k, h // k), interpolation=cv2.INTER_NEAREST) > 0
mask = np.full(Ps.shape, cv2.GC_BGD, np.uint8)
band = 22
mask[ndi.binary_dilation(Ps, iterations=band)] = cv2.GC_PR_BGD
mask[Ps] = cv2.GC_PR_FGD
mask[ndi.binary_erosion(Ps, iterations=band)] = cv2.GC_FGD
bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(small, mask, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
fgs = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
fgs = ndi.binary_opening(fgs, iterations=2)
fgs = ndi.binary_closing(fgs, iterations=3)
up = cv2.resize(fgs.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR) > 0.5

# ---------- 2. fundo forçado ----------
# parede à esquerda: cabelo, rosto, ombro e manga até o cotovelo (daí para baixo o GrabCut acerta)
parede = [(0, 0), (274, 0), (274, 60), (277, 90), (279, 105), (283, 115), (290, 123), (298, 128), (304, 135),
          (306, 145), (308, 155), (311, 165), (314, 175), (317, 185), (319, 192), (305, 194), (290, 197),
          (275, 197), (262, 196), (250, 198), (240, 203), (232, 208), (225, 213), (219, 219), (213, 226),
          (208, 232), (204, 240), (201, 248), (198, 256), (195, 264), (190, 272), (185, 280), (180, 288),
          (175, 296), (170, 304), (165, 312), (160, 320), (155, 328), (151, 336), (147, 344), (143, 352),
          (140, 358), (137, 363), (0, 363)]
# entre as pernas, abaixo do assento: frente da tábua, ponta da estaca inclinada, tronco deitado e sombra.
# Bordas laterais = lado de dentro do punho esquerdo (x 199, até y 598) e da calça direita (até y 662); abaixo disso
# quem decide a borda das canelas é a cor da pele (passo 2b), então o polígono recua para o meio.
meio = [(199, 550), (300, 549), (350, 549), (356, 535), (384, 531), (390, 535), (392, 549), (438, 549),
        (447, 544), (457, 548), (457, 560), (451, 568), (448, 580), (447, 600), (445, 620), (443, 640),
        (441, 662), (425, 670), (425, 806), (222, 806), (222, 690), (216, 682), (211, 672), (206, 662),
        (202, 655), (202, 600), (199, 598)]
# pontas, abaixo da tábua: estacas e chão
ponta_esq = [(0, 500), (105, 500), (104, 540), (0, 540)]
ponta_dir = [(566, 498), (700, 498), (700, 640), (566, 640)]
antes = up.copy()
up &= ~poly_mask(parede, meio, ponta_esq, ponta_dir)

# ---------- 2b. canelas e pés: borda pela cor da pele ----------
# Pele (canelas, pés) tem croma 34–53; chão, sombra do calcanhar e tronco ficam em 13–28. Histerese: > 31 é pele,
# > 26 conta se encostar na pele. Vale só abaixo dos punhos da calça e perto das pernas que o GrabCut achou.
lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
chroma = np.hypot(ndi.gaussian_filter(lab[..., 1], 2) - 128, ndi.gaussian_filter(lab[..., 2], 2) - 128)
lw, _ = ndi.label(chroma > 26)
forte = np.unique(lw[chroma > 31])
pele = np.isin(lw, forte[forte > 0])
disco = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
YY = np.arange(h)[:, None]
zona = ((YY >= 598 * S) & (XX < 300 * S) | (YY >= 662 * S) & (XX >= 300 * S)) & (YY < 806 * S)
perto = cv2.dilate(antes.astype(np.uint8), disco(20)) > 0
canela = (pele & perto & zona).astype(np.uint8)
# abertura de raio 12 px (~1 mm): some com as pinceladas avermelhadas do tronco grudadas na canela; dedos ficam
canela = cv2.morphologyEx(canela, cv2.MORPH_OPEN, disco(12))
canela = ndi.binary_fill_holes(cv2.morphologyEx(canela, cv2.MORPH_CLOSE, disco(6)) > 0)
canela = cv2.erode(canela.astype(np.uint8), disco(3)) > 0  # 0,25 mm para dentro: sem fio claro de chão na borda
up[zona] = canela[zona]
# a erosão abre uma fresta de 3 px entre o punho da calça e a canela: fecha a costura
up = cv2.morphologyEx(up.astype(np.uint8), cv2.MORPH_CLOSE, disco(6)) > 0

# ---------- 3. banco: tábua do assento em corte reto nas estacas ----------
XE, XD = 78, 614          # cortes retos (à esquerda da estaca esquerda, à direita da estaca direita)
TOPO, BASE = 421, 499     # topo do assento e base da tábua
up &= (XX >= XE * S) & (XX < XD * S)
banco = poly_mask([(XE, TOPO), (XD, TOPO - 1), (XD, BASE - 2), (XE, BASE + 1)],
                  [(80, TOPO), (80, 406), (84, 401), (92, 399), (100, 402), (103, 408), (103, TOPO)])  # cabeça da estaca
up |= banco

# fica só a figura (maior componente), sem furos
lab, n = ndi.label(up)
sizes = ndi.sum(up, lab, range(1, n + 1))
up = ndi.binary_fill_holes(lab == (np.argmax(sizes) + 1))

# ---------- 4. chão: faixa reta sob os pés ----------
CH_TOPO = 797          # acima da ponta dos dedos do pé esquerdo (y ~804 depois do recorte pela pele): ele pisa na faixa
CH_BASE = 860 + 46     # sola do pé direito (y 860) + 1,5 cm
cx0, cx1 = (XE, XD) if CHAO == 'larga' else (108, 538)
up |= poly_mask([(cx0, CH_TOPO), (cx1, CH_TOPO), (cx1, CH_BASE), (cx0, CH_BASE)])

# borda: suaviza o serrilhado do GrabCut e volta a ser dura (a reta continua reta)
up = ndi.gaussian_filter(up.astype(np.float32), 2.0) > 0.5

ys, xs = np.nonzero(up)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
Image.fromarray((up * 255).astype(np.uint8)).save(W + 'caipira-cut-mask.png')
out = np.dstack([rgb, (up * 255).astype(np.uint8)])[y0:y1, x0:x1]
Image.fromarray(out, 'RGBA').save(W + 'caipira-hard.png', dpi=(300, 300))
fr = lambda yp: round((yp * S - y0) / (y1 - y0), 4)
geo = {'w_px': int(x1 - x0), 'h_px': int(y1 - y0), 'assento': fr(TOPO), 'base_banco': fr(BASE), 'chao': fr(CH_TOPO),
       'banco_dir': round((XD * S - x0) / (x1 - x0), 4), 'chao_faixa': CHAO}
json.dump(geo, open(W + 'caipira-geo.json', 'w'), indent=1)
print('caipira-hard', out.shape[1], 'x', out.shape[0], json.dumps(geo))
