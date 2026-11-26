#!/usr/bin/env python3
"""Fotos de produto em alta (1500x2000, 3:4) a partir dos mockups lisos da YouDraw + arte de impressão.

A arte ganha o sombreado e a textura do tecido; o recorte "detail" aproxima a estampa.

Uso: python3 design/tools/photos.py job.json
job.json (caminhos relativos ao próprio arquivo):
{ "out": "fotos",
  "items": [ { "name": "nome-40-off-white-1-costas", "base": "40", "color": "Off-White", "side": "back",
               "art": "D01-costas.png", "placement": {"x": 0.35, "y": 0.17, "width": 0.3, "height": 0.25},
               "kind": "full", "dark": false },
             { ..., "kind": "detail", "fill": 0.72 } ] }
placement = o mesmo enviado à YouDraw (veja yd_results.json do projeto). dark = camiseta escura.
Depois converta para WebP (q 90+) e registre no manifesto src/data/product-photos.json.
"""
import os, sys, json, subprocess, unicodedata, re
_lib = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.pylib')
if os.path.isdir(_lib):
    sys.path.insert(0, _lib)
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
BASES = json.load(open(os.path.join(HERE, 'mockups.json')))
BG = np.array([236, 233, 228], np.float32)  # #ECE9E4, fundo da galeria da loja
W, H = 1500, 2000


def slug(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def mockup_file(base, color, side):
    f = os.path.join(HERE, '.cache/mockups', f'{base}-{slug(color)}-{side}.png')
    if not os.path.exists(f):
        os.makedirs(os.path.dirname(f), exist_ok=True)
        subprocess.run(['curl', '-sSfL', '--retry', '3', '-o', f, BASES[base]['colors'][color][side]['url']], check=True)
    return f


def resize_rgba(im, size):
    # redimensiona em alfa pré-multiplicado (sem halo escuro nas bordas)
    return im.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


def unsharp(rgb, sigma=1.0, amount=0.5):
    return np.clip(rgb + amount * (rgb - ndi.gaussian_filter(rgb, sigma=(sigma, sigma, 0))), 0, 255)


def render(mockup, art_path, pl, crop_src, out_size, dark, shadow=True):
    """crop_src: (x0,y0,x1,y1) em px do mockup 1000x1000; out_size: (w,h) do resultado."""
    x0, y0, x1, y1 = crop_src
    ow, oh = out_size
    scale = ow / (x1 - x0)
    shirt = Image.open(mockup).convert('RGBA')
    pad = Image.new('RGBA', (int(round(x1 - x0)), int(round(y1 - y0))), (0, 0, 0, 0))
    pad.paste(shirt.crop((max(0, int(x0)), max(0, int(y0)), min(1000, int(x1)), min(1000, int(y1)))), (max(0, -int(x0)), max(0, -int(y0))))
    big = np.asarray(resize_rgba(pad, (ow, oh))).astype(np.float32)
    rgb, a = big[..., :3], big[..., 3:4] / 255.0
    rgb = unsharp(rgb, sigma=1.2 * max(1, scale / 1.5), amount=0.45)
    L = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    art = Image.open(art_path).convert('RGBA')
    aw, ah = pl['width'] * 1000 * scale, pl['height'] * 1000 * scale
    ax, ay = (pl['x'] * 1000 - x0) * scale, (pl['y'] * 1000 - y0) * scale
    iw, ih = int(round(aw)), int(round(ah))
    art_s = np.asarray(resize_rgba(art, (iw, ih))).astype(np.float32)
    layer = np.zeros((oh, ow, 4), np.float32)
    ix, iy = int(round(ax)), int(round(ay))
    sx0, sy0, dx0, dy0 = max(0, -ix), max(0, -iy), max(0, ix), max(0, iy)
    dx1, dy1 = min(ow, ix + iw), min(oh, iy + ih)
    if dx1 > dx0 and dy1 > dy0:
        layer[dy0:dy1, dx0:dx1] = art_s[sy0:sy0 + (dy1 - dy0), sx0:sx0 + (dx1 - dx0)]
    aa = layer[..., 3:4] / 255.0
    region = (aa[..., 0] > 0.5) & (a[..., 0] > 0.5)
    ref = float(np.median(L[region])) if region.any() else float(np.median(L[a[..., 0] > 0.5]))
    # sombreado do tecido sobre a tinta, para a estampa "assentar" nas dobras
    shade = ndi.gaussian_filter(L, 1.5 * max(1, scale / 1.5)) / max(ref, 1)
    shade = np.clip(1 + (shade - 1) * (0.55 if dark else 0.9), 0.7, 1.12)[..., None]
    ink = np.clip(layer[..., :3] * shade, 0, 255)
    hp = (L - ndi.gaussian_filter(L, 1.0))[..., None]   # textura fina do tecido
    ink = np.clip(ink + hp * (0.35 if dark else 0.5), 0, 255)
    shirt_rgb = rgb * (1 - aa) + ink * aa
    out = np.empty((oh, ow, 3), np.float32); out[:] = BG
    if shadow:
        sh = ndi.gaussian_filter(a[..., 0], 14 * scale / 1.5)
        off = int(10 * scale / 1.5)
        if off > 0:  # desloca a sombra para baixo repetindo a borda (sem "dar a volta" na imagem)
            sh = np.concatenate([np.repeat(sh[:1], off, axis=0), sh[:-off]], axis=0)
        out *= (1 - 0.16 * sh)[..., None]
    out = out * (1 - a) + shirt_rgb * a
    return Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGB')


def full_frame(mockup):
    al = np.asarray(Image.open(mockup).convert('RGBA'))[..., 3] > 8
    ys, xs = np.nonzero(al)
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    src_w = (bx1 - bx0) / 0.94
    src_h = src_w * H / W
    cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2 + src_h * 0.015
    return (cx - src_w / 2, cy - src_h / 2, cx + src_w / 2, cy + src_h / 2)


def detail_frame(pl, fill):
    pw, ph = pl['width'] * 1000, pl['height'] * 1000
    cx, cy = pl['x'] * 1000 + pw / 2, pl['y'] * 1000 + ph / 2
    src_w = pw / fill; src_h = src_w * H / W
    cy += src_h * 0.04
    return (cx - src_w / 2, cy - src_h / 2, cx + src_w / 2, cy + src_h / 2)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    job_path = os.path.abspath(sys.argv[1]); jd = os.path.dirname(job_path)
    job = json.load(open(job_path))
    out_dir = os.path.join(jd, job['out']); os.makedirs(out_dir, exist_ok=True)
    for it in job['items']:
        mock = mockup_file(it['base'], it['color'], it['side'])
        fr = full_frame(mock) if it['kind'] == 'full' else detail_frame(it['placement'], it.get('fill', 0.72))
        img = render(mock, os.path.join(jd, it['art']), it['placement'], fr, (W, H), it.get('dark', False))
        img.save(os.path.join(out_dir, it['name'] + '.png'))
        print(it['name'], 'escala %.2f' % (W / (fr[2] - fr[0])))
