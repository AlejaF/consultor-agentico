// Lote H3-fix: capturas con el tamaño de la ventana (no de página completa), docs/evidencia/h3fix-*.png. Servicio en modo FALSO.
import { writeFileSync } from 'node:fs';
import { test } from '@playwright/test';
import { abrir, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

test('capturas de H3-fix', async ({ page, request }) => {
  test.setTimeout(120_000);
  await vaciarServicio(request, 'P-A');
  await page.setViewportSize({ width: 1280, height: 800 });
  await generarDiagnosticoReal(page);
  // Diagnóstico: zona de la traza
  await page.getByTestId('chart-trace-summary').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/evidencia/h3fix-diagnostico-1280.png' });
  // Revisión con scroll en 0, a 1280 y a 1920
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByTestId('finding-R4').getByRole('button', { name: /^Rechazar/ }).click();
  const medidas: Record<string, unknown> = {};
  for (const [w, h] of [[1280, 800], [1920, 1080]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    medidas[`revision_${w}`] = await page.evaluate(() => ({
      scrollY: window.scrollY,
      ladoY: Math.round(document.querySelector('.split-side')!.getBoundingClientRect().top),
      cifrasY: Math.round(document.querySelector('[data-testid="review-stats"]')!.getBoundingClientRect().top),
      botonY: Math.round([...document.querySelectorAll('button')].find((b) => b.textContent === 'Aprobar y emitir')!.getBoundingClientRect().top),
      alto: window.innerHeight,
    }));
    await page.screenshot({ path: `docs/evidencia/h3fix-revision-${w}.png` });
  }
  writeFileSync('docs/evidencia/h3fix-medidas.json', JSON.stringify(medidas, null, 2));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  // Proyectos
  await page.evaluate(() => (window.location.hash = '#/consultor'));
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h3fix-proyectos-1280.png' });
  // Estrategia (matriz de procedencia)
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByTestId('strategy-content').waitFor({ timeout: 30_000 });
  await page.getByTestId('chart-provenance').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/evidencia/h3fix-estrategia-1280.png' });
  // Tablero
  await page.locator('#rol-activo').selectOption('lider');
  await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h3fix-tablero-1280.png' });
  await page.getByTestId('chart-maturity-projects').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/evidencia/h3fix-tablero-madurez-1280.png' });
});
