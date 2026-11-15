// Capturas del lote H (AG-033). Solo se ejecuta con CAPTURAS=1 (no forma parte de la suite normal). Datos ficticios del guion de prueba.
import { expect, test, type Page } from '@playwright/test';
import { abrir, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

test.skip(!process.env.CAPTURAS, 'Solo con CAPTURAS=1');
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);

test('capturas de la capa visual', async ({ page, request }, info) => {
  test.setTimeout(120_000);
  const w = info.project.name;
  await vaciarServicio(request, 'P-A');
  const shot = (name: string) => page.screenshot({ path: `docs/evidencia/h-${name}-${w}.png`, fullPage: true });
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  await expect(page.getByTestId('maturity-card-value')).toHaveText('3,0 de 5');
  await shot('revision');
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await expect(page.getByTestId('strategy-content')).toBeVisible({ timeout: 30_000 });
  await shot('estrategia');
  await page.waitForTimeout(900);
  await page.locator('#rol-activo').selectOption('lider');
  await expect(page.getByTestId('pillar-averages')).toBeVisible();
  await shot('tablero');
  await page.locator('#rol-activo').selectOption('consultor');
  await abrir(page, 'P-C', 'diagnostico');
  await expect(page.getByTestId('maturity-card')).toBeVisible();
  await shot('ejemplo-simulado');
});
