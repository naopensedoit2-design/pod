# Ferramentas de design

Ferramentas para criar e produzir as estampas da LENTO. O processo criativo que elas servem está em `.claude/skills/estampas-lento/SKILL.md`.

Todas as medidas de arte são em px a 300 DPI (1 cm = 118,11 px). O DTF não imprime semitransparência, então as artes finais têm alfa binário.

## Preparar (uma vez por sessão)

```bash
bash design/tools/setup.sh
```

O script instala as fontes e o opentype.js (`npm install` nesta pasta), o sharp do app e numpy, scipy e pillow (em `.pylib/`, se o Python do sistema não tiver). Nada disso vai para o git.

## O que tem aqui

| Ferramenta | Para quê |
| --- | --- |
| `ref_zoom.py` | Ler referências de perto: a imagem inteira, um índice com a grade e recortes em resolução nativa. Baixa o original do Pinterest a partir do link da imagem. |
| `compare.py` | Folha lado a lado (referência × nossa versão, versões A/B/C, o drop inteiro). |
| `specimen.js` | Mostruário de fontes com o seu texto real, marcando os acentos que faltam. A biblioteca (69 fontes OFL) está em `fonts.json`. |
| `type.js` | Texto vira vetor (caminhos SVG), com kerning, tracking, texto em arco e a posição de cada letra. |
| `flourish.js` | Floreios caligráficos com modulação de pena (pontuda ou chata) passando pelos pontos que você der. Inclui um sublinhado com laço pronto. |
| `lib.js` | Renderiza SVG em PNG a 300 DPI com alfa binário e recorte automático. Tem também `cm()`, `fitSize()` e `starPath()`. |
| `min_stroke.py` | Engrossa só os traços finos demais para o DTF, sem inchar a letra inteira. |
| `halftone.py` | Retícula: vinheta, degradê ou pintura viram pontos sólidos imprimíveis. Também é estética de serigrafia. |
| `cutout.py` | Recorta a figura de pintura ou gravura com fundo uniforme e refina a borda em resolução cheia. |
| `wikimedia.py` | Busca e baixa obras em domínio público no Wikimedia Commons, com os créditos. |
| `qa.py` | Controle de impressão: cm, DPI, semitransparência, ilhas, furos, traços finos e área de tinta. `--fix` limpa. |
| `preview.js` | Arte no mockup da YouDraw, com frente e costas, uma ou mais cores e recorte de perto (`--zoom`). Também mostra o placement. |
| `mockups.json` / `mockup.js` | Mockups lisos e a geometria de cada base e cor (centro da peça e costura da gola), mais o cálculo do placement. |
| `produce.js` | Prévias e criação dos produtos na YouDraw a partir de um `drop.json`. `get <id>` lê um produto. |
| `photos.py` | Fotos 3:4 em alta para a loja, com a estampa assentada no tecido. |

## Receitas rápidas

```bash
# referências
python3 design/tools/ref_zoom.py design/x/refs/*.jpg --out design/x/refs/zoom
python3 design/tools/compare.py --out /tmp/c.jpg --height 600 ref.jpg nossa.png

# tipografia
node design/tools/specimen.js "Com que roupa?" --cat caligrafia,pincel --out /tmp/m.jpg

# arte final
python3 design/tools/min_stroke.py costas.png costas.png --mm 0.4
python3 design/tools/halftone.py vinheta.png vinheta-ret.png --lpi 28
python3 design/tools/qa.py design/x/*.png

# na camiseta
node design/tools/preview.js --front frente.png --back costas.png --base 40 --color Off-White,Preta --zoom --out /tmp/p.jpg

# YouDraw (prévia sem criar nada; com --create só depois da aprovação do usuário)
node design/tools/produce.js design/x/drop.json
node design/tools/produce.js get <id-do-produto>
```

## Cuidados

- **Chave da YouDraw.** O proxy do ambiente injeta a chave. Os scripts usam o marcador `Bearer proxy-injected` e nunca leem nem imprimem a chave real.
- **Pedidos e cobranças.** A chave não tem permissão para pedidos nem pagamentos, e nenhum script cria pedido ou cobrança.
- **Idempotência.** As chaves de idempotência ficam em `design/<projeto>/yd_keys.json`. Repetir um comando não duplica arte nem produto.
- **Retícula e QA.** Numa retícula, o `qa.py` acusa as pontes finas entre os pontos. Isso é normal. O que importa são ilhas e furos minúsculos, que devem ficar perto de zero.
- **Wikimedia.** A espera do erro 429 pode passar de 10 minutos. Baixe as fontes cedo e rode em segundo plano.
