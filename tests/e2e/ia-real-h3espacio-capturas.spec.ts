// Micro-lote H3-espacio: capturas a 1280 (docs/evidencia/h3espacio-*.png). Servicio en modo FALSO.
import { test } from '@playwright/test';
import { abrir, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

test('capturas de H3-espacio', async ({ page, request }) => {
  test.setTimeout(120_000);
  await vaciarServicio(request, 'P-A');
  await page.setViewportSize({ width: 1280, height: 900 });
  await generarDiagnosticoReal(page);
  await page.screenshot({ path: 'docs/evidencia/h3espacio-diagnostico-1280.png', fullPage: true });
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByTestId('finding-R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.screenshot({ path: 'docs/evidencia/h3espacio-revision-1280.png', fullPage: true });
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByTestId('strategy-content').waitFor({ timeout: 30_000 });
  await page.screenshot({ path: 'docs/evidencia/h3espacio-estrategia-1280.png', fullPage: true });
});
