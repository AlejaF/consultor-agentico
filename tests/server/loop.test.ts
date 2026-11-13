import { describe, expect, it } from 'vitest';
import { runLoop } from '../../server/src/agent/loop.ts';
import { z, type AgentTool } from '../../server/src/agent/tools.ts';
import { createTrace } from '../../server/src/agent/trace.ts';
import { ModelError } from '../../server/src/model/client.ts';
import { createFakeClient, type Step } from '../../server/src/model/fake.ts';

const echo: AgentTool = {
  name: 'eco',
  description: 'eco',
  schema: z.object({ texto: z.string() }),
  run: ({ texto }: { texto: string }) => ({ ok: true, output: { ok: true, eco: texto }, summary: 'eco ok' }),
} as AgentTool;
const call = (arguments_: unknown, name = 'eco'): Step => ({ toolCalls: [{ name, arguments: arguments_ }] });
const limits = { maxIterations: 10, maxInputChars: 120000, maxOutputTokens: 100 };

function run(script: Step[], over: Partial<Parameters<typeof runLoop>[0]> = {}) {
  const client = createFakeClient(script);
  const trace = createTrace();
  const p = runLoop({ client, model: 'm', system: 's', userMessage: 'u', tools: [echo], trace, limits, ...over });
  return { client, trace, p };
}

describe('bucle del agente', () => {
  it('ejecuta la herramienta, devuelve el resultado al modelo y termina con el texto final', async () => {
    const { client, trace, p } = run([call({ texto: 'hola' }), { text: 'fin' }]);
    expect(await p).toMatchObject({ status: 'done', text: 'fin' });
    expect(trace.steps).toMatchObject([{ type: 'tool', name: 'eco', ok: true, resultSummary: 'eco ok' }]);
    const last = client.requests[1]!.input.at(-1)!;
    expect(last).toMatchObject({ type: 'function_call_output' });
    expect(JSON.parse((last as { output: string }).output)).toEqual({ ok: true, eco: 'hola' });
  });

  it('tope de iteraciones → resultado parcial con aviso iteration_limit', async () => {
    const { trace, p } = run(Array.from({ length: 5 }, () => call({ texto: 'x' })), { limits: { ...limits, maxIterations: 3 } });
    expect(await p).toMatchObject({ status: 'partial' });
    expect(trace.iterations).toBe(3);
    expect(trace.steps.at(-1)).toMatchObject({ type: 'warning', code: 'iteration_limit' });
  });

  it('tope de tamaño de entrada, comprobado antes de cada llamada → parcial con aviso input_truncated', async () => {
    const { client, trace, p } = run([call({ texto: 'x'.repeat(500) }), call({ texto: 'y' })], { limits: { ...limits, maxInputChars: 400 } });
    expect(await p).toMatchObject({ status: 'partial' });
    expect(client.calls).toBe(1); // la segunda llamada no se hizo
    expect(trace.steps.at(-1)).toMatchObject({ type: 'warning', code: 'input_truncated' });
  });

  it.each([
    ['JSON roto', '{no es json'],
    ['esquema incumplido', { texto: 5 }],
  ])('argumentos mal formados (%s): se devuelven al agente, se registran y no se lanza excepción', async (_n, args) => {
    const { client, trace, p } = run([call(args), { text: 'fin' }]);
    expect(await p).toMatchObject({ status: 'done' });
    const out = JSON.parse((client.requests[1]!.input.at(-1) as { output: string }).output);
    expect(out.ok).toBe(false);
    expect(typeof out.error).toBe('string');
    expect(trace.steps).toMatchObject([{ type: 'tool_error', name: 'eco' }]);
    expect(trace.errors()).toHaveLength(1);
  });

  it('herramienta desconocida: igual que argumentos mal formados', async () => {
    const { client, trace, p } = run([{ toolCalls: [{ name: 'borrar_todo', arguments: {} }], allowUndeclared: true }, { text: 'fin' }]);
    expect(await p).toMatchObject({ status: 'done' });
    expect(JSON.parse((client.requests[1]!.input.at(-1) as { output: string }).output)).toMatchObject({ ok: false });
    expect(trace.steps[0]).toMatchObject({ type: 'tool_error', name: 'borrar_todo' });
  });

  it('una herramienta que lanza una excepción no tumba la corrida', async () => {
    const roto: AgentTool = { ...echo, name: 'roto', run: () => { throw new Error('secreto interno'); } };
    const { trace, p } = run([call({ texto: 'a' }, 'roto'), { text: 'fin' }], { tools: [roto] });
    expect(await p).toMatchObject({ status: 'done' });
    expect(JSON.stringify(trace.steps)).not.toContain('secreto interno');
  });

  it.each(['spend_limit', 'balance', 'auth', 'usage_limit'] as const)('error %s → termina de inmediato con UNA sola llamada (cero reintentos)', async (category) => {
    const { client, trace, p } = run([{ throw: new ModelError(category, 'msg') }, { text: 'no debería llegar' }]);
    const r = await p;
    expect(r.status).toBe('error');
    expect(r.error?.category).toBe(category);
    expect(client.calls).toBe(1);
    expect(trace.steps).toMatchObject([{ type: 'model_error', category }]);
  });

  it('rate_limit y provider_unavailable tampoco se reintentan solos', async () => {
    for (const category of ['rate_limit', 'provider_unavailable'] as const) {
      const { client, p } = run([{ throw: new ModelError(category, 'm') }, { text: 'x' }]);
      expect((await p).status).toBe('error');
      expect(client.calls).toBe(1);
    }
  });

  it('el AbortSignal corta la corrida', async () => {
    const ctrl = new AbortController();
    const { client, trace, p } = run([{ hang: true }], { signal: ctrl.signal });
    setTimeout(() => ctrl.abort(), 20);
    expect(await p).toMatchObject({ status: 'aborted' });
    expect(client.aborted).toBe(true);
    expect(trace.steps.at(-1)).toMatchObject({ type: 'warning', code: 'aborted' });
  });

  it('la traza incluye el modelo, los tokens y los errores', async () => {
    const { trace, p } = run([{ toolCalls: [{ name: 'eco', arguments: '{' }], usage: { input: 30, output: 7 } }, { text: 'fin', usage: { input: 50, output: 3 } }]);
    await p;
    expect(trace.model).toBe('m');
    expect(trace.tokens).toMatchObject({ input: 80, output: 10 });
    expect(trace.iterations).toBe(2);
    expect(trace.errors()).toHaveLength(1);
  });
});
