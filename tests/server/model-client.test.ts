import { describe, expect, it } from 'vitest';
import { ModelError, type ModelRequest } from '../../server/src/model/client.ts';
import { createFakeClient } from '../../server/src/model/fake.ts';
import { createOpenAIClient, toModelError } from '../../server/src/model/openai.ts';

// Clave inventada y armada en tiempo de ejecución (el archivo no contiene ninguna cadena con forma de clave).
const KEY = 'sk-' + 'proj-' + 'Zz9_'.repeat(12);
const req = (tools: string[] = ['t1']): ModelRequest => ({
  model: 'm',
  system: 's',
  input: [{ type: 'message', role: 'user', content: 'hola' }],
  tools: tools.map((name) => ({ name, description: name, parameters: {} })),
  maxOutputTokens: 100,
});

describe('cliente FALSO guionado', () => {
  it('devuelve en orden llamadas, texto y errores', async () => {
    const f = createFakeClient([{ toolCalls: [{ name: 't1', arguments: { a: 1 } }] }, { text: 'listo' }, { throw: new ModelError('balance', 'x') }]);
    const a = await f.respond(req());
    expect(a.toolCalls).toMatchObject([{ name: 't1', rawArguments: '{"a":1}' }]);
    expect(await f.respond(req())).toMatchObject({ text: 'listo', toolCalls: [] });
    await expect(f.respond(req())).rejects.toMatchObject({ category: 'balance' });
    expect(f.calls).toBe(3);
  });
  it('falla si el guion se agota', async () => {
    const f = createFakeClient([{ text: 'a' }]);
    await f.respond(req());
    await expect(f.respond(req())).rejects.toThrow(/se agotó/);
  });
  it('falla si se invoca una herramienta no declarada', async () => {
    const f = createFakeClient([{ toolCalls: [{ name: 'otra', arguments: {} }] }]);
    await expect(f.respond(req(['t1']))).rejects.toThrow(/no está declarada/);
  });
  it('envía una cadena cruda tal cual (para probar JSON roto)', async () => {
    const f = createFakeClient([{ toolCalls: [{ name: 't1', arguments: '{roto' }] }]);
    expect((await f.respond(req())).toolCalls[0]!.rawArguments).toBe('{roto');
  });
});

describe('traducción de errores del proveedor (por error.code)', () => {
  const cat = (e: object) => toModelError(e).category;
  it('límite de gasto → spend_limit', () => {
    expect(cat({ status: 429, code: 'organization_spend_limit_exceeded' })).toBe('spend_limit');
    expect(cat({ status: 429, code: 'project_spend_limit_exceeded' })).toBe('spend_limit');
  });
  it('saldo → balance (también insufficient_quota, aunque venga como 429)', () => {
    expect(cat({ status: 402, code: 'credit_balance_exhausted' })).toBe('balance');
    expect(cat({ status: 429, code: 'insufficient_quota' })).toBe('balance');
    expect(cat({ status: 429, type: 'insufficient_quota' })).toBe('balance');
  });
  it('límite de tasa → rate_limit con retryAfterSeconds', () => {
    const e = toModelError({ status: 429, code: 'rate_limit_exceeded', headers: { 'retry-after': '12' } });
    expect(e).toMatchObject({ category: 'rate_limit', retryAfterSeconds: 12 });
  });
  it('401 → auth; límite de uso → usage_limit; 5xx o red → provider_unavailable', () => {
    expect(cat({ status: 401 })).toBe('auth');
    expect(cat({ code: 'organization_usage_limit_exceeded' })).toBe('usage_limit');
    expect(cat({ status: 503 })).toBe('provider_unavailable');
    expect(cat(new Error('ECONNRESET'))).toBe('provider_unavailable');
  });
  it('el mensaje nunca contiene la clave ni el cuerpo de la solicitud', () => {
    const e = toModelError({ status: 401, message: `Incorrect API key provided: ${KEY}. body: {"input":"texto secreto"}`, code: 'invalid_api_key' });
    expect(e.message).not.toContain(KEY);
    expect(e.message).not.toContain('secreto');
  });
});

describe('cliente OpenAI (con HTTP sustituido; sin red)', () => {
  const okBody = {
    id: 'r1', object: 'response', model: 'gpt-x', status: 'completed',
    output: [{ type: 'function_call', call_id: 'c1', name: 't1', arguments: '{"a":1}' }],
    usage: { input_tokens: 10, output_tokens: 5, output_tokens_details: { reasoning_tokens: 2 } },
  };
  it('envía store:false, sin reintentos del SDK, y traduce la respuesta', async () => {
    const seen: Array<Record<string, unknown>> = [];
    const fetchFn = (async (_u: unknown, init?: { body?: string }) => {
      seen.push(JSON.parse(init!.body!));
      return new Response(JSON.stringify(okBody), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const c = createOpenAIClient({ apiKey: KEY, fetch: fetchFn });
    const r = await c.respond({ ...req(), reasoning: 'low' });
    expect(seen[0]).toMatchObject({ store: false, model: 'm', reasoning: { effort: 'low' }, tools: [{ type: 'function', name: 't1' }] });
    expect(r).toMatchObject({ toolCalls: [{ id: 'c1', name: 't1', rawArguments: '{"a":1}' }], usage: { input: 10, output: 5, reasoning: 2 }, model: 'gpt-x' });
  });
  it('ante un error de gasto hace UNA sola llamada HTTP (maxRetries: 0) y no filtra la clave', async () => {
    let n = 0;
    const fetchFn = (async () => {
      n += 1;
      return new Response(JSON.stringify({ error: { code: 'project_spend_limit_exceeded', message: `límite ${KEY}` } }), { status: 429, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const c = createOpenAIClient({ apiKey: KEY, fetch: fetchFn });
    const e = await c.respond(req()).catch((x) => x);
    expect(e).toBeInstanceOf(ModelError);
    expect(e.category).toBe('spend_limit');
    expect(e.message).not.toContain(KEY);
    expect(n).toBe(1);
  });
  it('un error de red se normaliza como provider_unavailable sin reintentar', async () => {
    let n = 0;
    const fetchFn = (async () => {
      n += 1;
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    const e = await createOpenAIClient({ apiKey: KEY, fetch: fetchFn }).respond(req()).catch((x) => x);
    expect(e.category).toBe('provider_unavailable');
    expect(n).toBe(1);
  });
});
