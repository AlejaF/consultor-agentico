// Prueba de humo MANUAL con el modelo real (con costo). Requiere el servicio en marcha (`npm run dev:server`) con
// `server/.env` listo y los modelos decididos. Sube los fixtures de tests/fixtures/, corre un diagnóstico y escribe
// un RESUMEN en docs/evidencia/humo-real.md. Nunca imprime ni escribe la clave ni texto de documentos.
// Opción --guardar-traza: además guarda la respuesta COMPLETA (traza, hallazgos y citas, que sí traen texto de los
// documentos ficticios) en .local/trazas/ (ignorada por git); no pasa por docs/ ni por check-secrets. Nunca la clave.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { lineaDeCosto } from './lib/tarifas.mjs';
import { buildTraceRecord, saveTrace, wantsTrace } from './lib/traza.mjs';

const BASE = process.env.SERVICE_URL ?? 'http://127.0.0.1:8787';
const PROJECT = 'P-HUMO';
const FIXTURES = 'tests/fixtures';
// El costo usa la tarifa del modelo REALMENTE usado (scripts/lib/tarifas.mjs, de research.md §3); sin tarifa, no se estima.
// RATE_INPUT_PER_M y RATE_OUTPUT_PER_M (las dos) permiten fijar una tarifa a mano.

const health = await fetch(`${BASE}/api/health`).then((r) => r.json()).catch(() => null);
if (!health) {
  console.error('El servicio no responde. Arráncalo con «npm run dev:server».');
  process.exit(1);
}
if (health.fake) {
  console.error('El servicio está en modo FALSO (MODEL_PROVIDER=fake); la prueba de humo necesita el proveedor real.');
  process.exit(1);
}
if (!health.keyConfigured || !health.models.diagnosis) {
  console.error('Falta la clave o el modelo del diagnóstico (OPENAI_MODEL_DIAGNOSTICO) en server/.env.');
  process.exit(1);
}

// Solo los fixtures «sanos»: los hostiles (cifrado, dañado, escaneado) se prueban en las pruebas automáticas.
const skip = /^(cifrado|danado|escaneado)/;
const form = new FormData();
for (const name of readdirSync(FIXTURES).filter((n) => !skip.test(n) && !n.startsWith('.'))) {
  form.append('files', new Blob([readFileSync(join(FIXTURES, name))]), name);
}
const up = await fetch(`${BASE}/api/evidence?projectId=${PROJECT}`, { method: 'POST', body: form });
if (!up.ok) {
  console.error(`No se pudieron subir los archivos de ejemplo (HTTP ${up.status}).`);
  process.exit(1);
}

const t0 = Date.now();
const res = await fetch(`${BASE}/api/diagnosis/run`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ projectId: PROJECT, empresa: 'Empresa Ficticia Alfa' }),
});
const seconds = ((Date.now() - t0) / 1000).toFixed(1);
const body = await res.json();

if (wantsTrace(process.argv.slice(2))) {
  try {
    const file = saveTrace(buildTraceRecord({ status: res.status, body, seconds, projectId: PROJECT }), { extraSecrets: [process.env.OPENAI_API_KEY] });
    console.log(`Traza completa guardada en ${file} (carpeta ignorada por git; puede contener texto de los documentos ficticios).`);
  } catch (e) {
    console.error(`No se guardó la traza: ${e instanceof Error ? e.message : 'error desconocido'}`);
  }
}

let md;
if (!res.ok) {
  const e = body.error ?? {};
  md = `# Prueba de humo del lote C (con el modelo real)\n\nFecha: ${new Date().toISOString()}\n\n**La corrida falló**: categoría \`${e.category}\` (HTTP ${res.status}). Mensaje: ${e.message}\n\nPasos de la traza hasta el fallo: ${(e.trace ?? []).length}. Tiempo: ${seconds} s.\n`;
} else {
  const cites = body.findings.flatMap((f) => f.citations);
  const ok = cites.filter((c) => c.verified).length;
  const tools = {};
  for (const s of body.trace) if (s.type === 'tool' || s.type === 'tool_error') tools[s.name] = (tools[s.name] ?? 0) + 1;
  md = [
    '# Prueba de humo del lote C (con el modelo real)',
    '',
    `Fecha: ${new Date().toISOString()} · Archivos de ejemplo ficticios (tests/fixtures/). Este resumen no contiene la clave ni texto de documentos.`,
    '',
    `- Modelo: \`${body.run.model}\` · razonamiento: ${body.run.reasoning ?? 'sin parámetro'}`,
    `- Iteraciones: ${body.run.iterations}${body.run.partial ? ' (**parcial**: se alcanzó un tope)' : ''}`,
    `- Tokens: entrada ${body.run.tokens.input}, salida ${body.run.tokens.output}, total ${body.run.tokens.total}`,
    `- Tiempo total: ${seconds} s`,
    lineaDeCosto(body.run.model, body.run.tokens, process.env),
    `- Hallazgos: ${body.findings.length} (verificados: ${body.findings.filter((f) => f.verified).length})`,
    `- Citas: ${cites.length} (verificadas: ${ok}, no verificadas: ${cites.length - ok})`,
    `- Herramientas usadas: ${Object.entries(tools).map(([k, v]) => `${k} ×${v}`).join(', ') || 'ninguna'}`,
    `- Verificaciones fallidas: ${body.trace.filter((s) => s.type === 'verification' && !s.ok).length}`,
    `- Avisos: ${body.warnings.map((w) => w.code).join(', ') || 'ninguno'}`,
    '',
  ].join('\n');
}
mkdirSync('docs/evidencia', { recursive: true });
writeFileSync('docs/evidencia/humo-real.md', md);
console.log(md.split('\n').filter((l) => l.startsWith('- ') || l.startsWith('**')).join('\n'));
console.log('\nResumen escrito en docs/evidencia/humo-real.md');
