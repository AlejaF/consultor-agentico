import { describe, expect, it } from 'vitest';
import { countOf, fileTypeLabel, formatDecimal, formatSize, plural } from '../../src/domain/format';

describe('formatSize', () => {
  it('bytes, KB y MB con coma decimal', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1536)).toBe('1,5 KB');
    expect(formatSize(1048576)).toBe('1,0 MB');
    expect(formatSize(26_214_400)).toBe('25,0 MB');
  });
});

describe('plural y countOf', () => {
  it('singular solo con 1', () => {
    expect(plural(1, 'archivo', 'archivos')).toBe('archivo');
    expect(plural(0, 'archivo', 'archivos')).toBe('archivos');
    expect(plural(2, 'archivo', 'archivos')).toBe('archivos');
  });
  it('countOf antepone la cantidad', () => {
    expect(countOf(1, 'archivo', 'archivos')).toBe('1 archivo');
    expect(countOf(4, 'proyecto', 'proyectos')).toBe('4 proyectos');
    expect(countOf(0, 'archivo', 'archivos')).toBe('0 archivos');
  });
  it('sirve para concordar el verbo', () => {
    expect(`Se ${plural(1, 'agregó', 'agregaron')} ${countOf(1, 'archivo', 'archivos')}`).toBe('Se agregó 1 archivo');
    expect(`No se ${plural(2, 'agregó', 'agregaron')} ${countOf(2, 'archivo', 'archivos')}`).toBe('No se agregaron 2 archivos');
  });
});

describe('fileTypeLabel', () => {
  it('muestra la extensión en mayúsculas, no el tipo técnico', () => {
    expect(fileTypeLabel('informe.pdf')).toBe('PDF');
    expect(fileTypeLabel('acta.DOCX')).toBe('DOCX');
    expect(fileTypeLabel('sub.vtt')).toBe('VTT');
  });
  it('sin extensión: «Archivo»', () => {
    expect(fileTypeLabel('sinextension')).toBe('Archivo');
  });
});

describe('formatDecimal', () => {
  it('un decimal con coma', () => {
    expect(formatDecimal(2.4)).toBe('2,4');
    expect(formatDecimal(3)).toBe('3,0');
    expect(formatDecimal(4.25)).toBe('4,3');
  });
});
