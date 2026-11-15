// Lote H3 (AG-035): criterios medibles de composición y gráficos. Posición y tamaño reales; servicio en modo FALSO.
import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { medir } from './helpers/medidas';
import { abrir, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

/** Línea base de H2 (medida antes de H3, docs/evidencia/h3-base-h2.json): Revisión con 4 hallazgos a 1280 px. */
const BASE_H2_ALTURA_1280 = 2888;
const ANCHOS = [320, 768, 1024, 1280, 1536, 1920];
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const resize = async (page: Page, w: number) => {
  await page.setViewportSize({ width: w, height: w >= 1024 ? 900 : 800 });
  await page.waitForTimeout(150);
};
const aceptar = async (page: Page, ...ids: string[]) => {
  for (const id of ids) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
};

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test('criterios de composición en Revisión (1 a 6)', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await card(page, 'R1').waitFor();
  const medidas: Record<number, Awaited<ReturnType<typeof medir>>> = {};
  for (const w of ANCHOS) {
    await resize(page, w);
    medidas[w] = await medir(page);
    expect(medidas[w]!.desbordaH, `sin desplazamiento horizontal a ${w}`).toBe(false);
    // Sin solapamientos entre tarjetas de hallazgo
    const solapan = await page.evaluate(() => {
      const r = [...document.querySelectorAll('[data-testid^="finding-R"]')].map((e) => e.getBoundingClientRect());
      return r.some((a, i) => r.some((b, j) => i < j && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1));
    });
    expect(solapan, `sin solapamientos a ${w}`).toBe(false);
  }
  writeFileSync('docs/evidencia/h3-medidas.json', JSON.stringify({ base_h2_altura_1280: BASE_H2_ALTURA_1280, h3: medidas }, null, 2));
  // (1) altura a 1280 al menos 35 % menor que en H2
  expect(medidas[1280]!.alturaTotal).toBeLessThanOrEqual(BASE_H2_ALTURA_1280 * 0.65);
  // (2) bloque de madurez a 1280
  expect(medidas[1280]!.alturaMadurez!).toBeLessThanOrEqual(520);
  // (3) tarjetas por fila
  expect(medidas[1280]!.tarjetasPorFila).toBeGreaterThanOrEqual(2);
  expect(medidas[1536]!.tarjetasPorFila).toBeGreaterThanOrEqual(3);
  // (4) uso del ancho disponible hasta el máximo (1440; 1680 desde 1920)
  for (const w of [1024, 1280, 1536, 1920]) {
    const m = medidas[w]!;
    const tope = w >= 1920 ? 1680 : 1440;
    expect(m.anchoContenido / Math.min(m.anchoDisponible, tope), `ancho usado a ${w}`).toBeGreaterThanOrEqual(0.85);
  }
});

test('zona lateral: sticky desde 1024, arriba entre 768 y 1023, y «Aprobar y emitir» siempre alcanzable', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await card(page, 'R1').waitFor();
  await resize(page, 1280);
  const side = page.locator('.split-side');
  await expect(side).toHaveCSS('position', 'sticky');
  const w = (await side.boundingBox())!.width;
  expect(w).toBeGreaterThan(320);
  expect(w).toBeLessThan(360);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(200);
  await expect(page.getByRole('button', { name: 'Aprobar y emitir' })).toBeInViewport(); // sigue visible al bajar
  await resize(page, 768);
  const s = (await side.boundingBox())!;
  const m = (await page.locator('.split-main').boundingBox())!;
  expect(s.y + s.height).toBeLessThanOrEqual(m.y + 1); // la zona lateral pasa arriba
});

test('gráficos de la revisión: título-pregunta, valor en texto, tabla equivalente y «sin evidencia» sin número', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await aceptar(page, 'R1', 'R2', 'R3');
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  for (const id of ['chart-review-state', 'chart-coverage']) {
    const c = page.getByTestId(id);
    await expect(c.locator('.chart-title')).toContainText('?');
    await expect(c.locator('.chart-summary')).not.toBeEmpty();
    await expect(c.getByText('Ver como tabla')).toBeVisible();
    await c.getByText('Ver como tabla').click();
    await expect(c.locator('.chart-table table')).toBeVisible();
  }
  const estado = page.getByTestId('chart-review-state');
  await expect(estado.locator('.segbar-legend')).toContainText('Aceptados 3');
  await expect(estado.locator('.segbar-legend')).toContainText('Rechazados 1');
  await expect(estado.getByTestId('legend-unverified')).toContainText('NO VERIFICADO');
  // Mapa de calor: cada celda vacía dice «sin evidencia» y no tiene dígitos; el hallazgo rechazado (R4, talento) no cuenta
  const vacias = page.locator('[data-testid="heatmap"] td.heat-empty');
  expect(await vacias.count()).toBeGreaterThan(0);
  for (const t of await vacias.allInnerTexts()) expect(t).not.toMatch(/\d/);
  const fila = page.locator('[data-testid="heatmap"] tbody tr', { hasText: 'Talento' });
  await expect(fila.locator('td.heat-total')).toContainText('sin evidencia');
  // Tooltip también con foco de teclado y objetivo táctil >= 24 px
  const celda = page.locator('[data-testid="heatmap"] td.heat-l1, [data-testid="heatmap"] td.heat-l4, [data-testid="heatmap"] td.heat-l2, [data-testid="heatmap"] td.heat-l3').first();
  await page.keyboard.press('Tab'); // modalidad de teclado: el tooltip sale con :focus-visible
  await celda.focus();
  expect(await celda.evaluate((e) => getComputedStyle(e, '::after').content)).toContain('hallazgo vigente');
  const b = (await celda.boundingBox())!;
  expect(b.height).toBeGreaterThanOrEqual(24);
  await expectNoAxeViolations(page);
  await expectNoHorizontalScroll(page);
});

test('estrategia: riesgos en columnas, ruta en 2 o más columnas desde 1024, gráficos con tabla', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await aceptar(page, 'R1', 'R2', 'R3');
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await expect(page.getByTestId('strategy-content')).toBeVisible({ timeout: 30_000 });
  for (const id of ['chart-risk-levels', 'chart-provenance']) {
    const c = page.getByTestId(id);
    await expect(c.getByText('Ver como tabla')).toBeVisible();
    await expect(c.locator('.chart-summary')).not.toBeEmpty();
  }
  await resize(page, 1280);
  const pistas = () => page.locator('.risk-grid').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
  expect(await pistas(), 'columnas de riesgos a 1280').toBe(2);
  await resize(page, 1536);
  expect(await pistas(), 'columnas de riesgos a 1536').toBe(3);
  for (const w of [1024, 1280, 1920]) {
    await resize(page, w);
    // Pistas de la cuadrícula de la ruta (con una sola fase visible no hay dos tarjetas lado a lado, pero la ruta ya tiene sus columnas)
    expect(await page.locator('ol.timeline').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length), `columnas de la ruta a ${w}`).toBeGreaterThanOrEqual(2);
  }
  for (const w of ANCHOS) {
    await resize(page, w);
    await expectNoHorizontalScroll(page);
  }
});

test('Resumen de la traza: Consultor sí; la Empresa no lo tiene en el DOM', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await expect(page.getByTestId('chart-trace-summary')).toHaveCount(1);
  await expect(page.getByTestId('chart-trace-summary').locator('.chart-summary')).toContainText('iteraciones');
  await page.locator('#rol-activo').selectOption('contacto');
  expect(await page.locator('body').innerHTML()).not.toContain('chart-trace-summary');
});
