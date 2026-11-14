// Lote E · T098 (AG-019; contracts/api.md): POST /api/strategy/run.
import { afterEach, describe, expect, it } from 'vitest';
import { buildServer } from '../../server/src/app.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createLogger } from '../../server/src/log.ts';
import { createFakeClient, type FakeClient, type Step } from '../../server/src/model/fake.ts';
import { ModelError } from '../../server/src/model/client.ts';
import { createStore } from '../../server/src/store.ts';

const KEY = 'sk-' + 'proj-' + 'Kk4_'.repeat(12);
const HOST = { host: '127.0.0.1:8787' };
let toClose: Array<{ close: () => Promise<unknown> }> = [];
afterEach(async () => {
  for (const s of toClose) await s.close();
  toClose = [];
});
const finding = (id: string, extra: Record<string, unknown> = {}) => ({ id, dimension: 'datos', title: `Hallazgo ${id}`, text: 'Texto vigente.', state: 'accepted', quotes: [{ file: 'a.txt', location: { kind: 'line', n: 1 }, quote: 'una cita literal de ejemplo' }], ...extra });
async function setup(script: Step[], env: Record<string, string> = {}) {
  const client: FakeClient = createFakeClient(script);
  const store = createStore();
  const app = await buildServer(loadConfig({ MODEL_PROVIDER: 'fake', OPENAI_MODEL_ESTRATEGIA: 'modelo-e', OPENAI_API_KEY: KEY, ...env }), createLogger(() => {}), store, { modelClient: client });
  toClose.push(app);
  return { app, client, store };
}
const post = (app: Awaited<ReturnType<typeof setup>>['app'], payload: object) => app.inject({ method: 'POST', url: '/api/strategy/run', headers: HOST, payload });
const el = (tipo: 'riesgo' | 'fase', derivaDe: string[]): Step => ({
  toolCalls: [{ name: 'registrar_elemento', arguments: tipo === 'riesgo' ? { tipo, titulo: 'Un riesgo', texto: 'Detalle del riesgo.', nivel: 'medio', derivaDe } : { tipo, titulo: 'Una fase', texto: 'Detalle de la fase.', horizonte: '3-6 meses', derivaDe } }],
});

describe('POST /api/strategy/run', () => {
  it('devuelve run, risks, route (con supportedBy), trace y warnings', async () => {
    const { app } = await setup([el('riesgo', ['R1']), el('fase', ['R1', 'R2']), { text: 'Listo.' }]);
    const r = await post(app, { projectId: 'P-A', empresa: 'Empresa Ficticia Alfa', findings: [finding('R1'), finding('R2', { state: 'edited' })] });
    expect(r.statusCode).toBe(200);
    const b = r.json();
    expect(Object.keys(b).sort()).toEqual(['risks', 'route', 'run', 'trace', 'warnings']);
    expect(b.run).toMatchObject({ stage: 'strategy', model: 'modelo-e', partial: false });
    expect(b.risks[0]).toMatchObject({ label: 'Un riesgo', level: 'medio', supportedBy: ['R1'] });
    expect(b.route[0]).toMatchObject({ label: 'Una fase', horizon: '3-6 meses', supportedBy: ['R1', 'R2'] });
  });
  it('exige findings no vacío, con ids únicos, y no llama al modelo si no (sin hallazgos respaldados no hay estrategia)', async () => {
    const { app, client } = await setup([{ text: 'x' }]);
    expect((await post(app, { projectId: 'P-A', findings: [] })).statusCode).toBe(400);
    expect((await post(app, { projectId: 'P-A' })).statusCode).toBe(400);
    expect((await post(app, { projectId: 'P-A', findings: [finding('R1'), finding('R1')] })).statusCode).toBe(400);
    expect((await post(app, { projectId: 'P-A', findings: [finding('R1', { state: 'rejected' })] })).statusCode).toBe(400);
    expect((await post(app, { projectId: 'P-A', findings: [finding('R1', { state: 'pending' })] })).statusCode).toBe(400);
    expect(client.calls).toBe(0);
  });
  it('sin modelo configurado para la estrategia: 400 no_model_configured y sin llamar al modelo', async () => {
    const { app, client } = await setup([{ text: 'x' }], { OPENAI_MODEL_ESTRATEGIA: '' });
    const r = await post(app, { projectId: 'P-A', findings: [finding('R1')] });
    expect(r.statusCode).toBe(400);
    expect(r.json().error.category).toBe('no_model_configured');
    expect(client.calls).toBe(0);
  });
  it('el servicio no conserva los hallazgos: el almacén no gana archivos ni estado', async () => {
    const { app, store } = await setup([el('riesgo', ['R1']), { text: 'ok' }]);
    await post(app, { projectId: 'P-A', findings: [finding('R1')] });
    expect(store.searchableFiles('P-A')).toHaveLength(0);
  });
  it('un resultado parcial por tope de iteraciones se marca partial y avisa', async () => {
    const { app } = await setup([el('riesgo', ['R1']), el('riesgo', ['R1']), el('riesgo', ['R1'])], { MAX_ITERATIONS: '2' });
    const r = await post(app, { projectId: 'P-A', findings: [finding('R1')] });
    expect(r.statusCode).toBe(200);
    expect(r.json().run.partial).toBe(true);
    expect(r.json().warnings.some((w: { code: string }) => w.code === 'iteration_limit')).toBe(true);
  });
  it('un error del proveedor (saldo) devuelve su categoría y la traza, con UNA sola llamada', async () => {
    const { app, client } = await setup([{ throw: new ModelError('balance', 'Se agotó el saldo prepago.') }, { text: 'no debe llegar' }]);
    const r = await post(app, { projectId: 'P-A', findings: [finding('R1')] });
    expect(r.statusCode).toBe(402);
    expect(r.json().error.category).toBe('balance');
    expect(Array.isArray(r.json().error.trace)).toBe(true);
    expect(client.calls).toBe(1);
  });
});
