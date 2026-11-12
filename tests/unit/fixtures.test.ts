import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildFixtures, FIXTURE_NAMES } from '../../scripts/lib/fixtures.mjs';

const DIR = join(__dirname, '..', 'fixtures');
const fixtures: Record<string, Buffer> = buildFixtures();

describe('buildFixtures (archivos de ejemplo ficticios de «Empresa Ficticia Alfa»)', () => {
  it('genera un archivo por formato y los de prueba hostiles', () => {
    expect(Object.keys(fixtures).sort()).toEqual([...FIXTURE_NAMES].sort());
    for (const n of [
      'politica-datos.pdf',
      'informe-direccion.docx',
      'indicadores.xlsx',
      'notas-reunion.txt',
      'entrevista-direccion.vtt',
      'entrevista-operaciones.srt',
      'escaneado.pdf',
      'cifrado.pdf',
      'cifrado.docx',
      'danado.pdf',
      'danado.xlsx',
      'con-instruccion.txt',
    ]) {
      expect(fixtures[n], n).toBeDefined();
      expect(fixtures[n].length, n).toBeGreaterThan(0);
    }
  });

  it('cada formato tiene la firma que le corresponde', () => {
    expect(fixtures['politica-datos.pdf'].subarray(0, 5).toString()).toBe('%PDF-');
    expect(fixtures['informe-direccion.docx'].subarray(0, 2).toString()).toBe('PK');
    expect(fixtures['indicadores.xlsx'].subarray(0, 2).toString()).toBe('PK');
    expect(fixtures['cifrado.docx'].subarray(0, 8).toString('hex')).toBe('d0cf11e0a1b11ae1'); // contenedor OLE (Office cifrado)
    expect(fixtures['danado.pdf'].subarray(0, 5).toString()).not.toBe('%PDF-');
  });

  it('el contenido es ficticio y lo dice («Empresa Ficticia Alfa», «ejemplo ficticio»)', () => {
    for (const n of ['notas-reunion.txt', 'entrevista-direccion.vtt', 'entrevista-operaciones.srt', 'con-instruccion.txt']) {
      const t = fixtures[n].toString('utf8');
      expect(t, n).toContain('Empresa Ficticia Alfa');
      expect(t.toLowerCase(), n).toContain('ficticio');
    }
    expect(fixtures['politica-datos.pdf'].toString('latin1')).toContain('Empresa Ficticia Alfa');
  });

  it('el archivo con instrucción dirigida a la IA la contiene (para probar que se ignora)', () => {
    expect(fixtures['con-instruccion.txt'].toString('utf8').toLowerCase()).toContain('ignora');
  });

  it('es determinista: dos corridas dan los mismos bytes', () => {
    const again: Record<string, Buffer> = buildFixtures();
    for (const n of FIXTURE_NAMES) expect(again[n].equals(fixtures[n]), n).toBe(true);
  });
});

describe('tests/fixtures coincide con el generador', () => {
  it('los archivos guardados son los que genera scripts/make-fixtures.mjs (ejecutarlo si falla)', () => {
    for (const n of FIXTURE_NAMES) {
      const p = join(DIR, n);
      expect(existsSync(p), `falta ${n}: ejecuta «node scripts/make-fixtures.mjs»`).toBe(true);
      expect(readFileSync(p).equals(fixtures[n]), n).toBe(true);
    }
  });
});
