import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalScroll } from './helpers/axe';
import { EXE_NO_PERMITIDO, MP3_NO_PERMITIDO, PDF_VALIDO, TXT_VALIDO, VACIO, XLSX_VALIDO } from './fixtures/archivos';

async function openEvidence(page: Page, projectId: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
  await page.evaluate((id) => (window.location.hash = `#/consultor/proyectos/${id}/evidencia`), projectId);
  await expect(page.getByRole('heading', { level: 1, name: 'Captura de evidencia' })).toBeVisible();
}

async function expectTargetsAtLeast44(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, select, input:not([hidden]), a[href]')]
      .filter((el) => !el.classList.contains('skip-link') && el.offsetParent !== null)
      .map((el) => ({ el: (el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 30), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height < 44 || r.width < 44)
      .map(({ el, r }) => `${el} ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small, 'controles menores de 44 px').toEqual([]);
}

test.describe('Proyectos', () => {
  test('lista los 4 proyectos con etapa, estado y avance; sin violaciones', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4);
    await expect(page.getByRole('progressbar')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Empresa Ficticia Delta' })).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    await expectTargetsAtLeast44(page);
  });

  test('la tarjeta lleva a la captura de evidencia del proyecto', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar como Consultor' }).click();
    await page.getByRole('link', { name: 'Captura de evidencia de Empresa Ficticia Alfa' }).click();
    await expect(page).toHaveURL(/#\/consultor\/proyectos\/P-A\/evidencia$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Captura de evidencia' })).toBeFocused();
  });
});

test.describe('Captura de evidencia', () => {
  test('aviso de privacidad permanente y evidencia de ejemplo rotulada', async ({ page }) => {
    await openEvidence(page, 'P-A');
    await expect(page.getByTestId('privacy-notice')).toHaveText(
      'Tus archivos se quedan en este navegador; no se envían a ningún servidor. En esta demo no se analizan.',
    );
    await expect(page.getByText('Evidencia de ejemplo (ficticia)').first()).toBeVisible();
    await expect(page.getByText('Procesando')).toBeVisible();
  });

  test('selección mixta: se agregan los válidos y se explican los rechazos', async ({ page }) => {
    await openEvidence(page, 'P-A');
    await page.locator('input[type=file]').setInputFiles([PDF_VALIDO, EXE_NO_PERMITIDO, VACIO, TXT_VALIDO]);
    await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();
    await expect(page.getByText('entrevista-ejemplo.txt')).toBeVisible();
    await expect(page.getByText('Cargado localmente · no analizado')).toHaveCount(2);
    const result = page.getByTestId('upload-result');
    await expect(result).toContainText('Se agregaron 2 archivos.')
    await expect(result).toContainText('No se agregaron 2 archivos:');
    await expect(result).toContainText('programa.exe');
    await expect(result).toContainText('Formato no permitido (.exe). Formatos permitidos: PDF, DOCX, TXT, VTT, SRT y XLSX.');
    await expect(result).toContainText('vacio.txt');
    await expect(result).toContainText('El archivo está vacío.');
    await expect(page.getByText('programa.exe', { exact: true }).locator('visible=true')).toHaveCount(1); // solo en el aviso, no en la lista
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    await expectTargetsAtLeast44(page);
  });

  test('plurales y tipo legible: «Se agregó 1 archivo», «No se agregó 1 archivo», «PDF · …»', async ({ page }) => {
    await openEvidence(page, 'P-D');
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await expect(page.getByTestId('upload-result')).toContainText('Se agregó 1 archivo.');
    await expect(page.getByText(/^PDF · \d+ B$/)).toBeVisible();
    await expect(page.getByText('application/pdf')).toHaveCount(0);
    await page.locator('input[type=file]').setInputFiles(EXE_NO_PERMITIDO);
    await expect(page.getByTestId('upload-result')).toContainText('No se agregó 1 archivo:');
  });

  test('XLSX se acepta como documento, «Cargado localmente · no analizado»; el audio sigue fuera', async ({ page }) => {
    await openEvidence(page, 'P-D');
    await page.locator('input[type=file]').setInputFiles([XLSX_VALIDO, MP3_NO_PERMITIDO]);
    const result = page.getByTestId('upload-result');
    await expect(result).toContainText('Se agregó 1 archivo.');
    await expect(result).toContainText('No se agregó 1 archivo:');
    await expect(result).toContainText('entrevista.mp3');
    await expect(result).toContainText('Formato no permitido (.mp3)');
    const docs = page.getByRole('region', { name: 'Documentos' });
    await expect(docs.getByText('indicadores-ejemplo.xlsx')).toBeVisible();
    await expect(docs.getByText(/^XLSX · \d+ B$/)).toBeVisible();
    await expect(docs.getByText('Cargado localmente · no analizado')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Entrevistas y transcripciones' }).getByText('indicadores-ejemplo.xlsx')).toHaveCount(0);
    await expect(page.getByTestId('privacy-notice')).toBeVisible();
    await expect(page.locator('.dropzone').getByText('Formatos permitidos: PDF, DOCX, TXT, VTT, SRT y XLSX.')).toBeVisible();
  });

  test('un nombre repetido se rechaza', async ({ page }) => {
    await openEvidence(page, 'P-A');
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await expect(page.getByTestId('upload-result')).toContainText('Ya hay un archivo con el mismo nombre');
  });

  test('carga completa solo con teclado', async ({ page }) => {
    await openEvidence(page, 'P-A');
    const button = page.getByRole('button', { name: 'Elegir archivos' });
    for (let i = 0; i < 60 && !(await button.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(button).toBeFocused();
    const chooser = page.waitForEvent('filechooser');
    await page.evaluate(() => 0); // asegura que la interceptación del selector ya está activa
    await page.keyboard.press('Enter');
    await (await chooser).setFiles(PDF_VALIDO);
    await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();

    // quitar con teclado: el botón abre la confirmación y Enter la acepta
    const remove = page.getByRole('button', { name: 'Quitar informe-ejemplo.pdf' });
    await remove.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Sí, quitar' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('informe-ejemplo.pdf')).toHaveCount(0);
  });

  test('quitar pide confirmación; cancelar conserva el archivo', async ({ page }) => {
    await openEvidence(page, 'P-D');
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await page.getByRole('button', { name: 'Quitar informe-ejemplo.pdf' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();
    await page.getByRole('button', { name: 'Quitar informe-ejemplo.pdf' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, quitar' }).click();
    await expect(page.getByText('informe-ejemplo.pdf')).toHaveCount(0);
    await expect(page.getByText('Aún no hay entrevistas ni transcripciones.')).toBeVisible();
  });

  test('tras recargar sigue el nombre con «Contenido no conservado en esta demo»; las respuestas también', async ({ page }) => {
    await openEvidence(page, 'P-A');
    await page.getByLabel('¿Qué herramientas usan hoy para gestionar la información?').fill('Hojas de cálculo');
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await expect(page.getByText('Contenido no conservado en esta demo.')).toHaveCount(0); // aún en la misma carga
    await page.reload(); // recarga inmediata: el guardado inmediato (flush) conserva la última acción
    await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();
    await expect(page.getByText('Cargado localmente · no analizado')).toBeVisible();
    await expect(page.getByText('Contenido no conservado en esta demo.')).toBeVisible();
    await expect(page.getByLabel('¿Qué herramientas usan hoy para gestionar la información?')).toHaveValue('Hojas de cálculo');
  });

  test('el progreso de captura refleja preguntas y archivos', async ({ page }) => {
    await openEvidence(page, 'P-D');
    const panel = page.getByRole('region', { name: 'Progreso de captura' });
    await expect(panel).toContainText('Preguntas respondidas: 0 de 5');
    await expect(panel).toContainText('Documentos: 0');
    await page.getByLabel('¿Cuál es el objetivo principal de la transformación?').selectOption('Reducir costos');
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await expect(panel).toContainText('Preguntas respondidas: 1 de 5');
    await expect(panel).toContainText('Documentos: 1');
  });

  test('P-D no tiene evidencia: «Generar diagnóstico» queda bloqueado con motivo y se habilita al cargar', async ({ page }) => {
    await openEvidence(page, 'P-D');
    const generate = page.getByRole('button', { name: 'Generar diagnóstico' });
    await expect(generate).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText('Este proyecto no tiene evidencia.')).toBeVisible();
    await page.getByRole('button', { name: 'Ir a agregar archivos' }).click();
    await expect(page.getByRole('button', { name: 'Elegir archivos' })).toBeFocused();
    await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
    await expect(page.getByRole('link', { name: 'Generar diagnóstico' })).toHaveAttribute('href', '#/consultor/proyectos/P-D/diagnostico');
  });

  test('P-A con evidencia de ejemplo permite generar de inmediato', async ({ page }) => {
    await openEvidence(page, 'P-A');
    await expect(page.getByRole('link', { name: 'Generar diagnóstico' })).toBeVisible();
  });

  test('sin solicitudes de red con los archivos ni a otros orígenes (SC-003)', async ({ page, baseURL }) => {
    const requests: { url: string; method: string; body: string | null }[] = [];
    page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() }));
    await openEvidence(page, 'P-A');
    await page.locator('input[type=file]').setInputFiles([PDF_VALIDO, TXT_VALIDO, EXE_NO_PERMITIDO]);
    await page.getByLabel('¿Qué herramientas usan hoy para gestionar la información?').fill('Texto de prueba');
    await page.reload();
    await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();
    expect(requests.length).toBeGreaterThan(0);
    const origin = new URL(baseURL!).origin;
    expect(requests.filter((r) => new URL(r.url).origin !== origin && !r.url.startsWith('data:'))).toEqual([]);
    expect(requests.filter((r) => r.method !== 'GET' || r.body !== null)).toEqual([]);
  });

  test('axe, sin desplazamiento horizontal y controles ≥ 44 px (vacío y sin evidencia)', async ({ page }) => {
    await openEvidence(page, 'P-D');
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    await expectTargetsAtLeast44(page);
  });

  test('nombre muy largo no rompe el diseño', async ({ page }) => {
    await openEvidence(page, 'P-A');
    const largo = { ...PDF_VALIDO, name: 'a'.repeat(140) + '.pdf' };
    await page.locator('input[type=file]').setInputFiles(largo);
    await expectNoHorizontalScroll(page);
    await page.locator('input[type=file]').setInputFiles({ ...PDF_VALIDO, name: 'b'.repeat(160) + '.pdf' });
    await expect(page.getByTestId('upload-result')).toContainText('150 caracteres');
    await expectNoHorizontalScroll(page);
  });
});

test('F: tarjeta «Datos de la empresa (ficticios)» de solo lectura junto a la carga libre de archivos', async ({ page }) => {
  await openEvidence(page, 'P-A');
  const datos = page.getByRole('region', { name: 'Datos de la empresa (ficticios)' });
  await expect(datos).toBeVisible();
  await expect(datos).toContainText('Empresa Ficticia Alfa');
  await expect(datos).toContainText('alfa.ficticia.example');
  await expect(datos.getByRole('textbox')).toHaveCount(0); // solo lectura
  await expect(page.getByRole('button', { name: 'Elegir archivos' })).toBeVisible(); // la carga libre sigue
  await page.locator('input[type=file]').setInputFiles(PDF_VALIDO);
  await expect(page.getByText('informe-ejemplo.pdf')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('✓ Cargado'); // ninguna marca según el tipo de archivo
  await expectNoAxeViolations(page);
});
