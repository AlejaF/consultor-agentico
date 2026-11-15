// Lote H5: capturas (docs/evidencia/h5-*.png). Servicio en modo FALSO.
import { test } from '@playwright/test';
import { entrarConsultor } from './helpers/real';

test('capturas de H5', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await entrarConsultor(page);
  const ir = async (h: string) => { await page.evaluate((x) => (window.location.hash = x), h); await page.waitForTimeout(500); };
  await ir('#/consultor/proyectos/P-C/estrategia/resumen');
  await page.screenshot({ path: 'docs/evidencia/h5-estrategia-resumen-1280.png' });
  await page.getByTestId('resumen-acciones').getByRole('link', { name: 'Ver trazabilidad' }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'docs/evidencia/h5-estrategia-detalle-trazabilidad-1280.png' });
  await ir('#/consultor/proyectos/P-B/diagnostico/detalle');
  await page.screenshot({ path: 'docs/evidencia/h5-diagnostico-detalle-1280.png', fullPage: true });
  await ir('#/consultor/proyectos/P-B/evidencia');
  await page.screenshot({ path: 'docs/evidencia/h5-evidencia-1280.png' });
  await ir('#/consultor');
  await page.screenshot({ path: 'docs/evidencia/h5-proyectos-1280.png', fullPage: true });
  await page.locator('#rol-activo').selectOption('lider');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/evidencia/h5-tablero-resumen-1280.png', fullPage: true });
  await ir('#/lider/entregas');
  await page.screenshot({ path: 'docs/evidencia/h5-entregas-1280.png', fullPage: true });
  await page.locator('#rol-activo').selectOption('contacto');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/evidencia/h5-empresa-1280.png', fullPage: true });
});
