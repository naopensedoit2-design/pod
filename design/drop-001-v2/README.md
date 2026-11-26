# Drop 001 v2 — prova do processo novo

Quatro estampas refeitas com a skill `.claude/skills/estampas-lento`: briefing, conceitos com revisão do diretor de arte, esboços, crítica, arte final e QA. Nada foi criado na YouDraw: isso espera a aprovação do usuário.

| Peça | Lado | Base sugerida | Arte final |
| --- | --- | --- | --- |
| **Sossega.** | frente | Suedine Verde Militar (34) | `final/sossega-C.png` (28 × 27 cm) |
| **Home office desde 1893.** | costas, na barra | Classic Chocolate (40) | `final/homeoffice-A.png` (32,7 × 27,6 cm) |
| **Sombra e água fresca** | costas | Classic Off-White (40) | `final/sombra-B.png` (28,5 × 27,9 cm) |
| **Bula do maracujá** | costas + frente | Classic Branca (40) | `final/bula-B.png` (26,7 × 34,4 cm) e `final/bula-frente.png` (8,5 × 1,1 cm) |

## Processo e registros
- `brief.md`: objetivo, público, peças e limites.
- `conceitos.md`: pelo menos 8 ideias por vaga, a escolhida e a revisão do diretor de arte.
- `direcao.md`: imagem, letra, composição, cor e acabamento de cada peça.
- `criticas.md`: notas do diretor de arte nos esboços e na arte final.

## Como gerar
```bash
bash design/tools/setup.sh
bash design/drop-001-v2/src/build.sh                 # artes finais (300 DPI), QA e prévias
PXMM=4 bash design/drop-001-v2/src/build.sh          # esboço rápido
python3 design/drop-001-v2/src/folhas.py             # folhas de apresentação
```

## Posições usadas nas prévias
- **Sossega:** frente centralizada, topo 6 cm abaixo da gola.
- **Home office:** costas, topo 44 cm abaixo da gola. A arte termina ~5 cm acima da bainha. Confirmar o limite com a YouDraw.
- **Sombra e Bula:** costas, topo 8 cm abaixo da gola.
- **Frente da Bula:** peito esquerdo, posição padrão.

## Créditos (domínio público)
- **George Stubbs**, *Whistlejacket*, c. 1762. National Gallery, Londres. [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Whistlejacket_by_George_Stubbs_edit.jpg).
- **José Ferraz de Almeida Júnior**, *Caipira picando fumo*, 1893. Pinacoteca de São Paulo. [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Almeida_J%C3%BAnior_-_Caipira_Cutting_Tobacco_-_Google_Art_Project.jpg).
- **Franz Eugen Köhler**, *Köhler's Medizinal-Pflanzen*, prancha 187 (*Cocos nucifera*), 1897. [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cocos_nucifera_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-187.jpg).
- **Fórmula da crisina:** desenhada a partir da estrutura química (5,7-di-hidroxiflavona), sem imagem de terceiros.
- **Fontes tipográficas:** Mr Dafoe, IM Fell English, Archivo, Archivo Black e Archivo Narrow, todas com licença OFL.
