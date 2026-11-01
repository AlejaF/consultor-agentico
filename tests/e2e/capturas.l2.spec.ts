import { test } from '@playwright/test';
import { EXE_NO_PERMITIDO, PDF_VALIDO } from './fixtures/archivos';

// Capturas de evidencia del L2 para la revisión humana; solo con EVIDENCIA=1.
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

test('capturas de Proyectos y Captura de evidencia', async ({ page }, info) => {
  const dir = 'docs/evidencia/capturas/L2';
  const w = info.project.name;
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await page.getByRole('heading', { level: 1, name: 'Proyectos' }).waitFor();
  await page.screenshot({ path: `${dir}/proyectos-${w}.png`, fullPage: true });

  await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-A/evidencia'));
  await page.getByRole('heading', { level: 1, name: 'Captura de evidencia' }).waitFor();
  await page.getByLabel('¿Cuál es el objetivo principal de la transformación?').selectOption('Reducir costos');
  await page.locator('input[type=file]').setInputFiles([PDF_VALIDO, EXE_NO_PERMITIDO]);
  await page.getByTestId('upload-result').getByText('programa.exe').waitFor();
  await page.screenshot({ path: `${dir}/evidencia-rechazo-${w}.png`, fullPage: true });

  await page.reload();
  await page.getByText('Contenido no conservado en esta demo.').waitFor();
  await page.screenshot({ path: `${dir}/evidencia-recarga-${w}.png`, fullPage: true });

  await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-D/evidencia'));
  await page.getByText('Este proyecto no tiene evidencia.').waitFor();
  await page.screenshot({ path: `${dir}/evidencia-sin-evidencia-${w}.png`, fullPage: true });
});
