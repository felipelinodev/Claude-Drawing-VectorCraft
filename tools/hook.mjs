// PostToolUse hook.
//
// 1) Ferramentas do MCP do VectorCraft: conta as alterações feitas no documento desde a última
//    vez que Claude realmente OLHOU (render_preview / screenshot / inspect) e cobra uma olhada.
//    Ao salvar um .vectorcraft, roda o build (artboards → SVGs) e devolve o relatório.
// 2) Write/Edit num .svg de logos/: SVG ali é SAÍDA DE BUILD, não fonte — avisa e inspeciona.
// 3) Write/Edit em brand/<marca>/index.html: reconstrói o PDF + prévias.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RENDERS, inspect } from './lib.mjs';
import { buildBrand } from './brand.mjs';
import { buildLogos } from './vc.mjs';

const STATE = path.join(RENDERS, '.vc-hook.json');
const LOOK_AFTER = 10; // alterações sem olhar antes de cobrar

// Ferramentas do MCP que só leem/mostram — zeram o contador.
const LOOKING = new Set([
  'render_preview', 'screenshot', 'ui_screenshot', 'doc_inspect', 'inspect_document',
  'ui_inspect', 'command_list', 'list_commands',
]);

const readState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { edits: 0, doc: null }; } };
const writeState = (s) => { try { fs.mkdirSync(RENDERS, { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(s)); } catch { /* ignora */ } };
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

function emit(text) {
  if (text) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text },
    }));
  }
  process.exit(0);
}

// Caminho de .vectorcraft que esta chamada salvou, se houver.
function savedDoc(tool, input) {
  const direct = input.path || input.file_path;
  if ((tool === 'save_file' || tool === 'export') && typeof direct === 'string' && /\.vectorcraft$/i.test(direct)) return direct;
  if (tool === 'command_run' || tool === 'run_command') {
    const id = String(input.command || input.id || '');
    const p = input.params?.path;
    if (/^document\.(save|export)$/.test(id) && typeof p === 'string' && /\.vectorcraft$/i.test(p)) return p;
  }
  if (tool === 'command_batch') {
    for (const s of input.steps || input.commands || []) {
      const p = s?.params?.path;
      if (/^document\.(save|export)$/.test(String(s?.command || s?.id || '')) && typeof p === 'string' && /\.vectorcraft$/i.test(p)) return p;
    }
  }
  return null;
}

function onVectorcraft(tool, input) {
  const state = readState();

  const doc = savedDoc(tool, input);
  if (doc) {
    writeState({ edits: 0, doc });
    try {
      const { report, issues } = buildLogos(doc);
      return emit('[vectorcraft] Documento salvo — build dos artboards para logos/*.svg:\n' + report +
        '\nAbra as sheet.png citadas acima com Read e avalie de verdade antes de seguir.' +
        (issues.length ? ' Resolva os PROBLEMAS antes de entregar.' : ''));
    } catch (e) {
      return emit('[vectorcraft] FALHA no build de ' + rel(path.resolve(doc)) + ': ' + e.message);
    }
  }

  if (LOOKING.has(tool)) { writeState({ ...state, edits: 0 }); return emit(null); }

  const edits = (state.edits || 0) + 1;
  if (edits < LOOK_AFTER) { writeState({ ...state, edits }); return emit(null); }
  writeState({ ...state, edits: 0 });
  return emit('[vectorcraft] ' + LOOK_AFTER + ' alterações no documento sem você olhar o resultado. ' +
    'Chame render_preview (ou screenshot) agora, abra o PNG com Read e descreva o que está vendo ' +
    'antes de continuar desenhando.');
}

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let payload;
  try { payload = JSON.parse(input); } catch { process.exit(0); }
  const toolName = payload.tool_name || '';
  const toolInput = payload.tool_input || {};

  const mcp = toolName.match(/vectorcraft[^_]*__(.+)$/i);
  if (mcp) onVectorcraft(mcp[1], toolInput);

  const file = toolInput.file_path;
  if (!file) process.exit(0);

  if (/[\\/]brand[\\/][^\\/]+[\\/]index\.html$/i.test(file)) {
    try {
      const { report, pages, issues } = buildBrand(file);
      return emit('[brand-guide] Manual convertido em PDF automaticamente.\n' + report +
        '\nAbra as prévias com Read (' + pages.map((p) => path.basename(p)).join(', ') +
        ' em ' + path.dirname(pages[0] || '') + ') e avalie cada página.' +
        (issues.length ? ' Corrija os PROBLEMAS antes de entregar.' : ''));
    } catch (e) {
      return emit('[brand-guide] FALHA ao gerar o PDF de ' + file + ': ' + e.message);
    }
  }

  if (/\.svg$/i.test(file)) {
    let text = '';
    if (/[\\/]logos[\\/]/i.test(file)) {
      text = '[vectorcraft] ATENÇÃO: ' + rel(path.resolve(file)) + ' é SAÍDA DE BUILD do documento ' +
        '.vectorcraft, não a fonte. Editar o SVG à mão se perde no próximo build. ' +
        'Faça a correção no documento pelo MCP do VectorCraft e rode o build de novo.\n';
    }
    try {
      const { report, outputs } = inspect(file);
      return emit(text + '[logo-vision] SVG renderizado.\n' + report +
        '\nAbra ' + outputs.join(' e ') + ' com Read e avalie visualmente.');
    } catch (e) {
      return emit(text + '[logo-vision] FALHA ao renderizar ' + file + ': ' + e.message);
    }
  }

  process.exit(0);
});
