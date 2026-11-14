// Lote D2 · T141 (AG-031 puntos 3, 4 y 8): la corrida devuelve siempre seis dimensiones, completadas por el CÓDIGO, y ningún índice.
import { afterEach, describe, expect, it } from 'vitest';
import { buildServer } from '../../server/src/app.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createLogger } from '../../server/src/log.ts';
import { createFakeClient, type Step } from '../../server/src/model/fake.ts';
import { createStore } from '../../server/src/store.ts';

const KEY = 'sk-' + 'proj-' + 'Kk4_'.repeat(12);
const HOST = { host: '127.0.0.1:8787' };
const DIMS = ['estrategia', 'infraestructura', 'datos', 'gobernanza', 'talento', 'cultura'];
let toClose: Array<{ close: () => Promise<unknown> }> = [];
afterEach(async () => {
  for (const s of toClose) await s.close();
  toClose = [];
});

function store() {
  const s = createStore();
  s.putFile('P-A', { id: 'f1', name: 'notas.txt', type: 'text/plain', size: 10, status: 'extracted', chars: 10, chunkCount: 2 }, [
    { location: { kind: 'line', n: 1 }, text: 'Los indicadores se calculan a mano cada mes y no hay responsable.' },
    { location: { kind: 'line', n: 2 }, text: 'La dirección aprobó un presupuesto anual para automatizar procesos.' },
  ]);
  return s;
}
async function run(script: Step[]) {
  const app = await buildServer(loadConfig({ MODEL_PROVIDER: 'fake', OPENAI_MODEL_DIAGNOSTICO: 'modelo-d', OPENAI_API_KEY: KEY }), createLogger(() => {}), store(), { modelClient: createFakeClient(script) });
  toClose.push(app);
  return app.inject({ method: 'POST', url: '/api/diagnosis/run', headers: HOST, payload: { projectId: 'P-A' } });
}
const hallazgo = (pilar: string, titulo: string, n: number, frag: string): Step => ({ toolCalls: [{ name: 'registrar_hallazgo', arguments: { pilar, titulo, texto: 'Texto del hallazgo.', citas: [{ archivo: 'notas.txt', ubicacion: `línea ${n}`, fragmento: frag }] } }] });
const nivel = (dimension: string, derivaDe: string[], n = 3): Step => ({ toolCalls: [{ name: 'registrar_nivel_madurez', arguments: { dimension, nivel: n, justificacion: 'Justificación corta.', derivaDe } }] });
const F1 = 'se calculan a mano cada mes y no hay responsable';
const F2 = 'La dirección aprobó un presupuesto anual';

describe('POST /api/diagnosis/run · madurez', () => {
  it('devuelve siempre seis entradas; las que el modelo no registró las completa el código como «sin evidencia»', async () => {
    const r = await run([hallazgo('datos', 'Datos manuales', 1, F1), nivel('datos', ['R1'], 2), { text: 'Fin.' }]);
    expect(r.statusCode).toBe(200);
    const m = r.json().maturity as Array<Record<string, unknown>>;
    expect(m.map((x) => x.dimension)).toEqual(DIMS);
    expect(m.find((x) => x.dimension === 'datos')).toEqual({ dimension: 'datos', level: 2, insufficient: false, justification: 'Justificación corta.', derivesFrom: ['R1'] });
    for (const x of m.filter((y) => y.dimension !== 'datos')) expect(x).toEqual({ dimension: x.dimension, level: null, insufficient: true, justification: '', derivesFrom: [] });
  });
  it('sin ningún nivel registrado igual trae las seis, todas «sin evidencia»', async () => {
    const r = await run([{ text: 'Nada que registrar.' }]);
    const m = r.json().maturity as Array<{ insufficient: boolean }>;
    expect(m).toHaveLength(6);
    expect(m.every((x) => x.insufficient)).toBe(true);
  });
  it('la respuesta NO incluye ningún índice global, aunque el modelo lo intente', async () => {
    const r = await run([
      hallazgo('datos', 'Datos manuales', 1, F1),
      { toolCalls: [{ name: 'registrar_nivel_madurez', arguments: { dimension: 'datos', nivel: 3, justificacion: 'ok ok', derivaDe: ['R1'], indice: 4.9 } }] },
      nivel('datos', ['R1']),
      { text: 'Fin.' },
    ]);
    const body = r.json();
    expect(Object.keys(body).sort()).toEqual(['findings', 'maturity', 'missingInfo', 'run', 'trace', 'warnings']);
    expect(r.body).not.toMatch(/"(indice|índice|index|maturityIndex|promedio|average)"/i);
    expect(r.body).not.toContain('4.9');
  });
  it('un modelo que cita un hallazgo NO verificado deja la dimensión «sin evidencia» y el rechazo queda en la traza', async () => {
    const bad = 'frase que no está en ningún documento del proyecto';
    const script: Step[] = [hallazgo('cultura', 'Cultura sin respaldo', 1, bad), hallazgo('cultura', 'Cultura sin respaldo', 1, bad), hallazgo('cultura', 'Cultura sin respaldo', 1, bad), nivel('cultura', ['R1']), nivel('cultura', ['R1']), nivel('cultura', ['R1']), { text: 'Fin.' }];
    const r = await run(script);
    const body = r.json();
    expect(body.findings[0]).toMatchObject({ id: 'R1', verified: false });
    expect(body.maturity.find((x: { dimension: string }) => x.dimension === 'cultura')).toMatchObject({ level: null, insufficient: true });
    const rejected = body.trace.filter((s: { type: string; findingTempId?: string; ok: boolean }) => s.type === 'verification' && String(s.findingTempId).startsWith('nivel:') && !s.ok);
    expect(rejected.length).toBeGreaterThanOrEqual(1);
  });
  it('dos dimensiones con respaldo conservan su nivel', async () => {
    const r = await run([hallazgo('datos', 'Datos manuales', 1, F1), hallazgo('estrategia', 'Presupuesto', 2, F2), nivel('datos', ['R1'], 2), nivel('estrategia', ['R2'], 4), { text: 'Fin.' }]);
    const m = r.json().maturity as Array<{ dimension: string; level: number | null }>;
    expect(m.filter((x) => x.level !== null).map((x) => [x.dimension, x.level])).toEqual([['estrategia', 4], ['datos', 2]]);
  });
});
