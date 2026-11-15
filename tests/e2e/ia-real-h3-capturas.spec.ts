// Lote H3: capturas ficticias en 1280, 1920, 768 y 320 (docs/evidencia/h3-*.png). Servicio en modo FALSO; no usa la API real.
import { test } from '@playwright/test';
import { abrir, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

const TAMANOS = [[1280, 900], [1920, 1080], [768, 1024], [320, 640]] as const;

test('capturas de H3', async ({ page, request }) => {
  test.setTimeout(120_000);
  await vaciarServicio(request, 'P-A');
  await page.setViewportSize({ width: 1280, height: 900 });
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByTestId('finding-R4').getByRole('button', { name: /^Rechazar/ }).click();
  const tomar = async (nombre: string) => {
    for (const [w, h] of TAMANOS) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(200);
      await page.screenshot({ path: `docs/evidencia/h3-${nombre}-${w}.png`, fullPage: true });
    }
  };
  await tomar('revision');
  await abrir(page, 'P-A', 'diagnostico');
  await tomar('diagnostico');
  await abrir(page, 'P-A', 'revision');
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByTestId('strategy-content').waitFor({ timeout: 30_000 });
  await tomar('estrategia');
  await page.evaluate(() => (window.location.hash = '#/consultor'));
  await tomar('proyectos');
  await abrir(page, 'P-A', 'informe');
  await tomar('informe');
  await page.locator('#rol-activo').selectOption('lider');
  await page.waitForTimeout(400);
  await tomar('tablero');
});
