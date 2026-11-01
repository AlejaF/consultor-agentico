import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

const HOME: Record<string, { hash: string; h1: string }> = {
  Consultor: { hash: '#/consultor', h1: 'Proyectos' },
  Líder: { hash: '#/lider', h1: 'Tablero' },
  Contacto: { hash: '#/contacto', h1: 'Resumen del proyecto' },
};

async function openMenuIfCollapsed(page: Page) {
  const toggle = page.getByRole('button', { name: 'Menú' });
  if (await toggle.isVisible()) await toggle.click();
}

test.describe('ingreso', () => {
  test('sin violaciones de axe, sin desplazamiento horizontal y con aviso de demo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
    await expect(page.getByTestId('demo-banner')).toHaveText('DEMO · datos ficticios');
    await expect(page.getByText('solo de experiencia')).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('el primer elemento enfocable es «Saltar al contenido»', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  });

  test('sin rol, cualquier ruta vuelve al ingreso', async ({ page }) => {
    await page.goto('/#/lider');
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
  });
});

for (const [role, home] of Object.entries(HOME)) {
  test.describe(`inicio de ${role}`, () => {
    test('se llega en 1 interacción, sin violaciones y sin desplazamiento horizontal', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: `Entrar como ${role}` }).click(); // 1 interacción (≤ 3)
      await expect(page).toHaveURL(new RegExp(`${home.hash}$`));
      await expect(page.getByRole('heading', { level: 1, name: home.h1 })).toBeVisible();
      await expect(page.getByTestId('demo-banner')).toBeVisible();
      await expectNoAxeViolations(page);
      await expectNoHorizontalScroll(page);
    });
  });
}

test('cambiar de rol toma 1 interacción y conserva el estado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await page.getByLabel('Rol activo').selectOption('lider'); // ≤ 2
  await expect(page).toHaveURL(/#\/lider$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
  // sin aviso espurio al cambiar de rol
  await expect(page.getByTestId('notices').locator('.notice')).toHaveCount(0);
});

test('abrir a mano #/lider como Consultor muestra el aviso y vuelve al inicio', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await page.evaluate(() => (window.location.hash = '#/lider'));
  await expect(page).toHaveURL(/#\/consultor$/);
  await expect(page.getByTestId('notices')).toContainText('Esa vista pertenece al rol Líder. Estás como Consultor.');
});

test('ruta desconocida muestra «No encontramos esa pantalla.»', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Líder' }).click();
  await page.evaluate(() => (window.location.hash = '#/lider/entregas/xx/P-B'));
  await expect(page).toHaveURL(/#\/lider$/);
  await expect(page.getByTestId('notices')).toContainText('No encontramos esa pantalla.');
});

test('al cambiar de ruta: foco en el h1, título actualizado y aviso anunciado (T013)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Líder' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeFocused();
  await expect(page).toHaveTitle(/Tablero/);
  await expect(page.getByTestId('route-announcer')).toHaveText('Pantalla: Tablero');
});

test('el progreso (rol) sobrevive a una recarga inmediata', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await page.reload();
  await expect(page).toHaveURL(/#\/consultor$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeVisible();
});

test('«Restablecer demo» pide confirmación y vuelve al ingreso', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await openMenuIfCollapsed(page);
  await page.getByRole('button', { name: 'Restablecer demo' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#\/consultor$/);

  await page.getByRole('button', { name: 'Restablecer demo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, restablecer' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
  await expect(page.getByTestId('notices')).toContainText('Se restableció la demo.');
});

test('con el almacenamiento bloqueado se avisa y la demo sigue funcionando (FR-007)', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('bloqueado');
      },
    });
  });
  await page.goto('/');
  await expect(page.getByTestId('notices')).toContainText('No se puede guardar el progreso en este navegador');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeVisible();
});

test('los controles interactivos miden al menos 44 px', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await openMenuIfCollapsed(page);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, select, input, a[href]')]
      .filter((el) => !el.classList.contains('skip-link') && el.offsetParent !== null)
      .map((el) => ({ el: el.textContent?.trim() ?? el.tagName, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height < 44 || r.width < 44)
      .map(({ el, r }) => `${el} ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small).toEqual([]);
});
