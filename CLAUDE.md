# Claude Drawing (VectorCraft) — identidade visual com visão

Este projeto cria identidades visuais com qualidade profissional: o logo é desenhado **dentro do
VectorCraft, pelo MCP**, e a partir dele sai um **manual de identidade em HTML convertido em PDF**
(versões horizontal e vertical, símbolo, ícone de app, monocromáticas e negativa, área de proteção,
paleta, tipografia, usos incorretos e aplicações).

- **Nada de SVG escrito à mão.** `logos/<marca>.vectorcraft` é a fonte da verdade. Os
  `logos/*.svg` são **saída de build** — um por artboard, com o texto já em curvas. Editar um
  desses SVGs à mão se perde no próximo build; a correção vai no documento, pelo MCP.
- **Regras de design, fluxo, comandos e checklist:** skill `logo-design`
  (`.claude/skills/logo-design/SKILL.md`). Use-a para qualquer pedido de logo.
- **Visão:** você não vê o desenho lendo o JSON dos comandos. Use `render_preview` do MCP durante o
  desenho e abra o PNG com Read. O hook cobra uma prévia se você fizer 10 alterações sem olhar.
- **Build:** salvar o `.vectorcraft` dispara o hook, que exporta cada artboard para `logos/*.svg` e
  roda a análise (`tools/lib.mjs`): bbox, margens, centralização, centro de massa, simetria,
  cobertura, cores, mais a `sheet.png` com o logo em 16/32/48/64/128px.
- **Manual → PDF:** `tools/brand.mjs` converte `brand/<marca>/index.html` (copiado de
  `templates/brand-guide.html`) em PDF com Chrome/Edge headless, gera prévias PNG de cada página e
  checa transbordo, imagens, fontes e placeholders. O hook faz isso sozinho ao salvar o HTML.

**Nunca dê um logo ou um manual como pronto sem ter aberto as renderizações com Read e avaliado o
que viu.**

## Estrutura

- `logos/` — `<marca>.vectorcraft` (fonte) e os SVGs exportados: `<marca>.svg`,
  `-horizontal`, `-simbolo`, `-app`, `-negativo` e, se preciso, `-mono`. O nome do artboard
  define o nome do arquivo (`principal` → `<marca>.svg`).
- `brand/<marca>/` — `index.html` do manual e o PDF gerado (`<marca>-identidade.pdf`).
- `templates/brand-guide.html` — template do manual.
- `renders/` — saídas das ferramentas (descartáveis, regeneradas a qualquer momento).
- `tools/vc.mjs` — ponte com o VectorCraft (`info`, `build`, `preview`, `steps`);
  `tools/lib.mjs` — renderização (resvg) e análise dos SVGs exportados;
  `tools/see.mjs` — CLI de zoom/diff/PNG sobre um SVG; `tools/brand.mjs` — manual HTML → PDF;
  `tools/hook.mjs` — hook (MCP do VectorCraft, SVG e manual).

## Ferramentas de linha de comando

```
node tools/vc.mjs build   logos/<marca>.vectorcraft [--png 1024]   # artboards → SVGs + relatório
node tools/vc.mjs preview logos/<marca>.vectorcraft --artboard N   # PNG direto do documento
node tools/vc.mjs info    logos/<marca>.vectorcraft                # artboards, fontes, objetos
node tools/see.mjs logos/<marca>.svg --zoom x,y,w,h                # detalhe de um SVG exportado
node tools/brand.mjs brand/<marca>/index.html                      # manual → PDF + prévias
```

## Requisitos e limitações conhecidas

- **VectorCraft instalado.** O MCP e as ferramentas usam `vectorcraft-cli`. O caminho padrão é
  `C:\Program Files\VectorCraft\vectorcraft-cli.exe`; em outro lugar, defina `VECTORCRAFT_CLI`
  (vale para `tools/vc.mjs` e para o `.mcp.json`).
- Se as ferramentas `mcp__vectorcraft__*` não aparecerem na sessão, o servidor não subiu: reabra a
  sessão. Não caia de volta para escrever SVG à mão.
- O MCP conecta no app aberto (`vectorcraft --control 7979`) e, se não houver, roda headless. Com o
  app aberto o usuário acompanha o desenho na tela.
- O renderizador de análise (resvg) é usado só nos SVGs exportados. Como o build exporta o texto em
  curvas, as antigas armadilhas de fonte (fonte variável saindo no peso errado, nome de fonte
  inexistente trocado em silêncio) não valem mais; quem avisa sobre fonte ausente agora é o próprio
  VectorCraft (`text.missingFonts`).
- O PDF do manual precisa de Chrome ou Edge instalado (defina `BRAND_BROWSER` se estiver em outro
  caminho).
- Os SVGs de `logos/` que já estavam aqui vieram do fluxo antigo (escritos à mão) e não têm
  documento `.vectorcraft` correspondente. Para mexer neles, importe primeiro:

  ```
  vectorcraft-cli convert logos/<marca>.svg logos/<marca>.vectorcraft
  ```

  (ou `open_file` + `save_file` pelo MCP), depois nomeie os artboards e só então edite. O import
  traz objetos, cores e texto; confira na prévia antes de confiar.
