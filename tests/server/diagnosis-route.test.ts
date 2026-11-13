import { request } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { buildServer } from '../../server/src/app.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createLogger } from '../../server/src/log.ts';
import { ModelError } from '../../server/src/model/client.ts';
import { createFakeClient, type FakeClient, type Step } from '../../server/src/model/fake.ts';
import { createStore } from '../../server/src/store.ts';

const KEY = 'sk-' + 'proj-' + 'Kk4_'.repeat(12);
const HOST = { host: '127.0.0.1:8787' };
const FRASE = 'Los indicadores se calculan a mano cada mes y no hay responsable.';
let toClose: Array<{ close: () => Promise<unknown> }> = [];
afterEach(async () => {
  for (const s of toClose) await s.close();
  toClose = [];
});

function store() {
  const s = createStore();
  const info = (id: string, name: string, status: 'extracted' | 'failed') => ({ id, name, type: 'text/plain', size: 10, status, chars: 10, chunkCount: 1 });
  s.putFile('P-A', info('f1', 'notas.txt', 'extracted'), [{ location: { kind: 'line', n: 1 }, text: FRASE }]);
  s.putFile('P-A', info('f2', 'roto.pdf', 'failed'), []);
  return s;
}
async function make(script: Step[], env: Record<string, string> = {}, st = store()) {
  const client = createFakeClient(script);
  const app = await buildServer(loadConfig({ MODEL_PROVIDER: 'fake', OPENAI_MODEL_DIAGNOSTICO: 'modelo-d', OPENAI_API_KEY: KEY, ...env }), createLogger(() => {}), st, { modelClient: client });
  toClose.push(app);
  return { app, client };
}
const post = (app: Awaited<ReturnType<typeof make>>['app'], payload: unknown) => app.inject({ method: 'POST', url: '/api/diagnosis/run', headers: HOST, payload: payload as never });

const GUION: Step[] = [
  { toolCalls: [{ name: 'buscar_en_evidencia', arguments: { consulta: 'indicadores responsable' } }] },
  { toolCalls: [{ name: 'registrar_hallazgo', arguments: { pilar: 'datos', titulo: 'Indicadores manuales', texto: 'Se calculan a mano.', citas: [{ archivo: 'notas.txt', ubicacion: 'línea 1', fragmento: 'se calculan a mano cada mes' }] } }] },
  { toolCalls: [{ name: 'declarar_informacion_faltante', arguments: { pilar: 'talento', descripcion: 'Falta el plan de formación.' } }] },
  { text: 'Resumen final.' },
];

describe('POST /api/diagnosis/run', () => {
  it('devuelve run, findings, missingInfo, trace y warnings con la forma del contrato', async () => {
    const { app, client } = await make(GUION);
    const r = await post(app, { projectId: 'P-A', empresa: 'Empresa Ficticia Alfa' });
    expect(r.statusCode).toBe(200);
    const b = r.json();
    expect(b.run).toMatchObject({ stage: 'diagnosis', model: 'modelo-d', iterations: 4, partial: false, tokens: { input: 400, output: 80, total: 480 } });
    expect(b.findings).toEqual([{ id: 'R1', dimension: 'datos', title: 'Indicadores manuales', text: 'Se calculan a mano.', verified: true, citations: [{ file: 'notas.txt', location: { kind: 'line', n: 1 }, quote: 'se calculan a mano cada mes', verified: true }] }]);
    expect(b.missingInfo).toEqual([{ dimension: 'talento', description: 'Falta el plan de formación.' }]);
    // La verificación de la cita queda registrada justo antes del paso de la herramienta que la pidió.
    expect(b.trace.map((s: { name?: string; type: string }) => s.name ?? s.type)).toEqual(['buscar_en_evidencia', 'verification', 'registrar_hallazgo', 'declarar_informacion_faltante']);
    expect(b.warnings).toEqual([]);
    expect(r.body).not.toContain(KEY);
    expect(client.requests[0]!.model).toBe('modelo-d');
  });

  it('usa solo archivos extraídos: el fallido no es visible para el agente', async () => {
    const { app, client } = await make([{ toolCalls: [{ name: 'buscar_en_evidencia', arguments: { consulta: 'indicadores' } }] }, { text: 'x' }]);
    await post(app, { projectId: 'P-A' });
    const out = (client.requests[1]!.input.at(-1) as { output: string }).output;
    expect(out).toContain('notas.txt');
    expect(out).not.toContain('roto.pdf');
  });

  it('sin modelo configurado → no_model_configured diciendo qué variable falta', async () => {
    const { app, client } = await make(GUION, { OPENAI_MODEL_DIAGNOSTICO: '' });
    const r = await post(app, { projectId: 'P-A' });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toMatchObject({ category: 'no_model_configured' });
    expect(r.json().error.message).toContain('OPENAI_MODEL_DIAGNOSTICO');
    expect(client.calls).toBe(0);
  });

  it('sin clave (proveedor real) → auth, sin llamar al modelo', async () => {
    const { app, client } = await make(GUION, { MODEL_PROVIDER: 'openai', OPENAI_API_KEY: '' });
    const r = await post(app, { projectId: 'P-A' });
    expect(r.statusCode).toBe(401);
    expect(r.json().error.category).toBe('auth');
    expect(client.calls).toBe(0);
  });

  it('cuerpo inválido → 400; proyecto sin archivos extraídos → 422', async () => {
    const { app } = await make(GUION);
    expect((await post(app, { projectId: 'x y' })).statusCode).toBe(400);
    expect((await post(app, { projectId: 'P-ZZ' })).statusCode).toBe(422);
  });

  it('error de gasto del proveedor → formato de error con la traza hasta ese punto en error.trace y UNA sola llamada', async () => {
    const { app, client } = await make([{ toolCalls: [{ name: 'buscar_en_evidencia', arguments: { consulta: 'indicadores' } }] }, { throw: new ModelError('spend_limit', 'Se alcanzó el límite de gasto.') }, { text: 'no' }]);
    const r = await post(app, { projectId: 'P-A' });
    expect(r.statusCode).toBe(402);
    const e = r.json().error;
    expect(e).toMatchObject({ category: 'spend_limit', retryable: false });
    expect(e.trace.map((s: { type: string }) => s.type)).toEqual(['tool', 'model_error']);
    expect(client.calls).toBe(2);
  });

  it('límite de tasa → 429 con retryAfterSeconds y retryable informativo', async () => {
    const { app } = await make([{ throw: new ModelError('rate_limit', 'Demasiadas solicitudes.', { retryAfterSeconds: 12 }) }]);
    const r = await post(app, { projectId: 'P-A' });
    expect(r.statusCode).toBe(429);
    expect(r.json().error).toMatchObject({ category: 'rate_limit', retryable: true, retryAfterSeconds: 12 });
  });

  it('tope de iteraciones → 200 con partial:true y aviso', async () => {
    const loop = Array.from({ length: 5 }, (): Step => ({ toolCalls: [{ name: 'buscar_en_evidencia', arguments: { consulta: 'indicadores' } }] }));
    const { app } = await make(loop, { MAX_ITERATIONS: '2' });
    const b = (await post(app, { projectId: 'P-A' })).json();
    expect(b.run).toMatchObject({ partial: true, iterations: 2 });
    expect(b.warnings).toMatchObject([{ code: 'iteration_limit' }]);
  });

  it('una segunda solicitud simultánea del mismo proyecto → 409; otro proyecto no se bloquea', async () => {
    const st = store();
    st.putFile('P-B', { id: 'g1', name: 'b.txt', type: 'text/plain', size: 1, status: 'extracted', chars: 1, chunkCount: 1 }, [{ location: { kind: 'line', n: 1 }, text: 'texto' }]);
    const { app } = await make([{ hang: true }, { text: 'a' }, { text: 'b' }], {}, st);
    // la primera queda colgada hasta que cerremos la conexión real
    await app.listen({ host: '127.0.0.1', port: 0 });
    const port = (app.server.address() as { port: number }).port;
    app.allowedHosts.add(`127.0.0.1:${port}`);
    const first = request({ host: '127.0.0.1', port, path: '/api/diagnosis/run', method: 'POST', headers: { 'content-type': 'application/json' } });
    first.on('error', () => {});
    first.end(JSON.stringify({ projectId: 'P-A' }));
    await new Promise((r) => setTimeout(r, 100));
    const second = await app.inject({ method: 'POST', url: '/api/diagnosis/run', headers: { host: `127.0.0.1:${port}` }, payload: { projectId: 'P-A' } });
    expect(second.statusCode).toBe(409);
    const other = await app.inject({ method: 'POST', url: '/api/diagnosis/run', headers: { host: `127.0.0.1:${port}` }, payload: { projectId: 'P-B' } });
    expect(other.statusCode).toBe(200);
    first.destroy();
  });

  it('si el cliente cierra la conexión, se aborta la corrida, se descarta el resultado y el proyecto queda libre', async () => {
    const { app, client } = await make([{ hang: true }, { text: 'segunda' }]);
    await app.listen({ host: '127.0.0.1', port: 0 });
    const port = (app.server.address() as { port: number }).port;
    app.allowedHosts.add(`127.0.0.1:${port}`);
    const req = request({ host: '127.0.0.1', port, path: '/api/diagnosis/run', method: 'POST', headers: { 'content-type': 'application/json' } });
    req.on('error', () => {});
    req.end(JSON.stringify({ projectId: 'P-A' }));
    await new Promise((r) => setTimeout(r, 100));
    expect((client as FakeClient).aborted).toBe(false);
    req.destroy();
    for (let i = 0; i < 50 && !(client as FakeClient).aborted; i++) await new Promise((r) => setTimeout(r, 20));
    expect((client as FakeClient).aborted).toBe(true);
    await new Promise((r) => setTimeout(r, 50));
    const again = await app.inject({ method: 'POST', url: '/api/diagnosis/run', headers: { host: `127.0.0.1:${port}` }, payload: { projectId: 'P-A' } });
    expect(again.statusCode).toBe(200); // ya no está «en curso»
  });
});
