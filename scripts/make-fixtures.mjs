// Genera los archivos de ejemplo ficticios en tests/fixtures/ (uno por formato más los de prueba hostiles).
// Uso: node scripts/make-fixtures.mjs  — es determinista: dos corridas dan los mismos bytes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildFixtures } from './lib/fixtures.mjs';

const dir = join('tests', 'fixtures');
mkdirSync(dir, { recursive: true });
const files = buildFixtures();
for (const [name, bytes] of Object.entries(files)) writeFileSync(join(dir, name), bytes);
console.log(`make-fixtures: ${Object.keys(files).length} archivos escritos en ${dir}/ (todo ficticio).`);
