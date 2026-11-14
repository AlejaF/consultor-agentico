// Lote E · T100 y T100C (AG-019, AG-020, AG-023, AG-009, AG-029; SC-A4, SC-012): Estrategia con el agente real, con el servicio en modo FALSO.
// El guion de «Empresa Ficticia Alfa» propone: riesgo de R1 (válido), riesgo de R4 (NO VERIFICADO: no se envía), fase de R2 y R3 (válida)
// y fase de R9 (no existe). Solo deben quedar el riesgo ER1 y la fase EF1.
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, entrarConsultor, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

const MODELO = 'modelo-falso-e2e';
const ROTULO = 'Generado por IA · requiere revisión humana';
const STORAGE_KEY = 'consultor-agentico-demo:state';
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
async function aceptar(page: Page, ...ids: string[]) {
  for (const id of ids) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
}
const guardado = (page: Page) => page.waitForTimeout(1000);
async function emitir(page: Page, ids: string[]) {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await aceptar(page, ...ids);
  // Emitir exige revisar todos: lo que no se acepta se rechaza.
  for (const id of ['R1', 'R2', 'R3', 'R4'].filter((x) => !ids.includes(x))) await card(page, id).getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
  await guardado(page);
}
const abierta = (page: Page) => page.getByTestId('trace-view').evaluate((e) => (e as HTMLDetailsElement).open);
async function generar(page: Page) {
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await expect(page.getByTestId('strategy-content')).toBeVisible({ timeout: 30_000 });
}

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test.describe('Estrategia con IA real', () => {
  test('con el diagnóstico emitido genera solo elementos respaldados; cada uno dice «Deriva de» y el NO VERIFICADO no respalda nada', async ({ page }) => {
    const enviados: unknown[] = [];
    page.on('request', (r) => { if (r.url().includes('/api/strategy/run')) enviados.push(r.postDataJSON()); });
    await emitir(page, ['R1', 'R2', 'R3', 'R4']);
    await generar(page);
    expect(enviados).toHaveLength(1);
    const ids = (enviados[0] as { findings: { id: string; state: string }[] }).findings.map((f) => f.id);
    expect(ids).toEqual(['R1', 'R2', 'R3']); // R4 (NO VERIFICADO aceptado) no se envía
    await expect(page.getByTestId('risk-ER1')).toBeVisible();
    await expect(page.getByTestId('derived-ER1')).toContainText('R1');
    await expect(page.getByTestId('phase-EF1')).toBeVisible();
    await expect(page.getByTestId('derived-EF1')).toContainText('R2');
    await expect(page.getByTestId('derived-EF1')).toContainText('R3');
    await expect(page.locator('[data-testid^="risk-"]')).toHaveCount(1); // el de R4 se descartó
    await expect(page.locator('[data-testid^="phase-"]')).toHaveCount(1); // el de R9 se descartó
    await expect(page.getByTestId('derived-ER1')).not.toContainText('R4');
    await expect(page.getByTestId('unverified-unused')).toContainText('1 hallazgo aceptado no se usó como respaldo porque está NO VERIFICADO');
    await expect(page.getByText('No se usará como respaldo de la estrategia')).toHaveCount(0); // ese aviso es de la tarjeta, en la revisión
    // sin sector ni mercado en modo real
    await expect(page.getByTestId('estr-sector')).toHaveCount(0);
    await expect(page.getByTestId('estr-mercado')).toHaveCount(0);
    await expect(page.getByText('Análisis de sector')).toHaveCount(0);
    await expect(page.getByText('contenido ilustrativo')).toHaveCount(0);
    // rótulo de IA sin modelo
    await expect(page.getByTestId('ai-badge').first()).toHaveText(ROTULO);
    await expect(page.getByText('Simulada', { exact: true })).toHaveCount(0);
    // el modelo solo aparece dentro de la traza
    const fuera = await page.evaluate(() => { const c = document.body.cloneNode(true) as HTMLElement; c.querySelectorAll('[data-testid="trace-view"]').forEach((e) => e.remove()); return c.innerText; });
    expect(fuera).not.toContain(MODELO);
  });

  test('traza «Ver cómo trabajó el agente» plegada, con el modelo dentro; los avisos de parcial/error se ven sin abrirla', async ({ page }) => {
    await emitir(page, ['R1', 'R2', 'R3']);
    await generar(page);
    const traza = page.getByTestId('trace-view');
    await expect(traza.getByText('Ver cómo trabajó el agente', { exact: true })).toBeVisible();
    expect(await abierta(page)).toBe(false);
    await traza.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('trace-model')).toHaveText(MODELO);
    await expect(traza).toContainText('registrar_elemento');
    // un resultado parcial se avisa fuera de la traza
    await guardado(page);
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)!); s.projects['P-A'].real.strategyRun.partial = true; localStorage.setItem(k, JSON.stringify(s)); }, STORAGE_KEY);
    await page.reload();
    await expect(page.getByTestId('partial-notice')).toBeVisible();
    expect(await abierta(page)).toBe(false);
  });

  test('«Enviar a revisión» crea la entrega una sola vez; el Líder ve la estrategia con «Deriva de», la traza plegada y la ficha técnica en el informe', async ({ page }) => {
    await emitir(page, ['R1', 'R2', 'R3']);
    await generar(page);
    await page.getByRole('button', { name: 'Enviar a revisión' }).dblclick();
    await expect(page.getByText('Enviada al Líder')).toBeVisible();
    await guardado(page);
    await page.locator('#rol-activo').selectOption('lider');
    await page.goto('/#/lider/entregas');
    await expect(page.locator('a[href*="/entregas/st/P-A"]')).toHaveCount(1);
    await page.goto('/#/lider/entregas/st/P-A');
    await expect(page.getByTestId('risk-ER1')).toBeVisible();
    await expect(page.getByTestId('derived-ER1')).toContainText('R1');
    await expect(page.getByTestId('ai-badge').first()).toHaveText(ROTULO);
    await expect(page.getByTestId('estr-sector')).toHaveCount(0);
    expect(await abierta(page)).toBe(false);
    await page.goto('/#/lider/entregas/st/P-A/informe');
    const ficha = page.getByTestId('tech-sheet');
    await expect(ficha).toContainText(MODELO);
    await expect(ficha).toContainText('Estrategia');
    await expect(page.getByTestId('print-report')).toContainText('Ruta sugerida');
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('la Empresa no tiene ningún dato técnico de la estrategia en el DOM', async ({ page }) => {
    await emitir(page, ['R1', 'R2', 'R3']);
    await generar(page);
    await page.getByRole('button', { name: 'Enviar a revisión' }).click();
    await guardado(page);
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)!); s.projects['P-B'] = JSON.parse(JSON.stringify(s.projects['P-A'])); localStorage.setItem(k, JSON.stringify(s)); }, STORAGE_KEY);
    await page.reload();
    await page.locator('#rol-activo').selectOption('contacto');
    await page.goto('/#/contacto/informe');
    await expect(page.getByTestId('print-report')).toBeVisible();
    const html = await page.locator('body').innerHTML();
    for (const t of ['trace-view', 'tech-sheet', 'Ver cómo trabajó el agente', 'Ficha técnica', 'partial-notice', MODELO]) expect(html).not.toContain(t);
  });
});

test.describe('límites de la Estrategia real', () => {
  test('sin hallazgos aceptados o editados y verificados: aviso claro y NINGUNA llamada al servicio ni al modelo', async ({ page }) => {
    let llamadas = 0;
    page.on('request', (r) => { if (r.url().includes('/api/strategy/run')) llamadas += 1; });
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R4'); // solo el NO VERIFICADO
    for (const id of ['R1', 'R2', 'R3']) await card(page, id).getByRole('button', { name: /^Rechazar/ }).click();
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await expect(page.getByText('Es de solo lectura.')).toBeVisible();
    await abrir(page, 'P-A', 'estrategia');
    await expect(page.getByTestId('strategy-real-nobacking')).toContainText('hallazgos aceptados o editados y verificados');
    await expect(page.getByRole('button', { name: 'Generar estrategia' })).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(llamadas).toBe(0);
  });

  test('si el proveedor falla (saldo): «Estrategia real no disponible», sin reintento y sin caer al modo Simulado', async ({ page }) => {
    let llamadas = 0;
    await page.route('**/api/strategy/run', (r) => { llamadas += 1; return r.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ error: { category: 'balance', message: 'Se agotó el saldo prepago.', retryable: false } }) }); });
    await emitir(page, ['R1', 'R2', 'R3']);
    await abrir(page, 'P-A', 'estrategia');
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    const err = page.getByTestId('strategy-real-unavailable');
    await expect(err).toContainText('Estrategia real no disponible');
    await expect(err).toContainText('Se agotó el saldo prepago');
    await expect(err.getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
    await page.waitForTimeout(1200);
    expect(llamadas).toBe(1);
    await expect(page.getByTestId('strategy-content')).toHaveCount(0);
    await expect(page.getByText('Análisis de sector')).toHaveCount(0);
    await expect(page.getByText('Simulada', { exact: true })).toHaveCount(0);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('el modo Simulado y su Estrategia ficticia no cambian', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('finding-H1')).toBeVisible({ timeout: 10_000 });
    await abrir(page, 'P-A', 'revision');
    for (const id of ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8']) { const c = page.getByTestId(`finding-${id}`); if (await c.count()) await c.getByRole('button', { name: /^Aceptar/ }).click(); }
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await abrir(page, 'P-A', 'estrategia');
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    await expect(page.getByText('Generada', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('estr-sector')).toBeVisible();
    await expect(page.getByTestId('estr-mercado')).toBeVisible();
    await expect(page.getByText('Simulada', { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId('ai-badge')).toHaveCount(0);
    await expect(page.getByTestId('trace-view')).toHaveCount(0);
  });
});
