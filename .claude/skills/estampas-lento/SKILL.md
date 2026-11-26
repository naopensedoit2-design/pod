---
name: estampas-lento
description: Direção de arte e produção das estampas da LENTO (camisetas e moletons em DTF na YouDraw) — do briefing e da leitura precisa das referências até o conceito, a tipografia, a composição na peça, o arquivo de impressão, a prévia no mockup, a crítica do diretor de arte e o produto criado. Use sempre que o pedido envolver criar, refazer, melhorar, avaliar ou produzir uma estampa, arte de camiseta, drop, coleção, cápsula, collab, mockup ou referências visuais (pasta do Pinterest, prints, fotos), mesmo que a pessoa diga só "faz uma arte", "manda ideias de camiseta", "ficou genérico", "analisa essa pasta" ou "quero algo mais disruptivo". Vale também para t-shirt graphics, streetwear prints e apparel artwork.
---

# Estampas LENTO

O objetivo é estampa que pareça saída de um estúdio de ponta: uma ideia clara, uma imagem com ofício, letra desenhada, composição com tensão e acabamento que sobrevive ao DTF. A régua é simples: alguém paga R$ 150, veste na rua e outra pessoa pergunta de onde é. Se a arte poderia ter saído de qualquer gerador ou de qualquer outra marca, ainda não está pronta — por melhor que seja a ideia.

## Por que esta skill existe

No Drop 001 as ideias foram aprovadas e a execução saiu genérica. Os motivos são exatamente o que este processo corrige:

1. **Ilustração montada com formas geométricas e "textura" de filtro.** Virou clip-art: sem volume, luz, mão. As referências tinham pintura a óleo, gravura e aquarela.
2. **Um molde para dez peças.** Título em cima, figura no meio e duas ou três linhas de caixa-alta espaçada embaixo ("LENTO SOCIAL CLUB + DROP 001 + EST. 2026").
3. **Caligrafia tratada como fonte digitada.** Tamanho médio, engrossada por igual para o DTF. Nas referências ela é desenhada, enorme, com floreios que abraçam a imagem e passam por trás e pela frente dela.
4. **Cores primárias chapadas como atalho para "Brasil".**
5. **Copiar o motivo da referência em vez do movimento.** A mesma cadeira, o mesmo cavalo, a mesma fruta.

`references/anti-generico.md` lista esses sinais e outros, com o que fazer no lugar. Leia antes de planejar qualquer peça.

## Processo

Siga as etapas em ordem, numa pasta `design/<projeto>/`. Cada etapa deixa um arquivo, para que outra sessão (ou outra pessoa) continue de onde parou. Há modelos para `brief.md`, `conceitos.md` e `direcao.md` em `templates/`. Antes de tudo, rode `bash design/tools/setup.sh`.

### 1. Briefing → `brief.md`

Escreva antes de ter qualquer ideia:
- **Para quê.** Drop, reposição, anúncio ou collab; quantas peças; prazo.
- **Para quem e onde.** Quem veste e em que situação: idade, cidade, o que segue, onde vai usar.
- **Peça.** Base, cores e custo (tabela em `references/peca.md`). A YouDraw imprime só frente e costas, mas em qualquer posição dessas faces.
- **Histórico.** O que o usuário já aprovou, recusou ou comentou (os `README.md` em `design/` e esta skill). Até aqui: gostou das ideias do Drop 001 e achou a execução genérica; quer "original e disruptivo"; pediu domínio público em vez de IA para economizar créditos.
- **Limites.** Marcas registradas, imagem de pessoa real, bandeira e brasão (ver `references/brasil.md`).

Se faltar algo essencial, como o público, proponha uma hipótese explícita e siga.

### 2. Leitura das referências → `referencias.md`

Referência é aula de como fazer, não motivo para repetir.

1. Baixe na maior resolução e gere os recortes de leitura:
   ```bash
   python3 design/tools/ref_zoom.py <imagens ou links do Pinterest> --out design/<projeto>/refs/zoom
   ```
2. Olhe a peça inteira e depois **todos** os recortes. É neles que aparecem traço, textura, serifa, floreio e borda do recorte.
3. Preencha a ficha de `references/leitura-de-referencias.md` para cada imagem.
4. Feche com a síntese: **jogadas a roubar**, **o que não copiar**, **onde a pasta é fraca ou saturada** e **para onde ir além dela**. O arquivo traz como exemplo a pasta do Drop 001 inteira.

### 3. Conceitos → `conceitos.md`

- Para cada vaga do drop, gere **no mínimo 8 ideias** antes de escolher. As três primeiras costumam ser as óbvias, as que qualquer um teria. Descarte-as de propósito, a não ser que tenham uma virada clara.
- Escreva cada ideia em uma frase: **insight + jogada + imagem**. Exemplo: "O *Caipira picando fumo* de Almeida Júnior (1893, domínio público), sem pressa nenhuma, com 'Ai, que preguiça!' do Macunaíma (1928) em caligrafia gigante passando por trás do chapéu."
- Use os **operadores de virada** (`references/repertorio.md`) e o repertório brasileiro (`references/brasil.md`). É dali que sai o "disruptivo": juntar duas coisas que não costumam estar juntas, com precisão cultural.
- Teste cada ideia:
  - Só a LENTO faria isso?
  - Dá para contar a um amigo em uma frase?
  - Tem tensão, ou seja, duas coisas que não costumam andar juntas?
  - Sustenta uma imagem forte, e não só um texto?
  - Quem não pegar a referência ainda acha bonito?
- Num drop, varie territórios e sistemas visuais. **No máximo duas peças com o mesmo esqueleto de composição.**

### 4. Direção de arte → `direcao.md`

Antes de desenhar, decida e escreva para cada estampa:
- **Imagem.** De onde vem e como será tratada. As origens possíveis:
  - pintura, gravura ou foto em domínio público;
  - foto própria;
  - geração de imagem, só com autorização;
  - só tipografia;
  - sistema gráfico ou padrão.

  Não planeje "eu desenho a fruta com formas geométricas": esse é o caminho do clip-art. Código é ótimo para tipografia, sistemas, retícula, padrões e composição. Imagem rica vem de fonte rica.
- **Tipografia.** Famílias e papéis, tamanho real em cm e o que será desenhado à mão (floreios, ligaduras, entrelaçamento com a imagem). Escolha olhando o texto real no mostruário (`specimen.js`). Ver `references/tipografia.md`.
- **Composição.** Wireframe ASCII da peça, frente e costas, com posição e tamanho em cm. Diga qual é o herói e onde fica o vazio.
- **Cor.** Quantas tintas e quais, mais a cor da camiseta como parte da paleta.
- **Acabamento.** Borda, textura e retícula.

Depois, **revise o plano contra `references/anti-generico.md`**. Se algum item for o padrão que sairia para qualquer marca parecida, troque e anote o que mudou e por quê.

### 5. Esboços e escolha

- Para cada estampa, faça **3 versões rápidas** variando composição e escala, não só cor. Veja direto no mockup:
  ```bash
  node design/tools/preview.js --front f.png --back c.png --base 40 --color Off-White --zoom --out previa.jpg
  ```
- Leve as versões ao diretor de arte (etapa 7) e escolha uma. Ao usuário, mostre só o que passou na crítica, com a sua recomendação.

### 6. Execução

- **Formato.** 300 DPI no tamanho real; texto em vetor (`type.js`); alfa sem semitransparência. Semitransparência vira retícula com `halftone.py`.
- **Ofício que separa amador de profissional:**
  - kerning manual nas palavras grandes;
  - floreios desenhados para a composição (`flourish.js`);
  - letra que passa por trás e pela frente da imagem, feita com máscaras;
  - retoque da imagem (níveis, cor puxada para a paleta);
  - textura de verdade (retícula, grão de impressão) em vez de ruído de filtro.
- **Regras de impressão** (`references/peca.md`): traço ≥ 0,4 mm; texto com pelo menos 2 mm de altura de maiúscula; sem áreas chapadas enormes. Para engrossar só os traços finos sem matar o contraste da caligrafia, use `min_stroke.py`.

### 7. Crítica → `criticas.md`

- Gere a prévia no mockup (`preview.js --zoom`) e recortes a 100% da arte.
- Chame o agente **`diretor-de-arte`** (`.claude/agents/diretor-de-arte.md`). Passe o brief, a síntese das referências, o conceito e os caminhos dos arquivos. Se o agente não estiver disponível, faça a crítica você mesmo seguindo `references/rubrica.md`, como se a arte fosse de outra pessoa.
- Só avance com **nota 4 ou mais em todos os critérios**; produção precisa de 5. Corrija o que ele apontar, registre as notas e itere.

### 8. Produção

- **QA.** `python3 design/tools/qa.py design/<projeto>/*.png`
- **Aprovação.** Mostre ao usuário e espere o "pode criar" antes de subir arte ou criar produto na YouDraw. Nunca crie pedidos nem cobranças.
- **YouDraw.** `node design/tools/produce.js design/<projeto>/drop.json --create`. Depois confira os mockups da própria YouDraw com `get <id>` (`media.status` precisa estar `ready`).
- **Fotos da loja.** `python3 design/tools/photos.py job.json`, converta para WebP em `public/products/<projeto>/` e registre no manifesto `src/data/product-photos.json`.
- **Documentação.** Em `design/<projeto>/README.md`: arquivos, IDs, SKUs, posições e créditos de domínio público.

## Princípios, e por quê

- **Um herói por peça.** O olho precisa saber para onde ir. Duas coisas gritando ao mesmo tempo viram ruído, e ruído parece amador.
- **Imagem com ofício.** O que dá valor percebido a uma estampa de R$ 150 é a sensação de horas de trabalho: luz, volume, detalhe que recompensa quem chega perto.
- **Letra desenhada, não digitada.** A fonte é o ponto de partida. Floreio, ligação e encaixe com a imagem são o que a tornam única.
- **Escala com coragem.** Contraste de tamanho (muito grande × muito pequeno) cria tensão. Tudo médio é morno.
- **Menos acessório.** Antes de fechar, tire um elemento (o conselho de Chanel). Microtexto só quando diz algo que a imagem não diz.
- **Textura física.** Retícula e grão de impressão real dão matéria. Ruído e distorção de filtro denunciam o digital.
- **Especificidade.** Um detalhe vivido e preciso (o copo americano, a cadeira de plástico com marca de sol, o "fiado só amanhã") vale mais que dez clichês (coqueiro, arara, bandeira).
- **Cada drop com sistemas diferentes.** O cliente compra várias peças. Se todas têm o mesmo esqueleto, a segunda já parece repetida.
- **Direito autoral e marca.** Só domínio público, material próprio ou licenciado. Use referência como método, nunca como cópia (`references/brasil.md` traz as regras).

## Imagem gerada por IA

Use apenas com autorização explícita, porque gasta créditos pagos:
- **Higgsfield:** saldo baixo.
- **Figma** (`generate_image`, `generate_vector_illustration`): créditos de IA do Figma. Imagem até 2048 px; o vetor é ótimo para DTF.
- **Canva** (`generate-image`): o prompt precisa ser escrito pelo próprio usuário.

Quando usar, dirija como um diretor de arte:
- descreva técnica, época, luz, enquadramento e fundo liso;
- não peça a tipografia na imagem;
- trate depois: recorte, cor puxada para a paleta e retícula, para não ficar com "cara de IA".

A YouDraw aceita a partir de 150 DPI, então 2048 px cobrem cerca de 34 cm.

## Ferramentas

Ficam em `design/tools/`; detalhes no README dessa pasta.

| Etapa | Ferramenta |
| --- | --- |
| Referências | `ref_zoom.py`, `compare.py` |
| Fontes de imagem | `wikimedia.py`, `cutout.py` |
| Tipografia | `specimen.js`, `type.js`, `flourish.js` |
| Arte final | `lib.js` (render), `halftone.py`, `min_stroke.py`, `qa.py` |
| Peça | `preview.js`, `mockups.json` |
| Produção | `produce.js`, `photos.py` |

## Onde ler mais

| Arquivo | Quando ler |
| --- | --- |
| `references/leitura-de-referencias.md` | Etapa 2: ficha de leitura e a pasta do Drop 001 analisada |
| `references/anti-generico.md` | Etapas 4 e 7: sinais de arte genérica ou de IA e o que fazer |
| `references/repertorio.md` | Etapa 3: movimentos de arte e design, códigos de streetwear e luxo, operadores de virada |
| `references/brasil.md` | Etapa 3: cultura visual brasileira, obras e textos em domínio público, cuidados legais |
| `references/tipografia.md` | Etapas 4 e 6: caligrafia, biblioteca de fontes, regras para DTF |
| `references/peca.md` | Etapas 1, 4 e 6: bases, cores, posições, tamanhos e regras de impressão |
| `references/tecnicas.md` | Etapa 6: receitas de execução (recorte, retícula, entrelaçamento, risografia, gravura) |
| `references/rubrica.md` | Etapa 7: critérios e formato da crítica |

## Como apresentar ao usuário

- **Uma folha por estampa:**
  - o conceito em uma frase;
  - a prévia no mockup, frente e costas;
  - um detalhe a 100%;
  - a nota do diretor de arte.
- **O que mudou em relação às referências, e por quê.**
- **Português claro, sem jargão.** Ao citar uma técnica ("retícula", "entrelaçamento"), explique em meia frase.
- **Aprovação antes de gastar.** Peça antes de criar produto na YouDraw ou gastar créditos de geração de imagem.
