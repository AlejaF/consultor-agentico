// Accesibilidad y responsive de lo nuevo del modo IA real (axe, sin desplazamiento horizontal, objetivos ≥ 44 px, teclado, aria-live). T079.
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, elegirIAReal, entrarConsultor, generarDiagnosticoReal, ruta, subir, vaciarServicio } from './helpers/real';

async function expectTargetsAtLeast44(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, select, input:not([hidden]), a[href], summary')]
      .filter((el) => !el.classList.contains('skip-link') && !el.classList.contains('link-button') && el.offsetParent !== null)
      .map((el) => ({ el: (el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 30), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height < 44 || r.width < 44)
      .map(({ el, r }) => `${el} ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small, 'controles menores de 44 px').toEqual([]);
}
async function revisar(page: Page) {
  await expectNoAxeViolations(page);
  await expectNoHorizontalScroll(page);
  await expectTargetsAtLeast44(page);
}

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test('captura de evidencia en modo IA real: selector, aviso, resultado de la carga y lista de archivos', async ({ page }) => {
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await elegirIAReal(page);
  await revisar(page);
  await subir(page, ruta(['notas-reunion.txt', 'escaneado.pdf']));
  await expect(page.getByTestId('server-file-notas-reunion.txt')).toBeVisible();
  await revisar(page);
  // regiones aria-live para la carga y para el estado de la lista
  expect(await page.locator('[data-testid="real-upload-result"][aria-live="polite"][role="status"]').count()).toBe(1);
  expect(await page.locator('[data-testid="server-files"] [role="status"][aria-live="polite"]').count()).toBe(1);
});

test('el selector de modo se maneja con el teclado', async ({ page }) => {
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await expect(page.getByTestId('real-unavailable')).toHaveCount(0, { timeout: 15_000 });
  const real = page.getByRole('button', { name: 'IA real', exact: true });
  await real.focus();
  await expect(real).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('active-mode')).toHaveText('IA real');
  await page.getByRole('button', { name: 'Simulado', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('active-mode')).toHaveText('Simulado');
});

test('sin servicio: el estado «no disponible» se anuncia en una región aria-live y no hay violaciones', async ({ page }) => {
  await page.route('**/api/health', (r) => r.abort());
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await expect(page.locator('[role="status"][aria-live="polite"]', { hasText: 'IA real no disponible aquí' })).toBeVisible();
  await revisar(page);
});

test('diagnóstico real con la traza del agente abierta con el teclado', async ({ page }) => {
  await generarDiagnosticoReal(page, ['notas-reunion.txt', 'politica-datos.pdf']);
  const resumen = page.getByText('Traza del agente', { exact: true });
  await resumen.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('trace-model')).toBeVisible();
  await revisar(page);
  // abrir una cita con el teclado
  const cita = page.getByTestId('finding-R1').getByRole('button', { name: /notas-reunion\.txt · línea 4/ });
  await cita.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('finding-R1')).toContainText('Extracto de tu archivo');
  await revisar(page);
});

test('error del proveedor: se anuncia como alerta y no hay violaciones', async ({ page, request }) => {
  await vaciarServicio(request, 'P-D');
  await entrarConsultor(page);
  await abrir(page, 'P-D', 'evidencia');
  await elegirIAReal(page);
  await subir(page, ruta(['notas-reunion.txt']));
  await abrir(page, 'P-D', 'diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Se agotó el saldo prepago' })).toBeVisible({ timeout: 30_000 });
  await revisar(page);
});
