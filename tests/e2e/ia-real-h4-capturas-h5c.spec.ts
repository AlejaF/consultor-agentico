// Lote H5c: capturas del Tablero de una sola página (docs/evidencia/h5c-*.png). Servicio en modo FALSO.
import { test } from '@playwright/test';
import { entrarConsultor } from './helpers/real';

test('capturas de H5c', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await entrarConsultor(page);
  await page.locator('#rol-activo').selectOption('lider');
  await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
  await page.waitForTimeout(500);
  console.log('ALTO1280=' + (await page.evaluate(() => document.documentElement.scrollHeight)));
  await page.screenshot({ path: 'docs/evidencia/h5c-tablero-1280.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h5c-tablero-320.png', fullPage: true });
});
