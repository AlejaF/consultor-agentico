// Lote H4b: capturas del Resumen de Estrategia y del Tablero (docs/evidencia/h4b-*.png). Servicio en modo FALSO.
import { test, expect } from '@playwright/test';
import { abrir, elegirIAReal, entrarConsultor, ruta, SEIS_FORMATOS, HOSTILES, subir, vaciarServicio } from './helpers/real';

test('capturas de H4b', async ({ page, request }) => {
  test.setTimeout(150_000);
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
  await page.getByTestId('finding-R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
  await page.waitForTimeout(1000);
  // Diagnóstico (pulidos) con 3 aceptados
  await abrir(page, 'P-A', 'diagnostico');
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4b-diagnostico-1280-ventana.png' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4b-diagnostico-360.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  // Estrategia simulada (P-C: 4 riesgos y 4 fases)
  await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-C/estrategia'));
  await expect(page.getByTestId('estrategia-resumen')).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4b-estrategia-1280-ventana.png' });
  await page.screenshot({ path: 'docs/evidencia/h4b-estrategia-1280-pagina.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4b-estrategia-320.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  // Tablero
  await page.locator('#rol-activo').selectOption('lider');
  await expect(page.getByTestId('tablero-resumen')).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4b-tablero-1280-ventana.png' });
  await page.screenshot({ path: 'docs/evidencia/h4b-tablero-1280-pagina.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/evidencia/h4b-tablero-320.png', fullPage: true });
});
