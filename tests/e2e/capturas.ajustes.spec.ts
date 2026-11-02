import { test, type Page } from '@playwright/test';

// Capturas de los ajustes F a I para la revisión humana; solo con EVIDENCIA=1.
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}

test('capturas de los ajustes F a I', async ({ page, browser }, info) => {
  const dir = 'docs/evidencia/capturas/ajustes';
  const w = info.project.name;
  const shot = (name: string, p: Page = page) => p.screenshot({ path: `${dir}/${name}-${w}.png`, fullPage: true });

  // Pestañas de cada rol (en 1280 se ve la barra lateral)
  for (const [id, label, hash] of [
    ['consultor', 'Consultor', '#/consultor/proyectos/P-B/diagnostico'],
    ['lider', 'Líder', '#/lider'],
    ['contacto', 'Empresa', '#/contacto'],
  ] as const) {
    const ctx = await browser.newContext({ viewport: page.viewportSize() ?? undefined, baseURL: info.project.use.baseURL });
    const p = await ctx.newPage();
    await p.goto('/');
    await p.getByRole('button', { name: `Entrar como ${label}` }).click();
    await p.waitForURL(new RegExp(`#/${id}$`));
    await goto(p, hash);
    if (id === 'contacto') await p.getByRole('heading', { level: 1, name: 'Empresa' }).waitFor();
    else await p.getByRole('navigation', { name: 'Navegación principal' }).waitFor();
    await shot(`pestanas-${id}`, p);
    await ctx.close();
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();

  // Pilar con un hallazgo NO VERIFICADO aceptado (P-B emitido)
  await goto(page, '#/consultor/proyectos/P-B/revision');
  await page.getByTestId('finding-H5').scrollIntoViewIfNeeded();
  await page.getByText('No se usará como respaldo de la estrategia').first().waitFor();
  await shot('pilar-no-verificado-aceptado');

  // Ventana «¿Aprobar y emitir…?» y banner «Emitido»
  await goto(page, '#/consultor/proyectos/P-A/diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await page.getByText('Generado — pendiente de revisión').waitFor();
  await goto(page, '#/consultor/proyectos/P-A/revision');
  for (const id of ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8']) await page.getByTestId(`finding-${id}`).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('dialog').waitFor();
  await shot('ventana-aprobar-y-emitir');
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await page.getByRole('link', { name: 'Continuar con la Estrategia →' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot('banner-emitido-continuar');
});
