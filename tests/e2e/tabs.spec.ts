import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

async function loginAs(page: Page, role: 'Consultor' | 'Líder' | 'Empresa') {
  await page.goto('/');
  await page.getByRole('button', { name: `Entrar como ${role}` }).click();
}
async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' });
const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

async function expectTargets44(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('nav a[href], header button, header select, header a[href]')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ t: (el.textContent ?? '').trim().slice(0, 30), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height < 44 || r.width < 44)
      .map(({ t, r }) => `${t} ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small, 'elementos de navegación menores de 44 px').toEqual([]);
}

test.describe('pestañas de navegación bajo 1024 px (FR-049)', () => {
  test('Consultor en un proyecto: 4 pestañas visibles sin abrir nada, cada una con su estado en texto', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-B/diagnostico');
    await expect(page.getByRole('button', { name: 'Menú' })).toHaveCount(0);
    const items = nav(page).getByRole('list', { name: /Pasos de/ }).getByRole('listitem');
    await expect(items).toHaveCount(4);
    for (const i of [0, 1, 2, 3]) await expect(items.nth(i)).toBeVisible();
    await expect(items.nth(0)).toContainText('Evidencia');
    await expect(items.nth(1)).toHaveText('DiagnósticoCompletado');
    await expect(items.nth(2)).toHaveText('RevisiónCompletado');
    await expect(items.nth(3)).toHaveText('EstrategiaDisponible');
    await expect(nav(page).getByRole('link', { name: /^Diagnóstico/ })).toHaveAttribute('aria-current', 'page');
  });

  test('la barra va bajo la cabecera y antes del contenido', async ({ page }) => {
    test.skip(!isNarrow(page), 'Solo bajo 1024 px');
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    const pos = await page.evaluate(() => {
      const header = document.querySelector('header')!.getBoundingClientRect();
      const bar = document.querySelector('nav')!.getBoundingClientRect();
      const main = document.querySelector('main')!.getBoundingClientRect();
      return { afterHeader: bar.top >= header.bottom - 1, beforeMain: bar.bottom <= main.top + 1, inViewport: bar.bottom <= window.innerHeight };
    });
    expect(pos).toEqual({ afterHeader: true, beforeMain: true, inViewport: true });
  });

  test('no hay menú «Opciones» ni panel de cuenta: «Restablecer demo» está en la cabecera', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    await expect(page.getByRole('button', { name: 'Opciones' })).toHaveCount(0);
    await expect(page.locator('#cuenta')).toHaveCount(0);
    await expect(page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' })).toBeVisible();
  });

  test('Líder: «Tablero» y «Entregas por revisar (n)» siempre a la vista', async ({ page }) => {
    await loginAs(page, 'Líder');
    await expect(nav(page).getByRole('link', { name: 'Tablero' })).toBeVisible();
    await expect(nav(page).getByRole('link', { name: /^Entregas por revisar \(\d+\)$/ })).toBeVisible();
  });

  test('Empresa (L5b): la barra de pestañas muestra Resumen, Informe de diagnóstico y Encuesta', async ({ page }) => {
    await loginAs(page, 'Empresa');
    await expect(nav(page).getByRole('link')).toHaveText(['Resumen', 'Informe de diagnóstico', 'Encuesta']);
  });

  test('un paso bloqueado lleva a su pantalla con la explicación', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-D/evidencia');
    await nav(page).getByRole('link', { name: /^Estrategia/ }).click();
    await expect(page).toHaveURL(/P-D\/estrategia$/);
    await expect(page.getByRole('heading', { name: 'Estrategia bloqueada' })).toBeVisible();
  });

  test('teclado: Tab llega a las pestañas, el foco se ve y Enter navega', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    const target = nav(page).getByRole('link', { name: /^Revisión/ });
    for (let i = 0; i < 40 && !(await target.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
    const outline = await target.evaluate((el) => getComputedStyle(el).outlineStyle + '|' + getComputedStyle(el).outlineWidth);
    expect(outline).not.toMatch(/^none/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/P-A\/revision$/);
  });

  for (const [role, hash] of [
    ['Consultor', '#/consultor/proyectos/P-B/revision'],
    ['Líder', '#/lider'],
    ['Empresa', '#/contacto'],
  ] as const) {
    test(`${role}: sin desplazamiento horizontal, objetivos ≥ 44 px y axe`, async ({ page }) => {
      await loginAs(page, role);
      await goto(page, hash);
      if (role !== 'Empresa') await expect(nav(page)).toBeVisible();
      await expectNoHorizontalScroll(page);
      await expectTargets44(page);
      await expectNoAxeViolations(page);
    });
  }
});
