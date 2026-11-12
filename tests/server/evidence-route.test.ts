import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { buildFixtures, makeXlsx } from '../../scripts/lib/fixtures.mjs';
import { buildServer } from '../../server/src/app.ts';
import { loadConfig } from '../../server/src/config.ts';
import { createLogger } from '../../server/src/log.ts';

const F: Record<string, Buffer> = buildFixtures();
const HOST = { host: '127.0.0.1:8787' };
let toClose: Array<{ close: () => Promise<unknown> }> = [];
afterEach(async () => {
  for (const s of toClose) await s.close();
  toClose = [];
});

async function make(maxFileBytes?: number, maxXlsxRows?: number) {
  const cfg = loadConfig({});
  if (maxFileBytes) cfg.limits.maxFileBytes = maxFileBytes;
  if (maxXlsxRows) cfg.limits.maxXlsxRows = maxXlsxRows;
  const app = await buildServer(cfg, createLogger(() => {}));
  toClose.push(app);
  return app;
}

/** Cuerpo multipart armado a mano (el servicio lo lee en memoria). */
function multipart(files: Array<{ name: string; bytes: Buffer; type?: string }>) {
  const boundary = '----prueba' + Math.random().toString(16).slice(2);
  const parts: Buffer[] = [];
  for (const f of files) {
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${f.name}"\r\nContent-Type: ${f.type ?? 'application/octet-stream'}\r\n\r\n`, 'utf8'),
      f.bytes,
      Buffer.from('\r\n'),
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { ...HOST, 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

const post = (app: Awaited<ReturnType<typeof make>>, projectId: string, files: Array<{ name: string; bytes: Buffer }>) => {
  const m = multipart(files);
  return app.inject({ method: 'POST', url: `/api/evidence?projectId=${projectId}`, payload: m.payload, headers: m.headers });
};

describe('POST /api/evidence', () => {
  it('extrae los archivos válidos y explica los que fallan, sin detener a los demás', async () => {
    const app = await make();
    const r = await post(app, 'P-A', [
      { name: 'politica-datos.pdf', bytes: F['politica-datos.pdf'] },
      { name: 'escaneado.pdf', bytes: F['escaneado.pdf'] },
      { name: 'notas-reunion.txt', bytes: F['notas-reunion.txt'] },
    ]);
    expect(r.statusCode).toBe(200);
    const { files } = r.json();
    expect(files).toHaveLength(3);
    expect(files[0]).toMatchObject({ name: 'politica-datos.pdf', status: 'extracted', chunkCount: 2 });
    expect(files[0].chars).toBeGreaterThan(50);
    expect(typeof files[0].id).toBe('string');
    expect(files[1]).toMatchObject({ name: 'escaneado.pdf', status: 'failed', reason: 'pdf_sin_texto' });
    expect(files[1].message).toContain('no usa OCR');
    expect(files[2].status).toBe('extracted');
  });

  it('no devuelve el texto de los documentos en la respuesta', async () => {
    const app = await make();
    const r = await post(app, 'P-A', [{ name: 'notas-reunion.txt', bytes: F['notas-reunion.txt'] }]);
    expect(r.body).not.toContain('Empresa Ficticia Alfa');
  });

  it('valida cada archivo como FR-010: formato, nombre y tamaño', async () => {
    const app = await make(1000);
    const r = await post(app, 'P-A', [
      { name: 'voz.mp3', bytes: Buffer.from('x') },
      { name: 'a'.repeat(160) + '.txt', bytes: Buffer.from('hola') },
      { name: 'enorme.txt', bytes: Buffer.alloc(2000, 'a') },
      { name: 'bien.txt', bytes: Buffer.from('contenido de prueba suficiente para extraer') },
    ]);
    expect(r.statusCode).toBe(200);
    const reasons = r.json().files.map((f: { reason?: string; status: string }) => f.reason ?? f.status);
    expect(reasons).toEqual(['formato_no_permitido', 'nombre_largo', 'demasiado_grande', 'extracted']);
  });

  it('un XLSX por encima del tope de filas se extrae parcialmente con aviso', async () => {
    const app = await make(undefined, 5);
    const rows = Array.from({ length: 20 }, (_, i) => [`f${i}`, i]);
    const r = await post(app, 'P-A', [{ name: 'grande.xlsx', bytes: makeXlsx({ D: rows }) }]);
    expect(r.json().files[0]).toMatchObject({ status: 'extracted', warning: 'tope_filas_alcanzado', chunkCount: 5 });
  });

  it('exige un projectId válido (^[A-Za-z0-9-]{1,32}$)', async () => {
    const app = await make();
    const m = multipart([{ name: 'a.txt', bytes: Buffer.from('hola') }]);
    for (const url of ['/api/evidence', '/api/evidence?projectId=', '/api/evidence?projectId=../x', '/api/evidence?projectId=' + 'a'.repeat(33)]) {
      const r = await app.inject({ method: 'POST', url, payload: m.payload, headers: m.headers });
      expect(r.statusCode, url).toBe(400);
      expect(r.json().error.category).toBe('bad_request');
    }
  });

  it('sin archivos responde 400', async () => {
    const app = await make();
    const r = await app.inject({ method: 'POST', url: '/api/evidence?projectId=P-A', payload: Buffer.from('--x--\r\n'), headers: { ...HOST, 'content-type': 'multipart/form-data; boundary=x' } });
    expect(r.statusCode).toBe(400);
  });
});

describe('GET y DELETE /api/evidence (AG-030, RECORTABLE)', () => {
  it('lista lo subido por proyecto, sin duplicar el mismo nombre', async () => {
    const app = await make();
    await post(app, 'P-A', [{ name: 'notas-reunion.txt', bytes: F['notas-reunion.txt'] }]);
    await post(app, 'P-A', [{ name: 'notas-reunion.txt', bytes: F['notas-reunion.txt'] }]);
    await post(app, 'P-B', [{ name: 'otra.txt', bytes: Buffer.from('contenido de otro proyecto de prueba') }]);
    const a = (await app.inject({ method: 'GET', url: '/api/evidence/P-A', headers: HOST })).json();
    expect(a.files.map((f: { name: string }) => f.name)).toEqual(['notas-reunion.txt']);
    const b = (await app.inject({ method: 'GET', url: '/api/evidence/P-B', headers: HOST })).json();
    expect(b.files).toHaveLength(1);
    const vacio = (await app.inject({ method: 'GET', url: '/api/evidence/P-Z', headers: HOST })).json();
    expect(vacio).toEqual({ files: [] });
  });

  it('tras reiniciar el servicio (servidor nuevo) la lista llega vacía', async () => {
    const app1 = await make();
    await post(app1, 'P-A', [{ name: 'notas-reunion.txt', bytes: F['notas-reunion.txt'] }]);
    const app2 = await make();
    expect((await app2.inject({ method: 'GET', url: '/api/evidence/P-A', headers: HOST })).json()).toEqual({ files: [] });
  });

  it('DELETE quita el archivo de la memoria; uno inexistente responde 404', async () => {
    const app = await make();
    const up = (await post(app, 'P-A', [{ name: 'notas-reunion.txt', bytes: F['notas-reunion.txt'] }])).json();
    const id = up.files[0].id;
    const del = await app.inject({ method: 'DELETE', url: `/api/evidence/P-A/${id}`, headers: HOST });
    expect(del.json()).toEqual({ ok: true });
    expect((await app.inject({ method: 'GET', url: '/api/evidence/P-A', headers: HOST })).json()).toEqual({ files: [] });
    expect((await app.inject({ method: 'DELETE', url: `/api/evidence/P-A/${id}`, headers: HOST })).statusCode).toBe(404);
  });
});

describe('sin escritura a disco (AG-026)', () => {
  it('subir, listar y borrar no deja ningún archivo nuevo en el temporal ni en el directorio de trabajo', async () => {
    const snap = () => [tmpdir(), process.cwd(), `${process.cwd()}/server`].map((d) => readdirSync(d).sort().join('|'));
    const antes = snap();
    const app = await make();
    const up = await post(app, 'P-A', [
      { name: 'politica-datos.pdf', bytes: F['politica-datos.pdf'] },
      { name: 'informe-direccion.docx', bytes: F['informe-direccion.docx'] },
      { name: 'indicadores.xlsx', bytes: F['indicadores.xlsx'] },
    ]);
    await app.inject({ method: 'GET', url: '/api/evidence/P-A', headers: HOST });
    await app.inject({ method: 'DELETE', url: `/api/evidence/P-A/${up.json().files[0].id}`, headers: HOST });
    expect(snap()).toEqual(antes);
  });
});
