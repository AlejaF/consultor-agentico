// Lote H3-fix: correcciones de presentación tras la revisión. Mide posiciones y tamaños reales; servicio en modo FALSO.
import { expect, test, type Page } from '@playwright/test';
import { abrir, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const size = (page: Page, w: number, h = 900) => page.setViewportSize({ width: w, height: h }).then(() => page.waitForTimeout(150));

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

async function aTablero(page: Page) {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await page.locator('#rol-activo').selectOption('lider');
  await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
}

test('Madurez por proyecto: todas las pistas miden exactamente lo mismo (con y sin «ilustrativo»)', async ({ page }) => {
  await aTablero(page);
  await size(page, 1280);
  const ancho = await page.getByTestId('chart-maturity-projects').locator('.ranked-track').evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().width * 10) / 10));
  expect(ancho.length).toBeGreaterThan(1);
  expect(await page.getByTestId('chart-maturity-projects').getByText('ilustrativo').count()).toBeGreaterThan(0);
  expect(new Set(ancho).size, `anchos de pista: ${ancho.join(', ')}`).toBe(1);
});

test('Tablero: avance con porcentaje en la fila y «Equipo N» en una línea (la cola salió del Tablero en H5c)', async ({ page }) => {
  await aTablero(page);
  for (const w of [1280, 1920]) {
    await size(page, w);
    const tabla = page.getByTestId('teams-table');
    const fila = tabla.locator('tbody tr').first();
    await expect(fila.locator('[role="progressbar"], progress, .progress-track').first()).toBeVisible();
    await expect(fila).toContainText(/\d+\s?%/);
    // H5c: la cola de revisión salió del Tablero (las entregas se abren desde «Entregas por revisar»); aquí solo queda la tabla
    // «Equipo 1» no se parte
    const alturas = await tabla.locator('tbody tr').evaluateAll((trs) =>
      trs.map((tr) => {
        const th = tr.querySelector('th,td') as HTMLElement;
        const lh = parseFloat(getComputedStyle(th).lineHeight) || 24;
        return th.getBoundingClientRect().height / lh;
      }),
    );
    const celdaEquipo = await tabla.locator('tbody tr').first().locator('th,td').first().evaluate((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      return r.getClientRects().length;
    });
    expect(celdaEquipo, `«Equipo» en una sola línea a ${w}`).toBe(1);
    expect(alturas.length).toBeGreaterThan(0);
  }
});

test('Revisión: la columna lateral empieza arriba (a la altura de las cifras) y «Aprobar y emitir» se ve sin desplazarse', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await card(page, 'R1').waitFor();
  for (const w of [1280, 1920]) {
    await size(page, w, w === 1280 ? 800 : 1080);
    await page.evaluate(() => window.scrollTo(0, 0));
    const lado = (await page.locator('.split-side').boundingBox())!;
    const cifras = (await page.getByTestId('review-stats').boundingBox())!;
    expect(lado.y, `lateral ${lado.y} vs cifras ${cifras.y} a ${w}`).toBeLessThanOrEqual(cifras.y + 1);
    await expect(page.getByRole('button', { name: 'Aprobar y emitir' })).toBeInViewport();
  }
});

test('Resumen de la traza: dos zonas, tres cifras con rótulo y nombres de herramienta sin partir', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await size(page, 1280);
  const t = page.getByTestId('chart-trace-summary');
  await t.scrollIntoViewIfNeeded();
  const izq = (await t.locator('.trace-bars').boundingBox())!;
  const der = (await t.locator('.trace-figures').boundingBox())!;
  expect(der.x).toBeGreaterThan(izq.x + izq.width - 1);
  await expect(t.locator('.trace-figures .trace-figure')).toHaveCount(3);
  const partidos = await t.locator('.ranked-name').evaluateAll((l) =>
    l.filter((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      return r.getClientRects().length > 1 && !/_/.test(e.textContent ?? '');
    }).map((e) => e.textContent),
  );
  expect(partidos, 'nombres partidos a mitad de palabra').toEqual([]);
});

test('Espacios: separación entre chips del resumen del diagnóstico y entre «Riesgo/Fase» y su título', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'diagnostico');
  await size(page, 1280);
  const chips = page.locator('.report-head .badge');
  const a = (await chips.nth(0).boundingBox())!;
  const b = (await chips.nth(1).boundingBox())!;
  const mismaFila = b.y < a.y + a.height;
  const hueco = mismaFila ? b.x - (a.x + a.width) : b.y - (a.y + a.height); // si no caben juntos, pasan a otra línea
  expect(hueco, 'separación entre los dos chips').toBeGreaterThanOrEqual(6);
});

test('Matriz de procedencia: hay al menos 8 px entre el chip «Riesgo/Fase» y su título', async ({ page }) => {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByTestId('strategy-content').waitFor({ timeout: 30_000 });
  await size(page, 1280);
  const huecos = await page.getByTestId('dot-matrix').locator('tbody th').evaluateAll((ths) =>
    ths.map((th) => {
      const chip = th.querySelector('.badge')!.getBoundingClientRect();
      const w = document.createTreeWalker(th, NodeFilter.SHOW_TEXT);
      let t: Node | null;
      let titulo: Node | null = null;
      while ((t = w.nextNode())) if ((t.textContent ?? '').trim() && !t.parentElement!.closest('.badge')) { titulo = t; break; }
      const r = document.createRange();
      r.selectNodeContents(titulo!);
      const x = r.getClientRects()[0]!;
      const mismaFila = x.top < chip.bottom;
      return mismaFila ? x.left - chip.right : x.top - chip.bottom;
    }),
  );
  expect(huecos.length).toBeGreaterThan(0);
  for (const h of huecos) expect(h, `huecos: ${huecos.join(', ')}`).toBeGreaterThanOrEqual(8);
});
