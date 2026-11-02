import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../../src/state/initial';
import { PDF_VALIDO } from './fixtures/archivos';

// Defecto grave de «Restablecer demo»: tras restablecer, los datos cambiados deben volver TODOS a los de ejemplo,
// en memoria y en almacenamiento, también con otras pestañas abiertas (FR-006; contracts/persisted-state.md).
const KEY = 'consultor-agentico-demo:state';
const CRITERIOS = ['Trazabilidad de la evidencia', 'Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación'];
const INICIAL = JSON.parse(JSON.stringify(createInitialState())) as ReturnType<typeof createInitialState>;

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
async function guardado(page: Page) {
  return page.evaluate((k) => {
    const t = localStorage.getItem(k);
    return t ? (JSON.parse(t) as Record<string, any>) : null;
  }, KEY);
}
/** Cambia mucho: estrategia de P-B generada y enviada, calificación del Líder, decisión y evidencia propia en P-A. */
async function ensuciar(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Entrar como Consultor/ }).click();
  await goto(page, '#/consultor/proyectos/P-B/estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  await page.getByText('Enviada al Líder').first().waitFor();
  await goto(page, '#/consultor/proyectos/P-A/diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await page.getByText('Generado — pendiente de revisión').waitFor();
  await goto(page, '#/consultor/proyectos/P-A/revision');
  await page.getByTestId('finding-H1').getByRole('button', { name: /^Aceptar/ }).click();
  await goto(page, '#/consultor/proyectos/P-A/evidencia');
  await page.locator('input[type=file]').setInputFiles([PDF_VALIDO]);
  await page.getByText('informe-ejemplo.pdf').waitFor();
  await page.getByLabel('Rol activo').selectOption('lider');
  await goto(page, '#/lider/entregas/st/P-B');
  for (const name of CRITERIOS) await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '5' }).check({ force: true });
  await page.getByRole('button', { name: 'Guardar calificación' }).click();
  await page.getByTestId('grade-average').waitFor();
  await expect.poll(async () => (await guardado(page))?.gradings?.['st/P-B'] !== undefined).toBe(true); // ya guardado
}
async function restablecer(page: Page) {
  await page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, restablecer' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
}
/** Entra a cada rol y comprueba que TODO está como en los datos de ejemplo. */
async function comprobarInicial(page: Page, donde: string) {
  await page.getByRole('button', { name: /Entrar como Consultor/ }).click();
  await goto(page, '#/consultor/proyectos/P-B/estrategia');
  await expect(page.getByRole('button', { name: 'Generar estrategia' }), `estrategia de P-B ${donde}`).toBeVisible();
  await expect(page.getByText('Enviada al Líder')).toHaveCount(0);
  await goto(page, '#/consultor/proyectos/P-A/diagnostico');
  await expect(page.getByRole('button', { name: 'Generar diagnóstico' }), `diagnóstico de P-A ${donde}`).toBeVisible();
  await goto(page, '#/consultor/proyectos/P-A/evidencia');
  await expect(page.getByText('informe-ejemplo.pdf'), `evidencia propia ${donde}`).toHaveCount(0);
  await goto(page, '#/consultor/proyectos/P-C/estrategia');
  await expect(page.getByText('Enviada al Líder').first(), `P-C sigue con su estrategia de ejemplo ${donde}`).toBeVisible();
  await page.getByLabel('Rol activo').selectOption('lider');
  await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
  await expect(page.getByTestId('kpi-por-revisar'), `entregas por revisar ${donde}`).toContainText('3');
  await expect(page.getByTestId('kpi-promedio'), `promedio ${donde}`).toContainText('4,2 de 5');
  await goto(page, '#/lider/entregas');
  await expect(page.getByRole('link', { name: /^Abrir entrega/ })).toHaveCount(3);
  await page.getByLabel('Rol activo').selectOption('contacto');
  await expect(page.getByRole('heading', { level: 1, name: 'Empresa' })).toBeVisible();
}
function sinRol(s: Record<string, any> | null) {
  if (!s) return null;
  return { ...s, session: { role: null } };
}

test.describe('Restablecer demo devuelve TODO el estado a los datos de ejemplo', () => {
  test('en un solo navegador: sin recargar y recargando (memoria y almacenamiento)', async ({ page }, info) => {
    test.skip(info.project.name !== '1280', 'El escenario no depende del ancho');
    await ensuciar(page);
    await restablecer(page);
    await expect(page.getByTestId('notices')).toContainText('Se restableció la demo. Volvió al estado inicial, que incluye datos de ejemplo.');
    // memoria: lo que se ve; almacenamiento: nada de la sesión anterior (sin clave o igual al estado de ejemplo, sin rol)
    await expect.poll(async () => JSON.stringify(sinRol(await guardado(page))) === JSON.stringify(sinRol(INICIAL)) || (await guardado(page)) === null).toBe(true);
    await comprobarInicial(page, 'sin recargar');
    await expect.poll(async () => (await guardado(page)) !== null).toBe(true); // el guardado con retraso ya ocurrió
    const g = await guardado(page);
    expect(Object.keys(g!.gradings).sort(), 'calificaciones').toEqual(Object.keys(INICIAL.gradings).sort());
    expect(g!.projects['P-B'].strategy.status).toBe(INICIAL.projects['P-B'].strategy.status);
    expect(g!.projects['P-A'].diagnosis).toEqual(INICIAL.projects['P-A'].diagnosis);
    expect(g!.projects['P-A'].localFiles).toEqual([]);
    await page.reload();
    await page.goto('/');
    await comprobarInicial(page, 'tras recargar');
    await expect.poll(async () => Object.keys((await guardado(page))?.gradings ?? {}).sort().join(',')).toBe(Object.keys(INICIAL.gradings).sort().join(','));
  });

  test('con otra pestaña abierta con datos viejos: no vuelve a escribirlos (A restablece, B adopta)', async ({ browser }, info) => {
    test.skip(info.project.name !== '1280', 'El escenario no depende del ancho');
    const ctx = await browser.newContext({ baseURL: info.project.use.baseURL });
    const A = await ctx.newPage();
    await ensuciar(A);
    const B = await ctx.newPage(); // pestaña vieja: carga el estado sucio
    await B.goto('/');
    await B.getByRole('button', { name: /Entrar como Consultor/ }).click();
    await goto(B, '#/consultor/proyectos/P-B/estrategia');
    await B.getByText('Enviada al Líder').first().waitFor();
    await A.bringToFront();
    await restablecer(A);
    // B adopta el estado restablecido: vuelve al ingreso (sin rol) sin tocar el almacenamiento
    await expect(B.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
    // la persona usa B: no puede resucitar los datos viejos
    await B.getByRole('button', { name: /Entrar como Líder/ }).click();
    await expect(B.getByTestId('kpi-por-revisar')).toContainText('3');
    await B.waitForTimeout(500);
    const g = await guardado(A);
    expect(g!.projects['P-B'].strategy.status).toBe('none');
    expect(Object.keys(g!.gradings).sort()).toEqual(Object.keys(INICIAL.gradings).sort());
    await A.reload();
    await A.goto('/');
    await comprobarInicial(A, 'en la pestaña que restableció, tras recargar');
    await ctx.close();
  });

  test('restablecer justo después de un cambio (guardado pendiente): no se reescribe lo viejo', async ({ page }, info) => {
    test.skip(info.project.name !== '1280', 'El escenario no depende del ancho');
    await page.goto('/');
    await page.getByRole('button', { name: /Entrar como Consultor/ }).click();
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await page.getByText('Generado — pendiente de revisión').waitFor();
    await restablecer(page); // sin esperar los 200 ms del guardado
    await page.waitForTimeout(600);
    const g = await guardado(page);
    if (g) expect(g.projects['P-A'].diagnosis.status).toBe('none');
    await comprobarInicial(page, 'tras restablecer sin esperar');
  });
});
