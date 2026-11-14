// Lote D2 · T145 (AG-031): madurez por dimensión e índice calculado por código, con el servicio local en modo FALSO.
// El guion de «Empresa Ficticia Alfa» registra R1 datos, R2 infraestructura, R3 gobernanza y R4 talento (NO VERIFICADO)
// y propone niveles: datos 2 (R1), infraestructura 3 (R2), gobernanza 4 (R3). Estrategia, talento y cultura quedan sin evidencia.
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, entrarConsultor, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

const MODELO = 'modelo-falso-e2e';
const ROTULO = `Generado por IA (modelo ${MODELO}) · requiere revisión humana`; // D3 cambia el rótulo; aquí se prueba el vigente en D2
const ETIQUETA = 'Calculado por código a partir de niveles propuestos por IA';
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const nivel = (page: Page, dim: string) => page.getByTestId(`maturity-level-${dim}`);
// Una por una (como en ia-real.spec.ts): la primera versión las hacía en paralelo con Promise.all y en la corrida única de e2e
// se perdieron clics (solo 1 de 3 hallazgos quedó aceptado en 768 y 1280 px). Corrección SIN volver a correr e2e (regla de una sola corrida).
async function aceptar(page: Page, ...ids: string[]) {
  for (const id of ids) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
}

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test.describe('madurez en modo IA real', () => {
  test('recién generado: seis niveles, sin número aún; el índice es «—» y no hay controles de revisión por nivel', async ({ page }) => {
    await generarDiagnosticoReal(page);
    const panel = page.getByTestId('maturity-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-testid^="maturity-level-"]')).toHaveCount(6);
    for (const dim of ['datos', 'infraestructura', 'gobernanza']) {
      await expect(nivel(page, dim)).toContainText('Sin respaldo vigente');
      await expect(nivel(page, dim)).toContainText('aún no están aceptados');
    }
    for (const dim of ['estrategia', 'talento', 'cultura']) {
      await expect(nivel(page, dim)).toContainText('Sin evidencia suficiente');
      await expect(nivel(page, dim)).toContainText('NO VERIFICADO');
    }
    await expect(page.getByTestId('maturity-index')).toContainText('Índice de madurez: —');
    await expect(page.getByTestId('maturity-index-label')).toHaveText(ETIQUETA);
    await expect(panel.getByRole('button')).toHaveCount(0); // sin Aceptar, Editar ni Rechazar por nivel
    await expect(page.getByText('Sin índice de madurez')).toHaveCount(0);
  });

  test('al aceptar hallazgos el índice se calcula con los niveles respaldados; cada nivel dice «basado en N»; rechazar recalcula', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await expect(page.getByTestId('review-progress')).toHaveText('0 de 4 hallazgos revisados');
    await aceptar(page, 'R1', 'R2', 'R3');
    await expect(page.getByTestId('review-progress')).toHaveText('3 de 4 hallazgos revisados'); // el contador cuenta solo hallazgos
    const panel = page.getByTestId('maturity-panel');
    await expect(nivel(page, 'datos')).toContainText('Nivel 2 de 5');
    await expect(nivel(page, 'datos')).toContainText('basado en 1 hallazgo');
    await expect(nivel(page, 'datos')).toContainText('Deriva de: R1');
    await expect(nivel(page, 'datos')).toContainText('Las cifras viven en cada área');
    await expect(nivel(page, 'datos').getByTestId('ai-badge')).toHaveText(ROTULO);
    await expect(nivel(page, 'infraestructura')).toContainText('Nivel 3 de 5');
    await expect(nivel(page, 'gobernanza')).toContainText('Nivel 4 de 5');
    await expect(page.getByTestId('maturity-index')).toContainText('Índice de madurez: 3,0 de 5'); // (2 + 3 + 4) / 3
    await expect(page.getByTestId('maturity-index')).not.toContainText('ilustrativo');
    await expect(page.getByTestId('maturity-index-label')).toHaveText(ETIQUETA);
    await card(page, 'R3').getByRole('button', { name: /^Rechazar/ }).click();
    await expect(nivel(page, 'gobernanza')).toContainText('Sin respaldo vigente');
    await expect(nivel(page, 'gobernanza')).toContainText('rechazados');
    await expect(page.getByTestId('maturity-index')).toContainText('Índice de madurez: 2,5 de 5'); // (2 + 3) / 2
    await expect(panel.getByRole('button')).toHaveCount(0);
    // «Aprobar y emitir» se rige solo por los hallazgos (FR-021): falta revisar R4
    await expect(page.getByRole('button', { name: 'Aprobar y emitir' })).toHaveAttribute('aria-disabled', 'true');
    await aceptar(page, 'R4');
    await expect(page.getByRole('button', { name: 'Aprobar y emitir' })).toHaveAttribute('aria-disabled', 'false');
  });

  test('emitido: el informe, la entrega del Líder y el tablero usan el índice real; la nota de mezcla aparece solo con mezcla', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3', 'R4');
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await expect(page.getByText('Es de solo lectura.')).toBeVisible();

    await abrir(page, 'P-A', 'informe');
    const informe = page.getByTestId('print-report');
    await expect(informe).toContainText('Índice de madurez: 3,0 de 5');
    await expect(informe).toContainText(ETIQUETA);
    await expect(informe).not.toContainText('ilustrativo');
    await expect(informe).not.toContainText('Sin índice de madurez');
    await expect(informe).toContainText('Nivel 2 de 5');
    await expect(informe).toContainText('basado en 1 hallazgo');

    await page.locator('#rol-activo').selectOption('lider');
    await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
    // 6 diagnósticos emitidos: los 5 de ejemplo (2,4 · 3,1 · 2,4 · 1,8 · 2,8) y el real (3,0) → 15,5 / 6 = 2,58
    await expect(page.getByTestId('kpi-madurez')).toContainText('2,6');
    await expect(page.getByTestId('mix-note')).toHaveText('El promedio mezcla proyectos simulados (ilustrativos) y reales (estimados por IA)');
    await page.goto('/#/lider/entregas/dx/P-A');
    await expect(page.getByTestId('maturity-index')).toContainText('Índice de madurez: 3,0 de 5');
    await expect(page.getByTestId('maturity-index-label')).toHaveText(ETIQUETA);
    await expect(page.getByTestId('maturity-panel')).toBeVisible();
    await expect(page.getByTestId('maturity-panel').getByRole('button')).toHaveCount(0);
  });

  test('el índice simulado no cambia: un proyecto Simulado sigue con su valor ilustrativo y el tablero no muestra la nota de mezcla', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('finding-H1')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Índice de madurez: 2,4 de 5')).toBeVisible();
    await expect(page.getByText('(ilustrativo, ficticio)')).toBeVisible();
    await expect(page.getByTestId('maturity-panel')).toHaveCount(0);
    await page.locator('#rol-activo').selectOption('lider');
    await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
    await expect(page.getByTestId('mix-note')).toHaveCount(0);
    await expect(page.getByTestId('kpi-madurez')).toContainText('2,5');
  });

  test('la recarga conserva los niveles y el índice se recalcula', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2');
    await expect(page.getByTestId('maturity-index')).toContainText('Índice de madurez: 2,5 de 5');
    await page.reload();
    await expect(nivel(page, 'infraestructura')).toContainText('Nivel 3 de 5');
    await expect(page.getByTestId('maturity-index')).toContainText('Índice de madurez: 2,5 de 5');
  });

  test('accesible y sin desplazamiento horizontal', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await expect(page.getByTestId('maturity-panel')).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });
});
