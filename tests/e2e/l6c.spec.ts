import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll } from './helpers/axe';

type Role = 'Consultor' | 'Líder' | 'Contacto';
const ROLES: { boton: Role; valor: string; texto: string }[] = [
  { boton: 'Consultor', valor: 'consultor', texto: 'Consultor' },
  { boton: 'Líder', valor: 'lider', texto: 'Líder' },
  { boton: 'Contacto', valor: 'contacto', texto: 'Contacto de la empresa' },
];
const ANCHOS = [320, 360, 768];

/** Mide si el texto del rol seleccionado cabe entero dentro del selector (sin recorte) y es legible. */
async function medidas(page: Page) {
  return page.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>('header.topbar select')!;
    const cs = getComputedStyle(select);
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const texto = select.selectedOptions[0].text;
    const flecha = 24; // espacio que el navegador reserva para la flecha del selector
    const interior = select.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - flecha;
    const caja = select.getBoundingClientRect();
    const lab = document.querySelector('header.topbar label')!;
    const labCs = getComputedStyle(lab);
    const rect = (el: Element) => el.getBoundingClientRect();
    const inicio = [...document.querySelectorAll('header.topbar a')].find((a) => a.textContent?.trim() === 'Inicio')!;
    const reset = document.querySelector('header.topbar button.reset-demo')!;
    const items = [...document.querySelector('header.topbar')!.children].filter((c) => (c as HTMLElement).offsetParent !== null);
    const rects = items.map((c) => c.getBoundingClientRect()).sort((a, b) => a.top - b.top);
    let filas = 0;
    let hasta = -Infinity;
    for (const r of rects) {
      if (r.top >= hasta - 1) filas++;
      hasta = Math.max(hasta, r.bottom);
    }
    return {
      texto,
      ancho: ctx.measureText(texto).width,
      interior,
      dentroDeLaPantalla: caja.left >= 0 && caja.right <= window.innerWidth,
      fuente: parseFloat(cs.fontSize),
      etiquetaVisible: labCs.display !== 'none' && labCs.visibility !== 'hidden' && rect(lab).height > 0 && (lab.textContent ?? '').trim() === 'Rol activo',
      inicio: { w: rect(inicio).width, h: rect(inicio).height },
      reset: { w: rect(reset).width, h: rect(reset).height },
      filas,
    };
  });
}

test.describe('L6c: el rol activo se ve completo en el encabezado', () => {
  for (const rol of ROLES) {
    test(`${rol.texto}: el texto cabe sin recorte a 320, 360 y 768 px; «Inicio» y «Restablecer» de 44 px; etiqueta visible`, async ({ page }, info) => {
      test.skip(info.project.name !== '320', 'Recorre los tres anchos en una sola ejecución');
      await page.goto('/');
      await page.getByRole('button', { name: `Entrar como ${rol.boton}` }).click();
      await expect(page.locator('header.topbar select')).toHaveValue(rol.valor);
      for (const w of ANCHOS) {
        await page.setViewportSize({ width: w, height: 800 });
        const m = await medidas(page);
        const donde = `a ${w} px`;
        expect(m.texto, donde).toBe(rol.texto);
        expect(m.ancho, `«${m.texto}» no cabe entero ${donde} (texto ${m.ancho.toFixed(0)} px, espacio ${m.interior.toFixed(0)} px)`).toBeLessThanOrEqual(m.interior);
        expect(m.dentroDeLaPantalla, `selector fuera de la pantalla ${donde}`).toBe(true);
        expect(m.fuente, `texto legible ${donde}`).toBeGreaterThanOrEqual(14);
        expect(m.etiquetaVisible, `etiqueta «Rol activo» visible ${donde}`).toBe(true);
        expect(m.inicio.h, `«Inicio» ${donde}`).toBeGreaterThanOrEqual(44);
        expect(m.inicio.w).toBeGreaterThanOrEqual(44);
        expect(m.reset.h, `«Restablecer» ${donde}`).toBeGreaterThanOrEqual(44);
        expect(m.reset.w).toBeGreaterThanOrEqual(44);
        expect(m.filas, `filas de la cabecera ${donde}`).toBeLessThanOrEqual(3);
        await expectNoHorizontalScroll(page);
      }
    });
  }

  test('cambiar de rol sigue funcionando con el selector a todo el ancho (320 px)', async ({ page }, info) => {
    test.skip(info.project.name !== '320', 'Solo a 320 px');
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await page.getByLabel('Rol activo').selectOption('contacto');
    await expect(page).toHaveURL(/#\/contacto$/);
    expect((await medidas(page)).texto).toBe('Contacto de la empresa');
  });
});
