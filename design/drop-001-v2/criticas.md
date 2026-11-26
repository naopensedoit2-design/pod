# Críticas do diretor de arte — Drop 001 v2

O agente `diretor-de-arte` (`.claude/agents/diretor-de-arte.md`) avaliou em três rodadas:
1. **Conceitos.** Está no fim de `conceitos.md`.
2. **Esboços.** Está abaixo, na íntegra, seguida do que foi feito em cada pedido.
3. **Arte final.** Está no fim deste arquivo.

A regra da skill: só avança com nota ≥ 4 em todos os critérios e 5 em produção.

## Rodada 2 — esboços (relatório na íntegra)

**Veredito: 0 aprovadas, 4 para iterar, 0 para matar.** A Bula está mais perto de aprovar; a Sombra está em risco.

## Vaga 3 — Sossega (variante C) — veredito: ITERAR
Resumo: a palavra grande dá a melhor miniatura do drop; na A, com 14 cm, ela vira etiqueta. A linha de base já encosta no dorso (±2 mm), mas nada do cavalo toca a palavra, e o resultado ainda é pintura com palavra colada.

| Critério | Nota | Evidência |
|---|---|---|
| Ideia | 4 | Bronca de mãe para cavalo empinado |
| Especificidade | 4 | Fala nossa contra retrato inglês |
| Imagem | 4 | Stubbs a 300 DPI, com craquelê; borda incoerente (cauda pontilhada, crina com corte duro) |
| Tipografia | 3 | O sombreado bordô some no alazão |
| Composição | 3 | 18,5 cm de palavra por cima de tudo, sem entrelaçamento |
| Peça | 4 | Frente, de 6,5 a 33 cm abaixo da gola; lê a 3 m |
| Produção (prov.) | 4 | Asset limpo no QA |
| Desejo | 4 | Funciona como anúncio |
| Anti-genérico | 3 | #7 em variação: script claro com sombra vermelha, cara de rótulo vintage americano |

Mudanças:
1. Passe as mechas da crina na cernelha (x 140–160 mm, y 40–86 mm no asset) por cima do "g".
2. Troque o sombreado #6E2620 por #24140F e aumente o deslocamento de 6% para 9% da maiúscula (~4,4 mm). Ele vira sombra de letreiro em bloco e passa a ler sobre o alazão.
3. Use uma borda só, o corte duro da crina. Tire a fileira de pontos de 0,7 mm da cauda e do ventre.

## Vaga 4 — Home office (variante A) — veredito: ITERAR
Resumo: a frase e a pintura são as mais precisas do drop; na C, a maiúscula de 7,5 mm não lê a 1 m. O problema é que ele flutua e o recorte parece adesivo.

| Critério | Nota | Evidência |
|---|---|---|
| Ideia | 4 | Anacronismo limpo; a data é a da obra |
| Especificidade | 5 | Almeida Júnior + o nosso anglicismo |
| Imagem | 3 | Trama da tela e terra na calça; a máscara-polígono com contorno de contas leva parede e chão |
| Tipografia | 4 | IM Fell, com "1893" em numerais antigos |
| Composição | 3 | Texto na altura da cabeça, sem diálogo com a figura |
| Peça | 3 | Pés a 12 cm da bainha (o plano era 5): a barra não vira chão |
| Produção (prov.) | 4 | Asset de 300 DPI limpo |
| Desejo | 4 | A frase vende |
| Anti-genérico | 4 | Nenhum sinal |

Mudanças:
1. Desça a arte 7 cm (back-top de 44 para 51 cm), se a YouDraw imprimir tão baixo; confirme antes. Se não imprimir, mantenha 1,5–2 cm do chão da pintura sob os pés e as estacas, cortado reto e paralelo à bainha.
2. Faça o recorte justo na figura e no banco, com borda dura e as pontas do banco em corte reto. Elimine o halo de parede no ombro (~1 cm) e o chão na ponta esquerda (~2 × 5 cm).
3. Desça o texto ~3 cm, até a base de "desde 1893." coincidir com o assento: a frase continua o banco.

## Vaga 1 — Sombra (B) — veredito: ITERAR (em risco)
Resumo: a diagonal e o degradê da sombra (73% → 47%) estão certos. Mas em 200 px a peça lê como "cebola e folha", e a frase vazada derrete.

| Critério | Nota | Evidência |
|---|---|---|
| Ideia | 4 | Sombra literal; o coco é a água fresca |
| Especificidade | 3 | O coco beira o clichê; a prancha de Köhler segura |
| Imagem | 2 | A sombra é uma folha lanceolada; a luz da prancha vem da esquerda e a sombra cai para a esquerda; coco ampliado 1,5× |
| Tipografia | 2 | O halo de 1 mm incha a itálica e fecha os olhos de "e", "a" e "g" |
| Composição | 3 | Crédito solto no canto, 20 cm abaixo do coco |
| Peça | 3 | Frase com altura-x de ~6 mm não lê a 3 m |
| Produção (prov.) | 3 | Último dígito do ano cortado no PNG; 1887 em conceitos.md × 1897 em creditos.json |
| Desejo | 2 | Miniatura sem gancho |
| Anti-genérico | 3 | #5 (forma vetorial com retícula), #10 (coco) |

Mudanças:
1. Redesenhe a sombra como projeção do coco: largura constante de ~6,2 cm, fim arredondado com a pontinha ≤ 4 cm, nascendo do ponto de contato. Espelhe o coco.
2. Frase: halo de 0,3 mm com aro chapado de 1,2 mm em volta das letras; comprimento de 17 para ~22 cm (altura-x de 9–10 mm). Use outra voz, pesada (ex.: Fraunces itálica 800), porque IM Fell já é a voz da vaga 4.
3. Ponha o crédito sob o coco, com maiúscula de 2 mm, e corrija o ano. Baixe o original da prancha: em `fontes/` está a miniatura de 1280 px.

Se a próxima rodada não ler como sombra em 200 px, troque para a ideia #7.

## Vaga 2 — Bula (B, azul) — veredito: ITERAR
Resumo: a ideia e o texto mais fortes do drop, e o azul é a única cor fria. A 3 m, porém, ainda lê como pôster de molécula, não como bula.

Conferência:
- **Crisina:** correta. OH em C5 (vizinho de C4a) e em C7; C2=C3; C4=O; fenila em C2; Kekulé válido; C₁₅H₁₀O₄. Mede 15,5 cm com os rótulos.
- **Texto:** as 9 perguntas são as da RDC 47; acentos e crase estão certos.

| Critério | Nota | Evidência |
|---|---|---|
| Ideia | 5 | Bula completa; a frente torce a propaganda |
| Especificidade | 5 | "q.s.p. 1 fim de tarde", "Lote: verão" |
| Imagem | 3 | O traço de 0,75 mm some a 3 m |
| Tipografia | 4 | Uma família só; o título Black de borda a borda é cacoete de pôster |
| Composição | 3 | Título, molécula e texto empilhados; texto arejado |
| Peça | 4 | Sussurro no peito, mas a frente é preta e as costas azuis |
| Produção (prov.) | 4 | 122 ilhas a 152 DPI (pingos e acentos): reconferir a 300 |
| Desejo | 4 | Humor que se compra |
| Anti-genérico | 3 | #1 pilha de rótulo |

Mudanças:
1. **Texto.** O item 4 repete o 8 e o 9 (sono, cochilo e dormir; adiamento e atraso) e a "rede" da frente. Troque por uma interação: "Não associar a café, despertador ou boleto." No item 3, "responder **ao** grupo". Escreva *Passiflora edulis* em itálico e "Sims" em redondo.
2. **Hierarquia.** Reduza o título de 26,6 para ~18 cm, alinhado à esquerda (maiúscula de 2 cm), e engrosse o traço da molécula de 0,75 para 1,2 mm.
3. **Textura de bula.** Perguntas em caixa-alta bold, como na bula real; respostas em Regular justificado (traço ≥ 0,4 mm); entrelinha de 1,32 para 1,2; espaço entre itens de 5 para 2,5 mm.
4. **Vincos.** Dois verticais e dois horizontais vazados, de 0,8 mm, cortando tudo: a bula desdobrada.
5. **Frente** em #1F3D9C.

## Quadro do drop
O drop funciona: são quatro esqueletos, quatro posições e quatro malhas.
- **Malhas:** Off-White e Branca, no feed, parecem a mesma camiseta clara. A Sombra precisa ganhar peso.
- **Vagas 3 e 4:** dividem o creme #F1E6CF e o recorte pontilhado. A escala e a posição sustentam a diferença.
- **Voz:** IM Fell é a frase da 1 e da 4.
- **Piadas:** nenhuma piada principal se repete. Há ecos: "à sombra" (bula, item 5) com a vaga 1; o "e-mail urgente" (bula, item 1) com a vaga 4; e o sono três vezes dentro da bula.
- **Mais forte:** Bula. **Mais fraca:** Sombra.


## O que foi feito depois da rodada 2

### Sossega (C)
- **Mudança 1, a crina sobre o "g".** As mechas indicadas (x 140–160 mm, y 40–86 mm) não cruzam a palavra, então a troca não era possível como foi pedida. O mesmo efeito veio pela cauda, redesenhada por cima do floreio do "S" (máscara `crina` em `src/sossega.js`). A palavra deixa de parecer colada.
- **Mudança 2, o sombreado.** Virou bloco #24140F, com deslocamento de 9% da maiúscula.
- **Mudança 3, a borda.** Ficou uma só: corte duro em todo o contorno. A fileira de pontos da cauda e do ventre saiu.

### Home office (A)
- **Mudança 1, a posição.** A API da YouDraw (`/catalog/products/40`) diz só que a área de impressão vai até 40 × 50 cm e que a posição é livre. Ela não diz até onde imprime para baixo nem traz tabela de medidas por tamanho.
  - Por isso a arte ganhou o próprio chão: uma faixa reta da pintura sob os pés, de ~1,5 cm abaixo do pé da frente.
  - Ela fica a ~6 cm da bainha no mockup (topo a 48 cm da gola) e funciona mais alta, se a YouDraw não imprimir tão baixo.
  - **Confirmar com a YouDraw antes de produzir:** até onde a impressão desce, e se a posição muda no tamanho P.
- **Mudança 2, o recorte.** Novo recorte justo de borda dura (`src/caipira_cut.py`):
  - o GrabCut acha o homem;
  - polígonos traçados na pintura a 100% tiram a parede no ombro e na manga (era ~1 cm) e o tronco entre as pernas;
  - canelas e pés são recortados pela cor da pele, sem sombra nem chão grudados;
  - a tábua do banco é cortada reta logo depois das duas estacas, sem chão na ponta esquerda.
- **Mudança 3, o texto.** A base de "desde 1893." está na altura do assento, e o crédito fica na linha da base do chão.

### Sombra (B)
- **Mudança 1, a sombra.** Agora é a projeção do coco:
  - largura constante de 6,2 cm, nascendo do ponto de contato;
  - fim em meia elipse, com uma pontinha de 9 mm;
  - o coco foi espelhado, para a luz bater com a sombra.
- **Mudança 2, a frase.**
  - Fraunces itálica 800, com folga de 0,3 mm e aro chapado de 1,5 mm (o pedido era 1,2 mm; 1,5 segura melhor a retícula de 24 LPI).
  - A frase tem ~20 cm e altura-x de ~10 mm.
- **Mudança 3, o crédito.**
  - Embaixo do coco não deu: é onde a sombra nasce, e a letra sumia nos pontos da retícula (mesma tinta; achado na leitura letra a letra). Virou etiqueta de museu ao lado do coco, com 4,6 mm de corpo; a 3,6 mm o pingo do "i" itálico ficava abaixo do ponto mínimo do DTF.
  - O ano foi corrigido para 1897 em todos os arquivos.
  - Original da prancha: o Wikimedia Commons só tem 1280 px desta prancha. No tamanho da peça (6,2 cm) dá ~195 DPI, acima do mínimo de 150 da YouDraw. Fica registrado.
- **Retícula.** Perto de 50% os pontos encostam pelos cantos e prendem furinhos menores que 0,18 mm², que a tinta fecha. `src/sombra_ko.py` fecha esses furinhos no arquivo, para ele mostrar o que vai ser impresso.

### Bula (B)
- **Mudança 1, o texto.** Item 4 trocado por "Não associar a café, despertador ou boleto."; "responder ao grupo"; *Passiflora edulis* em itálico e "Sims" em redondo.
- **Mudança 2, a hierarquia.** O título baixou de 26,6 para 16 cm, alinhado à esquerda, e a fórmula ganhou traço de 1,2 mm.
- **Mudança 3, a textura de bula.**
  - Perguntas em caixa-alta Archivo 800 e respostas em Archivo 600 justificado. O 600 dá traço ≥ 0,4 mm, e no 400 o pingo do "i" virava ilha.
  - Entrelinha de 1,2 e 2,5 mm entre itens.
  - O espaço inseparável de "A avó" e "a TV" também estica na justificação.
- **Mudança 4, os vincos.** São 2 verticais e 2 horizontais de 0,8 mm, perto dos terços (`src/bula_vincos.py`).
  - Cortam título, filetes, ligações da molécula, perguntas e títulos em caixa-alta bold.
  - **Desvio do pedido ("cortando tudo"):** respostas, composição, rótulos da fórmula e dizeres legais ficam inteiros. Na leitura letra a letra, o vinco sobre o texto de 4,9 mm trocava letras: "funciona" virava "tunciona", "do sol" virava "dc sol", "Ninguém" perdia o acento.
  - A busca escolhe posições que não criam ilha mesmo com ±1 px de variação no render, e nunca em cima de filete.
- **Mudança 5, a frente.** Ficou em #1F3D9C.

### Quadro do drop
- **Malhas claras.** Off-White e Branca continuam as duas camisetas claras; a Sombra ganhou peso com a frase pesada e o aro chapado. Vale testar a Sombra numa malha mais escura antes do drop real.
- **Creme compartilhado.** As vagas 3 e 4 ainda usam o creme #F1E6CF, mas nenhuma tem mais borda pontilhada: as duas são corte duro, em escalas e posições diferentes.
- **Vozes.** Agora são quatro: Mr Dafoe (3), IM Fell (4), Fraunces (1) e Archivo (2).
- **Ecos de piada.**
  - O item 5 da bula virou "Na fruteira, longe do sol."
  - O item 1 virou "Pressa, segunda-feira, fila de banco e trânsito."
  - O sono aparece uma vez a menos.
