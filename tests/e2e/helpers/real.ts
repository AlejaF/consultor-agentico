import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const FIXTURES = 'tests/fixtures';
export const SERVICE = 'http://127.0.0.1:8787';
/** Los 6 formatos permitidos, sanos. */
export const SEIS_FORMATOS = ['notas-reunion.txt', 'politica-datos.pdf', 'informe-direccion.docx', 'indicadores.xlsx', 'entrevista-direccion.vtt', 'entrevista-operaciones.srt'];
export const HOSTILES = ['escaneado.pdf', 'cifrado.pdf', 'danado.pdf'];
export const ruta = (names: string[]) => names.map((n) => `${FIXTURES}/${n}`);

/** Vacía la memoria del servicio para el proyecto (cada prueba parte de cero). */
export async function vaciarServicio(request: APIRequestContext, projectId: string) {
  const r = await request.get(`${SERVICE}/api/evidence/${projectId}`);
  const { files } = (await r.json()) as { files: { id: string }[] };
  for (const f of files) await request.delete(`${SERVICE}/api/evidence/${projectId}/${f.id}`);
}

export async function entrarConsultor(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
}

export async function abrir(page: Page, projectId: string, paso: 'evidencia' | 'diagnostico' | 'revision' | 'informe' | 'estrategia') {
  await page.evaluate(([id, p]) => (window.location.hash = `#/consultor/proyectos/${id}/${p}`), [projectId, paso]);
}

export async function elegirIAReal(page: Page) {
  const boton = page.getByRole('button', { name: 'IA real', exact: true });
  await expect(page.getByTestId('real-unavailable')).toHaveCount(0, { timeout: 15_000 });
  await boton.click();
  await expect(page.getByTestId('active-mode')).toHaveText('IA real');
}

/** Sube archivos con el selector de archivos del navegador y espera el resultado de la extracción. */
export async function subir(page: Page, archivos: string[]) {
  await page.locator('input[type=file]').setInputFiles(archivos);
  await expect(page.getByTestId('real-upload-result').locator('li')).toHaveCount(archivos.length, { timeout: 30_000 });
}

/** Recorrido común: IA real → subir archivos → generar el diagnóstico con el guion de «Empresa Ficticia Alfa» (P-A). */
export async function generarDiagnosticoReal(page: Page, archivos: string[] = [...SEIS_FORMATOS, ...HOSTILES]) {
  await entrarConsultor(page);
  await abrir(page, 'P-A', 'evidencia');
  await elegirIAReal(page);
  await subir(page, ruta(archivos));
  await abrir(page, 'P-A', 'diagnostico');
  await page.getByRole('button', { name: 'Generar diagnóstico' }).click();
  await expect(page.getByTestId('finding-R1')).toBeVisible({ timeout: 30_000 });
}
