// Core of the logo vision tool: renders SVGs to PNG inspection sheets + numeric metrics
// so Claude Code can "see" (via the Read tool) and measure exactly what it drew.
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RENDERS = path.join(ROOT, 'renders');

const UI_FONTS = [
  'C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arial.ttf',
  '/System/Library/Fonts/Helvetica.ttc', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
].filter((f) => fs.existsSync(f));
const UI_FAMILY = 'Segoe UI, Arial, Helvetica, DejaVu Sans, sans-serif';
const DARK = '#16181d';

// ---------- SVG parsing ----------

function rootTag(svg) {
  const m = svg.match(/<svg\b[^>]*>/i);
  if (!m) throw new Error('Nenhuma tag <svg> encontrada no arquivo.');
  return m[0];
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`));
  return m ? (m[2] ?? m[3]) : null;
}

export function parseViewBox(svg) {
  const tag = rootTag(svg);
  const vb = attr(tag, 'viewBox');
  if (vb) {
    const n = vb.trim().split(/[\s,]+/).map(Number);
    if (n.length === 4 && n.every(Number.isFinite) && n[2] > 0 && n[3] > 0) return { x: n[0], y: n[1], w: n[2], h: n[3] };
  }
  const w = parseFloat(attr(tag, 'width')), h = parseFloat(attr(tag, 'height'));
  if (w > 0 && h > 0) return { x: 0, y: 0, w, h };
  throw new Error('O <svg> raiz precisa de viewBox (ou width/height).');
}

// Rewrites the root tag so only the given viewBox defines geometry; render size comes from fitTo.
export function withViewBox(svg, vb) {
  const tag = rootTag(svg);
  let t = tag.replace(/\s(width|height|viewBox)\s*=\s*("[^"]*"|'[^']*')/g, '');
  t = t.replace(/^<svg\b/i, `<svg viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"`);
  if (!/\sxmlns\s*=/.test(t)) t = t.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return svg.replace(tag, () => t);
}

// ---------- rendering ----------

function render(svg, { width, height, bg, ui = false, original = false } = {}) {
  const usesText = /<text\b|font-family/i.test(svg);
  const opts = {
    fitTo: original ? { mode: 'original' } : width ? { mode: 'width', value: Math.round(width) } : { mode: 'height', value: Math.round(height) },
    font: ui || !usesText
      ? { loadSystemFonts: UI_FONTS.length === 0, fontFiles: UI_FONTS, defaultFontFamily: 'Segoe UI' }
      : { loadSystemFonts: true, defaultFontFamily: 'Arial' },
  };
  if (bg) opts.background = bg;
  const r = new Resvg(svg, opts).render();
  return { w: r.width, h: r.height, pixels: r.pixels, png: r.asPng() };
}

// Renders the logo so it fits inside a size×size box.
function renderFit(svg, vb, size, bg) {
  return vb.w >= vb.h ? render(svg, { width: size, bg }) : render(svg, { height: size, bg });
}

function encodePng(w, h, data) {
  const png = new PNG({ width: w, height: h });
  png.data = Buffer.from(data);
  return PNG.sync.write(png);
}

function upscale(img, f) {
  const W = img.w * f, H = img.h * f, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = ((Math.floor(y / f) * img.w) + Math.floor(x / f)) * 4, d = (y * W + x) * 4;
    out[d] = img.pixels[s]; out[d + 1] = img.pixels[s + 1]; out[d + 2] = img.pixels[s + 2]; out[d + 3] = img.pixels[s + 3];
  }
  return { w: W, h: H, png: encodePng(W, H, out) };
}

const uri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => String(+n.toFixed(2));
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const signedPct = (n) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;

// ---------- font check ----------

const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);
const WEIGHTS = { normal: 400, bold: 700, lighter: 300, bolder: 700 };

function probeWidth(family, weight, fallback) {
  const t = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 100"><text x="0" y="80" font-family="${family}" font-weight="${weight}" font-size="60">Hamburgefonstiv 0123</text></svg>`;
  const b = new Resvg(t, { font: { loadSystemFonts: true, defaultFontFamily: fallback } }).getBBox();
  return b ? Math.round(b.width * 10) : -1;
}

// Detects fonts the renderer silently replaced and weights it could not apply (e.g. variable fonts).
export function checkFonts(svg) {
  const families = new Set(), weights = new Set([400]);
  for (const m of svg.matchAll(/font-family\s*[:=]\s*("([^"]*)"|'([^']*)'|([^;"'>]+))/g))
    for (const f of (m[2] ?? m[3] ?? m[4]).split(',')) {
      const name = f.trim().replace(/^['"]|['"]$/g, '').replace(/&quot;|&apos;/g, '');
      if (name && !GENERIC.has(name.toLowerCase())) families.add(name);
    }
  for (const m of svg.matchAll(/font-weight\s*[:=]\s*["']?([a-z0-9]+)/gi))
    weights.add(WEIGHTS[m[1].toLowerCase()] ?? Number(m[1]));
  const lines = [], warnings = [];
  for (const f of families) {
    const base = probeWidth(f, 400, 'Times New Roman');
    if (base !== probeWidth(f, 400, 'Courier New')) {
      const hint = f.match(/^(.*?)\s+(Black|Heavy|ExtraBold|Bold|SemiBold|Medium|Light|Thin)$/i);
      lines.push(`${f} ✗`);
      warnings.push(`Fonte "${f}" NÃO encontrada — o renderizador trocou por outra sem avisar.` +
        (hint ? ` Tente font-family="${hint[1]}" com font-weight (ex.: 900).` : ' Use outra fonte instalada.'));
      continue;
    }
    const missing = [...weights].filter((w) => w >= 500 && probeWidth(f, w, 'Times New Roman') === base);
    lines.push(`${f} ✓`);
    if (missing.length) warnings.push(`Fonte "${f}" sem o peso ${missing.join('/')} (fonte variável ou variação não instalada) — saiu no peso normal. Instale a versão estática (pasta static/ do Google Fonts) ou escolha outra fonte.`);
  }
  return { summary: lines.join(' · '), warnings };
}

// ---------- analysis ----------

function analyze(img, vb) {
  const { w, h, pixels } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1, sum = 0, mx = 0, my = 0, ink = 0, lum = 0, opaque = 0;
  const bin = new Uint8Array(w * h);
  const colorCounts = new Map();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, a = pixels[i * 4 + 3];
    if (a > 127) bin[i] = 1;
    if (a > 8) {
      ink++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    sum += a; mx += a * x; my += a * y;
    if (a === 255) {
      const r = pixels[i * 4], g = pixels[i * 4 + 1], b = pixels[i * 4 + 2];
      opaque++; lum += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const key = (r >> 2) << 16 | (g >> 2) << 8 | (b >> 2);
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }
  }
  if (ink === 0) return { empty: true, bin, w, h, pixels };

  const sx = vb.w / w, sy = vb.h / h;
  const bbox = { x: vb.x + x0 * sx, y: vb.y + y0 * sy, w: (x1 - x0 + 1) * sx, h: (y1 - y0 + 1) * sy };
  const centroid = { x: vb.x + (mx / sum + 0.5) * sx, y: vb.y + (my / sum + 0.5) * sy };
  const center = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };

  // Mirror symmetry (IoU) about the drawing's own axes; ink only matches ink of the same color.
  let hi = 0, hu = 0, vi = 0, vu = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * w + x, j = y * w + (x0 + x1 - x), k = (y0 + y1 - y) * w + x;
    const p = bin[i];
    hi += p & bin[j] & sameColor(pixels, i, j); hu += p | bin[j];
    vi += p & bin[k] & sameColor(pixels, i, k); vu += p | bin[k];
  }

  // Cluster solid colors so anti-aliasing / tiny variations don't explode the palette.
  const clusters = [];
  for (const [key, n] of [...colorCounts].sort((a, b) => b[1] - a[1])) {
    const c = [(key >> 16 & 63) << 2, (key >> 8 & 63) << 2, (key & 63) << 2];
    const hit = clusters.find((k) => Math.hypot(k.c[0] - c[0], k.c[1] - c[1], k.c[2] - c[2]) < 40);
    if (hit) hit.n += n; else clusters.push({ c, n });
  }
  const colors = clusters.filter((k) => k.n / opaque >= 0.01)
    .map((k) => ({ hex: '#' + k.c.map((v) => v.toString(16).padStart(2, '0')).join(''), share: k.n / opaque }));

  return {
    empty: false, bin, pixels, w, h, x0, y0, x1, y1, bbox, centroid, center,
    bboxOffset: { x: (bbox.x + bbox.w / 2 - center.x) / vb.w, y: (bbox.y + bbox.h / 2 - center.y) / vb.h },
    massOffset: { x: (centroid.x - center.x) / vb.w, y: (centroid.y - center.y) / vb.h },
    margins: { left: x0 / w, right: (w - 1 - x1) / w, top: y0 / h, bottom: (h - 1 - y1) / h },
    touchesEdge: x0 === 0 || y0 === 0 || x1 === w - 1 || y1 === h - 1,
    symH: hu ? hi / hu : 1, symV: vu ? vi / vu : 1,
    coverage: ink / (w * h), fill: ink / ((x1 - x0 + 1) * (y1 - y0 + 1)),
    colors, gradientLike: clusters.length > 24, meanLum: opaque ? lum / opaque : 0,
  };
}

function sameColor(px, i, j) {
  const d = Math.abs(px[i * 4] - px[j * 4]) + Math.abs(px[i * 4 + 1] - px[j * 4 + 1]) + Math.abs(px[i * 4 + 2] - px[j * 4 + 2]);
  return d < 60 ? 1 : 0;
}

function sameColorAcross(pa, pb, i) {
  const d = Math.abs(pa[i * 4] - pb[i * 4]) + Math.abs(pa[i * 4 + 1] - pb[i * 4 + 1]) + Math.abs(pa[i * 4 + 2] - pb[i * 4 + 2]);
  return d < 60;
}

function silhouettePng(img) {
  const out = Buffer.alloc(img.w * img.h * 4);
  for (let i = 0; i < img.w * img.h; i++) {
    const v = 255 - img.pixels[i * 4 + 3];
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255;
  }
  return encodePng(img.w, img.h, out);
}

// Red = only original, blue = only mirrored, amber = both but different color, gray = matches.
function symmetryPng(m) {
  const { w, h, bin, pixels } = m, out = Buffer.alloc(w * h * 4), axis = m.x0 + m.x1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, p = bin[i], mxp = axis - x, j = y * w + mxp, q = mxp >= 0 && mxp < w ? bin[j] : 0;
    const c = p && q ? (sameColor(pixels, i, j) ? [200, 200, 206] : [245, 158, 11]) : p ? [230, 50, 80] : q ? [40, 110, 240] : [255, 255, 255];
    out.set([...c, 255], i * 4);
  }
  return encodePng(w, h, out);
}

// Green = added, red = removed, amber = color changed, gray = unchanged.
function diffPng(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4);
  let changed = 0, uni = 0;
  for (let i = 0; i < a.w * a.h; i++) {
    const p = a.bin[i], q = b.bin[i];
    const recolor = p && q && !sameColorAcross(a.pixels, b.pixels, i);
    changed += (p ^ q) | recolor; uni += p | q;
    const c = recolor ? [245, 158, 11] : p && q ? [200, 200, 205] : q ? [22, 163, 74] : p ? [220, 38, 38] : [255, 255, 255];
    out.set([...c, 255], i * 4);
  }
  return { png: encodePng(a.w, a.h, out), changed: uni ? changed / uni : 0 };
}

// ---------- SVG composition of the inspection sheet ----------

function niceStep(range) {
  const raw = range / 8, p = 10 ** Math.floor(Math.log10(raw)), n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

const DEFS = `<defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">
<rect width="16" height="16" fill="#fff"/><rect width="8" height="8" fill="#ececf0"/><rect x="8" y="8" width="8" height="8" fill="#ececf0"/></pattern></defs>`;

function card(x, y, w, h, title) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="#dcdce2"/>` +
    `<text x="${x + 14}" y="${y + 24}" font-size="14" font-weight="600" fill="#22232a">${esc(title)}</text>`;
}

// Logo image with viewBox-unit grid, canvas center, bbox and visual center of mass.
function gridPanel(x, y, size, vb, svg, m) {
  const img = renderFit(svg, vb, size);
  const k = img.w / vb.w;
  const X = (v) => x + (v - vb.x) * k, Y = (v) => y + (v - vb.y) * k;
  const step = niceStep(Math.max(vb.w, vb.h));
  let s = `<rect x="${x}" y="${y}" width="${img.w}" height="${img.h}" fill="url(#checker)"/>`;
  s += `<image x="${x}" y="${y}" width="${img.w}" height="${img.h}" href="${uri(img.png)}"/>`;
  for (let g = Math.ceil(vb.x / step) * step; g <= vb.x + vb.w + 1e-9; g += step) {
    s += `<line x1="${X(g)}" y1="${y}" x2="${X(g)}" y2="${y + img.h}" stroke="#2f7cf6" stroke-opacity=".22"/>`;
    s += `<text x="${X(g)}" y="${y - 5}" font-size="10" fill="#6a6f80" text-anchor="middle">${fmt(g)}</text>`;
  }
  for (let g = Math.ceil(vb.y / step) * step; g <= vb.y + vb.h + 1e-9; g += step) {
    s += `<line x1="${x}" y1="${Y(g)}" x2="${x + img.w}" y2="${Y(g)}" stroke="#2f7cf6" stroke-opacity=".22"/>`;
    s += `<text x="${x - 5}" y="${Y(g) + 3}" font-size="10" fill="#6a6f80" text-anchor="end">${fmt(g)}</text>`;
  }
  const cx = X(vb.x + vb.w / 2), cy = Y(vb.y + vb.h / 2);
  s += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + img.h}" stroke="#ff3b30" stroke-opacity=".55" stroke-dasharray="6 4"/>`;
  s += `<line x1="${x}" y1="${cy}" x2="${x + img.w}" y2="${cy}" stroke="#ff3b30" stroke-opacity=".55" stroke-dasharray="6 4"/>`;
  if (m && !m.empty) {
    s += `<rect x="${X(m.bbox.x)}" y="${Y(m.bbox.y)}" width="${m.bbox.w * k}" height="${m.bbox.h * k}" fill="none" stroke="#c026d3" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    const gx = X(m.centroid.x), gy = Y(m.centroid.y);
    s += `<circle cx="${gx}" cy="${gy}" r="5" fill="none" stroke="#f59e0b" stroke-width="2"/><line x1="${gx - 9}" y1="${gy}" x2="${gx + 9}" y2="${gy}" stroke="#f59e0b" stroke-width="2"/><line x1="${gx}" y1="${gy - 9}" x2="${gx}" y2="${gy + 9}" stroke="#f59e0b" stroke-width="2"/>`;
  }
  s += `<rect x="${x}" y="${y}" width="${img.w}" height="${img.h}" fill="none" stroke="#9a9aa6"/>`;
  return s;
}

function imageCentered(x, y, box, png, w, h) {
  return `<image x="${x + (box - w) / 2}" y="${y + (box - h) / 2}" width="${w}" height="${h}" href="${uri(png)}"/>`;
}

const SMALL_SIZES = [16, 32, 48, 64, 128];

function smallTile(svg, vb, size, bg, display = 128) {
  const img = renderFit(svg, vb, size, bg);
  return upscale(img, Math.floor(display / size));
}

function wrapSheet(W, H, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${UI_FAMILY}">${DEFS}<rect width="${W}" height="${H}" fill="#f3f3f6"/>${body}</svg>`;
}

// ---------- public API ----------

function loadSvg(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const vb = parseViewBox(raw);
  return { raw, vb, svg: withViewBox(raw, vb) };
}

function outDirFor(file) {
  const dir = path.join(RENDERS, path.basename(file).replace(/\.svg$/i, ''));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function inspect(file, { diffWith } = {}) {
  const { raw, vb, svg } = loadSvg(file);
  const name = path.basename(file);
  const dir = outDirFor(file);
  const base = renderFit(svg, vb, 512);
  const m = analyze(base, vb);

  const W = 1560, H = 1080;
  let b = `<text x="20" y="40" font-size="22" font-weight="700" fill="#16171d">${esc(name)}</text>`;
  b += `<text x="${20 + name.length * 12 + 20}" y="40" font-size="14" fill="#5a5e6e">viewBox ${fmt(vb.x)} ${fmt(vb.y)} ${fmt(vb.w)} ${fmt(vb.h)}` +
    (m.empty ? ' — DESENHO VAZIO' : ` · simetria H ${pct(m.symH)} V ${pct(m.symV)} · descentralização dx ${signedPct(m.bboxOffset.x)} dy ${signedPct(m.bboxOffset.y)}`) + `</text>`;

  b += card(20, 60, 760, 780, 'Visão principal · grade em unidades do viewBox');
  b += `<text x="36" y="830" font-size="11" fill="#6a6f80">tracejado vermelho = centro do canvas · rosa = bbox · laranja = centro de massa</text>`;
  b += gridPanel(56, 110, 700, vb, svg, m);

  const dark = renderFit(svg, vb, 340, DARK);
  b += card(800, 60, 365, 385, 'Sobre fundo escuro');
  b += imageCentered(812, 95, 340, dark.png, dark.w, dark.h);

  const sil = renderFit(svg, vb, 340);
  b += card(1175, 60, 365, 385, 'Silhueta (forma pura, 1 cor)');
  b += imageCentered(1187, 95, 340, silhouettePng(sil), sil.w, sil.h);

  b += card(800, 455, 365, 385, `Simetria espelhada · ${m.empty ? '-' : pct(m.symH)}`);
  if (!m.empty) {
    b += `<text x="814" y="460" dy="40" font-size="11" fill="#6a6f80">vermelho = só original · azul = só espelho · âmbar = cor diferente</text>`;
    const sy = renderFit(svg, vb, 320); const sm = analyze(sy, vb);
    b += imageCentered(822, 510, 320, symmetryPng(sm), sy.w, sy.h);
  }

  b += card(1175, 455, 365, 385, 'Cores sólidas detectadas');
  (m.colors || []).slice(0, 8).forEach((c, i) => {
    const yy = 500 + i * 40;
    b += `<rect x="1195" y="${yy}" width="56" height="30" rx="5" fill="${c.hex}" stroke="#ccc"/>`;
    b += `<text x="1265" y="${yy + 20}" font-size="15" fill="#22232a">${c.hex}  ${pct(c.share)}</text>`;
  });
  if (m.gradientLike) b += `<text x="1195" y="830" font-size="12" fill="#b45309">muitos tons: gradiente ou transparência</text>`;

  b += card(20, 860, 1520, 205, 'Tamanhos reais renderizados (pixels ampliados sem suavização) · fundo claro e escuro');
  let tx = 40;
  for (const bg of ['#ffffff', DARK]) for (const s of SMALL_SIZES) {
    const t = smallTile(svg, vb, s, bg);
    b += `<rect x="${tx}" y="898" width="128" height="128" fill="${bg}" stroke="#dcdce2"/>`;
    b += imageCentered(tx, 898, 128, t.png, t.w, t.h);
    b += `<text x="${tx + 64}" y="1046" font-size="12" fill="#5a5e6e" text-anchor="middle">${s}px</text>`;
    tx += 148;
  }

  const sheetPath = path.join(dir, 'sheet.png');
  fs.writeFileSync(sheetPath, render(wrapSheet(W, H, b), { ui: true, original: true }).png);

  // Automatic diff against the previous version of this same file.
  const outputs = [sheetPath];
  const lastPath = path.join(dir, 'last.svg');
  const prevFile = diffWith || (fs.existsSync(lastPath) && fs.readFileSync(lastPath, 'utf8') !== raw ? lastPath : null);
  let diffInfo = null;
  if (prevFile && !m.empty) {
    const prev = loadSvg(prevFile);
    const pimg = renderFit(prev.svg, prev.vb, 512);
    if (pimg.w === base.w && pimg.h === base.h) {
      const d = diffPng(analyze(pimg, prev.vb), m);
      const dp = path.join(dir, 'diff.png');
      fs.writeFileSync(dp, d.png);
      outputs.push(dp);
      diffInfo = d.changed;
    }
  }
  fs.writeFileSync(lastPath, raw);

  const fonts = /<text\b/i.test(raw) ? checkFonts(raw) : null;
  const report = buildReport(name, vb, m, outputs, diffInfo, fonts);
  fs.writeFileSync(path.join(dir, 'report.txt'), report);
  return { report, outputs, metrics: m };
}

function buildReport(name, vb, m, outputs, diff, fonts) {
  const L = [`=== ${name} ===`, `viewBox: ${fmt(vb.x)} ${fmt(vb.y)} ${fmt(vb.w)} ${fmt(vb.h)}`];
  if (m.empty) return [...L, 'AVISO: nada visível foi renderizado (desenho vazio, fora do viewBox ou sem preenchimento).', `Imagens: ${outputs.join(' | ')}`].join('\n');
  const W = fonts ? [...fonts.warnings] : [];
  if (fonts) L.push(`Fontes: ${fonts.summary || '(nenhuma família declarada)'}`);
  L.push(`Caixa do desenho (bbox, unidades do viewBox): x=${fmt(m.bbox.x)} y=${fmt(m.bbox.y)} w=${fmt(m.bbox.w)} h=${fmt(m.bbox.h)}`);
  L.push(`Margens: esq ${pct(m.margins.left)} · dir ${pct(m.margins.right)} · topo ${pct(m.margins.top)} · base ${pct(m.margins.bottom)}`);
  L.push(`Centro da bbox vs centro do canvas: dx ${signedPct(m.bboxOffset.x)} · dy ${signedPct(m.bboxOffset.y)}`);
  L.push(`Centro de massa visual: (${fmt(m.centroid.x)}, ${fmt(m.centroid.y)}) → dx ${signedPct(m.massOffset.x)} · dy ${signedPct(m.massOffset.y)}`);
  L.push(`Simetria espelhada: horizontal ${pct(m.symH)} · vertical ${pct(m.symV)}`);
  L.push(`Cobertura: ${pct(m.coverage)} do canvas · ${pct(m.fill)} da bbox`);
  L.push(`Cores sólidas: ${m.colors.map((c) => `${c.hex} ${pct(c.share)}`).join(' · ') || '(nenhuma opaca)'}${m.gradientLike ? ' (+ muitos tons: gradiente/transparência)' : ''}`);
  if (diff !== null) L.push(`Mudança vs versão anterior: ${pct(diff)} da área (diff.png: verde = adicionado, vermelho = removido, âmbar = cor mudou)`);

  if (m.touchesEdge) W.push('O desenho encosta na borda do viewBox — pode estar cortado.');
  const minMargin = Math.min(...Object.values(m.margins));
  if (!m.touchesEdge && minMargin < 0.04) W.push(`Margem mínima de ${pct(minMargin)} — apertado; logos costumam respirar com 8–15%.`);
  if (Math.abs(m.bboxOffset.x) > 0.01 || Math.abs(m.bboxOffset.y) > 0.01) W.push('Bbox fora do centro do canvas em mais de 1% (confira se é compensação óptica intencional).');
  if (m.symH > 0.85 && m.symH < 0.995) W.push(`Quase simétrico na horizontal (${pct(m.symH)}): se a intenção é simetria, há desvios — veja o mapa de simetria.`);
  if (m.colors.length > 4) W.push(`${m.colors.length} cores sólidas — logos fortes costumam usar 1–3.`);
  if (m.meanLum < 0.12) W.push('Logo muito escuro: tende a sumir em fundo escuro — prever versão invertida.');
  if (m.meanLum > 0.9) W.push('Logo muito claro: tende a sumir em fundo branco — prever versão escura.');
  if (m.coverage < 0.03) W.push('Cobertura muito baixa: traços finos podem desaparecer em tamanhos pequenos (veja 16/32px).');
  L.push(W.length ? 'Avisos:\n  - ' + W.join('\n  - ') : 'Avisos: nenhum');
  L.push(`Imagens para abrir com Read: ${outputs.join(' | ')}`);
  return L.join('\n');
}

// Final transparent PNG export at a given width (or height for tall logos).
export function exportPng(file, size) {
  const { vb, svg } = loadSvg(file);
  const out = path.join(outDirFor(file), `${path.basename(file).replace(/\.svg$/i, '')}-${size}.png`);
  fs.writeFileSync(out, renderFit(svg, vb, size).png);
  return out;
}

// Zoomed render of a region (viewBox units) with a fine grid, for detail work.
export function zoom(file, region) {
  const { svg } = loadSvg(file);
  const [x, y, w, h] = region;
  const vb = { x, y, w, h };
  const sub = withViewBox(svg, vb);
  const W = 1100, H = 1100;
  let b = `<text x="20" y="34" font-size="18" font-weight="700" fill="#16171d">${esc(path.basename(file))} · zoom em x=${fmt(x)} y=${fmt(y)} w=${fmt(w)} h=${fmt(h)}</text>`;
  b += gridPanel(60, 70, 1000, vb, sub, null);
  const out = path.join(outDirFor(file), 'zoom.png');
  fs.writeFileSync(out, render(wrapSheet(W, H, b), { ui: true, original: true }).png);
  return out;
}

// Side-by-side comparison of several concepts.
export function compare(files) {
  const cols = Math.min(files.length, 4), rows = Math.ceil(files.length / cols);
  const TW = 380, TH = 530, W = 20 + cols * (TW + 20), H = 20 + rows * (TH + 20);
  let b = '';
  files.forEach((file, i) => {
    const { vb, svg } = loadSvg(file);
    const x = 20 + (i % cols) * (TW + 20), y = 20 + Math.floor(i / cols) * (TH + 20);
    b += card(x, y, TW, TH, `${String.fromCharCode(65 + i)} · ${path.basename(file)}`);
    const big = renderFit(svg, vb, 340);
    b += `<rect x="${x + 20}" y="${y + 40}" width="340" height="340" fill="url(#checker)"/>`;
    b += imageCentered(x + 20, y + 40, 340, big.png, big.w, big.h);
    const tiles = [smallTile(svg, vb, 16, '#ffffff', 96), smallTile(svg, vb, 32, '#ffffff', 96)];
    const dk = renderFit(svg, vb, 96, DARK);
    [[tiles[0], '#fff', '16px'], [tiles[1], '#fff', '32px'], [dk, DARK, 'escuro']].forEach(([t, bg, label], j) => {
      const tx = x + 20 + j * 122, ty = y + 395;
      b += `<rect x="${tx}" y="${ty}" width="96" height="96" fill="${bg}" stroke="#dcdce2"/>`;
      const sc = Math.min(96 / t.w, 96 / t.h, 1);
      b += imageCentered(tx, ty, 96, t.png, t.w * sc, t.h * sc);
      b += `<text x="${tx + 48}" y="${ty + 114}" font-size="12" fill="#5a5e6e" text-anchor="middle">${label}</text>`;
    });
  });
  fs.mkdirSync(RENDERS, { recursive: true });
  const out = path.join(RENDERS, 'compare.png');
  fs.writeFileSync(out, render(wrapSheet(W, H, b), { ui: true, original: true }).png);
  return out;
}
