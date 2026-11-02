import { expect, test, type Page } from '@playwright/test';
import { inflateSync } from 'node:zlib';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

/** L5a / T069: informe imprimible (FR-044 a FR-048, SC-014, SC-015). */
async function entrar(page: Page, rol: 'Consultor' | 'Líder') {
  await page.goto('/');
  await page.getByRole('button', { name: `Entrar como ${rol}` }).click();
}

const MEDIDAS = {
  carta: { format: 'Letter' as const, w: 612, h: 792, px: { width: 816, height: 1056 } },
  a4: { format: 'A4' as const, w: 595.28, h: 841.89, px: { width: 794, height: 1123 } },
};

function paginas(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}
/** Texto dibujado por página: contenido de cada flujo de página, inflado (los glifos quedan como índices de la fuente). */
function flujosDeTexto(pdf: Buffer): string[] {
  const bin = pdf.toString('latin1');
  const out: string[] = [];
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(bin))) {
    const ini = m.index + m[0].length;
    try {
      const t = inflateSync(pdf.subarray(ini, bin.indexOf('endstream', ini))).toString('latin1');
      if (/BT/.test(t) && /Tj/.test(t)) out.push(t);
    } catch {
      /* flujo que no es de contenido */
    }
  }
  return out;
}
const glifos = (flujo: string, n = Infinity) => ' ' + [...flujo.matchAll(/<([0-9a-f]+)>\s*Tj/g)].slice(0, n).map((x) => x[1]).join(' ') + ' ';

function tamano(pdf: Buffer): [number, number] {
  const m = pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
  return [parseFloat(m![1]), parseFloat(m![2])];
}

test.describe('Informe del Consultor (P-B, diagnóstico emitido)', () => {
  test('en pantalla muestra el informe; en impresión, rótulos legibles y sin navegación ni controles', async ({ page }) => {
    await entrar(page, 'Consultor');
    await page.goto('/#/consultor/proyectos/P-B/informe');
    await expect(page.getByRole('heading', { level: 1, name: 'Informe imprimible' })).toBeVisible();
    await expect(page.getByTestId('print-report')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Imprimir o guardar como PDF' })).toBeVisible();
    // impresión
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByTestId('print-banner')).toBeVisible();
    await expect(page.getByTestId('print-banner')).toHaveText('DEMO · datos ficticios');
    for (const oculto of [page.locator('header.topbar'), page.locator('.sidebar'), page.getByTestId('demo-banner'), page.getByRole('button', { name: 'Imprimir o guardar como PDF' }), page.locator('.skip-link')]) {
      await expect(oculto).toBeHidden();
    }
    const informe = page.getByTestId('print-report');
    await expect(informe.getByText('Simulada').first()).toBeVisible();
    await expect(informe.getByText('NO VERIFICADO').first()).toBeVisible();
    await expect(informe.getByTestId('report-excluded')).toHaveText('1 hallazgo excluido por el Consultor (no se muestra)');
    await expect(informe.getByText('Estrategia aún no disponible')).toBeVisible();
    // blanco y negro: los rótulos llevan texto y borde
    const borde = await informe.locator('.badge-unverified').first().evaluate((e) => parseFloat(getComputedStyle(e).borderTopWidth));
    expect(borde).toBeGreaterThanOrEqual(1);
    // sin calificaciones del Líder
    await expect(informe).not.toContainText(/Meta del programa|Calificad|Promedio|Rúbrica/i);
    // tamaño de texto legible (≥ 11 pt = 14,6 px)
    const fuente = await informe.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(fuente).toBeGreaterThanOrEqual(14.6);
  });

  for (const [nombre, m] of Object.entries(MEDIDAS)) {
    test(`vista de impresión en ${nombre}: sin texto cortado y PDF del tamaño correcto`, async ({ page }, info) => {
      await entrar(page, 'Consultor');
      await page.goto('/#/consultor/proyectos/P-B/informe');
      await page.getByTestId('print-report').waitFor();
      await page.setViewportSize(m.px);
      await page.emulateMedia({ media: 'print' });
      await expectNoHorizontalScroll(page);
      const fuera = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        return [...document.querySelectorAll('[data-testid=print-report] *')].filter((e) => e.getBoundingClientRect().right > W + 1).length;
      });
      expect(fuera, 'elementos del informe más allá del borde derecho').toBe(0);
      const pdf = await page.pdf({ format: m.format, printBackground: true });
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      const [w, h] = tamano(pdf);
      expect(Math.abs(w - m.w)).toBeLessThan(1);
      expect(Math.abs(h - m.h)).toBeLessThan(1);
      expect(paginas(pdf)).toBeGreaterThanOrEqual(1);
      void info;
    });
  }

  test('con estrategia generada incluye la estrategia y el PDF ocupa más de una página', async ({ page }) => {
    await entrar(page, 'Consultor');
    await page.goto('/#/consultor/proyectos/P-B/estrategia');
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    await page.getByRole('heading', { level: 2, name: 'Riesgos' }).waitFor();
    await page.getByRole('link', { name: 'Ver informe imprimible' }).click(); // 1 interacción desde la estrategia
    await expect(page).toHaveURL(/\/informe$/);
    await expect(page.getByTestId('print-report').getByRole('heading', { name: 'Riesgos' })).toBeVisible();
    await expect(page.getByTestId('print-report').getByText('Estrategia aún no disponible')).toHaveCount(0);
    await page.emulateMedia({ media: 'print' });
    expect(paginas(await page.pdf({ format: 'Letter' }))).toBeGreaterThan(1);
  });

  test('SC-015: desde el diagnóstico emitido se abre el informe en una interacción', async ({ page }) => {
    await entrar(page, 'Consultor');
    await page.goto('/#/consultor/proyectos/P-B/diagnostico');
    await page.getByRole('link', { name: 'Ver informe imprimible' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Informe imprimible' })).toBeVisible();
  });

  test('con el diagnóstico sin emitir, el informe está bloqueado y lo explica', async ({ page }) => {
    await entrar(page, 'Consultor');
    await page.goto('/#/consultor/proyectos/P-A/informe');
    await expect(page.getByRole('heading', { level: 1, name: 'Informe imprimible' })).toBeVisible();
    await expect(page.getByText('El informe se genera a partir de un diagnóstico emitido')).toBeVisible();
    await expect(page.getByTestId('print-report')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Imprimir o guardar como PDF' })).toHaveCount(0);
    await page.goto('/#/consultor/proyectos/P-A/diagnostico');
    await expect(page.getByRole('link', { name: 'Ver informe imprimible' })).toHaveCount(0);
  });

  test('solo teclado: se llega al enlace, se abre y el botón de imprimir se activa', async ({ page }) => {
    await entrar(page, 'Consultor');
    await page.goto('/#/consultor/proyectos/P-B/diagnostico');
    await page.getByRole('link', { name: 'Ver informe imprimible' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Informe imprimible' })).toBeVisible();
    await page.evaluate(() => { (window as unknown as { __imprimir: number }).__imprimir = 0; window.print = () => { (window as unknown as { __imprimir: number }).__imprimir++; }; });
    await page.getByRole('button', { name: 'Imprimir o guardar como PDF' }).focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => (window as unknown as { __imprimir: number }).__imprimir)).toBe(1);
  });

  test('axe sin violaciones en pantalla', async ({ page }) => {
    await entrar(page, 'Consultor');
    await page.goto('/#/consultor/proyectos/P-B/informe');
    await page.getByTestId('print-report').waitFor();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });
});

test.describe('Informe del Líder sobre una entrega', () => {
  test('entrega de diagnóstico: solo el diagnóstico y sin calificaciones; se abre en una interacción', async ({ page }) => {
    await entrar(page, 'Líder');
    await page.goto('/#/lider/entregas/dx/P-B');
    await page.getByRole('link', { name: 'Ver informe imprimible' }).click();
    const informe = page.getByTestId('print-report');
    await expect(informe).toBeVisible();
    await expect(informe.getByRole('heading', { name: 'Riesgos' })).toHaveCount(0);
    await expect(informe.getByText('Estrategia aún no disponible')).toHaveCount(0);
    await expect(informe).not.toContainText(/Meta del programa|Calificad|Promedio|Rúbrica/i);
    await expectNoAxeViolations(page);
  });

  test('entrega de estrategia enviada (ya calificada): estrategia con su diagnóstico, sin la calificación', async ({ page }) => {
    await entrar(page, 'Líder');
    await page.goto('/#/lider/entregas/st/P-C');
    await page.getByRole('link', { name: 'Ver informe imprimible' }).click();
    const informe = page.getByTestId('print-report');
    await expect(informe.getByRole('heading', { name: 'Riesgos' })).toBeVisible();
    await expect(informe.getByRole('heading', { name: 'Pilar: Estrategia' })).toBeVisible();
    await expect(informe).not.toContainText(/Meta del programa|Calificad|Promedio|Rúbrica|comentario/i);
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByTestId('print-banner')).toBeVisible();
    const pdf = await page.pdf({ format: 'A4' });
    expect(paginas(pdf)).toBeGreaterThan(1);
    // SC-014: el aviso «DEMO · datos ficticios» (thead repetido) está en TODAS las páginas. Las páginas 2 en adelante empiezan por el aviso;
    // su firma (los primeros glifos dibujados) debe aparecer en cada página.
    const flujos = flujosDeTexto(pdf);
    expect(flujos.length, 'una página de texto por página del PDF').toBe(paginas(pdf));
    const firma = glifos(flujos[flujos.length - 1], 6).trimEnd() + ' ';
    for (const [i, f] of flujos.entries()) expect(glifos(f).includes(firma), `el aviso aparece en la página ${i + 1}`).toBe(true);
  });
});
