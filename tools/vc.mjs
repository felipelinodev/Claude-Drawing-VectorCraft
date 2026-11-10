#!/usr/bin/env node
// Ponte com o VectorCraft. O documento .vectorcraft é a FONTE DA VERDADE do logo;
// os SVGs em logos/ são saída de build (um por artboard), com texto em curvas.
//
//   node tools/vc.mjs info    logos/<marca>.vectorcraft
//   node tools/vc.mjs build   logos/<marca>.vectorcraft [--png 1024]
//   node tools/vc.mjs preview logos/<marca>.vectorcraft [--artboard N] [--size 1400]
//   node tools/vc.mjs steps   logos/<marca>.vectorcraft passos.json   (batch headless, salva no lugar)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, RENDERS, inspect, compare, exportPng } from './lib.mjs';

const CLIS = [
  process.env.VECTORCRAFT_CLI,
  'C:/Program Files/VectorCraft/vectorcraft-cli.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Programs/ArtCraft/VectorCraft/vectorcraft-cli.exe'),
  '/Applications/VectorCraft.app/Contents/MacOS/vectorcraft-cli',
  '/usr/bin/vectorcraft-cli', '/usr/local/bin/vectorcraft-cli',
].filter((p) => p && fs.existsSync(p));

export function cli() {
  if (!CLIS.length) throw new Error('vectorcraft-cli não encontrado. Defina VECTORCRAFT_CLI com o caminho do executável.');
  return CLIS[0];
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const abs = (p) => path.resolve(p).replace(/\\/g, '/');

function exec(args, { input } = {}) {
  try {
    return execFileSync(cli(), args, {
      encoding: 'utf8', input, timeout: 300000, maxBuffer: 256 << 20,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e) {
    const err = String(e.stderr || '').trim() || e.message;
    throw new Error(err.split('\n').slice(-4).join('\n'));
  }
}

const jsonLines = (out) => out.trim().split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return { raw: l }; } });

// ---------- leitura ----------

export function docInfo(doc) {
  const data = JSON.parse(exec(['info', abs(doc)]));
  return {
    artboards: (data.artboards || []).map((a, i) => ({
      index: i, name: a.name || '',
      x: a.rect?.[0] ?? 0, y: a.rect?.[1] ?? 0, w: a.rect?.[2] ?? 0, h: a.rect?.[3] ?? 0,
    })),
    fonts: (data.fonts || []).map((f) => (typeof f === 'string' ? { family: f, style: '', missing: false, status: 'exact', missingGlyphs: 0 } : {
      family: f.family || '?', style: f.style || '', missing: !!f.missing,
      status: f.status || 'exact', missingGlyphs: f.missingGlyphs || 0,
      resolved: f.resolved ? [f.resolved.family, f.resolved.style].filter(Boolean).join(' ') : '',
    })),
    objects: data.info?.objects ?? 0,
    colorMode: data.info?.colorMode ?? '?',
    units: data.info?.units ?? '?',
    importWarnings: data.importWarnings || data.warnings || [],
  };
}

// ---------- batch headless ----------

// steps: [{command, params}] — roda sobre o documento e salva no próprio arquivo.
export function runSteps(doc, steps, { save = true } = {}) {
  const list = [...steps];
  if (save) list.push({ command: 'document.save', params: { path: abs(doc), format: 'vectorcraft' } });
  return jsonLines(exec(['run', '--in', abs(doc), '--commands', '-'], { input: JSON.stringify(list) }));
}

// ---------- build: artboards → logos/*.svg ----------

const SVG_OPTS = {
  outlineText: true, decimals: 2, styling: 'presentation',
  objectIds: 'layerNames', responsive: false, hiddenLayers: false, minify: false,
};

const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const MAIN = new Set(['principal', 'main', 'primary', 'vertical', 'logo']);

// Decide o arquivo de cada artboard: `principal` -> <marca>.svg, resto -> <marca>-<nome>.svg
export function plan(doc, info) {
  const base = path.basename(doc).replace(/\.(vectorcraft|drawcraft|ai)$/i, '');
  const dir = path.dirname(path.resolve(doc));
  const used = new Set();
  const out = [];
  for (const a of info.artboards) {
    const s = slug(a.name);
    let name = !s ? (a.index === 0 ? base : base + '-artboard' + (a.index + 1))
      : MAIN.has(s) ? base : base + '-' + s;
    while (used.has(name)) name = name + '-' + (a.index + 1);
    used.add(name);
    out.push({ ...a, slug: s, file: path.join(dir, name + '.svg') });
  }
  return out;
}

export function buildLogos(doc, { png = 0 } = {}) {
  const file = path.resolve(doc);
  if (!fs.existsSync(file)) throw new Error('Documento não encontrado: ' + doc);
  const info = docInfo(file);
  if (!info.artboards.length) throw new Error('O documento não tem artboards.');
  const targets = plan(file, info);

  const steps = targets.map((t) => ({
    command: 'document.export',
    params: { path: abs(t.file), format: 'svg', artboard: t.index, includeArtboardFill: false, svg: SVG_OPTS },
  }));
  const results = jsonLines(exec(['run', '--in', abs(file), '--commands', '-'], { input: JSON.stringify(steps) }))
    .filter((r) => r.command === 'document.export');

  const issues = info.importWarnings.map((w) => 'leitura do documento: ' + w);
  for (const r of results) for (const w of r.result?.warnings || []) issues.push('export: ' + w);
  for (const f of info.fonts) {
    const label = (f.family + ' ' + f.style).trim();
    if (f.missing || f.status !== 'exact') {
      issues.push('fonte ' + label + ' ✗ — ' + (f.missing ? 'não está instalada' : 'status "' + f.status + '"') +
        (f.resolved ? ', o VectorCraft está usando ' + f.resolved : '') + '; troque a fonte ou instale-a antes de continuar');
    }
    if (f.missingGlyphs) issues.push('fonte ' + label + ': ' + f.missingGlyphs + ' glifo(s) que ela não tem');
  }
  if (info.fonts.length) {
    const ok = info.fonts.map((f) => (f.family + ' ' + f.style).trim() + (f.missing || f.status !== 'exact' ? ' ✗' : ' ✓')).join(', ');
    issues.push('o documento ainda tem texto vivo (' + ok + ') — rode select.all + type.createOutlines ' +
      'antes de entregar (o SVG exportado já sai em curvas, o .vectorcraft não)');
  }

  const lines = ['Documento: ' + rel(file) + ' — ' + info.artboards.length + ' artboard(s), ' +
    info.objects + ' objeto(s), ' + String(info.colorMode).toUpperCase() + ', ' + info.units];
  const built = [];
  for (const t of targets) {
    const label = t.name || '(sem nome)';
    if (!fs.existsSync(t.file)) { issues.push('artboard ' + (t.index + 1) + ' "' + label + '" não exportou'); continue; }
    built.push(t.file);
    if (t.slug === 'app' && Math.abs(t.w - t.h) >= 0.5) {
      issues.push('o artboard "app" tem ' + t.w + '×' + t.h + ' — ícone de app precisa ser quadrado');
    }
    if (!t.name) {
      issues.push('artboard ' + (t.index + 1) + ' sem nome — nomeie (principal, horizontal, simbolo, app, negativo, mono) para o build nomear o arquivo');
    }
    lines.push('\n── artboard ' + (t.index + 1) + ' "' + label + '" (' + t.w + '×' + t.h + ') → ' + rel(t.file));
    try {
      lines.push(inspect(t.file).report);
    } catch (e) {
      issues.push(rel(t.file) + ': falha ao inspecionar (' + e.message + ')');
    }
    if (png) { try { lines.push('PNG: ' + exportPng(t.file, png)); } catch { /* opcional */ } }
  }

  if (built.length > 1) {
    try { lines.push('\nComparação lado a lado: ' + compare(built)); } catch { /* opcional */ }
  }
  lines.push(issues.length
    ? '\nPROBLEMAS (' + issues.length + '):\n  ✗ ' + issues.join('\n  ✗ ')
    : '\nBuild: ✓ todos os artboards exportados, sem avisos do VectorCraft');

  return { report: lines.join('\n'), files: built, issues, info, targets };
}

// ---------- prévia direta do documento ----------

export function preview(doc, { artboard = 0, size = 1400 } = {}) {
  const file = path.resolve(doc);
  const info = docInfo(file);
  const a = info.artboards[artboard];
  if (!a) throw new Error('O documento tem ' + info.artboards.length + ' artboard(s); ' + artboard + ' não existe.');
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  const dir = path.join(RENDERS, 'vc-' + base);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'preview-' + (artboard + 1) + '-' + (slug(a.name) || 'artboard') + '.png');
  const scale = Math.max(0.1, size / Math.max(a.w, a.h, 1));
  exec(['convert', abs(file), abs(out), '--artboard', String(artboard), '--scale', scale.toFixed(4)]);
  return out;
}

// Build desatualizado? (documento mais novo que os SVGs exportados)
export function isStale(doc) {
  const file = path.resolve(doc);
  if (!fs.existsSync(file)) return false;
  const mt = fs.statSync(file).mtimeMs;
  let info;
  try { info = docInfo(file); } catch { return true; }
  return plan(file, info).some((t) => !fs.existsSync(t.file) || fs.statSync(t.file).mtimeMs < mt - 1000);
}

// ---------- CLI ----------

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [cmd, doc, ...rest] = process.argv.slice(2);
  const flag = (n, d) => { const i = rest.indexOf(n); return i < 0 ? d : rest[i + 1]; };
  const usage = 'Uso: node tools/vc.mjs info|build|preview|steps logos/<marca>.vectorcraft [...]';
  try {
    if (!cmd || !doc) { console.error(usage); process.exit(1); }
    if (cmd === 'info') console.log(JSON.stringify(docInfo(doc), null, 2));
    else if (cmd === 'build') console.log(buildLogos(doc, { png: Number(flag('--png', 0)) || 0 }).report);
    else if (cmd === 'preview') console.log('Prévia: ' + preview(doc, { artboard: Number(flag('--artboard', 0)), size: Number(flag('--size', 1400)) }));
    else if (cmd === 'steps') {
      const f = rest.find((r) => !r.startsWith('--'));
      if (!f) throw new Error('steps precisa de um arquivo JSON com [{command, params}]');
      for (const r of runSteps(doc, JSON.parse(fs.readFileSync(f, 'utf8')))) console.log(JSON.stringify(r));
    } else { console.error(usage); process.exit(1); }
  } catch (e) {
    console.error('ERRO: ' + e.message);
    process.exit(2);
  }
}
