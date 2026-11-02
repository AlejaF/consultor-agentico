import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

/** L6f / FR-051: la cabecera se adapta sola (flex-wrap) con fuente base de 16 y de 20 px y con zoom de texto del 200 %. */
const ANCHOS = [320, 360];
const FUENTES = [
  { nombre: 'fuente base de 16 px', px: 16 },
  { nombre: 'fuente base de 20 px', px: 20 },
  { nombre: 'zoom de texto del 200 %', px: 32 },
];
const ROLES = [
  { boton: 'Consultor', valor: 'consultor' },
  { boton: 'Líder', valor: 'lider' },
  { boton: 'Empresa', valor: 'contacto' },
];

async function medir(page: Page) {
  return page.evaluate(() => {
    const cab = document.querySelector('header.topbar')!;
    const r = (el: Element) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
    const select = cab.querySelector<HTMLSelectElement>('select')!;
    const reset = cab.querySelector<HTMLButtonElement>('button.reset-demo')!;
    const inicio = [...cab.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Inicio')!;
    const label = cab.querySelector('label')!;
    const brand = cab.querySelector('.brand')!;
    const cs = getComputedStyle(select);
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const texto = select.selectedOptions[0].text;
    const interior = select.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 24;
    const resetTexto = [...reset.querySelectorAll<HTMLElement>('span')].filter((x) => getComputedStyle(x).display !== 'none').map((x) => x.textContent).join('').trim();
    const piezas = { brand: r(brand), inicio: r(inicio), label: r(label), select: r(select), reset: r(reset) };
    const cabRect = r(cab);
    return {
      texto,
      textoAncho: ctx.measureText(texto).width,
      interior,
      base: parseFloat(getComputedStyle(document.documentElement).fontSize),
      fuenteReset: parseFloat(getComputedStyle(reset).fontSize),
      resetTexto,
      desbordes: [cab, ...cab.querySelectorAll('*')].filter((e) => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1).map((e) => `${e.tagName}.${(e as HTMLElement).className}`),
      resetDesborda: reset.scrollWidth > reset.clientWidth + 1,
      labelDesborda: label.scrollWidth > label.clientWidth + 1,
      piezas,
      cab: cabRect,
      ancho: window.innerWidth,
      gutter: parseFloat(getComputedStyle(cab).paddingRight),
    };
  });
}

test.describe('L6f: encabezado que se adapta sola', () => {
  for (const rol of ROLES) {
    test(`${rol.boton}: sin recorte, sin solapes, 44 px y sin desplazamiento horizontal`, async ({ page }, info) => {
      test.skip(info.project.name !== '320', 'Recorre todos los anchos en una sola ejecución');
      await page.goto('/');
      await page.getByRole('button', { name: `Entrar como ${rol.boton}` }).click();
      await expect(page.locator('header.topbar select')).toHaveValue(rol.valor);
      for (const w of ANCHOS) {
        for (const f of FUENTES) {
          await page.setViewportSize({ width: w, height: 900 });
          await page.addStyleTag({ content: `html { font-size: ${f.px}px !important; }` });
          const m = await medir(page);
          const donde = `a ${w} px con ${f.nombre}`;
          expect(m.base, donde).toBe(f.px);
          expect(m.texto, donde).toBe(rol.boton);
          expect(m.textoAncho, `«${m.texto}» completo ${donde}`).toBeLessThanOrEqual(m.interior);
          expect(m.fuenteReset, `texto de «Restablecer» de al menos 14 px (escalado) ${donde}`).toBeGreaterThanOrEqual((14 * f.px) / 16 - 0.01);
          expect(m.desbordes, `elementos de la cabecera con contenido recortado ${donde}`).toEqual([]);
          expect(m.resetDesborda, `«Restablecer» recortado ${donde}`).toBe(false);
          expect(m.labelDesborda, `etiqueta recortada ${donde}`).toBe(false);
          const p = m.piezas;
          for (const [nombre, b] of Object.entries(p)) {
            expect(b.l, `${nombre} fuera por la izquierda ${donde}`).toBeGreaterThanOrEqual(-0.5);
            expect(b.r, `${nombre} fuera por la derecha ${donde}`).toBeLessThanOrEqual(m.ancho + 0.5);
          }
          // sin solapes entre piezas
          const nombres = Object.keys(p) as (keyof typeof p)[];
          for (let i = 0; i < nombres.length; i++) {
            for (let j = i + 1; j < nombres.length; j++) {
              const a = p[nombres[i]];
              const b = p[nombres[j]];
              const solapa = a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
              expect(solapa, `${nombres[i]} se solapa con ${nombres[j]} ${donde}`).toBe(false);
            }
          }
          // área táctil
          for (const nombre of ['inicio', 'select', 'reset'] as const) {
            expect(p[nombre].h, `alto de ${nombre} ${donde}`).toBeGreaterThanOrEqual(44);
            expect(p[nombre].w, `ancho de ${nombre} ${donde}`).toBeGreaterThanOrEqual(44);
          }
          // si «Restablecer» no cabe junto al selector, baja a una tercera fila, alineado a la derecha
          const mismaFila = p.reset.t < p.select.b - 1;
          if (mismaFila) {
            expect(p.reset.l - p.select.r, `separación selector–botón ${donde}`).toBeGreaterThanOrEqual(12 - 0.5);
          } else {
            expect(p.reset.t, `tercera fila ${donde}`).toBeGreaterThanOrEqual(p.select.b - 1);
            expect(m.ancho - m.gutter - p.reset.r, `alineado a la derecha ${donde}`).toBeLessThanOrEqual(2);
          }
          // Con zoom de texto del 200 % solo se exige a la cabecera (límite conocido: el puntaje «Calificada · N de 5» de la tarjeta de proyecto no se parte, FR-030/T105)
          if (f.px <= 20) await expectNoHorizontalScroll(page);
        }
      }
    });
  }

  test('a 320 px con fuente de 20 px «Restablecer» baja a la tercera fila y no se pierde nada', async ({ page }, info) => {
    test.skip(info.project.name !== '320', 'Solo a 320 px');
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await page.addStyleTag({ content: 'html { font-size: 20px !important; }' });
    const m = await medir(page);
    expect(m.piezas.reset.t, 'con fuente de 20 px a 320 px «Restablecer» queda debajo del selector').toBeGreaterThanOrEqual(m.piezas.select.b - 1);
    await expectNoAxeViolations(page);
  });
});
