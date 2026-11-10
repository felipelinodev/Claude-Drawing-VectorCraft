#!/usr/bin/env node
// Manual de identidade: HTML → PDF (+ PNG das páginas para inspeção) usando Edge/Chrome headless.
//   node tools/brand.mjs brand/<marca>/index.html
//   → brand/<marca>/<marca>-identidade.pdf
//   → renders/brand-<marca>/page-01.png ... (prévia de cada página para abrir com Read)
//   + relatório de qualidade (páginas transbordando, imagens quebradas, fontes ausentes, {{placeholders}})
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, RENDERS } from './lib.mjs';

const BROWSERS = [
  process.env.BRAND_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter((b) => b && fs.existsSync(b));

// A4 paisagem a 96 dpi
const PAGE_W = 1123, PAGE_H = 794;

function browser() {
  if (!BROWSERS.length) throw new Error('Nenhum Chrome/Edge encontrado. Defina BRAND_BROWSER com o caminho do executável.');
  return BROWSERS[0];
}

function run(args, { capture = false } = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-'));
  try {
    return execFileSync(browser(), [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=8000',
      `--user-data-dir=${profile}`, ...args,
    ], { encoding: 'utf8', stdio: ['ignore', capture ? 'pipe' : 'ignore', 'ignore'], timeout: 90000, maxBuffer: 64 << 20 });
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

export function buildBrand(htmlFile) {
  const html = path.resolve(htmlFile);
  if (!fs.existsSync(html)) throw new Error(`Arquivo não encontrado: ${htmlFile}`);
  const dir = path.dirname(html);
  const name = path.basename(dir);
  const url = pathToFileURL(html).href;
  const pdf = path.join(dir, `${name}-identidade.pdf`);
  const outDir = path.join(RENDERS, `brand-${name}`);
  fs.mkdirSync(outDir, { recursive: true });

  // 1) Checagem de qualidade: o script do template grava o resultado em <body data-qa>.
  const dom = run(['--dump-dom', url], { capture: true });
  const m = dom.match(/data-qa="([^"]*)"/);
  let qa = { pages: 0, issues: ['Não foi possível ler a checagem (o <script> do template foi removido?)'] };
  if (m) qa = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));

  // 2) PDF
  if (fs.existsSync(pdf)) fs.rmSync(pdf);
  run(['--no-pdf-header-footer', '--print-to-pdf-no-header', `--print-to-pdf=${pdf}`, url]);
  if (!fs.existsSync(pdf)) throw new Error('O navegador não gerou o PDF (feche abas de impressão travadas e tente de novo).');
  const pdfPages = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (qa.pages && pdfPages !== qa.pages) qa.issues.push(`PDF tem ${pdfPages} páginas, HTML tem ${qa.pages} seções .page (algo quebrou de página)`);

  // 3) Prévia: um PNG por página (screenshot da página isolada via #fragmento não existe → recorte por janela).
  for (const f of fs.readdirSync(outDir)) if (/^page-\d+\.png$/.test(f)) fs.rmSync(path.join(outDir, f));
  const pages = [];
  const tmpHtml = path.join(dir, '.preview.html');
  const src = fs.readFileSync(html, 'utf8');
  try {
    for (let i = 0; i < qa.pages; i++) {
      // Mostra só a página i; o resto fica display:none. Mantém caminhos relativos (arquivo na mesma pasta).
      const css = `<style>@media screen{html,body{background:#fff!important}.page{margin:0!important;box-shadow:none!important}.page:not(:nth-of-type(${i + 1})){display:none!important}}</style>`;
      fs.writeFileSync(tmpHtml, src.replace(/<\/head>/i, `${css}</head>`));
      const png = path.join(outDir, `page-${String(i + 1).padStart(2, '0')}.png`);
      run([`--window-size=${PAGE_W},${PAGE_H}`, `--screenshot=${png}`, pathToFileURL(tmpHtml).href]);
      if (fs.existsSync(png)) pages.push(png);
    }
  } finally {
    fs.rmSync(tmpHtml, { force: true });
  }

  const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
  const lines = [
    `Manual: ${rel(html)}`,
    `PDF: ${rel(pdf)} (${pdfPages} páginas, ${(fs.statSync(pdf).size / 1024).toFixed(0)} KB)`,
    `Prévias: ${rel(outDir)}/page-01.png … page-${String(pages.length).padStart(2, '0')}.png`,
    qa.issues.length ? `PROBLEMAS (${qa.issues.length}):\n  ✗ ${qa.issues.join('\n  ✗ ')}` : 'Checagem: ✓ sem transbordo, imagens ok, fontes ok, sem placeholders',
  ];
  return { report: lines.join('\n'), pdf, pages, issues: qa.issues };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node tools/brand.mjs brand/<marca>/index.html'); process.exit(1); }
  try { console.log(buildBrand(file).report); } catch (e) { console.error(`ERRO: ${e.message}`); process.exit(2); }
}
