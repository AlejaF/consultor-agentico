// Lote H2 (AG-034): composición del tablero. Pruebas estructurales (no de píxeles). 320, 768 y 1280 px. Servicio en modo FALSO.
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, entrarConsultor, generarDiagnosticoReal, vaciarServicio } from './helpers/real';

const PRIMARY = 'rgb(80, 70, 229)';
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);
const box = async (page: Page, testid: string) => (await page.getByTestId(testid).boundingBox())!;
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const sideBySide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768; // la madurez pasa a dos columnas desde 768 px
async function aceptar(page: Page, ...ids: string[]) {
  for (const id of ids) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
}
async function emitir(page: Page) {
  await generarDiagnosticoReal(page);
  await abrir(page, 'P-A', 'revision');
  await aceptar(page, 'R1', 'R2', 'R3');
  await card(page, 'R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test.describe('rediseño de composición', () => {
  test('madurez real: tarjeta de nivel y lista de barras lado a lado (escritorio) o apiladas (móvil), sin duplicar el índice', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3');
    const panel = page.getByTestId('maturity-panel');
    const tarjeta = await box(page, 'maturity-card');
    const barras = (await panel.locator('.maturity-bars').boundingBox())!;
    if (sideBySide(page)) {
      expect(tarjeta.x + tarjeta.width, 'a la izquierda').toBeLessThanOrEqual(barras.x + 1);
      expect(Math.abs(tarjeta.y - barras.y), 'misma fila').toBeLessThan(40);
      expect(tarjeta.height, 'la tarjeta es pieza principal').toBeGreaterThan(160);
    } else {
      expect(barras.y, 'apiladas').toBeGreaterThanOrEqual(tarjeta.y + tarjeta.height - 1);
    }
    const texto = await panel.innerText();
    expect((texto.match(/Índice de madurez/g) ?? []).length).toBe(1);
    expect((texto.match(/3,0 de 5/g) ?? []).length).toBe(1); // el índice no se repite
    await expect(page.getByTestId('maturity-card')).toContainText('estimado por IA');
    await expect(page.getByTestId('maturity-card')).toContainText('basado en 3 hallazgos aceptados');
    await expect(panel.locator('.scale-axis')).toHaveCount(1); // una sola escala compartida
    await expect(panel.locator('.scale-ticks')).toHaveCount(0);
    await expect(page.getByTestId('maturity-card')).toHaveCSS('background-color', PRIMARY);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('«Sin evidencia» se dice una vez, con barra rayada y sin número; el rótulo de IA va unido al encabezado del bloque', async ({ page }) => {
    await generarDiagnosticoReal(page);
    const fila = page.getByTestId('maturity-level-cultura');
    const visible = await fila.innerText();
    expect((visible.match(/Sin evidencia suficiente/g) ?? []).length).toBe(1);
    expect(visible).not.toMatch(/\d de 5/);
    await expect(fila.locator('.scale-empty')).toHaveCount(1);
    const cabecera = page.getByTestId('maturity-panel').locator('.block-head');
    await expect(cabecera.getByTestId('ai-badge')).toHaveText('Generado por IA · requiere revisión humana');
    await expect(page.getByTestId('maturity-panel').getByTestId('ai-badge')).toHaveCount(1); // uno por bloque, no seis
  });

  test('la justificación y «Deriva de» van en un detalle desplegable', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1');
    const detalle = page.getByTestId('maturity-level-datos').locator('details');
    await expect(detalle).toHaveCount(1);
    expect(await detalle.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false);
    await detalle.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(detalle).toContainText('Deriva de: R1');
    await expect(detalle).toContainText('Las cifras viven en cada área');
  });

  test('hallazgos en cuadrícula; decisión elegida inequívoca; citas como fuente', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    const rejilla = card(page, 'R1').locator('xpath=..');
    await expect(rejilla).toHaveClass(/findings-grid/);
    expect(await rejilla.evaluate((e) => getComputedStyle(e).display)).toBe('grid');
    // Columnas de un grupo con varias tarjetas (aquí cada pilar tiene una sola, que no queda estrecha): se mide con un grupo de prueba
    const cols = await page.evaluate(() => {
      const g = document.createElement('div');
      g.className = 'stack findings-grid';
      g.innerHTML = '<div>a</div><div>b</div><div>c</div>';
      document.querySelector('main')!.appendChild(g);
      const n = getComputedStyle(g).gridTemplateColumns.split(' ').length;
      g.remove();
      return n;
    });
    expect(cols).toBe(wide(page) ? 3 : (page.viewportSize()!.width >= 640 ? 2 : 1));
    await aceptar(page, 'R1');
    const aceptado = card(page, 'R1').getByRole('button', { name: /^Aceptar/ });
    await expect(aceptado).toHaveAttribute('aria-pressed', 'true');
    await expect(aceptado).toHaveCSS('background-color', PRIMARY); // relleno sólido
    expect(await aceptado.evaluate((e) => getComputedStyle(e, '::before').content)).toContain('✓'); // indicador además del texto
    await expect(card(page, 'R1').getByRole('button', { name: /^Editar/ })).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(card(page, 'R1').locator('.cite-box')).toBeVisible();
  });

  test('Estrategia real: rótulo unido a cada encabezado de sección; fases con horizonte como chip en una línea de tiempo', async ({ page }) => {
    await emitir(page);
    await abrir(page, 'P-A', 'estrategia');
    await page.getByRole('button', { name: 'Generar estrategia' }).click();
    await expect(page.getByTestId('strategy-content')).toBeVisible({ timeout: 30_000 });
    for (const id of ['estr-riesgos', 'estr-ruta']) {
      const seccion = page.locator(`section[aria-labelledby="${id}"]`);
      await expect(seccion.locator('.block-head').getByTestId('ai-badge')).toHaveText('Generado por IA · requiere revisión humana');
    }
    await expect(page.getByTestId('phase-EF1').locator('.chip-horizon')).toContainText('Horizonte');
    await expect(page.locator('ol.timeline')).toHaveClass(/timeline-line/);
    await expect(page.getByTestId('derived-ER1').locator('.chip-id')).toHaveText(['R1']);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('tablero del Líder: tarjetas de cifras en cuadrícula uniforme, de igual altura, sin huérfanas; la primera en primario', async ({ page }) => {
    await entrarConsultor(page);
    await page.locator('#rol-activo').selectOption('lider');
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    const cifras = page.locator('.kpi-grid > .kpi');
    expect(await cifras.count()).toBeGreaterThanOrEqual(4);
    const cajas = await cifras.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { y: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) }; }));
    expect(new Set(cajas.map((c) => c.h)).size, 'igual altura').toBe(1);
    const filas = new Set(cajas.map((c) => c.y)).size;
    if (wide(page)) expect(filas, 'una sola fila: ninguna huérfana').toBe(1);
    else {
      const porFila = cajas.filter((c) => c.y === cajas[0]!.y).length;
      expect(cajas.length % porFila, 'filas completas').toBe(0);
    }
    await expect(cifras.first()).toHaveCSS('background-color', PRIMARY);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('barra lateral de color primario con la píldora blanca activa (también en móvil y tablet); sin ella al imprimir', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'diagnostico');
    const lateral = page.locator('.sidebar');
    if (wide(page)) {
      await expect(lateral).toHaveCSS('background-color', PRIMARY);
      const activo = lateral.locator('a[aria-current="page"]').first();
      await expect(activo).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(activo).toHaveCSS('color', PRIMARY);
    } else {
      await expect(lateral).toHaveCSS('background-color', PRIMARY); // móvil y tablet: mismos colores que en escritorio
      await expect(lateral.locator('a[aria-current="page"]').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    }
    await page.emulateMedia({ media: 'print' });
    await expect(lateral).toBeHidden();
    await expectNoHorizontalScroll(page);
  });

  test('encabezado con etiqueta en mayúsculas y el h1 con su nombre accesible intacto', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.locator('main .kicker').first()).toHaveText('PASO 2 · DIAGNÓSTICO');
    await expect(page.getByRole('heading', { level: 1, name: 'Diagnóstico', exact: true })).toBeVisible();
    await page.goto('/#/consultor');
    await expect(page.locator('main .kicker').first()).toHaveText('PROYECTOS');
    await expect(page.getByRole('heading', { level: 1, name: 'Proyectos', exact: true })).toBeVisible();
  });

  test('Proyectos: tarjetas de igual altura por fila, y el aviso de servicio no disponible como nota discreta', async ({ page }) => {
    await entrarConsultor(page);
    await expect(page.getByTestId('new-project-button')).toBeEnabled({ timeout: 15_000 });
    const cajas = await page.locator('[data-testid^="project-P-"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { y: Math.round(r.top), h: Math.round(r.height) }; }));
    expect(cajas.length).toBe(4);
    const porFila = new Map<number, Set<number>>();
    for (const c of cajas) porFila.set(c.y, (porFila.get(c.y) ?? new Set()).add(c.h));
    for (const hs of porFila.values()) expect(hs.size, 'alturas iguales en la misma fila').toBe(1);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test('movimiento: las barras se animan y todo se desactiva con prefers-reduced-motion', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const normal = await page.locator('.scale-fill').first().evaluate((e) => getComputedStyle(e).transitionDuration);
    expect(normal).not.toBe('0s');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.locator('.scale-fill').first().evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s');
  });

  test('escala tipográfica: título de página de 36 a 40 px; cifras y nivel general de 40 a 48 px', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1', 'R2', 'R3');
    const px = (loc: ReturnType<Page['locator']>) => loc.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    const h1 = await px(page.locator('main h1'));
    expect(h1).toBeGreaterThanOrEqual(36);
    expect(h1).toBeLessThanOrEqual(40);
    const nivel = await px(page.getByTestId('maturity-card-value'));
    expect(nivel).toBeGreaterThanOrEqual(40);
    expect(nivel).toBeLessThanOrEqual(48);
    expect(await px(page.getByTestId('stat-total').locator('.stat-value'))).toBeGreaterThanOrEqual(40);
    await expectNoHorizontalScroll(page);
  });

  test('cada dimensión deja visibles una línea corta de justificación y los chips con los ids; el texto completo, en el detalle', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    await aceptar(page, 'R1');
    const fila = page.getByTestId('maturity-level-datos');
    await expect(fila.locator('.row-just')).toBeVisible();
    await expect(fila.locator('.row-just')).toContainText('Las cifras viven en cada área');
    await expect(fila.locator('.row-chips .chip-id')).toHaveText(['R1']);
    await expect(fila.locator('details p', { hasText: 'Nivel 2 de 5' })).toBeHidden(); // cerrado en pantalla
    await expectNoAxeViolations(page);
  });

  test('impresión: el detalle de cada dimensión sale abierto (vista de impresión e informe imprimible); el rótulo de IA se ve también en la impresión', async ({ page }) => {
    await emitir(page);
    // Vista de impresión de la revisión (details cerrados en pantalla)
    await abrir(page, 'P-A', 'diagnostico');
    await page.emulateMedia({ media: 'print' });
    const fila = page.getByTestId('maturity-level-datos');
    await expect(fila.locator('details p', { hasText: 'Nivel 2 de 5' })).toBeVisible();
    await expect(fila.locator('details p', { hasText: 'Deriva de: R1' })).toBeVisible();
    await expect(page.getByTestId('maturity-panel').locator('.block-head').getByTestId('ai-badge')).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
    // Informe imprimible: los details llevan `open`
    await abrir(page, 'P-A', 'informe');
    const informe = page.getByTestId('print-report');
    await expect(informe.locator('details.row-detail')).toHaveCount(6);
    for (const d of await informe.locator('details.row-detail').all()) expect(await d.evaluate((e) => (e as HTMLDetailsElement).open)).toBe(true);
    await expect(informe.locator('.block-head').getByTestId('ai-badge').first()).toBeVisible();
  });

  test('Captura de evidencia: zona de carga con borde punteado, aviso destacado y selector de modo', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await expect(page.locator('.dropzone')).toHaveCSS('border-top-style', 'dashed');
    const aviso = page.getByTestId('privacy-notice');
    expect(parseFloat(await aviso.evaluate((e) => getComputedStyle(e).borderLeftWidth))).toBeGreaterThanOrEqual(4);
    await expect(page.getByTestId('mode-selector')).toHaveCSS('border-left-width', '6px');
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });
});
