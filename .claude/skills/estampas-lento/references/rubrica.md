# Rubrica do diretor de arte

Usada pelo agente `diretor-de-arte` e pela autocrítica. Notas de 1 a 5. **Para avançar: nota ≥ 4 em todos os critérios, e 5 em Produção.** Uma nota sem evidência não vale: cada nota precisa apontar o que na imagem a justifica.

| # | Critério | 5 | 3 | 1 |
| --- | --- | --- | --- | --- |
| 1 | **Ideia** | Contada em uma frase; tem tensão ou graça; surpreende e continua boa na segunda olhada | Agradável, mas previsível | Não tem ideia: é decoração |
| 2 | **Especificidade** (LENTO/Brasil) | Só a LENTO faria; detalhe cultural preciso e vivido | Brasil ou "clube" genérico | Qualquer marca estamparia trocando o nome |
| 3 | **Imagem** | Ofício evidente: luz, volume, textura real, borda intencional, recompensa de perto | Correta mas sem riqueza | Clip-art, formas geométricas, filtro de textura |
| 4 | **Tipografia** | Voz forte, desenhada ou customizada, escala corajosa, kerning e acentos impecáveis | Fonte bem escolhida, só digitada | Fonte batida, três vozes sem motivo, microtexto de enchimento |
| 5 | **Composição** | Herói claro, tensão, vazio usado, letra e imagem conversando; não é um esqueleto de template | Organizada mas centrada e morna | Pilha de rótulo, tudo do mesmo peso |
| 6 | **Peça** | Posição e escala pensadas para o corpo; frente e costas dialogam; cor da malha faz parte; lê a 3 m e premia a 30 cm | Posição padrão sem prejuízo | Some na malha, cai em dobra, escala errada |
| 7 | **Produção (DTF)** | `qa.py` limpo; traços ≥ 0,4 mm; nada semitransparente; 300 DPI; pouca área chapada | Pequenos ajustes | Vai falhar na impressão |
| 8 | **Desejo** | Alguém pagaria R$ 150 e vestiria em público; funciona como miniatura de anúncio | "Bonitinha" | Ninguém compraria |
| 9 | **Anti-genérico** | Nenhum sinal de `anti-generico.md` sem motivo | 1–2 sinais | 3 ou mais |

## Formato da crítica

```
## <estampa> — veredito: APROVAR | ITERAR | MATAR
Resumo (2 frases): o que funciona e o que impede de ser excelente.

| Critério | Nota | Evidência (o que se vê) |
| Ideia | 4 | ... |
| ... |

Sinais genéricos encontrados: #1 pilha de rótulo (rodapé com 3 linhas), #2 "EST. 2026" ...

Mudanças, em ordem de impacto (concretas, com medidas):
1. Aumentar a caligrafia para 34 cm de largura e fazer o laço do "A" passar atrás do chapéu.
2. Apagar as duas linhas de rodapé; mover o crédito da obra para a frente, 2 mm, sob a assinatura.
3. ...

Se MATAR: por que a ideia não se sustenta e qual direção do conceito vale explorar.
```

## Como criticar bem

- **Seja específico e mensurável.** Diga "a frase de apoio está a 6 mm de altura; desça para 3 mm e alinhe à esquerda do cavalo", não "melhorar a hierarquia".
- **Compare.** Coloque a peça ao lado da referência ou da versão anterior (`compare.py`). O genérico fica evidente lado a lado.
- **Olhe nas três distâncias.** Miniatura, peça e 100%.
- **Lembre que elogio não ajuda a iterar.** Diga o que funciona em uma linha e gaste o resto no que falta.
- **Mate quando for o caso.** Uma ideia fraca bem executada continua fraca. Proponha outra direção.
