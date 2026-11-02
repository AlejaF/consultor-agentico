import { expect, test, type Page } from '@playwright/test';
import { type Role } from '../../src/app/router';
import { PDF_VALIDO } from './fixtures/archivos';
import { ROLE_BUTTON, SAMPLE_HASHES } from './helpers/routes';

// L6g/L: foco visible (WCAG 2.4.7 y 2.4.13). En TODAS las pantallas de la matriz y en TODOS los diálogos, cada elemento enfocable con Tab
// muestra un contorno de al menos 2 px y con contraste de al menos 3:1 contra el fondo; y en todo diálogo el foco inicial va a la opción segura.

interface Info { id: string; nombre: string; ok: boolean; motivo: string }

/** Indicador del elemento enfocado: su contorno o, en casillas y opciones ocultas, el del contenedor que se resalta. */
async function indicador(page: Page): Promise<Info> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const all = [...document.querySelectorAll('*')];
    const id = `${el.tagName}#${all.indexOf(el)}`;
    const nombre = (el.getAttribute('aria-label') || el.textContent || el.id || el.tagName).trim().slice(0, 40);
    const rgba = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number) as number[];
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const fondoDe = (start: Element | null): number[] => {
      for (let e = start; e; e = e.parentElement) {
        const c = rgba(getComputedStyle(e).backgroundColor);
        if (c.length >= 3 && (c[3] ?? 1) > 0.5) return c;
      }
      return [255, 255, 255];
    };
    const candidatos: HTMLElement[] = [el];
    if (el.matches('input[type=radio], input[type=checkbox]')) {
      const c = el.closest<HTMLElement>('label, .level');
      if (c) candidatos.push(c);
    }
    let ultimo = 'sin contorno';
    for (const t of candidatos) {
      const cs = getComputedStyle(t);
      const ancho = parseFloat(cs.outlineWidth);
      if (cs.outlineStyle === 'none' || cs.outlineStyle === 'hidden' || !(ancho >= 2)) {
        ultimo = `contorno ${cs.outlineStyle} ${cs.outlineWidth}`;
        continue;
      }
      const color = rgba(cs.outlineColor);
      const off = parseFloat(cs.outlineOffset) || 0;
      // con separación, el contorno se pinta sobre el fondo del contenedor; sin ella, sobre el del propio elemento
      const fondo = off > 0 ? fondoDe(t.parentElement) : fondoDe(t);
      const [l1, l2] = [lum(color), lum(fondo)];
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (ratio >= 3) return { id, nombre, ok: true, motivo: '' };
      ultimo = `contraste ${ratio.toFixed(2)}:1 (${cs.outlineColor} sobre rgb(${fondo.slice(0, 3).join(',')}))`;
    }
    return { id, nombre, ok: false, motivo: ultimo };
  });
}

async function recorrer(page: Page, donde: string, max = 150) {
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
  const vistos = new Set<string>();
  const fallas: string[] = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    // sin nada enfocado, el primer Tab puede dejar el foco en el documento: se vuelve a pulsar
    if (await page.evaluate(() => document.activeElement === document.body)) await page.keyboard.press('Tab');
    const info = await indicador(page);
    if (vistos.has(info.id)) break;
    vistos.add(info.id);
    if (!info.ok) fallas.push(`«${info.nombre}»: ${info.motivo}`);
  }
  expect(vistos.size, `se recorrió algún elemento en ${donde}`).toBeGreaterThan(0);
  expect(fallas, `foco sin indicador visible en ${donde}`).toEqual([]);
}

async function entrar(page: Page, role: Role) {
  await page.goto('/');
  await page.getByRole('button', { name: `Entrar como ${ROLE_BUTTON[role]}` }).click();
}

test('ingreso: todos los elementos enfocables muestran el foco', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' }).waitFor();
  await recorrer(page, `ingreso a ${info.project.name} px`);
});

for (const role of Object.keys(SAMPLE_HASHES) as Role[]) {
  test(`${role}: todas las pantallas de la matriz muestran el foco en cada elemento`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await entrar(page, role);
    for (const { hash } of SAMPLE_HASHES[role]) {
      await page.evaluate((h) => (window.location.hash = h), hash);
      await expect(page.locator('main h1')).toBeVisible();
      await recorrer(page, `${hash} a ${info.project.name} px`);
    }
  });
}

/** Cada diálogo: se abre con el teclado y con el ratón; el foco inicial va a la opción segura y todo elemento muestra su foco. */
const DIALOGOS: { nombre: string; segura: string; abrir: (page: Page, teclado: boolean) => Promise<void> }[] = [
  {
    nombre: 'Restablecer demo',
    segura: 'Cancelar',
    abrir: async (page, teclado) => {
      await entrar(page, 'consultor');
      await abrirCon(page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' }), teclado);
    },
  },
  {
    nombre: 'Quitar archivo',
    segura: 'Cancelar',
    abrir: async (page, teclado) => {
      await entrar(page, 'consultor');
      await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-A/evidencia'));
      await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
      await abrirCon(page.getByRole('button', { name: 'Quitar informe-ejemplo.pdf' }), teclado);
    },
  },
  {
    nombre: 'Aprobar y emitir el diagnóstico',
    segura: 'Cancelar',
    abrir: async (page, teclado) => {
      await entrar(page, 'consultor');
      await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-A/diagnostico'));
      await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
      await page.getByRole('heading', { level: 2, name: /^Pilar:/ }).first().waitFor();
      await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-A/revision'));
      for (const id of ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
      await abrirCon(page.getByRole('button', { name: 'Aprobar y emitir' }), teclado);
    },
  },
  {
    nombre: 'Edición sin guardar al cambiar de rol',
    segura: 'Seguir editando',
    abrir: async (page, teclado) => {
      await entrar(page, 'consultor');
      await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-A/diagnostico'));
      await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
      await page.getByRole('heading', { level: 2, name: /^Pilar:/ }).first().waitFor();
      await page.evaluate(() => (window.location.hash = '#/consultor/proyectos/P-A/revision'));
      await page.getByTestId('finding-H2').getByRole('button', { name: /^Editar/ }).click();
      await page.getByTestId('finding-H2').getByRole('textbox', { name: /Editar hallazgo/ }).fill('Cambio sin guardar');
      const selector = page.getByLabel('Rol activo');
      if (teclado) {
        await selector.focus();
        await page.keyboard.press('ArrowDown');
      } else await selector.selectOption('lider');
    },
  },
];

async function abrirCon(boton: ReturnType<Page['getByRole']>, teclado: boolean) {
  if (teclado) {
    await boton.focus();
    await boton.page().keyboard.press('Enter');
  } else await boton.click();
}

for (const d of DIALOGOS) {
  for (const teclado of [true, false]) {
    test(`diálogo «${d.nombre}» (${teclado ? 'teclado' : 'ratón'}): foco inicial en «${d.segura}» y foco visible en todo`, async ({ page }, info) => {
      test.skip(info.project.name === '768', 'Se prueba a 320 y 1280 px');
      test.setTimeout(90_000);
      await d.abrir(page, teclado);
      const dialogo = page.getByRole('dialog');
      await expect(dialogo).toBeVisible();
      await expect(dialogo.getByRole('button', { name: d.segura }), 'foco inicial en la opción segura').toBeFocused();
      const inicial = await indicador(page);
      expect(inicial.ok, `el foco inicial se ve (${inicial.motivo})`).toBe(true);
      await recorrer(page, `diálogo «${d.nombre}»`, 12);
      if (process.env.EVIDENCIA) {
        await page.getByRole('dialog').getByRole('button', { name: d.segura }).focus();
        await page.screenshot({ path: `docs/evidencia/capturas/L6g/dialogo-${d.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-')}-${teclado ? 'teclado' : 'raton'}-${info.project.name}.png` });
      }
    });
  }
}
