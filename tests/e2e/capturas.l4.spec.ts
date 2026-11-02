import { test, type Page } from '@playwright/test';

// Capturas de evidencia del L4 para la revisión humana; solo con EVIDENCIA=1.
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
async function switchRole(page: Page, role: 'consultor' | 'lider') {
  await page.getByLabel('Rol activo').selectOption(role);
}
const GROUPS = ['Trazabilidad de la evidencia', 'Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación'];

test('capturas de L4', async ({ page }, info) => {
  const dir = 'docs/evidencia/capturas/L4';
  const w = info.project.name;
  const shot = (name: string) => page.screenshot({ path: `${dir}/${name}-${w}.png`, fullPage: true });

  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();

  // Estrategia bloqueada y luego generada
  await goto(page, '#/consultor/proyectos/P-A/estrategia');
  await page.getByRole('heading', { name: 'Estrategia bloqueada' }).waitFor();
  await shot('estrategia-bloqueada');

  await goto(page, '#/consultor/proyectos/P-B/estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).waitFor();
  await shot('estrategia-sin-generar');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByTestId('strategy-content').waitFor();
  await shot('estrategia-generada');
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  await page.getByText('Enviada al Líder').waitFor();
  await shot('estrategia-enviada');

  // Tablero del Líder, revisión con rúbrica y calificación guardada
  await switchRole(page, 'lider');
  await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
  await shot('tablero-lider');
  await goto(page, '#/lider/entregas/st/P-B');
  await page.getByRole('button', { name: 'Guardar calificación' }).waitFor();
  await shot('revision-con-rubrica');
  const levels = ['5', '4', '4', '4'];
  for (const [i, name] of GROUPS.entries()) await page.getByRole('radiogroup', { name }).getByRole('radio', { name: levels[i] }).check({ force: true });
  await page.getByLabel(/Comentarios/).fill('Ruta clara y bien apoyada en el diagnóstico. Falta indicar quién responde por cada fase.');
  await page.getByRole('button', { name: 'Guardar calificación' }).click();
  await page.getByTestId('grade-average').waitFor();
  await shot('calificacion-guardada');

  // El Consultor ve la calificación
  await switchRole(page, 'consultor');
  await goto(page, '#/consultor/proyectos/P-B/estrategia');
  await page.getByTestId('grade-average').waitFor();
  await shot('calificacion-vista-por-consultor');

  // Ruta desconocida (#/lider/entregas/xx/P-B): el Líder vuelve al tablero con el aviso «No encontramos esa pantalla.»
  await switchRole(page, 'lider');
  await goto(page, '#/lider/entregas/xx/P-B');
  await page.getByText('No encontramos esa pantalla.').waitFor();
  await shot('tablero-aviso-ruta-desconocida');
});
