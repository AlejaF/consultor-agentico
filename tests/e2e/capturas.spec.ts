import { test } from '@playwright/test';

// Genera capturas de evidencia para la revisión humana; solo con EVIDENCIA=1.
const LOTE = process.env.LOTE ?? 'L1';
test.skip(!process.env.EVIDENCIA, 'Solo con EVIDENCIA=1');

const roles = [
  ['consultor', 'Consultor'],
  ['lider', 'Líder'],
  ['contacto', 'Empresa'],
] as const;

test('capturas del ingreso y del inicio de cada rol', async ({ page }, info) => {
  const dir = `docs/evidencia/capturas/${LOTE}`;
  const w = info.project.name;
  await page.goto('/');
  await page.screenshot({ path: `${dir}/ingreso-${w}.png`, fullPage: true });
  for (const [id, label] of roles) {
    // Contexto nuevo por rol: parte siempre del estado inicial.
    const ctx = await page.context().browser()!.newContext({ viewport: page.viewportSize() ?? undefined, baseURL: info.project.use.baseURL });
    const p = await ctx.newPage();
    await p.goto('/');
    await p.getByRole('button', { name: `Entrar como ${label}` }).click();
    await p.waitForURL(new RegExp(`#/${id}$`));
    await p.screenshot({ path: `${dir}/inicio-${id}-${w}.png`, fullPage: true });
    await ctx.close();
  }
});
