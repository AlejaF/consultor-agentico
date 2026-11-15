// Lote H5 (ajustes finales de interfaz, solo presentación). Corre con playwright.h4.config.ts (vista por defecto de producción).
// Archivo NUEVO: servicio en modo FALSO (sin red, sin clave, sin gasto).
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { abrir, elegirIAReal, entrarConsultor, ruta, SEIS_FORMATOS, HOSTILES, subir, vaciarServicio } from './helpers/real';

const STORAGE_KEY = 'consultor-agentico-demo:state';
const bloqueadoSiTecnico = ['partial-notice', 'review-warning', 'resumen-avisos', 'trace-view'];

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

/** Diagnóstico real emitido y estrategia real generada de P-A (servicio falso). Termina en el Resumen de Estrategia. */
async function estrategiaReal(page: Page) {
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await elegirIAReal(page);
  await subir(page, ruta([...SEIS_FORMATOS, ...HOSTILES]));
  await abrir(page, 'P-A', 'diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByTestId('diagnostico-resumen')).toBeVisible({ timeout: 30_000 });
  await abrir(page, 'P-A', 'revision');
  for (const id of ['R1', 'R2', 'R3']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByTestId('finding-R4').getByRole('button', { name: /^Rechazar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await expect(page.getByText('Es de solo lectura.')).toBeVisible();
  await page.waitForTimeout(1000);
  await abrir(page, 'P-A', 'estrategia');
  await page.getByRole('button', { name: 'Generar estrategia' }).click();
  await expect(page.getByTestId('estrategia-resumen')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
}
/** Mismo escenario que ia-real-roles.spec.ts (resultado parcial y error del proveedor), sobre las dos corridas de P-A. */
async function conAvisos(page: Page) {
  await page.evaluate(
    (key) => {
      const s = JSON.parse(localStorage.getItem(key)!);
      for (const run of [s.projects['P-A'].real.diagnosisRun, s.projects['P-A'].real.strategyRun]) {
        run.partial = true;
        run.errors = [{ category: 'timeout', message: 'El proveedor tardó demasiado.' }];
      }
      localStorage.setItem(key, JSON.stringify(s));
    },
    STORAGE_KEY,
  );
  await page.reload();
}

const EST = '#/consultor/proyectos/P-C/estrategia';
const hash = (page: Page) => page.evaluate(() => window.location.hash);
const ir = (page: Page, h: string) => page.evaluate((x) => (window.location.hash = x), h);

test.describe('H5·4 Estrategia: destinos distinguibles', () => {
  test('cada botón y enlace deja su destino arriba, resaltado y con el foco; dos botones nunca llevan al mismo punto', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await entrarConsultor(page);
    const casos: { nombre: string; clic: (p: Page) => Promise<void>; id: string }[] = [
      { nombre: 'Ver riesgos y ruta en detalle', clic: (p) => p.getByTestId('resumen-acciones').getByRole('link', { name: 'Ver riesgos y ruta en detalle' }).click(), id: 'estr-riesgos' },
      { nombre: 'Ver trazabilidad', clic: (p) => p.getByTestId('resumen-acciones').getByRole('link', { name: 'Ver trazabilidad' }).click(), id: 'trazabilidad-titulo' },
      { nombre: 'riesgo R1', clic: (p) => p.getByTestId('resumen-riesgo-R1').getByRole('link').click(), id: 'riesgo-r1' },
      { nombre: 'riesgo R4', clic: (p) => p.getByTestId('resumen-riesgo-R4').getByRole('link').click(), id: 'riesgo-r4' },
      { nombre: 'fase F1', clic: (p) => p.getByTestId('resumen-fase-F1').getByRole('link').click(), id: 'fase-f1' },
      { nombre: 'fase F4', clic: (p) => p.getByTestId('resumen-fase-F4').getByRole('link').click(), id: 'fase-f4' },
    ];
    const vistos = new Map<string, string>();
    for (const c of casos) {
      await ir(page, `${EST}/resumen`);
      await expect(page.getByTestId('estrategia-resumen')).toBeVisible();
      await c.clic(page);
      await expect(page.getByTestId('strategy-content')).toBeVisible();
      const destacado = page.locator('[data-destino]');
      await expect(destacado, `un solo destino resaltado (${c.nombre})`).toHaveCount(1);
      await expect.poll(() => page.evaluate(() => document.activeElement?.id), { message: `foco en ${c.id}` }).toBe(c.id);
      await page.waitForTimeout(400); // el segundo ajuste de posición ocurre a los 250 ms
      const m = await page.evaluate((id) => {
        const caja = document.querySelector('[data-destino]') as HTMLElement;
        const r = caja.getBoundingClientRect();
        const cs = getComputedStyle(caja);
        return { top: Math.round(r.top), contiene: caja.contains(document.getElementById(id)), ancho: cs.outlineWidth, estilo: cs.outlineStyle, color: cs.outlineColor, anim: cs.transitionProperty };
      }, c.id);
      expect(m.contiene, `el resalte envuelve a ${c.id}`).toBe(true);
      expect(m.top, `${c.nombre}: el destino queda en la parte superior de la ventana`).toBeGreaterThanOrEqual(0);
      expect(m.top, `${c.nombre}: el destino queda en la parte superior de la ventana`).toBeLessThanOrEqual(140);
      expect([m.ancho, m.estilo], 'contorno de 2 px').toEqual(['2px', 'solid']);
      expect(m.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(m.anim, 'sin animación de color').not.toMatch(/outline|color/);
      expect(vistos.has(c.id), `«${c.nombre}» lleva al mismo punto que «${vistos.get(c.id)}»`).toBe(false);
      vistos.set(c.id, c.nombre);
      expect(await hash(page)).toContain('/detalle/');
    }
    expect(vistos.size).toBe(casos.length);
  });

  test('el Detalle trae «← Volver al Resumen»; el aviso naranja va en su línea y los 3 botones no dejan una celda suelta', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await entrarConsultor(page);
    await ir(page, `${EST}/resumen`);
    const aviso = await page.getByTestId('unverified-unused').boundingBox();
    const chips = await page.locator('.resumen-estado .badge').evaluateAll((l) => Math.max(...l.map((e) => e.getBoundingClientRect().bottom)));
    expect(aviso!.y, 'el aviso queda bajo los chips').toBeGreaterThanOrEqual(chips - 1);
    const botones = await page.getByTestId('resumen-acciones').getByRole('link').evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().width)));
    expect(botones).toHaveLength(3);
    expect(botones[2]!, 'el tercer botón ocupa todo el ancho: ninguna celda suelta').toBeGreaterThan(botones[0]! * 1.5);
    await page.getByTestId('resumen-acciones').getByRole('link', { name: 'Ver trazabilidad' }).click();
    const volver = page.getByTestId('volver-resumen');
    await expect(volver).toHaveText('← Volver al Resumen');
    await volver.click();
    await expect.poll(() => hash(page)).toBe(`${EST}/resumen`);
    await expect(page.getByTestId('estrategia-resumen')).toBeVisible();
  });
});

test.describe('H5·6 Avisos de honestidad en el Resumen', () => {
  test('el resultado parcial y los errores se ven en una línea sobre los gráficos, con enlace al Detalle (Diagnóstico y Estrategia); la Empresa no los tiene', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await estrategiaReal(page);
    await expect(page.getByTestId('resumen-avisos')).toHaveCount(0); // sin avisos en la corrida: no hay línea
    await conAvisos(page);
    const casos = [
      { ruta: '#/consultor/proyectos/P-A/estrategia/resumen', raiz: 'estrategia-resumen', grafico: 'chart-risk-levels', detalle: '#/consultor/proyectos/P-A/estrategia/detalle' },
      { ruta: '#/consultor/proyectos/P-A/diagnostico/resumen', raiz: 'diagnostico-resumen', grafico: 'maturity-card', detalle: '#/consultor/proyectos/P-A/diagnostico/detalle' },
    ];
    for (const c of casos) {
      await ir(page, c.ruta);
      await expect(page.getByTestId(c.raiz)).toBeVisible();
      const av = page.getByTestId('resumen-avisos');
      await expect(av).toBeVisible();
      await expect(av.getByTestId('partial-notice')).toContainText('Resultado parcial');
      await expect(av.getByTestId('review-warning')).toContainText('El proveedor tardó demasiado.');
      const [yAviso, yGrafico] = await Promise.all([av.boundingBox().then((b) => b!.y), page.getByTestId(c.grafico).first().boundingBox().then((b) => b!.y)]);
      expect(yAviso, `${c.raiz}: el aviso va por encima de los gráficos`).toBeLessThan(yGrafico);
      const alto = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(alto, `${c.raiz}: altura con avisos`).toBeLessThanOrEqual(1000);
      await av.getByRole('link', { name: /Ver en el detalle/ }).click();
      await expect.poll(() => hash(page)).toBe(c.detalle);
      await expect(page.getByTestId('partial-notice')).toBeVisible(); // el aviso original del Detalle sigue ahí
    }
    // la Empresa: ni en el DOM
    await page.locator('#rol-activo').selectOption('contacto');
    await page.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
    const html = await page.locator('body').innerHTML();
    for (const t of bloqueadoSiTecnico) expect(html, `la Empresa no debe tener «${t}»`).not.toContain(t);
  });
});

test.describe('H5·2 Grupos de pilar', () => {
  test('en el Detalle de Diagnóstico y en Revisión cada tarjeta queda dentro del contenedor enmarcado de su pilar, con su encabezado dentro', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta([...SEIS_FORMATOS, ...HOSTILES]));
    await abrir(page, 'P-A', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('diagnostico-resumen')).toBeVisible({ timeout: 30_000 });
    const medidas: Record<string, unknown> = {};
    for (const [pantalla, hash] of [['diagnostico', '#/consultor/proyectos/P-A/diagnostico/detalle'], ['revision', '#/consultor/proyectos/P-A/revision']] as const) {
      await ir(page, hash);
      await expect(page.getByTestId('pillar-flow')).toBeVisible();
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out: { grupo: string; tarjetas: number; fuera: string[]; marco: boolean; encabezadoDentro: boolean }[] = [];
        for (const g of document.querySelectorAll('[data-testid="pillar-flow"] > section')) {
          const gb = g.getBoundingClientRect();
          const h = g.querySelector('h2')!;
          const fuera: string[] = [];
          const tarjetas = [...g.querySelectorAll('[data-testid^="finding-"]')];
          for (const t of tarjetas) {
            const b = t.getBoundingClientRect();
            if (b.left < gb.left - 0.5 || b.right > gb.right + 0.5 || b.top < gb.top - 0.5 || b.bottom > gb.bottom + 0.5) fuera.push(t.getAttribute('data-testid')!);
          }
          const hb = h.getBoundingClientRect();
          const cs = getComputedStyle(g);
          out.push({ grupo: h.textContent ?? '', tarjetas: tarjetas.length, fuera, marco: cs.boxShadow !== 'none' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)', encabezadoDentro: hb.top >= gb.top && hb.bottom <= gb.bottom && hb.left >= gb.left });
        }
        const todas = document.querySelectorAll('[data-testid^="finding-"]').length;
        const enGrupos = out.reduce((a, x) => a + x.tarjetas, 0);
        return { out, todas, enGrupos, alto: document.documentElement.scrollHeight, filas: new Set([...document.querySelectorAll('[data-testid="pillar-flow"] > section')].map((e) => Math.round(e.getBoundingClientRect().top))).size };
      });
      expect(r.out.length, `${pantalla}: hay grupos`).toBeGreaterThan(0);
      expect(r.enGrupos, `${pantalla}: toda tarjeta está en un grupo`).toBe(r.todas);
      for (const g of r.out) {
        expect(g.fuera, `${pantalla}: tarjetas fuera de «${g.grupo}»`).toEqual([]);
        expect(g.marco, `${pantalla}: «${g.grupo}» tiene marco sutil`).toBe(true);
        expect(g.encabezadoDentro, `${pantalla}: el encabezado de «${g.grupo}» está dentro`).toBe(true);
        expect(g.grupo).toMatch(/^Pilar: /);
      }
      await page.screenshot({ path: `docs/evidencia/h5-${pantalla}-1280-grupos.png`, fullPage: true });
      medidas[pantalla] = { alto: r.alto, grupos: r.out.length };
      if (pantalla === 'revision') expect(r.alto, `altura de Revisión a 1280: ${r.alto}`).toBeLessThanOrEqual(1877);
    }
    writeFileSync('docs/evidencia/h5-grupos-medidas.json', JSON.stringify(medidas, null, 2));
  });
});

test.describe('H5·7 a 11 Ajustes de interfaz (solo presentación)', () => {
  const caja = (page: Page, sel: string) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width }; });

  test('Entregas por revisar: filas compactas de 960 px como máximo (título, aviso y botón en una fila) y apiladas por debajo de 768 px', async ({ page }) => {
    await entrarConsultor(page);
    await page.locator('#rol-activo').selectOption('lider');
    await ir(page, '#/lider/entregas');
    await expect(page.getByRole('heading', { level: 1, name: 'Entregas por revisar' })).toBeVisible();
    await page.setViewportSize({ width: 1600, height: 900 });
    const li = page.locator('.entrega-item').first();
    const b = await li.boundingBox();
    expect(b!.width, 'ancho máximo de la fila').toBeLessThanOrEqual(962);
    const t = await caja(page, '.entrega-item > p:first-child');
    const av = await caja(page, '.entrega-item > [data-testid="unverified-count"]');
    const bt = await caja(page, '.entrega-item > a');
    expect(av.x, 'el aviso está a la derecha del título').toBeGreaterThan(t.x + 50);
    expect(bt.x, 'el botón está a la derecha del aviso').toBeGreaterThan(av.x);
    expect(Math.abs(bt.y - t.y), 'botón y título en la misma fila').toBeLessThan(60);
    await expect(page.getByRole('link', { name: /^Abrir entrega/ }).first()).toBeVisible();
    await page.setViewportSize({ width: 600, height: 900 });
    const t2 = await caja(page, '.entrega-item > p:first-child');
    const bt2 = await caja(page, '.entrega-item > a');
    expect(bt2.y, 'por debajo de 768 px se apilan').toBeGreaterThan(t2.b);
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  });

  test('Proyectos: la barra de avance y «Captura de evidencia» quedan alineadas entre tarjetas de una misma fila, con o sin fila «Entregas»', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await entrarConsultor(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeVisible();
    const filas = await page.locator('.project-card').evaluateAll((l) => l.map((e) => ({ top: Math.round(e.getBoundingClientRect().top), barra: Math.round(e.querySelector('.progress')!.getBoundingClientRect().top), boton: Math.round(e.querySelector('a.btn')!.getBoundingClientRect().top), entregas: !!e.querySelector('.delivery-line') })));
    const porFila = new Map<number, typeof filas>();
    for (const f of filas) porFila.set(f.top, [...(porFila.get(f.top) ?? []), f]);
    let comparadas = 0;
    for (const [, g] of porFila) {
      if (g.length < 2) continue;
      comparadas++;
      expect(new Set(g.map((x) => x.barra)).size, `barras alineadas en la fila: ${JSON.stringify(g)}`).toBe(1);
      expect(new Set(g.map((x) => x.boton)).size, 'botones alineados').toBe(1);
    }
    expect(comparadas).toBeGreaterThan(0);
    expect(filas.some((f) => f.entregas) && filas.some((f) => !f.entregas), 'hay tarjetas con y sin «Entregas»').toBe(true);
  });

  test('Captura de evidencia: cada rótulo de «Datos de la empresa» queda cerca de su valor', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await entrarConsultor(page);
    await ir(page, '#/consultor/proyectos/P-B/evidencia');
    const sec = page.locator("section[aria-labelledby='datos-empresa']");
    await expect(sec).toBeVisible();
    const pares = await sec.locator('dt').evaluateAll((l) => l.map((dt) => { const dd = dt.nextElementSibling as HTMLElement; return { dt: dt.textContent, hueco: Math.round(dd.getBoundingClientRect().left - dt.getBoundingClientRect().right), alinea: getComputedStyle(dd).textAlign }; }));
    expect(pares.length).toBeGreaterThan(2);
    for (const p of pares) { expect(p.hueco, `rótulo «${p.dt}» cerca de su valor`).toBeLessThanOrEqual(130); expect(['left', 'start']).toContain(p.alinea); }
    const xs = await sec.locator('dd').evaluateAll((l) => new Set(l.map((e) => Math.round(e.getBoundingClientRect().left))).size);
    expect(xs, 'los valores quedan alineados a la izquierda en una columna').toBe(1);
    expect(await sec.locator('dl').evaluate((e) => e.getBoundingClientRect().width)).toBeLessThanOrEqual(580);
  });

  test('Empresa · Resumen: índice destacado, ruta de 3 pasos en una línea y dos columnas desde 1024 px; nada técnico', async ({ page }) => {
    await entrarConsultor(page);
    await page.locator('#rol-activo').selectOption('contacto');
    await page.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
    for (const w of [1280, 320]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(150);
      await expectNoHorizontalScroll(page);
      await expectNoAxeViolations(page);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    // el índice de madurez de la Empresa solo existe con el diagnóstico emitido; el escenario sembrado de P-B lo trae
    const pasos = await page.locator('[data-testid^="paso-"]').evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(pasos).toHaveLength(3);
    expect(new Set(pasos).size, 'los 3 pasos en una línea horizontal').toBe(1);
    const ruta = await caja(page, '.area-ruta');
    const informe = await caja(page, '.area-informe');
    expect(informe.x, 'informe y encuesta a la derecha').toBeGreaterThan(ruta.r - 1);
    const ind = page.locator('.empresa-indice');
    if (await ind.count()) {
      await expect(ind).toContainText('ilustrativo, ficticio');
      expect((await caja(page, '.empresa-indice')).x).toBeGreaterThan(ruta.r - 1);
    }
    const html = await page.locator('body').innerHTML();
    for (const t of ['trace-view', 'trace-model', 'trace-tokens', 'tech-sheet', 'partial-notice', 'review-warning', 'resumen-avisos']) expect(html).not.toContain(t);
    await page.setViewportSize({ width: 320, height: 900 });
    const p320 = await page.locator('[data-testid^="paso-"]').evaluateAll((l) => new Set(l.map((e) => Math.round(e.getBoundingClientRect().top))).size);
    expect(p320, 'a 320 px los pasos se apilan').toBe(3);
  });

  test('Encuesta: columna centrada, un bloque por pregunta con «N de 3», escala de 44 px con ✓ y extremos fuera de los botones, contador y aviso visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await entrarConsultor(page);
    await page.locator('#rol-activo').selectOption('contacto');
    await page.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
    await ir(page, '#/contacto/encuesta');
    await expect(page.getByRole('heading', { level: 1, name: 'Encuesta' })).toBeVisible();
    const sec = await caja(page, "section[aria-labelledby='encuesta-form']");
    expect(sec.w, 'columna de 640 a 720 px').toBeGreaterThanOrEqual(640);
    expect(sec.w).toBeLessThanOrEqual(720 + 2);
    await expect(page.locator('.survey-num')).toHaveText(['Pregunta 1 de 3', 'Pregunta 2 de 3', 'Pregunta 3 de 3']);
    await expect(page.getByTestId('encuesta-contador')).toHaveText('0 de 3 respondidas');
    await expect(page.getByRole('button', { name: 'Guardar respuestas' })).toBeEnabled();
    // los extremos son texto aparte, fuera del grupo de radios
    await expect(page.locator('[role="radiogroup"] .scale-end')).toHaveCount(0);
    await expect(page.locator('.scale-end')).toHaveText(['Muy bajo', 'Muy alto', 'Muy bajo', 'Muy alto', 'Muy bajo', 'Muy alto']);
    const chicos = await page.locator('.level').evaluateAll((l) => l.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 43.5 || r.height < 43.5; }).length);
    expect(chicos, 'botones de la escala de al menos 44 px').toBe(0);
    // validación existente, ahora más visible
    await page.getByRole('button', { name: 'Guardar respuestas' }).click();
    const alerta = page.getByRole('alert');
    await expect(alerta).toContainText('Faltan 3 preguntas por responder');
    expect(await alerta.evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe('2px');
    // al responder: contador, relleno y ✓ (sin cambiar el nombre accesible del botón)
    const radios = page.locator('[role="radiogroup"]').first().getByRole('radio', { name: '4', exact: true });
    await radios.check({ force: true });
    await expect(page.getByTestId('encuesta-contador')).toHaveText('1 de 3 respondidas');
    const marca = await page.locator('.level').nth(3).evaluate((e) => ({ fondo: getComputedStyle(e).backgroundColor, check: getComputedStyle(e, '::before').content }));
    expect(marca.check).toContain('✓');
    expect(marca.fondo).not.toBe('rgb(255, 255, 255)');
    await page.screenshot({ path: 'docs/evidencia/h5-encuesta-1280.png', fullPage: true });
    await page.setViewportSize({ width: 320, height: 700 });
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
    await page.screenshot({ path: 'docs/evidencia/h5-encuesta-320.png', fullPage: true });
  });

  test('propósito de Diagnóstico y de Revisión (una línea bajo el título)', async ({ page }) => {
    await entrarConsultor(page);
    await ir(page, '#/consultor/proyectos/P-B/diagnostico');
    await expect(page.getByTestId('proposito')).toHaveText('Lo que encontró el agente (solo lectura)');
    await ir(page, '#/consultor/proyectos/P-B/revision');
    await expect(page.getByTestId('proposito')).toHaveText('Lo que tú decides: aceptar, editar o rechazar cada hallazgo');
  });
});
