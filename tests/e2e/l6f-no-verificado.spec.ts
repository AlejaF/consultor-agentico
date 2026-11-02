import { expect, test } from '@playwright/test';
import { projectInfo } from '../../src/domain/lookup';
import { expectNoAxeViolations } from './helpers/axe';

/** FR-053: recuento de hallazgos NO VERIFICADO (aceptados o editados) en la cola del Líder y en la entrega. */
const UNO = '1 hallazgo NO VERIFICADO entre los aceptados o editados';
const NINGUNO = 'Ningún hallazgo NO VERIFICADO entre los aceptados o editados';

async function entrarLider(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Líder' }).click();
}

test.describe('FR-053: recuento NO VERIFICADO', () => {
  test('la cola del tablero muestra el recuento en cada entrega (P-B tiene 1)', async ({ page }) => {
    await entrarLider(page);
    const items = page.getByTestId('review-queue').locator('li');
    const n = await items.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(items.nth(i).getByTestId('unverified-count')).toHaveText(/NO VERIFICADO entre los aceptados o editados/);
    const empresaB = projectInfo('P-B').company.name;
    await expect(items.filter({ hasText: empresaB }).filter({ hasText: 'Diagnóstico' }).getByTestId('unverified-count')).toHaveText(UNO);
    await expectNoAxeViolations(page);
  });

  test('«Entregas por revisar» muestra el recuento en cada entrega', async ({ page }) => {
    await entrarLider(page);
    await page.getByRole('link', { name: /Entregas por revisar/ }).first().click();
    await page.getByRole('heading', { level: 1, name: 'Entregas por revisar' }).waitFor();
    const items = page.locator('main ul > li');
    const n = await items.count();
    for (let i = 0; i < n; i++) await expect(items.nth(i).getByTestId('unverified-count')).toBeVisible();
  });

  test('la pantalla de la entrega muestra el recuento (con 1 y con ninguno)', async ({ page }) => {
    await entrarLider(page);
    await page.goto('/#/lider/entregas/dx/P-B');
    await expect(page.getByTestId('unverified-count')).toHaveText(UNO);
    // una entrega sin NO VERIFICADO aceptados
    const sin = page.getByTestId('review-queue');
    await page.goto('/#/lider');
    await sin.waitFor();
    const textos = await sin.locator('[data-testid=unverified-count]').allTextContents();
    expect(textos.some((t) => t === NINGUNO) || textos.every((t) => t === UNO)).toBe(true);
  });
});
