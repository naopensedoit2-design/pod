# Calibragem: o que deixa uma estampa genérica

Arte gerada por IA e por designers no automático cai sempre nos mesmos padrões. Cada item abaixo é legítimo em algum briefing, mas, quando aparece sem motivo, é **padrão e não escolha**. O cliente percebe na hora, mesmo sem saber nomear. Antes de executar, e de novo antes de entregar, passe a peça por esta lista. Se algum item aparecer sem uma razão que você consiga escrever em uma frase, troque.

## Sinais e o que fazer

| # | Sinal | Por que é genérico | Em vez disso |
| --- | --- | --- | --- |
| 1 | **Pilha de rótulo**: título em cima, figura no meio, 2–3 linhas de microtexto centralizadas embaixo | É o esqueleto que sai para qualquer marca. No Drop 001 apareceu em 9 de 10 peças | Composição a partir da ideia: diagonal, figura cortada pela borda, letra entrelaçada, vazio grande, assimetria. No máximo duas peças por drop com o mesmo esqueleto |
| 2 | **Microtexto de enchimento**: "EST. 2026", "DROP 001", "SOCIAL CLUB", "PREMIUM", "LIMITED", "Nº 001", coordenadas, "desde"/"since" sem graça, ® decorativo | Preenche espaço sem dizer nada. É o sinal mais reconhecível de arte genérica | Texto pequeno só quando acrescenta sentido (uma piada, uma informação, um crédito real). Se dá para apagar sem perder nada, apague |
| 3 | **Meta-string**: palavras em CAIXA-ALTA espaçada unidas por " · ", " + " ou " — " | Cacoete de template | Uma frase de verdade, em caixa normal, ou nada |
| 4 | **Kit Pinterest**: script + serifa condensada + grotesca pequena, sempre os três | Virou fórmula | Uma ou duas vozes, escolhidas pelo conceito. Às vezes só a letra, às vezes nenhuma |
| 5 | **Ilustração de formas geométricas** com "desgaste" de pontinhos e ruído | Parece clip-art. Não tem luz, volume nem traço de mão, e o ruído denuncia o filtro | Imagem de fonte rica: pintura ou gravura em domínio público, foto de arquivo, foto própria ou geração autorizada. Ou assuma o gráfico puro (tipografia, padrão, sistema) com rigor |
| 6 | **Paleta primária chapada** (vermelho, amarelo, verde e azul saturados) como "Brasil tropical" | Clichê de "tropical". A Farm já ocupa esse lugar | Paleta tirada da fonte da imagem, cor da malha como parte da paleta, 1–2 tintas com intenção, tom sobre tom |
| 7 | **Off-white + script vermelho + serifa** sempre | É o "rótulo vintage" padrão. Vale às vezes, não sempre | Variar: tinta clara na malha escura, chocolate sobre marrom, uma tinta só, pintura colorida sem letra |
| 8 | **Tudo centralizado, tamanho médio, mesmo lugar** em todas as peças | Sem tensão, sem surpresa | Usar o mapa de posições (`peca.md`): barra, ombro, deslocado, gigante, minúsculo, costas sem frente |
| 9 | **Texto que explica a piada** e a mesma ideia ("sem pressa") repetida em todas as peças | Subestima quem lê e cansa no drop | Uma frase que deixa espaço. Cada peça com um ângulo diferente do conceito da marca |
| 10 | **Clichê brasileiro** genérico: coqueiro, arara, fruta tropical, "Rio", bandeira | Qualquer marca gringa faria igual | Um detalhe vivido e preciso: o copo americano, a placa "fiado só amanhã", o caipira de Almeida Júnior, o "Ai, que preguiça!" |
| 11 | **Textura de filtro** (turbulência, deslocamento, ruído aleatório) | Lê como digital | Retícula com ponto real (halftone.py), grão de risografia com registro errado de verdade, imagem de fonte com textura própria |
| 12 | **Copiar o motivo da referência** (a mesma cadeira, o mesmo cavalo, a mesma frase) | Vira imitação pior, e a marca original pode reclamar | Copiar a jogada (`leitura-de-referencias.md`) com motivo e cultura nossos |
| 13 | **Pesos iguais**: nenhum elemento domina | O olho não sabe para onde ir | Um herói claro; o resto subordinado |
| 14 | **Caligrafia engrossada por igual** para o DTF | Mata o contraste fino/grosso que faz a beleza da letra | `min_stroke.py`, que só engrossa o que está abaixo de 0,4 mm, ou letra grande o bastante para os finos sobreviverem |
| 15 | **Moldura, selo redondo, código de barras e estrelinha** como enfeite | Kit de "embalagem retrô", já saturado | Só se o conceito for paródia de embalagem, e então levar a paródia a sério (texto real, piada real) |

## Perguntas de teste

1. **Mesma chegada.** Se eu desse o mesmo briefing a outro designer ou outra IA, ele chegaria aqui? Se sim, falta virada.
2. **Troca de marca.** Outra marca poderia estampar isso trocando só o nome? Se sim, falta especificidade.
3. **A frase.** O que alguém contaria a um amigo sobre esta camiseta? Se a resposta é "é bonitinha", falta ideia.
4. **Miniatura.** Em 200 px, no feed, dá para entender e querer clicar?
5. **A 30 cm.** De perto, existe detalhe que recompensa quem olha (traço, textura, uma piada escondida)?
6. **O espelho.** Qual elemento eu tiro? Tire um.
7. **Ofício.** Parece que alguém passou horas nisso, ou que saiu num clique?

Registre em `direcao.md` (antes) e em `criticas.md` (depois) quais sinais apareceram e como foram resolvidos.
