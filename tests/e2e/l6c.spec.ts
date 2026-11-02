import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll } from './helpers/axe';

type Role = 'Consultor' | 'Líder' | 'Empresa';
const ROLES: { boton: Role; valor: string; texto: string }[] = [
  { boton: 'Consultor', valor: 'consultor', texto: 'Consultor' },
  { boton: 'Líder', valor: 'lider', texto: 'Líder' },
  { boton: 'Empresa', valor: 'contacto', texto: 'Empresa' },
];
/** Anchos por tramos de la cabecera: menos de 768 px → 2 filas; desde 768 px → 1 fila. */
const ANCHOS = [320, 360, 399, 400, 520, 600, 767, 768, 1024, 1280];
const filasEsperadas = (w: number) => (w < 768 ? 2 : 1);
const etiquetaVisibleEsperada = (w: number) => (w < 768 ? 'Restablecer' : 'Restablecer demo');

/** Mide el texto del rol seleccionado frente al espacio interior del selector, la etiqueta, los controles y las filas. */
async function medidas(page: Page) {
  return page.evaluate(() => {
    const cab = document.querySelector('header.topbar')!;
    const select = cab.querySelector<HTMLSelectElement>('select')!;
    const cs = getComputedStyle(select);
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const texto = select.selectedOptions[0].text;
    const flecha = 24; // espacio que el navegador reserva para la flecha del selector
    const interior = select.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - flecha;
    const rect = (el: Element) => el.getBoundingClientRect();
    const lab = cab.querySelector('label')!;
    const labCs = getComputedStyle(lab);
    const inicio = [...cab.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Inicio')!;
    const reset = cab.querySelector('button.reset-demo')!;
    const items = [...cab.children].filter((c) => (c as HTMLElement).offsetParent !== null);
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
      dentroDeLaPantalla: rect(select).left >= 0 && rect(select).right <= window.innerWidth && rect(reset).right <= window.innerWidth,
      fuente: parseFloat(cs.fontSize),
      etiquetaVisible: labCs.display !== 'none' && labCs.visibility !== 'hidden' && rect(lab).height > 0 && (lab.textContent ?? '').trim() === 'Rol activo',
      inicio: { w: rect(inicio).width, h: rect(inicio).height },
      reset: {
        w: rect(reset).width,
        h: rect(reset).height,
        texto: [...reset.querySelectorAll<HTMLElement>('span')].filter((x) => getComputedStyle(x).display !== 'none').map((x) => x.textContent).join('').trim(),
        nombre: reset.getAttribute('aria-label') ?? reset.textContent?.trim(),
        separacion: rect(reset).left - rect(select).right,
        aLaDerecha: rect(reset).left >= rect(select).right,
        fondo: getComputedStyle(reset).backgroundColor,
        borde: parseFloat(getComputedStyle(reset).borderTopWidth),
        contraste: (() => {
          const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
          const lum = (c: number[]) => { const [r, g, b] = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          const a = lum(rgb(getComputedStyle(reset).color));
          const b = lum(rgb(getComputedStyle(cab).backgroundColor));
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        })(),
      },
      filas,
    };
  });
}

test.describe('L6c/L6e: el rol activo se ve completo y la cabecera se acomoda por tramos de ancho', () => {
  for (const rol of ROLES) {
    test(`${rol.texto}: texto sin recorte, controles de 44 px y filas según el ancho`, async ({ page }, info) => {
      test.skip(info.project.name !== '320', 'Recorre todos los anchos en una sola ejecución');
      await page.goto('/');
      await page.getByRole('button', { name: `Entrar como ${rol.boton}` }).click();
      await expect(page.locator('header.topbar select')).toHaveValue(rol.valor);
      for (const w of ANCHOS) {
        await page.setViewportSize({ width: w, height: 800 });
        const m = await medidas(page);
        const donde = `a ${w} px`;
        expect(m.texto, donde).toBe(rol.texto);
        expect(m.ancho, `«${m.texto}» no cabe entero ${donde} (texto ${m.ancho.toFixed(0)} px, espacio ${m.interior.toFixed(0)} px)`).toBeLessThanOrEqual(m.interior);
        expect(m.dentroDeLaPantalla, `controles fuera de la pantalla ${donde}`).toBe(true);
        expect(m.fuente, `texto legible ${donde}`).toBeGreaterThanOrEqual(14);
        expect(m.etiquetaVisible, `etiqueta «Rol activo» visible ${donde}`).toBe(true);
        expect(m.inicio.h, `«Inicio» ${donde}`).toBeGreaterThanOrEqual(44);
        expect(m.inicio.w).toBeGreaterThanOrEqual(44);
        expect(m.reset.h, `«Restablecer demo» ${donde}`).toBeGreaterThanOrEqual(44);
        expect(m.reset.w).toBeGreaterThanOrEqual(44);
        expect(m.reset.texto, `etiqueta visible ${donde}`).toBe(etiquetaVisibleEsperada(w));
        expect(m.reset.nombre, `nombre accesible ${donde}`).toBe('Restablecer demo');
        expect(m.reset.nombre!.toLowerCase(), 'la etiqueta visible está contenida en el nombre accesible').toContain(m.reset.texto.toLowerCase());
        expect(m.reset.aLaDerecha, `«Restablecer» a la derecha del selector ${donde}`).toBe(true);
        expect(m.reset.separacion, `separación selector–botón ${donde}`).toBeGreaterThanOrEqual(12);
        expect(m.reset.fondo, `estilo secundario (sin relleno) ${donde}`).toBe('rgba(0, 0, 0, 0)');
        expect(m.reset.borde, `borde fino ${donde}`).toBeGreaterThanOrEqual(1);
        expect(m.reset.borde).toBeLessThanOrEqual(2);
        expect(m.reset.contraste, `contraste ${donde}`).toBeGreaterThanOrEqual(4.5);
        expect(m.filas, `filas de la cabecera ${donde}`).toBe(filasEsperadas(w));
        await expectNoHorizontalScroll(page);
      }
    });
  }

  test('el orden de Tab es el visual: Inicio, selector de rol, Restablecer demo', async ({ page }, info) => {
    test.skip(info.project.name !== '320', 'Recorre varios anchos en una sola ejecución');
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await page.getByRole('heading', { level: 1, name: 'Proyectos' }).waitFor();
    for (const w of [320, 500, 1280]) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.locator('body').click({ position: { x: 1, y: 400 } }).catch(() => undefined);
      await page.evaluate(() => window.scrollTo(0, 0));
      const orden: string[] = [];
      // arranca antes del primer elemento de la cabecera: enfocar el enlace «Saltar al contenido» y avanzar
      await page.locator('a.skip-link').focus();
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
        orden.push(await page.evaluate(() => { const a = document.activeElement!; return a.closest('header') ? (a.matches('select') ? 'selector' : (a.textContent ?? '').trim()) : `fuera:${(a.textContent ?? '').trim().slice(0, 20)}`; }));
      }
      expect(orden, `orden de Tab a ${w} px`).toEqual(['Inicio', 'selector', 'Restablecer demo']);
    }
  });

  test('cambiar de rol sigue funcionando y el texto del nuevo rol se ve completo (320 px)', async ({ page }, info) => {
    test.skip(info.project.name !== '320', 'Solo a 320 px');
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await page.getByLabel('Rol activo').selectOption('contacto');
    await expect(page).toHaveURL(/#\/contacto$/);
    const m = await medidas(page);
    expect(m.texto).toBe('Empresa');
    expect(m.ancho).toBeLessThanOrEqual(m.interior);
  });
});
