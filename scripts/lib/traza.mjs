// Guardado local de la traza completa de la prueba de humo (opción --guardar-traza). Funciones probadas.
// La traza puede contener texto de los documentos ficticios (citas, fragmentos), por eso va en una carpeta
// ignorada por git (.local/trazas/) y NUNCA se sube ni la revisa check-secrets (que solo mira archivos versionados).
// Defensa: antes de escribir se busca cualquier clave en el contenido; si aparece, NO se escribe nada.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanText } from './secrets.mjs';

export const TRACE_DIR = '.local/trazas';

/** ¿Se pidió guardar la traza? */
export function wantsTrace(argv) {
  return argv.includes('--guardar-traza');
}

/** Registro completo a guardar: respuesta del servicio (éxito o error), sin transformar. */
export function buildTraceRecord({ status, body, seconds, projectId, at = new Date() }) {
  return { savedAt: at.toISOString(), projectId, httpStatus: status, seconds: Number(seconds), response: body };
}

/**
 * @param {unknown} record
 * @param {{ dir?: string, extraSecrets?: Array<string | undefined>, now?: Date }} [opts]
 * Escribe la traza en `dir`. Lanza (sin imprimir la clave) si el contenido parece contener una clave. `extraSecrets`: valores exactos a vetar.
 */
export function saveTrace(record, { dir = TRACE_DIR, extraSecrets = [], now = new Date() } = {}) {
  const text = JSON.stringify(record, null, 2);
  const hits = scanText('traza.json', text);
  const exact = extraSecrets.filter((s) => typeof s === 'string' && s.length >= 8 && text.includes(s));
  if (hits.length > 0 || exact.length > 0) {
    const rules = [...new Set(hits.map((h) => h.rule)), ...(exact.length ? ['clave-exacta'] : [])].join(', ');
    throw new Error(`La traza parece contener una clave (regla: ${rules}); no se guardó nada.`);
  }
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `traza-${now.toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, text + '\n', { mode: 0o600 });
  return file;
}
