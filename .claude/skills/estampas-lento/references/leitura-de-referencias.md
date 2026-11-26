# Leitura de referências

Ler uma referência com precisão é separar **o que se vê** (o motivo: um cavalo, uma fruta) de **como foi feito** (a jogada: a escala, o encaixe da letra, a técnica da imagem, a virada de sentido). Copiar o motivo dá uma imitação pior. Entender a jogada permite fazer outra coisa com a mesma força.

## Como olhar

1. **Três distâncias.**
   - Miniatura (~200 px), que é como a peça aparece no feed e no anúncio: o que pega o olho?
   - Peça inteira, na distância de quem vê a camiseta na rua.
   - Recortes a 100% (`ref_zoom.py`): traço, textura, serifa, floreio, borda do recorte, ponto da retícula.
2. **Medir em vez de achar.** Proporções importam:
   - quanto da altura da arte a caligrafia ocupa;
   - a razão entre o maior e o menor texto;
   - quanto da área é vazio.
3. **Desconfiar do primeiro adjetivo.** "Vintage", "clean", "elegante" não dizem nada. Escreva o que produz o efeito: "serifa Didone condensada em caixa-alta, ocupa 70% da largura, cruzada por um script azul de pincel".

## Ficha de leitura (uma por referência)

```
### <id> — <nome curto>
1. Herói e hierarquia: o que se vê em 1º, 2º, 3º lugar; proporções (ex.: script = 45% da altura).
2. Imagem: origem/meio (óleo, gravura, aquarela, foto, render de IA, linoleogravura, riso...);
   acabamento (volume, luz, densidade de detalhe); borda (recorte duro, vinheta, moldura, sangria); cor (natural ou chapada).
3. Tipografia: classifique cada texto (pena pontuda, pincel, Didone condensada, grotesca...); caixa, peso, contraste,
   espaçamento; desenhada ou digitada; como encosta na imagem (por cima, por baixo, entrelaçada, contornando).
4. Composição: eixo (central, diagonal, assimétrico), sobreposição e ordem das camadas, percurso do olho, vazio (%).
5. Cor e matéria: número de tintas; relação com a cor do fundo/tecido; textura (papel, grão, retícula); técnica sugerida.
6. Peça (se for camiseta): posição, tamanho estimado em cm, diálogo frente/costas, cor da malha.
7. Texto: o que diz, em que tom (aspiracional, irônico, descritivo), língua, tamanho.
8. A jogada: a ideia por trás da forma — a virada (anacronismo, troca de contexto, elevação do banal...).
9. Apresentação: mockup, cenário, foto; quanto do "valor" vem da foto e não da arte.
10. Para nós: roubar (jogadas) | não copiar (motivos e frases) | o que falta aqui (onde ir além).
```

## Síntese da pasta

No fim de `referencias.md`, responda em poucas linhas:
- **Jogadas recorrentes**, que são a gramática da pasta.
- **O que não copiar.** Motivos, frases e composições reconhecíveis.
- **Saturação.** A estética já está batida? Se cem marcas fazem igual, o diferencial precisa vir da ideia, da fonte da imagem ou da execução.
- **O que falta.** Quase sempre é especificidade cultural, humor ou uma fonte de imagem inesperada. É aí que a LENTO se diferencia.

## Exemplo: a pasta do Drop 001 (9 pins, lida de novo)

| Pin | O que é | A jogada | Para nós |
| --- | --- | --- | --- |
| 1 · *Confidence is the willingness to try* | Cavalo realista em salto, pintura digital com luz de estúdio; script copperplate vermelho gigante; frase miúda em grotesca descendo em escada; papel amassado | A caligrafia é **maior que o cavalo** e se entrelaça com ele: o "C" laça o peito e "fidence" passa atrás da crina. As palavras pequenas formam uma diagonal que leva o olho de "Confidence" a "Try". Só 2 cores: o vermelho e a pintura | Roubar: escala da letra × imagem, entrelaçamento, percurso em escada. Não copiar: cavalo + frase motivacional em inglês |
| 2 · *Homeostasis / Love* | Pintura barroca de cavaleiro em cavalo branco, mas **o cavaleiro veste jeans e botas**; script preto com laços longos horizontais | **Anacronismo**: pintura de museu com roupa de hoje. A letra emoldura a imagem (em cima e embaixo), como cartela | Roubar: anacronismo e moldura caligráfica. É o pin mais "disruptivo" da pasta |
| 3 · Cadeiras | Duas cadeiras de plástico verdes com sombras amarelas compridas; textura de serigrafia ou risografia granulada; sem texto | **Elevar o banal** (a cadeira de bar) a arte; a sombra amarela é maior que a cadeira (fim de tarde); verde e amarelo sem usar a bandeira | Roubar: objeto vernacular, sombra como figura, nenhum texto. No Drop 001 copiamos as cadeiras, que foi o erro |
| 4 · *Beginning of Interlude* (marinho) | Camiseta marinho; script dourado pequeno no peito; nas costas, script + serifa miúda + estrelinha vermelha; foto num lounge anos 70 à noite | **Luxo pela contenção**: tamanho pequeno, dourado no marinho, um único ponto vermelho. Metade do valor vem da foto (cenário, luz) | Roubar: contenção, cor da malha como parte da paleta, foto de cenário para anúncio |
| 5 · *Good Guys / Iconic Gallery* | Foto antiga de criança numa bicicleta, recortada; serifa condensada e script sobrepostos, um pouco desalinhados | Foto vernacular de arquivo e tipos em camadas, como cartaz colado | Roubar: foto antiga de arquivo como imagem (no nosso caso, em domínio público) |
| 6 · *Redroom Deluxe* | Pintura de cavalo correndo num campo, **com bordas que se dissolvem** no tecido; script vermelho cruzando; monograma "Wp" no peito | A imagem não tem contorno: vinheta que some no tecido. No DTF isso exige **retícula** | Roubar: vinheta em retícula (halftone.py) e monograma pequeno na frente |
| 7 · *Timeless Abundance* | Uvas numa fruteira de cobre, desenho a traço com aquarela; "TIMELESS" em Didone condensada verde, "Abundance" em script azul de pincel cruzando; "Since 400 B.C." | **Marca inventada com mitologia** (desde 400 a.C., "dolce far niente"). Três vozes tipográficas com escala muito contrastada, todas encostando na imagem | Roubar: mitologia de marca e contraste de escala. Saturado: rótulo de fruta + script |
| 8 · *Juices — Freshly Prepared* | Laranja realista com folhas; script laranja; selo redondo; código de barras verde; foto da camiseta sobre poltrona de couro | Linguagem de embalagem. Funciona pelo realismo da fruta e pela foto | Saturado: rótulo + código de barras + selo. Evitar como fórmula |
| 9 · *Orchard®* | Damascos num galho, pintura digital realista; "Orchard®" em grotesca pesada vermelha | Contraste entre a letra bruta e a imagem delicada | Roubar: contraste letra bruta × imagem delicada. A tipografia pesada sem script foge do padrão da pasta |

**Síntese.** A gramática da pasta tem quatro peças:
- imagem rica (pintura, foto, desenho com aquarela);
- uma caligrafia enorme que se entrelaça com a imagem;
- pouco texto pequeno, posicionado com ritmo;
- muito vazio.

**Saturação.** "Fruta realista + script + rótulo" é uma estética muito usada no Pinterest e em marcas de IA de 2024–26. Os pins mais fortes são os que têm uma virada (2, 3 e 4).

**O que falta.** Brasil específico, humor e fontes de imagem inesperadas. Pinturas brasileiras em domínio público, documentos, vernacular de rua e literatura (ver `brasil.md`) dão o que a pasta não tem.
