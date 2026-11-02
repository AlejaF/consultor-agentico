import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' });

async function loginConsultor(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeVisible();
}
async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
async function switchRole(page: Page, label: 'Consultor' | 'Líder') {
  await page.getByLabel('Rol activo').selectOption(label === 'Líder' ? 'lider' : 'consultor');
}
async function expectTargets44(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, select, textarea, input:not([hidden]), a[href]')]
      .filter((el) => el.offsetParent !== null && !el.classList.contains('skip-link'))
      .map((el) => ({ t: (el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 30), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height < 44 || r.width < 44)
      .map(({ t, r }) => `${t} ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small, 'controles menores de 44 px').toEqual([]);
}
async function generateStrategy(page: Page, projectId: string) {
  await goto(page, `#/consultor/proyectos/${projectId}/estrategia`);
  await page.getByRole('button', { name: 'Generar estrategia' }).dblclick(); // el doble clic no ejecuta dos veces
  await expect(page.getByText('Generando estrategia…')).toBeVisible();
  await expect(page.getByText('Generada', { exact: true })).toBeVisible();
}

test.describe('Estrategia (Consultor)', () => {
  test('bloqueada sin diagnóstico emitido: explicación, enlace y sin botón', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-A/estrategia');
    await expect(page.getByRole('heading', { name: 'Estrategia bloqueada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir al diagnóstico' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir a la revisión' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Generar estrategia' })).toHaveCount(0);
  });

  test('con el diagnóstico emitido: botón, simulación «Simulada» sin duplicar y contenido con «Deriva de»', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-B/estrategia');
    await expect(page.getByRole('button', { name: 'Generar estrategia' })).toBeVisible();
    await expect(page.getByTestId('strategy-content')).toHaveCount(0);
    await page.getByRole('button', { name: 'Generar estrategia' }).dblclick();
    await expect(page.getByText('Generando estrategia…')).toBeVisible();
    await expect(page.getByText('Simulada').first()).toBeVisible();
    await expect(page.getByTestId('strategy-content')).toBeVisible();
    await expect(page.getByTestId('strategy-content')).toHaveCount(1);
    await expect(page.getByText('Deriva de:').first()).toBeVisible();
    await expect(nav(page).getByRole('link', { name: /^Estrategia/ })).toContainText('En curso');
    // sector y mercado, rotulados
    await expect(page.getByRole('heading', { name: 'Análisis de sector' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Análisis de mercado' })).toBeVisible();
    await expect(page.getByText('NO VERIFICADO · contenido ilustrativo')).toHaveCount(2);
  });

  test('un hallazgo aceptado pero NO VERIFICADO no figura en «Deriva de»; un rechazado tampoco', async ({ page }) => {
    await loginConsultor(page);
    await generateStrategy(page, 'P-B'); // P-B: H5 aceptado NO VERIFICADO, H2 editado, H4 rechazado
    const derived = await page.getByTestId('strategy-content').locator('[data-testid^="derived-"]').allInnerTexts();
    const text = derived.join('\n');
    expect(text).toContain('H2'); // el editado sí respalda
    expect(text).not.toMatch(/\bH5\b/);
    expect(text).not.toMatch(/\bH4\b/);
    // R2 solo se apoyaba en H4 (rechazado) y H5 (NO VERIFICADO): no se muestra
    await expect(page.getByTestId('risk-R2')).toHaveCount(0);
    await expect(page.getByTestId('risk-R1')).toBeVisible();
    await expect(page.getByTestId('unverified-unused')).toHaveText('1 hallazgo aceptado no se usó como respaldo porque está NO VERIFICADO');
    // cada «Deriva de» rotula el pilar para no confundirlo con la etapa
    await expect(page.getByTestId('derived-R1')).toContainText('Pilar: Estrategia');
  });

  test('sin hallazgos NO VERIFICADO aceptados no aparece la línea de aviso', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
    await goto(page, '#/consultor/proyectos/P-A/revision');
    for (const id of ['H1', 'H2', 'H3', 'H4', 'H6', 'H7', 'H8']) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
    await card(page, 'H5').getByRole('button', { name: /^Rechazar/ }).click();
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await page.getByRole('link', { name: 'Continuar con la Estrategia →' }).click();
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    await expect(page.getByTestId('strategy-content')).toBeVisible();
    await expect(page.getByTestId('unverified-unused')).toHaveCount(0);
  });

  test('si ningún elemento tiene respaldo se muestra un aviso en lugar de contenido', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
    await goto(page, '#/consultor/proyectos/P-A/revision');
    for (const id of ['H1', 'H2', 'H3', 'H4', 'H6', 'H7', 'H8']) await card(page, id).getByRole('button', { name: /^Rechazar/ }).click();
    await card(page, 'H5').getByRole('button', { name: /^Aceptar/ }).click();
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await goto(page, '#/consultor/proyectos/P-A/estrategia');
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    await expect(page.getByTestId('strategy-empty')).toContainText('Ningún elemento de la estrategia tiene respaldo');
    await expect(page.getByTestId('risk-R1')).toHaveCount(0);
  });

  test('axe, sin desplazamiento horizontal y controles ≥ 44 px (estrategia generada)', async ({ page }) => {
    await loginConsultor(page);
    await generateStrategy(page, 'P-B');
    await expectNoHorizontalScroll(page);
    await expectTargets44(page);
    await expectNoAxeViolations(page);
  });
});

test.describe('Líder: tablero, revisión y calificación', () => {
  test('recorrido: enviar → calificar con teclado → promedio → el Consultor lo ve y el diagnóstico sigue emitido', async ({ page }) => {
    await loginConsultor(page);
    await generateStrategy(page, 'P-B');
    await page.getByRole('button', { name: 'Enviar a revisión' }).dblclick(); // no duplica
    await expect(page.getByText('Enviada al Líder')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar a revisión' })).toHaveCount(0);

    await switchRole(page, 'Líder');
    await expect(page).toHaveURL(/#\/lider$/);
    await goto(page, '#/lider/entregas');
    await expect(page.getByRole('link', { name: /Abrir entrega.*Empresa Ficticia Beta/ })).toHaveCount(2); // dx y st de P-B
    await goto(page, '#/lider/entregas/st/P-B');
    await expect(page.getByRole('heading', { level: 1, name: 'Revisión de la entrega' })).toBeVisible();
    await expect(page.getByText('Criterios de ejemplo (pendientes de definir por el profesor)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Devolver' })).toHaveCount(0);
    await expect(page.getByTestId('strategy-content')).toBeVisible();

    // guardar incompleta: impedido y explicado
    await page.getByRole('button', { name: 'Guardar calificación' }).click({ force: true });
    await expect(page.getByText(/Elige un nivel de 1 a 5 en los 4 criterios/)).toBeVisible();
    await expect(page.getByText(/Calificada/)).toHaveCount(0);

    // criterio 1 con teclado (flechas), el resto con el puntero
    const first = page.getByRole('radiogroup', { name: 'Trazabilidad de la evidencia' });
    await first.getByRole('radio', { name: '1' }).focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await expect(first.getByRole('radio', { name: '5' })).toBeChecked();
    for (const name of ['Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación']) {
      await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '4' }).check({ force: true });
    }
    await expect(page.getByRole('button', { name: 'Guardar calificación' })).toHaveAttribute('aria-disabled', 'false');
    await page.getByLabel(/Comentarios/).fill('Ruta clara y bien apoyada en el diagnóstico.');
    await page.getByRole('button', { name: 'Guardar calificación' }).click();

    await expect(page.getByText('Calificada', { exact: true })).toBeVisible();
    await expect(page.getByTestId('grade-average')).toHaveText('Promedio: 4,3 de 5');
    await expect(page.getByText('Meta del programa (ilustrativa): 4,2 de 5')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar calificación' })).toHaveCount(0);
    await expect(nav(page).getByRole('link', { name: /^Entregas por revisar \(3\)$/ })).toBeVisible(); // dx/P-B, dx/E-2 y dx/E-3

    await switchRole(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-B/estrategia');
    await expect(page.getByTestId('grade-average')).toHaveText('Promedio: 4,3 de 5');
    await expect(page.getByText('Ruta clara y bien apoyada en el diagnóstico.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar calificación' })).toHaveCount(0);
    await goto(page, '#/consultor/proyectos/P-B/revision');
    await expect(page.locator('#emitido')).toBeVisible(); // el diagnóstico sigue «Emitido»
  });

  test('entregas precargadas: se califican sin recorrer el flujo del Consultor; las calificadas son de solo lectura', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    await goto(page, '#/lider/entregas/dx/E-2');
    await expect(page.getByRole('heading', { level: 1, name: 'Revisión de la entrega' })).toBeVisible();
    await expect(page.getByTestId('finding-H1')).toBeVisible();
    await page.getByRole('button', { name: 'Guardar calificación' }).click({ force: true });
    await expect(page.getByText(/Elige un nivel/)).toBeVisible();
    await goto(page, '#/lider/entregas/dx/P-C');
    await expect(page.getByText('Calificada', { exact: true })).toBeVisible();
    await expect(page.getByTestId('grade-average')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar calificación' })).toHaveCount(0);
  });

  test('una cita de la entrega se puede abrir', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    await goto(page, '#/lider/entregas/dx/E-2');
    await card(page, 'H1').getByRole('button', { name: /pág\. 18/ }).click();
    await expect(card(page, 'H1').getByText('Evidencia de ejemplo (ficticia)')).toBeVisible();
  });

  test('rutas inexistentes redirigen con aviso', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    for (const h of ['#/lider/entregas/xx/P-B', '#/lider/entregas/st/P-A', '#/lider/entregas/dx/P-A']) {
      await goto(page, h);
      await expect(page).toHaveURL(/#\/lider$/);
      await expect(page.getByTestId('notices')).toContainText('No encontramos esa pantalla.');
      await goto(page, '#/lider/entregas');
    }
  });

  test('tablero: indicadores, tabla de equipos y cola de revisión', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    await expect(page.getByTestId('kpi-equipos')).toContainText('4');
    await expect(page.getByTestId('kpi-por-revisar')).toContainText('3'); // dx/P-B, dx/E-2 y dx/E-3
    await expect(page.getByTestId('kpi-promedio')).toContainText('de 5');
    const rows = page.getByTestId('teams-table').getByRole('row');
    await expect(rows).toHaveCount(5); // encabezado + 4 equipos
    await expect(page.getByTestId('teams-table')).toContainText('Equipo 3');
    await expect(page.getByTestId('review-queue').getByRole('link', { name: /^Revisar/ }).first()).toBeVisible();
    await expect(page.getByText('Devuelto')).toHaveCount(0);
  });

  test('tablero, revisión y entrega: axe, sin desplazamiento horizontal y controles ≥ 44 px', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    for (const h of ['#/lider', '#/lider/entregas', '#/lider/entregas/dx/E-2', '#/lider/entregas/st/P-C']) {
      await goto(page, h);
      await expect(page.locator('main h1')).toBeVisible();
      await expectNoHorizontalScroll(page);
      await expectTargets44(page);
      await expectNoAxeViolations(page);
    }
  });

  test('un comentario muy largo no rompe el diseño', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    await goto(page, '#/lider/entregas/dx/E-3');
    const largo = 'x'.repeat(1500) + ' ' + 'palabra-'.repeat(200);
    await page.getByLabel(/Comentarios/).fill(largo);
    for (const name of ['Trazabilidad de la evidencia', 'Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación']) {
      await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '3' }).check({ force: true });
    }
    await page.getByRole('button', { name: 'Guardar calificación' }).click();
    await expect(page.getByTestId('grade-average')).toHaveText('Promedio: 3,0 de 5');
    await expectNoHorizontalScroll(page);
  });
});
