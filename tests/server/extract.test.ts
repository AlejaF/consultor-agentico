import { describe, expect, it } from 'vitest';
import { buildFixtures, makePdf, makeXlsx } from '../../scripts/lib/fixtures.mjs';
import { formatLocation } from '../../server/src/chunk.ts';
import { extractFile } from '../../server/src/extract/index.ts';

const F: Record<string, Buffer> = buildFixtures();
const run = (name: string, opts = {}) => extractFile({ name, bytes: F[name] }, opts);

describe('extractFile: formatos permitidos', () => {
  it('PDF: un fragmento por página, con tildes y ñ intactas', async () => {
    const r = await run('politica-datos.pdf');
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    expect(r.chunks.map((c) => c.location)).toEqual([
      { kind: 'page', page: 1 },
      { kind: 'page', page: 2 },
    ]);
    expect(r.chunks[0].text).toContain('tres sistemas');
    expect(r.chunks[1].text).toContain('único');
    expect(r.chars).toBe(r.chunks.reduce((n, c) => n + c.text.length, 0));
  });

  it('DOCX: un fragmento por párrafo no vacío, numerado desde 1', async () => {
    const r = await run('informe-direccion.docx');
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    expect(r.chunks[0].location).toEqual({ kind: 'paragraph', n: 1 });
    expect(r.chunks.map((c) => (c.location as { n: number }).n)).toEqual(r.chunks.map((_, i) => i + 1));
    expect(r.chunks.some((c) => c.text.includes('tres personas'))).toBe(true);
    expect(r.chunks.every((c) => c.text.trim().length > 0)).toBe(true);
  });

  it('XLSX: un fragmento por fila con hoja y número de fila; salta las filas vacías', async () => {
    const r = await run('indicadores.xlsx');
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    const first = r.chunks[0];
    expect(first.location).toEqual({ kind: 'sheet', sheet: 'Ventas', row: 1 });
    expect(first.text).toBe('Mes | Ventas | Clientes nuevos');
    expect(r.chunks.some((c) => (c.location as { sheet: string }).sheet === 'Sistemas')).toBe(true);
    const hueco = await extractFile({ name: 'h.xlsx', bytes: makeXlsx({ H: [['a', 'b'], ['', ''], ['x', 'y']] }) }, {});
    expect(hueco.status).toBe('extracted');
    if (hueco.status === 'extracted') expect(hueco.chunks.map((c) => c.location)).toEqual([
      { kind: 'sheet', sheet: 'H', row: 1 },
      { kind: 'sheet', sheet: 'H', row: 3 },
    ]);
  });

  it('TXT: un fragmento por línea no vacía con su número de línea real', async () => {
    const r = await run('notas-reunion.txt');
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    expect(r.chunks[0].location).toEqual({ kind: 'line', n: 1 });
    const lines = F['notas-reunion.txt'].toString('utf8').split(/\r?\n/);
    for (const c of r.chunks) expect(c.text).toBe(lines[(c.location as { n: number }).n - 1].trim());
  });

  it('VTT: un fragmento por bloque, con el minuto «mm:ss» de inicio', async () => {
    const r = await run('entrevista-direccion.vtt');
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    expect(r.chunks[0].location).toEqual({ kind: 'time', start: '00:05' });
    expect(r.chunks.some((c) => (c.location as { start: string }).start === '03:10')).toBe(true);
    expect(r.chunks.every((c) => !c.text.includes('-->'))).toBe(true);
    expect(r.chunks.every((c) => !c.text.startsWith('WEBVTT'))).toBe(true);
  });

  it('SRT: igual que VTT (la coma de milésimas y el número de bloque no entran al texto)', async () => {
    const r = await run('entrevista-operaciones.srt');
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    expect(r.chunks[0].location).toEqual({ kind: 'time', start: '00:12' });
    expect(r.chunks.every((c) => !/^\d+$/.test(c.text) && !c.text.includes('-->'))).toBe(true);
  });

  it('formatLocation muestra cada tipo de ubicación en español', () => {
    expect(formatLocation({ kind: 'page', page: 3 })).toBe('pág. 3');
    expect(formatLocation({ kind: 'paragraph', n: 12 })).toBe('párrafo 12');
    expect(formatLocation({ kind: 'sheet', sheet: 'Ventas', row: 7 })).toBe('hoja “Ventas”, fila 7');
    expect(formatLocation({ kind: 'line', n: 45 })).toBe('línea 45');
    expect(formatLocation({ kind: 'time', start: '03:10' })).toBe('minuto 03:10');
  });
});

describe('extractFile: motivos claros cuando no se puede (AG-007)', () => {
  const fail = async (name: string) => {
    const r = await run(name);
    expect(r.status).toBe('failed');
    return r.status === 'failed' ? r : (undefined as never);
  };

  it('PDF escaneado sin texto', async () => {
    const r = await fail('escaneado.pdf');
    expect(r.reason).toBe('pdf_sin_texto');
    expect(r.message).toBe('Este PDF no tiene texto seleccionable (parece escaneado). Esta versión no usa OCR.');
  });
  it('PDF cifrado', async () => expect((await fail('cifrado.pdf')).reason).toBe('cifrado'));
  it('DOCX cifrado (contenedor OLE) se detecta antes de abrirlo', async () => expect((await fail('cifrado.docx')).reason).toBe('cifrado'));
  it('PDF dañado', async () => expect((await fail('danado.pdf')).reason).toBe('danado'));
  it('XLSX dañado', async () => expect((await fail('danado.xlsx')).reason).toBe('danado'));
  it('cada motivo trae un mensaje en español para la persona', async () => {
    for (const n of ['cifrado.pdf', 'cifrado.docx', 'danado.pdf', 'danado.xlsx']) {
      const r = await fail(n);
      expect(r.message.length).toBeGreaterThan(15);
      expect(r.message).not.toMatch(/Exception|Error:|stack/i);
    }
  });
  it('un formato que no se permite (p. ej. audio) no se procesa', async () => {
    const r = await extractFile({ name: 'voz.mp3', bytes: Buffer.from('x') }, {});
    expect(r).toMatchObject({ status: 'failed', reason: 'formato_no_permitido' });
  });
  it('un archivo vacío falla con motivo claro', async () => {
    const r = await extractFile({ name: 'vacio.txt', bytes: Buffer.alloc(0) }, {});
    expect(r.status).toBe('failed');
  });
  it('nunca lanza: una extracción que se rompe se informa como dañado', async () => {
    const r = await extractFile({ name: 'x.pdf', bytes: Buffer.from('%PDF-1.4 basura') }, {});
    expect(r.status).toBe('failed');
  });
});

describe('extractFile: topes', () => {
  it('XLSX por encima del tope de filas: extracción parcial con aviso', async () => {
    const rows = Array.from({ length: 30 }, (_, i) => [`fila ${i + 1}`, i + 1]);
    const r = await extractFile({ name: 'grande.xlsx', bytes: makeXlsx({ Datos: rows }) }, { maxXlsxRows: 10 });
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    expect(r.warning).toBe('tope_filas_alcanzado');
    expect(r.chunks).toHaveLength(10);
    expect(formatLocation(r.chunks.at(-1)!.location)).toBe('hoja “Datos”, fila 10');
  });

  it('PDF por encima del tope de páginas: parcial con aviso', async () => {
    const pdf = makePdf(Array.from({ length: 5 }, (_, i) => `Página número ${i + 1} de prueba con texto suficiente.`));
    const r = await extractFile({ name: 'largo.pdf', bytes: pdf }, { maxPdfPages: 3 });
    expect(r.status).toBe('extracted');
    if (r.status !== 'extracted') return;
    expect(r.warning).toBe('tope_paginas_alcanzado');
    expect(r.chunks).toHaveLength(3);
  });

  it('tiempo máximo por archivo: se corta con motivo «tiempo_agotado»', async () => {
    const lento = { pdf: () => new Promise<never>((resolve) => setTimeout(resolve, 200)) } as never;
    const r = await extractFile({ name: 'x.pdf', bytes: Buffer.from('%PDF-1.4') }, { timeoutMs: 20, extractors: lento });
    expect(r).toMatchObject({ status: 'failed', reason: 'tiempo_agotado' });
  });
});
