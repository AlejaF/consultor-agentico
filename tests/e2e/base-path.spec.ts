import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize } from 'node:path';

// R3 (plan §Despliegue): la app compilada con BASE_PATH=/mi-repo/ y servida bajo esa subruta carga sin recursos rotos.
const BASE = '/mi-repo/';
const OUT = 'test-results/base-path-dist';
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain' };

let server: Server;
let port = 0;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({}, info) => {
  test.skip(info.project.name !== '1280', 'Se compila una sola vez (en el ancho de escritorio)');
  execFileSync('npx', ['vite', 'build', '--outDir', OUT, '--emptyOutDir', '--logLevel', 'error'], { env: { ...process.env, BASE_PATH: BASE }, stdio: 'inherit' });
  server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    if (!url.pathname.startsWith(BASE)) {
      res.writeHead(404).end('fuera de la subruta');
      return;
    }
    let file = normalize(join(OUT, decodeURIComponent(url.pathname.slice(BASE.length)) || 'index.html'));
    if (!file.startsWith(OUT)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404).end('no existe');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  port = (server.address() as { port: number }).port;
});

test.afterAll(() => {
  server?.close();
});

test('bajo /mi-repo/ el ingreso carga sin recursos rotos y #/consultor funciona', async ({ page }, info) => {
  test.skip(info.project.name !== '1280', 'Se compila una sola vez (en el ancho de escritorio)');
  const fallos: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) fallos.push(`${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => fallos.push(`falló ${r.url()}`));
  const origen = `http://127.0.0.1:${port}`;
  await page.goto(`${origen}${BASE}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
  await expect(page.locator('img').first()).toBeVisible();
  expect(await page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)), 'imágenes cargadas').toBe(true);
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await expect(page).toHaveURL(`${origen}${BASE}#/consultor`);
  await expect(page.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Plus Jakarta Sans');
  const lanzadas = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name));
  expect(lanzadas.every((u) => u.startsWith(`${origen}${BASE}`)), 'todos los recursos salen de la subruta').toBe(true);
  expect(fallos, 'recursos con error').toEqual([]);
});
