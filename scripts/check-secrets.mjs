// Falla si encuentra claves en el repositorio o en dist/ (principio IX, SC-A2).
// Revisa: archivos versionados (git ls-files), todo dist/ y server/.env.example. No imprime nunca la clave.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { forbiddenTracked, isScannable, scanText } from './lib/secrets.mjs';

let failed = false;
const fail = (m) => {
  console.error(`check-secrets: ${m}`);
  failed = true;
};

function walk(p, out = []) {
  if (!existsSync(p)) return out;
  if (statSync(p).isDirectory()) {
    for (const n of readdirSync(p)) if (n !== 'node_modules' && n !== '.git') walk(join(p, n), out);
  } else out.push(p);
  return out;
}

let tracked = [];
try {
  tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {
  console.warn('check-secrets: no se pudo ejecutar `git ls-files`; se revisan solo dist/ y server/.env.example.');
}

// (a) archivos de entorno versionados
for (const p of forbiddenTracked(tracked)) fail(`archivo de entorno versionado: ${p} (quítalo con \`git rm --cached\`).`);

// (b) contenido de archivos versionados, de dist/ y del ejemplo
const files = new Set([...tracked, ...walk('dist'), 'server/.env.example']);
let scanned = 0;
for (const p of files) {
  if (!existsSync(p) || !isScannable(p) || !statSync(p).isFile()) continue;
  scanned += 1;
  for (const f of scanText(p, readFileSync(p, 'utf8'))) fail(`${f.path}:${f.line} parece contener un secreto (regla ${f.rule}, empieza por «${f.preview}»).`);
}

if (existsSync('server/.env.example')) {
  // el ejemplo no debe traer valores
  const bad = readFileSync('server/.env.example', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=.+/.test(l.trim()) && !l.trim().startsWith('#'));
  if (bad.length) fail('server/.env.example debe ir SIN valores (las variables van vacías).');
} else {
  console.warn('check-secrets: no existe server/.env.example.');
}

if (failed) process.exit(1);
console.log(`check-secrets: OK (${scanned} archivos revisados${existsSync('dist') ? ', dist/ incluido' : ', sin dist/'}).`);
