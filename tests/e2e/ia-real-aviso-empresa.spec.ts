// El nombre del proyecto es contexto: antes de generar, el Consultor confirma que los documentos son de esa empresa.
import { expect, test } from '@playwright/test';
import { abrir, elegirIAReal, entrarConsultor, ruta, subir, vaciarServicio } from './helpers/real';

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test.describe('aviso de pertenencia antes de generar (modo IA real)', () => {
  test('antes de generar, el aviso nombra a la empresa y pide confirmar', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta(['notas-reunion.txt']));
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.getByTestId('real-company-notice')).toHaveText('Se analizarán los documentos como si fueran de Empresa Ficticia Alfa. Confirma que corresponden a esta empresa.');
    await expect(page.getByRole('button', { name: 'Generar diagnóstico' })).toBeVisible(); // sin pantallas ni pasos nuevos
  });

  test('en modo Simulado no aparece', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.getByRole('button', { name: 'Generar diagnóstico' })).toBeVisible();
    await expect(page.getByTestId('real-company-notice')).toHaveCount(0);
  });
});
