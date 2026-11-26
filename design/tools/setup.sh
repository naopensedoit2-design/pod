#!/usr/bin/env bash
# Prepara as ferramentas de design: fontes e opentype.js (npm), sharp (do app) e numpy/scipy/pillow (Python).
# Idempotente: pode rodar sempre que abrir uma sessão nova.
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules/opentype.js ] || npm install --no-audit --no-fund
[ -f ../../node_modules/sharp/package.json ] || (cd ../.. && npm install --no-audit --no-fund)
if ! python3 -c "import numpy, scipy, PIL" 2>/dev/null && ! PYTHONPATH=.pylib python3 -c "import numpy, scipy, PIL" 2>/dev/null; then
  python3 -m pip install --quiet --target .pylib -r requirements.txt
fi
echo "ferramentas de design prontas"
