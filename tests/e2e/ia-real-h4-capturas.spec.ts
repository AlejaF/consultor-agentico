// Lote H4a: capturas del Resumen de Diagnóstico (docs/evidencia/h4a-*.png). Servicio en modo FALSO.
import { test, expect } from '@playwright/test';
import { abrir, elegirIAReal, entrarConsultor, ruta, SEIS_FORMATOS, HOSTILES, subir, vaciarServicio } from './helpers/real';

test('capturas de H4a', async ({ page, request }) => {
  test.setTimeout(120_000);
  await vaciarServicio(request, 'P-A');
  await page.setViewportSize({ width: 1280, height: 800 });
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await elegirIAReal(page);
  await subir(page, ruta([...SEIS_FORMATOS, ...HOSTILES]));
  await abrir(page, 'P-A', 'diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible({ timeout: 30_000 });
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await abrir(page, 'P-A', 'diagnostico');
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4a-resumen-1280-ventana.png' });
  await page.screenshot({ path: 'docs/evidencia/h4a-resumen-1280-pagina.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4a-resumen-320.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByTestId('resumen-acciones').getByRole('link', { name: /^Ver los/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/evidencia/h4a-detalle-ancla-1280.png' });
});
