# Tipografia para estampa

A letra é metade da estampa, e às vezes a estampa inteira. Nas referências que funcionam, ela é **desenhada para aquela imagem**: a caligrafia cresce até virar figura, o floreio laça o cavalo, a palavra pequena marca o ritmo. Digitar uma frase numa fonte bonita e centralizar é o caminho mais curto para o genérico.

## Papéis

- **Voz principal.** Quando existe, é grande, com personalidade, e de preferência desenhada ou customizada.
- **Voz de apoio.** Contrasta com a principal em tudo (classe, peso, tamanho). Se as duas são "elegantes", uma sobra.
- **Sussurro.** Texto pequeno, só se acrescenta sentido. Altura de maiúscula de pelo menos 2 mm no DTF.

Uma ou duas vozes resolvem quase tudo. Três só com motivo.

## Escolher olhando o texto real

```bash
node design/tools/specimen.js "Com que roupa?" --cat caligrafia,pincel --size 150 --out /tmp/m.jpg
```

O mostruário marca em vermelho os glifos que faltam (ã, õ, ç, ê). Fonte script sem til não serve, e til "remendado" de outra fonte aparece. Categorias em `design/tools/fonts.json`: caligrafia, pincel, serifa, grotesca, máquina, vernacular (tipo de madeira, art déco, gótica) e manuscrita. As marcadas como "batida" (Great Vibes, Alex Brush, Playfair, Bebas, Yellowtail…) só entram com motivo.

## Caligrafia (pena pontuda: copperplate e spenceriana)

O que faz parecer de verdade:
1. **Escala.** A caligrafia das referências ocupa 40–70% da largura da arte. Grande, ela mostra o contraste fino/grosso, e os finos passam do mínimo do DTF sem engrossar.
2. **Maiúsculas com floreio.** Ballet, Mea Culpa, Monsieur La Doulaise, Lavishly Yours e Imperial Script têm maiúsculas teatrais. A letra inicial pode laçar a imagem.
3. **Floreios desenhados.** Entradas, saídas, sublinhados e laços que conectam palavras ou contornam a imagem. Faça com `flourish.js`:
   - **Pena pontuda** (`pen: "pointed"`): grossa nas descidas e fina nas subidas, afinando nas pontas.
   - **Pena chata** (`pen: "broad"`, `angle`): largura pelo ângulo, como no itálico chancery e no letreiro de pincel chato.
   - **Desenho.** Defina poucos pontos por onde a curva passa e ajuste olhando a prévia. Laço = ida e volta cruzando a própria linha. Floreio bom tem curvas longas e regulares, sem tremores nem bicos.
   - **Medidas a 300 DPI.** `min` ≥ 5 px (0,42 mm) para o DTF; `max` entre 3 e 6 vezes o `min`.
4. **Entrelaçamento** (a letra passa por trás e pela frente da imagem). Três camadas:
   1. a imagem;
   2. a letra inteira;
   3. a imagem de novo, recortada por uma máscara só nos trechos onde a letra deve passar "por trás".
   - **No SVG:** `<image>`, depois `<path letra>`, depois `<image clip-path="url(#trechos)">`.
   - **Em PNG:** componha as três camadas com sharp ou PIL.
5. **Engrossar sem estragar.** Nunca coloque contorno em volta da letra inteira. Use `min_stroke.py`, que só engrossa os trechos abaixo de 0,4 mm. Se mesmo assim a letra perde a graça, aumente a escala.
6. **Kerning e ligação.** Em script, os conectores precisam se encontrar sem degrau. Confira a 100% e ajuste o tracking por par (`T.text` devolve a posição de cada letra em `glyphs`).

## Serifas e grotescas

- **Didone condensada em caixa-alta** (Oranienbaum, Bodoni Moda, Abril Fatface). É o "TIMELESS" da referência: alta e com contraste.
- **Fell** (IM Fell English, IM Fell DW Pica). Tipos do século XVII com a irregularidade da impressão de verdade; autenticidade histórica sem filtro.
- **Grotesca pesada contra imagem delicada** (Archivo Black, Bricolage Grotesque). É o "Orchard®": o contraste faz a peça.
- **Tipo de madeira e letreiro** (Rye, Holtwood One SC, Ultra, Sancreek). Cartaz de circo, feira, interior.
- **Máquina de escrever gasta** (Special Elite). Documento, ficha, carimbo; é a voz da burocracia.

## Regras de texto no DTF

| Elemento | Mínimo |
| --- | --- |
| Traço / fio | 0,4 mm (0,5 mm é mais seguro em tinta clara sobre malha escura) |
| Altura de maiúscula do menor texto | 2 mm (3 mm se for serifa fina ou script) |
| Espaço entre letras/vazados | 0,3 mm (furos menores fecham) |
| Contraste tinta × malha | Teste no mockup da cor exata. Off-white sobre off-white some; preto sobre marrom pesa |

## Tons que denunciam o genérico

Na tipografia, estes são os sinais de cansaço (a lista completa está em `anti-generico.md`):
- caixa-alta espaçada para tudo que é pequeno;
- palavras unidas por " · ";
- "EST. 2026";
- três fontes sempre;
- script de convite de casamento;
- fonte "vintage" usada como atalho de estilo em vez de escolha.
