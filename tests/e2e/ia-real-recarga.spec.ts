// AG-030 (RECORTABLE): tras recargar, los archivos del servicio reaparecen y se puede volver a ejecutar el agente. T078, SC-A7.
import { expect, test } from '@playwright/test';
import { abrir, elegirIAReal, entrarConsultor, generarDiagnosticoReal, ruta, subir, vaciarServicio } from './helpers/real';

const DOS = ['notas-reunion.txt', 'politica-datos.pdf'];
test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
});

test.describe('recarga de la página con el modo IA real', () => {
  test('con el servicio en ejecución, los archivos vuelven a verse y se ejecuta el agente SIN volver a cargarlos', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta(DOS));
    await page.reload();
    for (const n of DOS) await expect(page.getByTestId(`server-file-${n}`)).toContainText('Texto extraído');
    await expect(page.getByTestId('server-file-notas-reunion.txt')).toContainText('text/plain');
    await expect(page.getByTestId('server-files-missing')).toHaveCount(0);
    await abrir(page, 'P-A', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('finding-R1')).toBeVisible({ timeout: 30_000 });
  });

  test('con el servicio reiniciado, avisa qué archivos hay que volver a cargar y los hallazgos siguen visibles', async ({ page, request }) => {
    await generarDiagnosticoReal(page, DOS);
    await vaciarServicio(request, 'P-A'); // es lo que ve la página tras reiniciar el servicio: ya no hay nada en memoria
    await page.reload();
    await expect(page.getByTestId('finding-R1')).toBeVisible(); // hallazgos y extractos conservados en el navegador
    await abrir(page, 'P-A', 'evidencia');
    const aviso = page.getByTestId('server-files-missing');
    await expect(aviso).toContainText('notas-reunion.txt');
    await expect(aviso).toContainText('politica-datos.pdf');
    await expect(aviso).toContainText('Vuelve a cargarlos');
  });

  test('recargar con el servicio detenido no pierde los hallazgos', async ({ page }) => {
    await generarDiagnosticoReal(page, DOS);
    await page.route('**/api/**', (r) => r.abort());
    await page.reload();
    await expect(page.getByTestId('finding-R1')).toBeVisible();
    await expect(page.getByTestId('active-mode')).toHaveText('IA real');
    await expect(page.getByTestId('real-unavailable')).toBeVisible();
  });

  test('«Quitar archivos del servicio» vacía la memoria del servicio y la lista', async ({ page, request }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta(DOS));
    await expect(page.getByTestId('server-file-notas-reunion.txt')).toBeVisible();
    await page.getByRole('button', { name: 'Quitar archivos del servicio' }).click();
    await expect(page.getByText('El servicio no tiene archivos de este proyecto.')).toBeVisible();
    const r = await request.get('http://127.0.0.1:8787/api/evidence/P-A');
    expect((await r.json()).files).toEqual([]);
  });

  test('«Restablecer demo» avisa que el servicio conserva los archivos hasta cerrarse', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta(DOS));
    await page.getByRole('button', { name: 'Restablecer demo' }).click();
    await expect(page.getByTestId('reset-real-note')).toContainText('siguen en la memoria del servicio local hasta que lo cierres');
  });
});
