// Lote H (AG-033): capa visual aditiva. Servicio en modo FALSO; proyectos de ejemplo (P-A) y creados (N-1). 320, 768 y 1280 px.
// Guion de «Empresa Ficticia Alfa» (y Omega): datos 2 (R1), infraestructura 3 (R2), gobernanza 4 (R3); estrategia, talento y cultura sin evidencia.
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, entrarConsultor, generarDiagnosticoReal, ruta, subir, vaciarServicio } from './helpers/real';

const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const barra = (page: Page, dim: string) => page.getByTestId(`maturity-level-${dim}`).locator('.scale-bar');
async function aceptar(page: Page, ...ids: string[]) {
  for (const id of ids) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
}
const guardado = (page: Page) => page.waitForTimeout(900);

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
  await vaciarServicio(request, 'N-1');
});

test.describe('capa visual', () => {
  test('madurez: barras con ancho y etiqueta; las dimensiones sin evidencia o sin respaldo, vacías y sin número', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3');
    const datos = barra(page, 'datos');
    await expect(datos).toHaveAttribute('role', 'img');
    await expect(datos).toHaveAttribute('aria-label', 'Datos: nivel 2 de 5, basado en 1 hallazgo');
    await expect(datos.locator('.scale-fill')).toHaveCSS('width', /.+/);
    expect(await datos.locator('.scale-fill').getAttribute('style')).toMatch(/width:\s*40%/);
    await expect(barra(page, 'gobernanza').locator('.scale-fill')).toHaveAttribute('style', /width:\s*80%/);
    await expect(barra(page, 'cultura')).toHaveAttribute('aria-label', 'Cultura: Sin evidencia suficiente, basado en 0 hallazgos');
    await expect(barra(page, 'cultura').locator('.scale-empty')).toHaveCount(1);
    await expect(barra(page, 'cultura').locator('.scale-fill')).toHaveCount(0);
    await expect(barra(page, 'cultura')).not.toContainText(/\d de 5/);
    await card(page, 'R3').getByRole('button', { name: /^Rechazar/ }).click();
    await expect(barra(page, 'gobernanza')).toHaveAttribute('aria-label', 'Gobernanza: Sin respaldo vigente, basado en 0 hallazgos');
    await expect(barra(page, 'gobernanza')).not.toContainText(/\d de 5/);
    // los textos actuales siguen
    await expect(page.getByTestId('maturity-level-datos')).toContainText('Deriva de: R1');
    await expect(page.getByTestId('maturity-index')).toContainText('Índice de madurez: 2,5 de 5');
  });

  test('tarjeta del nivel general: «—» sin índice; «N de 5», 5 segmentos y «estimado por IA» con índice', async ({ page }) => {
    await generarDiagnosticoReal(page);
    const t = page.getByTestId('maturity-card');
    await expect(t.getByTestId('maturity-card-value')).toHaveText('—');
    await expect(t).toContainText('Sin evidencia suficiente');
    await expect(t.locator('.segment')).toHaveCount(5);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3');
    await expect(t.getByTestId('maturity-card-value')).toHaveText('3,0 de 5');
    await expect(t).toContainText('estimado por IA');
    await expect(t.locator('[role=img]')).toHaveAttribute('aria-label', 'Nivel general: 3,0 de 5');
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('simulado: la tarjeta dice «ilustrativo, ficticio» y los proyectos de ejemplo se ven igual de bien', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-C', 'diagnostico');
    const t = page.getByTestId('maturity-card');
    await expect(t.getByTestId('maturity-card-value')).toHaveText('3,1 de 5');
    await expect(t).toContainText('ilustrativo, ficticio');
    await expect(page.getByTestId('review-stats')).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('hallazgos como tarjetas: chip de pilar, estado, «Verificado» y la cita en una caja gris con archivo y ubicación', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1');
    const r1 = card(page, 'R1');
    await expect(r1.locator('.chip-pillar')).toHaveText('Datos');
    await expect(r1.getByText('Aceptado')).toBeVisible();
    await expect(r1.locator('.chip-verified')).toHaveText('Verificado');
    await expect(r1.locator('.cite-box')).toContainText('notas-reunion.txt');
    await expect(card(page, 'R4').getByText('NO VERIFICADO').first()).toBeVisible();
    await expect(card(page, 'R4').locator('.chip-verified')).toHaveCount(0);
  });

  test('cifras y barra segmentada de la revisión (Diagnóstico y Revisión); cambian al decidir', async ({ page }) => {
    await generarDiagnosticoReal(page);
    const s = page.getByTestId('review-stats');
    await expect(s.getByTestId('stat-total')).toContainText('4');
    await expect(s.getByTestId('stat-pending')).toContainText('4');
    await expect(s.getByTestId('stat-unverified')).toContainText('1');
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2');
    await card(page, 'R3').getByRole('button', { name: /^Rechazar/ }).click();
    await expect(s.getByTestId('stat-adopted')).toContainText('2');
    await expect(s.getByTestId('stat-rejected')).toContainText('1');
    await expect(s.getByTestId('stat-pending')).toContainText('1');
    await expect(s.locator('[role=img]')).toHaveAttribute('aria-label', 'Estado de la revisión: 2 aceptados o editados, 1 rechazado, 1 pendiente');
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('Estrategia real: chips «Deriva de» con los ids existentes; las reglas no cambian', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3');
    await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await expect(page.getByText('Es de solo lectura.')).toBeVisible();
    await abrir(page, 'P-A', 'estrategia');
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    await expect(page.getByTestId('strategy-content')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('derived-ER1').locator('.chip-id')).toHaveText(['R1']);
    await expect(page.getByTestId('derived-EF1').locator('.chip-id')).toHaveText(['R2', 'R3']);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('tablero del Líder con solo los datos de ejemplo: queda como en la 001, sin la sección de promedio por pilar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    await expect(page.getByTestId('kpi-madurez')).toBeVisible();
    await expect(page.getByTestId('pillar-averages')).toHaveCount(0);
    await expect(page.getByText(/por pilar/i)).toHaveCount(0);
    await expect(page.getByTestId('mix-note')).toHaveCount(0); // sin proyectos reales no hay mezcla
    await expectNoHorizontalScroll(page);
  });

  test('tablero del Líder: promedio por pilar con barras y texto; conserva la nota de mezcla', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3');
    await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await expect(page.getByText('Es de solo lectura.')).toBeVisible();
    await guardado(page);
    await page.locator('#rol-activo').selectOption('lider');
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    const sec = page.getByTestId('pillar-averages');
    await expect(sec).toBeVisible();
    await expect(sec).toContainText('estimado por IA');
    await expect(sec.locator('.scale-bar')).toHaveCount(6);
    await expect(sec.locator('.scale-bar').nth(2)).toHaveAttribute('aria-label', 'Datos: promedio 2,0 de 5, basado en 1 proyecto');
    await expect(sec.locator('.scale-bar').nth(5)).toHaveAttribute('aria-label', 'Cultura: Sin evidencia suficiente, basado en 0 proyectos');
    await expect(page.getByTestId('mix-note')).toBeVisible();
    await expect(page.getByTestId('kpi-madurez')).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('proyecto creado: se ve igual de bien (barras, tarjeta, cifras)', async ({ page }) => {
    await entrarConsultor(page);
    await page.getByTestId('new-project-button').click();
    await page.getByLabel('Nombre de la empresa').fill('Empresa Ficticia Omega');
    await page.getByRole('button', { name: 'Crear proyecto' }).click();
    await subir(page, ruta(['notas-reunion.txt', 'politica-datos.pdf']));
    await abrir(page, 'N-1', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(card(page, 'R1')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('maturity-card')).toBeVisible();
    await expect(page.getByTestId('review-stats')).toBeVisible();
    await expect(page.locator('[data-testid^="maturity-level-"] .scale-bar')).toHaveCount(6);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('impresión en blanco y negro: los valores están en texto y la Empresa no ve datos técnicos', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3');
    await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await expect(page.getByText('Es de solo lectura.')).toBeVisible();
    await abrir(page, 'P-A', 'informe');
    await page.emulateMedia({ media: 'print' });
    const informe = page.getByTestId('print-report');
    await expect(informe.locator('.scale-bar').first()).toBeVisible();
    const texto = await informe.innerText();
    expect(texto).toContain('Nivel 2 de 5');
    expect(texto).toMatch(/2 de 5/);
    expect(texto).toContain('Sin evidencia suficiente');
    expect(texto).toContain('basado en 1 hallazgo');
    expect(texto).toContain('estimado por IA');
    await page.emulateMedia({ media: 'screen' });
    await guardado(page);
    // la Empresa (P-B copia del estado de P-A, como en D3): sin datos técnicos
    const STORAGE_KEY = 'consultor-agentico-demo:state';
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)!); s.projects['P-B'] = JSON.parse(JSON.stringify(s.projects['P-A'])); localStorage.setItem(k, JSON.stringify(s)); }, STORAGE_KEY);
    await page.reload();
    await page.locator('#rol-activo').selectOption('contacto');
    await page.goto('/#/contacto/informe');
    await expect(page.getByTestId('print-report')).toBeVisible();
    const html = await page.locator('body').innerHTML();
    for (const t of ['trace-view', 'tech-sheet', 'Ver cómo trabajó el agente', 'Ficha técnica', 'modelo-falso-e2e']) expect(html).not.toContain(t);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });
});
