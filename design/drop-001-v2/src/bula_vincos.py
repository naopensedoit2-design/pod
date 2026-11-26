#!/usr/bin/env python3
"""Acha onde passam os vincos da bula desdobrada: dois verticais (perto de 1/3 e 2/3 da largura) e dois horizontais
(perto de 1/3 e 2/3 da altura), vazados de 0,8 mm e cortando tudo, como pediu o diretor de arte.

O vinco vazado só aparece onde corta tinta (no branco ele não existe), então ele precisa atravessar texto. Numa janela
de ±7 mm em volta de cada alvo, testa cada posição (passo de 1 px) e escolhe a que:
  1. não cria ilha (testa < 0,45 mm², com folga sobre o limite de 0,28 mm² do DTF): pingo, acento ou lasca de letra;
  2. cria o mínimo de lascas (< 0,9 mm²), que parecem defeito;
  3. corta tinta bastante para o vinco ser visto (≥ 30% do máximo da janela). Na prática ele escolhe linha de
     caixa-alta bold (as perguntas), que o corte divide em pedaços grandes;
  4. fica mais perto do alvo.
Uso: CAMADA=cortavel node src/bula.js B  &&  python3 src/bula_vincos.py B  &&  node src/bula.js B  &&  python3 src/bula_vincos.py B --limpar
Só a camada "cortável" (título, filetes, molécula, perguntas) é cortada; respostas e rótulos ficam inteiros.
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../tools/.pylib'))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

v = sys.argv[1] if len(sys.argv) > 1 else 'B'
R = os.path.join(HERE, '..')
OUT = 'sketch' if float(os.environ.get('PXMM') or 99) < 10 else 'final'  # igual a out() de common.js
LIMPAR = '--limpar' in sys.argv
# a busca olha só a camada que os vincos cortam (CAMADA=cortavel node src/bula.js); a limpeza olha a arte final
im = Image.open(os.path.join(R, OUT, f'bula-{v}.png' if LIMPAR else f'bula-{v}-cortavel.png'))
dpi = im.info.get('dpi', (300, 300))[0] or 300
px = dpi / 25.4
a = np.asarray(im)[..., 3] > 127
H, W = a.shape
band = max(1, round(0.8 * px))         # 0,8 mm (testado com ±1 px de largura e de posição)
ILHA, LASCA = 0.45 * px * px, 0.9 * px * px  # folga sobre o limite de 0,28 mm² do QA: lasca no limite vira ilha
M = int(6 * px)  # margem da janela local em volta do corte
EIGHT = np.ones((3, 3))
filete = a.mean(axis=1) > 0.6  # linhas com tinta em mais de 60% da largura: os filetes horizontais

def pequenos(sub):
    lab, n = ndi.label(sub, structure=EIGHT)
    if not n:
        return 0, 0
    sz = ndi.sum(sub, lab, range(1, n + 1))
    # componentes que encostam na borda da janela são pedaços de coisa maior: não contam
    borda = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    inteiro = ~np.isin(np.arange(1, n + 1), borda)
    return int(((sz < ILHA) & inteiro).sum()), int(((sz < LASCA) & inteiro).sum())

def avalia(eixo, p):
    """Ilhas e lascas novas que o corte cria. O vinco renderizado varia ±1 px (antisserrilhado): testa largura e
    deslocamento nas variações e fica com o pior caso."""
    pior_i = pior_l = 0
    tinta = 0
    for larg in (band - 1, band, band + 1):
        for off in (-1, 0, 1):
            lo = p - larg // 2 + off
            hi = lo + larg
            if eixo == 'x':
                x0, x1 = max(0, lo - M), min(W, hi + M)
                sub = a[:, x0:x1]
                cut = sub.copy(); cut[:, lo - x0:hi - x0] = False
                t = int(a[:, lo:hi].sum())
            else:
                y0, y1 = max(0, lo - M), min(H, hi + M)
                sub = a[y0:y1, :]
                cut = sub.copy(); cut[lo - y0:hi - y0, :] = False
                t = int(a[lo:hi, :].sum())
            i0, l0 = pequenos(sub)
            i1, l1 = pequenos(cut)
            pior_i, pior_l = max(pior_i, i1 - i0), max(pior_l, l1 - l0)
            if larg == band and off == 0:
                tinta = t
    return pior_i, pior_l, tinta

def melhor(eixo, alvo_mm):
    alvo = round(alvo_mm * px)
    span = int(7 * px)
    lim = W if eixo == 'x' else H
    cands = []
    for p in range(max(band, alvo - span), min(lim - band, alvo + span) + 1):
        ilhas, lascas, tinta = avalia(eixo, p)
        cands.append((p, ilhas, lascas, tinta))
    tmax = max(c[3] for c in cands) or 1
    if eixo == 'y':  # vinco horizontal em cima de filete apagaria o filete inteiro: fica a 2 mm de qualquer filete
        cands = [c for c in cands if not filete[max(0, c[0] - int(2 * px)):c[0] + int(2 * px)].any()]
        tmax = max(c[3] for c in cands) or 1
    ok = [c for c in cands if c[1] == 0 and c[3] >= 0.3 * tmax] or [c for c in cands if c[1] == 0] or cands
    p, ilhas, lascas, tinta = min(ok, key=lambda c: (c[1], c[2], abs(c[0] - alvo)))
    return round(p / px, 2), ilhas, lascas, tinta

if LIMPAR:
    # Depois do render com vincos: lasquinhas (< 0,28 mm²) encostadas na borda de um vinco são sobra do corte
    # (1–2 px da base de uma letra). A dobra esconderia; o DTF perderia. Tira e lista o que tirou.
    vz = json.load(open(os.path.join(R, 'work', f'bula-vincos-{v}.json')))
    rgba = np.asarray(im).copy()
    lab, n = ndi.label(a, structure=EIGHT)
    sz = ndi.sum(a, lab, range(1, n + 1)) if n else np.array([])
    perto = np.zeros_like(a)
    for xm in vz['x']:
        c = round(xm * px); perto[:, max(0, c - band // 2 - 3):c + band // 2 + 4] = True
    for ym in vz['y']:
        c = round(ym * px); perto[max(0, c - band // 2 - 3):c + band // 2 + 4, :] = True
    tirar = [i + 1 for i in np.nonzero(sz < 0.28 * px * px)[0] if perto[lab == i + 1].any()]
    objs = ndi.find_objects(lab)
    for i in tirar:
        sl = objs[i - 1]
        print(f'  lasca em ({sl[1].start / px:.1f}, {sl[0].start / px:.1f}) mm, {sz[i - 1] / px / px:.3f} mm²')
    rgba[np.isin(lab, tirar), 3] = 0
    Image.fromarray(rgba, 'RGBA').save(os.path.join(R, OUT, f'bula-{v}.png'), dpi=(dpi, dpi))
    print(f'{len(tirar)} lascas de vinco removidas')
    sys.exit(0)

res, info = {'x': [], 'y': []}, []
for eixo, alvos in (('x', (W / px / 3, 2 * W / px / 3)), ('y', (H / px / 3, 2 * H / px / 3))):
    for alvo in alvos:
        pos, ilhas, lascas, tinta = melhor(eixo, alvo)
        res[eixo].append(pos)
        info.append(f'{eixo}={pos} mm (alvo {alvo:.1f}): ilhas {ilhas}, lascas {lascas}, tinta cortada {tinta / px / px:.1f} mm²')
json.dump(res, open(os.path.join(R, 'work', f'bula-vincos-{v}.json'), 'w'))
print('\n'.join(info))
