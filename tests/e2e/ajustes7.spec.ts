import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
async function login(page: Page, role: 'Consultor' | 'Líder' | 'Contacto') {
  await page.goto('/');
  await page.getByRole('button', { name: `Entrar como ${role}` }).click();
}
/** Cada puntaje de la rúbrica en solo lectura ocupa una sola línea. */
async function expectScoresOnOneLine(page: Page) {
  const lines = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.grade-levels strong')].map((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return { text: el.textContent, lines: new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size };
    }),
  );
  expect(lines.length).toBeGreaterThanOrEqual(4);
  for (const l of lines) expect(l.lines, `«${l.text}» se parte en varias líneas`).toBe(1);
}

test.describe('Ajuste 1: puntaje de la rúbrica en una sola línea', () => {
  test('vista del Consultor (P-C) y del Líder (dx/P-C, st/P-C)', async ({ page }) => {
    await login(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-C/estrategia');
    await expect(page.getByTestId('grade-average')).toBeVisible();
    await expectScoresOnOneLine(page);
    await expectNoHorizontalScroll(page);
    await page.getByLabel('Rol activo').selectOption('lider');
    for (const h of ['#/lider/entregas/dx/P-C', '#/lider/entregas/st/P-C']) {
      await goto(page, h);
      await expect(page.getByTestId('grade-average')).toBeVisible();
      await expectScoresOnOneLine(page);
    }
  });
});

test.describe('Ajuste 2: destino del bloqueo de Estrategia', () => {
  test('sin diagnóstico: «Ir al diagnóstico»; generado y sin emitir: «Ir a la revisión»', async ({ page }) => {
    await login(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/estrategia');
    await expect(page.getByRole('heading', { name: 'Estrategia bloqueada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir a la revisión' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Ir al diagnóstico' }).click();
    await expect(page).toHaveURL(/P-A\/diagnostico$/);
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();

    await goto(page, '#/consultor/proyectos/P-A/estrategia');
    await expect(page.getByRole('heading', { name: 'Estrategia bloqueada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir al diagnóstico' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Ir a la revisión' }).click();
    await expect(page).toHaveURL(/P-A\/revision$/);
    await expect(page.getByTestId('review-progress')).toBeVisible(); // la revisión sí está disponible
  });
});

test.describe('Ajuste 3: promedio de calificaciones del tablero', () => {
  test('incluye las calificaciones guardadas en la sesión y usa coma', async ({ page }) => {
    await login(page, 'Líder');
    await expect(page.getByTestId('kpi-promedio')).toContainText('4,2 de 5');
    await goto(page, '#/lider/entregas/dx/E-3');
    for (const name of ['Trazabilidad de la evidencia', 'Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación']) {
      await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '1' }).check({ force: true });
    }
    await page.getByLabel(/Comentarios/).fill('Muy por debajo de lo esperado.');
    await page.getByRole('button', { name: 'Guardar calificación' }).click();
    await expect(page.getByTestId('grade-average')).toHaveText('Promedio: 1,0 de 5');
    await goto(page, '#/lider');
    await expect(page.getByTestId('kpi-promedio')).toContainText('3,4 de 5'); // (4,5 + 4,25 + 3,75 + 1) / 4
    await expect(page.getByTestId('kpi-promedio')).not.toContainText('.');
  });
});

test.describe('Ajuste 4: una sola insignia «Simulada» en la vista del Líder', () => {
  test('entrega de diagnóstico y de estrategia', async ({ page }) => {
    await login(page, 'Líder');
    for (const h of ['#/lider/entregas/dx/E-2', '#/lider/entregas/st/P-C']) {
      await goto(page, h);
      await expect(page.getByRole('heading', { level: 1, name: 'Revisión de la entrega' })).toBeVisible();
      await expect(page.locator('main').getByText('Simulada', { exact: true })).toHaveCount(1);
    }
  });
});

test.describe('Ajuste 7: Contacto de la empresa', () => {
  test('el selector y el ingreso usan el nombre nuevo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Entrar como Contacto de la empresa' })).toBeVisible();
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await expect(page.getByLabel('Rol activo').locator('option', { hasText: 'Contacto de la empresa' })).toHaveCount(1);
    await expect(page.getByLabel('Rol activo').locator('option', { hasText: /^Contacto$/ })).toHaveCount(0);
  });
  test('sin vista propia: mensaje claro, sin menús vacíos ni enlaces rotos', async ({ page }) => {
    await login(page, 'Contacto');
    await expect(page.getByRole('heading', { level: 1, name: 'Contacto de la empresa' })).toBeVisible();
    await expect(
      page.getByText('Esta vista es para la persona de la empresa cliente que recibe el informe. Aún no está disponible en esta demostración.'),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toHaveCount(0);
    await expect(page.locator('main').getByRole('link')).toHaveCount(0);
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  });
  test('el aviso al abrir una ruta de otro rol usa el nombre nuevo', async ({ page }) => {
    await login(page, 'Contacto');
    await goto(page, '#/lider');
    await expect(page.getByTestId('notices')).toContainText('Esa vista pertenece al rol Líder. Estás como Contacto de la empresa.');
  });
});
