import { test, type Page } from '@playwright/test';

// Capturas del lote L6g para la revisión humana (una por pieza y ancho); solo con EVIDENCIA=1.
// Las de los diálogos con el foco visible salen de foco-visible.spec.ts (L); las de K salen de capturas.l6f.spec.ts.
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

async function entrar(page: Page, rol: 'Consultor' | 'Líder' | 'Empresa') {
  await page.goto('/');
  await page.getByRole('button', { name: `Entrar como ${rol}` }).click();
}
const ir = (page: Page, hash: string) => page.evaluate((h) => (window.location.hash = h), hash);

test('capturas de L6g', async ({ page }, info) => {
  const dir = 'docs/evidencia/capturas/L6g';
  const w = info.project.name;
  const shot = (name: string) => page.screenshot({ path: `${dir}/${name}-${w}.png`, fullPage: true });

  // D: vista de la Empresa
  await entrar(page, 'Empresa');
  await page.getByRole('heading', { level: 2, name: 'Ruta de adopción' }).waitFor();
  await shot('D-empresa-inicio');
  await page.getByRole('link', { name: 'Ver informe de diagnóstico' }).first().click();
  await page.getByTestId('print-report').waitFor();
  await shot('D-empresa-informe');
  await ir(page, '#/contacto/encuesta');
  await page.getByRole('button', { name: 'Guardar respuestas' }).waitFor();
  await shot('D-empresa-encuesta');
  for (let i = 0; i < 3; i++) await page.getByRole('radiogroup').nth(i).getByRole('radio', { name: String(3 + (i % 2)) }).check({ force: true });
  await page.getByRole('button', { name: 'Guardar respuestas' }).click();
  await page.getByTestId('encuesta-confirmacion').waitFor();
  await shot('D-empresa-encuesta-guardada');

  // G: análisis de sector y de mercado (estrategia de P-C ya enviada)
  await page.getByLabel('Rol activo').selectOption('consultor');
  await ir(page, '#/consultor/proyectos/P-C/estrategia');
  await page.getByTestId('estr-sector').waitFor();
  await shot('G-estrategia-sector-mercado');

  // F: datos de la empresa en la captura de evidencia
  await ir(page, '#/consultor/proyectos/P-A/evidencia');
  await page.getByRole('region', { name: 'Datos de la empresa (ficticios)' }).waitFor();
  await shot('F-evidencia-datos-empresa');

  // E: tablero del Líder con madurez y buscador (con una búsqueda)
  await page.getByLabel('Rol activo').selectOption('lider');
  await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
  await shot('E-tablero');
  await page.getByLabel('Buscar equipo o empresa').fill('beta');
  await shot('E-tablero-busqueda');
  await page.getByLabel('Buscar equipo o empresa').fill('zzz');
  await shot('E-tablero-sin-resultados');

  // H: texto de la entrega enviada (estrategia de P-B enviada por el Consultor)
  await page.getByLabel('Rol activo').selectOption('consultor');
  await ir(page, '#/consultor/proyectos/P-B/estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  await page.getByText('Enviada al Líder').first().waitFor();
  await shot('H-estrategia-enviada');
  await ir(page, '#/consultor/proyectos/P-B/diagnostico');
  await page.getByRole('heading', { level: 1, name: 'Diagnóstico' }).waitFor();
  await shot('H-diagnostico-emitido');
});
