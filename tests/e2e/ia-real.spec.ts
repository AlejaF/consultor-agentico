// Recorrido del modo «IA real» con el servicio local en modo FALSO (sin red, sin clave, sin gasto). T077.
import { expect, test, type Page } from '@playwright/test';
import { abrir, elegirIAReal, entrarConsultor, generarDiagnosticoReal, HOSTILES, ruta, SEIS_FORMATOS, subir, vaciarServicio } from './helpers/real';

const MODELO = 'modelo-falso-e2e';
const ROTULO = `Generado por IA (modelo ${MODELO}) · requiere revisión humana`;
const card = (page: Page, id: string) => page.getByTestId(`finding-${id}`);

test.beforeEach(async ({ request }) => {
  await vaciarServicio(request, 'P-A');
  await vaciarServicio(request, 'P-D');
});

test.describe('selector y disponibilidad', () => {
  test('el selector «Simulado / IA real» se ve y el modo activo siempre se indica', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await expect(page.getByRole('button', { name: 'Simulado', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('active-mode')).toHaveText('Simulado');
    await abrir(page, 'P-A', 'diagnostico');
    await expect(page.getByTestId('active-mode')).toHaveText('Simulado');
  });

  test('con el servicio detenido, «IA real» figura no disponible y el modo Simulado funciona', async ({ page }) => {
    await page.route('**/api/health', (r) => r.abort());
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await expect(page.getByTestId('real-unavailable')).toHaveText('IA real no disponible aquí (requiere ejecutar el backend en tu equipo)');
    const real = page.getByRole('button', { name: 'IA real', exact: true });
    await expect(real).toHaveAttribute('aria-disabled', 'true');
    await real.click({ force: true });
    await expect(page.getByTestId('active-mode')).toHaveText('Simulado');
    await expect(page.getByTestId('privacy-notice')).toBeVisible(); // el aviso del modo Simulado no cambia
    await abrir(page, 'P-A', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('finding-H1')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('carga de archivos al servicio', () => {
  test('el aviso previo nombra a OpenAI y es distinto del del modo Simulado', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    const simulado = await page.getByTestId('privacy-notice').innerText();
    await elegirIAReal(page);
    const aviso = page.getByTestId('privacy-notice-real');
    await expect(aviso).toBeVisible();
    await expect(page.getByTestId('privacy-notice')).toHaveCount(0);
    const t = await aviso.innerText();
    expect(t).toContain('OpenAI');
    expect(t).toMatch(/servicio que corre en tu equipo/);
    expect(t).toMatch(/memoria/);
    expect(t).toMatch(/no lo guarda en disco/);
    expect(t).not.toBe(simulado);
  });

  test('los 6 formatos se extraen y los hostiles dan su motivo claro', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta([...SEIS_FORMATOS, ...HOSTILES]));
    for (const n of SEIS_FORMATOS) await expect(page.getByTestId(`upload-${n}`)).toHaveAttribute('data-status', 'extracted');
    await expect(page.getByTestId('upload-escaneado.pdf')).toContainText('no tiene texto seleccionable');
    await expect(page.getByTestId('upload-cifrado.pdf')).toContainText('protegido con contraseña');
    await expect(page.getByTestId('upload-danado.pdf')).toContainText('dañado');
    for (const n of HOSTILES) await expect(page.getByTestId(`upload-${n}`)).toHaveAttribute('data-status', 'failed');
  });
});

test.describe('diagnóstico real', () => {
  test('hallazgos por pilar con «Extracto de tu archivo» y el rótulo de IA; nunca la evidencia de ejemplo', async ({ page }) => {
    await generarDiagnosticoReal(page);
    for (const pilar of ['Datos', 'Infraestructura', 'Gobernanza', 'Talento']) await expect(page.getByRole('heading', { level: 2, name: `Pilar: ${pilar}` })).toBeVisible();
    await expect(page.getByTestId('ai-badge').first()).toHaveText(ROTULO);
    await expect(page.getByText('Simulada', { exact: true })).toHaveCount(0);
    await card(page, 'R1').getByRole('button', { name: /notas-reunion\.txt · línea 4/ }).click();
    await expect(card(page, 'R1')).toContainText('Extracto de tu archivo');
    await expect(card(page, 'R1')).toContainText('Cada área lleva sus propias cifras');
    await expect(page.getByText('Evidencia de ejemplo (ficticia)')).toHaveCount(0);
    await expect(card(page, 'R4')).toContainText('NO VERIFICADO');
    await expect(page.getByTestId('cited-count')).toContainText('de 4 hallazgos con evidencia citada');
    await expect(page.getByText(/Índice de madurez: \d/)).toHaveCount(0);
  });

  test('la «Traza del agente» muestra herramientas, consultas, verificaciones fallidas y su resolución, modelo y tokens', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await page.getByText('Traza del agente', { exact: true }).click();
    const trace = page.getByTestId('trace-view');
    await expect(page.getByTestId('trace-model')).toHaveText(MODELO);
    await expect(page.getByTestId('trace-tokens')).toContainText('entrada 600 · salida 120 · total 720');
    await expect(trace).toContainText('consulta: «indicadores responsable»');
    await expect(trace).toContainText('buscar_en_evidencia ×2');
    await expect(trace.locator('[data-step="verif-fail"]').first()).toContainText('Verificación fallida de «integracion de sistemas pendiente»');
    await expect(trace).toContainText('El agente la corrigió y se verificó.');
    await expect(trace).toContainText('El hallazgo quedó NO VERIFICADO.');
    await expect(page.getByTestId('trace-errors')).toHaveText('ninguno');
    await expect(page.getByTestId('trace-verif-fail')).toHaveText('4'); // 1 de la integración + 3 del hallazgo sin respaldo
  });

  test('el modo queda fijado con diagnóstico generado; «Limpiar diagnóstico» lo permite', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await expect(page.getByTestId('mode-locked')).toContainText('El modo queda fijado');
    await page.getByRole('button', { name: 'Simulado', exact: true }).click({ force: true });
    await expect(page.getByTestId('active-mode')).toHaveText('IA real');
    await page.getByRole('button', { name: 'Limpiar diagnóstico' }).click();
    await page.getByRole('button', { name: 'Sí, limpiar' }).click();
    await expect(page.getByTestId('finding-R1')).toHaveCount(0);
    await page.getByRole('button', { name: 'Simulado', exact: true }).click();
    await expect(page.getByTestId('active-mode')).toHaveText('Simulado');
  });

  test('revisar → emitir → informe, con hallazgos reales; los NO VERIFICADO aceptados no respaldan la estrategia', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await abrir(page, 'P-A', 'revision');
    for (const id of ['R1', 'R2', 'R3']) await card(page, id).getByRole('button', { name: /^Aceptar/ }).click();
    await card(page, 'R4').getByRole('button', { name: /^Aceptar/ }).click();
    await expect(card(page, 'R4')).toContainText('No se usará como respaldo de la estrategia');
    await page.getByRole('button', { name: 'Aprobar y emitir' }).click();
    await page.getByRole('button', { name: 'Sí, aprobar y emitir' }).click();
    await expect(page.getByText('Es de solo lectura.')).toBeVisible();
    await abrir(page, 'P-A', 'informe');
    const informe = page.getByTestId('print-report');
    await expect(informe).toContainText('Extracto de tu archivo');
    await expect(informe).toContainText(ROTULO);
    await expect(informe).not.toContainText('Evidencia de ejemplo (ficticia)');
    await expect(informe).toContainText('Sin índice de madurez');
    await expect(informe).toContainText('Estrategia aún no disponible');
    await abrir(page, 'P-A', 'estrategia');
    await expect(page.getByTestId('strategy-real-pending')).toBeVisible();
  });

  test('recargar la página conserva los hallazgos y el modo', async ({ page }) => {
    await generarDiagnosticoReal(page);
    await page.reload();
    await expect(page.getByTestId('finding-R1')).toBeVisible();
    await expect(page.getByTestId('active-mode')).toHaveText('IA real');
    await page.getByText('Traza del agente', { exact: true }).click();
    await expect(page.getByTestId('trace-model')).toHaveText(MODELO);
  });

  test('un error del proveedor (saldo agotado) se muestra por su categoría, sin reintento automático', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-D', 'evidencia');
    await elegirIAReal(page);
    await subir(page, ruta(['notas-reunion.txt']));
    await abrir(page, 'P-D', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    const err = page.getByTestId('real-error');
    await expect(err).toContainText('Se agotó el saldo prepago', { timeout: 30_000 });
    await expect(err).toHaveAttribute('data-category', 'balance');
    await expect(err.getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
    await page.waitForTimeout(1500); // sin reintentos: el mensaje sigue ahí y no aparece ningún diagnóstico
    await expect(err).toBeVisible();
    await expect(page.getByTestId('finding-R1')).toHaveCount(0);
  });
});

test.describe('el modo Simulado no cambia', () => {
  test('sin elegir IA real, generar el diagnóstico sigue dando la plantilla de la 001', async ({ page }) => {
    await entrarConsultor(page);
    await abrir(page, 'P-A', 'diagnostico');
    await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
    await expect(page.getByTestId('finding-H1')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('ai-badge')).toHaveCount(0);
    await expect(page.getByText('Simulada', { exact: true }).first()).toBeVisible();
  });
});
