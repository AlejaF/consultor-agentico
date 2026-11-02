import { test, type Page } from '@playwright/test';

// Capturas del L6c para la revisión humana; solo con EVIDENCIA=1.
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
const CRITERIOS = ['Trazabilidad de la evidencia', 'Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación'];

test('capturas de L6c', async ({ page }, info) => {
  const dir = 'docs/evidencia/capturas/L6c';
  const w = info.project.name;
  const shot = (name: string) => page.screenshot({ path: `${dir}/${name}-${w}.png`, fullPage: true });

  // (a) Diálogo de «Restablecer demo»
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await goto(page, '#/consultor/proyectos/P-B/diagnostico');
  await page.getByRole('heading', { level: 1, name: 'Diagnóstico' }).waitFor();
  await page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }).click();
  await page.getByRole('dialog').getByText('Se borrarán tus cambios en este navegador.').waitFor();
  await shot('restablecer-dialogo');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

  // (b) El Líder guarda una calificación sin comentario
  await page.getByLabel('Rol activo').selectOption('lider');
  await goto(page, '#/lider/entregas/dx/P-B');
  await page.getByRole('button', { name: 'Guardar calificación' }).waitFor();
  for (const name of CRITERIOS) await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '4' }).check({ force: true });
  await page.getByRole('button', { name: 'Guardar calificación' }).click();
  await page.getByText('Sin comentario').waitFor();
  await shot('calificacion-sin-comentario-lider');

  // ... y esa misma calificación vista por el Consultor
  await page.getByLabel('Rol activo').selectOption('consultor');
  await goto(page, '#/consultor/proyectos/P-B/revision');
  await page.getByText('Sin comentario').waitFor();
  await shot('calificacion-sin-comentario-consultor');
});
