# Técnicas de execução (receitas)

Receitas testadas com as ferramentas de `design/tools/`. Cada uma diz quando usar, como fazer e o erro mais comum.

## 1. Pintura ou gravura em domínio público → estampa

**Quando usar:** a imagem precisa ter luz, volume e mão (o que as referências têm e o vetor geométrico não).

1. **Buscar e baixar** com os créditos:
   ```bash
   python3 design/tools/wikimedia.py --search "Almeida Junior caipira"
   python3 design/tools/wikimedia.py --out design/<p>/fontes "File:Almeida Júnior - Caipira Picando Fumo, 1893.jpg"
   ```
   A espera do 429 pode passar de 10 minutos. Rode em segundo plano, cedo.
2. **Recortar a figura** (fundo uniforme):
   ```bash
   python3 design/tools/cutout.py fonte.jpg figura.png --sides top --threshold 6
   ```
   Escolha em `--sides` só as bordas onde existe fundo de verdade. Incluir uma borda que corta a figura (cauda, pé) estraga o modelo do fundo. Confira ampliado: crina, cabelo, folhas e dedos costumam precisar de retoque.
3. **Puxar a cor para a paleta.** Níveis, saturação, um leve aquecimento; pode ser feito com sharp (`modulate`, `linear`) ou PIL. A imagem deve conversar com as tintas da tipografia.
4. **Borda:**
   - **recorte duro:** é o padrão;
   - **vinheta que some no tecido:** `--feather 10`, depois `halftone.py` (o pin "Redroom");
   - **moldura:** se a ideia for "quadro de museu".
5. **Resolução:** 300 DPI no tamanho final. Fonte menor que isso? Use a imagem menor, transforme em retícula ou aceite 150–200 DPI só em pintura com textura (nunca em letra).

**Erro comum:** colar a pintura inteira com fundo, retangular, no meio das costas. Parece imagem colada, não estampa.

## 2. Retícula (meio-tom)

```bash
python3 design/tools/halftone.py vinheta.png saida.png --lpi 26                       # só a transparência vira pontos
python3 design/tools/halftone.py foto.jpg saida.png --mode luminance --ink "#1E1A17" --lpi 30 --angle 45
python3 design/tools/halftone.py foto.jpg saida.png --mode luminance --invert --ink "#F1E9D8" --lpi 28   # tinta clara em malha escura
```

- **LPI (linhas por polegada):**
  - 15–25: ponto grande e gráfico, estética de cartaz e serigrafia;
  - 26–35: equilíbrio;
  - 40–55: fino. Confira o ponto mínimo no `qa.py`.
- **Ângulo:** 22,5° ou 45° (0° deixa o padrão evidente demais).
- **Gama:** `--gamma 1.2` clareia os meios-tons; foto escura costuma precisar.
- **Uma tinta só:** a retícula transforma qualquer foto ou pintura numa estampa de 1 cor, barata, leve no toque e muito "gráfica".

## 3. Entrelaçar letra e imagem

Para a letra passar por trás de partes da imagem (o "C" de "Confidence" laçando o cavalo):

```js
// camadas: imagem, letra, imagem de novo só nos trechos onde a letra passa "por trás"
svg = `
<defs><clipPath id="atras"><path d="${trechos}"/></clipPath></defs>
<image href="${b64("figura.png")}" x=".." y=".." width=".." height=".."/>
<g fill="${C.red}"><path d="${letra.d}"/>${floreio.svg}</g>
<image href="${b64("figura.png")}" x=".." y=".." width=".." height=".." clip-path="url(#atras)"/>`;
```

- `trechos` são polígonos simples desenhados sobre a imagem, cobrindo onde a letra deve sumir (atrás do pescoço, da crina).
- Alterne frente e trás: um trecho por trás e o seguinte pela frente é o que dá a sensação de laço.
- Em letra sobre imagem escura, use um **contorno de respiro** da cor da malha (2–3 mm), cortando a imagem sob a letra, para a letra não "afundar". Foi o que salvou a legibilidade no Drop 001.

## 4. Floreio caligráfico sob medida

```js
const F = require("design/tools/flourish.js");
const f = F.flourish([[x1,y1],[x2,y2],[x3,y3],[x4,y4]], { min: 5.5, max: 30, pen: "pointed" });
svg += `<g fill="#C4252F">${f.svg}</g>`;
const s = F.swash(xIni, xFim, y, { loop: "both", loopSize: 180, wave: 30 });   // sublinhado com laços
```

- **Esboço.** Primeiro na prévia em escala pequena (renderize a 72 DPI). Ajuste os pontos até a curva ficar longa e regular.
- **Ligação com a letra.** O floreio deve sair ou entrar numa letra: comece no fim de um traço da fonte (use `glyphs[i]` de `T.text`).
- **Desenho caligráfico.** Descidas grossas, subidas finas. Na pena pontuda, a modulação já sai disso; não tente engrossar à mão.

## 5. Risografia simulada (2–3 tintas)

1. **Separação.** Separe a imagem em 2–3 tintas por luminância ou por cor (cada tinta = uma máscara).
2. **Textura.** Passe cada tinta por `halftone.py` (LPI 30–45, ângulos diferentes: 15°, 45°, 75°).
3. **Registro.** Desloque uma das tintas 0,3–0,8 mm (registro imperfeito de verdade).
4. **Sobreposição.** A tinta de cima cobre a de baixo. No DTF não há "multiply", então pense nas cores finais das áreas de sobreposição e desenhe-as como uma terceira cor, se precisar.

## 6. Aspecto de gravura (buril ou xilogravura)

- **Fonte gravada de verdade.** Prefira gravura de verdade (Marcgrave 1648, Flora Brasiliensis, pranchas do século XIX) a simular.
- **Gravura com linhas finas.** Aumente o tamanho até as linhas passarem de 0,4 mm, ou use `min_stroke.py`.
- **Simulação a partir de foto ou pintura.** Retícula de linhas (ângulo fixo) em vez de pontos dá um "buril" convincente: rode `halftone.py` em LPI baixo e, se quiser linhas, troque a função de ponto. Ainda não implementado; anote como melhoria.

## 7. Tipografia como imagem

- **Uma palavra, escala total.** A palavra ocupa as costas inteiras, e a letra é a figura.
- **Texto em sistema.** Tabelas, listas, horários, formulários alinhados com rigor de grade suíça. A graça está no conteúdo; a forma precisa ser impecável.
- **Texto em arco ou percurso.** Use `T.arcText` para selos, mas só se o selo for a ideia, e não enfeite.

## 8. Checagem final de execução

- [ ] Prévia no mockup da cor exata, frente e costas (`preview.js --zoom`).
- [ ] Recorte a 100% de 3 áreas: a mais fina, a mais densa, a borda da imagem.
- [ ] `qa.py` sem semitransparência, ilhas e furos ≈ 0.
- [ ] A peça passa nas perguntas de `anti-generico.md`.
- [ ] Créditos de domínio público anotados no README do projeto.
