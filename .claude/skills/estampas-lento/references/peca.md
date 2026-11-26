# A peça: bases, cores, posições e impressão

A estampa só existe vestida. Uma arte linda no PNG pode sumir na malha, cair na dobra da axila ou pesar no corpo. Decida posição, tamanho e cor **junto** com a ideia, não depois.

## Bases da YouDraw (custo de produção com frente + costas, nov/2026)

As principais para a LENTO:

| Base (ID) | Custo | Cores | Tamanhos | Nota |
| --- | --- | --- | --- | --- |
| Oversized Classic (40) | R$ 30,63 | Preta, Branca, Off-White, Chocolate | P–G2 | Maior margem; algodão cardado |
| Oversized Suedine 220g (34) | R$ 41,57 | Preto, Off-White, Marrom, Verde Militar | PP–XG | Toque mais encorpado |
| Oversized Cotton (17) | R$ 48,91 | Azul Marinho, Bege, Chocolate, Preta, Branca, Off-White | P–GG | A única oversized com marinho |
| Oversized 30.1 Premium 180g (72) | R$ 64,22 | Areia Saint Tropez, Bege Costeiro, Branca, Chumbo Cannes, Marinho Profundo, Marrom Monte Carlo, Off White, Preto | PP–G3 | Paleta de cores sofisticada |
| Oversized Texture (81) | R$ 93,82 | Azul Mediterrâneo, Bege Costeiro, Chumbo Cassino, Off White, Preto | P–G3 | Malha com textura; linha premium |
| Streetwear 30.1 (75) | R$ 55,21 | 11 cores, incluindo Vermelho Carmine, Azul Royal e Amarelo Provençal | P–G7 | As cores da marca (vermelho e azul) |
| Oversized Heavy 240 (10) | R$ 64,41 | Off-White, Preta | P–EG | Malha pesada |
| Moletom Oversized Boxy Premium (46) | R$ 192,92 | Chumbo, Marrom Monte Carlo, Off White, Preto, Verde Jade | P–G2 | Inverno, ticket alto |

- **Lista completa.** `GET /catalog/products` na API. Custo e cores mudam: confira antes de decidir.
- **Mockups e geometria.** Só as bases 40 e 34 estão em `design/tools/mockups.json`. Para outra base, baixe os mockups (`GET /catalog/products/{id}` traz `mockups[].front_url/back_url` por cor) e meça o centro da peça e a costura da gola, como nas outras.

## Onde dá para imprimir

A YouDraw imprime **frente e costas**, com posição livre em cada face. Não imprime em manga, gola ou etiqueta interna. Dentro de cada face, explore:

```
FRENTE (oversized, ~58 cm de largura no peito)      COSTAS
 ┌──────────────────────────┐                ┌──────────────────────────┐
 │   [peito esq. 8–11 cm]   │  ← "assinatura"│   [nuca 6–10 cm]         │ ← discreto, 3–5 cm abaixo da gola
 │                          │                │  [costas alto 28–34 cm]  │ ← padrão: topo 8 cm abaixo da gola
 │    [centro 20–28 cm]     │                │                          │
 │                          │                │  [costas inteiras ~38×48]│ ← statement (confirme o máximo)
 │ [barra/canto 6–12 cm]    │  ← inesperado  │      [barra 10–30 cm]    │ ← horizonte baixo, ousado
 └──────────────────────────┘                └──────────────────────────┘
```

**Como cada posição se lê:**
- **Pequeno no peito, grande nas costas:** clássico de streetwear.
- **Só costas, frente lisa:** luxo discreto, quem vê de frente não sabe.
- **Frente grande, costas com detalhe na nuca:** inverte o esperado.
- **Barra ou canto:** surpresa; funciona com textos curtos e imagens horizontais.
- **Deslocado ou cortado:** a imagem "entra" pela lateral. Exige que o recorte pareça proposital.

**Medidas na `preview.js`:**
- `--front-offset` em cm (0 = centro; 10 na Classic = peito esquerdo de quem veste);
- `--front-top` em cm abaixo da gola;
- `--back-top` em cm abaixo da gola;
- `--back-offset` para deslocar nas costas.

**Tamanho máximo.** A API não informa o limite físico da impressão. Até ~35 × 45 cm é seguro; acima disso, confirme com a YouDraw.

## Leitura no corpo

- **A 3 m** (rua, miniatura de anúncio): só a forma geral e a cor contam. A peça precisa de uma silhueta clara.
- **A 1 m** (conversa): a mensagem principal precisa ler.
- **A 30 cm** (quem pega na mão): o detalhe recompensa (textura, piada escondida, assinatura).
- **Corpo, não papel:**
  - a área de 5–6 cm abaixo da gola nas costas dobra quando a pessoa se mexe;
  - nas laterais do peito, a axila esconde;
  - estampa muito baixa nas costas fica atrás da cintura quando a pessoa senta.
- **Oversized cai.** O "centro do peito" fica mais baixo que numa camiseta regular. Use as medidas a partir da gola, não do meio da peça.

## Cor sobre malha

- **Paleta.** A cor da malha faz parte dela. Tinta chocolate sobre malha marrom = tom sobre tom (luxo). Dourado-ocre sobre marinho = o pin "Interlude".
- **Malha clara.** Cores muito claras (creme, amarelo-claro, cinza-claro) somem no off-white. Preto puro sobre off-white é duro; experimente marrom-escuro ou "tinta" (#1E1A17).
- **Malha escura.** O DTF imprime com base branca, e as cores saturam e ganham peso. Sombras escuras da imagem (num quadro, por exemplo) se misturam com a malha: aproveite ou corte.
- **Teste.** Sempre na cor exata do mockup, nunca num fundo genérico.

## Regras de impressão (DTF)

| Regra | Valor | Ferramenta |
| --- | --- | --- |
| Resolução | 300 DPI no tamanho real (a YouDraw aceita ≥ 150) | `qa.py` |
| Transparência | Só 0 ou 100%. Degradê, vinheta e sombra viram retícula | `halftone.py` |
| Traço mínimo | 0,4 mm (0,5 mm em tinta clara na malha escura) | `qa.py`, `min_stroke.py` |
| Ilhas (pontos soltos) | Nada menor que ~0,3 mm² (≈0,6 mm de diâmetro) | `qa.py --fix` |
| Furos e vazados | Nada menor que ~0,2 mm² (fecham com a tinta) | `qa.py --fix` |
| Texto | Altura de maiúscula ≥ 2 mm | `specimen.js` + `qa.py` |
| Áreas chapadas | Evite blocos grandes: o DTF é uma película, área grande pesa, esquenta e racha. Retícula ou textura reduzem a tinta e melhoram o toque | `qa.py` mostra a % de área com tinta |
| Margem do arquivo | O PNG é recortado pelo conteúdo (`render()` faz isso). A posição na peça vem do placement | `preview.js` |

## Custo e preço (referência)

- **Classic:** custo R$ 30,63; vendida a R$ 149,90 sobram ~R$ 106 por peça antes do anúncio.
- **Suedine:** custo R$ 41,57; vendida a R$ 159,90 sobram ~R$ 104.
- **Base mais cara:** só se o toque ou a cor justificarem o preço maior (ver o estudo no histórico do projeto).
- **Frete:** pago pelo cliente, de R$ 12,20 a R$ 29,84; R$ 1,50 por peça a mais no pedido.
