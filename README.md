# Claude Drawing

![Claude Drawing — Banner promocional](./Banner%20promocional%20do%20Claude%20Drawing.png)

**Criação de logotipos e identidades visuais profissionais utilizando Claude Code + VectorCraft MCP.**

O Claude Drawing é um projeto que nasceu da união entre duas áreas pelas quais sempre tive interesse: design e desenvolvimento de software.

Com experiência em design gráfico e cada vez mais envolvido com programação e automação, comecei a explorar uma possibilidade: e se o Claude Code pudesse desenvolver logotipos profissionais utilizando ferramentas reais de desenho vetorial, seguindo princípios de design e entregando não apenas um símbolo, mas uma identidade visual completa?

Foi assim que surgiu o **Claude Drawing**.

A proposta é transformar o Claude Code em um verdadeiro processo de criação de marcas, no qual a inteligência artificial não apenas gera uma imagem, mas constrói logotipos vetoriais editáveis e entrega todo o sistema de identidade visual.

## Como funciona?

O projeto é estruturado em cinco componentes que trabalham em conjunto:

### 1. VectorCraft MCP

O [VectorCraft](https://vectorcraft.app/) é o motor de desenho vetorial utilizado pelo projeto.

Por meio da conexão MCP, o Claude Code consegue interagir diretamente com as ferramentas de desenho do VectorCraft, criando e manipulando formas, curvas, textos, cores, artboards e operações vetoriais.

Isso permite que o modelo construa logotipos em um ambiente de desenho real, em vez de simplesmente produzir uma imagem rasterizada.

### 2. Tools — automação e controle

O projeto possui ferramentas próprias em Node.js para automatizar o fluxo de criação e garantir consistência durante o processo.

**`tools/vc.mjs`**

Responsável pela comunicação com o VectorCraft e pelas operações de build, preview e inspeção dos documentos.

Entre suas responsabilidades:
- Exportar os artboards do documento para SVG.
- Gerar relatórios de análise dos logotipos.
- Renderizar prévias para inspeção visual.
- Analisar proporções, margens, centralização, simetria, cores e outros aspectos geométricos.

**`tools/hook.mjs`**

Responsável por acompanhar as alterações realizadas durante a criação.

- Contabiliza as alterações feitas por meio das chamadas MCP.
- Após 10 alterações sem uma inspeção visual, injeta uma orientação no contexto para que o modelo visualize o resultado.
- Detecta o salvamento do documento e dispara automaticamente o processo de build.
- Automatiza a exportação e a análise dos arquivos gerados.

A ideia é evitar que o modelo trabalhe apenas com coordenadas e comandos sem verificar visualmente aquilo que está construindo.

### 3. Skill — conhecimento de design

A skill `logo-design` concentra o conhecimento necessário para orientar o processo criativo.

Ela funciona como uma metodologia de design incorporada ao Claude Code, contendo:

- Princípios de construção de logotipos.
- Diretrizes de composição, proporção e geometria.
- Psicologia e aplicação de cores.
- Tipografia e ajustes de kerning.
- Técnicas de desenho vetorial.
- Diferentes estilos de identidade visual.
- Checklist de qualidade e revisão.
- Processo de construção do manual de identidade visual.

Assim, o modelo não recebe apenas ferramentas para desenhar: ele também recebe instruções sobre como pensar e executar um projeto de identidade visual.

### 4. CLAUDE.md — contexto do projeto

O arquivo `CLAUDE.md` funciona como a documentação central do projeto.

Ele apresenta ao Claude Code:
- A visão geral e os objetivos do projeto.
- A organização das pastas.
- O funcionamento das ferramentas.
- Os requisitos e dependências.
- As regras de utilização do VectorCraft.
- Os fluxos de exportação e geração da identidade visual.

Isso permite manter um contexto consistente durante as sessões de desenvolvimento.

### 5. Sistema de identidade visual

A última etapa transforma o logotipo em um sistema de identidade visual completo.

A partir do documento vetorial, o projeto gera diferentes versões da marca:

- Logotipo principal.
- Versão horizontal.
- Símbolo isolado.
- Ícone de aplicativo.
- Versão negativa para fundos escuros.
- Versão monocromática, quando necessária.

Além disso, é gerado um manual de identidade visual em HTML, convertido automaticamente para PDF.

O manual apresenta:

- Conceito e personalidade da marca.
- Construção e composição do logotipo.
- Paleta cromática.
- Tipografia principal e secundária.
- Área de proteção.
- Versões e aplicações da marca.
- Usos incorretos.
- Simulações de aplicação da identidade visual.

O resultado é uma entrega muito mais próxima de um projeto desenvolvido por um estúdio de branding.

## Por que não simplesmente gerar uma imagem com ChatGPT?

Ferramentas de geração de imagens, como o GPT Image, são excelentes para explorar conceitos visuais e produzir imagens impressionantes.

Mas existe uma diferença importante entre gerar uma imagem de um logotipo e construir um logotipo vetorial de verdade.

Uma imagem rasterizada não oferece a mesma flexibilidade de edição e aplicação de um arquivo vetorial.

Imagine precisar aumentar um logotipo para utilizar em um website, aplicar a marca em uma fachada ou preparar um arquivo para impressão.

Com uma imagem rasterizada, podem surgir problemas de resolução, serrilhamento e limitações de edição.

No Claude Drawing, o logotipo é construído diretamente em um ambiente vetorial e exportado em SVG, com os textos convertidos em curvas.

Isso significa que o resultado pode ser escalado sem perda de qualidade, integrado diretamente a aplicações e sistemas e trabalhado posteriormente em ferramentas de design.

**A proposta não é apenas gerar uma imagem bonita. É entregar um ativo de marca utilizável em situações reais.**

## Arquitetura do projeto

```text
claude-drawing/
│
├── logos/
│   ├── marca.vectorcraft
│   ├── marca.svg
│   ├── marca-horizontal.svg
│   ├── marca-simbolo.svg
│   └── marca-app.svg
│
├── brand/
│   └── marca/
│       ├── index.html
│       └── marca-identidade.pdf
│
├── templates/
│   └── brand-guide.html
│
├── renders/
│
├── tools/
│   ├── vc.mjs
│   ├── lib.mjs
│   ├── see.mjs
│   ├── brand.mjs
│   └── hook.mjs
│
├── .claude/
│   └── skills/
│       └── logo-design/
│           └── SKILL.md
│
├── CLAUDE.md
└── README.md
```

**Um detalhe importante:** o arquivo `.vectorcraft` é a fonte da verdade do projeto. Os SVGs são arquivos gerados pelo processo de build e não devem ser editados manualmente, pois as alterações seriam perdidas na próxima exportação.

## Executando as ferramentas

O projeto disponibiliza alguns comandos para trabalhar com os documentos vetoriais e os manuais de identidade.

```bash
# Exportar os artboards para SVG e gerar relatórios
node tools/vc.mjs build logos/<marca>.vectorcraft --png 1024

# Gerar uma prévia do documento
node tools/vc.mjs preview logos/<marca>.vectorcraft --artboard 0

# Inspecionar um documento
node tools/vc.mjs info logos/<marca>.vectorcraft

# Inspecionar uma região específica de um SVG
node tools/see.mjs logos/<marca>.svg --zoom x,y,w,h

# Gerar o manual de identidade visual em PDF
node tools/brand.mjs brand/<marca>/index.html
```

## Requisitos

- Node.js instalado.
- VectorCraft instalado.
- VectorCraft CLI disponível no sistema.
- MCP do VectorCraft configurado no Claude Code.
- Google Chrome ou Microsoft Edge para geração dos PDFs.

O caminho padrão do executável é:

```text
C:\Program Files\VectorCraft\vectorcraft-cli.exe
```

Caso esteja instalado em outro diretório, configure a variável de ambiente `VECTORCRAFT_CLI`.

## Considerações finais

O Claude Drawing é uma exploração de como podemos ir além de utilizar inteligência artificial apenas para gerar código ou imagens.

Quando combinamos modelos de linguagem, ferramentas especializadas, automações, contexto estruturado e conhecimento de domínio, conseguimos construir fluxos de trabalho muito mais interessantes.

Esse projeto representa justamente essa ideia: unir a capacidade de raciocínio do Claude Code com ferramentas profissionais de design para transformar um processo criativo em um fluxo automatizado, visualmente verificável e com entregáveis reais.

**Acredito que esse tipo de abordagem tem muito potencial e espero que o Claude Drawing possa contribuir com a comunidade.**

Se você gostou da ideia, deixe uma ⭐ no repositório!