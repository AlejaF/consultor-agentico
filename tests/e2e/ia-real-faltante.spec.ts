// AG-021 (RECORTABLE): información faltante por pilar, como texto de salida rotulado como IA y sin flujos nuevos. T087A.
import { expect, test } from '@playwright/test';
import { abrir, entrarConsultor, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test.describe('información faltante (modo IA real)', () => {
  test('se muestra por pilar, rotulada como IA y sin nada que aceptar ni rechazar', async ({ page }) => {
    await generarDiagnosticoReal(page, ['notas-reunion.txt', 'politica-datos.pdf']);
    const falta = page.getByTestId('missing-info');
    await expect(falta).toBeVisible();
    await expect(falta.getByRole('heading', { level: 2, name: 'Información que habría hecho falta' })).toBeVisible();
    await expect(falta.getByText('Pilar: Talento')).toBeVisible();
    await expect(falta).toContainText('Falta una evaluación verificable de competencias digitales del equipo.');
    await expect(falta.getByText('Pilar: Cultura')).toBeVisible();
    await expect(falta).toContainText('Faltan encuestas que midan la adopción de herramientas digitales.');
    await expect(falta.getByTestId('ai-badge')).toHaveText('Generado por IA (modelo modelo-falso-e2e) · requiere revisión humana');
    await expect(falta.getByRole('button')).toHaveCount(0); // sin flujos nuevos
    await expect(falta.getByRole('link')).toHaveCount(0);
  });

  test('no cuenta como hallazgo en la revisión y se conserva al recargar', async ({ page }) => {
    await generarDiagnosticoReal(page, ['notas-reunion.txt', 'politica-datos.pdf']);
    await abrir(page, 'P-A', 'revision');
    await expect(page.getByTestId('review-progress')).toHaveText('0 de 4 hallazgos revisados');
    await abrir(page, 'P-A', 'diagnostico');
    await page.reload();
    await expect(page.getByTestId('missing-info')).toContainText('Faltan encuestas');
  });

  test('en modo Simulado no aparece', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('finding-H1')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('missing-info')).toHaveCount(0);
    await expect(page.getByText('Información que habría hecho falta')).toHaveCount(0);
  });
});
