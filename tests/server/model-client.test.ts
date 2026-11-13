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
  it('400 → invalid_request con el código y el mensaje reales del proveedor (sin la clave)', () => {
    const e = toModelError(
      { status: 400, code: 'unsupported_parameter', message: '400 Unsupported parameter', error: { code: 'unsupported_parameter', message: `El parámetro «reasoning.effort» no es compatible con este modelo. Clave: ${KEY}` } },
      KEY,
    );
    expect(e).toMatchObject({ category: 'invalid_request', providerStatus: 400, providerCode: 'unsupported_parameter' });
    expect(e.message).toContain('HTTP 400');
    expect(e.message).toContain('unsupported_parameter');
    expect(e.message).toContain('reasoning.effort');
    expect(e.message).not.toContain(KEY);
    expect(e.message).not.toMatch(/sk-/);
  });
  it('400 sin código ni cuerpo: mensaje claro igualmente; mensaje largo acotado; el prefijo «400 » del SDK no se repite', () => {
    expect(toModelError({ status: 400 }).message).toBe('OpenAI rechazó la solicitud (HTTP 400).');
    expect(toModelError({ status: 400, message: '400 Modelo inexistente' }).message).toBe('OpenAI rechazó la solicitud (HTTP 400): Modelo inexistente');
    expect(toModelError({ status: 400, message: 'x'.repeat(2000) }).message.length).toBeLessThan(400);
  });
  it('404 modelo inexistente → model_unavailable con estado y código reales', () => {
    const e = toModelError({ status: 404, code: 'model_not_found', message: '404 The model `gpt-inexistente` does not exist', error: { code: 'model_not_found', message: 'The model `gpt-inexistente` does not exist' } }, KEY);
    expect(e).toMatchObject({ category: 'model_unavailable', providerStatus: 404, providerCode: 'model_not_found' });
    expect(e.message).toContain('HTTP 404');
    expect(e.message).toContain('model_not_found');
    expect(e.message).toContain('gpt-inexistente');
    expect(e.message).toContain('OPENAI_MODEL_DIAGNOSTICO');
    expect(toModelError({ status: 404 }).category).toBe('model_unavailable'); // 404 sin cuerpo
  });
  it('403 por modelo no permitido en el proyecto → model_unavailable (no auth)', () => {
    const e = toModelError({ status: 403, code: 'model_not_found', error: { code: 'model_not_found', message: 'Project `proj_x` does not have access to model `m`' } });
    expect(e).toMatchObject({ category: 'model_unavailable', providerStatus: 403, providerCode: 'model_not_found' });
    expect(e.message).toContain('does not have access');
  });
  it('403 con otro código → access_denied con el código real', () => {
    const e = toModelError({ status: 403, code: 'unsupported_country_region_territory', error: { message: `Country, region, or territory not supported ${KEY}` } }, KEY);
    expect(e).toMatchObject({ category: 'access_denied', providerStatus: 403, providerCode: 'unsupported_country_region_territory' });
    expect(e.message).not.toContain(KEY);
  });
  it('otros 4xx (413, 422) → invalid_request con su estado; 408 y 409 siguen siendo provider_unavailable', () => {
    expect(toModelError({ status: 422, code: 'invalid_value' })).toMatchObject({ category: 'invalid_request', providerStatus: 422, providerCode: 'invalid_value' });
    expect(toModelError({ status: 413 })).toMatchObject({ category: 'invalid_request', providerStatus: 413 });
    expect(cat({ status: 408 })).toBe('provider_unavailable');
    expect(cat({ status: 409 })).toBe('provider_unavailable');
  });
  it('NO cambian las categorías existentes: clave (401, 403 sin código), gasto y tasa', () => {
    expect(cat({ status: 401, code: 'invalid_api_key' })).toBe('auth');
    expect(cat({ status: 403 })).toBe('auth');
    expect(cat({ status: 403, code: 'invalid_api_key' })).toBe('auth');
    expect(cat({ status: 404, code: 'organization_spend_limit_exceeded' })).toBe('spend_limit'); // el código manda sobre el estado
    expect(cat({ status: 429 })).toBe('rate_limit');
    expect(cat({ status: 400, code: 'insufficient_quota' })).toBe('balance');
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
  it('un 400 real del proveedor llega con su código y mensaje, una sola llamada y sin la clave', async () => {
    let n = 0;
    const fetchFn = (async () => {
      n += 1;
      return new Response(JSON.stringify({ error: { code: 'unsupported_value', type: 'invalid_request_error', param: 'reasoning.effort', message: `Valor no admitido para reasoning.effort (clave ${KEY})` } }), { status: 400, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const e = await createOpenAIClient({ apiKey: KEY, fetch: fetchFn }).respond(req()).catch((x) => x);
    expect(e).toBeInstanceOf(ModelError);
    expect(e).toMatchObject({ category: 'invalid_request', providerStatus: 400, providerCode: 'unsupported_value' });
    expect(e.message).toContain('unsupported_value');
    expect(e.message).toContain('Valor no admitido');
    expect(e.message).not.toContain(KEY);
    expect(e.category).not.toBe('provider_unavailable');
    expect(n).toBe(1);
  });
  it.each([
    [404, 'model_not_found', 'model_unavailable'],
    [403, 'model_not_found', 'model_unavailable'],
    [403, 'unsupported_country_region_territory', 'access_denied'],
    [422, 'invalid_value', 'invalid_request'],
  ] as const)('HTTP %i (%s) real → %s con su código, sin la clave y con UNA sola llamada', async (status, code, category) => {
    let n = 0;
    const fetchFn = (async () => {
      n += 1;
      return new Response(JSON.stringify({ error: { code, message: `detalle del proveedor ${KEY}` } }), { status, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const e = await createOpenAIClient({ apiKey: KEY, fetch: fetchFn }).respond(req()).catch((x) => x);
    expect(e).toMatchObject({ category, providerStatus: status, providerCode: code });
    expect(e.message).toContain(code);
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
