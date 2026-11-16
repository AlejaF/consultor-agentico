// Lote H4b (AG-036): Resumen de Estrategia y del Tablero (Líder) y pulidos del Resumen de Diagnóstico.
// Corre con playwright.h4.config.ts (vista por defecto de PRODUCCIÓN: «resumen»), con el servicio en modo FALSO (sin red, sin clave, sin gasto).
// Archivo NUEVO: no edita ni reutiliza aserciones de las suites existentes.
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, elegirIAReal, entrarConsultor, ruta, SEIS_FORMATOS, HOSTILES, subir, vaciarServicio } from './helpers/real';

const EST = '#/consultor/proyectos/P-C/estrategia'; // P-C (simulado) trae una estrategia enviada con 4 riesgos y 4 fases
const EST_A = '#/consultor/proyectos/P-A/estrategia';
const MODELO = 'modelo-falso-e2e';
const TECNICO = ['trace-view', 'trace-model', 'trace-tokens', 'trace-errors', 'tech-sheet', 'chart-trace-summary', 'Ver cómo trabajó el agente', 'Traza del agente', 'Ficha técnica', 'partial-notice', 'review-warning', MODELO];
const hash = (page: Page) => page.evaluate(() => window.location.hash);
const ir = (page: Page, h: string) => page.evaluate((x) => (window.location.hash = x), h);
const resize = async (page: Page, w: number, h = w >= 1024 ? 900 : 800) => {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(150);
};
const rol = async (page: Page, r: 'consultor' | 'lider' | 'contacto') => page.locator('#rol-activo').selectOption(r);
const idsDuplicados = (page: Page) =>
  page.evaluate(() => {
    const vistos = new Map<string, number>();
    for (const e of document.querySelectorAll('[id]')) vistos.set(e.id, (vistos.get(e.id) ?? 0) + 1);
    return [...vistos].filter(([, n]) => n > 1).map(([id]) => id);
  });
const chicos = (page: Page) =>
  page.locator('main a, main button, main summary').evaluateAll((l) =>
    l.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 43.5 || r.width < 43.5) && !e.closest('.visually-hidden') && getComputedStyle(e).display !== 'inline'; }).map((e) => `${e.tagName}:${(e.textContent ?? '').trim().slice(0, 30)}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`),
  );
const bloques = (page: Page, raiz: string) =>
  page.evaluate((r) => {
    const q = (k: string) => document.querySelectorAll(`[data-testid="${r}"] [data-resumen="${k}"]`).length;
    return { alto: document.documentElement.scrollHeight, principal: q('principal'), visual: q('visual'), lista: q('lista') };
  }, raiz);

/** Genera el diagnóstico real de P-A. Con la vista Resumen por defecto se espera el propio Resumen (no hay tarjetas de hallazgos). */
async function emitirDiagnostico(page: Page) {
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await elegirIAReal(page);
  await subir(page, ruta([...SEIS_FORMATOS, ...HOSTILES]));
  await abrir(page, 'P-A', 'diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible({ timeout: 30_000 });
}
/** Emite el diagnóstico real de P-A (acepta R1 a R3, rechaza R4). */
async function emitirReal(page: Page) {
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByTestId('finding-R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

/** Genera el diagnóstico real de P-A, lo emite y genera la estrategia real. Termina en el Resumen de Estrategia. */
async function estrategiaReal(page: Page) {
  await emitirDiagnostico(page);
  await emitirReal(page);
  await page.waitForTimeout(1000);
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await expect(page.getByTestId('estrategia-resumen')).toBeVisible({ timeout: 30_000 });
}

test.describe('Estrategia · Resumen', () => {
  test('por defecto abre el Resumen: 2 cifras, «Riesgos por nivel», ruta por horizonte y botones; el Detalle no está montado', async ({ page }) => {
    await entrarConsultor(page);
    await ir(page, EST);
    await expect(page.getByTestId('estrategia-resumen')).toBeVisible();
    expect(await hash(page)).toBe(EST); // la ruta base no cambia
    const control = page.getByRole('navigation', { name: 'Vista de la pantalla' });
    await expect(control.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('resumen-cifra-riesgos')).toContainText('4');
    await expect(page.getByTestId('resumen-cifra-fases')).toContainText('4');
    await expect(page.locator('[data-testid^="resumen-cifra-"]')).toHaveCount(2);
    const riesgos = page.getByTestId('chart-risk-levels');
    await expect(riesgos).toHaveCount(1);
    await expect(riesgos.getByRole('heading', { name: 'Riesgos por nivel' })).toBeVisible();
    await expect(riesgos.getByRole('img', { name: /Riesgos por nivel: .*Alto 2/ })).toBeVisible();
    // la ruta: una columna por horizonte, cada fase con título y una línea
    const fases = page.getByTestId('resumen-ruta').locator('li');
    await expect(fases).toHaveCount(4);
    const x = await fases.evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().left)));
    if (page.viewportSize()!.width >= 1024) expect(new Set(x).size, 'cada fase en su columna (desde 1024 px)').toBe(4);
    else expect(new Set(x).size, 'en pantallas angostas las fases se apilan o se reparten, sin salirse').toBeLessThanOrEqual(4);
    for (const f of await fases.all()) expect(await f.locator(':scope > *').count(), 'horizonte, título y una línea').toBe(3);
    // botones de texto visibles
    const acciones = page.getByTestId('resumen-acciones');
    for (const n of ['Ver riesgos y ruta en detalle', 'Ver trazabilidad', 'Ver informe imprimible']) await expect(acciones.getByRole('link', { name: n })).toBeVisible();
    await expect(page.getByTestId('resumen-modo')).toHaveText('Simulado');
    // lo del Detalle no está montado
    await expect(page.getByTestId('risk-R1')).toHaveCount(0);
    await expect(page.getByTestId('phase-F1')).toHaveCount(0);
    await expect(page.getByTestId('chart-provenance')).toHaveCount(0);
    await expect(page.getByTestId('estr-sector')).toHaveCount(0);
    expect(await idsDuplicados(page)).toEqual([]);
  });

  test('un riesgo, una fase y los botones abren el Detalle en su tarjeta, con el foco en su encabezado', async ({ page }) => {
    await entrarConsultor(page);
    const casos: { abrir: (p: Page) => Promise<void>; seccion: string; foco: RegExp }[] = [
      { abrir: (p) => p.getByTestId('resumen-riesgo-R1').getByRole('link').click(), seccion: 'riesgo-r1', foco: /^Decisiones de crecimiento/ },
      { abrir: (p) => p.getByTestId('resumen-fase-F3').getByRole('link').click(), seccion: 'fase-f3', foco: /^Fase 3: Conectar/ },
      { abrir: (p) => p.getByTestId('resumen-acciones').getByRole('link', { name: 'Ver riesgos y ruta en detalle' }).click(), seccion: 'riesgos-ruta', foco: /^Riesgos$/ },
      { abrir: (p) => p.getByTestId('resumen-acciones').getByRole('link', { name: 'Ver trazabilidad' }).click(), seccion: 'trazabilidad', foco: /^¿De dónde sale cada recomendación\?/ },
    ];
    for (const c of casos) {
      await ir(page, `${EST}/resumen`);
      await expect(page.getByTestId('estrategia-resumen')).toBeVisible();
      await c.abrir(page);
      await expect.poll(() => hash(page)).toBe(`${EST}/detalle/${c.seccion}`);
      await expect(page.getByTestId('strategy-content')).toBeVisible();
      const foco = page.locator('h2:focus, h3:focus');
      await expect(foco, `foco en ${c.seccion}`).toHaveCount(1);
      await expect(foco).toHaveText(c.foco);
      await expect(foco).toBeInViewport();
    }
  });

  test('el control Resumen | Detalle se maneja con teclado y la vista sobrevive a recargar; el Detalle conserva la pantalla actual', async ({ page }) => {
    await entrarConsultor(page);
    await ir(page, EST);
    const control = page.getByRole('navigation', { name: 'Vista de la pantalla' });
    await control.getByRole('link', { name: 'Detalle' }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => hash(page)).toBe(`${EST}/detalle`);
    await expect(page.getByTestId('risk-R1')).toBeVisible();
    await expect(page.getByTestId('chart-provenance')).toBeVisible();
    await expect(page.getByTestId('estrategia-resumen')).toHaveCount(0);
    expect(await idsDuplicados(page)).toEqual([]);
    await page.reload();
    await expect(page.getByTestId('risk-R1')).toBeVisible();
    await control.getByRole('link', { name: 'Resumen' }).focus();
    await page.keyboard.press('Enter');
    await page.reload();
    await expect(page.getByTestId('estrategia-resumen')).toBeVisible();
  });

  test('con IA real: nada técnico en el Resumen (ni traza, ni modelo, ni tokens), el rótulo de IA y «IA real»; la Empresa no ve nada técnico', async ({ page }) => {
    await estrategiaReal(page);
    await expect(page.getByTestId('resumen-modo')).toHaveText('IA real');
    await expect(page.getByTestId('ai-badge').first()).toHaveText('Generado por IA · requiere revisión humana');
    await expect(page.getByTestId('resumen-riesgo-ER1')).toBeVisible();
    await expect(page.getByTestId('resumen-fase-EF1')).toBeVisible();
    let html = await page.locator('body').innerHTML();
    for (const t of TECNICO) expect(html, `el Resumen de Estrategia no debe traer «${t}»`).not.toContain(t);
    await ir(page, `${EST_A}/detalle`);
    await expect(page.getByTestId('trace-view')).toHaveCount(1); // la traza sigue en el Detalle para el Consultor
    // la Empresa no accede a Estrategia (ni a su Resumen ni a su Detalle) y no queda nada técnico en el DOM
    for (const v of ['resumen', 'detalle']) {
      await rol(page, 'contacto');
      await page.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
      await ir(page, `${EST_A}/${v}`);
      await expect.poll(() => hash(page)).toBe('#/contacto');
      html = await page.locator('body').innerHTML();
      for (const t of TECNICO) expect(html, `la Empresa no debe tener «${t}» (${v})`).not.toContain(t);
      await rol(page, 'consultor');
      await page.getByRole('heading', { level: 1, name: 'Proyectos' }).waitFor();
    }
  });
});

test.describe('Tablero · una sola página (H5c)', () => {
  const entrarLider = async (page: Page, conReal = false) => {
    if (conReal) {
      await emitirDiagnostico(page); // un proyecto real emitido: 4 entregas por revisar y una barra «estimado por IA»
      await emitirReal(page);
      await page.waitForTimeout(1000);
    } else await entrarConsultor(page);
    await rol(page, 'lider');
    await page.getByRole('heading', { level: 1, name: 'Tablero' }).waitFor();
  };

  test('una sola página: 4 cifras, tabla completa con búsqueda y los dos gráficos lado a lado; sin cola ni control Resumen | Detalle', async ({ page }) => {
    await entrarLider(page, true);
    expect(await hash(page)).toBe('#/lider');
    await expect(page.getByTestId('tablero-resumen')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Vista de la pantalla' })).toHaveCount(0);
    await expect(page.getByTestId('review-queue')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Cola de revisión' })).toHaveCount(0);
    for (const id of ['equipos', 'por-revisar', 'promedio', 'madurez']) await expect(page.getByTestId(`kpi-${id}`)).toBeVisible();
    await expect(page.getByTestId('kpi-ver-entregas')).toHaveText('Ver entregas →');
    await expect(page.getByTestId('kpi-ver-entregas')).toHaveAttribute('href', '#/lider/entregas');
    await expect(page.getByLabel('Buscar equipo o empresa')).toBeVisible();
    const cab = (await page.getByTestId('teams-table').locator('thead th').allInnerTexts()).map((t) => t.trim());
    expect(cab).toEqual(['Equipo', 'Proyectos', 'Etapa', 'Avance', 'Madurez', 'Última actividad', 'Entregas por revisar']);
    const tabla = await page.getByTestId('teams-table').boundingBox();
    const main = await page.locator('main').boundingBox();
    expect(tabla!.width, 'la tabla ocupa todo el ancho').toBeGreaterThan(main!.width * 0.85);
    const etapas = await page.getByTestId('chart-stages').boundingBox();
    const madurez = await page.getByTestId('chart-maturity-projects').boundingBox();
    if (page.viewportSize()!.width >= 768) {
      expect(Math.abs(etapas!.y - madurez!.y), 'los gráficos van lado a lado').toBeLessThan(4);
      expect(madurez!.x).toBeGreaterThan(etapas!.x + etapas!.width - 1);
    }
    expect(await idsDuplicados(page)).toEqual([]);
    // las rutas antiguas abren esta misma página, sin 404
    for (const h of ['#/lider/detalle', '#/lider/resumen']) {
      await ir(page, h);
      await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
      await expect(page.getByTestId('chart-stages')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Vista de la pantalla' })).toHaveCount(0);
    }
  });

  test('las pistas de las barras de madurez miden lo mismo (a 320, 768, 1280 y 1920)', async ({ page }) => {
    await entrarLider(page, true);
    for (const w of [320, 768, 1280, 1920]) {
      await resize(page, w);
      const anchos = await page.locator('[data-testid="chart-maturity-projects"] .ranked-track').evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().width * 10) / 10));
      expect(anchos.length).toBeGreaterThan(1);
      expect(Math.max(...anchos) - Math.min(...anchos), `pistas de igual longitud a ${w}: ${anchos.join(', ')}`).toBeLessThanOrEqual(0.5);
    }
  });
});

test.describe('Diagnóstico · Resumen · pulidos', () => {
  test('modo visible, tarjeta única «Estado de los hallazgos» con leyenda, pilares con «›» y sin marca oscura', async ({ page }) => {
    await emitirDiagnostico(page);
    await expect(page.getByTestId('resumen-modo')).toHaveText('IA real');
    // (f) una sola tarjeta: línea resumen + barra segmentada + leyenda; sin fila de tres cifras
    await expect(page.locator('[data-testid^="resumen-cifra-"]')).toHaveCount(0);
    const estado = page.getByTestId('chart-review-state');
    await expect(estado).toHaveCount(1);
    await expect(estado.getByRole('heading', { name: 'Estado de los hallazgos' })).toBeVisible();
    await expect(page.getByTestId('resumen-estado-linea')).toHaveText('4 hallazgos · 3 verificados · 1 NO VERIFICADO');
    await expect(estado.locator('.segbar')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: /^Hallazgos$/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Estado de la revisión/ })).toHaveCount(0);
    const leyenda = page.getByTestId('resumen-leyenda-estado');
    await expect(leyenda).toContainText('Verificados');
    await expect(leyenda).toContainText('comprobado por código');
    await expect(leyenda).toContainText('Aceptados');
    await expect(leyenda).toContainText('decisión de la persona');
    // (e) «›» al final del nombre del pilar
    for (const dim of ['infraestructura', 'cultura']) await expect(page.getByTestId(`resumen-pilar-${dim}`).getByRole('link')).toContainText('›');
    // (d) sin la marca oscura sobre las barras
    await abrir(page, 'P-A', 'revision');
    for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
    expect(await page.locator('.resumen .scale-fill').count()).toBeGreaterThan(0);
    for (const m of await page.locator('.resumen .scale-mark').all()) await expect(m).not.toBeVisible();
  });

  test('un pilar sin evidencia no dibuja ningún número ni relleno, en cada fila', async ({ page }) => {
    await emitirDiagnostico(page); // sin decisiones: ningún nivel tiene respaldo vigente
    const filas = page.locator('[data-testid^="resumen-pilar-"]');
    await expect(filas).toHaveCount(6);
    for (const f of await filas.all()) {
      const texto = (await f.innerText()) + ' ' + (await f.locator('[aria-label]').evaluateAll((l) => l.map((e) => e.getAttribute('aria-label')).join(' ')));
      expect(texto).toMatch(/Sin evidencia suficiente|Sin respaldo vigente/);
      expect(texto, 'ningún número de nivel en un pilar sin evidencia').not.toMatch(/\b\d(,\d)? de 5\b/);
      await expect(f.locator('.scale-fill')).toHaveCount(0);
    }
  });

  test('a 480 px o menos cada fila de pilar apila el nombre, la barra y los chips; a 1280 el nombre queda a la izquierda', async ({ page }) => {
    await emitirDiagnostico(page);
    await abrir(page, 'P-A', 'revision');
    for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
    const caja = (loc: ReturnType<Page['locator']>) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, b: r.bottom, r: r.right }; });
    for (const w of [320, 480]) {
      await resize(page, w);
      const fila = page.getByTestId('resumen-pilar-infraestructura'); // con barra (sin chips: el valor lo dice el texto de la barra)
      const nombre = await caja(fila.getByRole('link'));
      const barra = await caja(fila.locator('.scale-bar'));
      expect(nombre.b, `nombre encima de la barra a ${w}`).toBeLessThanOrEqual(barra.y + 1);
      expect(barra.r - barra.x, `la barra ocupa el ancho de la fila a ${w}`).toBeGreaterThan(w * 0.6);
      const bajo = await caja(page.getByTestId('resumen-pilar-cultura').locator('.row-state')); // sin evidencia: la etiqueta debajo del nombre
      const nombreBajo = await caja(page.getByTestId('resumen-pilar-cultura').getByRole('link'));
      expect(nombreBajo.b, `chips debajo del nombre a ${w}`).toBeLessThanOrEqual(bajo.y + 1);
      await expectNoHorizontalScroll(page);
    }
    await resize(page, 1280);
    const fila = page.getByTestId('resumen-pilar-infraestructura');
    expect((await caja(fila.getByRole('link'))).r).toBeLessThanOrEqual((await caja(fila.locator('.scale-bar'))).x + 1);
  });

  test('un proyecto Simulado dice que ese modo no tiene niveles por pilar, sin bloques vacíos y con sus rótulos', async ({ page }) => {
    await entrarConsultor(page);
    await ir(page, '#/consultor/proyectos/P-B/diagnostico');
    await expect(page.getByTestId('diagnostico-resumen')).toBeVisible();
    await expect(page.getByTestId('resumen-modo')).toHaveText('Simulado');
    await expect(page.getByTestId('resumen-sin-niveles')).toContainText('no tiene niveles por pilar');
    await expect(page.getByTestId('diagnostico-resumen').getByText('Simulada', { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId('maturity-card')).toContainText('ilustrativo, ficticio');
    await expect(page.locator('.resumen .maturity-list')).toHaveCount(0);
    // ningún bloque vacío: toda tarjeta del Resumen trae texto
    for (const c of await page.locator('.resumen section.card').all()) expect((await c.innerText()).trim().length).toBeGreaterThan(10);
    await expect(page.getByTestId('resumen-estado-linea')).toContainText('hallazgos');
    await expect(page.getByTestId('ai-badge')).toHaveCount(0);
  });
});

test('accesibilidad AA, teclado, objetivos de 44 px y sin desplazamiento horizontal a 320, 768, 1280 y 1920; altura y bloques de cada Resumen', async ({ page }) => {
  await emitirDiagnostico(page); // peor caso del Tablero: un proyecto real emitido suma una entrega y una barra «estimado por IA»
  await emitirReal(page);
  await page.waitForTimeout(1000);
  const medidas: Record<string, unknown> = {};
  const pantallas: { clave: string; raiz: string; abrir: () => Promise<void> }[] = [
    { clave: 'estrategia', raiz: 'estrategia-resumen', abrir: async () => { await rol(page, 'consultor'); await ir(page, EST); } },
  ];
  for (const p of pantallas) {
    await p.abrir();
    await expect(page.getByTestId(p.raiz)).toBeVisible();
    medidas[p.clave] = {};
    for (const w of [320, 768, 1280, 1920]) {
      await resize(page, w, w === 1280 ? 600 : undefined); // ventana baja a 1280: así scrollHeight es la altura real del contenido
      await page.evaluate(() => window.scrollTo(0, 0));
      await expectNoAxeViolations(page);
      await expectNoHorizontalScroll(page);
      expect(await chicos(page), `${p.clave}: objetivos < 44 px a ${w}`).toEqual([]);
      const m = await bloques(page, p.raiz);
      (medidas[p.clave] as Record<number, unknown>)[w] = m;
      expect(m.principal, `${p.clave}: bloque principal a ${w}`).toBe(1);
      expect(m.visual, `${p.clave}: visuales a ${w}`).toBeLessThanOrEqual(2);
      expect(m.lista, `${p.clave}: listas a ${w}`).toBeLessThanOrEqual(1);
      if (w === 1280) expect(m.alto, `${p.clave}: altura del Resumen a 1280: ${m.alto}`).toBeLessThanOrEqual(1000);
    }
    // teclado: Tab alcanza el control y los botones
    await resize(page, 1280);
    const alcanzados = new Set<string>();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press('Tab');
      alcanzados.add(await page.evaluate(() => (document.activeElement?.textContent ?? '').trim()));
    }
    const esperados = ['Resumen', 'Detalle', 'Ver riesgos y ruta en detalle', 'Ver trazabilidad', 'Ver informe imprimible'];
    for (const t of esperados) expect([...alcanzados].some((x) => x.includes(t)), `${p.clave}: Tab alcanza «${t}»`).toBe(true);
  }
  writeFileSync('docs/evidencia/h4b-medidas.json', JSON.stringify(medidas, null, 2));
});
