// Falla si hay colores literales fuera de src/styles/tokens.css (constitución V).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findColorLiterals } from './lib/tokens.mjs';

const EXT = new Set(['.css', '.tsx', '.ts', '.svg', '.html']);
const ALLOWED = join('src', 'styles', 'tokens.css');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(p.slice(p.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

const files = [...walk('src'), ...walk('public'), 'index.html'].filter((f) => f !== ALLOWED);
let bad = 0;
for (const f of files) {
  for (const m of findColorLiterals(readFileSync(f, 'utf8'))) {
    console.error(`check-tokens: color literal ${m.text} en ${f}:${m.line}`);
    bad++;
  }
}
if (bad > 0) {
  console.error(`check-tokens: ${bad} color(es) fuera de tokens.css.`);
  process.exit(1);
}
console.log(`check-tokens: OK (${files.length} archivos revisados).`);
