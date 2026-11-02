import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { EXE_NO_PERMITIDO, PDF_VALIDO } from './fixtures/archivos';

const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const IDS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'];

async function loginConsultor(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeVisible();
}
async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
async function generateDiagnosis(page: Page, projectId: string) {
  await goto(page, `#/consultor/proyectos/${projectId}/diagnostico`);
  await expect(page.getByRole('heading', { level: 1, name: 'Diagnóstico' })).toBeVisible();
  await page.getByRole('button', { name: 'Generar diagnóstico' }).dblclick(); // el doble clic no ejecuta dos veces
  await expect(page.getByText('Generando diagnóstico…')).toBeVisible();
  await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
}
async function accept(page: Page, id: string) {
  await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
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

test.describe('recorrido P1', () => {
  test('ingreso → evidencia → generar → cita → revisar → emitir → recarga inmediata', async ({ page }) => {
    const requests: { url: string; method: string; body: string | null }[] = [];
    page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() }));

    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    await page.locator('input[type=file]').setInputFiles([PDF_VALIDO, EXE_NO_PERMITIDO]);
    await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();
    await expect(page.getByTestId('upload-result')).toContainText('programa.exe');

    await page.getByRole('link', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Diagnóstico' })).toBeFocused();
    await page.getByRole('button', { name: 'Generar diagnóstico' }).dblclick();
    await expect(page.getByText('Generando diagnóstico…')).toBeVisible();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
    await expect(page.getByText('Simulada').first()).toBeVisible();
    await expect(page.getByText('Índice de madurez: 2,4 de 5')).toBeVisible();
    await expect(page.getByTestId('cited-count')).toHaveText('8 de 8 hallazgos con evidencia citada');
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8);

    // cada hallazgo tiene una cita abrible; abrir una muestra el extracto rotulado
    for (const id of IDS) await expect(card(page, id).getByRole('button', { expanded: false }).first()).toBeVisible();
    await card(page, 'H1').getByRole('button', { name: /pág\. 18/ }).click();
    await expect(card(page, 'H1').getByText('Evidencia de ejemplo (ficticia)')).toBeVisible();
    await expect(card(page, 'H1').getByText(/No existe un responsable único/)).toBeVisible();
    await expect(card(page, 'H5').getByText('NO VERIFICADO')).toBeVisible();

    // revisión: emitir con pendientes está impedido
    await page.getByRole('link', { name: 'Ir a la revisión' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Revisión y emisión' })).toBeFocused();
    await expect(page.getByTestId('review-progress')).toHaveText('0 de 8 hallazgos revisados');
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click({ force: true }); // aria-disabled: se puede pulsar, pero no hace nada
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText('Faltan 8 hallazgos por revisar.')).toBeVisible();

    // aceptar, editar (la edición vacía se impide) y rechazar
    await accept(page, 'H1');
    await expect(card(page, 'H1').getByText('Aceptado')).toBeVisible();
    await expect(page.getByTestId('decision-announcer')).toContainText('aceptado');
    await card(page, 'H2').getByRole('button', { name: /^Editar/ }).click();
    const area = card(page, 'H2').getByRole('textbox', { name: /Editar hallazgo/ });
    await area.fill('   ');
    await card(page, 'H2').getByRole('button', { name: 'Guardar edición' }).click();
    await expect(card(page, 'H2').getByRole('alert')).toContainText('El texto no puede estar vacío');
    await area.fill('Texto corregido por el consultor.');
    await card(page, 'H2').getByRole('button', { name: 'Guardar edición' }).click();
    await expect(card(page, 'H2').getByText('Editado por consultor')).toBeVisible();
    await expect(card(page, 'H2').getByText('Texto corregido por el consultor.')).toBeVisible();
    await card(page, 'H3').getByRole('button', { name: /^Rechazar/ }).click();
    await expect(card(page, 'H3').getByText('Rechazado')).toBeVisible();
    for (const id of ['H4', 'H5', 'H6', 'H7']) await accept(page, id);
    await expect(page.getByTestId('review-progress')).toHaveText('7 de 8 hallazgos revisados');
    await expect(page.getByText('Falta 1 hallazgo por revisar.')).toBeVisible();
    await accept(page, 'H8');
    await expect(page.getByTestId('review-progress')).toHaveText('8 de 8 hallazgos revisados');
    await expect(card(page, 'H5').getByText('NO VERIFICADO')).toBeVisible(); // aceptado y conserva la marca

    // emitir y recargar de inmediato (sin esperar los 200 ms)
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await expect(page.getByRole('heading', { name: 'Emitido' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Emitido' })).toBeVisible();
    await expect(page.getByText('7 incluidos (6 aceptados, 1 editado) y 1 excluido (rechazados).')).toBeVisible();
    await expect(card(page, 'H2').getByText('Texto corregido por el consultor.')).toBeVisible();
    await expect(card(page, 'H3').getByText('Rechazado · excluido del diagnóstico')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Aceptar/ })).toHaveCount(0); // solo lectura
    await expect(page.getByRole('button', { name: /^Editar/ })).toHaveCount(0);

    // el archivo sigue, con la nota de contenido no conservado
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();
    await expect(page.getByText('Contenido no conservado en esta demo.')).toBeVisible();
    await expect(page.getByText('El diagnóstico ya está emitido: la nueva evidencia no se refleja en el diagnóstico emitido.')).toBeVisible();

    // la emisión creó la entrega visible para el Líder
    await page.getByLabel('Rol activo').selectOption('lider');
    await goto(page, '#/lider/entregas');
    await expect(page.getByText('Diagnóstico · Empresa Ficticia Alfa')).toBeVisible();

    // red: solo GET al mismo origen y sin cuerpo
    const origin = new URL(page.url()).origin;
    expect(requests.filter((r) => new URL(r.url).origin !== origin && !r.url.startsWith('data:'))).toEqual([]);
    expect(requests.filter((r) => r.method !== 'GET' || r.body !== null)).toEqual([]);
  });

  test('solo rechazados no se puede emitir; un emitido no se vuelve a generar', async ({ page }) => {
    await loginConsultor(page);
    await generateDiagnosis(page, 'P-A');
    await goto(page, '#/consultor/proyectos/P-A/revision');
    for (const id of IDS) await card(page, id).getByRole('button', { name: /^Rechazar/ }).click();
    await expect(page.getByTestId('review-progress')).toHaveText('8 de 8 hallazgos revisados');
    await expect(page.getByText('Debe haber al menos un hallazgo aceptado o editado.')).toBeVisible();
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeHidden();
    // las decisiones son reversibles mientras no esté emitido
    await accept(page, 'H1');
    await expect(page.getByText('Debe haber al menos un hallazgo aceptado o editado.')).toHaveCount(0);
  });

  test('P-D sin evidencia: bloqueo; al cargar un archivo y generar, toda cita es «Evidencia de ejemplo (ficticia)»', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-D/diagnostico');
    await expect(page.getByRole('button', { name: 'Generar diagnóstico' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText('Carga al menos un archivo para poder generar el diagnóstico.')).toBeVisible();
    await page.getByRole('link', { name: 'Ir a la captura de evidencia' }).click();
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await generateDiagnosis(page, 'P-D');
    const citations = page.locator('button.citation');
    const total = await citations.count();
    expect(total).toBe(12);
    for (let i = 0; i < total; i++) await citations.nth(i).click();
    await expect(page.getByLabel(/^Extracto:/)).toHaveCount(12);
    await expect(page.getByText('Evidencia de ejemplo (ficticia)')).toHaveCount(12);
  });

  test('cambio de rol a mitad de revisión conserva el progreso; con una edición sin guardar pide confirmación', async ({ page }) => {
    await loginConsultor(page);
    await generateDiagnosis(page, 'P-A');
    await goto(page, '#/consultor/proyectos/P-A/revision');
    await accept(page, 'H1');
    await card(page, 'H2').getByRole('button', { name: /^Editar/ }).click();
    const area = card(page, 'H2').getByRole('textbox', { name: /Editar hallazgo/ });
    await area.fill('Cambio sin guardar');

    await page.getByLabel('Rol activo').selectOption('lider');
    const dialog = page.getByRole('dialog', { name: 'Hay una edición sin guardar' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Seguir editando' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#\/consultor\/proyectos\/P-A\/revision$/);
    await expect(area).toHaveValue('Cambio sin guardar'); // cancelar mantiene la edición

    await page.getByLabel('Rol activo').selectOption('lider');
    await dialog.getByRole('button', { name: 'Cambiar de rol' }).click();
    await expect(page).toHaveURL(/#\/lider$/);
    await page.getByLabel('Rol activo').selectOption('consultor');
    await goto(page, '#/consultor/proyectos/P-A/revision');
    await expect(page.getByTestId('review-progress')).toHaveText('1 de 8 hallazgos revisados'); // el progreso guardado sigue
    await expect(card(page, 'H1').getByText('Aceptado')).toBeVisible();
  });

  test('revisión completa solo con teclado (aceptar, editar, rechazar)', async ({ page }) => {
    await loginConsultor(page);
    await generateDiagnosis(page, 'P-A');
    await goto(page, '#/consultor/proyectos/P-A/revision');
    const h1 = card(page, 'H1');
    await h1.getByRole('button', { name: /^Aceptar/ }).focus();
    await page.keyboard.press('Enter');
    await expect(h1.getByText('Aceptado')).toBeVisible();
    await page.keyboard.press('Tab'); // Editar
    await page.keyboard.press('Enter');
    await expect(h1.getByRole('textbox')).toBeFocused();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Texto editado con teclado.');
    await page.keyboard.press('Tab'); // Guardar edición
    await page.keyboard.press('Enter');
    await expect(h1.getByText('Editado por consultor')).toBeVisible();
    const h2 = card(page, 'H2');
    await h2.getByRole('button', { name: /^Rechazar/ }).focus();
    await page.keyboard.press('Space');
    await expect(h2.getByText('Rechazado')).toBeVisible();
    // abrir una cita con teclado
    const cita = h2.locator('button.citation').first();
    await cita.focus();
    await page.keyboard.press('Enter');
    await expect(cita).toHaveAttribute('aria-expanded', 'true');
  });

  test('texto de edición muy largo no rompe el diseño', async ({ page }) => {
    await loginConsultor(page);
    await generateDiagnosis(page, 'P-A');
    await goto(page, '#/consultor/proyectos/P-A/revision');
    await card(page, 'H1').getByRole('button', { name: /^Editar/ }).click();
    await card(page, 'H1').getByRole('textbox').fill('palabra'.repeat(500) + ' ' + 'x'.repeat(400));
    await card(page, 'H1').getByRole('button', { name: 'Guardar edición' }).click();
    await expect(card(page, 'H1').getByText('Editado por consultor')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('un diagnóstico emitido (P-B) es de solo lectura y avisa si se agrega evidencia', async ({ page }) => {
    await loginConsultor(page);
    await goto(page, '#/consultor/proyectos/P-B/evidencia');
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await expect(page.getByText('La nueva evidencia no se refleja', { exact: false })).toBeVisible();
    await goto(page, '#/consultor/proyectos/P-B/revision');
    await expect(page.getByRole('heading', { name: 'Emitido' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Aceptar|Editar|Rechazar)/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Aprobar y emitir' })).toHaveCount(0);
    // P-B sembrado: aceptado NO VERIFICADO, uno editado y uno rechazado
    await expect(card(page, 'H5').getByText('Aceptado')).toBeVisible();
    await expect(card(page, 'H5').getByText('NO VERIFICADO')).toBeVisible();
    await expect(card(page, 'H2').getByText('Editado por consultor')).toBeVisible();
    await expect(card(page, 'H4').getByText('Rechazado · excluido del diagnóstico')).toBeVisible();
    // el diagnóstico emitido vuelve a abrirse igual, sin botón de generar
    await goto(page, '#/consultor/proyectos/P-B/diagnostico');
    await expect(page.getByText('Emitido', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generar diagnóstico' })).toHaveCount(0);
  });

  test('axe, sin desplazamiento horizontal y controles ≥ 44 px en las pantallas P1', async ({ page }) => {
    test.setTimeout(90_000); // recorre ~12 pantallas con axe; con la suite en paralelo superó los 30 s por defecto
    await page.goto('/');
    await expectNoAxeViolations(page); // 1. ingreso
    await expectNoHorizontalScroll(page);
    await expectTargets44(page);
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await expectNoAxeViolations(page); // 2. proyectos
    await expectNoHorizontalScroll(page);
    await expectTargets44(page);
    await goto(page, '#/consultor/proyectos/P-A/evidencia');
    await expect(page.getByRole('heading', { level: 1, name: 'Captura de evidencia' })).toBeVisible();
    await expectNoAxeViolations(page); // 3. captura
    await expectNoHorizontalScroll(page);
    await generateDiagnosis(page, 'P-A');
    await card(page, 'H3').locator('button.citation').first().click();
    await expectNoAxeViolations(page); // 4. diagnóstico generado con una cita abierta
    await expectNoHorizontalScroll(page);
    await expectTargets44(page);
    await goto(page, '#/consultor/proyectos/P-A/revision');
    await accept(page, 'H1');
    await card(page, 'H2').getByRole('button', { name: /^Rechazar/ }).click();
    await card(page, 'H3').getByRole('button', { name: /^Editar/ }).click();
    await card(page, 'H4').locator('button.citation').first().click();
    await expectNoAxeViolations(page); // 5. revisión con edición abierta y panel de evidencia
    await expectNoHorizontalScroll(page);
    await expectTargets44(page);
    await goto(page, '#/consultor/proyectos/P-B/revision');
    await expect(page.getByRole('heading', { name: 'Emitido' })).toBeVisible();
    await expectNoAxeViolations(page); // 6. revisión emitida
    await expectNoHorizontalScroll(page);
    await expectTargets44(page);
    await goto(page, '#/consultor/proyectos/P-B/diagnostico');
    await expect(page.getByText('Emitido', { exact: true }).first()).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });
});
