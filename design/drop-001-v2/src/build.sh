#!/usr/bin/env bash
# Gera as artes finais (300 DPI) da prova, o QA e as prévias no mockup.
# Uso: bash design/drop-001-v2/src/build.sh            (a partir da raiz do repositório)
#      PXMM=4 bash design/drop-001-v2/src/build.sh     (esboço rápido)
set -euo pipefail
cd "$(dirname "$0")/.."
T=../tools
OUT=final; [ "${PXMM:-}" ] && OUT=sketch
SOSSEGA=${SOSSEGA:-C}; HOME_V=${HOME_V:-A}; SOMBRA=${SOMBRA:-B}; BULA=${BULA:-B}

python3 src/caipira_cut.py >/dev/null                       # recorte justo do caipira (borda dura), banco e chão
python3 src/sombra_assets.py 300 32 62 >/dev/null

node src/sossega.js "$SOSSEGA"
node src/homeoffice.js "$HOME_V"
node src/sombra.js layout "$SOMBRA" && python3 src/sombra_ko.py "$SOMBRA" && node src/sombra.js compose "$SOMBRA"
# bula: acha onde os vincos cortam a camada cortável sem criar ilha -> render com vincos -> tira lasquinhas do corte
CAMADA=cortavel node src/bula.js "$BULA" >/dev/null && python3 src/bula_vincos.py "$BULA" && node src/bula.js "$BULA" && python3 src/bula_vincos.py "$BULA" --limpar && node src/bula.js frente

# QA (números antes do ajuste) + fecha furinhos < 0,18 mm², como a tinta do DTF faria; não apaga nada
python3 $T/qa.py --fill-holes "$OUT/sossega-$SOSSEGA.png" "$OUT/homeoffice-$HOME_V.png" "$OUT/sombra-$SOMBRA.png" "$OUT/bula-$BULA.png" "$OUT/bula-frente.png"

mkdir -p previas
node $T/preview.js --front "$OUT/sossega-$SOSSEGA.png" --base 34 --color "Verde Militar" --center --front-top 6 --zoom --out "previas/$OUT-sossega.jpg" >/dev/null
node $T/preview.js --back "$OUT/homeoffice-$HOME_V.png" --base 40 --color Chocolate --back-top 48 --zoom --out "previas/$OUT-homeoffice.jpg" >/dev/null
node $T/preview.js --back "$OUT/sombra-$SOMBRA.png" --base 40 --color Off-White --back-top 8 --zoom --out "previas/$OUT-sombra.jpg" >/dev/null
node $T/preview.js --front "$OUT/bula-frente.png" --back "$OUT/bula-$BULA.png" --base 40 --color Branca --back-top 8 --out "previas/$OUT-bula.jpg" >/dev/null
echo "prévias em design/drop-001-v2/previas/$OUT-*.jpg"
