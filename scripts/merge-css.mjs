// One-off: fusiona public/style.css + public/redesign.css → src/styles/site.css
// - elimina reglas con clases/ids que no aparecen en ninguna página/fuente
// - consolida la paleta dispersa en variables :root (mismos valores, cambio visual cero)
// - normaliza url() relativas → absolutas, elimina dependencia externa (123rf) y Caveat
import fs from 'node:fs';

const style = fs.readFileSync('public/style.css', 'utf8');
const redesign = fs.readFileSync('public/redesign.css', 'utf8');
const { execSync } = await import('node:child_process');

// ---------- 1. clases/ids usados ----------
const used = new Set(['visible', 'active', 'error', 'ok']);
const addClasses = (txt) => {
  for (const m of txt.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach(c => c && used.add(c));
  for (const m of txt.matchAll(/classList\.(?:add|toggle|remove)\('([^']+)'/g)) used.add(m[1]);
  for (const m of txt.matchAll(/className\s*=\s*'([^']+)'/g)) m[1].split(/\s+/).forEach(c => c && used.add(c));
};
const usedIds = new Set();
for (const f of execSync("find dist -name '*.html'").toString().trim().split('\n')) {
  const html = fs.readFileSync(f, 'utf8');
  addClasses(html);
  for (const m of html.matchAll(/id="([^"]+)"/g)) usedIds.add(m[1]);
}
for (const f of execSync("find src -type f \\( -name '*.astro' -o -name '*.json' \\)").toString().trim().split('\n')) {
  const src = fs.readFileSync(f, 'utf8');
  addClasses(src);
  for (const m of src.matchAll(/"clase":\s*"([^"]+)"/g)) used.add(m[1]);
}
console.log('clases usadas:', used.size, '| ids usados:', [...usedIds].join(', '));

// ---------- 2. transformaciones previas ----------
const hexVars = {
  '#3b82f6': 'var(--azul-vivo)',
  '#1567e2': 'var(--azul-acento)',
  '#085bd8': 'var(--azul-icono)',
  '#0762ebc0': 'var(--azul-tag)',
  '#02059c': 'var(--azul-hover-a)',
  '#02389c': 'var(--azul-hover-b)',
  '#0205af': 'var(--azul-hover-sombra)',
  '#0f04aa': 'var(--btn-grad-a)',
  '#092da3': 'var(--btn-grad-b)',
  '#0104b6': 'var(--btn-sombra)',
  '#086ece91': 'var(--hr-grad-a)',
  '#020e22bd': 'var(--hr-grad-b)',
  '#05117c3f': 'var(--panel-entrenamiento)',
  '#0a1a4d8e': 'var(--navy-alpha)',
  '#0b298ba1': 'var(--azul-alpha)',
  '#040c1d': 'var(--navy-top)',
  'rgba(226, 221, 221, 0.918)': 'var(--tinta-suave)',
  'rgba(226,221,221,0.918)': 'var(--tinta-suave)',
};
const placeholderVals = [];
const extraRoot = Object.entries({
  '--azul-vivo': '#3b82f6',
  '--azul-acento': '#1567e2',
  '--azul-icono': '#085bd8',
  '--azul-tag': 'rgba(7, 98, 235, .75)',
  '--azul-hover-a': '#02059c',
  '--azul-hover-b': '#02389c',
  '--azul-hover-sombra': '#0205af',
  '--btn-grad-a': '#0f04aa',
  '--btn-grad-b': '#092da3',
  '--btn-sombra': '#0104b6',
  '--hr-grad-a': 'rgba(8, 110, 206, .57)',
  '--hr-grad-b': 'rgba(2, 14, 34, .74)',
  '--panel-entrenamiento': 'rgba(5, 17, 124, .25)',
  '--navy-alpha': 'rgba(10, 26, 77, .56)',
  '--azul-alpha': 'rgba(11, 41, 139, .63)',
  '--navy-top': '#040c1d',
  '--tinta-suave': 'rgba(226, 221, 221, .918)',
}).map(([k, v]) => {
  placeholderVals.push(v);
  return `  ${k}: @V${placeholderVals.length - 1}@;`;
}).join('\n');

const pre = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/url\(\s*(['"]?)(?:\.\/)?fotos\//g, 'url($1/fotos/')
  .replace(/url\(\s*https:\/\/us\.123rf\.com[^)]*\)/g, 'linear-gradient(180deg, var(--navy-3), var(--navy-2))')
  .replace(/"Caveat",\s*cursive/g, '"Bebas Neue", sans-serif');
for (const [hex, v] of Object.entries(hexVars)) pre.map = null;
const applyVars = (css) => {
  let out = css;
  for (const [hex, v] of Object.entries(hexVars)) out = out.split(hex).join(v);
  return out;
};

// ---------- 3. parser mínimo ----------
function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

function parse(css) {
  const nodes = [];
  let i = 0;
  const n = css.length;
  let buf = '';
  while (i < n) {
    const ch = css[i];
    if (ch === '{') {
      // encontrar cierre balanceado (respeta strings)
      let depth = 1, j = i + 1;
      while (j < n && depth > 0) {
        const c = css[j];
        if (c === '"' || c === "'") { const q = c; j++; while (j < n && css[j] !== q) { if (css[j] === '\\') j++; j++; } }
        else if (c === '{') depth++;
        else if (c === '}') depth--;
        j++;
      }
      nodes.push({ prelude: buf.trim(), body: css.slice(i + 1, j - 1) });
      buf = '';
      i = j;
    } else { buf += ch; i++; }
  }
  return nodes;
}

function tokenDead(sel) {
  for (const m of sel.matchAll(/\.([a-zA-Z0-9_-]+)/g)) if (!used.has(m[1])) return true;
  for (const m of sel.matchAll(/#([a-zA-Z0-9_-]+)/g)) if (!usedIds.has(m[1])) return true;
  return false;
}

function filterNodes(nodes) {
  const kept = [];
  for (const node of nodes) {
    if (node.prelude.startsWith('@')) {
      if (node.prelude.startsWith('@media') || node.prelude.startsWith('@supports')) {
        const inner = filterNodes(parse(node.body));
        if (inner.length) kept.push({ ...node, body: inner.map(n => n.prelude + '{' + (n.bodyText ?? n.body) + '}').join('') });
      } else {
        kept.push(node); // @keyframes, @font-face, :root...
      }
      continue;
    }
    const sels = splitTop(node.prelude).filter(s => s.trim() && !tokenDead(s));
    if (sels.length) kept.push({ ...node, prelude: sels.join(',').trim() });
  }
  return kept;
}

function splitTop(sel) {
  const parts = []; let depth = 0, cur = '';
  for (const c of sel) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

const render = (nodes) => nodes.map(nd => {
  const bodyText = nd.bodyText ?? nd.body;
  return nd.prelude + '{' + bodyText.replace(/\s+/g, ' ').trim() + '}';
}).join('\n');

// ---------- 4. fusionar ----------
const styleP = parse(stripComments(pre(style)));
const redesignP = parse(stripComments(redesign));
const keptStyle = filterNodes(styleP);
const keptRedesign = filterNodes(redesignP);

// :root de redesign + variables extra
const rootIdx = keptRedesign.findIndex(n => n.prelude === ':root');
if (rootIdx >= 0) keptRedesign[rootIdx].body = keptRedesign[rootIdx].body + '\n' + extraRoot;

// nombres de fuentes self-hosted (variable)
let cssOut = render(keptStyle) + '\n' + render(keptRedesign);
cssOut = applyVars(cssOut);
cssOut = applyVars(cssOut);
cssOut = cssOut.replace(/@V(\d+)@/g, (_, i) => placeholderVals[+i]);
cssOut = cssOut.split('"Montserrat"').join('"Montserrat Variable"').split('"Oswald"').join('"Oswald Variable"');

const header = `/* ============================================================
   site.css — hoja unificada del sitio (antes: style.css + redesign.css)
   Paleta canónica en :root. Astro minifica este archivo en el build.
   Generado por scripts/merge-css.mjs — editar aquí, no en public/.
   ============================================================ */
`;
fs.mkdirSync('src/styles', { recursive: true });
fs.writeFileSync('src/styles/site.css', header + cssOut);

const bytes = b => (b / 1024).toFixed(1) + 'KB';
console.log(`\nstyle.css reglas: ${styleP.length} → conservadas ${keptStyle.length} (eliminadas ${styleP.length - keptStyle.length})`);
console.log(`redesign.css reglas: ${redesignP.length} → conservadas ${keptRedesign.length}`);
console.log(`\nResultado: src/styles/site.css = ${bytes(fs.statSync('src/styles/site.css').size)}`);
console.log(`(antes: ${bytes(style.length)} + ${bytes(redesign.length)} = ${bytes(style.length + redesign.length)} sin minificar)`);
