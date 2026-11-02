import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const NOTA = 'No se usará como respaldo de la estrategia';
const IDS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'];
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' });

async function loginConsultor(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
}
async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
async function reviewAllInP_A(page: Page) {
  await goto(page, '#/consultor/proyectos/P-A/diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
  await goto(page, '#/consultor/proyectos/P-A/revision');
  for (const id of IDS) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
}

test.describe('Ajuste F: pilares y NO VERIFICADO', () => {
  test('cada grupo se rotula «Pilar: <nombre>» en Diagnóstico y en Revisión', async ({ page }) => {
    await loginConsultor(page);
    for (const ruta of ['diagnostico', 'revision']) {
      await goto(page, `#/consultor/proyectos/P-B/${ruta}`);
      for (const n of ['Estrategia', 'Infraestructura', 'Datos', 'Gobernanza', 'Talento', 'Cultura']) {
        await expect(page.getByRole('heading', { level: 2, name: `Pilar: ${n}` })).toBeVisible();
      }
    }
  });

  test('un NO VERIFICADO aceptado muestra la nota; un verificado o un rechazado no', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-B/diagnostico');
    await expect(card(page, 'H5').getByText(NOTA)).toBeVisible();
    await expect(card(page, 'H1').getByText(NOTA)).toHaveCount(0);
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
    await goto(page, '#/consultor/proyectos/P-A/revision');
    await expect(card(page, 'H5').getByText(NOTA)).toHaveCount(0);
    await card(page, 'H5').getByRole('button', { name: /^Aceptar/ }).click();
    await expect(card(page, 'H5').getByText(NOTA)).toBeVisible();
    await card(page, 'H5').getByRole('button', { name: /^Rechazar/ }).click();
    await expect(card(page, 'H5').getByText(NOTA)).toHaveCount(0);
  });
});

test.describe('Ajuste I: claridad tras emitir', () => {
  test('ventana, banner, botón «Continuar con la Estrategia →» y estado «Disponible»', async ({ page }) => {
    await loginConsultor(page);
    await reviewAllInP_A(page);
    await expect(nav(page).getByRole('link', { name: /^Estrategia/ })).toContainText('Bloqueado');
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('El Líder podrá revisarlo y calificarlo después; no necesitas su aprobación para continuar con la estrategia.');
    await expect(dialog).not.toContainText('Se creará la entrega para el Líder');
    await expectNoAxeViolations(page);
    await dialog.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();

    const banner = page.locator('#emitido').locator('..');
    await expect(banner).toContainText('El Líder podrá calificarlo cuando quiera. No bloquea tu trabajo: puedes continuar con la estrategia.');
    await expect(page.getByText('Se creó la entrega visible para el Líder.')).toHaveCount(0);
    await expect(nav(page).getByRole('link', { name: /^Estrategia/ })).toContainText('Disponible');
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);

    await page.getByRole('link', { name: 'Continuar con la Estrategia →' }).click();
    await expect(page).toHaveURL(/P-A\/estrategia$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Estrategia' })).toBeFocused();
  });

  test('ningún texto sugiere que el Líder deba aprobar o desbloquear algo', async ({ page }) => {
    await loginConsultor(page);
    const prohibido = /(aprobaci[oó]n|visto bueno) del L[ií]der|L[ií]der (debe|tiene que) aprobar|esperando (a|la aprobaci[oó]n)|pendiente de aprobaci[oó]n/i;
    for (const ruta of ['evidencia', 'diagnostico', 'revision', 'estrategia']) {
      await goto(page, `#/consultor/proyectos/P-B/${ruta}`);
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.locator('main').innerText()).not.toMatch(prohibido);
    }
  });
});

test.describe('Ajuste H: redacción', () => {
  test('el hallazgo y su extracto dicen «consolidan»', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-B/diagnostico');
    await card(page, 'H4').getByRole('button', { name: /pág\. 12/ }).click();
    await expect(card(page, 'H4').getByText(/se consolidan una vez por semana/).first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/reconcil|concilian/);
  });
});
