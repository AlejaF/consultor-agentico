import { expect, test } from '@playwright/test';
import { matchRoute, type Role } from '../../src/app/router';
import { BUILT_ROUTE_IDS, coveredRouteIds, ROLE_BUTTON, SAMPLE_HASHES } from './helpers/routes';

// SC-004 (FR-004, FR-005): el 100 % de las pantallas existentes muestra «DEMO · datos ficticios»; toda pantalla con contenido
// simulado muestra «Simulada»; y los «NO VERIFICADO» donde corresponden. Recorre solo las rutas existentes (helpers/routes.ts).
// Los informes, la encuesta y el resumen del Contacto se comprobarán cuando existan (se vuelve a ejecutar en los cierres de L5a y L5b).
const EXPECT: Record<string, { simulada: boolean; noVerificado: boolean }> = {
  '#/consultor/proyectos/P-B/evidencia': { simulada: false, noVerificado: false },
  '#/consultor/proyectos/P-B/diagnostico': { simulada: true, noVerificado: true },
  '#/consultor/proyectos/P-B/revision': { simulada: true, noVerificado: true },
  '#/consultor/proyectos/P-C/estrategia': { simulada: true, noVerificado: true },
  '#/consultor': { simulada: false, noVerificado: false },
  '#/lider/entregas': { simulada: false, noVerificado: false },
  '#/lider/entregas/dx/E-2': { simulada: true, noVerificado: true },
  '#/lider/entregas/st/P-C': { simulada: true, noVerificado: true },
  '#/lider': { simulada: false, noVerificado: false },
  '#/contacto': { simulada: false, noVerificado: false },
};

test('la tabla de expectativas cubre todas las pantallas existentes', () => {
  const hashes = Object.values(SAMPLE_HASHES).flat().map((x) => x.hash);
  expect(Object.keys(EXPECT).sort()).toEqual([...hashes].sort());
  expect([...coveredRouteIds()].sort()).toEqual([...BUILT_ROUTE_IDS].sort());
});

test('ingreso: aviso de demo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('demo-banner')).toHaveText('DEMO · datos ficticios');
});

for (const role of Object.keys(SAMPLE_HASHES) as Role[]) {
  test(`${role}: aviso de demo en todas las pantallas y rótulos donde corresponden`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: `Entrar como ${ROLE_BUTTON[role]}` }).click();
    for (const { hash } of SAMPLE_HASHES[role]) {
      await page.evaluate((h) => (window.location.hash = h), hash);
      await expect(page.locator('main h1')).toBeVisible();
      expect(matchRoute(hash)).not.toBeNull();
      await expect(page.getByTestId('demo-banner'), `aviso de demo en ${hash}`).toHaveText('DEMO · datos ficticios');
      await expect(page.getByTestId('demo-banner')).toBeVisible();
      // cabecera única en todas las pantallas con rol: «Inicio» y «Restablecer demo»
      await expect(page.locator('header.topbar').getByRole('link', { name: 'Inicio' }), `«Inicio» en ${hash}`).toBeVisible();
      await expect(page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }), `«Restablecer demo» en ${hash}`).toBeVisible();
      // la marca es logo y texto, no un enlace; «Inicio» es el único enlace de la cabecera
      await expect(page.locator('header.topbar').getByRole('link')).toHaveCount(1);
      // el rol activo se ve completo, con su etiqueta «Rol activo» visible
      await expect(page.locator('header.topbar label')).toHaveText('Rol activo');
      await expect(page.locator('header.topbar select').locator('option:checked')).toHaveText(role === 'contacto' ? 'Contacto de la empresa' : role === 'lider' ? 'Líder' : 'Consultor');
      const want = EXPECT[hash];
      const sim = page.locator('main').getByText('Simulada', { exact: true });
      const nv = page.locator('main').getByText('NO VERIFICADO');
      if (want.simulada) await expect(sim.first(), `«Simulada» en ${hash}`).toBeVisible();
      else await expect(sim, `sin contenido simulado en ${hash}`).toHaveCount(0);
      if (want.noVerificado) await expect(nv.first(), `«NO VERIFICADO» en ${hash}`).toBeVisible();
    }
  });
}

test('el contenido simulado generado en la sesión también lleva el rótulo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-A/diagnostico'));
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByText('Generando diagnóstico…')).toBeVisible();
  await expect(page.locator('main').getByText('Simulada', { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId('finding-H5').getByText('NO VERIFICADO')).toBeVisible();
  await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-B/estrategia'));
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await expect(page.locator('main').getByText('Simulada', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('NO VERIFICADO · contenido ilustrativo')).toHaveCount(2);
});
