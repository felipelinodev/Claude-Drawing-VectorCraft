---
name: logo-design
description: Cria logotipos no VectorCraft (via MCP), com inspeção visual em ciclos, e entrega a identidade visual completa (manual em HTML convertido em PDF, com versões do logo, ícone de app, monocromáticas, paleta e tipografia). Use sempre que pedirem logo, logotipo, marca, identidade visual, símbolo, mascote (eSports, games, clube, streamer), monograma, emblema, badge, selo, wordmark, lettering ou ícone de app.
---

# Design de logotipos no VectorCraft

Use esta skill sempre que pedirem um logo, logotipo, marca, símbolo, mascote de
equipe, monograma, emblema ou wordmark.

**O logo é desenhado dentro do VectorCraft, pelo MCP** — não se escreve SVG à
mão neste projeto. O documento `logos/<marca>.vectorcraft` é a fonte da verdade;
os `logos/*.svg` são **saída de build** (um por artboard, com o texto já em
curvas) e nunca devem ser editados à mão. **A entrega não é só o logo: é a
identidade visual completa**, montada num manual em HTML e convertida em PDF
(seção 8). Responda no idioma do usuário.

Se as ferramentas `mcp__vectorcraft__*` não estiverem disponíveis na sessão,
pare e diga ao usuário que o MCP do VectorCraft precisa estar conectado
(reabrir a sessão resolve); não volte a escrever SVG à mão como alternativa.

## 1. Fluxo de trabalho

1. **Briefing.** Nome, segmento, público, 2 ou 3 palavras de personalidade
   (ex.: "confiável, acolhedor, moderno"), cores desejadas ou proibidas, onde o
   logo vai aparecer (avatar, fachada, embalagem, camisa, app). Se faltar
   informação, escolha com bom senso e diga o que escolheu, sem travar o trabalho.
2. **Escolha do estilo.** Use a tabela da seção 3 e leia a seção do estilo.
3. **Conceito em texto antes de desenhar** (3 a 5 linhas): ideia central numa
   frase, estilo, paleta com hex, tipografia, composição. Se fizer sentido,
   desenhe 2 ou 3 conceitos em artboards vizinhos (`conceito-a`, `conceito-b`)
   e compare com `render_preview` de cada um antes de escolher.
4. **Monte o documento** (seção 5): artboards nomeados, swatches globais,
   depois o desenho.
5. **Renderize e olhe.** `render_preview` a cada bloco de trabalho, abrindo o
   PNG com Read. O hook cobra uma olhada se você fizer 10 alterações seguidas
   sem olhar. **Descreva o que você vê, não o que pretendia desenhar.**
6. **Refine em ciclos** (normalmente 3 a 6). Em cada ciclo, liste os problemas
   que viu e corrija só esses. `undo` desfaz o último passo se a tentativa piorou.
7. **Desenhe as versões do sistema**, cada uma no seu artboard **nomeado** (o
   nome vira o nome do arquivo no build):
   - `principal` → `logos/<marca>.svg` (vertical: símbolo acima do nome)
   - `horizontal` → símbolo à esquerda; as duas linhas de texto terminando
     alinhadas
   - `simbolo` → só o símbolo (`artboard.fitToArt` para o enquadramento justo)
   - `app` → 512×512 **quadrado**, fundo chapado de borda a borda, símbolo
     ≈ 55–60% da altura (a plataforma arredonda os cantos)
   - `negativo` → para fundo escuro
   - `mono` → **só se** o filtro de 1 cor apagar algum detalhe (ver 8)
8. **Feche o arquivo para produção:** `select.all` + `type.createOutlines` em
   todo texto, `object.path.outlineStroke` em todo traço, e salve o documento.
   Salvar dispara o build: os SVGs saem em `logos/` com o relatório de medidas.
9. **Monte o manual de identidade e gere o PDF** (seção 8).
10. **Entregue**: o PDF, `logos/<marca>.vectorcraft`, os SVGs, PNGs
    (`node tools/vc.mjs build logos/<marca>.vectorcraft --png 1024`) e um resumo
    de paleta e fontes.

## 2. Princípios de um bom logotipo (valem para todos os estilos)

- **Simplicidade.** Uma ideia, poucas formas. Se precisa explicar, está
  complicado. Corte tudo que não acrescenta significado.
- **Legibilidade e redução.** Tem que funcionar a 32px (favicon) e a 3 metros
  (fachada). Evite traços finos demais, detalhes minúsculos e textos pequenos
  dentro do símbolo.
- **Versatilidade.** Funciona em fundo claro e escuro, em uma cor só
  (monocromático) e em negativo. Não pode depender de degradê, sombra suave ou
  brilho para existir. Prefira formas chapadas.
- **Memorabilidade.** Uma silhueta própria, reconhecível depois de vista uma vez.
  Busque um detalhe inesperado (espaço negativo com segundo sentido, letra que
  vira objeto), mas evite clichês do setor (lâmpada para ideia, globo para
  "global", engrenagem para indústria) a menos que haja um giro novo.
- **Adequação.** Forma, cor e tipografia têm que combinar com a personalidade da
  marca e o público. Um escritório de advocacia e uma loja de doces não usam a
  mesma linguagem.
- **Atemporalidade.** Evite modismos fortes no símbolo principal.
- **Grid e geometria.** Construa sobre um grid (ex.: módulos de 8 ou 16 pt) com
  raios e espessuras repetidos. A consistência é o que faz parecer profissional.
  Use `object.align` e `object.distribute` em vez de acertar coordenada no olho.
- **Proporção.** Use proporções simples entre as partes (1:2, 2:3, razão áurea
  ≈ 1:1,618) para tamanho do símbolo × texto, raios e espaçamentos.
- **Espaço negativo.** O vazio também é forma; use-o para criar segundos
  sentidos ou para separar elementos com clareza. No VectorCraft ele se faz com
  pathfinder, não pintando de branco por cima.
- **Correções ópticas.** Círculos e pontas ultrapassam levemente a linha de base
  e a altura (overshoot de ~2–3%); centralize pelo peso visual, não pela caixa.
- **Cores com função.** 1 a 3 cores. Teste contraste (texto e fundo).
  Psicologia de cor como ponto de partida: azul confiança, verde natureza ou
  saúde, vermelho energia, laranja acessível e criativo, roxo premium,
  preto sofisticação.
- **Tipografia.** No máximo 2 famílias. Ajuste kerning à mão. Sans geométrica =
  moderno; serifada = tradição; slab = robusto; script = pessoal ou artesanal.
- **Área de proteção.** Defina um respiro mínimo em volta (ex.: altura de uma
  letra do nome) e não deixe nada colado na borda do artboard.
- **Originalidade.** Nunca copie, recrie ou "adapte de perto" logos existentes,
  marcas registradas ou imagens de referência. Referências servem só para
  entender um estilo.

## 3. Qual estilo usar

| Situação | Estilo |
|---|---|
| Equipe de games, clube, streamer, marca com mascote | 4.1 eSports / mascote |
| Startup, tech, marca moderna, app | 4.2 Minimalista / geométrico |
| Nome longo, marca pessoal, moda, luxo, escritório | 4.3 Monograma |
| Cervejaria, barbearia, café, clube, marca "tradicional" | 4.4 Emblema / badge |
| Nome curto e marcante, marca de produto, confeitaria | 4.5 Lettering / wordmark |
| Maioria dos negócios (precisa de símbolo e nome) | 4.6 Ícone + nome |
| Ícone de aplicativo | 4.7 Flat / ícone de app |

## 4. Estilos

### 4.1 eSports / logo mascote

Baseado no ebook "Design de Logo Mascote" (estudo de ~100 logos de designers de
mascote). Ideia central: **logo mascote é logo, não ilustração**. Precisa ser
simples, memorável e legível pequeno.

**Desenho (simplificação)**
- Simplifique ao máximo. O mascote tem que ser reconhecível só pela silhueta.
- **Incompletude da forma.** Em elementos repetidos e próximos (dentes, mechas,
  penas, escamas, pelos) não feche todos os contornos: deixe linhas internas
  abertas e interrompidas. O olho completa a forma. Vale também para qualquer
  linha interna (dobras, músculos).
- **Padronização de detalhes.** Detalhe que se repete (folhas, penas, chifres,
  dentes, chamas) tem o mesmo formato. Desenhe **um**, vire símbolo
  (`symbol.new`) e instancie, ou duplique com
  `object.transformEach {copy: true, moveH, moveV, rotate, scaleH, scaleV}`.
  Só diferencie o que precisa ser diferente.
- **Esqueça detalhezinhos.** Nada de rugas, pintas, poros, texturas, pelos
  individuais.
- **Atitude.** Sobrancelhas baixas e anguladas, olhar em 3/4, boca ou bico
  aberto, dentes à mostra para agressividade; olhos estreitos para foco.
- Não seja "desenhista carimbador": cada mascote precisa de algo próprio
  (acessório, cicatriz grande, capuz, arma, elemento da equipe).

**Traçado (contorno)**
- **Formato circular.** Curvas como se feitas com um grid de círculos: arcos
  amplos e contínuos, com poucos nós. Em `draw_path`, alças simétricas.
- **Terminações pontiagudas ou suaves, nunca bruscas.** Linhas internas como
  **formas preenchidas em lâmina** (grossas no meio, afinando nas pontas).
- **Espessura grossa.** Contorno externo com ~3–4% da largura do logo (artboard
  512 → 16–20 pt). Linhas internas com 50–70% disso.
- **Mais grosso nas áreas de sombra.** Quanto mais simples o logo, mais grosso
  o traço.
- Técnica do contorno "adesivo": una a silhueta inteira com
  `object.pathfinder.unite`, gere o contorno paralelo com
  `object.path.offsetPath {offset: 18, joins: "round"}`, pinte-o da cor do
  contorno e mande para trás. Depois as partes coloridas por cima.

**Sombras**
- **Sem brilhos.** A luz é a ausência de sombra: cor base = iluminado, só se
  acrescentam camadas mais escuras.
- Logo simples: **1 camada**. Logo detalhado: **no máximo 2 camadas**.
- Logo simples: sombra **forte** (alto contraste). Logo detalhado: sombras
  **fracas** (tons próximos).
- A sombra segue o formato circular do traçado: forma chapada com borda em arco,
  sem degradê, e **sem** `effect.apply` de drop shadow.
- Para a sombra não vazar da peça: desenhe a forma da sombra por cima, duplique
  a peça e use `object.pathfinder.intersect`, ou uma máscara de recorte
  (`object.clippingMask.make`). Uma única direção de luz em todo o logo.

**Cores**
- **2 a 3 cores distintas** (tons da mesma cor contam como uma). O contorno quase
  preto (ex.: `#121019`) não conta.
- **Combinação 1 (preferida):** cor principal + cor neutra.
  Ex.: vermelho `#E63946` + grafite `#2B2D35`.
- **Combinação 2:** 2 cores em harmonia (complementar, tríade, quadrado) + 1 neutra.
  Ex.: verde `#1FB57A` + laranja `#FF7A1A` + cinza `#2A2A30`.
- Cor principal saturada; neutras dessaturadas. Cada cor com 2–3 tons (base,
  sombra 1, sombra 2), a sombra puxando um pouco para frio/roxo.

**Composição típica**
- Mascote (cabeça ou busto) ocupando ~60–70% da altura, em 3/4.
- Escudo, círculo ou losango por trás, com o mascote **quebrando a borda**.
- Nome em caixa alta, fonte Black/Heavy, inclinada (cisalhamento de −8 a −12°),
  contorno grosso igual ao do mascote (feito com `offsetPath`, não com traço
  vivo), sobrepondo a base do mascote, opcionalmente com sombra dura deslocada.
- Subtítulo pequeno ("ESPORTS", "GAMING") em plaquinha, com tracking largo.
- Versões: completa, só mascote (avatar), monocromática.

**Erros comuns:** virar ilustração (detalhe, degradê, brilho), contorno fino,
pontas cortadas, mais de 3 cores, texto ilegível a 64px.

### 4.2 Minimalista / geométrico
- A ideia cabe numa frase ("uma folha que também é uma gota").
- Construído com primitivas (`shape.ellipse`, `shape.rectangle`, `shape.polygon`,
  `shape.arc`) sobre grid; raios e espessuras repetidos.
- 1–2 cores, sem contorno, sem sombra. Espaço negativo bem-vindo —
  `object.pathfinder.minusFront` é a ferramenta dele.
- Sans limpa (Inter, Montserrat, Helvetica), peso médio ou semibold, tracking
  levemente aberto.
- Tem que continuar reconhecível a 32px.

### 4.3 Monograma / lettermark
- 1 a 3 letras entrelaçadas ou fundidas. Comece do texto, converta com
  `type.createOutlines` e **edite os nós** — o monograma é construção, não fonte.
- Uma regra de construção para todas as letras: mesma haste, mesmos raios, mesmo
  módulo.
- Entrelaçamento de verdade: `object.pathfinder.divide` nas interseções e pinte
  os pedaços alternados; é isso que dá o efeito de uma letra passar por dentro
  da outra.
- Explore hastes compartilhadas, espaço negativo formando outra letra e contenção
  em círculo, quadrado ou hexágono.
- Overshoot nas letras redondas (~2–3%).

### 4.4 Emblema / badge
- Texto e ícone dentro de um contêiner (círculo, escudo, selo, brasão).
- Texto em arco: desenhe o círculo e use
  `text.createInPath {path: <id>, mode: "onPath"}`. Para o arco de baixo, um
  caminho no sentido anti-horário evita o texto de cabeça para baixo.
- Anel externo + anel fino interno (`object.path.offsetPath` com offset
  negativo), estrelas ou pontos como separadores, "EST. 2024".
- 2–3 cores, aspecto de patch ou carimbo; versão vintage com cores dessaturadas.
- Texto curvo precisa de tamanho generoso; tenha uma versão simplificada só com
  o ícone para tamanhos pequenos.

### 4.5 Lettering / wordmark
- O nome é o logo. Parta de uma fonte com personalidade, converta em curvas e
  **customize**: ligue letras, alongue uma terminação, troque o pingo do i por
  um ícone, corte uma haste.
- Script: contraste grosso e fino, linha de base levemente ascendente, um
  floreio sublinhando.
- Retrô: contorno (`offsetPath`) + sombra sólida deslocada, cores quentes.
- Kerning manual: `text.setRangeStyle` antes de converter, ou mova as letras já
  convertidas uma a uma.

### 4.6 Ícone + nome (combination mark)
- Ícone à esquerda ou acima; altura do ícone ≈ 1,5–2× a altura das maiúsculas.
- Alinhe pelo centro óptico (`object.align` resolve o geométrico; o óptico é
  você que julga na prévia).
- O ícone deve "conversar" com a tipografia: mesmas espessuras, mesmos raios,
  mesmo ângulo de corte.
- Entregue horizontal, vertical e só ícone.

### 4.7 Flat / ícone de app
- Formas chapadas, cantos arredondados consistentes
  (`shape.rectangle {radius}`), 2–4 cores.
- Opcional: sombra longa ou uma camada de sombra simples, sempre como forma.
- Artboard quadrado, fundo cobrindo de borda a borda; símbolo ocupando ~60%.
  Não arredonde os cantos do fundo: a plataforma faz isso.

## 5. Construção no VectorCraft

Tudo pelo MCP. `command_list` (ou `list_commands`) procura comandos pelo nome;
`command_run` executa um; `command_batch` executa vários como um passo de undo.

**Documento e artboards**
- Um documento por marca: `logos/<marca>.vectorcraft`.
- Um artboard **nomeado** por versão — o nome vira o arquivo no build:
  `principal` → `<marca>.svg`; qualquer outro nome → `<marca>-<nome>.svg`.
- `artboard.setProps {index: 0, name: "principal", x, y, width, height}` ajusta
  o primeiro; `artboard.new {x, y, width, height, name}` cria os outros (deixe
  ~50 pt de folga entre eles; não passe `side` junto com x/y/width/height).
- `artboard.fitToArt {index}` dá o enquadramento justo do símbolo.
- Trabalhe em pontos, num grid de 8 ou 16.

**Desenhar**
- Formas: `shape.rectangle {x, y, width, height, radius}`, `shape.ellipse`,
  `shape.polygon {cx, cy, radius, sides}`,
  `shape.star {cx, cy, radius1, radius2, points}`, `shape.line`, `shape.arc`.
- Curvas livres: a ferramenta `draw_path` (pontos com alças `in`/`out`, ou um
  `d` de SVG quando você já tem a curva na cabeça).
- **Pinte sempre explicitamente.** O documento tem traço preto por padrão e ele
  aparece no SVG exportado: `paint.setFill {color: "#E63946"}` e
  `paint.setStroke {none: true}` em tudo que não deve ter contorno.
- Posição e alinhamento são comando, não conta de cabeça:
  `object.align {horizontal: "center", vertical: "center", to: "artboard", artboard: N}`,
  `object.distribute`,
  `object.transformEach {moveH, moveV, rotate, scaleH, scaleV, reference: 4, copy}`.

**O que esta ferramenta dá e o SVG na mão não dava** (use de verdade)
- **Pathfinder.** `object.pathfinder.minusFront` (a de cima recorta a de baixo),
  `unite`, `intersect`, `exclude`, `divide`, `trim`, `merge`. Contraforma,
  espaço negativo, letra que vira objeto, monograma entrelaçado: tudo isso é
  pathfinder. **Nunca** desenhe "no olho" o resultado de um recorte.
- **Traço vira forma.** `object.path.outlineStroke` em todo traço antes de
  entregar. Traço vivo não escala junto, quebra em corte de vinil e em bordado,
  e engorda no favicon.
- **Contorno paralelo.** `object.path.offsetPath {offset, joins: "round"}` —
  o contorno de adesivo do estilo eSports, os anéis do emblema, o reforço de
  uma letra.
- **Texto real.** `text.create {x, y, text, size, font, style, color}`;
  `text.setRangeStyle` para kerning e tracking; `text.createInPath` para texto
  em arco ou em caixa. `text.missingFonts` diz na hora se a fonte existe
  mesmo — não há mais troca silenciosa de fonte. Antes de entregar:
  `select.all` + `type.createOutlines`.
- **Swatches globais.** `swatch.new {name, color, global: true}` e pinte com
  `paint.setFill {swatch: "Principal"}`. Trocar o swatch recolore o desenho
  inteiro — é assim que se gera negativo e mono sem refazer nada.
- **Símbolos.** `symbol.new` para o detalhe que se repete; corrigir o símbolo
  corrige todas as instâncias.
- **Efeitos.** `effect.apply {effect: "stylize.dropShadow", ...}` existe, mas no
  logo principal evite: sombra de logo é forma chapada. Se usar, expanda antes
  de entregar.

**Camadas**
- Agrupe por função com `object.group` e nomeie as camadas: o nome da camada
  vira o `id` no SVG exportado, o que deixa o arquivo legível.

## 6. Ver, medir e construir

Você não vê o desenho olhando o JSON dos comandos. Duas camadas:

**Durante o desenho (dentro do VectorCraft)**
- `render_preview` → PNG do artboard. Abra com Read e **descreva o que vê**.
  O hook do projeto cobra uma prévia se você fizer 10 alterações sem olhar.
- `doc_inspect` → artboards, árvore de camadas, seleção, bounds, opacidade.
  Serve para conferir estrutura, não aparência.
- `undo` / `redo` para voltar de uma tentativa ruim.

**Ao fechar uma versão (build)**
- Salve o documento (`save_file` em `logos/<marca>.vectorcraft`). O hook roda o
  build sozinho: exporta **cada artboard** para `logos/*.svg` com o texto em
  curvas e devolve, para cada um, o relatório de medidas — bbox, margens,
  descentralização, centro de massa, simetria H/V, cobertura, cores — mais
  `renders/<nome>/sheet.png` e `renders/compare.png`.
- **A `sheet.png` é a prova real:** grade numerada em unidades do viewBox,
  centro do canvas, bbox e centro de massa, fundo escuro, silhueta, mapa de
  simetria, cores sólidas e o logo renderizado em 16/32/48/64/128px. É ela que
  responde "funciona pequeno?".
- Manualmente:
  - `node tools/vc.mjs build logos/<marca>.vectorcraft [--png 1024]`
  - `node tools/vc.mjs preview logos/<marca>.vectorcraft --artboard N --size 1400`
  - `node tools/vc.mjs info logos/<marca>.vectorcraft`
- Detalhe fino num SVG já exportado:
  `node tools/see.mjs logos/<marca>.svg --zoom x,y,w,h` (junções, pontas,
  kerning) e `--diff` contra a versão anterior.

**Regra dura:** `logos/*.svg` é saída de build. Corrigir o SVG à mão se perde no
próximo build — a correção vai no documento, pelo MCP.

Avisos do relatório não são ordens: compensação óptica intencional pode
justificar descentralização, mas diga por que.

## 7. Checklist de revisão (a cada ciclo)

- [ ] A ideia é clara numa frase? Dá para descrever o logo de memória?
- [ ] Reconhecível a 64px e a 32px? A silhueta funciona sozinha?
- [ ] Funciona em fundo claro, escuro e em uma cor só?
- [ ] Quantas cores distintas? (1–3; eSports 2–3)
- [ ] Espessuras, raios e ângulos consistentes? Alinhado ao grid?
- [ ] Equilíbrio óptico, nada torto ou desalinhado sem intenção?
- [ ] Texto legível, com bom kerning, harmonizado com o símbolo?
- [ ] Nada vaza, nada cortado pelo artboard, respiro nas bordas?
- [ ] Todo traço virou forma (`outlineStroke`) e todo texto virou curva
      (`type.createOutlines`)?
- [ ] Nenhum contorno preto sobrando de descuido (`paint.setStroke {none:true}`)?
- [ ] Build limpo: todos os artboards exportaram, sem PROBLEMAS no relatório,
      simetria ≥ 99,5% quando é intencional, e cada aviso resolvido ou justificado?
- [ ] É original e não lembra demais nenhum logo conhecido?
- [ ] eSports: contorno grosso, pontas finas, curvas circulares, 1–2 camadas de
      sombra sem brilho, detalhes repetidos padronizados?

## 8. Manual de identidade visual (HTML → PDF)

Depois do logo aprovado, a entrega é um manual de marca em páginas A4 paisagem.
O manual consome os **SVGs exportados** — rode o build antes.

1. Copie `templates/brand-guide.html` para `brand/<marca>/index.html`.
2. Preencha **todo** `{{...}}`:
   - `:root`: cores da marca (`--primary`, `--secondary`, `--accent`, `--dark`,
     `--light`) e as fontes (`--font-display` = a fonte do logo; `--font-text`
     = a de apoio, no máximo 2 famílias no total).
   - Caminhos `../../logos/<marca>*.svg` — os nomes que o build gerou.
   - Conceito: a ideia em uma frase + 2–4 frases explicando forma, cor e fonte +
     3 palavras de personalidade (as do briefing).
   - Swatches: só `data-hex`, `data-name`, `data-use`. RGB, CMYK e contraste são
     calculados pelo script do template. Ajuste `--n` ao número de cores e a
     barra de proporção.
   - Aplicações: nome, cargo e contato fictícios mas plausíveis; slogan no tom
     da marca.
3. **Monocromáticas:** o template usa `.mono-black` / `.mono-white` (filtro CSS
   que pinta tudo de uma cor). Funciona quando os detalhes internos são
   recortes de verdade. Se um detalhe é **uma cor sobre outra** (letra pintada
   dentro do símbolo, miolo colorido), ele some no filtro: crie um artboard
   `mono` onde esse detalhe é recortado com `object.pathfinder.minusFront`, e
   aponte as imagens monocromáticas para `logos/<marca>-mono.svg`. Confira na
   prévia.
4. Apague páginas que não fazem sentido (ex.: app para uma marca sem presença
   digital) e renumere os cabeçalhos. Pode adicionar páginas (`<section
   class="page">` com `.head` e `.foot`), por exemplo uniforme, fachada,
   embalagem, padrão gráfico; use as classes do template.
5. **Gere o PDF.** Ao salvar `brand/<marca>/index.html` o hook roda sozinho;
   manualmente: `node tools/brand.mjs brand/<marca>/index.html`. Saídas:
   - `brand/<marca>/<marca>-identidade.pdf`
   - `renders/brand-<marca>/page-NN.png`: prévia de cada página
   - Checagem: página transbordando (fica com moldura vermelha), imagem que
     não carregou, fonte não instalada, `{{placeholder}}` esquecido e PDF com
     número de páginas diferente do HTML.
6. **Olhe cada prévia com Read** (não basta a checagem passar). Procure: logo
   pequeno ou perdido no quadro, elementos colados na borda ou no rodapé,
   mockups distorcidos, texto quebrando feio, ícone sumindo no fundo, versão
   monocromática perdendo detalhe, contraste ruim. Corrija e gere de novo.
   Se o problema for do template (vale para toda marca), corrija também em
   `templates/brand-guide.html`.
7. Na entrega, diga que o CMYK é conversão matemática (confirmar com a gráfica).
   O texto já vai em curvas nos SVGs exportados; o `.vectorcraft` mantém o texto
   vivo para edição futura. Para a gráfica, exporte também PDF ou EPS do
   documento (`document.exportPdf` / `document.exportEps`).
