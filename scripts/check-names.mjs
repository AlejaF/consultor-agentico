// Verifica el principio I: sin nombres reales, referencias/ sin versionar y sin PDF en dist/.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { denylistMode, findMatches, findPdfFiles, parseDenylist, referenciasTracked } from './lib/names.mjs';

const DENYLIST = join('.local', 'denylist.txt');
const ROOTS = ['src', 'index.html', 'README.md', 'docs', 'dist', 'specs', '.specify', '.claude', 'tests/fixtures'];
const SKIP_DIRS = new Set(['node_modules', '.git']);
const SKIP_FILES = new Set(['settings.local.json']);
const TEXT_EXT = /\.(md|mjs|js|cjs|ts|tsx|json|css|html|svg|txt|vtt|srt|yml|yaml|sh|map)$/i;

function walk(p, out = []) {
  if (!existsSync(p)) return out;
  if (statSync(p).isDirectory()) {
    for (const n of readdirSync(p)) if (!SKIP_DIRS.has(n)) walk(join(p, n), out);
  } else out.push(p);
  return out;
}

let failed = false;
const fail = (m) => {
  console.error(`check-names: ${m}`);
  failed = true;
};

// (a) lista local de nombres reales
const hasList = existsSync(DENYLIST);
const mode = denylistMode({ hasList, isCI: Boolean(process.env.CI) });
if (mode === 'fail') {
  fail(
    `falta ${DENYLIST}. Créala con un nombre real por línea (las líneas vacías y las que empiezan con # se ignoran). ` +
      'No se commitea (.local/ está en .gitignore).',
  );
} else if (mode === 'skip') {
  console.warn(`check-names: AVISO: no hay ${DENYLIST} en CI; se omite solo la comprobación de nombres reales.`);
} else {
  const terms = parseDenylist(readFileSync(DENYLIST, 'utf8'));
  if (!existsSync('dist')) console.warn('check-names: dist/ no existe: ejecuta npm run build');
  let n = 0;
  for (const root of ROOTS) {
    for (const f of walk(root)) {
      if (SKIP_FILES.has(f.split('/').pop()) || !TEXT_EXT.test(f)) continue;
      n++;
      for (const m of findMatches(readFileSync(f, 'utf8'), terms)) {
        // No se imprime el término: el registro de CI/terminal no debe repetir el nombre real.
        fail(`coincidencia con la lista en ${f}:${m.line}`);
      }
    }
  }
  console.log(`check-names: ${n} archivos revisados contra ${terms.length} término(s).`);
}

// (b) referencias/ no versionada
try {
  const out = execFileSync('git', ['ls-files', 'referencias'], { encoding: 'utf8' });
  if (referenciasTracked(out)) fail('referencias/ está versionada (git ls-files referencias no está vacío).');
} catch {
  console.warn('check-names: AVISO: no se pudo ejecutar git ls-files; se omite esta comprobación.');
}

// (c) sin PDF en dist/
const pdfs = findPdfFiles(walk('dist'));
if (pdfs.length) fail(`hay PDF en dist/: ${pdfs.join(', ')}`);

if (failed) process.exit(1);
console.log('check-names: OK');
