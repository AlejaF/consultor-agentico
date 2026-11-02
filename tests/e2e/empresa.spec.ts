import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

// L5b / historia 7 (FR-034 a FR-036): vista de la Empresa Ficticia Beta (P-B).
async function entrar(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Empresa' }).click();
  await page.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
}
const paso = (page: Page, nombre: string) => page.getByTestId(`paso-${nombre}`);
const KEY = 'consultor-agentico-demo:state';

test.describe('Inicio de la Empresa', () => {
  test('ruta de adopción en tres pasos con el estado real de P-B, próximo paso y actividad de ejemplo', async ({ page }) => {
    await entrar(page);
    await expect(page.locator('main')).toContainText('Empresa Ficticia Beta');
    await expect(page.getByRole('heading', { level: 2, name: 'Ruta de adopción' })).toBeVisible();
    await expect(page.locator('[data-testid^=paso-]')).toHaveCount(3);
    await expect(paso(page, 'documentos')).toContainText('Completado');
    await expect(paso(page, 'diagnostico')).toContainText('Completado'); // P-B está emitido en el estado de ejemplo
    await expect(paso(page, 'estrategia')).toContainText('Pendiente');
    await expect(page.getByTestId('proximo-paso')).toContainText(/estrategia/i);
    await expect(page.getByRole('heading', { level: 2, name: 'Actividad reciente' })).toBeVisible();
    await expect(page.getByText('Actividad de ejemplo (ficticia)')).toBeVisible();
    // sin herramientas del Consultor ni del Líder, ni casos de uso
    await expect(page.locator('main a[href^="#/consultor"], main a[href^="#/lider"]')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(/casos de uso/i);
    await expect(page.locator('main')).not.toContainText(/Empresa Ficticia Alfa|Empresa Ficticia Gamma/);
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  });

  test('los pasos se derivan del estado real: al enviar el Consultor la estrategia de P-B, la Empresa la ve Completada', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-B/estrategia'));
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    await page.getByRole('button', { name: 'Enviar a revisión' }).click();
    await page.getByText('Enviada al Líder').first().waitFor();
    await page.getByLabel('Rol activo').selectOption('contacto');
    await expect(paso(page, 'estrategia')).toContainText('Completado');
    await expect(page.getByTestId('proximo-paso')).toContainText(/informe|encuesta/i);
  });
});

test.describe('Informe de diagnóstico en solo lectura', () => {
  test('se abre desde el inicio, sin estrategia no enviada ni calificaciones, y lleva «Revisado por»', async ({ page }) => {
    await entrar(page);
    await page.getByRole('link', { name: 'Ver informe de diagnóstico' }).click();
    await expect(page).toHaveURL(/#\/contacto\/informe$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Informe de diagnóstico' })).toBeVisible();
    const informe = page.getByTestId('print-report');
    await expect(informe).toContainText('Empresa Ficticia Beta');
    await expect(informe).toContainText('Revisado por: Consultor Demo');
    await expect(informe).not.toContainText(/Meta del programa|Calificad|Rúbrica/i);
    await expect(page.getByRole('button', { name: /Generar|Aprobar|Aceptar|Rechazar|Editar/ })).toHaveCount(0); // solo lectura
    await expect(page).toHaveTitle('Informe de diagnóstico · Empresa Ficticia Beta (DEMO)');
    await expectNoAxeViolations(page);
  });
});

test.describe('Encuesta simulada', () => {
  test('3 preguntas obligatorias: no se guarda con faltantes; al guardar se confirma, queda en solo lectura y sobrevive a recargar', async ({ page }) => {
    await entrar(page);
    await page.getByRole('link', { name: 'Encuesta', exact: true }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Encuesta' })).toBeVisible();
    await expect(page.getByText('Simulada', { exact: true }).first()).toBeVisible();
    const grupos = page.getByRole('radiogroup');
    await expect(grupos).toHaveCount(3);
    await grupos.nth(0).getByRole('radio', { name: '4' }).check({ force: true });
    await page.getByRole('button', { name: 'Guardar respuestas' }).click();
    await expect(page.getByRole('alert')).toContainText('Faltan 2 preguntas por responder');
    await grupos.nth(1).getByRole('radio', { name: '5' }).check({ force: true });
    await grupos.nth(2).getByRole('radio', { name: '3' }).check({ force: true });
    await expectNoAxeViolations(page);
    await page.getByRole('button', { name: 'Guardar respuestas' }).click();
    await expect(page.getByTestId('encuesta-confirmacion')).toHaveText('Respuestas guardadas en este navegador (simulado); no se envió a nadie.');
    await expect(page.getByRole('button', { name: 'Guardar respuestas' })).toHaveCount(0); // solo lectura
    await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').surveys?.['P-B'] !== undefined, KEY)).toBe(true); // guardado con retraso
    const guardado = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).surveys['P-B'], KEY);
    expect(Object.values(guardado.answers).sort()).toEqual([3, 4, 5]);
    // sin red: nada se envía
    await page.reload();
    await expect(page.getByTestId('encuesta-respuestas')).toContainText('4');
    await expect(page.getByTestId('encuesta-confirmacion')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  });

  test('«Restablecer demo» borra la encuesta', async ({ page }) => {
    await entrar(page);
    await page.getByRole('link', { name: 'Encuesta', exact: true }).first().click();
    const grupos = page.getByRole('radiogroup');
    for (let i = 0; i < 3; i++) await grupos.nth(i).getByRole('radio', { name: '3' }).check({ force: true });
    await page.getByRole('button', { name: 'Guardar respuestas' }).click();
    await page.getByTestId('encuesta-confirmacion').waitFor();
    await page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, restablecer' }).click();
    await page.getByRole('button', { name: 'Entrar como Empresa' }).click();
    await page.getByRole('link', { name: 'Encuesta', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Guardar respuestas' })).toBeVisible();
    await expect(page.getByTestId('encuesta-confirmacion')).toHaveCount(0);
    const surveys = await page.evaluate((k) => { const t = localStorage.getItem(k); return t ? JSON.parse(t).surveys : {}; }, KEY);
    expect(surveys).toEqual({});
  });

  test('nada sale del navegador al responder', async ({ page }) => {
    const salidas: string[] = [];
    page.on('request', (r) => { if (r.method() !== 'GET' || r.postData()) salidas.push(`${r.method()} ${r.url()}`); });
    await entrar(page);
    await page.getByRole('link', { name: 'Encuesta', exact: true }).first().click();
    for (let i = 0; i < 3; i++) await page.getByRole('radiogroup').nth(i).getByRole('radio', { name: '2' }).check({ force: true });
    await page.getByRole('button', { name: 'Guardar respuestas' }).click();
    await page.getByTestId('encuesta-confirmacion').waitFor();
    expect(salidas).toEqual([]);
  });
});
