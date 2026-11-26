# Drop 001: crítica do diretor de arte (26/11/2026)

Primeira rodada do agente `diretor-de-arte`, feita depois de as peças estarem prontas e cadastradas na YouDraw. Foi o teste do processo novo (`.claude/skills/estampas-lento`). Notas de 1 a 5, segundo a `rubrica.md`.

**Veredito geral: 0 aprovadas, 7 para iterar (D01, D02, D03, D04, D05, D08, D10) e 3 para matar (D06, D07, D09).**

## Defeitos de impressão (conferidos na arte)

| Peça | Defeito | Causa |
| --- | --- | --- |
| D04 Café Torra Lenta, frente (arte `74418`) | Imprime "AFÉ DO CLUBE ✦ LOTE Nº 00" | A linha era mais larga que o canvas e foi cortada nas duas pontas |
| D08 Marcha Lenta, costas | Lê "Lentà" | O respiro da letra picou a perna do 3º cavalo e o fragmento virou acento; a linha do chão ficou tracejada |
| D10 Interlúdio, frente | "EST 2026", sem o ponto | O ponto ficou abaixo do mínimo e foi apagado como ilha pelo `qa.py --fix` |
| D09 Clássico, costas | Cauda com borda esfarrapada e duas manchas do chão original perto do casco | Recorte da pintura |

Não importe D04, D08 e D10 para a loja antes de corrigir a arte e atualizar na YouDraw.

## D01 Sombra e Água Fresca — ITERAR

Notas: Ideia 2 · Especificidade 2 · Imagem 2 · Tipografia 3 · Composição 3 · Peça 3 · Produção 4 · Desejo 2 · Anti-genérico 1.

O título é o melhor do drop, mas a imagem só ilustra a frase ao pé da letra. A "sombra" é uma pincelada amarela, e a "linogravura" é um oval vetorial com manchas.

Mudanças:
- **Literalizar a sombra.** Coco com ~9 cm, no alto, e a sombra dele vira a figura: uma diagonal de ~30 × 12 cm em retícula de 1 tinta.
- **Imagem.** Linóleo de verdade ou prancha de *Cocos nucifera* em domínio público.
- **Caligrafia.** Uma linha só, "Sombra e água fresca", correndo dentro da sombra.
- **Rodapé.** Apagar.
- **Cores.** Duas tintas, sem amarelo.
- **Frente.** Lisa.

## D03 Caju — ITERAR

Notas: Ideia 2 · Especificidade 2 · Imagem 1 · Tipografia 2 · Composição 2 · Peça 3 · Produção 4 · Desejo 2 · Anti-genérico 1.

É o "Orchard®" do pin 09 com outra fruta, e o conceito de feira não chegou à arte.

Mudanças:
- **Placa de feira de verdade.** "CAJU" a pincel atômico em papelão, escaneado.
- **Imagem.** O caju da xilogravura de Marcgrave & Piso (1648).
- **Frase.** "FAVOR NÃO APERTAR", no lugar das três linhas e do ®.
- **Crédito.** O real, pequeno.
- **Cores.** No máximo 3 tintas.
- **Frente.** Só a castanha.

## D05 Mesa 01 Reservado — ITERAR

Notas: Ideia 3 · Especificidade 2 · Imagem 2 · Tipografia 2 · Composição 3 · Peça 3 · Produção 3 · Desejo 3 · Anti-genérico 1.

As cadeiras são as do pin 03. Mudanças:
- **Gesto nosso.** Uma cadeira inclinada, encostada na mesa de boteco: a "mesa com dono". Foto própria, em retícula de 1 tinta.
- **Sombra.** Manter a sombra maior que o objeto.
- **Texto.** Só o "01" pintado no tampo, em estêncil.
- **Frente.** Lisa.

## D06 Fartura Tropical — MATAR

Notas: Ideia 2 · Especificidade 1 · Imagem 1 · Tipografia 2 · Composição 2 · Peça 3 · Produção 4 · Desejo 2 · Anti-genérico 1.

É o pin 07 traduzido, até a frase. "Desde 1500" ainda cria um problema histórico: abacaxi, caju e maracujá já eram cultivados pelos povos indígenas, e a manga veio com os portugueses.

Se renascer: uma natureza-morta de Albert Eckhout (anos 1640), ~32 cm, cortada pela borda de baixo, com o crédito verdadeiro e nada mais.

## D09 Clássico Members Only — MATAR a ideia (o Stubbs fica)

Notas: Ideia 2 · Especificidade 1 · Imagem 3 · Tipografia 2 · Composição 3 · Peça 3 · Produção 4 · Desejo 3 · Anti-genérico 1.

É o pin 02 sem o anacronismo, com frase em inglês de Pinterest. "Members Only" também é nome de marca de roupa conhecida: consultar o INPI (classe 25) antes de reimprimir.

Nova ideia com o mesmo cavalo: "Calma." em copperplate de ~22 cm laçando o peito (o sublime rebaixado), ou o cavalo como palpite no grupo 11 do jogo do bicho. Execução:
- **Cauda.** Dissolvendo em retícula.
- **Entrelaçamento real.** A letra alterna por cima e por trás.
- **Texto.** Só o crédito da obra.
- **Frente.** Lisa, ou só a inicial como monograma.

## As outras cinco

- **D02 Maracujá — ITERAR.** A ideia é forte, mas a execução é a fórmula do pin 08. Fazer uma **bula de remédio** em 1 tinta:
  - "Posologia: 1 copo ao fim da tarde";
  - "Contraindicações: reunião às 8h";
  - imagem: a *Passiflora* da *Flora Brasiliensis*.
- **D04 Café Torra Lenta — ITERAR (a mais perto de aprovar).** É a única com imagem de ofício e malha dentro da paleta, e tem a melhor frase do drop ("Notas de chocolate, caramelo e preguiça."). Deixar só "Torra Lenta" e a frase das notas, e consertar a frente.
- **D07 Manga Rosa da Sombra — MATAR.** É o D03 com outra fruta e a tipografia do D06.
- **D08 Marcha Lenta — ITERAR.** Tem a melhor ideia de humor do drop. Ajustes:
  - usar a sequência numerada do Muybridge em vez de 3 silhuetas;
  - sem frase explicando a piada;
  - corrigir o "Lentà".
- **D10 Interlúdio — ITERAR.** A contenção está certa, mas é o pin 04 traduzido e em inglês. Virar o **regulamento inteiro do clube**, em português, como peça-sistema.

## Quadro geral

**Esqueletos repetidos.**
- A pilha de rótulo está em 9 de 10 costas.
- Todas as peças ficam no mesmo lugar e na mesma escala.
- Em 9 delas, a frente é miniatura das costas.
- A letra nunca passa por trás da imagem.
- 8 de 10 são off-white.
- O mesmo vermelho está em 9.
- Seis peças são vetor com o mesmo filtro de manchas.

**Ideias repetidas.**
- "Chegar tarde, sair mais tarde" aparece 4 vezes, e "sem pressa" 5.
- "LENTO SOCIAL CLUB" está em 10 de 10.
- Metade do drop é fruta + nome.
- Seis peças copiam o motivo de um pin.

**Mais forte:** D04, seguido do D08. **Deve morrer:** D06 e, junto, o D07.

## 3 lições (já incorporadas à skill)

1. **A imagem define o nível antes da letra.** Fonte rica (domínio público, foto, linóleo real) antes de abrir o arquivo; nada de vetor com manchas.
2. **Copiar a jogada, nunca o motivo.** Portão obrigatório de comparação lado a lado (`compare.py`) antes de executar.
3. **Desenhar o drop como conjunto.** Os combinados:
   - mapa de posição, escala e esqueleto;
   - uma piada por peça;
   - até 2 textos por face;
   - frente com ideia própria ou lisa;
   - leitura de cada face, letra por letra, antes da YouDraw.
