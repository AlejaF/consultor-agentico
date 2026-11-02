import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';

type Role = 'Consultor' | 'Líder' | 'Empresa';
const ROLES: Role[] = ['Consultor', 'Líder', 'Empresa'];
const CRITERIOS = ['Trazabilidad de la evidencia', 'Calidad del análisis', 'Coherencia entre diagnóstico y estrategia', 'Claridad de la comunicación'];

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}
async function login(page: Page, role: Role) {
  await page.goto('/');
  await page.getByRole('button', { name: `Entrar como ${role}` }).click();
}
const width = (page: Page) => page.viewportSize()?.width ?? 0;

test.describe('1. Comentario de la rúbrica opcional', () => {
  test('se guarda con los 4 niveles y sin comentario; la vista de solo lectura dice «Sin comentario»', async ({ page }) => {
    await login(page, 'Líder');
    await goto(page, '#/lider/entregas/dx/E-2');
    await expect(page.getByText('Elige un nivel de 1 a 5 en los 4 criterios. El comentario es opcional.')).toBeVisible();
    await expect(page.getByLabel(/Comentarios/)).toHaveAttribute('maxlength', '2000');
    await page.getByRole('button', { name: 'Guardar calificación' }).click({ force: true });
    await expect(page.getByText('Calificada', { exact: true })).toHaveCount(0); // incompleta: no guarda
    for (const name of CRITERIOS) await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '4' }).check({ force: true });
    await expect(page.getByText('Elige un nivel de 1 a 5 en los 4 criterios.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Guardar calificación' }).click();
    await expect(page.getByTestId('grade-average')).toHaveText('Promedio: 4,0 de 5');
    await expect(page.locator('.grade-comment')).toHaveText('Sin comentario');
    await expect(page.locator('.grade-comment')).toHaveClass(/empty/);
  });

  test('el Consultor ve «Sin comentario»; con comentario muestra el texto y admite 2000 caracteres', async ({ page }) => {
    await login(page, 'Líder');
    await goto(page, '#/lider/entregas/dx/P-B');
    for (const name of CRITERIOS) await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '5' }).check({ force: true });
    await page.getByRole('button', { name: 'Guardar calificación' }).click();
    await page.getByLabel('Rol activo').selectOption('consultor');
    await goto(page, '#/consultor/proyectos/P-B/revision');
    await expect(page.locator('.grade-comment')).toHaveText('Sin comentario');
    // con comentario del máximo permitido
    await page.getByLabel('Rol activo').selectOption('lider');
    await goto(page, '#/lider/entregas/dx/E-3');
    const largo = 'a'.repeat(2000);
    await page.getByLabel(/Comentarios/).fill(largo);
    expect((await page.getByLabel(/Comentarios/).inputValue()).length).toBe(2000);
    for (const name of CRITERIOS) await page.getByRole('radiogroup', { name }).getByRole('radio', { name: '3' }).check({ force: true });
    await page.getByRole('button', { name: 'Guardar calificación' }).click();
    await expect(page.locator('.grade-comment')).toHaveText(largo);
    await expectNoHorizontalScroll(page);
  });
});

test.describe('2. Un único «Restablecer demo» en la cabecera', () => {
  for (const role of ROLES) {
    test(`${role}: sin «Opciones» ni tarjeta de sesión; el botón está siempre en la cabecera y no en la barra lateral`, async ({ page }) => {
      await login(page, role);
      await goto(page, role === 'Consultor' ? '#/consultor/proyectos/P-B/diagnostico' : role === 'Líder' ? '#/lider' : '#/contacto');
      await expect(page.getByRole('button', { name: 'Opciones' })).toHaveCount(0);
      await expect(page.getByText(/Sesión de demostración|cuenta ficticia/)).toHaveCount(0);
      const botones = page.getByRole('button', { name: 'Restablecer demo' });
      await expect(botones).toHaveCount(1);
      await expect(page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' })).toBeVisible();
      await expect(page.locator('.sidebar').getByRole('button')).toHaveCount(0);
    });
  }

  test('una sola confirmación: foco atrapado, Escape y «Cancelar» no restablecen; confirmar sí', async ({ page }) => {
    await login(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
    const boton = page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' });
    await boton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('¿Restablecer la demo?');
    await expect(dialog).toContainText('Se borrarán tus cambios en este navegador y la demo volverá a su estado inicial, con los datos de ejemplo.');
    // foco atrapado
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      // dentro del diálogo, o en el documento sin elemento enfocado (el navegador toma el foco): nunca en la página de fondo
      expect(await page.evaluate(() => { const a = document.activeElement; return !a || a === document.body || !!a.closest('dialog'); }), 'el foco sale del diálogo').toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(boton).toBeFocused();
    await boton.click();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible(); // nada se borró
    await boton.click();
    await expect(page.getByRole('dialog')).toHaveCount(1); // una sola ventana
    await dialog.getByRole('button', { name: 'Sí, restablecer' }).click();
    await expect(page).toHaveURL(/#\/$/);
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await expect(page.getByRole('button', { name: 'Generar diagnóstico' })).toBeVisible(); // volvió al estado inicial
  });

  test('el nombre accesible es siempre «Restablecer demo»; en menos de 768 px la etiqueta visible es «Restablecer»', async ({ page }) => {
    await login(page, 'Líder');
    const boton = page.locator('header.topbar').getByRole('button', { name: 'Restablecer demo' });
    const visible = width(page) < 768 ? 'Restablecer' : 'Restablecer demo';
    expect((await boton.innerText()).trim()).toBe(visible);
    const caja = await boton.boundingBox();
    expect(caja!.height).toBeGreaterThanOrEqual(44);
    expect(caja!.width).toBeGreaterThanOrEqual(44);
  });
});

test.describe('3. «Inicio» y la marca llevan al ingreso sin borrar el estado', () => {
  for (const role of ROLES) {
    test(`${role}: enlaces «Inicio» y «Consultor Agéntico» hacia el ingreso`, async ({ page }) => {
      await login(page, role);
      const header = page.locator('header.topbar');
      await expect(header.getByRole('link', { name: 'Inicio' })).toBeVisible();
      await expect(header.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '#/');
      // «Inicio» es el único control hacia el ingreso: la marca es logo y texto, sin enlace ni foco
      await expect(header.getByRole('link')).toHaveCount(1);
      await expect(header.getByText('Consultor Agéntico')).toBeVisible();
      const marca = await header.locator('.brand').evaluate((el) => ({ enlace: !!el.closest('a') || el.tagName === 'A', foco: el.tabIndex >= 0 && el.matches(':is(a,button,[tabindex])'), subrayado: getComputedStyle(el).textDecorationLine }));
      expect(marca).toEqual({ enlace: false, foco: false, subrayado: 'none' });
      await header.getByRole('link', { name: 'Inicio' }).click();
      await expect(page).toHaveURL(/#\/$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Consultor Agéntico' })).toBeVisible();
    });
  }

  test('no borra el estado: el trabajo sigue al volver a entrar con «Inicio»', async ({ page }) => {
    await login(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
    await page.locator('header.topbar').getByRole('link', { name: 'Inicio' }).click();
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByTestId('notices')).not.toContainText('Se restableció');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    await expect(page).toHaveURL(/#\/lider$/);
    await page.getByLabel('Rol activo').selectOption('consultor');
    await goto(page, '#/consultor/proyectos/P-A/diagnostico');
    await expect(page.getByText('Generado — pendiente de revisión')).toBeVisible();
  });

  test('cambiar de rol con el selector lleva al inicio del nuevo rol y conserva el estado', async ({ page }) => {
    await login(page, 'Consultor');
    await goto(page, '#/consultor/proyectos/P-B/revision');
    await page.getByLabel('Rol activo').selectOption('lider');
    await expect(page).toHaveURL(/#\/lider$/);
    await page.getByLabel('Rol activo').selectOption('contacto');
    await expect(page).toHaveURL(/#\/contacto$/);
    await page.getByLabel('Rol activo').selectOption('consultor');
    await expect(page).toHaveURL(/#\/consultor$/);
  });

  test('bajo 768 px: fila 1 = marca + Inicio; fila 2 = «Rol activo» + selector (+ Restablecer si cabe; si no, tercera fila a la derecha)', async ({ page }) => {
    test.skip(width(page) >= 768, 'La distribución de dos filas es para menos de 768 px');
    await login(page, 'Líder');
    const f = await page.locator('header.topbar').evaluate((h) => {
      const caja = (el: Element | null) => el!.getBoundingClientRect();
      const centro = (el: Element | null) => { const r = caja(el); return Math.round(r.top + r.height / 2); };
      const brand = h.querySelector('.brand');
      const inicio = h.querySelector('a');
      const label = h.querySelector('label');
      const select = h.querySelector('select');
      const reset = h.querySelector('button.reset-demo');
      const mismaFila = caja(reset).top < caja(select).bottom - 1;
      return { f1: [centro(brand), centro(inicio)], f2: [centro(label), centro(select), ...(mismaFila ? [centro(reset)] : [])], texto: label!.textContent?.trim(), orden: caja(label).right <= caja(select).left && (!mismaFila || caja(select).right <= caja(reset).left), debajo: !mismaFila ? caja(reset).top >= caja(select).bottom - 1 && h.getBoundingClientRect().right - parseFloat(getComputedStyle(h).paddingRight) - caja(reset).right <= 2 : true };
    });
    expect(Math.abs(f.f1[0] - f.f1[1])).toBeLessThanOrEqual(6);
    expect(Math.max(...f.f2) - Math.min(...f.f2)).toBeLessThanOrEqual(6);
    expect(f.f2[0]).toBeGreaterThan(f.f1[0] + 10);
    expect(f.orden, 'etiqueta, selector y botón en ese orden, de izquierda a derecha').toBe(true);
    expect(f.debajo, 'si «Restablecer» no cabe, va en una tercera fila a la derecha').toBe(true);
    expect(f.texto).toBe('Rol activo');
    await expectNoHorizontalScroll(page);
  });
});

test.describe('4. Ingreso: cada cuenta es una sola tarjeta-control', () => {
  test('sin botones «Entrar como» anidados; un control por tarjeta con todo el área táctil', async ({ page }) => {
    await page.goto('/');
    const tarjetas = page.locator('.account-link');
    await expect(tarjetas).toHaveCount(3);
    for (const [i, rol] of ['Consultor', 'Líder', 'Empresa'].entries()) {
      const t = tarjetas.nth(i);
      expect(await t.evaluate((el) => el.querySelectorAll('button, a, input, select, textarea, [role=button]').length), 'controles anidados').toBe(0);
      const nombre = (await t.getAttribute('aria-label')) ?? '';
      expect(nombre).toContain(`Entrar como ${rol}`);
      expect(nombre).toMatch(/Demo/); // el nombre de la cuenta
      await expect(t).toContainText('Entrar →');
      if (rol === 'Empresa') {
        await expect(t).toContainText('Contacto Demo');
        await expect(t).toContainText('Persona de contacto de la empresa cliente.');
      }
      const caja = await t.boundingBox();
      const li = await t.locator('xpath=..').boundingBox();
      expect(caja!.height).toBeGreaterThanOrEqual(44);
      expect(caja!.width / li!.width, 'el control cubre la tarjeta').toBeGreaterThan(0.95);
      expect(caja!.height / li!.height).toBeGreaterThan(0.95);
    }
    await expect(page.getByRole('button', { name: 'Entrar →' })).toHaveCount(0); // el texto indicativo no es un botón
    await expect(page.getByRole('button', { name: /^Entrar como/ })).toHaveCount(3); // exactamente uno por tarjeta
  });

  test('cualquier punto de la tarjeta entra; foco y hover visibles; teclado', async ({ page }) => {
    await page.goto('/');
    await page.locator('.account-link').nth(1).locator('.subtitle').click(); // clic en el texto secundario
    await expect(page).toHaveURL(/#\/lider$/);
    await page.locator('header.topbar').getByRole('link', { name: 'Inicio' }).click();
    const t = page.locator('.account-link').first();
    for (let i = 0; i < 10 && !(await t.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab'); // foco con teclado
    await expect(t).toBeFocused();
    const foco = await t.evaluate((el) => getComputedStyle(el).outlineStyle + '|' + getComputedStyle(el).outlineWidth);
    expect(foco).not.toMatch(/^none/);
    const antes = await t.evaluate((el) => getComputedStyle(el).backgroundColor);
    if (width(page) >= 1024) {
      await page.locator('.account-link').nth(2).hover();
      const despues = await page.locator('.account-link').nth(2).evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(despues).not.toBe(antes);
    }
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/consultor$/);
  });

  test('ingreso con un rol activo: axe y sin desplazamiento horizontal', async ({ page }) => {
    await page.goto('/');
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });
});

test.describe('5. El puntaje de la tarjeta de proyecto no se parte', () => {
  test('«Calificada · N de 5» ocupa una sola línea', async ({ page }) => {
    await login(page, 'Consultor');
    const puntajes = page.getByTestId('delivery-score');
    await expect(puntajes.first()).toBeVisible();
    const info = await puntajes.evaluateAll((els) =>
      els.map((el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return { texto: el.textContent, lineas: new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size };
      }),
    );
    expect(info.some((x) => /^Calificada · \d,\d de 5$/.test(x.texto ?? ''))).toBe(true);
    for (const x of info) expect(x.lineas, `«${x.texto}» se parte`).toBe(1);
    await expectNoHorizontalScroll(page);
  });
});
