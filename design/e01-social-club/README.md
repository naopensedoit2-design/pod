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

`previa-youdraw.jpg` mostra a posição nos mockups Off-White da YouDraw. Em cima está a base 40 e embaixo a base 34.
