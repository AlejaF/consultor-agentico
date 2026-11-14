// Lote D3 · T162 (AG-009, AG-023, SC-A9): lo técnico (traza, modelo, fecha, tokens, ficha técnica y avisos) solo lo ven los roles
// internos; el rótulo de IA no lleva el modelo. Por rol y en 320, 768 y 1280 px (los tres proyectos de playwright.real.config.ts).
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, elegirIAReal, entrarConsultor, generarDiagnosticoReal, ruta, subir, vaciarServicio } from './helpers/real';

const MODELO = 'modelo-falso-e2e';
const ROTULO = 'Generado por IA · requiere revisión humana';
const STORAGE_KEY = 'consultor-agentico-demo:state';
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);

async function aceptar(page: Page, ...ids: string[]) {
  for (const id of ids) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
}
const guardado = (page: Page) => page.waitForTimeout(1000); // el guardado en el navegador es diferido

/** Consultor: genera y emite el diagnóstico real de P-A. */
async function emitir(page: Page) {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await aceptar(page, 'R1', 'R2', 'R3', 'R4');
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
  await guardado(page);
}
/** Copia el proyecto real de P-A a P-B (el único que ve la Empresa) y, si se pide, cambia datos de la corrida. */
async function copiarAPB(page: Page, cambios?: { partial?: boolean; errors?: { category: string; message: string }[] }) {
  await page.evaluate(
    ([key, c]) => {
      const s = JSON.parse(localStorage.getItem(key)!);
      s.projects['P-B'] = JSON.parse(JSON.stringify(s.projects['P-A']));
      for (const id of ['P-A', 'P-B']) {
        const run = s.projects[id].real.diagnosisRun;
        if (c?.partial) run.partial = true;
        if (c?.errors) run.errors = c.errors;
      }
      localStorage.setItem(key, JSON.stringify(s));
    },
    [STORAGE_KEY, cambios ?? null] as const,
  );
  await page.reload();
}
/** Texto visible de la página sin la traza ni la ficha técnica: ahí es donde sí puede estar el modelo. */
async function textoFueraDeLoTecnico(page: Page) {
  return page.evaluate(() => {
    const c = document.body.cloneNode(true) as HTMLElement;
    c.querySelectorAll('[data-testid="trace-view"], [data-testid="tech-sheet"]').forEach((e) => e.remove());
    return c.innerText + ' ' + [...c.querySelectorAll('[aria-label],[title]')].map((e) => `${e.getAttribute('aria-label')} ${e.getAttribute('title')}`).join(' ');
  });
}
async function cambiarRol(page: Page, rol: 'consultor' | 'lider' | 'contacto') {
  await page.locator('#rol-activo').selectOption(rol);
}
const sinNadaTecnico = async (page: Page) => {
  const html = await page.locator('body').innerHTML(); // solo el cuerpo: las hojas de estilo del <head> pueden nombrar clases
  for (const t of ['trace-view', 'trace-model', 'trace-tokens', 'trace-errors', 'tech-sheet', 'Ver cómo trabajó el agente', 'Traza del agente', 'Ficha técnica', 'partial-notice', 'review-warning', MODELO]) {
    expect(html, `la Empresa no debe tener «${t}» en el DOM`).not.toContain(t);
  }
  expect(await page.getByText(/tokens|iteraciones/i).count()).toBe(0);
};

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test.describe('Consultor', () => {
  test('la traza está plegada, se despliega con Enter y Espacio y muestra modelo, tokens y errores', async ({ page }) => {
    await generarDiagnosticoReal(page);
    const traza = page.getByTestId('trace-view');
    await expect(traza.getByText('Ver cómo trabajó el agente', { exact: true })).toBeVisible();
    await expect(page.getByText('Traza del agente', { exact: true })).toHaveCount(0);
    expect(await traza.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false);
    const resumen = traza.locator('summary');
    await resumen.focus();
    await page.keyboard.press('Enter');
    expect(await traza.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(true);
    await expect(page.getByTestId('trace-model')).toHaveText(MODELO);
    await expect(page.getByTestId('trace-tokens')).toContainText('total 720');
    await expect(page.getByTestId('trace-errors')).toBeVisible();
    await expect(traza).toContainText('buscar_en_evidencia');
    await expect(traza).toContainText('Fecha');
    await page.keyboard.press('Space');
    expect(await traza.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false);
    await page.keyboard.press('Space');
    expect(await traza.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(true);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('el modelo no aparece en ningún texto visible fuera de la traza y la ficha técnica; el rótulo no lo lleva', async ({ page }) => {
    await emitir(page);
    for (const paso of ['diagnostico', 'revision', 'informe'] as const) {
      await abrir(page, 'P-A', paso);
      await expect(page.getByTestId('ai-badge').first()).toHaveText(ROTULO);
      expect(await textoFueraDeLoTecnico(page), `paso ${paso}`).not.toContain(MODELO);
    }
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.getByTestId('maturity-level-datos').getByTestId('ai-badge')).toHaveText(ROTULO);
    await expect(page.getByTestId('missing-info').getByTestId('ai-badge')).toHaveText(ROTULO);
  });

  test('el informe incluye la ficha técnica con modelo, fecha y tokens', async ({ page }) => {
    await emitir(page);
    await abrir(page, 'P-A', 'informe');
    const ficha = page.getByTestId('tech-sheet');
    await expect(ficha.getByRole('heading', { name: 'Ficha técnica' })).toBeVisible();
    await expect(ficha).toContainText(MODELO);
    await expect(ficha).toContainText('Fecha');
    await expect(ficha).toContainText('entrada 600 · salida 120 · total 720');
    await expectNoHorizontalScroll(page);
  });

  test('un resultado parcial y un error se ven sin desplegar la traza', async ({ page }) => {
    await emitir(page);
    await copiarAPB(page, { partial: true, errors: [{ category: 'timeout', message: 'El proveedor tardó demasiado.' }] });
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.getByTestId('partial-notice')).toBeVisible();
    await expect(page.getByTestId('review-warning')).toContainText('El proveedor tardó demasiado.');
    expect(await page.getByTestId('trace-view').evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false);
    expect(await page.getByTestId('partial-notice').evaluate((e) => !!e.closest('details'))).toBe(false);
    expect(await page.getByTestId('review-warning').evaluate((e) => !!e.closest('details'))).toBe(false);
  });

  test('error del proveedor al generar: el aviso se ve y la traza de ese intento queda plegada', async ({ page, request }) => {
    await vaciarServicio(request, 'P-D');
    await entrarConsultor(page);
    await abrir(page, 'P-D', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta(['notas-reunion.txt']));
    await abrir(page, 'P-D', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('real-error')).toContainText('Se agotó el saldo prepago', { timeout: 30_000 });
    const traza = page.getByTestId('trace-view');
    if (await traza.count()) expect(await traza.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false);
  });
});

test.describe('Líder', () => {
  test('ve la traza plegada y la ficha técnica en el informe; el modelo no está en el resto', async ({ page }) => {
    await emitir(page);
    await cambiarRol(page, 'lider');
    await page.goto('/#/lider/entregas/dx/P-A');
    const traza = page.getByTestId('trace-view');
    await expect(traza.getByText('Ver cómo trabajó el agente', { exact: true })).toBeVisible();
    expect(await traza.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false);
    await traza.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('trace-model')).toHaveText(MODELO);
    expect(await textoFueraDeLoTecnico(page)).not.toContain(MODELO);
    await expect(page.getByTestId('ai-badge').first()).toHaveText(ROTULO);
    await page.goto('/#/lider/entregas/dx/P-A/informe');
    await expect(page.getByTestId('tech-sheet')).toContainText(MODELO);
    expect(await textoFueraDeLoTecnico(page)).not.toContain(MODELO);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('un resultado parcial se ve sin desplegar la traza', async ({ page }) => {
    await emitir(page);
    await copiarAPB(page, { partial: true });
    await cambiarRol(page, 'lider');
    await page.goto('/#/lider/entregas/dx/P-A');
    await expect(page.getByTestId('partial-notice')).toBeVisible();
    expect(await page.getByTestId('trace-view').evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false);
  });
});

test.describe('Empresa', () => {
  test('no tiene en el DOM ninguna traza, ficha, modelo, fecha de corrida, tokens ni aviso técnico (inicio e informe)', async ({ page }) => {
    await emitir(page);
    await copiarAPB(page, { partial: true, errors: [{ category: 'timeout', message: 'El proveedor tardó demasiado.' }] });
    await cambiarRol(page, 'contacto');
    await page.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
    await expect(page.getByTestId('maturity-index')).toBeVisible(); // lo real sí se ve, lo técnico no
    await sinNadaTecnico(page);
    await page.goto('/#/contacto/informe');
    await expect(page.getByTestId('print-report')).toBeVisible();
    await expect(page.getByTestId('ai-badge').first()).toHaveText(ROTULO);
    await sinNadaTecnico(page);
    expect(await page.getByTestId('print-report').innerHTML()).not.toContain('2026-11'); // sin fecha de corrida
    await page.emulateMedia({ media: 'print' }); // al imprimir tampoco
    await sinNadaTecnico(page);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });
});
