import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildServer } from '../../server/src/app.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createLogger } from '../../server/src/log.ts';
import { ModelError } from '../../server/src/model/client.ts';
import { createFakeClient, type Step } from '../../server/src/model/fake.ts';
import { createStore } from '../../server/src/store.ts';
import { buildTraceRecord, saveTrace, TRACE_DIR, wantsTrace } from '../../scripts/lib/traza.mjs';

// Clave inventada y armada en tiempo de ejecución.
const KEY = 'sk-' + 'proj-' + 'Qq7_'.repeat(12);
const FRASE = 'Los indicadores se calculan a mano cada mes y no hay responsable.';
const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'traza-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

async function run(script: Step[]) {
  const st = createStore();
  st.putFile('P-A', { id: 'f1', name: 'notas.txt', type: 'text/plain', size: 10, status: 'extracted', chars: 10, chunkCount: 1 }, [{ location: { kind: 'line', n: 1 }, text: FRASE }]);
  const app = await buildServer(loadConfig({ MODEL_PROVIDER: 'fake', OPENAI_MODEL_DIAGNOSTICO: 'modelo-d', OPENAI_API_KEY: KEY }), createLogger(() => {}), st, { modelClient: createFakeClient(script) });
  const r = await app.inject({ method: 'POST', url: '/api/diagnosis/run', headers: { host: '127.0.0.1:8787' }, payload: { projectId: 'P-A' } });
  await app.close();
  return r;
}

const OK: Step[] = [
  { toolCalls: [{ name: 'buscar_en_evidencia', arguments: { consulta: 'indicadores' } }] },
  { toolCalls: [{ name: 'registrar_hallazgo', arguments: { pilar: 'datos', titulo: 'Indicadores manuales', texto: 'Se calculan a mano.', citas: [{ archivo: 'notas.txt', ubicacion: 'línea 1', fragmento: 'se calculan a mano cada mes' }] } }] },
  { text: 'Resumen final.' },
];

describe('--guardar-traza', () => {
  it('solo se activa con la opción', () => {
    expect(wantsTrace(['--guardar-traza'])).toBe(true);
    expect(wantsTrace([])).toBe(false);
  });

  it('guarda la respuesta completa (con texto de los documentos ficticios) y nunca la clave', async () => {
    const r = await run(OK);
    const dir = tmp();
    const file = saveTrace(buildTraceRecord({ status: r.statusCode, body: r.json(), seconds: '1.2', projectId: 'P-A' }), { dir });
    const text = readFileSync(file, 'utf8');
    expect(JSON.parse(text).response.trace.length).toBeGreaterThan(0);
    expect(text).toContain('se calculan a mano cada mes'); // texto del documento ficticio, en la cita
    expect(text).not.toContain(KEY);
    expect(statSync(file).mode & 0o077).toBe(0); // solo la persona dueña puede leerlo
    expect(readdirSync(dir)).toHaveLength(1);
  });

  it('también guarda la corrida fallida (error del proveedor con su traza)', async () => {
    const err = new ModelError('invalid_request', 'OpenAI rechazó la solicitud (HTTP 400, código «unsupported_parameter»).', { providerCode: 'unsupported_parameter', providerStatus: 400 });
    const r = await run([{ throw: err }]);
    const file = saveTrace(buildTraceRecord({ status: r.statusCode, body: r.json(), seconds: 0.1, projectId: 'P-A' }), { dir: tmp() });
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    expect(saved.httpStatus).toBe(502);
    expect(saved.response.error.category).toBe('invalid_request');
  });

  it('se niega a escribir si el contenido trae una clave (con forma de clave o exacta) y no deja archivo', () => {
    const dir = join(tmp(), 'nueva');
    const record = (extra: string) => buildTraceRecord({ status: 200, body: { nota: extra }, seconds: 1, projectId: 'P-A' });
    expect(() => saveTrace(record(`fuga ${KEY}`), { dir })).toThrow(/no se guardó nada/);
    expect(() => saveTrace(record('valor-secreto-exacto-123'), { dir, extraSecrets: ['valor-secreto-exacto-123'] })).toThrow(/clave-exacta/);
    try {
      saveTrace(record(`fuga ${KEY}`), { dir });
    } catch (e) {
      expect((e as Error).message).not.toContain(KEY); // el aviso tampoco imprime la clave
    }
    expect(existsSync(dir)).toBe(false);
  });
});

describe('carpeta de trazas y repositorio', () => {
  it('git la ignora, así que check-secrets (solo archivos versionados) no la revisa ni se sube', () => {
    const ignored = execFileSync('git', ['check-ignore', `${TRACE_DIR}/traza-ejemplo.json`], { encoding: 'utf8' }).trim();
    expect(ignored).toBe(`${TRACE_DIR}/traza-ejemplo.json`);
    const gi = readFileSync('.gitignore', 'utf8');
    expect(gi).toMatch(/^\.local\/trazas\/$/m);
  });
});
