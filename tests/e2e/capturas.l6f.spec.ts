import { test } from '@playwright/test';

// Capturas del L6f para la revisión humana; solo con EVIDENCIA=1.
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

test('capturas de L6f: cabecera adaptable e informe imprimible', async ({ page }, info) => {
  const dir = 'docs/evidencia/capturas/L6f';
  const w = info.project.name;
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Empresa' }).click();
  if (w === '320') {
    for (const ancho of [320, 360]) {
      for (const base of [16, 20, 32]) {
        await page.setViewportSize({ width: ancho, height: 700 });
        const estilo = await page.addStyleTag({ content: `html { font-size: ${base}px !important; }` });
        await page.locator('header.topbar').screenshot({ path: `${dir}/encabezado-${ancho}px-fuente-${base}.png` });
        await estilo.evaluate((e) => e.remove());
      }
    }
    await page.setViewportSize({ width: 320, height: 640 });
  }
  // informe: pantalla y vista de impresión (carta)
  await page.getByLabel('Rol activo').selectOption('consultor');
  await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-B/informe'));
  await page.getByTestId('print-report').waitFor();
  await page.screenshot({ path: `${dir}/informe-pantalla-${w}.png`, fullPage: true });
  if (w === '1280') {
    await page.setViewportSize({ width: 816, height: 1056 });
    await page.emulateMedia({ media: 'print' });
    await page.screenshot({ path: `${dir}/informe-impresion-carta.png`, fullPage: true });
  }
});
