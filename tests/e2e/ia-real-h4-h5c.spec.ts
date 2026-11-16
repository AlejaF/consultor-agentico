// Lote H5c: Tablero de una sola página y pruebas de DINAMISMO (cifras, tabla y gráficos se calculan con los datos).
// Corre con playwright.h4.config.ts. Servicio en modo FALSO. Archivo NUEVO.
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, elegirIAReal, entrarConsultor, ruta, SEIS_FORMATOS, HOSTILES, subir, vaciarServicio } from './helpers/real';

const ir = (page: Page, h: string) => page.evaluate((x) => (window.location.hash = x), h);
const hash = (page: Page) => page.evaluate(() => window.location.hash);

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
  await vaciarServicio(request, 'N-1');
});

async function comoLider(page: Page) {
  await page.locator('#rol-activo').selectOption('lider');
  await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
}
/** Lo que el Tablero muestra: cifras, columna «Entregas por revisar» de Equipo 1, «Proyectos» de Equipo 1 y el texto del gráfico de etapas. */
async function leerTablero(page: Page) {
  return page.evaluate(() => {
    const t = (id: string) => document.querySelector(`[data-testid="${id}"] .kpi-value`)?.textContent?.trim() ?? '';
    const cab = [...document.querySelectorAll('[data-testid="teams-table"] thead th')].map((e) => e.textContent!.trim());
    const fila = document.querySelector('[data-testid="teams-table"] tbody tr')!;
    const celdas = [fila.querySelector('th'), ...fila.querySelectorAll('td')].map((e) => e!.textContent!.trim());
    return {
      equipos: t('kpi-equipos'),
      porRevisar: t('kpi-por-revisar'),
      promedio: t('kpi-promedio'),
      madurez: t('kpi-madurez'),
      equipo1Pendientes: celdas[cab.indexOf('Entregas por revisar')],
      equipo1Proyectos: celdas[cab.indexOf('Proyectos')],
      etapas: document.querySelector('[data-testid="chart-stages"] .chart-summary')?.textContent?.trim() ?? '',
      calificaciones: Object.keys(JSON.parse(localStorage.getItem('consultor-agentico-demo:state') ?? '{"gradings":{}}').gradings ?? {}).length,
    };
  });
}

test.describe('Tablero · ausencia del bloque eliminado (no pasan vacías)', () => {
  test('el Tablero no tiene cola de revisión ni control Resumen | Detalle, pero Diagnóstico y Estrategia conservan el control', async ({ page }) => {
    await entrarConsultor(page);
    // la prueba ve primero lo que SÍ debe estar: si el Tablero no cargara, fallaría aquí y no pasaría vacía
    await comoLider(page);
    await expect(page.getByTestId('kpi-por-revisar')).toBeVisible();
    await expect(page.getByTestId('teams-table')).toBeVisible();
    await expect(page.getByTestId('review-queue')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Cola de revisión' })).toHaveCount(0);
    await expect(page.locator('.queue-item')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Vista de la pantalla' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Resumen', exact: true })).toHaveCount(0);
    // el control sigue donde debe
    await page.locator('#rol-activo').selectOption('consultor');
    await ir(page, '#/consultor/proyectos/P-C/estrategia');
    await expect(page.getByRole('navigation', { name: 'Vista de la pantalla' })).toBeVisible();
  });
});

test.describe('Tablero · dinamismo', () => {
  test('(a) al calificar una entrega: «Entregas por revisar» baja en 1, las calificaciones suben en 1, el promedio cambia y la tabla se actualiza; (c) «Restablecer demo» devuelve los valores iniciales', async ({ page }) => {
    await entrarConsultor(page);
    await comoLider(page);
    const antes = await leerTablero(page);
    expect(Number(antes.porRevisar)).toBeGreaterThan(0);
    // abrir la entrega desde «Entregas por revisar» (la cola ya no está en el Tablero) y calificarla
    await page.getByTestId('kpi-ver-entregas').click();
    await expect.poll(() => hash(page)).toBe('#/lider/entregas');
    await page.getByRole('link', { name: /^Abrir entrega.*Empresa Ficticia Beta/ }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Revisión de la entrega' })).toBeVisible();
    for (const g of await page.getByRole('radiogroup').all()) await g.getByRole('radio', { name: '1', exact: true }).check({ force: true });
    await page.getByRole('button', { name: 'Guardar calificación' }).click();
    await expect(page.getByTestId('grade-average')).toBeVisible();
    await page.waitForTimeout(1000); // el guardado en el navegador es diferido
    await ir(page, '#/lider');
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    const despues = await leerTablero(page);
    expect(Number(despues.porRevisar), 'Entregas por revisar baja en 1').toBe(Number(antes.porRevisar) - 1);
    // el Tablero no muestra el número de calificaciones: se lee del estado guardado (la entrega calificada pasa a figurar en él)
    expect(despues.calificaciones, 'el número de calificaciones guardadas sube').toBeGreaterThan(antes.calificaciones);
    expect(await page.evaluate((k) => Object.keys(JSON.parse(localStorage.getItem(k)!).gradings), 'consultor-agentico-demo:state')).toContain('dx/P-B');
    expect(despues.promedio, 'el promedio cambia').not.toBe(antes.promedio);
    expect(Number(despues.equipo1Pendientes), 'la columna «Entregas por revisar» de la tabla se actualiza').toBe(Number(antes.equipo1Pendientes) - 1);
    // (c) Restablecer demo devuelve los valores iniciales
    await page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, restablecer' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
    await page.getByRole('button', { name: /Entrar como Líder/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    expect(await leerTablero(page)).toEqual(antes);
  });

  test('(b) al crear un proyecto con el servicio falso: sube el conteo de proyectos y cambia «Proyectos por etapa»', async ({ page }) => {
    await entrarConsultor(page);
    await comoLider(page);
    const antes = await leerTablero(page);
    await page.locator('#rol-activo').selectOption('consultor');
    const boton = page.getByTestId('new-project-button');
    await expect(boton).toBeEnabled({ timeout: 15_000 });
    await boton.click();
    await page.getByLabel('Nombre de la empresa').fill('Empresa Ficticia Omega');
    await page.getByRole('button', { name: 'Crear proyecto' }).click();
    await expect(page).toHaveURL(/#\/consultor\/proyectos\/N-1\/evidencia$/);
    await page.waitForTimeout(1000);
    await comoLider(page);
    const despues = await leerTablero(page);
    const n = (t: string) => Number(/^(\d+) proyectos?/.exec(t)?.[1] ?? NaN);
    expect(n(despues.etapas), 'el gráfico cuenta un proyecto más').toBe(n(antes.etapas) + 1);
    expect(despues.etapas, 'cambia «Proyectos por etapa»').not.toBe(antes.etapas);
    expect(despues.equipo1Proyectos, 'el conteo de proyectos de Equipo 1 sube en 1').toBe(`${Number(/\d+/.exec(antes.equipo1Proyectos)![0]) + 1} proyectos`);
    expect(await page.getByTestId('chart-stages').getByText('Ver como tabla').count()).toBe(1);
  });
});

test('Tablero: axe AA, sin desplazamiento horizontal y objetivos de 44 px a 320, 768, 1280 y 1920; altura a 1280 (peor caso con un proyecto real emitido)', async ({ page }) => {
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await elegirIAReal(page);
  await subir(page, ruta([...SEIS_FORMATOS, ...HOSTILES]));
  await abrir(page, 'P-A', 'diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible({ timeout: 30_000 });
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByTestId('finding-R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
  await page.waitForTimeout(1000);
  await comoLider(page);
  const medidas: Record<number, number> = {};
  for (const w of [320, 768, 1280, 1920]) {
    await page.setViewportSize({ width: w, height: w === 1280 ? 600 : w >= 1024 ? 900 : 800 }); // a 1280, ventana baja: scrollHeight es la altura real
    await page.waitForTimeout(150);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    const chicos = await page.locator('main a, main button, main summary').evaluateAll((l) =>
      l.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 43.5 || r.width < 43.5) && !e.closest('.visually-hidden') && getComputedStyle(e).display !== 'inline'; }).map((e) => `${e.tagName}:${(e.textContent ?? '').trim().slice(0, 30)}`),
    );
    expect(chicos, `objetivos < 44 px a ${w}`).toEqual([]);
    medidas[w] = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  writeFileSync('docs/evidencia/h5c-medidas.json', JSON.stringify(medidas, null, 2));
  // peor caso (con un proyecto real emitido aparece además «Madurez por pilar (promedio)»): se registra, no se acota
});

// H5d: el criterio pasa de 1000 a 1100 px porque el Tablero ganó aire (ritmo de 16 y 24 px, filas de 44 px, relleno de 24 px y cifras con su enlace en fila propia)
test('Tablero: altura a 1280 con los datos de ejemplo ≤ 1100 px', async ({ page }) => {
  await entrarConsultor(page);
  await comoLider(page);
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.waitForTimeout(200);
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  writeFileSync('docs/evidencia/h5c-medidas-ejemplo.json', JSON.stringify({ alto1280: alto }, null, 2));
  expect(alto, `altura del Tablero a 1280: ${alto}`).toBeLessThanOrEqual(1100);
});

/** Espacios del Tablero (H5d): mínimos de ritmo (16 y 24 px), filas de 40 px, relleno de 20 px y cifras alineadas. */
async function medirEspacios(page: Page) {
  return page.evaluate(() => {
    const r = (e: Element) => e.getBoundingClientRect();
    const main = document.querySelector('main')!;
    const intro = main.querySelector('h1 + p')!;
    const kpis = [...document.querySelectorAll('[data-testid^="kpi-"]')].filter((e) => e.classList.contains('kpi'));
    const grid = document.querySelector('section[aria-label="Indicadores"]')!;
    const h2 = document.getElementById('tab-equipos')!;
    const tabla = document.querySelector('[data-testid="teams-table"]')!;
    const etapas = document.querySelector('[data-testid="chart-stages"]')!;
    const madurez = document.querySelector('[data-testid="chart-maturity-projects"]')!;
    const filas = [...document.querySelectorAll('[data-testid="teams-table"] tbody tr')].map((e) => r(e).height);
    const pad = (e: Element) => { const s = getComputedStyle(e); return Math.min(...[s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(parseFloat)); };
    const valores = kpis.map((k) => r(k.querySelector('.kpi-value')!).top);
    const enlace = document.querySelector('[data-testid="kpi-ver-entregas"]')!;
    const valorEntregas = document.querySelector('[data-testid="kpi-por-revisar"] .kpi-value')!;
    const lado = Math.abs(r(etapas).top - r(madurez).top) < 4;
    return {
      descripcionACifras: Math.round(r(grid).top - r(intro).bottom),
      cifrasATitulo: Math.round(r(h2).top - r(grid).bottom),
      filaMin: Math.round(Math.min(...filas)),
      tablaAGraficos: Math.round(r(etapas).top - r(tabla).bottom),
      entreGraficos: Math.round(lado ? r(madurez).left - r(etapas).right : r(madurez).top - r(etapas).bottom),
      rellenoCifras: pad(kpis[0]!),
      rellenoGrafico: pad(etapas),
      dispersionNumeros: Math.round(Math.max(...valores) - Math.min(...valores)),
      enlaceDebajo: Math.round(r(enlace).top - r(valorEntregas).bottom),
      alto: document.documentElement.scrollHeight,
    };
  });
}

test('Tablero (H5d): espacios mínimos de ritmo, filas de 40 px, relleno de 20 px y cifras alineadas, a 1280 y a 768', async ({ page }) => {
  await entrarConsultor(page);
  await comoLider(page);
  const medidas: Record<string, unknown> = {};
  for (const w of [1280, 768]) {
    await page.setViewportSize({ width: w, height: w === 1280 ? 600 : 800 });
    await page.waitForTimeout(200);
    const m = await medirEspacios(page);
    medidas[w] = m;
    expect.soft(m.descripcionACifras, `descripción → cifras a ${w}`).toBeGreaterThanOrEqual(16);
    expect.soft(m.cifrasATitulo, `cifras → «Equipos» a ${w}`).toBeGreaterThanOrEqual(24);
    if (w >= 1024) expect.soft(m.filaMin, `alto mínimo de fila a ${w}`).toBeGreaterThanOrEqual(40);
    expect.soft(m.tablaAGraficos, `tabla → gráficos a ${w}`).toBeGreaterThanOrEqual(24);
    expect.soft(m.entreGraficos, `entre los dos gráficos a ${w}`).toBeGreaterThanOrEqual(24);
    expect.soft(m.rellenoCifras, `relleno de las cifras a ${w}`).toBeGreaterThanOrEqual(20);
    expect.soft(m.rellenoGrafico, `relleno de los gráficos a ${w}`).toBeGreaterThanOrEqual(20);
    expect.soft(m.dispersionNumeros, `los 4 números a la misma altura a ${w}`).toBeLessThanOrEqual(1);
    expect.soft(m.enlaceDebajo, `«Ver entregas →» en una fila propia, debajo del número, a ${w}`).toBeGreaterThanOrEqual(0);
  }
  writeFileSync(process.env.H5D_ANTES ? 'docs/evidencia/h5d-medidas-antes.json' : 'docs/evidencia/h5d-medidas.json', JSON.stringify(medidas, null, 2));
});
