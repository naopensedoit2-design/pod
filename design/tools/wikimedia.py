#!/usr/bin/env python3
"""Busca e baixa obras do Wikimedia Commons (domínio público) com os créditos.

O Commons limita downloads de arquivos originais por IP (erro 429 por até 10 min). As miniaturas em tamanhos
padrão (3840, 1920, 1280, 960 px) costumam passar com espera curta — este script usa essas, respeita o
Retry-After e espaça os pedidos. Tamanhos fora da lista dão erro 400.

Uso:
  python3 design/tools/wikimedia.py --search "Almeida Junior caipira" [--limit 15]
  python3 design/tools/wikimedia.py --out design/<projeto>/fontes [--max 3840] "File:Nome do arquivo.jpg" ...
Os créditos (autor, data, licença, link) ficam em <out>/creditos.json — copie para o README do projeto.
Confira sempre a licença: "Public domain" / "PD-old" / "CC0". Obra brasileira: autor morto até 1955 (regra de 2026).
"""
import os, sys, re, json, time, hashlib, argparse, urllib.parse, urllib.request, urllib.error

UA = {'User-Agent': 'PublicDomainArtResearch/1.0 (design study; low volume)'}
API = 'https://commons.wikimedia.org/w/api.php'
SIZES = [3840, 1920, 1280, 960]


def get(url, binary=False, tries=8):
    for _ in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
                data = r.read()
                return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = min(int(e.headers.get('retry-after') or 30), 900) + 3
                print(f'  429: aguardando {wait}s', flush=True); time.sleep(wait); continue
            raise
    raise RuntimeError('muitas tentativas')


def strip(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html or '')).strip()


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('files', nargs='*')
ap.add_argument('--search')
ap.add_argument('--limit', type=int, default=15)
ap.add_argument('--out')
ap.add_argument('--max', type=int, default=3840)
a = ap.parse_args()

if a.search:
    q = urllib.parse.urlencode({'action': 'query', 'list': 'search', 'srsearch': a.search, 'srnamespace': 6, 'srlimit': a.limit, 'format': 'json'})
    for r in get(f'{API}?{q}')['query']['search']:
        print(r['title'])
    sys.exit(0)
if not a.files or not a.out:
    sys.exit(__doc__)
os.makedirs(a.out, exist_ok=True)
cred_file = os.path.join(a.out, 'creditos.json')
credits = json.load(open(cred_file)) if os.path.exists(cred_file) else {}
for title in a.files:
    title = title if title.startswith('File:') else 'File:' + title
    q = urllib.parse.urlencode({'action': 'query', 'titles': title, 'prop': 'imageinfo', 'iiprop': 'extmetadata|size|url', 'format': 'json'})
    page = next(iter(get(f'{API}?{q}')['query']['pages'].values()))
    info = (page.get('imageinfo') or [{}])[0]
    meta = info.get('extmetadata', {})
    fn = title[5:].replace(' ', '_')
    md5 = hashlib.md5(fn.encode()).hexdigest()
    qf = urllib.parse.quote(fn)
    width = info.get('width', 99999)
    saved = None
    for w in [s for s in SIZES if s <= a.max and s < width] or [None]:
        url = (f'https://upload.wikimedia.org/wikipedia/commons/thumb/{md5[0]}/{md5[:2]}/{qf}/{w}px-{qf}' if w
               else f'https://upload.wikimedia.org/wikipedia/commons/{md5[0]}/{md5[:2]}/{qf}')
        if fn.lower().endswith(('.tif', '.tiff', '.pdf', '.djvu')) and w:
            url += '.jpg'
        try:
            data = get(url, binary=True)
        except urllib.error.HTTPError as e:
            print(f'  {w}px: HTTP {e.code}'); time.sleep(4); continue
        ext = '.png' if fn.lower().endswith('.png') else '.jpg'
        saved = os.path.join(a.out, re.sub(r'[^\w.-]+', '_', os.path.splitext(fn)[0])[:80] + ext)
        open(saved, 'wb').write(data)
        print(f'OK {os.path.basename(saved)} ({w or width}px, {len(data) / 1e6:.1f} MB)', flush=True)
        break
    credits[title] = {
        'arquivo': saved and os.path.basename(saved), 'autor': strip(meta.get('Artist', {}).get('value')),
        'data': strip(meta.get('DateTimeOriginal', {}).get('value')), 'licenca': strip(meta.get('LicenseShortName', {}).get('value')),
        'obra': strip(meta.get('ObjectName', {}).get('value')), 'link': f'https://commons.wikimedia.org/wiki/{urllib.parse.quote(title.replace(" ", "_"))}',
    }
    json.dump(credits, open(cred_file, 'w'), ensure_ascii=False, indent=1)
    time.sleep(4)
print('créditos em', cred_file)
