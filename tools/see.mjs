#!/usr/bin/env node
// CLI: node tools/see.mjs <logo.svg> [mais.svg ...] [--zoom x,y,w,h] [--diff anterior.svg]
//   1 arquivo  → renders/<nome>/sheet.png (+ diff.png) e relatório no stdout
//   N arquivos → renders/compare.png lado a lado
//   --zoom     → renders/<nome>/zoom.png da região (unidades do viewBox)
//   --png N    → renders/<nome>/<nome>-N.png transparente (exportação final)
import { inspect, zoom, compare, exportPng } from './lib.mjs';

const args = process.argv.slice(2);
const files = [], opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--zoom') opts.zoom = args[++i].split(',').map(Number);
  else if (args[i] === '--diff') opts.diff = args[++i];
  else if (args[i] === '--png') opts.png = Number(args[++i]);
  else files.push(args[i]);
}

if (!files.length) {
  console.error('Uso: node tools/see.mjs <logo.svg> [outros.svg...] [--zoom x,y,w,h] [--diff anterior.svg] [--png 1024]');
  process.exit(1);
}

try {
  if (opts.png) {
    for (const f of files) console.log(`PNG: ${exportPng(f, opts.png)}`);
  } else if (opts.zoom) {
    if (opts.zoom.length !== 4 || opts.zoom.some((n) => !Number.isFinite(n))) throw new Error('--zoom espera x,y,w,h');
    console.log(`Zoom: ${zoom(files[0], opts.zoom)}`);
  } else if (files.length > 1) {
    console.log(`Comparação: ${compare(files)}`);
  } else {
    console.log(inspect(files[0], { diffWith: opts.diff }).report);
  }
} catch (e) {
  console.error(`ERRO ao renderizar: ${e.message}`);
  process.exit(2);
}
