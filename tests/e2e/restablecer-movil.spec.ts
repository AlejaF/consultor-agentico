import { devices, expect, test, type Page } from '@playwright/test';
import { PDF_VALIDO } from './fixtures/archivos';

// Emulación de celular (Pixel 7 sobre Chromium): investigación del defecto de «Restablecer demo» (vaciado en visibilitychange/pagehide,
// pageshow persisted, pestaña descartada y reabierta, rol + «Inicio» inmediatos). Ninguna reprodujo el fallo; se conservan como regresión.
test.use({ ...devices['Pixel 7'], browserName: 'chromium' });
const KEY = 'consultor-agentico-demo:state';
const CRIT = ['Trazabilidad de la evidencia', 'Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación'];
async function goto(page: Page, hash: string) { await page.evaluate((h) => (window.location.hash = h), hash); }
const alm = (page: Page) => page.evaluate((k) => { const t = localStorage.getItem(k); if (!t) return null; const s = JSON.parse(t); return { estrategiaPB: s.projects['P-B'].strategy.status as string, gradings: Object.keys(s.gradings).sort().join(','), dxPA: s.projects['P-A'].diagnosis.status as string, archivosPA: s.projects['P-A'].localFiles.length as number }; }, KEY);
const DE_EJEMPLO = { estrategiaPB: 'none', gradings: 'dx/E-1,dx/P-C,st/P-C', dxPA: 'none', archivosPA: 0 };
async function esDeEjemplo(page: Page, donde: string) {
  const a = await alm(page);
  if (a !== null) expect(a, `almacenamiento ${donde}`).toEqual(DE_EJEMPLO);
}
async function ensuciar(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Entrar como Consultor/ }).click();
  await goto(page, '#/consultor/proyectos/P-B/estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  await page.getByText('Enviada al Líder').first().waitFor();
  await goto(page, '#/consultor/proyectos/P-A/diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await page.getByText('Generado — pendiente de revisión').waitFor();
  await goto(page, '#/consultor/proyectos/P-A/evidencia');
  await page.locator('input[type=file]').setInputFiles([PDF_VALIDO]);
  await page.getByText('informe-ejemplo.pdf').waitFor();
  await page.getByLabel('Rol activo').selectOption('lider');
  await goto(page, '#/lider/entregas/st/P-B');
  for (const name of CRIT) await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '5' }).check({ force: true });
  await page.getByRole('button', { name: 'Guardar calificación' }).click();
  await page.getByTestId('grade-average').waitFor();
  await page.waitForTimeout(400);
}
async function restablecerYa(page: Page) {
  await page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, restablecer' }).click();
}
async function estadoUI(page: Page, etiqueta: string) {
  await page.getByRole('button', { name: /Entrar como Consultor/ }).click();
  await goto(page, '#/consultor/proyectos/P-B/estrategia');
  await expect(page.getByRole('button', { name: 'Generar estrategia' }), `estrategia de P-B ${etiqueta}`).toBeVisible();
  await goto(page, '#/consultor/proyectos/P-A/evidencia');
  await page.locator('main h1').waitFor();
  await expect(page.getByText('informe-ejemplo.pdf'), `PDF ${etiqueta}`).toHaveCount(0);
  await page.getByLabel('Rol activo').selectOption('lider');
  await expect(page.getByTestId('kpi-por-revisar'), `entregas por revisar ${etiqueta}`).toContainText('3');
  await expect(page.getByTestId('kpi-promedio')).toContainText('4,2 de 5');
}
const ocultar = (page: Page) => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
});
const mostrar = (page: Page) => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
});

test('(1) vaciado en visibilitychange hidden y pagehide justo después de restablecer (móvil)', async ({ page }, info) => {
  test.skip(info.project.name !== '1280');
  await ensuciar(page);
  await restablecerYa(page);
  await ocultar(page); // inmediatamente, sin esperar los 200 ms
  await expect.poll(async () => { const a = await alm(page); return a === null || JSON.stringify(a) === JSON.stringify(DE_EJEMPLO); }, 'el vaciado escribe el estado ACTUAL (de ejemplo), no uno capturado antes').toBe(true);
  await page.waitForTimeout(600);
  await esDeEjemplo(page, 'tras ocultar y 600 ms');
  await mostrar(page);
  await page.waitForTimeout(300);
  await estadoUI(page, '(1) tras ocultar y volver');
});

test('(1b) ocultar con el diálogo abierto y confirmar al volver; y ocultar a mitad de camino', async ({ page }, info) => {
  test.skip(info.project.name !== '1280');
  await ensuciar(page);
  await page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }).click();
  await ocultar(page); // la persona cambia de aplicación con el diálogo abierto
  await mostrar(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, restablecer' }).click();
  await ocultar(page);
  await mostrar(page);
  await page.waitForTimeout(500);
  await estadoUI(page, '(1b) diálogo abierto, ocultar y confirmar');
});

test('(2) pageshow persisted (caché de avance y retroceso) tras restablecer', async ({ page }, info) => {
  test.skip(info.project.name !== '1280');
  await ensuciar(page);
  await restablecerYa(page);
  await page.waitForTimeout(400);
  await ocultar(page);
  await mostrar(page);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await estadoUI(page, '(2) pageshow persisted');
});

test('(3) la pestaña se descarta y se vuelve a abrir tras restablecer', async ({ page, context }, info) => {
  test.skip(info.project.name !== '1280');
  await ensuciar(page);
  await restablecerYa(page);
  await page.close(); // el navegador descarta la pestaña justo después (sin esperar 200 ms)
  const nueva = await context.newPage();
  await nueva.goto('/');
  await esDeEjemplo(nueva, 'tras descartar y reabrir');
  await estadoUI(nueva, '(3) pestaña descartada y reabierta');
  await nueva.reload();
  await nueva.goto('/');
  await estadoUI(nueva, '(3) y recargada');
});

test('(4) cambiar de rol con el selector y pulsar «Inicio» justo después de restablecer', async ({ page }, info) => {
  test.skip(info.project.name !== '1280');
  await ensuciar(page);
  await restablecerYa(page);
  // tras restablecer no hay cabecera (ingreso); se entra a un rol y se usa el selector e «Inicio» al instante
  await page.getByRole('button', { name: /Entrar como Consultor/ }).click();
  await page.getByLabel('Rol activo').selectOption('lider');
  await page.locator('header.topbar').getByRole('link', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: /Entrar como Líder/ }).click();
  await page.getByLabel('Rol activo').selectOption('consultor');
  await page.locator('header.topbar').getByRole('link', { name: 'Inicio' }).click();
  await page.waitForTimeout(500);
  const a4 = await alm(page);
  expect(a4).toMatchObject({ estrategiaPB: 'none', gradings: DE_EJEMPLO.gradings, dxPA: 'none', archivosPA: 0 });
  await estadoUI(page, '(4) rol + Inicio inmediatos');
  await page.goBack();
  await page.goForward();
  await page.waitForTimeout(300);
  await esDeEjemplo(page, 'tras atrás y adelante');
});
