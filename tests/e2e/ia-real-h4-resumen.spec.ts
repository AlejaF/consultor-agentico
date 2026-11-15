// Lote H4a (AG-036): Resumen de Diagnóstico. Corre con playwright.h4.config.ts (vista por defecto de PRODUCCIÓN: «resumen»).
// Servicio en modo FALSO (sin red, sin clave, sin gasto). No edita ni reutiliza aserciones de las suites existentes.
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, elegirIAReal, entrarConsultor, ruta, SEIS_FORMATOS, HOSTILES, subir, vaciarServicio } from './helpers/real';

const BASE = '#/consultor/proyectos/P-A/diagnostico';
const MODELO = 'modelo-falso-e2e';
const TECNICO = ['trace-view', 'trace-model', 'trace-tokens', 'trace-errors', 'tech-sheet', 'chart-trace-summary', 'Ver cómo trabajó el agente', 'Traza del agente', 'Ficha técnica', 'partial-notice', 'review-warning', MODELO];

/** Genera el diagnóstico real de P-A. En el Resumen no hay tarjetas de hallazgos: se espera el propio Resumen. */
async function generar(page: Page) {
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await elegirIAReal(page);
  await subir(page, ruta([...SEIS_FORMATOS, ...HOSTILES]));
  await abrir(page, 'P-A', 'diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible({ timeout: 30_000 });
}
/** Acepta R1, R2 y R3 en la Revisión (R4 queda sin decidir) y vuelve al Resumen. */
async function aceptarTres(page: Page) {
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await abrir(page, 'P-A', 'diagnostico');
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
}
const hash = (page: Page) => page.evaluate(() => window.location.hash);
const resize = async (page: Page, w: number, h = w >= 1024 ? 900 : 800) => {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(150);
};
const idsDuplicados = (page: Page) =>
  page.evaluate(() => {
    const vistos = new Map<string, number>();
    for (const e of document.querySelectorAll('[id]')) vistos.set(e.id, (vistos.get(e.id) ?? 0) + 1);
    return [...vistos].filter(([, n]) => n > 1).map(([id]) => id);
  });

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test('por defecto (producción) la ruta base abre el Resumen: cifras, estado y botones, sin tarjetas de hallazgos', async ({ page }) => {
  await generar(page);
  expect(await hash(page)).toBe(BASE); // la ruta base no cambia: la vista inicial es la de producción
  const control = page.getByRole('navigation', { name: 'Vista de la pantalla' });
  await expect(control.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page');
  await expect(control.getByRole('link', { name: 'Detalle' })).not.toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[role="tablist"]')).toHaveCount(0); // son enlaces, no pestañas
  // H4b: la fila de 3 cifras se unió a «Estado de los hallazgos»: una línea resumen con los mismos valores en texto
  await expect(page.getByTestId('resumen-estado-linea')).toHaveText('4 hallazgos · 3 verificados · 1 NO VERIFICADO');
  await expect(page.getByTestId('chart-review-state')).toHaveCount(1);
  await expect(page.getByTestId('maturity-card')).toHaveCount(1);
  await expect(page.getByTestId('maturity-card')).toContainText('Índice de madurez');
  // el rótulo de IA acompaña a la madurez y a los hallazgos
  await expect(page.getByTestId('ai-badge').first()).toHaveText('Generado por IA · requiere revisión humana');
  // lo del Detalle no está montado
  await expect(page.getByTestId('finding-R1')).toHaveCount(0);
  await expect(page.getByTestId('pillar-flow')).toHaveCount(0);
  await expect(page.getByTestId('chart-coverage')).toHaveCount(0);
  await expect(page.getByTestId('missing-info')).toHaveCount(0);
  await expect(page.getByTestId('trace-view')).toHaveCount(0);
  expect(await idsDuplicados(page), 'ids duplicados').toEqual([]);
});

test('barras por pilar: los respaldados llevan número y los demás no dibujan ninguno', async ({ page }) => {
  await generar(page);
  await aceptarTres(page); // con hallazgos aceptados y verificados hay niveles con respaldo; el resto sigue sin evidencia
  const filas = page.locator('[data-testid^="resumen-pilar-"]');
  await expect(filas).toHaveCount(6);
  let conNumero = 0;
  let sinNumero = 0;
  for (const f of await filas.all()) {
    const texto = ((await f.innerText()) + ' ' + (await f.locator('[aria-label]').evaluateAll((l) => l.map((e) => e.getAttribute('aria-label')).join(' ')))).trim();
    if (/\b\d(,\d)? de 5\b/.test(texto)) conNumero++;
    else {
      sinNumero++;
      expect(texto, 'una barra sin evidencia no lleva número').toMatch(/Sin evidencia suficiente|Sin respaldo vigente/);
      await expect(f.locator('.scale-fill'), 'no hay relleno en una barra sin evidencia').toHaveCount(0);
    }
  }
  expect(conNumero + sinNumero).toBe(6);
  expect(sinNumero, 'hay pilares sin evidencia en el escenario de prueba').toBeGreaterThan(0);
  expect(conNumero, 'hay pilares con evidencia en el escenario de prueba').toBeGreaterThan(0);
});

test('los 4 botones llevan al Detalle posicionado, con el foco en el encabezado de su sección', async ({ page }) => {
  await generar(page);
  const acciones = page.getByTestId('resumen-acciones');
  await expect(acciones.getByRole('link')).toHaveCount(4);
  const casos = [
    { nombre: /^Ver los 4 hallazgos$/, seccion: 'hallazgos', encabezado: /^Pilar: / },
    { nombre: /^Ver cobertura de evidencia$/, seccion: 'cobertura', encabezado: /^Cobertura de evidencia/ },
    { nombre: /^Ver evidencia sugerida \(2\)$/, seccion: 'evidencia-sugerida', encabezado: /^Evidencia sugerida/ },
  ];
  for (const c of casos) {
    await page.goto(`/${BASE}/resumen`);
    await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
    const enlace = page.getByTestId('resumen-acciones').getByRole('link', { name: c.nombre });
    await expect(enlace).toBeVisible();
    expect((await enlace.innerText()).trim().length, 'texto visible').toBeGreaterThan(5);
    await enlace.click();
    await expect.poll(() => hash(page)).toBe(`${BASE}/detalle/${c.seccion}`);
    await expect(page.getByTestId('finding-R1')).toBeVisible();
    const foco = page.locator('h2:focus');
    await expect(foco, `foco en el encabezado de ${c.seccion}`).toHaveCount(1);
    await expect(foco).toHaveText(c.encabezado);
    await expect(foco).toBeInViewport();
  }
  await page.goto(`/${BASE}/resumen`);
  await page.getByTestId('resumen-acciones').getByRole('link', { name: 'Ir a la revisión' }).click();
  await expect.poll(() => hash(page)).toBe('#/consultor/proyectos/P-A/revision');
});

test('un pilar del Resumen lleva a «Pilar: <nombre>»; uno sin hallazgos lleva a «Madurez por dimensión»', async ({ page }) => {
  await generar(page);
  await page.getByTestId('resumen-pilar-infraestructura').getByRole('link').click();
  await expect.poll(() => hash(page)).toBe(`${BASE}/detalle/pilar-infraestructura`);
  await expect(page.locator('h2:focus')).toHaveText('Pilar: Infraestructura');
  await expect(page.locator('h2:focus')).toBeInViewport();
  await page.goto(`/${BASE}/resumen`);
  await page.getByTestId('resumen-pilar-cultura').getByRole('link').click();
  await expect.poll(() => hash(page)).toBe(`${BASE}/detalle/pilar-cultura`);
  await expect(page.locator('h2:focus')).toHaveText('Madurez por dimensión');
});

test('el control Resumen | Detalle son dos enlaces con teclado, solo se monta la vista activa y la vista sobrevive a recargar', async ({ page }) => {
  await generar(page);
  const control = page.getByRole('navigation', { name: 'Vista de la pantalla' });
  await control.getByRole('link', { name: 'Detalle' }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => hash(page)).toBe(`${BASE}/detalle`);
  await expect(page.getByTestId('finding-R1')).toBeVisible();
  await expect(page.getByTestId('diagnostico-resumen')).toHaveCount(0);
  await expect(control.getByRole('link', { name: 'Detalle' })).toHaveAttribute('aria-current', 'page');
  expect(await idsDuplicados(page), 'ids duplicados en el Detalle').toEqual([]);
  await page.reload();
  await expect(page.getByTestId('finding-R1')).toBeVisible(); // el Detalle se conserva: la vista vive en la ruta
  await control.getByRole('link', { name: 'Resumen' }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => hash(page)).toBe(`${BASE}/resumen`);
  await page.reload();
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
  await expect(page.getByTestId('finding-R1')).toHaveCount(0);
});

test('lo técnico (traza, modelo, tokens) no está en el Resumen y la Empresa no ve nada técnico en ninguna vista', async ({ page }) => {
  await generar(page);
  let html = await page.locator('body').innerHTML();
  for (const t of TECNICO) expect(html, `el Resumen del Consultor no debe traer «${t}»`).not.toContain(t);
  // la traza sigue existiendo, en el Detalle, para el Consultor
  await page.goto(`/${BASE}/detalle`);
  await expect(page.getByTestId('trace-view')).toHaveCount(1);
  // la Empresa: no accede al Diagnóstico (ni a su Resumen ni a su Detalle) y no queda nada técnico en el DOM
  for (const vista of ['resumen', 'detalle']) {
    await page.locator('#rol-activo').selectOption('contacto');
    await page.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
    await page.evaluate((h) => (window.location.hash = h), `${BASE}/${vista}`);
    await expect.poll(() => hash(page)).toBe('#/contacto');
    html = await page.locator('body').innerHTML();
    for (const t of TECNICO) expect(html, `la Empresa no debe tener «${t}» (${vista})`).not.toContain(t);
    await page.locator('#rol-activo').selectOption('consultor');
    await page.getByRole('heading', { level: 1, name: 'Proyectos' }).waitFor();
  }
});

test('el Resumen de un proyecto simulado: índice ilustrativo, sin cobertura ni evidencia sugerida', async ({ page }) => {
  await entrarConsultor(page);
  await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-B/diagnostico'));
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible(); // P-B ya trae un diagnóstico simulado emitido
  await expect(page.getByTestId('maturity-card')).toContainText('ilustrativo, ficticio');
  await expect(page.getByTestId('resumen-estado-linea')).toContainText('hallazgos');
  const acciones = page.getByTestId('resumen-acciones');
  await expect(acciones.getByRole('link', { name: /^Ver los \d+ hallazgos$/ })).toBeVisible();
  await expect(acciones.getByRole('link', { name: /cobertura/i })).toHaveCount(0);
  await expect(acciones.getByRole('link', { name: /evidencia sugerida/i })).toHaveCount(0);
  await expect(page.getByTestId('ai-badge')).toHaveCount(0); // simulado: sin rótulo de IA
  await expect(page.locator('[data-testid^="resumen-pilar-"]')).toHaveCount(0); // sin niveles por pilar en el modo simulado
});

test('accesibilidad AA, teclado y sin desplazamiento horizontal a 320, 768, 1280 y 1920; altura y bloques del Resumen', async ({ page }) => {
  await generar(page);
  const medidas: Record<number, unknown> = {};
  for (const w of [320, 768, 1280, 1920]) {
    await resize(page, w);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    // todo enlace y botón del Resumen se alcanza con Tab y mide al menos 44 px
    const chicos = await page.locator('main a, main button, main summary').evaluateAll((l) =>
      l.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 - 0.5 || r.width < 44 - 0.5) && !e.closest('.visually-hidden') && getComputedStyle(e).display !== 'inline'; }).map((e) => `${e.tagName}:${(e.textContent ?? '').trim().slice(0, 30)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`),
    );
    expect(chicos, `objetivos < 44 px a ${w}`).toEqual([]);
    const m = await page.evaluate(() => ({
      alto: document.documentElement.scrollHeight,
      madurez: document.querySelectorAll('[data-testid="maturity-card"]').length,
      cifras: document.querySelectorAll('[data-testid="resumen-estado-linea"]').length, // H4b: la línea de estado reemplaza a las 3 cifras
      estado: document.querySelectorAll('[data-testid="chart-review-state"]').length,
      botones: document.querySelectorAll('[data-testid="resumen-acciones"] a, [data-testid="resumen-acciones"] button').length,
    }));
    medidas[w] = m;
    expect(m.madurez).toBe(1);
    expect(m.cifras).toBe(1);
    expect(m.estado).toBe(1);
    expect(m.botones).toBeLessThanOrEqual(4);
    if (w === 1280) expect(m.alto, `altura del Resumen a 1280: ${m.alto}`).toBeLessThanOrEqual(1000);
  }
  // teclado: Tab recorre el control y los 4 botones del Resumen
  await resize(page, 1280);
  const alcanzados = new Set<string>();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const t = await page.evaluate(() => (document.activeElement?.textContent ?? '').trim());
    alcanzados.add(t);
  }
  for (const t of ['Resumen', 'Detalle', 'Ver los 4 hallazgos', 'Ver cobertura de evidencia', 'Ver evidencia sugerida (2)', 'Ir a la revisión'])
    expect([...alcanzados].some((x) => x.includes(t)), `Tab alcanza «${t}»`).toBe(true);
  writeFileSync('docs/evidencia/h4a-medidas.json', JSON.stringify(medidas, null, 2));
});
