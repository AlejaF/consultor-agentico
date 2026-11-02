import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { matchRoute, ROUTES, type Role } from '../../src/app/router';
import { BUILT_ROUTE_IDS, coveredRouteIds, ROLE_BUTTON, SAMPLE_HASHES } from './helpers/routes';

// Matriz transversal: todas las pantallas existentes × 320, 768 y 1280 px (FR-037 a FR-040; SC-007 a SC-009).
// Con EVIDENCIA=1 guarda la salida de axe (docs/evidencia/axe/) y una captura por pantalla y ancho (docs/evidencia/capturas/<ancho>/).
const EVIDENCIA = !!process.env.EVIDENCIA;

async function smallTargets(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, select, textarea, input:not([hidden]), a[href]')]
      .filter((el) => el.offsetParent !== null && !el.classList.contains('skip-link'))
      .map((el) => ({ t: (el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 30), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height < 44 || r.width < 44)
      .map(({ t, r }) => `${t} ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
}

test('las direcciones de muestra cubren exactamente las rutas existentes de la tabla', () => {
  expect([...coveredRouteIds()].sort()).toEqual([...BUILT_ROUTE_IDS].sort());
  expect(ROUTES.length).toBeGreaterThan(BUILT_ROUTE_IDS.length); // hay rutas aún sin pantalla
});

test('ingreso: axe, sin desplazamiento horizontal y objetivos de 44 px', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await smallTargets(page)).toEqual([]);
  if (EVIDENCIA) {
    const w = info.project.name;
    mkdirSync(`docs/evidencia/axe`, { recursive: true });
    mkdirSync(`docs/evidencia/capturas/${w}`, { recursive: true });
    writeFileSync(`docs/evidencia/axe/ingreso-${w}.json`, JSON.stringify(summary('#/', w, results), null, 2));
    await page.screenshot({ path: `docs/evidencia/capturas/${w}/ingreso.png`, fullPage: true });
  }
});

function summary(hash: string, width: string, r: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    ruta: hash,
    ancho: Number(width),
    reglas: ['wcag2a', 'wcag2aa', 'wcag22aa'],
    versionAxe: r.testEngine.version,
    violaciones: r.violations.map((v) => ({ id: v.id, ayuda: v.help, impacto: v.impact, nodos: v.nodes.length })),
    reglasAprobadas: r.passes.length,
    porRevisarAMano: r.incomplete.map((v) => ({ id: v.id, ayuda: v.help, nodos: v.nodes.length })),
    noAplica: r.inapplicable.length,
  };
}

for (const role of Object.keys(SAMPLE_HASHES) as Role[]) {
  test(`${role}: todas las pantallas (foco en el h1, título, sin desplazamiento horizontal, 44 px y axe)`, async ({ page }, info) => {
    const w = info.project.name;
    await page.goto('/');
    await page.getByRole('button', { name: `Entrar como ${ROLE_BUTTON[role]}` }).click();
    await expect(page).toHaveURL(new RegExp(`#/${role}$`));
    for (const { hash, name } of SAMPLE_HASHES[role]) {
      const route = matchRoute(hash)!;
      const sameAsCurrent = new URL(page.url()).hash === hash;
      if (!sameAsCurrent) await page.evaluate((h) => (window.location.hash = h), hash);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page).toHaveTitle(`${route.title} · Consultor Agéntico (DEMO)`);
      if (!sameAsCurrent) {
        await expect(page.locator('main h1')).toBeFocused(); // al cambiar de ruta el foco queda en el h1 (FR-038)
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `desplazamiento horizontal en ${hash}`).toBeLessThanOrEqual(0);
      expect(await smallTargets(page), `objetivos < 44 px en ${hash}`).toEqual([]);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`), `axe en ${hash}`).toEqual([]);

      if (EVIDENCIA) {
        mkdirSync('docs/evidencia/axe', { recursive: true });
        mkdirSync(`docs/evidencia/capturas/${w}`, { recursive: true });
        writeFileSync(`docs/evidencia/axe/${name}-${w}.json`, JSON.stringify(summary(hash, w, results), null, 2));
        await page.screenshot({ path: `docs/evidencia/capturas/${w}/${name}.png`, fullPage: true });
      }
    }
  });
}

test('el título del documento cambia al pasar de una pantalla distinta a otra', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  const titles: string[] = [];
  for (const h of ['#/consultor/proyectos/P-B/evidencia', '#/consultor/proyectos/P-B/diagnostico', '#/consultor/proyectos/P-B/revision', '#/consultor']) {
    await page.evaluate((x) => (window.location.hash = x), h);
    await expect(page.locator('main h1')).toBeFocused();
    titles.push(await page.title());
  }
  expect(new Set(titles).size).toBe(titles.length);
});
