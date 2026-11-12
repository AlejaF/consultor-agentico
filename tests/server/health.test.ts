import { afterEach, describe, expect, it } from 'vitest';
import { buildServer, HOST, listenLoopback } from '../../server/src/app.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createLogger } from '../../server/src/log.ts';

// Clave inventada y armada en tiempo de ejecución: el archivo no contiene ninguna cadena con forma de clave.
const KEY = 'sk-' + 'proj-' + 'Qq7_'.repeat(12);
const GOOD_HOST = { host: '127.0.0.1:8787' };

let toClose: Array<{ close: () => Promise<unknown> }> = [];
afterEach(async () => {
  for (const s of toClose) await s.close();
  toClose = [];
});

async function make(env: Record<string, string | undefined> = {}, lines: string[] = []) {
  const app = await buildServer(loadConfig(env), createLogger((l) => lines.push(l)));
  toClose.push(app);
  return app;
}

describe('GET /api/health', () => {
  it('responde con la forma del contrato y sin ninguna clave', async () => {
    const app = await make({ OPENAI_API_KEY: KEY, OPENAI_MODEL_DIAGNOSTICO: 'modelo-d' });
    const r = await app.inject({ method: 'GET', url: '/api/health', headers: GOOD_HOST });
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body).toMatchObject({
      ok: true,
      keyConfigured: true,
      fake: false,
      models: { diagnosis: 'modelo-d', strategy: null, critic: null },
      limits: { maxIterations: 10, maxInputChars: 120000, maxFileBytes: 26214400 },
    });
    expect(typeof body.version).toBe('string');
    expect(r.body).not.toContain(KEY);
    expect(r.body).not.toContain('Qq7_');
    expect(JSON.stringify(r.headers)).not.toContain('Qq7_');
  });

  it('sin clave ni modelos lo dice y no inventa valores', async () => {
    const app = await make({});
    const body = (await app.inject({ method: 'GET', url: '/api/health', headers: GOOD_HOST })).json();
    expect(body.keyConfigured).toBe(false);
    expect(body.models).toEqual({ diagnosis: null, strategy: null, critic: null });
  });

  it('anuncia el modo de pruebas solo con MODEL_PROVIDER=fake', async () => {
    const app = await make({ MODEL_PROVIDER: 'fake' });
    expect((await app.inject({ method: 'GET', url: '/api/health', headers: GOOD_HOST })).json().fake).toBe(true);
  });
});

describe('solo escucha en 127.0.0.1', () => {
  it('HOST es 127.0.0.1 y el servicio queda enlazado a esa dirección', async () => {
    expect(HOST).toBe('127.0.0.1');
    const app = await make({});
    const address = await listenLoopback(app, 0);
    expect(address.address).toBe('127.0.0.1');
    expect(address.address).not.toBe('0.0.0.0');
    const r = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    expect(r.status).toBe(200);
  });
});

describe('Host y Origin (defensa contra DNS rebinding y CORS)', () => {
  it('rechaza un Host que no es del equipo local', async () => {
    const app = await make({});
    const r = await app.inject({ method: 'GET', url: '/api/health', headers: { host: 'malo.example:8787' } });
    expect(r.statusCode).toBe(403);
    expect(r.json().error.category).toBe('bad_request');
  });

  it('acepta localhost y 127.0.0.1 y el host del origen de Vite (el proxy conserva el Host)', async () => {
    const app = await make({});
    for (const host of ['127.0.0.1:8787', 'localhost:8787', 'localhost:5173', '127.0.0.1:5173']) {
      expect((await app.inject({ method: 'GET', url: '/api/health', headers: { host } })).statusCode).toBe(200);
    }
  });

  it('rechaza un Origin no permitido y acepta los permitidos con su cabecera CORS', async () => {
    const app = await make({});
    const bad = await app.inject({ method: 'GET', url: '/api/health', headers: { ...GOOD_HOST, origin: 'https://malo.example' } });
    expect(bad.statusCode).toBe(403);
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    const ok = await app.inject({ method: 'GET', url: '/api/health', headers: { ...GOOD_HOST, origin: 'http://localhost:5173' } });
    expect(ok.statusCode).toBe(200);
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('la verificación previa (OPTIONS) de un origen permitido se contesta y la de uno ajeno no', async () => {
    const app = await make({});
    const h = { ...GOOD_HOST, 'access-control-request-method': 'POST' };
    const ok = await app.inject({ method: 'OPTIONS', url: '/api/diagnosis/run', headers: { ...h, origin: 'http://127.0.0.1:5173' } });
    expect(ok.statusCode).toBeLessThan(300);
    const bad = await app.inject({ method: 'OPTIONS', url: '/api/diagnosis/run', headers: { ...h, origin: 'https://malo.example' } });
    expect(bad.statusCode).toBe(403);
  });
});

describe('registro (log.ts)', () => {
  it('guarda método, ruta, estado y duración, y nunca cuerpos ni claves', async () => {
    const lines: string[] = [];
    const app = await make({ OPENAI_API_KEY: KEY }, lines);
    await app.inject({
      method: 'POST',
      url: '/api/ruta-inexistente?x=1',
      headers: { ...GOOD_HOST, 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      payload: JSON.stringify({ texto: 'CONTENIDO CONFIDENCIAL DE UN DOCUMENTO', clave: KEY }),
    });
    const all = lines.join('\n');
    expect(all).toContain('POST');
    expect(all).toContain('/api/ruta-inexistente');
    expect(all).toContain('404');
    expect(all).not.toContain('x=1'); // sin cadena de consulta
    expect(all).not.toContain('CONTENIDO CONFIDENCIAL');
    expect(all).not.toContain(KEY);
    expect(all).not.toContain('Qq7_');
  });

  it('createLogger rechaza campos de contenido aunque se los pasen', () => {
    const lines: string[] = [];
    const log = createLogger((l) => lines.push(l));
    log.request({ method: 'GET', path: '/api/x', status: 200, durationMs: 3, body: 'secreto', apiKey: KEY } as never);
    expect(lines.join('')).not.toContain('secreto');
    expect(lines.join('')).not.toContain('Qq7_');
  });
});

describe('rutas desconocidas', () => {
  it('responden con el formato de error del contrato', async () => {
    const app = await make({});
    const r = await app.inject({ method: 'GET', url: '/api/nada', headers: GOOD_HOST });
    expect(r.statusCode).toBe(404);
    expect(r.json().error).toMatchObject({ category: 'bad_request', retryable: false });
  });
});
