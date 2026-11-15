// Capturas del lote H2 (AG-034). Solo con CAPTURAS=1 (no forman parte de la suite normal). Datos ficticios del guion de prueba.
import { expect, test, type Page } from '@playwright/test';
import { abrir, entrarConsultor, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

test.skip(!process.env.CAPTURAS, 'Solo con CAPTURAS=1');
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);

test('capturas del rediseño', async ({ page, request }, info) => {
  test.setTimeout(150_000);
  const w = info.project.name;
  await vaciarServicio(request, 'P-A');
  const shot = (name: string) => page.screenshot({ path: `docs/evidencia/h2-${name}-${w}.png`, fullPage: true });
  await entrarConsultor(page);
  await expect(page.getByTestId('new-project-button')).toBeEnabled({ timeout: 15_000 });
  await shot('proyectos');
  await generarDiagnosticoReal(page);
  await shot('diagnostico');
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  await expect(page.getByTestId('maturity-card-value')).toHaveText('3,0 de 5');
  await shot('revision');
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
  await abrir(page, 'P-A', 'informe');
  await expect(page.getByTestId('print-report')).toBeVisible();
  await shot('informe');
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await expect(page.getByTestId('strategy-content')).toBeVisible({ timeout: 30_000 });
  await shot('estrategia');
  await page.waitForTimeout(900);
  await page.locator('#rol-activo').selectOption('lider');
  await expect(page.getByTestId('pillar-averages')).toBeVisible();
  await shot('tablero');
});
