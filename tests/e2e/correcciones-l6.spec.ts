import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll } from './helpers/axe';

async function goto(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
}

test.describe('Corrección A: niveles de la rúbrica en una sola fila', () => {
  test('los 5 niveles de cada criterio comparten fila y miden ≥ 44 px (desde 320 px)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Líder' }).click();
    await goto(page, '#/lider/entregas/dx/E-2');
    await expect(page.getByRole('radiogroup')).toHaveCount(4);
    const groups = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[role=radiogroup]')].map((g) => {
        const labels = [...g.querySelectorAll<HTMLElement>('label.level')].map((l) => l.getBoundingClientRect());
        const box = g.getBoundingClientRect();
        return {
          n: labels.length,
          filas: new Set(labels.map((r) => Math.round(r.top))).size,
          minW: Math.min(...labels.map((r) => r.width)),
          minH: Math.min(...labels.map((r) => r.height)),
          dentro: labels.every((r) => r.right <= box.right + 0.5 && r.left >= box.left - 0.5),
        };
      }),
    );
    for (const g of groups) {
      expect(g.n).toBe(5);
      expect(g.filas, 'filas de niveles').toBe(1);
      expect(g.minW).toBeGreaterThanOrEqual(44);
      expect(g.minH).toBeGreaterThanOrEqual(44);
      expect(g.dentro).toBe(true);
    }
    await expectNoHorizontalScroll(page);
  });
});

test.describe('Corrección B (revisada en L6c): cabecera de como máximo 3 filas', () => {
  for (const role of ['Consultor', 'Líder', 'Contacto'] as const) {
    test(`${role}: ≤ 3 filas y «Rol activo» visible`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: `Entrar como ${role}` }).click();
      const header = page.locator('header.topbar');
      await expect(header.getByText('Rol activo')).toBeVisible();
      const info = await header.evaluate((h) => {
        const kids = [...h.children].filter((c) => (c as HTMLElement).offsetParent !== null || getComputedStyle(c).position === 'fixed');
        // una fila = elementos cuyos rectángulos verticales se solapan (alineados al centro, sus «top» pueden diferir)
        const rects = kids.map((c) => c.getBoundingClientRect()).sort((a, b) => a.top - b.top);
        let filas = 0;
        let hasta = -Infinity;
        for (const r of rects) {
          if (r.top >= hasta - 1) filas++;
          hasta = Math.max(hasta, r.bottom);
        }
        const label = h.querySelector('label')!;
        const cs = getComputedStyle(label);
        return { filas, visible: cs.display !== 'none' && cs.visibility !== 'hidden', altoLabel: label.getBoundingClientRect().height };
      });
      expect(info.filas).toBeLessThanOrEqual(3);
      expect(info.visible).toBe(true);
      expect(info.altoLabel).toBeGreaterThan(0);
      await expectNoHorizontalScroll(page);
    });
  }
});
