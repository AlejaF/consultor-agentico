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

describe('validación de la calificación (el comentario es opcional)', () => {
  it('completa: los 4 niveles enteros 1–5; el comentario no se exige', () => {
    expect(isGradingComplete(levels([4, 4, 4, 4]))).toBe(true);
    expect(gradingBlockReason(levels([4, 4, 4, 4]))).toBeNull();
  });
  it('explica lo que falta y recuerda que el comentario es opcional', () => {
    expect(gradingBlockReason({})).toBe('Elige un nivel de 1 a 5 en los 4 criterios. El comentario es opcional.');
    expect(gradingBlockReason({ [ids[0]]: 4 } as never)).toMatch(/Faltan 3 criterios por calificar\. El comentario es opcional\./);
    expect(gradingBlockReason({ [ids[0]]: 4, [ids[1]]: 4, [ids[2]]: 4 } as never)).toMatch(/Falta 1 criterio por calificar/);
  });
  it('rechaza niveles fuera de 1–5 o no enteros', () => {
    expect(isGradingComplete(levels([0, 4, 4, 4]))).toBe(false);
    expect(isGradingComplete(levels([6, 4, 4, 4]))).toBe(false);
    expect(isGradingComplete(levels([4.5, 4, 4, 4]))).toBe(false);
  });
  it('la comparación con la meta no tiene efectos', () => {
    expect(average(levels([5, 5, 5, 5])) >= PROGRAM_GOAL).toBe(true);
  });
});
