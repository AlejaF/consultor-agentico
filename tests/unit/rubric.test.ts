import { describe, expect, it } from 'vitest';
import { PROGRAM_GOAL, RUBRIC_CRITERIA, RUBRIC_TITLE } from '../../src/data/rubric';
import { average, gradingBlockReason, isGradingComplete } from '../../src/domain/rubric';
import { formatScore } from '../../src/domain/format';

const ids = RUBRIC_CRITERIA.map((c) => c.id);
const levels = (n: number[]) => Object.fromEntries(ids.map((id, i) => [id, n[i]]));

describe('rúbrica de ejemplo (FR-030)', () => {
  it('4 criterios, meta ilustrativa 4,2 y rótulo exigido', () => {
    expect(RUBRIC_CRITERIA).toHaveLength(4);
    expect(PROGRAM_GOAL).toBe(4.2);
    expect(RUBRIC_TITLE).toBe('Criterios de ejemplo (pendientes de definir por el profesor)');
  });
});

describe('average / formatScore (SC-013)', () => {
  it('media aritmética exacta de los 4 niveles', () => {
    expect(average(levels([5, 4, 4, 4]))).toBe(4.25);
    expect(average(levels([5, 5, 5, 5]))).toBe(5);
    expect(average(levels([1, 1, 1, 1]))).toBe(1);
    expect(average(levels([3, 4, 4, 4]))).toBe(3.75);
  });
  it('formato de un decimal con coma', () => {
    expect(formatScore(4.25)).toBe('4,3');
    expect(formatScore(4)).toBe('4,0');
    expect(formatScore(1)).toBe('1,0');
    expect(formatScore(5)).toBe('5,0');
    expect(formatScore(3.75)).toBe('3,8');
  });
});

describe('validación de la calificación', () => {
  it('completa: 4 niveles enteros 1–5 y comentario no vacío', () => {
    expect(isGradingComplete(levels([4, 4, 4, 4]), 'Bien')).toBe(true);
    expect(gradingBlockReason(levels([4, 4, 4, 4]), 'Bien')).toBeNull();
  });
  it('explica lo que falta', () => {
    expect(gradingBlockReason({}, '')).toMatch(/4 criterios/);
    expect(gradingBlockReason({ [ids[0]]: 4 } as never, 'x')).toMatch(/3 criterios/);
    expect(gradingBlockReason(levels([4, 4, 4, 4]), '   ')).toMatch(/comentario/);
  });
  it('rechaza niveles fuera de 1–5 o no enteros', () => {
    expect(isGradingComplete(levels([0, 4, 4, 4]), 'x')).toBe(false);
    expect(isGradingComplete(levels([6, 4, 4, 4]), 'x')).toBe(false);
    expect(isGradingComplete(levels([4.5, 4, 4, 4]), 'x')).toBe(false);
  });
  it('la comparación con la meta no tiene efectos', () => {
    expect(average(levels([5, 5, 5, 5])) >= PROGRAM_GOAL).toBe(true);
  });
});
