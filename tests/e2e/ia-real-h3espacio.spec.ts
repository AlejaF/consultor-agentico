// Micro-lote H3-espacio: el espacio vertical entre bloques apilados nunca baja de 12 px (a 1280). Servicio en modo FALSO.
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { abrir, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);

/** Bloques visibles (tarjetas, gráficos, cifras y secciones con encabezado) que no están dentro de otro bloque; para cada uno,
 *  el hueco hasta el bloque siguiente de su misma columna. */
async function huecos(page: Page) {
  return page.evaluate(() => {
    const SEL = '.main .card, .main .chart, .main .review-stats .stats-row, .main .review-stats > .chart, .main .maturity-detail, .main details, .main .pillar-flow > section, .main [data-testid="trace-view"]';
    const todos = [...document.querySelectorAll(SEL)].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.height > 8 && r.width > 40 && !e.closest('.visually-hidden') && getComputedStyle(e).position !== 'absolute';
    });
    const bloques = todos.filter((e) => !todos.some((o) => o !== e && o.contains(e)));
    const nombre = (e: Element) => (e.getAttribute('data-testid') || e.getAttribute('aria-label') || e.className || e.tagName).toString().slice(0, 32);
    const out: { a: string; b: string; hueco: number }[] = [];
    for (const a of bloques) {
      const ra = a.getBoundingClientRect();
      let mejor: { b: Element; d: number } | null = null;
      for (const b of bloques) {
        if (b === a) continue;
        const rb = b.getBoundingClientRect();
        const mismaColumna = ra.left < rb.right - 1 && rb.left < ra.right - 1;
        const d = rb.top - ra.bottom;
        if (mismaColumna && d >= -1 && (!mejor || d < mejor.d)) mejor = { b, d };
      }
      if (mejor) out.push({ a: nombre(a), b: nombre(mejor.b), hueco: Math.round(mejor.d * 10) / 10 });
    }
    return out;
  });
}

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

async function aEstrategia(page: Page) {
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await page.getByTestId('strategy-content').waitFor({ timeout: 30_000 });
}

test('ritmo vertical: entre bloques apilados hay al menos 12 px (Diagnóstico, Revisión y Estrategia a 1280)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await generarDiagnosticoReal(page);
  const pantallas: Record<string, Awaited<ReturnType<typeof huecos>>> = {};
  pantallas.diagnostico = await huecos(page);
  await abrir(page, 'P-A', 'revision');
  await card(page, 'R1').waitFor();
  pantallas.revision = await huecos(page);
  await aEstrategia(page);
  pantallas.estrategia = await huecos(page);
  for (const [nombre, l] of Object.entries(pantallas)) {
    expect(l.length, `${nombre}: se midió algún par de bloques`).toBeGreaterThan(0);
    const malos = l.filter((x) => x.hueco < 12);
    expect(malos, `${nombre}: bloques pegados (< 12 px): ${JSON.stringify(l)}`).toEqual([]);
  }
});

test('la altura de Revisión a 1280 sigue dentro del criterio 1 de H3 (≤ 1877 px)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await card(page, 'R1').waitFor();
  await page.waitForTimeout(200);
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const l = await huecos(page);
  writeFileSync(`docs/evidencia/h3espacio-medidas${process.env.H3_ANTES ? '-antes' : ''}.json`, JSON.stringify({ alturaRevision1280: alto, huecosRevision: l }, null, 2));
  expect(alto, `altura de Revisión a 1280: ${alto}`).toBeLessThanOrEqual(1877);
});
