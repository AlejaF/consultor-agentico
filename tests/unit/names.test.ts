import { describe, expect, it } from 'vitest';
import {
  denylistMode,
  findMatches,
  findPdfFiles,
  normalize,
  parseDenylist,
  referenciasTracked,
} from '../../scripts/lib/names.mjs';

describe('normalize', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalize('ÁRBOL Ñandú Corazón')).toBe('arbol nandu corazon');
  });
});

describe('parseDenylist', () => {
  it('ignora líneas vacías, solo espacios y comentarios', () => {
    const text = '# comentario\n\n   \nAcme Real\n  # otro\nÓrbita Verde  \n';
    expect(parseDenylist(text)).toEqual(['acme real', 'orbita verde']);
  });
});

describe('findMatches', () => {
  const terms = parseDenylist('Acme Real\nÓrbita');
  it('detecta sin distinguir mayúsculas ni tildes, con número de línea', () => {
    const text = 'uno\ndos ACME REAL aquí\ntres\norbita';
    expect(findMatches(text, terms)).toEqual([
      { term: 'acme real', line: 2 },
      { term: 'orbita', line: 4 },
    ]);
  });
  it('sin coincidencias devuelve vacío', () => {
    expect(findMatches('Empresa Ficticia Alfa', terms)).toEqual([]);
  });
});

describe('denylistMode (con y sin lista)', () => {
  it('con lista: revisa', () => {
    expect(denylistMode({ hasList: true, isCI: false })).toBe('check');
    expect(denylistMode({ hasList: true, isCI: true })).toBe('check');
  });
  it('sin lista en local: falla con instrucciones', () => {
    expect(denylistMode({ hasList: false, isCI: false })).toBe('fail');
  });
  it('sin lista en CI: avisa y omite solo esa comprobación', () => {
    expect(denylistMode({ hasList: false, isCI: true })).toBe('skip');
  });
});

describe('referencias y PDF', () => {
  it('referencias/ versionada falla', () => {
    expect(referenciasTracked('referencias/a.pdf\n')).toBe(true);
    expect(referenciasTracked('')).toBe(false);
    expect(referenciasTracked('  \n')).toBe(false);
  });
  it('detecta PDF en dist sin distinguir mayúsculas', () => {
    expect(findPdfFiles(['dist/a.js', 'dist/b.PDF', 'dist/c.pdf'])).toEqual(['dist/b.PDF', 'dist/c.pdf']);
  });
});
