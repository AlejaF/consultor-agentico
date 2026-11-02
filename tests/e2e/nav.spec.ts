import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

async function loginAs(page: Page, role: 'Consultor' | 'Líder' | 'Contacto') {
  await page.goto('/');
  await page.getByRole('button', { name: `Entrar como ${role}` }).click();
}
async function openAccountIfCollapsed(page: Page) {
  const toggle = page.getByRole('button', { name: 'Opciones' });
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  }
}
async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' });
const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

test.describe('navegación lateral por rol', () => {
  test('Consultor: «Proyectos» y, fuera de un proyecto, sin bloque de pasos (bajo 1024 px no hace falta barra)', async ({ page }) => {
    await loginAs(page, 'Consultor');
    if (isNarrow(page)) {
      await expect(nav(page)).toBeHidden();
      return;
    }
    await expect(nav(page).getByRole('link', { name: 'Proyectos' })).toHaveAttribute('aria-current', 'page');
    await expect(nav(page).getByRole('list', { name: /Pasos de/ })).toHaveCount(0);
  });

  test('Consultor dentro de un proyecto: empresa y 4 pasos en orden con su estado en texto', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-D/evidencia');
    const steps = nav(page).getByRole('list', { name: 'Pasos de Empresa Ficticia Delta' }).getByRole('listitem');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(0)).toHaveText('EvidenciaPendiente');
    await expect(steps.nth(1)).toHaveText('DiagnósticoBloqueado');
    await expect(steps.nth(2)).toHaveText('RevisiónBloqueado');
    await expect(steps.nth(3)).toHaveText('EstrategiaBloqueado');
    await expect(nav(page).getByText('Empresa Ficticia Delta')).toBeVisible();
  });

  test('los estados cambian con el proyecto: P-A con evidencia y P-B con diagnóstico emitido', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    let steps = nav(page).getByRole('list', { name: /Pasos de/ }).getByRole('listitem');
    await expect(steps.nth(0)).toHaveText('EvidenciaCompletado');
    await expect(steps.nth(1)).toHaveText('DiagnósticoPendiente');
    await goto(page, '#/consultor/proyectos/P-B/revision');
    steps = nav(page).getByRole('list', { name: /Pasos de/ }).getByRole('listitem');
    await expect(steps.nth(1)).toHaveText('DiagnósticoCompletado');
    await expect(steps.nth(2)).toHaveText('RevisiónCompletado');
    await expect(steps.nth(3)).toHaveText('EstrategiaDisponible');
    await expect(nav(page).getByRole('link', { name: /^Revisión/ })).toHaveAttribute('aria-current', 'page');
  });

  test('un paso bloqueado lleva a su pantalla con la explicación; no redirige', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-D/evidencia');
    await nav(page).getByRole('link', { name: /^Diagnóstico/ }).click();
    await expect(page).toHaveURL(/#\/consultor\/proyectos\/P-D\/diagnostico$/);
    await expect(page.getByText('Carga al menos un archivo para poder generar el diagnóstico.')).toBeVisible();
    await nav(page).getByRole('link', { name: /^Revisión/ }).click();
    await expect(page).toHaveURL(/#\/consultor\/proyectos\/P-D\/revision$/);
    await expect(page.getByRole('heading', { name: 'Aún no hay diagnóstico para revisar' })).toBeVisible();
    await nav(page).getByRole('link', { name: /^Estrategia/ }).click();
    await expect(page).toHaveURL(/#\/consultor\/proyectos\/P-D\/estrategia$/);
    await expect(page.getByRole('heading', { name: 'Estrategia bloqueada' })).toBeVisible();
  });

  test('Líder: «Tablero» y «Entregas por revisar (n)» con n igual a las entregas listadas', async ({ page }) => {
    await loginAs(page, 'Líder');
    await expect(nav(page).getByRole('link', { name: 'Tablero' })).toHaveAttribute('aria-current', 'page');
    const link = nav(page).getByRole('link', { name: /^Entregas por revisar \(\d+\)$/ });
    const n = Number(/\((\d+)\)/.exec((await link.textContent()) ?? '')![1]);
    expect(n).toBeGreaterThan(0);
    await link.click();
    await expect(page).toHaveURL(/#\/lider\/entregas$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Entregas por revisar' })).toBeFocused();
    await expect(page.getByRole('link', { name: /^Abrir entrega/ })).toHaveCount(n);
  });

  test('Contacto de la empresa: sin pantallas no hay menú ni enlaces, solo el mensaje', async ({ page }) => {
    await loginAs(page, 'Contacto');
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Resumen|Encuesta/ })).toHaveCount(0);
    await expect(page.locator('main').getByRole('link')).toHaveCount(0);
    await expect(page.getByText('se completa en un lote posterior')).toHaveCount(0);
  });

  for (const role of ['Consultor', 'Líder', 'Contacto'] as const) {
    test(`pie de ${role}: tarjeta de cuenta y «Restablecer demo» separado; sin «Estás como…»`, async ({ page }) => {
      await loginAs(page, role);
      await openAccountIfCollapsed(page);
      const cuenta = page.locator('#cuenta');
      await expect(cuenta.getByText(`Sesión de demostración · ${role} Demo (cuenta ficticia)`)).toBeVisible();
      await expect(cuenta.locator('hr')).toHaveCount(1);
      await expect(cuenta.getByRole('button', { name: 'Restablecer demo' })).toBeVisible();
      await expect(page.getByText(/Estás como/)).toHaveCount(0);
      // la tarjeta va antes de la línea y el botón después
      const order = await cuenta.evaluate((el) => {
        const card = el.querySelector('.account-card')!.getBoundingClientRect().top;
        const hr = el.querySelector('hr')!.getBoundingClientRect().top;
        const btn = [...el.querySelectorAll('button')].find((b) => b.textContent === 'Restablecer demo')!.getBoundingClientRect().top;
        return card < hr && hr < btn;
      });
      expect(order).toBe(true);
    });
  }

  test('foco: al elegir un enlace el foco pasa al h1 de la nueva pantalla', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    await nav(page).getByRole('link', { name: /^Diagnóstico/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Diagnóstico' })).toBeFocused();
  });

  test('solo teclado: se llega a un enlace de la navegación con Tab y se activa con Enter', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    const target = nav(page).getByRole('link', { name: /^Revisión/ });
    for (let i = 0; i < 40 && !(await target.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/consultor\/proyectos\/P-A\/revision$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Revisión y emisión' })).toBeFocused();
  });

  test('«Opciones» (bajo 1024 px): se abre, Escape la cierra y devuelve el foco al botón', async ({ page }) => {
    test.skip(!isNarrow(page), 'Solo hay botón «Opciones» bajo 1024 px');
    await loginAs(page, 'Consultor');
    const toggle = page.getByRole('button', { name: 'Opciones' });
    await expect(page.getByRole('button', { name: 'Menú' })).toHaveCount(0);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#cuenta').getByRole('button', { name: 'Restablecer demo' })).toBeVisible();
    await page.locator('#cuenta').getByRole('button', { name: 'Restablecer demo' }).focus();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(page.locator('#cuenta')).toBeHidden();
  });

  test('barra de navegación: elementos visibles sin abrir nada, sin desplazamiento horizontal, controles ≥ 44 px y axe', async ({ page }) => {
    await loginAs(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-B/diagnostico');
    await expect(nav(page).getByRole('link', { name: /^Estrategia/ })).toBeVisible();
    await openAccountIfCollapsed(page);
    await expect(page.locator('#cuenta').getByRole('button', { name: 'Restablecer demo' })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('nav a[href], #cuenta button, button, select')]
        .filter((el) => el.offsetParent !== null && !el.classList.contains('skip-link'))
        .map((el) => ({ t: (el.textContent ?? '').trim().slice(0, 30), r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.height < 44 || r.width < 44)
        .map(({ t, r }) => `${t} ${Math.round(r.width)}x${Math.round(r.height)}`),
    );
    expect(small).toEqual([]);
  });

  test('a 1280 px la barra lateral llega hasta el final de la página', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'Solo con barra lateral fija');
    await loginAs(page, 'Líder');
    const gap = await page.evaluate(() => {
      const r = document.querySelector('.sidebar')!.getBoundingClientRect();
      return document.documentElement.scrollHeight - (r.bottom + window.scrollY);
    });
    expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  });
});
