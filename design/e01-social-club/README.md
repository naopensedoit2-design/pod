# E01 Social Club · Off-White

Arquivos de impressão aprovados. Técnica: DTF. Formato: PNG transparente a 600 DPI, só com 2 cores exatas e sem semitransparência:

- Vermelho `#C4252F`
- Azul `#1F3D9C`

| Lado | Arquivo | Pixels | Tamanho impresso |
| --- | --- | --- | --- |
| Frente (peito) | `E01-frente-600dpi.png` | 2324 × 993 | 9,84 × 4,20 cm |
| Costas | `E01-costas-600dpi.png` | 7276 × 5271 | 30,81 × 22,32 cm |

O logo mantém o tamanho aprovado: o "Lento" da frente mede 9,5 cm e o emblema das costas mede 30,0 cm. A largura extra nas duas artes vem só da ponta do traço, que agora vai até o fim (veja "Correções").

## Posição na camiseta

- **Frente:** topo do logo 7,8 cm abaixo da costura da gola, no centro. O centro do logo fica cerca de 10 cm à direita do meio da peça, para quem olha. É o lado esquerdo do peito de quem veste.
- **Costas:** topo do emblema 8,0 cm abaixo da costura da gola. O emblema fica centralizado: o centro dos 30 cm aprovados cai no meio da peça.

### `placement` na API da YouDraw

Valores normalizados, com origem no canto superior esquerdo do canvas de 500 px. As medidas em cm usam o `mockup_scale_cm_per_px` de cada base.

| Base | Lado | x | y | width | height |
| --- | --- | --- | --- | --- | --- |
| 40 · Oversized Classic | frente | 0.5530 | 0.2367 | 0.1068 | 0.0456 |
| 40 · Oversized Classic | costas | 0.3371 | 0.1659 | 0.3345 | 0.2423 |
| 34 · Oversized Suedine 220g | frente | 0.5533 | 0.2351 | 0.1124 | 0.0480 |
| 34 · Oversized Suedine 220g | costas | 0.3287 | 0.1814 | 0.3519 | 0.2549 |

Na base 34, o centro do logo da frente fica a 9,5 cm do meio, porque a peça é mais estreita no mockup.

## Correções em relação aos arquivos originais do logo

- **Ponta do traço.** O PDF do emblema e o SVG do logo secundário cortavam a ponta do traço na borda da página. A ponta foi recuperada dos vetores.
- **Recorte do anel.** No PDF, o recorte onde o traço cruza o anel do oval era um bitmap de 72 ppi, com borda serrilhada. Ele foi reconstruído como um contorno a 3,0 mm do "Lento" e do traço. O resultado coincide com o recorte original (IoU 0,99), mas com borda lisa.
- **Espessura mínima.** Nenhum traço ou texto fica abaixo de 0,5 mm. Só as pontas das estrelas ✦ afinam, o que é esperado em pontas.

`previa-youdraw.jpg` mostra a posição nos mockups Off-White da YouDraw. Em cima está a base 40 e embaixo a base 34. Os mockups que a própria YouDraw gerou para os produtos saíram iguais a essa prévia.

## Na YouDraw (criado em 25/11/2026)

Artes enviadas:

| Arte | ID |
| --- | --- |
| Frente | `72911` |
| Costas | `72912` |

| Produto | ID | Custo de produção (frente + costas) | SKUs |
| --- | --- | --- | --- |
| Camiseta E01 Social Club — Oversized Classic (base 40) | `e2354630-30dc-4d79-8aa7-9ea3dd93c2b7` | R$ 30,63 em todos os tamanhos | P `iqsgzFqa` · M `l3A6fvag` · G `ZHVJ0NRB` · GG `D7LqyqD7` · G1 `MmT1nAwO` · G2 `Nf15TnZl` |
| Camiseta E01 Social Club — Oversized Suedine (base 34) | `eb53a898-6868-4f0b-b2ad-5958ef8b6567` | R$ 41,57 em todos os tamanhos | PP `DX7krSyS` · P `4Bwluqkr` · M `5LLTCnbn` · G `XFcYlx4B` · GG `tZfoVo54` · XG `hJJQKlkQ` |

A API informa o mesmo custo com 2 lados e com só a frente. As costas não têm acréscimo, e G1/G2/XG custam o mesmo que os outros tamanhos.

### Versão creme, para camisetas escuras

As artes são as mesmas, mas o azul foi trocado por creme `#F1E9D8`:

- `E01-creme-frente-600dpi.png`
- `E01-creme-costas-600dpi.png`

Essa versão foi aprovada só na base Suedine, nas cores Preto e Verde Militar. A prévia está em `previa-preta-youdraw.jpg`.

| Item | Valor |
| --- | --- |
| Artes enviadas (IDs) | frente `72913` · costas `72914` |
| Produto | Camiseta E01 Social Club — Suedine Preto e Verde Militar |
| ID do produto | `f92df304-66cf-4aeb-b40d-fd32b007c17f` |
| Custo de produção | R$ 41,57 em todos os tamanhos e nas duas cores |
| `placement` da frente | x 0.5553 · y 0.2361 · width 0.1124 · height 0.0480 |
| `placement` das costas | x 0.3297 · y 0.1824 · width 0.3519 · height 0.2549 |

SKUs:

| Tamanho | Preto | Verde Militar |
| --- | --- | --- |
| PP | `Ye1OVNX7` | `PWhPgvsM` |
| P | `cVl9lL04` | `Nx55uaeM` |
| M | `WfgiVs5D` | `qkowDXzX` |
| G | `2GQYQaOR` | `TuRmAM87` |
| GG | `0YYyFioh` | `2fkS9aNA` |
| XG | `LTmoQgl1` | `m5g29Zu7` |

### Frete da YouDraw

Serviço "Frete Expresso – 2 a 10 dias úteis". O valor é igual nas duas bases. Cada peça a mais no pedido soma R$ 1,50.

| Destino | 1 peça | 2 peças |
| --- | --- | --- |
| São Paulo | R$ 12,20 | R$ 13,70 |
| Rio de Janeiro / Belo Horizonte | R$ 13,37 | R$ 14,87 |
| Salvador / Recife / Fortaleza | R$ 15,88 | R$ 17,38 |
| Curitiba / Porto Alegre | R$ 16,69 | R$ 18,19 |
| Brasília | R$ 21,25 | R$ 22,75 |
| Manaus | R$ 29,84 | R$ 31,34 |
