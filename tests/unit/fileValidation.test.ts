import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, MAX_SIZE_BYTES, validateFiles } from '../../src/domain/fileValidation';

const f = (name: string, size = 1000, type = '') => ({ name, type, size });

describe('validateFiles', () => {
  it('acepta pdf, docx, txt, vtt y srt sin distinguir mayúsculas', () => {
    const files = ['a.pdf', 'b.DOCX', 'c.Txt', 'd.vtt', 'e.SRT'].map((n) => f(n));
    const r = validateFiles(files, []);
    expect(r.accepted).toHaveLength(5);
    expect(r.rejected).toEqual([]);
  });

  it('rechaza formatos no permitidos con motivo y lista de formatos', () => {
    const r = validateFiles([f('programa.exe'), f('sin-extension'), f('foto.png')], []);
    expect(r.accepted).toEqual([]);
    expect(r.rejected).toHaveLength(3);
    for (const x of r.rejected) {
      expect(x.reason).toMatch(/formato no permitido/i);
      expect(x.reason).toMatch(/PDF, DOCX, TXT, VTT y SRT/);
    }
  });

  it('rechaza archivos vacíos', () => {
    const r = validateFiles([f('vacio.txt', 0)], []);
    expect(r.rejected).toEqual([{ name: 'vacio.txt', reason: expect.stringMatching(/vac[ií]o/i) }]);
  });

  it('el tamaño máximo es 26 214 400 bytes (inclusive)', () => {
    expect(MAX_SIZE_BYTES).toBe(26_214_400);
    expect(validateFiles([f('a.pdf', MAX_SIZE_BYTES)], []).accepted).toHaveLength(1);
    const r = validateFiles([f('b.pdf', MAX_SIZE_BYTES + 1)], []);
    expect(r.rejected[0].reason).toMatch(/25 MB/);
  });

  it('el nombre admite hasta 150 caracteres', () => {
    expect(MAX_NAME_LENGTH).toBe(150);
    const ok = 'a'.repeat(146) + '.pdf'; // 150
    const long = 'a'.repeat(147) + '.pdf'; // 151
    expect(validateFiles([f(ok)], []).accepted).toHaveLength(1);
    expect(validateFiles([f(long)], []).rejected[0].reason).toMatch(/150 caracteres/);
  });

  it('rechaza un nombre repetido en el proyecto, sin distinguir mayúsculas', () => {
    const r = validateFiles([f('Informe.pdf')], [{ name: 'informe.PDF' }]);
    expect(r.rejected[0].reason).toMatch(/mismo nombre/i);
  });

  it('rechaza un nombre repetido dentro de la misma selección (queda el primero)', () => {
    const r = validateFiles([f('a.pdf'), f('a.pdf')], []);
    expect(r.accepted).toHaveLength(1);
    expect(r.rejected).toHaveLength(1);
  });

  it('en una selección mixta acepta los válidos y rechaza los demás', () => {
    const r = validateFiles([f('ok.pdf'), f('mal.exe'), f('vacio.txt', 0), f('ok2.vtt')], []);
    expect(r.accepted.map((x) => x.name)).toEqual(['ok.pdf', 'ok2.vtt']);
    expect(r.rejected.map((x) => x.name)).toEqual(['mal.exe', 'vacio.txt']);
  });

  it('devuelve solo nombre, tipo y tamaño', () => {
    const input = { name: 'a.pdf', type: 'application/pdf', size: 10, content: 'x' } as never;
    const r = validateFiles([input], []);
    expect(Object.keys(r.accepted[0]).sort()).toEqual(['name', 'size', 'type']);
  });
});
