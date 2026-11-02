import { test, type Page } from '@playwright/test';

// Capturas de evidencia del L3 para la revisión humana; solo con EVIDENCIA=1.
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}

test('capturas de L3', async ({ page, browser }, info) => {
  const dir = 'docs/evidencia/capturas/L3';
  const w = info.project.name;
  const shot = (name: string) => page.screenshot({ path: `${dir}/${name}-${w}.png`, fullPage: true });

  // Barra lateral de cada rol (contexto nuevo por rol)
  for (const [id, label, hash] of [
    ['consultor', 'Consultor', '#/consultor/proyectos/P-B/revision'],
    ['lider', 'Líder', '#/lider'],
    ['contacto', 'Contacto', '#/contacto'],
  ] as const) {
    const ctx = await browser.newContext({ viewport: page.viewportSize() ?? undefined, baseURL: info.project.use.baseURL });
    const p = await ctx.newPage();
    await p.goto('/');
    await p.getByRole('button', { name: `Entrar como ${label}` }).click();
    await p.waitForURL(new RegExp(`#/${id}$`));
    await goto(p, hash);
    await p.screenshot({ path: `${dir}/barra-lateral-${id}-${w}.png`, fullPage: true });
    await ctx.close();
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();

  // Proyecto sin evidencia: Diagnóstico bloqueado
  await goto(page, '#/consultor/proyectos/P-D/diagnostico');
  await page.getByText('Carga al menos un archivo para poder generar el diagnóstico.').waitFor();
  await shot('sin-evidencia-bloqueado');

  // Diagnóstico generado con una cita abierta
  await goto(page, '#/consultor/proyectos/P-A/diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await page.getByText('Generado — pendiente de revisión').waitFor();
  await page.getByTestId('finding-H1').getByRole('button', { name: /pág\. 18/ }).click();
  await page.getByTestId('finding-H1').getByText('Evidencia de ejemplo (ficticia)').waitFor();
  await shot('diagnostico-cita-abierta');

  // Revisión con aceptados, editados y rechazados
  await goto(page, '#/consultor/proyectos/P-A/revision');
  const card = (id: string) => page.getByTestId(`finding-${id}`);
  await card('H1').getByRole('button', { name: /^Aceptar/ }).click();
  await card('H2').getByRole('button', { name: /^Editar/ }).click();
  await card('H2').getByRole('textbox').fill('La dirección quiere crecer, pero hoy no puede estimar el costo de atender a un cliente nuevo.');
  await card('H2').getByRole('button', { name: 'Guardar edición' }).click();
  await card('H3').getByRole('button', { name: /^Rechazar/ }).click();
  await card('H4').getByRole('button', { name: /^Aceptar/ }).click();
  await card('H5').getByRole('button', { name: /^Aceptar/ }).click();
  await card('H6').getByRole('button', { name: /^Editar/ }).click(); // edición abierta sin guardar
  await card('H4').locator('button.citation').first().click();
  await shot('revision-decisiones');

  // Emitido
  await card('H6').getByRole('button', { name: 'Cancelar edición' }).click();
  for (const id of ['H6', 'H7', 'H8']) await card(id).getByRole('button', { name: /^Aceptar/ }).click();
  await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
  await page.getByRole('heading', { name: 'Emitido' }).waitFor();
  await shot('revision-emitido');
});
